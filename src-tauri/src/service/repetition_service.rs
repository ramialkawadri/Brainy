use sea_orm::DatabaseConnection;
use sea_orm::{entity::*, query::*};

use crate::entity::cell::CellType;
use crate::entity::repetition;

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

    let mut repetitions_to_insert: Vec<repetition::ActiveModel> = vec!();
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
