use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub database_location: String,
    pub dark_theme: bool,
}

impl Settings {
    pub fn new(database_location: String, dark_theme: bool) -> Self {
        Self { database_location, dark_theme }
    }
}
