use serde::{Deserialize, Serialize};

use crate::entity::{cell, repetition};

#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub cells: Vec<cell::Model>,
    pub repetitions: Vec<repetition::Model>,
}
