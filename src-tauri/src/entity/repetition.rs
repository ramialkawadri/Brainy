use sea_orm::entity::prelude::*;
use serde::ser::SerializeStruct;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum State {
    #[sea_orm(string_value = "New")]
    New,
    #[sea_orm(string_value = "Learning")]
    Learning,
    #[sea_orm(string_value = "Relearning")]
    Relearning,
    #[sea_orm(string_value = "Review")]
    Review,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "cell")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub file_id: i32,
    pub cell_id: i32,
    pub due: DateTime,
    pub stability: f32,
    pub difficulty: f32,
    pub elapsed_days: i32,
    pub scheduled_days: i32,
    pub reps: i32,
    pub lapses: i32,
    pub state: State,
    pub last_review: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {
    File,
    Cell,
}

impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        match self {
            Self::File => Entity::belongs_to(super::user_file::Entity)
                .from(Column::FileId)
                .to(super::user_file::Column::Id)
                .into(),
            Self::Cell => Entity::belongs_to(super::cell::Entity)
                .from(Column::CellId)
                .to(super::cell::Column::Id)
                .into(),
        }
    }
}

impl Related<super::user_file::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::File.def()
    }
}

impl Related<super::cell::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Cell.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

impl Serialize for Model {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut state = serializer.serialize_struct("Cell", 12)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("fileId", &self.file_id)?;
        state.serialize_field("cellId", &self.cell_id)?;
        state.serialize_field("due", &self.due)?;
        state.serialize_field("stability", &self.stability)?;
        state.serialize_field("difficulty", &self.difficulty)?;
        state.serialize_field("elapsedDays", &self.elapsed_days)?;
        state.serialize_field("scheduledDays", &self.scheduled_days)?;
        state.serialize_field("reps", &self.reps)?;
        state.serialize_field("lapses", &self.lapses)?;
        state.serialize_field("state", &self.state)?;
        state.serialize_field("lastReview", &self.last_review)?;
        state.end()
    }
}
