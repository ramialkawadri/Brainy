use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub database_location: String,
    // TODO: change from theme to Mode!
    pub theme: Theme,
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
    pub fn new(database_location: String, theme: Theme) -> Self {
        Self { database_location, theme }
    }
}
