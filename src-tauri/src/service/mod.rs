pub mod cell_service;
pub mod export_import_service;
pub mod file_service;
pub mod repetition_service;
pub mod settings_service;

#[cfg(test)]
mod tests {
    use sea_orm::{Database, DatabaseConnection, DbConn};

    use crate::entity::cell::CellType;

    use super::{cell_service, file_service};

    pub async fn get_db() -> DatabaseConnection {
        let connection = Database::connect("sqlite::memory:").await.unwrap();
        crate::migration::setup_schema(&connection).await.unwrap();
        connection
    }

    pub async fn create_file_cell(db_conn: &DbConn, file_name: &str) -> (i32, i32) {
        create_file_cell_with_cell_type_and_content(db_conn, file_name, CellType::Note, "").await
    }

    pub async fn create_file_cell_with_cell_type_and_content(
        db_conn: &DbConn,
        file_name: &str,
        cell_type: CellType,
        content: &str,
    ) -> (i32, i32) {
        let file_id = file_service::create_file(db_conn, file_name.into())
            .await
            .unwrap();
        let cell_id = cell_service::create_cell(db_conn, file_id, content.into(), cell_type, 0)
            .await
            .unwrap();
        (file_id, cell_id)
    }
}
