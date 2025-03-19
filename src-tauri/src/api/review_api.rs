use crate::{
    dto::review_statistics::ReviewStatistics,
    entity::{repetition, review::Rating},
    service::review_service,
};
use chrono::NaiveDate;
use sea_orm::DbConn;
use tauri::State;
use tokio::sync::Mutex;
use std::collections::HashMap;

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

#[tauri::command]
pub async fn get_review_counts_for_every_day_of_year(
    db_conn: State<'_, Mutex<DbConn>>,
) -> Result<HashMap<NaiveDate, i32>, String> {
    let db_conn = db_conn.lock().await;
    review_service::get_review_counts_for_every_day_of_year(&db_conn).await
}
