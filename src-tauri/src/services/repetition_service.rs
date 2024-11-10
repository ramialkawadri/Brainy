use sea_orm::sqlx::types::chrono::Utc;
use sea_orm::DatabaseConnection;
use sea_orm::{entity::*, query::*};

use crate::entities::cell::CellType;
use crate::entities::repetition::{self, State};
use crate::model::file_repetitions_count::FileRepetitionCounts;

pub async fn upsert_repetition(
    db: &DatabaseConnection,
    file_id: i32,
    cell_id: i32,
    cell_type: CellType,
) -> Result<(), String> {
    // TODO: test
    let cell_repetitions = repetition::Entity::find()
        .filter(repetition::Column::CellId.eq(cell_id))
        .all(db)
        .await;

    let cell_repetitions = match cell_repetitions {
        Err(err) => return Err(err.to_string()),
        Ok(cells) => cells,
    };

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

    let txn = match db.begin().await {
        Ok(txn) => txn,
        Err(err) => return Err(err.to_string()),
    };

    for active_model in repetitions_to_insert {
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

// TODO: update name to indicate due
pub async fn get_file_repetitions_count(
    db: &DatabaseConnection,
    file_id: i32,
) -> Result<FileRepetitionCounts, String> {
    // TODO: test
    let result = repetition::Entity::find()
        .select_only()
        .column(repetition::Column::State)
        .column_as(repetition::Column::State.count(), "count")
        .filter(repetition::Column::FileId.eq(file_id))
        .filter(repetition::Column::Due.lte(Utc::now().naive_utc()))
        .group_by(repetition::Column::State)
        .into_tuple::<(State, i32)>()
        .all(db)
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
