use serde::{Deserialize, Serialize};

use crate::entity::cell;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportedItem {
    pub path: String,
    pub item_type: ExportedItemType,
    pub cells: Option<Vec<cell::Model>>,
    pub children: Option<Vec<ExportedItem>>,
}

impl ExportedItem {
    pub fn new(
        path: String,
        item_type: ExportedItemType,
        cells: Option<Vec<cell::Model>>,
        children: Option<Vec<ExportedItem>>,
    ) -> Self {
        Self {
            path,
            item_type,
            cells,
            children,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExportedItemType {
    File,
    Folder,
}
