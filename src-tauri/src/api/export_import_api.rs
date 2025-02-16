use crate::service::export_import_service;
use sea_orm::DbConn;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn export_item(
    db_conn: State<'_, Mutex<DbConn>>,
    item_id: i32,
    export_path: String
) -> Result<(), String> {
    let db_conn = db_conn.lock().await;
    export_import_service::export_item(&db_conn, item_id, export_path).await
}
