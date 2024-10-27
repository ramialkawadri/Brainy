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
    // TODO: create recusively
    let state = state.lock().await;
    return user_file_service::create_folder(&state.connection, path).await;
}

#[tauri::command]
pub async fn create_file(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    let state = state.lock().await;
    return user_file_service::create_file(&state.connection, path).await;
}
