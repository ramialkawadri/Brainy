use crate::entity::cell::{self, CellType};

use sea_orm::DatabaseConnection;
use sea_orm::{entity::*, query::*};

pub async fn get_cells(
    db: &DatabaseConnection,
    file_id: i32,
) -> Result<Vec<cell::Model>, String> {
    let result = cell::Entity::find()
        .filter(cell::Column::FileId.eq(file_id))
        .all(db)
        .await;
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn create_cell(
    db: &DatabaseConnection,
    file_id: i32,
    content: String,
    cell_type: CellType,
) -> Result<(), String> {
    let active_model = cell::ActiveModel {
        file_id: Set(file_id),
        cell_type: Set(cell_type),
        content: Set(content),
        ..Default::default()
    };
    let result = cell::Entity::insert(active_model).exec(db).await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}
