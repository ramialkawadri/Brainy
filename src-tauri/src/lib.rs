mod apis;
mod entities;
mod migration;
mod models;
mod repositories;
mod services;

use std::sync::Arc;

use dirs;
use models::settings::Settings;
use repositories::{
    cell_repository::DefaultCellRepository, file_repository::DefaultFileRepository,
    repetition_repository::DefaultRepetitionRepository,
};
use sea_orm::{Database, DbErr};
use services::{
    cell_service::{CellService, DefaultCellService},
    file_service::{DefaultFileServices, FileService},
    repetition_service::{DefaultRepetitionService, RepetitionService},
};
use tauri::Manager;

use apis::*;
use std::fs::{self, File};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), DbErr> {
    let settings = get_settings().await;
    let conn =
        Database::connect(format!("sqlite:///{}?mode=rwc", settings.database_location)).await?;
    migration::setup_schema(&conn).await?;

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let conn = Arc::new(conn);
            let file_repository = Arc::new(DefaultFileRepository::new(conn.clone()));
            let cell_repository = Arc::new(DefaultCellRepository::new(conn.clone()));
            let repetition_repository = Arc::new(DefaultRepetitionRepository::new(conn.clone()));
            let repetition_service =
                Arc::new(DefaultRepetitionService::new(repetition_repository.clone()));

            app.manage::<Arc<dyn FileService + Sync + Send>>(Arc::new(DefaultFileServices::new(
                file_repository.clone(),
                repetition_repository.clone(),
            )));
            app.manage::<Arc<dyn CellService + Sync + Send>>(Arc::new(DefaultCellService::new(
                cell_repository.clone(),
                repetition_service.clone(),
            )));
            app.manage::<Arc<dyn RepetitionService + Sync + Send>>(repetition_service);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_cell,
            delete_cell,
            get_file_cells_ordered_by_index,
            move_cell,
            update_cell,
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
            get_study_repetition_counts,
            get_file_repetitions,
            update_repetition,
            get_repetitions_for_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

pub async fn get_settings() -> Settings {
    let dir_path = dirs::config_dir()
        .expect("No config directory is found on your system!")
        .join("Brainy");
    fs::create_dir_all(dir_path.clone()).expect("Cannot create config directory!");

    let config_file_path = dir_path.join("config.json");
    if config_file_path.exists() {
        let file = File::open(config_file_path).expect("Cannot read config file");
        let settings: Settings = serde_json::from_reader(file).expect("Cannot parse settings!");
        return settings;
    }
    let settings = Settings::new(dir_path.join("brainy.db").to_str().unwrap().into());
    fs::write(config_file_path, serde_json::to_string(&settings).unwrap())
        .expect("Cannot write to config file");
    return settings;
}
