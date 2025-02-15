use serde::{Deserialize, Serialize};

use crate::model::settings::Theme;

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCellRequest {
    pub cell_id: i32,
    pub content: String,
}
