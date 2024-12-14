mod apis;
mod dto;
mod entities;
mod migration;
mod models;
mod services;

use std::sync::Arc;

use sea_orm::{Database, DbErr};
use services::{
    cell_service::{CellService, DefaultCellService},
    file_service::{DefaultFileService, FileService},
    repetition_service::{DefaultRepetitionService, RepetitionService},
    settings_service::{DefaultSettingsService, SettingsService},
};
use tauri::Manager;

use apis::*;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), DbErr> {
    let mut settings_service = DefaultSettingsService::default();
    settings_service.load_settings();
    let conn = Database::connect(format!(
        "sqlite:///{}?mode=rwc",
        settings_service.get_settings().database_location
    ))
    .await?;

    migration::setup_schema(&conn).await?;

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let conn = Arc::new(conn);
            let repetition_service = Arc::new(DefaultRepetitionService::new(conn.clone()));

            app.manage::<Arc<dyn FileService + Sync + Send>>(Arc::new(DefaultFileService::new(
                conn.clone(),
                repetition_service.clone(),
            )));
            app.manage::<Arc<dyn CellService + Sync + Send>>(Arc::new(DefaultCellService::new(
                conn.clone(),
                repetition_service.clone(),
            )));
            app.manage::<Arc<dyn RepetitionService + Sync + Send>>(repetition_service);
            app.manage::<Arc<Mutex<dyn SettingsService + Sync + Send>>>(Arc::new(Mutex::new(
                settings_service,
            )));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Cells
            create_cell,
            delete_cell,
            get_file_cells_ordered_by_index,
            move_cell,
            update_cell,
            // Files & Folders
            get_cells_for_files,
            create_file,
            create_folder,
            delete_file,
            delete_folder,
            get_files,
            move_file,
            move_folder,
            rename_file,
            rename_folder,
            // Repetitions
            get_study_repetition_counts,
            get_file_repetitions,
            update_repetition,
            get_repetitions_for_files,
            // Settings
            get_settings,
            update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
