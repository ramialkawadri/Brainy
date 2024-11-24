mod apis;
mod entities;
mod migration;
mod models;
mod repositories;
mod services;

use std::sync::Arc;

use repositories::{
    cell_repository::DefaultCellRepository, repetition_repository::DefaultRepetitionRepository,
    user_file_repository::DefaultUserFileRepository,
};
use sea_orm::{Database, DbErr};
use services::{
    cell_service::{CellService, DefaultCellService},
    repetition_service::{DefaultRepetitionService, RepetitionService},
    user_file_service::{DefaultUserFileServices, UserFileService},
};
use tauri::Manager;

use apis::*;

// TODO: make this into a configuration
const DATABASE_URL: &str = "sqlite:///home/ramikw/brainy/rami.db?mode=rwc";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), DbErr> {
    let conn = Database::connect(DATABASE_URL).await?;
    migration::setup_schema(&conn).await?;

    tauri::Builder::default()
        .setup(|app| {
            let conn = Arc::new(conn);
            let user_file_repository = Arc::new(DefaultUserFileRepository::new(conn.clone()));
            let cell_repository = Arc::new(DefaultCellRepository::new(conn.clone()));
            let repetition_repository = Arc::new(DefaultRepetitionRepository::new(conn.clone()));
            let repetition_service =
                Arc::new(DefaultRepetitionService::new(repetition_repository.clone()));

            app.manage::<Arc<dyn UserFileService + Sync + Send>>(Arc::new(
                DefaultUserFileServices::new(user_file_repository.clone()),
            ));
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
            get_file_cells,
            move_cell,
            update_cell,

            create_file,
            create_folder,
            delete_file,
            delete_folder,
            get_files,
            move_file,
            move_folder,
            rename_file,
            rename_folder,

            get_study_repetitions_counts,
            get_file_repetitions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
