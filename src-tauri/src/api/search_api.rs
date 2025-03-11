use crate::{dto::search_result::SearchResult, service::search_service};
use sea_orm::DbConn;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn search_cells(
    db_conn: State<'_, Mutex<DbConn>>,
    search_text: String,
) -> Result<SearchResult, String> {
    let db_conn = db_conn.lock().await;
    search_service::search_cells(&db_conn, &search_text).await
}
