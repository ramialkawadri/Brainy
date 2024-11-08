use std::sync::Arc;

use crate::entity::cell::{self, CellType};
use crate::entity::repetition;
use crate::service::repetition_service;

use async_trait::async_trait;
use prelude::Expr;
use sea_orm::DatabaseConnection;
use sea_orm::{entity::*, query::*};

// TODO: use dependency for repetition
#[async_trait]
pub trait CellService {
    async fn get_cells(&self, file_id: i32) -> Result<Vec<cell::Model>, String>;
    async fn create_cell(
        &self,
        file_id: i32,
        content: String,
        cell_type: CellType,
        index: i32,
    ) -> Result<(), String>;
    async fn delete_cell(&self, cell_id: i32) -> Result<(), String>;
    async fn move_cell(&self, cell_id: i32, new_index: i32) -> Result<(), String>;
    async fn update_cell(&self, cell_id: i32, content: String) -> Result<(), String>;
}

pub struct DefaultCellService {
    db_conn: Arc<DatabaseConnection>,
}

impl DefaultCellService {
    pub fn new(db_conn: Arc<DatabaseConnection>) -> Self {
        Self { db_conn }
    }

    async fn get_cell_by_id(&self, cell_id: i32) -> Result<cell::Model, String> {
        let result = cell::Entity::find_by_id(cell_id).one(&*self.db_conn).await;
        match result {
            Ok(cell) => Ok(cell.unwrap()),
            Err(err) => Err(err.to_string()),
        }
    }
}

