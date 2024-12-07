use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingsRequest {
    pub database_location: Option<String>,
}
