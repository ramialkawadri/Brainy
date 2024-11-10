mod apis;
mod entities;
mod migration;
mod models;
mod repositories;
mod services;

use std::sync::Arc;

use repositories::user_file_repository::DefaultUserFileRepository;
use sea_orm::{Database, DatabaseConnection, DbErr};
use services::{
    cell_service::{CellService, DefaultCellService},
    user_file_service::{DefaultUserFileServices, UserFileService},
};
use tauri::Manager;
use tokio::sync::Mutex;

use apis::*;

// TODO: make this into a configuration
const DATABASE_URL: &str = "sqlite:///home/ramikw/brainy/rami.db?mode=rwc";

pub struct AppState {
    connection: Arc<DatabaseConnection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), DbErr> {
    let conn = Database::connect(DATABASE_URL).await?;
    migration::setup_schema(&conn).await?;

    tauri::Builder::default()
        .setup(|app| {
            let conn = Arc::new(conn);
            let user_file_repository = Arc::new(DefaultUserFileRepository::new(conn.clone()));

            app.manage(Mutex::new(AppState {
                connection: conn.clone(),
            }));
            app.manage::<Box<dyn UserFileService + Sync + Send>>(Box::new(
                DefaultUserFileServices::new(user_file_repository.clone()),
            ));
            app.manage::<Box<dyn CellService + Sync + Send>>(Box::new(DefaultCellService::new(
                conn.clone(),
            )));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_cell,
            delete_cell,
            get_cells,
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

            get_file_repetitions_count,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
