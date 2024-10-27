use sea_orm::{
    sea_query::{Index, TableCreateStatement}, ConnectionTrait, DatabaseConnection, DbBackend, DbErr, Schema,
};

use crate::entity::UserFile;
use crate::entity::user_file;

pub async fn setup_schema(db: &DatabaseConnection) -> Result<(), DbErr> {
    let schema = Schema::new(DbBackend::Sqlite);
    let mut stmt: TableCreateStatement = schema.create_table_from_entity(UserFile);
    stmt.if_not_exists();
    db.execute(db.get_database_backend().build(&stmt)).await?;

    let index = Index::create()
        .name("idx-path")
        .table(UserFile)
        .col(user_file::Column::Path)
        .col(user_file::Column::IsFolder)
        .unique()
        .to_owned();
    db.execute(db.get_database_backend().build(&index)).await?;

    Ok(())
}
