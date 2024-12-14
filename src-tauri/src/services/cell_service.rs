use std::sync::Arc;

use crate::entities::cell::{self, CellType};

use async_trait::async_trait;
use prelude::Expr;
use sea_orm::{entity::*, query::*, DbConn};

use super::repetition_service::RepetitionService;

#[async_trait]
pub trait CellService {
    async fn get_file_cells_ordered_by_index(
        &self,
        file_id: i32,
    ) -> Result<Vec<cell::Model>, String>;
    async fn create_cell(
        &self,
        file_id: i32,
        content: String,
        cell_type: CellType,
        index: i32,
    ) -> Result<i32, String>;
    async fn delete_cell(&self, cell_id: i32) -> Result<(), String>;
    async fn move_cell(&self, cell_id: i32, new_index: i32) -> Result<(), String>;
    async fn update_cell_content(&self, cell_id: i32, content: String) -> Result<(), String>;
    async fn get_cells_for_files(&self, file_ids: Vec<i32>) -> Result<Vec<cell::Model>, String>;
}

pub struct DefaultCellService {
    db_conn: Arc<DbConn>,
    repetition_service: Arc<dyn RepetitionService + Sync + Send>,
}

impl DefaultCellService {
    pub fn new(
        db_conn: Arc<DbConn>,
        repetition_service: Arc<dyn RepetitionService + Sync + Send>,
    ) -> Self {
        Self {
            db_conn,
            repetition_service,
        }
    }

