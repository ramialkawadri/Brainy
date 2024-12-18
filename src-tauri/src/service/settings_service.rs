use dirs;
use sea_orm::DbConn;
use std::{
    fs::{self, File},
    path::PathBuf,
};
use tokio::sync::Mutex;

use crate::{
    dto::update_settings_dto::UpdateSettingsRequest, model::settings::Settings,
    util::database_util::load_database,
};

pub fn init_settings() {
    let settings_path = get_settings_path();
    if !settings_path.exists() {
        let settings = Settings::new(settings_path.to_str().unwrap().into());
        write_settings_to_disk(&settings);
    }
}

pub async fn update_settings(new_settings: UpdateSettingsRequest, db_conn: &Mutex<DbConn>) {
    let mut settings = get_settings();
    if let Some(database_location) = new_settings.database_location {
        let mut db_conn = db_conn.lock().await;
        *db_conn = load_database(&database_location).await;
        settings.database_location = database_location;
    }
    write_settings_to_disk(&settings);
}

fn write_settings_to_disk(settings: &Settings) {
    fs::write(
        get_settings_path(),
        serde_json::to_string(settings).unwrap(),
    )
    .expect("Cannot write to config file");
}

pub fn get_settings() -> Settings {
    let settings_path = get_settings_path();
    let file = File::open(settings_path).expect("Cannot read config file");
    serde_json::from_reader(file).expect("Cannot parse settings!")
}

fn get_settings_path() -> PathBuf {
    let dir_path = dirs::config_dir()
        .expect("No config directory is found on your system!")
        .join("Brainy");
    fs::create_dir_all(dir_path.clone()).expect("Cannot create config directory!");

    dir_path.join("config.json")
}
