#[cfg(test)]
use mockall::{automock, predicate::*};
use std::sync::Arc;

use async_trait::async_trait;
use prelude::Expr;
use sea_orm::DbConn;
use sea_orm::{entity::*, query::*};

use crate::entities::user_file;

#[cfg_attr(test, automock)]
#[async_trait]
pub trait UserFileRepository {
    async fn file_exists(&self, path: String) -> Result<bool, String>;
    async fn folder_exists(&self, path: String) -> Result<bool, String>;
    async fn get_by_id(&self, id: i32) -> Result<user_file::Model, String>;
    async fn get_user_files(&self) -> Result<Vec<user_file::Model>, String>;
    async fn create_folder(&self, path: String) -> Result<i32, String>;
    async fn create_file(&self, path: String) -> Result<i32, String>;
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

    async fn create_folder(&self, path: String) -> Result<i32, String> {
        let active_model = user_file::ActiveModel {
            path: Set(path),
            is_folder: Set(true),
            ..Default::default()
        };

        let result = active_model.insert(&*self.db_conn).await;
        match result {
            Ok(insert_result) => Ok(insert_result.id),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn create_file(&self, path: String) -> Result<i32, String> {
        let active_model = user_file::ActiveModel {
            path: Set(path),
            is_folder: Set(false),
            ..Default::default()
        };

        let result = active_model.insert(&*self.db_conn).await;
        match result {
            Ok(insert_result) => Ok(insert_result.id),
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
    use crate::{
        entities::cell::{self, CellType},
        repositories::{
            cell_repository::{CellRepository, DefaultCellRepository},
            tests::*,
        },
    };

    async fn create_repository() -> DefaultUserFileRepository {
        let db = get_db().await;
        DefaultUserFileRepository::new(Arc::new(db))
    }

    fn create_cell_repository(db_conn: Arc<DatabaseConnection>) -> DefaultCellRepository {
        DefaultCellRepository::new(db_conn)
    }

    #[tokio::test]
    async fn file_exists_existing_file_returned_true() {
        // Arrange

        let repository = create_repository().await;
        repository.create_file("test".into()).await.unwrap();

        // Act

        let actual = repository.file_exists("test".to_string()).await.unwrap();

        // Assert

        assert_eq!(true, actual);
    }

    #[tokio::test]
    async fn file_exists_non_existing_file_returned_false() {
        // Arrange

        let repository = create_repository().await;
        repository.create_folder("test".into()).await.unwrap();

        // Act

        let actual = repository.file_exists("test".to_string()).await.unwrap();

        // Assert

        assert_eq!(false, actual);
    }

    #[tokio::test]
    async fn folder_exists_existing_file_returned_true() {
        // Arrange

        let repository = create_repository().await;
        repository.create_folder("test".into()).await.unwrap();

        // Act

        let actual = repository.folder_exists("test".to_string()).await.unwrap();

        // Assert

        assert_eq!(true, actual);
    }

    #[tokio::test]
    async fn folder_exists_non_existing_file_returned_false() {
        // Arrange

        let repository = create_repository().await;
        repository.create_file("test".into()).await.unwrap();

        // Act

        let actual = repository.folder_exists("test".to_string()).await.unwrap();

        // Assert

        assert_eq!(false, actual);
    }

    #[tokio::test]
    async fn get_by_id_valid_input_returned_file() {
        // Arrange

        let repository = create_repository().await;
        repository.create_file("test".into()).await.unwrap();

        // Act

        let actual = repository.get_by_id(1).await.unwrap();

        // Assert

        assert_eq!(1, actual.id);
        assert_eq!("test".to_string(), actual.path);
    }

    #[tokio::test]
    async fn get_user_files_valid_input_returned_files() {
        // Arrange

        let repository = create_repository().await;
        repository.create_file("file".into()).await.unwrap();
        repository.create_folder("folder".into()).await.unwrap();

        // Act

        let actual = repository.get_user_files().await.unwrap();

        // Assert

        assert_eq!(actual.len(), 2);
        assert!(actual.iter().any(|f| f.path == "file".to_string()));
        assert!(actual.iter().any(|f| f.path == "folder".to_string()));
    }

    #[tokio::test]
    async fn create_folder_valid_input_created_folder() {
        // Arrange

        let repository = create_repository().await;

        // Act

        repository.create_folder("folder 1".into()).await.unwrap();

        // Assert

        let actual = repository.get_user_files().await.unwrap();
        assert_eq!(actual.len(), 1);
        assert_eq!(actual[0].path, "folder 1");
        assert_eq!(actual[0].is_folder, true);
        assert_eq!(actual[0].id, 1);
    }

    #[tokio::test]
    async fn create_file_valid_input_created_file() {
        // Arrange

        let repository = create_repository().await;

        // Act

        repository.create_file("file".into()).await.unwrap();

        // Assert

        let actual = repository.get_user_files().await.unwrap();
        assert_eq!(actual.len(), 1);
        assert_eq!(actual[0].path, "file");
        assert_eq!(actual[0].is_folder, false);
        assert_eq!(actual[0].id, 1);
    }

    #[tokio::test]
    async fn delete_file_valid_input_deleted_file() {
        // Arrange

        let repository = create_repository().await;
        repository.create_folder("test".into()).await.unwrap();
        repository.create_file("test".into()).await.unwrap();
        repository.create_file("test 2".into()).await.unwrap();
        let cell_repository = create_cell_repository(repository.db_conn.clone());

        let file_id = get_id(&repository.db_conn, "test", false).await;
        cell_repository
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        let file_id = get_id(&repository.db_conn, "test 2", false).await;
        cell_repository
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
        let cell_counts = cell::Entity::find()
            .all(&*repository.db_conn)
            .await
            .unwrap();
        assert_eq!(cell_counts.len(), 1);
    }

    #[tokio::test]
    async fn delete_folder_valid_input_deleted_folder() {
        // Arrange

        let repository = create_repository().await;
        repository.create_folder("test".into()).await.unwrap();
        repository.create_file("test/file".into()).await.unwrap();
        let file_id = get_id(&repository.db_conn, "test/file", false).await;
        let cell_repository = create_cell_repository(repository.db_conn.clone());
        cell_repository
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        repository.create_file("test".into()).await.unwrap();
        let file_id = get_id(&repository.db_conn, "test", false).await;
        cell_repository
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        // Act

        repository
            .delete_folder(get_id(&repository.db_conn, "test", true).await)
            .await
            .unwrap();

        // Assert

        let actual = repository.get_user_files().await.unwrap();
        assert_eq!(actual.len(), 1);
        let cell_counts = cell::Entity::find()
            .all(&*repository.db_conn)
            .await
            .unwrap();
        assert_eq!(cell_counts.len(), 1);
    }

    #[tokio::test]
    async fn update_path_valid_input_updated_path() {
        // Arrange

        let repository = create_repository().await;
        repository.create_file("file".into()).await.unwrap();

        // Act

        repository
            .update_path(1, "new path".to_string())
            .await
            .unwrap();

        // Assert

        let actual = repository.get_user_files().await.unwrap();
        assert_eq!(actual[0].path, "new path");
    }

    #[tokio::test]
    async fn get_folder_sub_files() {
        // Arrange

        let repository = create_repository().await;
        repository.create_folder("folder".into()).await.unwrap();
        repository
            .create_folder("folder/folder 2".into())
            .await
            .unwrap();
        repository.create_file("folder/file".into()).await.unwrap();
        repository
            .create_file("folder/folder 2/file".into())
            .await
            .unwrap();

        // Act

        let actual = repository.get_folder_sub_files(1).await.unwrap();

        // Assert

        assert_eq!(3, actual.len());
        assert!(actual.iter().any(|f| f.path == "folder/file".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "folder/folder 2".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "folder/folder 2/file".to_string()));
    }

    pub async fn get_id(db: &DatabaseConnection, path: &str, is_folder: bool) -> i32 {
        user_file::Entity::find()
            .filter(user_file::Column::Path.eq(path))
            .filter(user_file::Column::IsFolder.eq(is_folder))
            .one(db)
            .await
            .unwrap()
            .unwrap()
            .id
    }
}
