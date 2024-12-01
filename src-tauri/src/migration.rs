use sea_orm::{sea_query::Index, ConnectionTrait, DatabaseConnection, DbBackend, DbErr, Schema};

use crate::entities::{cell, file, repetition};

pub async fn setup_schema(db: &DatabaseConnection) -> Result<(), DbErr> {
    let schema = Schema::new(DbBackend::Sqlite);

    let mut stmt = schema.create_table_from_entity(file::Entity);
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
        .table(file::Entity)
        .col(file::Column::Path)
        .col(file::Column::IsFolder)
        .unique()
        .if_not_exists()
        .to_owned();
    db.execute(db.get_database_backend().build(&index)).await?;

    Ok(())
}
