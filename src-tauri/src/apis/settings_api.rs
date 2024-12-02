use tauri::State;

use crate::models::settings::Settings;

#[tauri::command]
pub async fn get_settings(settings: State<'_, Settings>) -> Result<Settings, ()> {
    Ok((*settings).clone())
}

// TODO: implement save button
// #[tauri::command]
// pub async fn save_settings()
