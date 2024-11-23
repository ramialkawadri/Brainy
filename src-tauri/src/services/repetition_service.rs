#[cfg(test)]
use mockall::{automock, predicate::*};
use sea_orm::Set;
use std::sync::Arc;

use crate::entities::cell::CellType;
use crate::entities::repetition;
use crate::models::file_repetitions_count::FileRepetitionCounts;
use crate::repositories::repetition_repository::RepetitionRepository;

use async_trait::async_trait;

#[cfg_attr(test, automock)]
#[async_trait]
pub trait RepetitionService {
    async fn update_repetitions_for_cell(
        &self,
        file_id: i32,
        cell_id: i32,
        cell_type: CellType,
    ) -> Result<(), String>;

    async fn get_study_repetitions(&self, file_id: i32) -> Result<FileRepetitionCounts, String>;
}

pub struct DefaultRepetitionService {
    repository: Arc<dyn RepetitionRepository + Sync + Send>,
}

impl DefaultRepetitionService {
    pub fn new(repository: Arc<dyn RepetitionRepository + Sync + Send>) -> Self {
        Self { repository }
    }
}

#[async_trait]
impl RepetitionService for DefaultRepetitionService {
    async fn update_repetitions_for_cell(
        &self,
        file_id: i32,
        cell_id: i32,
        cell_type: CellType,
    ) -> Result<(), String> {
        let cell_repetitions = self.repository.get_repetitions_by_cell_id(cell_id).await?;
        let mut repetitions_to_insert: Vec<repetition::ActiveModel> = vec![];
        match cell_type {
            CellType::Note => (),
            CellType::FlashCard => {
                if cell_repetitions.len() == 0 {
                    repetitions_to_insert.push(repetition::ActiveModel {
                        file_id: Set(file_id),
                        cell_id: Set(cell_id),
                        ..Default::default()
                    });
                }
            }
        }
        self.repository
            .insert_repetitions(repetitions_to_insert)
            .await
    }

    async fn get_study_repetitions(&self, file_id: i32) -> Result<FileRepetitionCounts, String> {
        self.repository.get_study_repetitions(file_id).await
    }
}

#[cfg(test)]
mod tests {
    use mockall::predicate;

    use crate::repositories::repetition_repository::MockRepetitionRepository;

    use super::*;

    struct TestDependencies {
        repetition_repository: MockRepetitionRepository,
    }

    impl TestDependencies {
        fn new() -> Self {
            Self {
                repetition_repository: MockRepetitionRepository::new(),
            }
        }

        fn to_service(self) -> DefaultRepetitionService {
            DefaultRepetitionService::new(Arc::new(self.repetition_repository))
        }

        fn setup_get_study_repetitions(&mut self, file_id: i32, repetitions: FileRepetitionCounts) {
            self.repetition_repository
                .expect_get_study_repetitions()
                .with(predicate::eq(file_id))
                .return_once(|_| Ok(repetitions));
        }

        fn setup_get_repetitions_by_cell_id(
            &mut self,
            cell_id: i32,
            repetitions: Vec<repetition::Model>,
        ) {
            self.repetition_repository
                .expect_get_repetitions_by_cell_id()
                .with(predicate::eq(cell_id))
                .return_once(|_| Ok(repetitions));
        }

        fn assert_insert_repetitions(
            &mut self,
            file_id: i32,
            cell_id: i32,
            expected_length: usize,
        ) {
            self.repetition_repository
                .expect_insert_repetitions()
                .withf(move |repetitions| {
                    repetitions.len() == expected_length
                        && repetitions.iter().all(|repetition| {
                            repetition.file_id == Set(file_id) && repetition.cell_id == Set(cell_id)
                        })
                })
                .return_const(Ok(()));
        }
    }

    #[tokio::test]
    async fn update_repetitions_for_cell_flash_card_with_no_repetitions_added_repetition() {
        // Arrange

        let mut deps = TestDependencies::new();
        let cell_id = 1;
        let file_id = 1;
        deps.setup_get_repetitions_by_cell_id(cell_id, vec![]);

        // Assert

        deps.assert_insert_repetitions(file_id, cell_id, 1);

        // Act

        deps.to_service()
            .update_repetitions_for_cell(file_id, cell_id, CellType::FlashCard)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn update_repetitions_for_cell_flash_card_with_repetitions_no_repetition_added() {
        // Arrange

        let mut deps = TestDependencies::new();
        let cell_id = 1;
        let file_id = 1;
        deps.setup_get_repetitions_by_cell_id(
            cell_id,
            vec![repetition::Model {
                ..Default::default()
            }],
        );

        // Assert

        deps.assert_insert_repetitions(file_id, cell_id, 0);

        // Act

        deps.to_service()
            .update_repetitions_for_cell(file_id, cell_id, CellType::FlashCard)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn get_study_repetitions_valid_input_returned_repetitions() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        let repetitions = FileRepetitionCounts {
            new: 5,
            ..Default::default()
        };
        deps.setup_get_study_repetitions(file_id, repetitions);

        // Act

        let actual = deps
            .to_service()
            .get_study_repetitions(file_id)
            .await
            .unwrap();

        // Assert

        assert_eq!(5, actual.new);
    }
}