#[async_trait]
impl CellService for DefaultCellService {
    async fn get_cells(&self, file_id: i32) -> Result<Vec<cell::Model>, String> {
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
    ) -> Result<(), String> {
        let result = cell::Entity::update_many()
            .filter(cell::Column::FileId.eq(file_id))
            .filter(cell::Column::Index.gte(index))
            .col_expr(cell::Column::Index, Expr::col(cell::Column::Index).add(1))
            .exec(&*self.db_conn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

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
        match result {
            Ok(insert_result) => {
                let cell_id = insert_result.last_insert_id;
                repetition_service::upsert_repetition(&*self.db_conn, file_id, cell_id, cell_type)
                    .await?;
                Ok(())
            }
            Err(err) => Err(err.to_string()),
        }
    }

    async fn delete_cell(&self, cell_id: i32) -> Result<(), String> {
        // TODO: update test
        let cell = self.get_cell_by_id(cell_id).await?;

        let txn = match self.db_conn.begin().await {
            Ok(txn) => txn,
            Err(err) => return Err(err.to_string()),
        };

        let result = repetition::Entity::delete_many()
            .filter(repetition::Column::CellId.eq(cell_id))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = cell::Entity::delete_many()
            .filter(cell::Column::Id.eq(cell_id))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = cell::Entity::update_many()
            .filter(cell::Column::FileId.eq(cell.file_id))
            .filter(cell::Column::Index.gt(cell.index))
            .col_expr(cell::Column::Index, Expr::col(cell::Column::Index).sub(1))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = txn.commit().await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn move_cell(&self, cell_id: i32, new_index: i32) -> Result<(), String> {
        let cell = self.get_cell_by_id(cell_id).await?;

        let txn = match self.db_conn.begin().await {
            Ok(txn) => txn,
            Err(err) => return Err(err.to_string()),
        };

        let new_index = if new_index > cell.index {
            new_index - 1
        } else {
            new_index
        };

        let result = cell::Entity::update_many()
            .filter(cell::Column::FileId.eq(cell.file_id))
            .filter(cell::Column::Index.gt(cell.index))
            .col_expr(cell::Column::Index, Expr::col(cell::Column::Index).sub(1))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = cell::Entity::update_many()
            .filter(cell::Column::FileId.eq(cell.file_id))
            .filter(cell::Column::Index.gte(new_index))
            .col_expr(cell::Column::Index, Expr::col(cell::Column::Index).add(1))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = cell::Entity::update_many()
            .filter(cell::Column::Id.eq(cell_id))
            .col_expr(cell::Column::Index, Expr::value(new_index))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = txn.commit().await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn update_cell(&self, cell_id: i32, content: String) -> Result<(), String> {
        let result = cell::Entity::update_many()
            .filter(cell::Column::Id.eq(cell_id))
            .col_expr(cell::Column::Content, Expr::value(content))
            .exec(&*self.db_conn)
            .await;

        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    // use super::*;
    // use crate::service::tests::*;
    // use crate::service::user_file_service::tests::*;
    // use crate::service::user_file_service::*;
    // TODO:
    //
    // #[tokio::test]
    // async fn create_cell_valid_input_created_cells() {
    //     // Arrange
    //
    //     let db = get_db().await;
    //     create_file(&db, "file 1".into()).await.unwrap();
    //     let file_id = get_id(&db, "file 1", false).await;
    //
    //     // Act
    //
    //     create_cell(&db, file_id, "1".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //     create_cell(&db, file_id, "2".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //     create_cell(&db, file_id, "3".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //     create_cell(&db, file_id, "4".into(), CellType::Note, 0)
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = get_cells(&db, file_id).await.unwrap();
    //     assert_eq!(actual.len(), 4);
    //     assert_eq!(actual[0].content, "4");
    //     assert_eq!(actual[1].content, "3");
    //     assert_eq!(actual[2].content, "2");
    //     assert_eq!(actual[3].content, "1");
    //
    //     assert_eq!(actual[0].cell_type, CellType::Note);
    //     assert_eq!(actual[1].cell_type, CellType::FlashCard);
    //     assert_eq!(actual[2].cell_type, CellType::FlashCard);
    //     assert_eq!(actual[3].cell_type, CellType::FlashCard);
    // }
    //
    // #[tokio::test]
    // pub async fn delete_cell_valid_input_deleted_cell() {
    //     // Arrange
    //
    //     let db = get_db().await;
    //     create_file(&db, "file 1".into()).await.unwrap();
    //     let file_id = get_id(&db, "file 1", false).await;
    //
    //     create_cell(&db, file_id, "0".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //
    //     create_cell(&db, file_id, "1".into(), CellType::FlashCard, 1)
    //         .await
    //         .unwrap();
    //
    //     create_cell(&db, file_id, "2".into(), CellType::FlashCard, 2)
    //         .await
    //         .unwrap();
    //
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //
    //     // Act
    //
    //     delete_cell(&db, cells[1].id).await.unwrap();
    //
    //     // Assert
    //
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //     assert_eq!(2, cells.len());
    //     assert_eq!("0".to_string(), cells[0].content);
    //     assert_eq!(0, cells[0].index);
    //     assert_eq!("2".to_string(), cells[1].content);
    //     assert_eq!(1, cells[1].index);
    // }
    //
    // #[tokio::test]
    // pub async fn move_cell_move_forward_moved_cell() {
    //     // Arrange
    //
    //     let db = get_db().await;
    //     create_file(&db, "file 1".into()).await.unwrap();
    //     let file_id = get_id(&db, "file 1", false).await;
    //
    //     for i in 0..5 {
    //         create_cell(&db, file_id, i.to_string(), CellType::FlashCard, i)
    //             .await
    //             .unwrap();
    //     }
    //
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //
    //     // Act
    //
    //     move_cell(&db, cells[1].id, 3).await.unwrap();
    //
    //     // Assert
    //
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //     assert_eq!("0".to_string(), cells[0].content);
    //     assert_eq!("2".to_string(), cells[1].content);
    //     assert_eq!("1".to_string(), cells[2].content);
    //     assert_eq!("3".to_string(), cells[3].content);
    //     assert_eq!("4".to_string(), cells[4].content);
    // }
    //
    // #[tokio::test]
    // pub async fn move_cell_move_backward_moved_cell() {
    //     // Arrange
    //
    //     let db = get_db().await;
    //     create_file(&db, "file 1".into()).await.unwrap();
    //     let file_id = get_id(&db, "file 1", false).await;
    //
    //     for i in 0..5 {
    //         create_cell(&db, file_id, i.to_string(), CellType::FlashCard, i)
    //             .await
    //             .unwrap();
    //     }
    //
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //
    //     // Act
    //
    //     move_cell(&db, cells[3].id, 1).await.unwrap();
    //
    //     // Assert
    //
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //     assert_eq!("0".to_string(), cells[0].content);
    //     assert_eq!("3".to_string(), cells[1].content);
    //     assert_eq!("1".to_string(), cells[2].content);
    //     assert_eq!("2".to_string(), cells[3].content);
    //     assert_eq!("4".to_string(), cells[4].content);
    // }
    //
    // #[tokio::test]
    // pub async fn update_cell_valid_input_content_updated() {
    //     // Arrange
    //
    //     let db = get_db().await;
    //     create_file(&db, "file 1".into()).await.unwrap();
    //     let file_id = get_id(&db, "file 1", false).await;
    //
    //     create_cell(&db, file_id, "old".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //
    //     // Act
    //
    //     update_cell(&db, cells[0].id, "new".into()).await.unwrap();
    //
    //     // Assert
    //
    //     let cells = get_cells(&db, file_id).await.unwrap();
    //     assert_eq!("new".to_string(), cells[0].content);
    // }
}
