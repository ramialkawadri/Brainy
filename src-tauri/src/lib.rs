mod commands;
mod entity;
mod migration;

use sea_orm::{Database, DatabaseConnection, DbErr};
use tauri::Manager;
use tokio::sync::Mutex;

use commands::*;

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
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_files,
            create_folder,
            create_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
