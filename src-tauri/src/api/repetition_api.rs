use std::sync::Arc;

use crate::entity::repetition;
use crate::model::file_repetitions_count::FileRepetitionCounts;
use crate::service::repetition_service::RepetitionService;
use tauri::State;

/// Returns the count of repetitions ready for study, i.e. their due is less
/// than or equal to now.
#[tauri::command]
pub async fn get_study_repetition_counts(
    repetition_service: State<'_, Arc<dyn RepetitionService + Sync + Send>>,
    file_id: i32,
) -> Result<FileRepetitionCounts, String> {
    repetition_service
        .get_study_repetition_counts(file_id)
        .await
}

#[tauri::command]
pub async fn get_file_repetitions(
    repetition_service: State<'_, Arc<dyn RepetitionService + Sync + Send>>,
    file_id: i32,
) -> Result<Vec<repetition::Model>, String> {
    repetition_service.get_file_repetitions(file_id).await
}

#[tauri::command]
pub async fn update_repetition(
    repetition_service: State<'_, Arc<dyn RepetitionService + Sync + Send>>,
    repetition: repetition::Model,
) -> Result<(), String> {
    repetition_service.update_repetition(repetition).await
}

#[tauri::command]
pub async fn get_repetitions_for_files(
    repetition_service: State<'_, Arc<dyn RepetitionService + Sync + Send>>,
    file_ids: Vec<i32>,
) -> Result<Vec<repetition::Model>, String> {
    repetition_service.get_repetitions_for_files(file_ids).await
}
