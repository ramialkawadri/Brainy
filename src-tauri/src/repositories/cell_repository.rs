#[cfg(test)]
use mockall::{automock, predicate::*};
use std::sync::Arc;

use async_trait::async_trait;
use prelude::Expr;
use sea_orm::DbConn;
use sea_orm::{entity::*, query::*};

use crate::entities::cell::{self, CellType};

#[cfg_attr(test, automock)]
#[async_trait]
pub trait CellRepository {
    async fn get_cell_by_id(&self, cell_id: i32) -> Result<cell::Model, String>;
    async fn get_file_cells_ordered_by_index(
        &self,
        file_id: i32,
    ) -> Result<Vec<cell::Model>, String>;
    async fn increase_cells_indices_starting_from(
        &self,
        file_id: i32,
        start_index: i32,
        increase_value: i32,
    ) -> Result<(), String>;
    async fn create_cell(
        &self,
        file_id: i32,
        content: String,
        cell_type: CellType,
        index: i32,
    ) -> Result<i32, String>;
    async fn delete_cell(&self, cell_id: i32) -> Result<(), String>;
    async fn update_cell(&self, cell: cell::ActiveModel) -> Result<(), String>;
}

pub struct DefaultCellRepository {
    db_conn: Arc<DbConn>,
}

impl DefaultCellRepository {
    pub fn new(db_conn: Arc<DbConn>) -> Self {
        Self { db_conn }
    }
}

#[async_trait]
impl CellRepository for DefaultCellRepository {
    async fn get_cell_by_id(&self, cell_id: i32) -> Result<cell::Model, String> {
        let result = cell::Entity::find_by_id(cell_id).one(&*self.db_conn).await;
        match result {
            Ok(cell) => Ok(cell.unwrap()),
            Err(err) => Err(err.to_string()),
        }
    }

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

