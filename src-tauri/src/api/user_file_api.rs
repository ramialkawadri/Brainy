use crate::entity::user_file;
use crate::service::user_file_service;
use crate::AppState;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_files(state: State<'_, Mutex<AppState>>) -> Result<Vec<user_file::Model>, String> {
    let state = state.lock().await;
    return user_file_service::get_user_files(&state.connection).await;
}

#[tauri::command]
pub async fn create_folder(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    let state = state.lock().await;
    return user_file_service::create_folder(&state.connection, path).await;
}

#[tauri::command]
pub async fn create_file(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    let state = state.lock().await;
    return user_file_service::create_file(&state.connection, path).await;
}

#[tauri::command]
pub async fn delete_file(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    let state = state.lock().await;
    return user_file_service::delete_file(&state.connection, path).await;
}

#[tauri::command]
pub async fn delete_folder(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    let state = state.lock().await;
    return user_file_service::delete_folder(&state.connection, path).await;
}

#[tauri::command]
pub async fn move_file(
    state: State<'_, Mutex<AppState>>,
    path: String,
    destination: String,
) -> Result<String, String> {
    let state = state.lock().await;
    return user_file_service::move_file(&state.connection, path, destination).await;
}

#[tauri::command]
pub async fn move_folder(
    state: State<'_, Mutex<AppState>>,
    path: String,
    destination: String,
) -> Result<String, String> {
    let state = state.lock().await;
    return user_file_service::move_folder(&state.connection, path, destination).await;
}

#[tauri::command]
pub async fn rename_file(
    state: State<'_, Mutex<AppState>>,
    path: String,
    new_name: String,
) -> Result<String, String> {
    let state = state.lock().await;
    return user_file_service::rename_file(&state.connection, path, new_name).await;
}

#[tauri::command]
pub async fn rename_folder(
    state: State<'_, Mutex<AppState>>,
    path: String,
    new_name: String,
) -> Result<String, String> {
    let state = state.lock().await;
    return user_file_service::rename_folder(&state.connection, path, new_name).await;
}
