use std::sync::Arc;

use crate::{
    models::file_with_repetitions_count::FileWithRepetitionsCount,
    services::file_service::FileService,
};
use tauri::State;

#[tauri::command]
pub async fn get_files(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
) -> Result<Vec<FileWithRepetitionsCount>, String> {
    file_service.get_files().await
}

#[tauri::command]
pub async fn create_folder(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    path: String,
) -> Result<i32, String> {
    file_service.create_folder(path).await
}

#[tauri::command]
pub async fn create_file(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    path: String,
) -> Result<i32, String> {
    file_service.create_file(path).await
}

#[tauri::command]
pub async fn delete_file(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    file_id: i32,
) -> Result<(), String> {
    file_service.delete_file(file_id).await
}

#[tauri::command]
pub async fn delete_folder(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    folder_id: i32,
) -> Result<(), String> {
    file_service.delete_folder(folder_id).await
}

#[tauri::command]
pub async fn move_file(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    file_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    file_service.move_file(file_id, destination_folder_id).await
}

#[tauri::command]
pub async fn move_folder(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    folder_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    file_service
        .move_folder(folder_id, destination_folder_id)
        .await
}

#[tauri::command]
pub async fn rename_file(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    file_id: i32,
    new_name: String,
) -> Result<(), String> {
    file_service.rename_file(file_id, new_name).await
}

#[tauri::command]
pub async fn rename_folder(
    file_service: State<'_, Arc<dyn FileService + Sync + Send>>,
    folder_id: i32,
    new_name: String,
) -> Result<(), String> {
    file_service.rename_folder(folder_id, new_name).await
}
