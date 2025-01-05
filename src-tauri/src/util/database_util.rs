use sea_orm::{Database, DatabaseConnection};

use crate::migration;

pub async fn load_database(path: &String) -> DatabaseConnection {
    let db_conn = Database::connect(format!("sqlite:///{}?mode=rwc", path))
        .await
        .expect("Cannot open the database");
    migration::setup_schema(&db_conn)
        .await
        .expect("Could not setup the database schema!");
    db_conn
}
