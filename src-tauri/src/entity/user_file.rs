use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
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
