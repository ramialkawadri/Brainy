use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewStatistics {
    pub number_of_reviews: u64,
    pub total_time: i32,
}
