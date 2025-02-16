use serde::{Deserialize, Serialize};

use crate::entity::cell;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportedFileFolder {
    pub path: String,
    pub item_type: ExportedItemType,
    pub cells: Option<Vec<cell::Model>>,
    pub children: Option<Vec<ExportedItemType>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExportedItemType {
    File,
    Folder,
}
