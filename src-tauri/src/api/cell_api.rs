use crate::entity::cell::{self, CellType};
use crate::service::cell_services;
use crate::AppState;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_cells(
    state: State<'_, Mutex<AppState>>,
    file_id: i32,
) -> Result<Vec<cell::Model>, String> {
    let state = state.lock().await;
    cell_services::get_cells(&state.connection, file_id).await
}

#[tauri::command]
pub async fn create_cell(
    state: State<'_, Mutex<AppState>>,
    file_id: i32,
    content: String,
    cell_type: CellType,
    index: i32,
) -> Result<(), String> {
    let state = state.lock().await;
    cell_services::create_cell(&state.connection, file_id, content, cell_type, index).await
}

#[tauri::command]
pub async fn delete_cell(state: State<'_, Mutex<AppState>>, cell_id: i32) -> Result<(), String> {
    let state = state.lock().await;
    cell_services::delete_cell(&state.connection, cell_id).await
}

#[tauri::command]
pub async fn move_cell(
    state: State<'_, Mutex<AppState>>,
    cell_id: i32,
    new_index: i32,
) -> Result<(), String> {
    let state = state.lock().await;
    cell_services::move_cell(&state.connection, cell_id, new_index).await
}
