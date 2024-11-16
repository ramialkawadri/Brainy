use std::sync::Arc;

use crate::entities::cell::{self, CellType};
use crate::repositories::cell_repository::CellRepository;

use async_trait::async_trait;
use sea_orm::entity::*;

use super::repetition_service::RepetitionService;

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
    async fn update_cell_content(&self, cell_id: i32, content: String) -> Result<(), String>;
}

pub struct DefaultCellService {
    repository: Arc<dyn CellRepository + Sync + Send>,
    repetition_service: Arc<dyn RepetitionService + Sync + Send>,
}

impl DefaultCellService {
    pub fn new(
        repository: Arc<dyn CellRepository + Sync + Send>,
        repetition_service: Arc<dyn RepetitionService + Sync + Send>,
    ) -> Self {
        Self {
            repository,
            repetition_service,
        }
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
        let cell_id = self
            .repository
            .create_cell(file_id, content, cell_type.clone(), index)
            .await?;
        self.repetition_service
            .upsert_repetition(file_id, cell_id, cell_type)
            .await?;
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

    async fn update_cell_content(&self, cell_id: i32, content: String) -> Result<(), String> {
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
    use super::*;
    use crate::{
        repositories::cell_repository::MockCellRepository,
        services::repetition_service::MockRepetitionService,
    };
    use mockall::predicate;

    struct TestDependencies {
        cell_repository: MockCellRepository,
        repetition_serive: MockRepetitionService,
    }

    impl TestDependencies {
        fn new() -> Self {
            TestDependencies {
                cell_repository: MockCellRepository::new(),
                repetition_serive: MockRepetitionService::new(),
            }
        }

        fn to_service(self) -> DefaultCellService {
            DefaultCellService::new(
                Arc::new(self.cell_repository),
                Arc::new(self.repetition_serive),
            )
        }

        fn setup_get_by_id(&mut self, cell_id: i32, cell: cell::Model) {
            self.cell_repository
                .expect_get_cell_by_id()
                .with(predicate::eq(cell_id))
                .return_once(|_| Ok(cell));
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

        fn assert_delete_cell(&mut self, cell_id: i32) {
            self.cell_repository
                .expect_delete_cell()
                .with(predicate::eq(cell_id))
                .once()
                .return_const(Ok(()));
        }

        fn assert_update_cell(&mut self, f: Box<dyn Send + Fn(&cell::ActiveModel) -> bool>) {
            self.cell_repository
                .expect_update_cell()
                .withf(f)
                .once()
                .return_const(Ok(()));
        }

        fn assert_upsert_repetition(&mut self, file_id: i32, cell_id: i32, cell_type: CellType) {
            self.repetition_serive
                .expect_upsert_repetition()
                .with(
                    predicate::eq(file_id),
                    predicate::eq(cell_id),
                    predicate::eq(cell_type),
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
        // TODO: change from magic number 99 to an argument
        deps.assert_upsert_repetition(file_id, 99, CellType::Note);

        // Act

        deps.to_service()
            .create_cell(file_id, "content".into(), CellType::Note, index)
            .await
            .unwrap();
    }

    #[tokio::test]
    pub async fn delete_cell_valid_input_deleted_cell() {
        // Arrange

        let mut deps = TestDependencies::new();
        let cell_id = 1;
        let file_id = 1;
        deps.setup_get_by_id(
            cell_id,
            cell::Model {
                id: cell_id,
                index: 3,
                file_id,
                ..Default::default()
            },
        );

        // Assert

        deps.assert_increase_cells_index_starting_from(file_id, 3, -1);
        deps.assert_delete_cell(cell_id);

        // Act

        deps.to_service().delete_cell(cell_id).await.unwrap();
    }

    #[tokio::test]
    pub async fn move_cell_move_forward_moved_cell() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        let cell_id = 2;
        let cell_index = 3;
        deps.setup_get_by_id(
            cell_id,
            cell::Model {
                id: cell_id,
                index: cell_index,
                file_id,
                ..Default::default()
            },
        );
        let new_index = 4;

        // Assert

        deps.assert_increase_cells_index_starting_from(file_id, cell_index + 1, -1);
        deps.assert_increase_cells_index_starting_from(file_id, new_index - 1, 1);
        deps.assert_update_cell(Box::new(move |c| c.index == Set(new_index - 1)));

        // Act

        deps.to_service()
            .move_cell(cell_id, new_index)
            .await
            .unwrap();
    }

    #[tokio::test]
    pub async fn move_cell_move_backward_moved_cell() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        let cell_id = 2;
        let cell_index = 3;
        deps.setup_get_by_id(
            cell_id,
            cell::Model {
                id: cell_id,
                index: cell_index,
                file_id,
                ..Default::default()
            },
        );
        let new_index = 2;

        // Assert

        deps.assert_increase_cells_index_starting_from(file_id, cell_index + 1, -1);
        deps.assert_increase_cells_index_starting_from(file_id, new_index, 1);
        deps.assert_update_cell(Box::new(move |c| c.index == Set(new_index)));

        // Act

        deps.to_service()
            .move_cell(cell_id, new_index)
            .await
            .unwrap();
    }

    #[tokio::test]
    pub async fn update_cell_content_valid_input_content_updated() {
        // Arrange

        let mut deps = TestDependencies::new();
        let cell_id = 1;

        // Assert

        deps.assert_update_cell(Box::new(|c| c.content == Set("new".into())));

        // Act

        deps.to_service()
            .update_cell_content(cell_id, "new".into())
            .await
            .unwrap();
    }
}
