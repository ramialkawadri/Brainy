use std::sync::Arc;

use tauri::State;
use tokio::sync::Mutex;

use crate::{
    dto::update_settings_dto::UpdateSettingsRequest, model::settings::Settings, service::settings_service::SettingsService
};

#[tauri::command]
pub async fn get_settings(
    settings_service: State<'_, Arc<Mutex<dyn SettingsService + Sync + Send>>>,
) -> Result<Settings, ()> {
    let settings_service = settings_service.lock().await;
    Ok(settings_service.get_settings().clone())
}

#[tauri::command]
pub async fn update_settings(
    settings_service: State<'_, Arc<Mutex<dyn SettingsService + Sync + Send>>>,
    new_settings: UpdateSettingsRequest,
) -> Result<(), String> {
    let mut settings_service = settings_service.lock().await;
    settings_service.update_settings(new_settings);
    Ok(())
}
