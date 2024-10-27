// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sea_orm::DbErr;

#[tokio::main]
async fn main() -> Result<(), DbErr> {
    brainy_app_lib::run().await?;
    Ok(())
}