    async fn get_cell_by_id(&self, cell_id: i32) -> Result<cell::Model, String> {
        let result = cell::Entity::find_by_id(cell_id).one(&*self.db_conn).await;
        match result {
            Ok(cell) => Ok(cell.unwrap()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn increase_cells_indices_starting_from(
        &self,
        file_id: i32,
        start_index: i32,
        increase_value: i32,
    ) -> Result<(), String> {
        let result = cell::Entity::update_many()
            .filter(cell::Column::FileId.eq(file_id))
            .filter(cell::Column::Index.gte(start_index))
            .col_expr(
                cell::Column::Index,
                Expr::col(cell::Column::Index).add(increase_value),
            )
            .exec(&*self.db_conn)
            .await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn update_cell(&self, cell: cell::ActiveModel) -> Result<(), String> {
        let result = cell::Entity::update(cell).exec(&*self.db_conn).await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }
}

#[async_trait]
impl CellService for DefaultCellService {
    async fn get_file_cells_ordered_by_index(
        &self,
        file_id: i32,
    ) -> Result<Vec<cell::Model>, String> {
        let result = cell::Entity::find()
            .filter(cell::Column::FileId.eq(file_id))
            .order_by_asc(cell::Column::Index)
            .all(&*self.db_conn)
            .await;
        match result {
            Ok(result) => Ok(result),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn create_cell(
        &self,
        file_id: i32,
        content: String,
        cell_type: CellType,
        index: i32,
    ) -> Result<i32, String> {
        self.increase_cells_indices_starting_from(file_id, index, 1)
            .await?;

        let active_model = cell::ActiveModel {
            file_id: Set(file_id),
            cell_type: Set(cell_type.clone()),
            content: Set(content),
            index: Set(index),
            ..Default::default()
        };
        let result = cell::Entity::insert(active_model)
            .exec(&*self.db_conn)
            .await;
        let cell_id = match result {
            Ok(insert_result) => insert_result.last_insert_id,
            Err(err) => return Err(err.to_string()),
        };

        self.repetition_service
            .update_repetitions_for_cell(file_id, cell_id, cell_type)
            .await?;
        Ok(cell_id)
    }

    async fn delete_cell(&self, cell_id: i32) -> Result<(), String> {
        let cell = self.get_cell_by_id(cell_id).await?;

        let result = cell::Entity::delete_many()
            .filter(cell::Column::Id.eq(cell_id))
            .exec(&*self.db_conn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        self.increase_cells_indices_starting_from(cell.file_id, cell.index, -1)
            .await?;
        Ok(())
    }

    async fn move_cell(&self, cell_id: i32, new_index: i32) -> Result<(), String> {
        let cell = self.get_cell_by_id(cell_id).await?;
        let new_index = if new_index > cell.index {
            new_index - 1
        } else {
            new_index
        };
        self.increase_cells_indices_starting_from(cell.file_id, cell.index + 1, -1)
            .await?;
        self.increase_cells_indices_starting_from(cell.file_id, new_index, 1)
            .await?;
        self.update_cell(cell::ActiveModel {
            id: Set(cell_id),
            index: Set(new_index),
            ..Default::default()
        })
        .await?;
        Ok(())
    }

    async fn update_cell_content(&self, cell_id: i32, content: String) -> Result<(), String> {
        let cell = self.get_cell_by_id(cell_id).await?;
        self.update_cell(cell::ActiveModel {
            id: Set(cell_id),
            content: Set(content),
            ..Default::default()
        })
        .await?;

        self.repetition_service
            .update_repetitions_for_cell(cell.file_id, cell_id, cell.cell_type)
            .await
    }

    async fn get_cells_for_files(&self, file_ids: Vec<i32>) -> Result<Vec<cell::Model>, String> {
        let mut cells: Vec<cell::Model> = Vec::new();
        for file_id in file_ids {
            let result = cell::Entity::find()
                .filter(cell::Column::FileId.eq(file_id))
                .all(&*self.db_conn)
                .await;
            let mut file_cells = match result {
                Ok(result) => result,
                Err(err) => return Err(err.to_string()),
            };
            cells.append(&mut file_cells);
        }
        Ok(cells)
    }
}

#[cfg(test)]
mod tests {
    use crate::services::{
        file_service::{DefaultFileService, FileService},
        repetition_service::DefaultRepetitionService,
        tests::get_db,
    };

    use super::*;

    async fn create_service() -> DefaultCellService {
        let db = Arc::new(get_db().await);
        DefaultCellService::new(
            db.clone(),
            Arc::new(DefaultRepetitionService::new(db.clone())),
        )
    }

    async fn create_file(cell_service: &DefaultCellService, path: &str) -> i32 {
        let file_service = DefaultFileService::new(
            cell_service.db_conn.clone(),
            Arc::new(DefaultRepetitionService::new(cell_service.db_conn.clone())),
        );
        file_service.create_file(path.to_string()).await.unwrap()
    }

    #[tokio::test]
    async fn create_cell_valid_input_created_cells() {
        // Arrange

        let service = create_service().await;
        let file_id = create_file(&service, "file 1").await;
        let index = 1;

        for i in 0..2 {
            cell::ActiveModel {
                index: Set(i),
                file_id: Set(file_id),
                content: Set("Already created".into()),
                cell_type: Set(CellType::Note),
                ..Default::default()
            }
            .insert(&*service.db_conn)
            .await
            .unwrap();
        }

        // Act

        service
            .create_cell(file_id, "New cell content".into(), CellType::Note, index)
            .await
            .unwrap();

        // Assert

        let actual = service
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual[1].content, "New cell content".to_string());
    }

    #[tokio::test]
    pub async fn delete_cell_valid_input_deleted_cell() {
        // Arrange

        let service = create_service().await;
        let file_id = create_file(&service, "file 1").await;
        let cell_id = service
            .create_cell(file_id, "".into(), CellType::Note, 0)
            .await
            .unwrap();

        // Act

        service.delete_cell(cell_id).await.unwrap();

        // Assert

        let actual = service
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual.len(), 0);
    }

    #[tokio::test]
    pub async fn move_cell_move_forward_moved_cell() {
        // Arrange

        let service = create_service().await;
        let file_id = create_file(&service, "file 1").await;
        service
            .create_cell(file_id, "0".into(), CellType::FlashCard, 0)
            .await
            .unwrap();
        let cell_id = service
            .create_cell(file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        service
            .create_cell(file_id, "2".into(), CellType::FlashCard, 2)
            .await
            .unwrap();
        service
            .create_cell(file_id, "3".into(), CellType::Note, 3)
            .await
            .unwrap();
        let new_index = 3;

        // Act

        service.move_cell(cell_id, new_index).await.unwrap();

        // Assert

        let actual = service
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual[0].content, "0".to_string());
        assert_eq!(actual[1].content, "2".to_string());
        assert_eq!(actual[2].content, "1".to_string());
        assert_eq!(actual[3].content, "3".to_string());
    }

    #[tokio::test]
    pub async fn move_cell_move_backward_moved_cell() {
        // Arrange

        let service = create_service().await;
        let file_id = create_file(&service, "file 1").await;
        service
            .create_cell(file_id, "0".into(), CellType::FlashCard, 0)
            .await
            .unwrap();
        service
            .create_cell(file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        let cell_id = service
            .create_cell(file_id, "2".into(), CellType::FlashCard, 2)
            .await
            .unwrap();
        service
            .create_cell(file_id, "3".into(), CellType::Note, 3)
            .await
            .unwrap();
        let new_index = 1;

        // Act

        service.move_cell(cell_id, new_index).await.unwrap();

        // Assert

        let actual = service
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual[0].content, "0".to_string());
        assert_eq!(actual[1].content, "2".to_string());
        assert_eq!(actual[2].content, "1".to_string());
        assert_eq!(actual[3].content, "3".to_string());
    }

    #[tokio::test]
    pub async fn update_cell_content_valid_input_content_updated() {
        // Arrange

        let service = create_service().await;
        let file_id = create_file(&service, "file 1").await;
        let cell_id = service
            .create_cell(file_id, "Old content".into(), CellType::FlashCard, 2)
            .await
            .unwrap();

        // Act

        service
            .update_cell_content(cell_id, "New content".into())
            .await
            .unwrap();

        // Assert

        let actual = service.get_cell_by_id(cell_id).await.unwrap();
        assert_eq!(actual.content, "New content".to_string());
    }

    #[tokio::test]
    pub async fn get_cells_for_files_valid_input_returned_cells() {
        // Arrange

        let service = create_service().await;
        let file1_id = create_file(&service, "file 1").await;

        for i in 0..2 {
            service
                .create_cell(file1_id, "".into(), CellType::Note, i)
                .await
                .unwrap();
        }

        let file2_id = create_file(&service, "file 2").await;
        for i in 0..3 {
            service
                .create_cell(file2_id, "".into(), CellType::Note, i)
                .await
                .unwrap();
        }

        // Act

        let actual = service
            .get_cells_for_files(vec![file1_id, file2_id])
            .await
            .unwrap();

        // Assert

        assert_eq!(5, actual.len());
    }
}
