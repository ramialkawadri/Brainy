use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub database_location: String,
}

impl Settings {
    pub fn new(database_location: String) -> Self {
        Self { database_location }
    }
}
