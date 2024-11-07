use crate::model::file_repetitions_count::FileRepetitionCounts;
use crate::service::repetition_service;
use crate::AppState;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_file_repetitions_count(
    state: State<'_, Mutex<AppState>>,
    file_id: i32,
) -> Result<FileRepetitionCounts, String> {
    let state = state.lock().await;
    repetition_service::get_file_repetitions_count(&state.connection, file_id).await
}
