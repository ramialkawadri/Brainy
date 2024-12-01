#[cfg(test)]
use mockall::{automock, predicate::*};
use sea_orm::sqlx::types::chrono::Utc;
use std::sync::Arc;

use async_trait::async_trait;
use sea_orm::DbConn;
use sea_orm::{entity::*, query::*};

use crate::entities::repetition::{self, State};
use crate::models::file_repetitions_count::FileRepetitionCounts;

#[cfg_attr(test, automock)]
#[async_trait]
pub trait RepetitionRepository {
    async fn get_study_repetitions_counts(
        &self,
        file_id: i32,
    ) -> Result<FileRepetitionCounts, String>;

    async fn get_repetitions_by_cell_id(
        &self,
        cell_id: i32,
    ) -> Result<Vec<repetition::Model>, String>;

    async fn insert_repetitions(
        &self,
        repetitions: Vec<repetition::ActiveModel>,
    ) -> Result<(), String>;

    async fn get_file_repetitions(&self, file_id: i32) -> Result<Vec<repetition::Model>, String>;

    async fn update_repetition(&self, repetition: repetition::Model) -> Result<(), String>;
}

pub struct DefaultRepetitionRepository {
    db_conn: Arc<DbConn>,
}

impl DefaultRepetitionRepository {
    pub fn new(db_conn: Arc<DbConn>) -> Self {
        Self { db_conn }
    }
}

#[async_trait]
impl RepetitionRepository for DefaultRepetitionRepository {
    async fn get_study_repetitions_counts(
        &self,
        file_id: i32,
    ) -> Result<FileRepetitionCounts, String> {
        let result = repetition::Entity::find()
            .select_only()
            .column(repetition::Column::State)
            .column_as(repetition::Column::State.count(), "count")
            .filter(repetition::Column::FileId.eq(file_id))
            .filter(repetition::Column::Due.lte(Utc::now().to_utc()))
            .group_by(repetition::Column::State)
            .into_tuple::<(State, i32)>()
            .all(&*self.db_conn)
            .await;

        let result = match result {
            Ok(result) => result,
            Err(err) => return Err(err.to_string()),
        };

        let mut counts: FileRepetitionCounts = Default::default();
        for row in result {
            if row.0 == State::New {
                counts.new = row.1;
            } else if row.0 == State::Learning {
                counts.learning = row.1;
            } else if row.0 == State::Relearning {
                counts.relearning = row.1;
            } else if row.0 == State::Review {
                counts.review = row.1;
            }
        }

        Ok(counts)
    }

    async fn get_repetitions_by_cell_id(
        &self,
        cell_id: i32,
    ) -> Result<Vec<repetition::Model>, String> {
        let result = repetition::Entity::find()
            .filter(repetition::Column::CellId.eq(cell_id))
            .all(&*self.db_conn)
            .await;
        match result {
            Err(err) => Err(err.to_string()),
            Ok(rows) => Ok(rows),
        }
    }

