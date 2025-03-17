use crate::{dto::review_statistics::ReviewStatistics, entity::{repetition, review::Rating}, service::review_service};
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

#[tauri::command]
pub async fn register_review(
    db_conn: State<'_, Mutex<DbConn>>,
    new_repetition: repetition::Model,
    rating: Rating,
    study_time: i32,
) -> Result<(), String> {
    let db_conn = db_conn.lock().await;
    review_service::register_review(&db_conn, new_repetition, rating, study_time).await
}
