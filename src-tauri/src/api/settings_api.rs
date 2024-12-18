use crate::{
    dto::update_settings_dto::UpdateSettingsRequest, model::settings::Settings,
    service::settings_service,
};

#[tauri::command]
pub async fn get_settings() -> Result<Settings, ()> {
    Ok(settings_service::get_settings())
}

#[tauri::command]
pub async fn update_settings(new_settings: UpdateSettingsRequest) -> Result<(), String> {
    settings_service::update_settings(new_settings);
    Ok(())
}
