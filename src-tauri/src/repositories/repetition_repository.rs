#[cfg(test)]
use mockall::{automock, predicate::*};
use sea_orm::sqlx::types::chrono::Utc;
use std::sync::Arc;

use async_trait::async_trait;
use sea_orm::DbConn;
use sea_orm::{entity::*, query::*};

use crate::entities::repetition::{self, State};
use crate::models::file_repetitions_count::FileRepetitionCounts;

// TODO: test
#[cfg_attr(test, automock)]
#[async_trait]
pub trait RepetitionRepository {
    async fn get_file_repetitions_count(
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
    async fn get_file_repetitions_count(
        &self,
        file_id: i32,
    ) -> Result<FileRepetitionCounts, String> {
        let result = repetition::Entity::find()
            .select_only()
            .column(repetition::Column::State)
            .column_as(repetition::Column::State.count(), "count")
            .filter(repetition::Column::FileId.eq(file_id))
            .filter(repetition::Column::Due.lte(Utc::now().naive_utc()))
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
}
