use sea_orm::entity::prelude::*;
use serde::ser::SerializeStruct;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Default)]
#[sea_orm(table_name = "user_file")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub path: String,
    pub is_folder: bool,
}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {
    Cell,
    Repetition,
}

impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        match self {
            Self::Cell => Entity::has_many(super::cell::Entity).into(),
            Self::Repetition => Entity::has_many(super::repetition::Entity).into(),
        }
    }
}

impl Related<super::cell::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Cell.def()
    }
}

impl Related<super::repetition::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Repetition.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

impl Serialize for Model {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut state = serializer.serialize_struct("UserFile", 3)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("path", &self.path)?;
        state.serialize_field("isFolder", &self.is_folder)?;
        state.end()
    }
}
