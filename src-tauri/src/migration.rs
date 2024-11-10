use sea_orm::{sea_query::Index, ConnectionTrait, DatabaseConnection, DbBackend, DbErr, Schema};

use crate::entities::{cell, repetition, user_file};

pub async fn setup_schema(db: &DatabaseConnection) -> Result<(), DbErr> {
    let schema = Schema::new(DbBackend::Sqlite);

    let mut stmt = schema.create_table_from_entity(user_file::Entity);
    stmt.if_not_exists();
    db.execute(db.get_database_backend().build(&stmt)).await?;

    let mut stmt = schema.create_table_from_entity(cell::Entity);
    stmt.if_not_exists();
    db.execute(db.get_database_backend().build(&stmt)).await?;

    let mut stmt = schema.create_table_from_entity(repetition::Entity);
    stmt.if_not_exists();
    db.execute(db.get_database_backend().build(&stmt)).await?;

    let index = Index::create()
        .name("idx-path")
        .table(user_file::Entity)
        .col(user_file::Column::Path)
        .col(user_file::Column::IsFolder)
        .unique()
        .if_not_exists()
        .to_owned();
    db.execute(db.get_database_backend().build(&index)).await?;

    Ok(())
}
