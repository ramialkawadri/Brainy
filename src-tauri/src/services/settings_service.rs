use async_trait::async_trait;
use dirs;
use std::{
    fs::{self, File},
    path::PathBuf,
};

use crate::{dto::update_settings_request::UpdateSettingsRequest, models::settings::Settings};

#[async_trait]
pub trait SettingsService {
    fn load_settings(&mut self);
    fn get_settings(&self) -> &Settings;
    fn update_settings(&mut self, new_settings: UpdateSettingsRequest);
}

#[derive(Default)]
pub struct DefaultSettingsService {
    settings_path: Option<PathBuf>,
    settings: Option<Settings>,
}

impl DefaultSettingsService {
    fn get_mut_settings(&mut self) -> &mut Settings {
        self.settings.as_mut().expect("Settings not loaded!")
    }

    fn write_settings_to_disk(&self) {
        fs::write(
            self.settings_path.as_ref().unwrap(),
            serde_json::to_string(self.get_settings()).unwrap(),
        )
        .expect("Cannot write to config file");
    }
}

// TODO: test
#[async_trait]
impl SettingsService for DefaultSettingsService {
    fn load_settings(&mut self) {
        let dir_path = dirs::config_dir()
            .expect("No config directory is found on your system!")
            .join("Brainy");
        fs::create_dir_all(dir_path.clone()).expect("Cannot create config directory!");

        self.settings_path = Some(dir_path.join("config.json"));

        if self.settings_path.as_ref().unwrap().exists() {
            let file =
                File::open(self.settings_path.as_ref().unwrap()).expect("Cannot read config file");
            let settings: Settings = serde_json::from_reader(file).expect("Cannot parse settings!");
            self.settings = Some(settings);
            return;
        }
        let settings = Settings::new(dir_path.join("brainy.db").to_str().unwrap().into());
        self.settings = Some(settings);
        self.write_settings_to_disk();
    }

    fn get_settings(&self) -> &Settings {
        &self.settings.as_ref().expect("Settings not loaded!")
    }

    // TODO: connect this to front end
    fn update_settings(&mut self, new_settings: UpdateSettingsRequest) {
        if let Some(database_location) = new_settings.database_location {
            self.get_mut_settings().database_location = database_location;
        }
        self.write_settings_to_disk();
    }
}
