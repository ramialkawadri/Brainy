use sea_orm::entity::prelude::*;
use serde::ser::SerializeStruct;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum CellType {
    #[sea_orm(string_value = "FlashCard")]
    FlashCard,
    #[sea_orm(string_value = "Note")]
    Note,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "cell")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub file_id: i32,
    pub index: i32,
    pub content: String,
    pub cell_type: CellType,
}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {
    File,
}

impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        match self {
            Self::File => Entity::belongs_to(super::user_file::Entity)
                .from(Column::FileId)
                .to(super::user_file::Column::Id)
                .into(),
        }
    }
}

impl Related<super::user_file::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::File.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

impl Serialize for Model {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer {
            let mut state = serializer.serialize_struct("Cell", 5)?;
            state.serialize_field("id", &self.id)?;
            state.serialize_field("fileId", &self.file_id)?;
            state.serialize_field("index", &self.index)?;
            state.serialize_field("content", &self.content)?;
            state.serialize_field("cellType", &self.cell_type)?;
            state.end()
    }
}