    async fn insert_repetitions(
        &self,
        repetitions: Vec<repetition::ActiveModel>,
    ) -> Result<(), String> {
        let txn = match self.db_conn.begin().await {
            Ok(txn) => txn,
            Err(err) => return Err(err.to_string()),
        };

        for active_model in repetitions {
            let result = repetition::Entity::insert(active_model).exec(&txn).await;
            if let Err(err) = result {
                return Err(err.to_string());
            }
        }

        let result = txn.commit().await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn get_file_repetitions(&self, file_id: i32) -> Result<Vec<repetition::Model>, String> {
        let result = repetition::Entity::find()
            .filter(repetition::Column::FileId.eq(file_id))
            .all(&*self.db_conn)
            .await;

        match result {
            Ok(result) => Ok(result),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn update_repetition(&self, repetition: repetition::Model) -> Result<(), String> {
        let active_entity = repetition::ActiveModel {
            id: Set(repetition.id),
            file_id: Set(repetition.file_id),
            cell_id: Set(repetition.cell_id),
            due: Set(repetition.due),
            stability: Set(repetition.stability),
            difficulty: Set(repetition.difficulty),
            elapsed_days: Set(repetition.elapsed_days),
            scheduled_days: Set(repetition.scheduled_days),
            reps: Set(repetition.reps),
            lapses: Set(repetition.lapses),
            state: Set(repetition.state),
            last_review: Set(repetition.last_review),
        };
        let result = active_entity.update(&*self.db_conn).await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::Duration;

    use super::*;
    use crate::entities::cell::CellType;
    use crate::repositories::cell_repository::{CellRepository, DefaultCellRepository};
    use crate::repositories::file_repository::{DefaultFileRepository, FileRepository};
    use crate::repositories::tests::get_db;

    async fn create_repository() -> DefaultRepetitionRepository {
        let db = get_db().await;
        DefaultRepetitionRepository::new(Arc::new(db))
    }

    async fn create_file_cell(
        repository: &DefaultRepetitionRepository,
        file_name: &str,
    ) -> (i32, i32) {
        let file_repository = DefaultFileRepository::new(repository.db_conn.clone());
        let cell_repository = DefaultCellRepository::new(repository.db_conn.clone());
        let file_id = file_repository.create_file(file_name.into()).await.unwrap();
        let cell_id = cell_repository
            .create_cell(file_id, "".into(), CellType::Note, 0)
            .await
            .unwrap();
        (file_id, cell_id)
    }

    #[tokio::test]
    async fn get_study_repetitions_counts_valid_input_returned_count() {
        // Arrange

        let repository = create_repository().await;
        let (file_id, cell_id) = create_file_cell(&repository, "test").await;
        for _ in 0..2 {
            repository
                .insert_repetitions(vec![repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::New),
                    ..Default::default()
                }])
                .await
                .unwrap();
        }

        repository
            .insert_repetitions(vec![
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Review),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Learning),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Learning),
                    due: Set((Utc::now() + Duration::days(1)).to_utc()),
                    ..Default::default()
                },
            ])
            .await
            .unwrap();

        // Act

        let actual = repository
            .get_study_repetitions_counts(file_id)
            .await
            .unwrap();

        // Assert

        assert_eq!(2, actual.new);
        assert_eq!(1, actual.learning);
        assert_eq!(0, actual.relearning);
        assert_eq!(1, actual.review);
    }

    #[tokio::test]
    async fn get_repetitions_by_cell_id_valid_input_returned_repetitions() {
        // Arrange

        let repository = create_repository().await;
        let (file_id, cell_id) = create_file_cell(&repository, "test").await;
        repository
            .insert_repetitions(vec![
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Learning),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Relearning),
                    ..Default::default()
                },
            ])
            .await
            .unwrap();

        // Act

        let actual = repository
            .get_repetitions_by_cell_id(cell_id)
            .await
            .unwrap();

        // Assert

        assert_eq!(2, actual.len());
    }

    #[tokio::test]
    async fn get_file_repetitions_valid_input_returned_repetitions() {
        // Arrange

        let repository = create_repository().await;
        let (file_id, cell_id) = create_file_cell(&repository, "test 1").await;
        let (file_id_2, cell_id_2) = create_file_cell(&repository, "test 2").await;
        repository
            .insert_repetitions(vec![
                repetition::ActiveModel {
                    file_id: Set(file_id),
                    cell_id: Set(cell_id),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    file_id: Set(file_id_2),
                    cell_id: Set(cell_id_2),
                    ..Default::default()
                },
            ])
            .await
            .unwrap();

        // Act

        let actual = repository.get_file_repetitions(file_id).await.unwrap();

        // Assert

        assert_eq!(actual.len(), 1);
    }

    #[tokio::test]
    async fn update_repetition_valid_input_updated_repetition() {
        // Arrange

        let repository = create_repository().await;
        let (file_id, cell_id) = create_file_cell(&repository, "test 1").await;
        repository
            .insert_repetitions(vec![repetition::ActiveModel {
                file_id: Set(file_id),
                cell_id: Set(cell_id),
                ..Default::default()
            }])
            .await
            .unwrap();
        let repetition_id = repetition::Entity::find()
            .one(&*repository.db_conn)
            .await
            .unwrap()
            .unwrap()
            .id;
        let date = Utc::now().to_utc();
        let repetition = repetition::Model {
            id: repetition_id,
            file_id,
            cell_id,
            due: date,
            reps: 1,
            stability: 2.1f32,
            difficulty: 4.2f32,
            elapsed_days: 5,
            scheduled_days: 6,
            lapses: 7,
            state: State::New,
            last_review: date,
        };

        // Act

        repository
            .update_repetition(repetition.clone())
            .await
            .unwrap();

        // Assert

        let actual = repetition::Entity::find()
            .one(&*repository.db_conn)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(actual.id, repetition.id);
        assert_eq!(actual.file_id, repetition.file_id);
        assert_eq!(actual.cell_id, repetition.cell_id);
        assert_eq!(actual.due, repetition.due);
        assert_eq!(actual.reps, repetition.reps);
        assert_eq!(actual.stability, repetition.stability);
        assert_eq!(actual.difficulty, repetition.difficulty);
        assert_eq!(actual.elapsed_days, repetition.elapsed_days);
        assert_eq!(actual.scheduled_days, repetition.scheduled_days);
        assert_eq!(actual.lapses, repetition.lapses);
        assert_eq!(actual.state, repetition.state);
        assert_eq!(actual.last_review, repetition.last_review);
    }
}
