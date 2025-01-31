use serde::{Deserialize, Serialize};

use crate::model::settings::Theme;

#[derive(Default, Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingsRequest {
    pub database_location: Option<String>,
    pub theme: Option<Theme>,
}
