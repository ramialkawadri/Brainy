use crate::entities::cell::{self, CellType};
use crate::services::cell_service::CellService;
use tauri::State;

#[tauri::command]
pub async fn get_cells(
    cell_service: State<'_, Box<dyn CellService + Sync + Send>>,
    file_id: i32,
) -> Result<Vec<cell::Model>, String> {
    cell_service.get_cells(file_id).await
}

#[tauri::command]
pub async fn create_cell(
    cell_service: State<'_, Box<dyn CellService + Sync + Send>>,
    file_id: i32,
    content: String,
    cell_type: CellType,
    index: i32,
) -> Result<(), String> {
    cell_service
        .create_cell(file_id, content, cell_type, index)
        .await
}

#[tauri::command]
pub async fn delete_cell(
    cell_service: State<'_, Box<dyn CellService + Sync + Send>>,
    cell_id: i32,
) -> Result<(), String> {
    cell_service.delete_cell(cell_id).await
}

#[tauri::command]
pub async fn move_cell(
    cell_service: State<'_, Box<dyn CellService + Sync + Send>>,
    cell_id: i32,
    new_index: i32,
) -> Result<(), String> {
    cell_service.move_cell(cell_id, new_index).await
}

#[tauri::command]
pub async fn update_cell(
    cell_service: State<'_, Box<dyn CellService + Sync + Send>>,
    cell_id: i32,
    content: String,
) -> Result<(), String> {
    cell_service.update_cell(cell_id, content).await
}
