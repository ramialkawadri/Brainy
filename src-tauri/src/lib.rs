mod api;
mod entity;
mod migration;
mod model;
mod service;

use std::sync::Arc;

use sea_orm::{Database, DatabaseConnection, DbErr};
use service::{
    cell_service::{CellService, DefaultCellService},
    user_file_service::{DefaultUserFileServices, UserFileService},
};
use tauri::Manager;
use tokio::sync::Mutex;

use api::*;

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
            let arc = Arc::new(conn);
            app.manage(Mutex::new(AppState {
                connection: arc.clone(),
            }));
            app.manage::<Box<dyn UserFileService + Sync + Send>>(Box::new(
                DefaultUserFileServices::new(arc.clone()),
            ));
            app.manage::<Box<dyn CellService + Sync + Send>>(Box::new(DefaultCellService::new(
                arc.clone(),
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
