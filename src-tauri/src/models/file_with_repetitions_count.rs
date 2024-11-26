use serde::{Deserialize, Serialize};

use super::file_repetitions_count::FileRepetitionCounts;

#[derive(Clone, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
// TODO: use this
pub struct FileWithRepetitionsCount {
    pub id: i32,
    pub path: String,
    pub is_folder: bool,
    pub repetition_counts: FileRepetitionCounts,
}
