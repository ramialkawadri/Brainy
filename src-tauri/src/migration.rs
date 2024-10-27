use sea_orm::{
    sea_query::TableCreateStatement, ConnectionTrait, DatabaseConnection, DbBackend, DbErr, Schema,
};

use crate::entity::UserFile;

pub async fn setup_schema(db: &DatabaseConnection) -> Result<(), DbErr> {
    let schema = Schema::new(DbBackend::Sqlite);
    let mut stmt: TableCreateStatement = schema.create_table_from_entity(UserFile);
    stmt.if_not_exists();
    db.execute(db.get_database_backend().build(&stmt)).await?;
    Ok(())
}
