use sea_orm::entity::prelude::*;
use serde::ser::{Serialize, SerializeStruct};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "user_file")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub path: String,
    pub is_folder: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

impl Serialize for Model {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer {
            let mut state = serializer.serialize_struct("UserFile", 3)?;
            state.serialize_field("id", &self.id)?;
            state.serialize_field("path", &self.path)?;
            state.serialize_field("isFolder", &self.is_folder)?;
            state.end()
    }
}
