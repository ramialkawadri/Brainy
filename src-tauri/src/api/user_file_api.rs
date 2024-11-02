use crate::entity::user_file;
use crate::service::user_file_service;
use crate::AppState;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_files(state: State<'_, Mutex<AppState>>) -> Result<Vec<user_file::Model>, String> {
    let state = state.lock().await;
    user_file_service::get_user_files(&state.connection).await
}

#[tauri::command]
pub async fn create_folder(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::create_folder(&state.connection, path).await
}

#[tauri::command]
pub async fn create_file(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::create_file(&state.connection, path).await
}

#[tauri::command]
pub async fn delete_file(state: State<'_, Mutex<AppState>>, file_id: i32) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::delete_file(&state.connection, file_id).await
}

#[tauri::command]
pub async fn delete_folder(
    state: State<'_, Mutex<AppState>>,
    folder_id: i32,
) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::delete_folder(&state.connection, folder_id).await
}

#[tauri::command]
pub async fn move_file(
    state: State<'_, Mutex<AppState>>,
    file_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::move_file(&state.connection, file_id, destination_folder_id).await
}

#[tauri::command]
pub async fn move_folder(
    state: State<'_, Mutex<AppState>>,
    folder_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::move_folder(&state.connection, folder_id, destination_folder_id).await
}

#[tauri::command]
pub async fn rename_file(
    state: State<'_, Mutex<AppState>>,
    file_id: i32,
    new_name: String,
) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::rename_file(&state.connection, file_id, new_name).await
}

#[tauri::command]
pub async fn rename_folder(
    state: State<'_, Mutex<AppState>>,
    folder_id: i32,
    new_name: String,
) -> Result<(), String> {
    let state = state.lock().await;
    user_file_service::rename_folder(&state.connection, folder_id, new_name).await
}
