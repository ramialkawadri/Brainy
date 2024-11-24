pub mod cell_repository;
pub mod repetition_repository;
pub mod user_file_repository;

#[cfg(test)]
mod tests {
    use sea_orm::{Database, DatabaseConnection};

    pub async fn get_db() -> DatabaseConnection {
        let connection = Database::connect("sqlite::memory:").await.unwrap();
        crate::migration::setup_schema(&connection).await.unwrap();
        connection
    }
}
