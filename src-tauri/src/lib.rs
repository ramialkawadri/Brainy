mod api;
mod entity;
mod migration;
mod service;

use sea_orm::{Database, DatabaseConnection, DbErr};
use tauri::Manager;
use tokio::sync::Mutex;

use api::*;

// TODO: make this into a configuration
const DATABASE_URL: &str = "sqlite:///home/ramikw/brainy/rami.db?mode=rwc";

pub struct AppState {
    connection: DatabaseConnection,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), DbErr> {
    let conn = Database::connect(DATABASE_URL).await?;
    migration::setup_schema(&conn).await?;

    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState { connection: conn }));
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
