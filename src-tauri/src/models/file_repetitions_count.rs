use serde::ser::SerializeStruct;
use serde::Serialize;

#[derive(Default)]
pub struct FileRepetitionCounts {
    pub new: i32,
    pub learning: i32,
    pub relearning: i32,
    pub review: i32,
}

impl Serialize for FileRepetitionCounts {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut state = serializer.serialize_struct("Cell", 4)?;
        state.serialize_field("new", &self.new)?;
        state.serialize_field("learning", &self.learning)?;
        state.serialize_field("relearning", &self.relearning)?;
        state.serialize_field("review", &self.review)?;
        state.end()
    }
}
