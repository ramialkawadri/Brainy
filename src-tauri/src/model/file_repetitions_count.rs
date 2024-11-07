use serde::Serialize;

#[derive(Serialize)]
pub struct FileRepetitionCounts {
    new_count: i32,
    learning_count: i32,
    relearning_count: i32,
    review_count: i32,
}
