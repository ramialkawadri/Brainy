use std::sync::Arc;

use async_trait::async_trait;
use prelude::Expr;
use sea_orm::DbConn;
use sea_orm::{entity::*, query::*};

use crate::entities::user_file;

#[async_trait]
pub trait UserFileRepository {
    async fn file_exists(&self, path: String) -> Result<bool, String>;
    async fn folder_exists(&self, path: String) -> Result<bool, String>;
    async fn get_by_id(&self, id: i32) -> Result<user_file::Model, String>;
    async fn get_user_files(&self) -> Result<Vec<user_file::Model>, String>;
    async fn create_folder(&self, path: String) -> Result<(), String>;
    async fn create_file(&self, path: String) -> Result<(), String>;
    async fn delete_file(&self, file_id: i32) -> Result<(), String>;
    async fn delete_folder(&self, folder_id: i32) -> Result<(), String>;
    async fn update_path(&self, id: i32, new_path: String) -> Result<(), String>;
    async fn get_folder_sub_files(&self, id: i32) -> Result<Vec<user_file::Model>, String>;
}

pub struct DefaultUserFileRepository {
    db_conn: Arc<DbConn>,
}

impl DefaultUserFileRepository {
    pub fn new(db_conn: Arc<DbConn>) -> Self {
        Self { db_conn }
    }
}

#[async_trait]
impl UserFileRepository for DefaultUserFileRepository {
    async fn file_exists(&self, path: String) -> Result<bool, String> {
        let result = user_file::Entity::find()
            .filter(user_file::Column::Path.eq(path))
            .filter(user_file::Column::IsFolder.eq(false))
            .count(&*self.db_conn)
            .await;

        match result {
            Ok(result) => Ok(result > 0),
            Err(err) => return Err(err.to_string()),
        }
    }

    async fn folder_exists(&self, path: String) -> Result<bool, String> {
        let result = user_file::Entity::find()
            .filter(user_file::Column::Path.eq(path))
            .filter(user_file::Column::IsFolder.eq(true))
            .count(&*self.db_conn)
            .await;

        match result {
            Ok(result) => Ok(result > 0),
            Err(err) => return Err(err.to_string()),
        }
    }

    async fn get_by_id(&self, id: i32) -> Result<user_file::Model, String> {
        let result = user_file::Entity::find_by_id(id).one(&*self.db_conn).await;
        match result {
            Ok(result) => Ok(result.unwrap()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn get_user_files(&self) -> Result<Vec<user_file::Model>, String> {
        let result = user_file::Entity::find().all(&*self.db_conn).await;
        match result {
            Ok(result) => Ok(result),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn create_folder(&self, path: String) -> Result<(), String> {
        let active_model = user_file::ActiveModel {
            path: Set(path),
            is_folder: Set(true),
            ..Default::default()
        };

        let result = active_model.insert(&*self.db_conn).await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn create_file(&self, path: String) -> Result<(), String> {
        let active_model = user_file::ActiveModel {
            path: Set(path),
            is_folder: Set(false),
            ..Default::default()
        };

        let result = active_model.insert(&*self.db_conn).await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn delete_file(&self, file_id: i32) -> Result<(), String> {
        let result = user_file::Entity::delete_many()
            .filter(user_file::Column::Id.eq(file_id))
            .exec(&*self.db_conn)
            .await;

        match result {
            Ok(_) => Ok(()),
            Err(err) => return Err(err.to_string()),
        }
    }

    async fn delete_folder(&self, folder_id: i32) -> Result<(), String> {
        let folder = self.get_by_id(folder_id).await?;

        let txn = match self.db_conn.begin().await {
            Ok(txn) => txn,
            Err(err) => return Err(err.to_string()),
        };

        let result = user_file::Entity::delete_many()
            .filter(user_file::Column::Path.starts_with(folder.path + "/"))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = user_file::Entity::delete_many()
            .filter(user_file::Column::Id.eq(folder_id))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = txn.commit().await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => return Err(err.to_string()),
        }
    }

    async fn update_path(&self, id: i32, new_path: String) -> Result<(), String> {
        let result = user_file::Entity::update_many()
            .col_expr(user_file::Column::Path, Expr::value(new_path))
            .filter(user_file::Column::Id.eq(id))
            .exec(&*self.db_conn)
            .await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => return Err(err.to_string()),
        }
    }
    
    async fn get_folder_sub_files(&self, id: i32) -> Result<Vec<user_file::Model>, String> {
        let folder = self.get_by_id(id).await?;
        let result = user_file::Entity::find()
            .filter(user_file::Column::Path.starts_with(folder.path + "/"))
            .all(&*self.db_conn)
            .await;
        match result {
            Ok(rows) => Ok(rows),
            Err(err) => return Err(err.to_string()),
        }
    }
}


#[cfg(test)]
pub mod tests {
    use sea_orm::DatabaseConnection;

    use super::*;
    use crate::{entities::cell::{self, CellType}, repositories::tests::*, services::cell_service::{CellService, DefaultCellService}};

    async fn create_repository() -> DefaultUserFileRepository {
        let db = get_db().await;
        DefaultUserFileRepository::new(Arc::new(db))
    }

    // TODO: use repository instead
    fn create_cell_service(db_conn: Arc<DatabaseConnection>) -> DefaultCellService {
        DefaultCellService::new(db_conn)
    }

    #[tokio::test]
    async fn delete_file_valid_input_deleted_file() {
        // Arrange

        let repository = create_repository().await;
        repository.create_folder("test".into()).await.unwrap();
        repository.create_file("test".into()).await.unwrap();
        repository.create_file("test 2".into()).await.unwrap();
        let cell_service = create_cell_service(repository.db_conn.clone());

        let file_id = get_id(&repository.db_conn, "test", false).await;
        cell_service
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        let file_id = get_id(&repository.db_conn, "test 2", false).await;
        cell_service
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        // Act

        repository
            .delete_file(get_id(&repository.db_conn, "test", false).await)
            .await
            .unwrap();

        // Assert

        let actual = repository.get_user_files().await.unwrap();
        assert_eq!(actual.len(), 2);
        let cell_counts = cell::Entity::find().all(&*repository.db_conn).await.unwrap();
        assert_eq!(cell_counts.len(), 1);
    }

    pub async fn get_id(db: &DatabaseConnection, path: &str, is_folder: bool) -> i32 {
        return user_file::Entity::find()
            .filter(user_file::Column::Path.eq(path))
            .filter(user_file::Column::IsFolder.eq(is_folder))
            .one(db)
            .await
            .unwrap()
            .unwrap()
            .id;
    }
}
