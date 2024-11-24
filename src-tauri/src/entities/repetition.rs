use sea_orm::entity::prelude::*;
use sea_orm::entity::*;
use sea_orm::sqlx::types::chrono::Utc;
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

impl Default for State {
    fn default() -> Self {
        State::New
    }
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[sea_orm(table_name = "repetition")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub file_id: i32,
    pub cell_id: i32,
    pub due: DateTimeUtc,
    pub stability: f32,
    pub difficulty: f32,
    pub elapsed_days: i32,
    pub scheduled_days: i32,
    pub reps: i32,
    pub lapses: i32,
    pub state: State,
    pub last_review: DateTimeUtc,
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
                .on_delete(ForeignKeyAction::Cascade)
                .into(),
            Self::Cell => Entity::belongs_to(super::cell::Entity)
                .from(Column::CellId)
                .to(super::cell::Column::Id)
                .on_delete(ForeignKeyAction::Cascade)
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

impl ActiveModelBehavior for ActiveModel {
    fn new() -> Self {
        Self {
            due: Set(Utc::now().to_utc()),
            stability: Set(0f32),
            difficulty: Set(0f32),
            elapsed_days: Set(0),
            scheduled_days: Set(0),
            reps: Set(0),
            lapses: Set(0),
            state: Set(State::New),
            last_review: Set(Utc::now().to_utc()),
            ..ActiveModelTrait::default()
        }
    }
}
