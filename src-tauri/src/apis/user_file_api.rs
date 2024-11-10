use crate::{entities::user_file, services::user_file_service::UserFileService};
use tauri::State;

#[tauri::command]
pub async fn get_files(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
) -> Result<Vec<user_file::Model>, String> {
    user_file_service.get_user_files().await
}

#[tauri::command]
pub async fn create_folder(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    path: String,
) -> Result<(), String> {
    user_file_service.create_folder(path).await
}

#[tauri::command]
pub async fn create_file(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    path: String,
) -> Result<(), String> {
    user_file_service.create_file(path).await
}

#[tauri::command]
pub async fn delete_file(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    file_id: i32,
) -> Result<(), String> {
    user_file_service.delete_file(file_id).await
}

#[tauri::command]
pub async fn delete_folder(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    folder_id: i32,
) -> Result<(), String> {
    user_file_service.delete_folder(folder_id).await
}

#[tauri::command]
pub async fn move_file(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    file_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    user_file_service
        .move_file(file_id, destination_folder_id)
        .await
}

#[tauri::command]
pub async fn move_folder(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    folder_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    user_file_service
        .move_folder(folder_id, destination_folder_id)
        .await
}

#[tauri::command]
pub async fn rename_file(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    file_id: i32,
    new_name: String,
) -> Result<(), String> {
    user_file_service.rename_file(file_id, new_name).await
}

#[tauri::command]
pub async fn rename_folder(
    user_file_service: State<'_, Box<dyn UserFileService + Sync + Send>>,
    folder_id: i32,
    new_name: String,
) -> Result<(), String> {
    user_file_service.rename_folder(folder_id, new_name).await
}
