#[cfg(test)]
use mockall::{automock, predicate::*};
use std::sync::Arc;

use async_trait::async_trait;
use prelude::Expr;
use sea_orm::DbConn;
use sea_orm::{entity::*, query::*};

use crate::entities::cell::{self, CellType};

// TODO: test
#[cfg_attr(test, automock)]
#[async_trait]
pub trait CellRepository {
    async fn get_cell_by_id(&self, cell_id: i32) -> Result<cell::Model, String>;
    async fn get_file_cells(&self, file_id: i32) -> Result<Vec<cell::Model>, String>;
    async fn increase_cells_index_starting_from(
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

    async fn get_file_cells(&self, file_id: i32) -> Result<Vec<cell::Model>, String> {
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

    async fn increase_cells_index_starting_from(
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
        // TODO: test that active model does not change unset values
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

    use crate::repositories::{tests::get_db, user_file_repository::{DefaultUserFileRepository, UserFileRepository}};
    use super::*;

    async fn create_repository() -> DefaultCellRepository {
        let db = get_db().await;
        DefaultCellRepository::new(Arc::new(db))
    }

    fn create_user_file_repository(db_conn: Arc<DatabaseConnection>) -> DefaultUserFileRepository {
        DefaultUserFileRepository::new(db_conn)
    }

    #[tokio::test]
    async fn create_cell_valid_input_created_cells() {
        // Arrange

        let repository = create_repository().await;
        let user_repository = create_user_file_repository(repository.db_conn.clone());
        user_repository.create_file("file 1".into()).await.unwrap();

        // Act

        repository.create_cell(1, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        repository.create_cell(1, "2".into(), CellType::FlashCard, 2)
            .await
            .unwrap();
        repository.create_cell(1, "3".into(), CellType::FlashCard, 3)
            .await
            .unwrap();
        repository.create_cell(1, "4".into(), CellType::Note, 4)
            .await
            .unwrap();

        // Assert

        let actual = repository.get_file_cells(1).await.unwrap();
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
}
