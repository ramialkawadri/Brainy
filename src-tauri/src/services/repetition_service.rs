#[cfg(test)]
use mockall::{automock, predicate::*};
use sea_orm::Set;
use std::sync::Arc;

use crate::entities::cell::CellType;
use crate::entities::repetition;
use crate::models::file_repetitions_count::FileRepetitionCounts;
use crate::repositories::repetition_repository::RepetitionRepository;

use async_trait::async_trait;

// TODO: test
#[cfg_attr(test, automock)]
#[async_trait]
pub trait RepetitionService {
    async fn upsert_repetition(
        &self,
        file_id: i32,
        cell_id: i32,
        cell_type: CellType,
    ) -> Result<(), String>;

    async fn get_file_repetitions_count(
        &self,
        file_id: i32,
    ) -> Result<FileRepetitionCounts, String>;
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
    async fn upsert_repetition(
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
        self.repository.insert_repetitions(repetitions_to_insert).await
    }

    // TODO: update name to indicate due
    async fn get_file_repetitions_count(
        &self,
        file_id: i32,
    ) -> Result<FileRepetitionCounts, String> {
        self.repository.get_file_repetitions_count(file_id).await
    }
}
