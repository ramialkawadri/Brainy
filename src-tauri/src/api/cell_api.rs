use crate::{
    entity::cell::{self, CellType},
    service::cell_service,
};
use sea_orm::DbConn;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_file_cells_ordered_by_index(
    db_conn: State<'_, Mutex<DbConn>>,
    file_id: i32,
) -> Result<Vec<cell::Model>, String> {
    let db_conn = db_conn.lock().await;
    cell_service::get_file_cells_ordered_by_index(&db_conn, file_id).await
}

#[tauri::command]
pub async fn create_cell(
    db_conn: State<'_, Mutex<DbConn>>,
    file_id: i32,
    content: String,
    cell_type: CellType,
    index: i32,
) -> Result<i32, String> {
    let db_conn = db_conn.lock().await;
    cell_service::create_cell(&db_conn, file_id, content, cell_type, index).await
}

#[tauri::command]
pub async fn delete_cell(db_conn: State<'_, Mutex<DbConn>>, cell_id: i32) -> Result<(), String> {
    let db_conn = db_conn.lock().await;
    cell_service::delete_cell(&db_conn, cell_id).await
}

#[tauri::command]
pub async fn move_cell(
    db_conn: State<'_, Mutex<DbConn>>,
    cell_id: i32,
    new_index: i32,
) -> Result<(), String> {
    let db_conn = db_conn.lock().await;
    cell_service::move_cell(&db_conn, cell_id, new_index).await
}

#[tauri::command]
pub async fn update_cell_content(
    db_conn: State<'_, Mutex<DbConn>>,
    cell_id: i32,
    content: String,
) -> Result<(), String> {
    let db_conn = db_conn.lock().await;
    cell_service::update_cell_content(&db_conn, cell_id, content).await
}

#[tauri::command]
pub async fn get_cells_for_files(
    db_conn: State<'_, Mutex<DbConn>>,
    file_ids: Vec<i32>,
) -> Result<Vec<cell::Model>, String> {
    let db_conn = db_conn.lock().await;
    cell_service::get_cells_for_files(&db_conn, file_ids).await
}
