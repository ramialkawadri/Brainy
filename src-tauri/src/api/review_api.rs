use crate::{dto::review_statistics::ReviewStatistics, service::review_service};
use sea_orm::DbConn;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_todays_review_statistics(
    db_conn: State<'_, Mutex<DbConn>>,
) -> Result<ReviewStatistics, String> {
    let db_conn = db_conn.lock().await;
    review_service::get_todays_review_statistics(&db_conn).await
}
