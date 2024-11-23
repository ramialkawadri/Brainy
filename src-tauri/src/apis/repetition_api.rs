use std::sync::Arc;

use crate::models::file_repetitions_count::FileRepetitionCounts;
use crate::services::repetition_service::RepetitionService;
use tauri::State;

#[tauri::command]
pub async fn get_study_repetitions(
    repetition_service: State<'_, Arc<dyn RepetitionService + Sync + Send>>,
    file_id: i32,
) -> Result<FileRepetitionCounts, String> {
    repetition_service.get_study_repetitions(file_id).await
}
