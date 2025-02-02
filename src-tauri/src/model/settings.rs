use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub database_location: String,
    pub theme: Theme,
    pub zoom_percentage: f32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Theme {
    FollowSystem,
    Light,
    Dark,
}

impl Default for Theme {
    fn default() -> Self {
        Theme::FollowSystem
    }
}

impl Settings {
    pub fn new(database_location: String, theme: Theme, zoom_percentage: f32) -> Self {
        Self {
            database_location,
            theme,
            zoom_percentage,
        }
    }
}
