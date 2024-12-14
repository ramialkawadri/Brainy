use std::sync::Arc;

use crate::entity::cell::{self, CellType};
use crate::service::cell_service::CellService;
use tauri::State;

#[tauri::command]
pub async fn get_file_cells_ordered_by_index(
    cell_service: State<'_, Arc<dyn CellService + Sync + Send>>,
    file_id: i32,
) -> Result<Vec<cell::Model>, String> {
    cell_service.get_file_cells_ordered_by_index(file_id).await
}

#[tauri::command]
pub async fn create_cell(
    cell_service: State<'_, Arc<dyn CellService + Sync + Send>>,
    file_id: i32,
    content: String,
    cell_type: CellType,
    index: i32,
) -> Result<i32, String> {
    cell_service
        .create_cell(file_id, content, cell_type, index)
        .await
}

#[tauri::command]
pub async fn delete_cell(
    cell_service: State<'_, Arc<dyn CellService + Sync + Send>>,
    cell_id: i32,
) -> Result<(), String> {
    cell_service.delete_cell(cell_id).await
}

#[tauri::command]
pub async fn move_cell(
    cell_service: State<'_, Arc<dyn CellService + Sync + Send>>,
    cell_id: i32,
    new_index: i32,
) -> Result<(), String> {
    cell_service.move_cell(cell_id, new_index).await
}

#[tauri::command]
pub async fn update_cell(
    cell_service: State<'_, Arc<dyn CellService + Sync + Send>>,
    cell_id: i32,
    content: String,
) -> Result<(), String> {
    cell_service.update_cell_content(cell_id, content).await
}

#[tauri::command]
pub async fn get_cells_for_files(
    cell_service: State<'_, Arc<dyn CellService + Sync + Send>>,
    file_ids: Vec<i32>,
) -> Result<Vec<cell::Model>, String> {
    cell_service.get_cells_for_files(file_ids).await
}
