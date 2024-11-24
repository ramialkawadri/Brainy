use std::sync::Arc;

use crate::entities::repetition;
use crate::models::file_repetitions_count::FileRepetitionCounts;
use crate::services::repetition_service::RepetitionService;
use tauri::State;

#[tauri::command]
pub async fn get_study_repetitions_counts(
    repetition_service: State<'_, Arc<dyn RepetitionService + Sync + Send>>,
    file_id: i32,
) -> Result<FileRepetitionCounts, String> {
    repetition_service
        .get_study_repetitions_counts(file_id)
        .await
}

#[tauri::command()]
pub async fn get_file_repetitions(
    repetition_service: State<'_, Arc<dyn RepetitionService + Sync + Send>>,
    file_id: i32,
) -> Result<Vec<repetition::Model>, String> {
    repetition_service.get_file_repetitions(file_id).await
}