    async fn create_cell(
        &self,
        file_id: i32,
        content: String,
        cell_type: CellType,
        index: i32,
    ) -> Result<i32, String> {
        let active_model = cell::ActiveModel {
            file_id: Set(file_id),
            cell_type: Set(cell_type),
            content: Set(content),
            index: Set(index),
            ..Default::default()
        };
        let result = cell::Entity::insert(active_model)
            .exec(&*self.db_conn)
            .await;
        match result {
            Ok(insert_result) => Ok(insert_result.last_insert_id),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn delete_cell(&self, cell_id: i32) -> Result<(), String> {
        let result = cell::Entity::delete_many()
            .filter(cell::Column::Id.eq(cell_id))
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

#[cfg(test)]
mod tests {
    use sea_orm::DatabaseConnection;

    use super::*;
    use crate::repositories::{
        tests::get_db,
        user_file_repository::{DefaultUserFileRepository, UserFileRepository},
    };

    async fn create_repository() -> DefaultCellRepository {
        let db = get_db().await;
        DefaultCellRepository::new(Arc::new(db))
    }

    fn create_user_file_repository(db_conn: Arc<DatabaseConnection>) -> DefaultUserFileRepository {
        DefaultUserFileRepository::new(db_conn)
    }

    #[tokio::test]
    async fn get_cell_by_id_valid_input_returned_cell() {
        // Arrange

        let repository = create_repository().await;
        let user_repository = create_user_file_repository(repository.db_conn.clone());
        let file_id = user_repository.create_file("file 1".into()).await.unwrap();
        let cell_id = repository
            .create_cell(file_id, "test".into(), CellType::FlashCard, 1)
            .await
            .unwrap();

        // Act

        let actual = repository.get_cell_by_id(cell_id).await.unwrap();

        // Assert

        assert_eq!(actual.id, cell_id);
        assert_eq!(actual.content, "test".to_string());
    }

    #[tokio::test]
    async fn increase_cells_indices_starting_from_valid_input_increased_indexes() {
        // Arrange

        let repository = create_repository().await;
        let user_repository = create_user_file_repository(repository.db_conn.clone());
        let file_id = user_repository.create_file("file 1".into()).await.unwrap();
        repository
            .create_cell(file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "2".into(), CellType::FlashCard, 2)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "3".into(), CellType::FlashCard, 3)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "4".into(), CellType::Note, 4)
            .await
            .unwrap();

        // Act

        repository
            .increase_cells_indices_starting_from(file_id, 2, 1)
            .await
            .unwrap();

        // Assert

        let actual = repository
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual.len(), 4);
        assert_eq!(actual[0].index, 1);
        assert_eq!(actual[1].index, 3);
        assert_eq!(actual[2].index, 4);
        assert_eq!(actual[3].index, 5);
    }

    #[tokio::test]
    async fn increase_cells_index_starting_from_negative_number_decreased_indexes() {
        // Arrange

        let repository = create_repository().await;
        let user_repository = create_user_file_repository(repository.db_conn.clone());
        let file_id = user_repository.create_file("file 1".into()).await.unwrap();
        repository
            .create_cell(file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "3".into(), CellType::FlashCard, 3)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "4".into(), CellType::Note, 4)
            .await
            .unwrap();

        // Act

        repository
            .increase_cells_indices_starting_from(file_id, 3, -1)
            .await
            .unwrap();

        // Assert

        let actual = repository
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual.len(), 3);
        assert_eq!(actual[0].index, 1);
        assert_eq!(actual[1].index, 2);
        assert_eq!(actual[2].index, 3);
    }

    #[tokio::test]
    async fn create_cell_valid_input_created_cells() {
        // Arrange

        let repository = create_repository().await;
        let user_repository = create_user_file_repository(repository.db_conn.clone());
        let file_id = user_repository.create_file("file 1".into()).await.unwrap();

        // Act

        repository
            .create_cell(file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "2".into(), CellType::FlashCard, 2)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "3".into(), CellType::FlashCard, 3)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "4".into(), CellType::Note, 4)
            .await
            .unwrap();

        // Assert

        let actual = repository
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual.len(), 4);
        assert_eq!(actual[0].content, "1");
        assert_eq!(actual[1].content, "2");
        assert_eq!(actual[2].content, "3");
        assert_eq!(actual[3].content, "4");

        assert_eq!(actual[0].cell_type, CellType::FlashCard);
        assert_eq!(actual[1].cell_type, CellType::FlashCard);
        assert_eq!(actual[2].cell_type, CellType::FlashCard);
        assert_eq!(actual[3].cell_type, CellType::Note);
    }

    #[tokio::test]
    async fn delete_cell_valid_input_deleted_cell() {
        // Arrange

        let repository = create_repository().await;
        let user_repository = create_user_file_repository(repository.db_conn.clone());
        let file_id = user_repository.create_file("file 1".into()).await.unwrap();
        let cell_id = repository
            .create_cell(file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();

        // Act

        repository.delete_cell(cell_id).await.unwrap();

        // Assert

        let actual = repository
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual.len(), 0);
    }

    #[tokio::test]
    async fn update_cell_valid_input_updated_cell() {
        // Arrange

        let repository = create_repository().await;
        let user_repository = create_user_file_repository(repository.db_conn.clone());
        let file_id = user_repository.create_file("file 1".into()).await.unwrap();
        let cell_id = repository
            .create_cell(file_id, "cell 1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        repository
            .create_cell(file_id, "cell 2".into(), CellType::FlashCard, 1)
            .await
            .unwrap();

        // Act

        repository
            .update_cell(cell::ActiveModel {
                id: Set(cell_id),
                content: Set("new content".to_string()),
                ..Default::default()
            })
            .await
            .unwrap();

        // Assert

        let actual = repository
            .get_file_cells_ordered_by_index(file_id)
            .await
            .unwrap();
        assert_eq!(actual.len(), 2);
        assert_eq!(actual[0].content, "new content".to_string());
        assert_eq!(actual[1].content, "cell 2".to_string());

        assert_eq!(actual[0].cell_type, CellType::FlashCard);
    }
}
