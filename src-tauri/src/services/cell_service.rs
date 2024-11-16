use std::sync::Arc;

use crate::entities::cell::{self, CellType};
use crate::repositories::cell_repository::CellRepository;

use async_trait::async_trait;
use sea_orm::entity::*;

#[async_trait]
pub trait CellService {
    async fn get_file_cells(&self, file_id: i32) -> Result<Vec<cell::Model>, String>;
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
    repository: Arc<dyn CellRepository + Sync + Send>,
}

impl DefaultCellService {
    pub fn new(repository: Arc<dyn CellRepository + Sync + Send>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl CellService for DefaultCellService {
    async fn get_file_cells(&self, file_id: i32) -> Result<Vec<cell::Model>, String> {
        self.repository.get_file_cells(file_id).await
    }

    async fn create_cell(
        &self,
        file_id: i32,
        content: String,
        cell_type: CellType,
        index: i32,
    ) -> Result<(), String> {
        self.repository
            .increase_cells_index_starting_from(file_id, index, 1)
            .await?;
        self.repository
            .create_cell(file_id, content, cell_type, index)
            .await?;
        // TODO:
        // repetition_service::upsert_repetition(&*self.db_conn, file_id, cell_id, cell_type);
        Ok(())
    }

    async fn delete_cell(&self, cell_id: i32) -> Result<(), String> {
        let cell = self.repository.get_cell_by_id(cell_id).await?;
        self.repository.delete_cell(cell_id).await?;
        self.repository
            .increase_cells_index_starting_from(cell.file_id, cell.index, -1)
            .await?;
        Ok(())
    }

    async fn move_cell(&self, cell_id: i32, new_index: i32) -> Result<(), String> {
        let cell = self.repository.get_cell_by_id(cell_id).await?;
        let new_index = if new_index > cell.index {
            new_index - 1
        } else {
            new_index
        };
        self.repository
            .increase_cells_index_starting_from(cell.file_id, cell.index + 1, -1)
            .await?;
        self.repository
            .increase_cells_index_starting_from(cell.file_id, new_index, 1)
            .await?;
        self.repository
            .update_cell(cell::ActiveModel {
                id: Set(cell_id),
                index: Set(new_index),
                ..Default::default()
            })
            .await?;
        Ok(())
    }

    async fn update_cell(&self, cell_id: i32, content: String) -> Result<(), String> {
        self.repository
            .update_cell(cell::ActiveModel {
                id: Set(cell_id),
                content: Set(content),
                ..Default::default()
            })
            .await
    }
}

#[cfg(test)]
mod tests {
    use mockall::{predicate, Predicate};

    use super::*;
    use crate::repositories::cell_repository::MockCellRepository;
    // TODO:

    struct TestDependencies {
        cell_repository: MockCellRepository,
    }

    impl TestDependencies {
        fn new() -> Self {
            TestDependencies {
                cell_repository: MockCellRepository::new(),
            }
        }

        fn to_service(self) -> DefaultCellService {
            DefaultCellService::new(Arc::new(self.cell_repository))
        }

        fn assert_create_cell(
            &mut self,
            file_id: i32,
            content: String,
            cell_type: CellType,
            index: i32,
        ) {
            self.cell_repository
                .expect_create_cell()
                .with(
                    predicate::eq(file_id),
                    predicate::eq(content),
                    predicate::eq(cell_type),
                    predicate::eq(index),
                )
                .once()
                .return_const(Ok(99));
        }

        fn assert_increase_cells_index_starting_from(
            &mut self,
            file_id: i32,
            start_index: i32,
            value: i32,
        ) {
            self.cell_repository
                .expect_increase_cells_index_starting_from()
                .with(
                    predicate::eq(file_id),
                    predicate::eq(start_index),
                    predicate::eq(value),
                )
                .once()
                .return_const(Ok(()));
        }
    }

    #[tokio::test]
    async fn create_cell_valid_input_created_cells() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        let index = 2;

        // Assert

        deps.assert_increase_cells_index_starting_from(file_id, index, 1);
        deps.assert_create_cell(file_id, "content".to_string(), CellType::Note, index);

        // Act

        deps.to_service()
            .create_cell(file_id, "content".into(), CellType::Note, index)
            .await
            .unwrap();
    }

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
