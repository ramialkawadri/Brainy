mod api;
mod dto;
mod entity;
mod migration;
mod model;
mod service;

use sea_orm::{Database, DbErr};
use service::settings_service;
use tauri::Manager;

use api::*;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), DbErr> {
    settings_service::init_settings();
    let db_conn = Database::connect(format!(
        "sqlite:///{}?mode=rwc",
        settings_service::get_settings().database_location
    ))
    .await?;

    migration::setup_schema(&db_conn).await?;

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            app.manage(Mutex::new(db_conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Cells
            create_cell,
            delete_cell,
            get_file_cells_ordered_by_index,
            move_cell,
            update_cell,
            get_cells_for_files,
            // Files & Folders
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
