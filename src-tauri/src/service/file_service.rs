use std::sync::Arc;

use async_trait::async_trait;
use prelude::Expr;
use sea_orm::{entity::*, query::*, DbConn};

use crate::{dto::file_with_repetitions_count_dto::FileWithRepetitionsCount, entity::file};

use super::repetition_service::RepetitionService;

#[async_trait]
pub trait FileService {
    async fn get_files(&self) -> Result<Vec<FileWithRepetitionsCount>, String>;
    async fn create_file(&self, path: String) -> Result<i32, String>;
    async fn create_folder(&self, path: String) -> Result<i32, String>;
    async fn delete_file(&self, file_id: i32) -> Result<(), String>;
    async fn delete_folder(&self, folder_id: i32) -> Result<(), String>;
    async fn move_file(&self, file_id: i32, destination_folder_id: i32) -> Result<(), String>;
    async fn move_folder(&self, folder_id: i32, destination_folder_id: i32) -> Result<(), String>;
    async fn rename_file(&self, file_id: i32, new_name: String) -> Result<(), String>;
    async fn rename_folder(&self, folder_id: i32, new_name: String) -> Result<(), String>;
}

pub struct DefaultFileService {
    db_conn: Arc<DbConn>,
    repetition_service: Arc<dyn RepetitionService + Sync + Send>,
}

impl DefaultFileService {
    pub fn new(
        db_conn: Arc<DbConn>,
        repetition_service: Arc<dyn RepetitionService + Sync + Send>,
    ) -> Self {
        Self {
            db_conn,
            repetition_service,
        }
    }

    async fn create_folder_recursively(&self, path: &String) -> Result<i32, String> {
        let mut current_path = String::new();
        // The id of the folder with the full path
        let mut folder_id = 0;

        for name in path.split("/") {
            if !current_path.is_empty() {
                current_path.push_str("/");
            }
            current_path.push_str(name);
            if current_path.is_empty() {
                continue;
            }

            if !self.folder_exists(current_path.to_string()).await? {
                let active_model = file::ActiveModel {
                    path: Set(current_path.clone()),
                    is_folder: Set(true),
                    ..Default::default()
                };

                let result = active_model.insert(&*self.db_conn).await;
                folder_id = match result {
                    Ok(insert_result) => insert_result.id,
                    Err(err) => return Err(err.to_string()),
                }
            }
        }

        Ok(folder_id)
    }

    async fn file_exists(&self, path: String) -> Result<bool, String> {
        let result = file::Entity::find()
            .filter(file::Column::Path.eq(path))
            .filter(file::Column::IsFolder.eq(false))
            .count(&*self.db_conn)
            .await;

        match result {
            Ok(result) => Ok(result > 0),
            Err(err) => return Err(err.to_string()),
        }
    }

    async fn folder_exists(&self, path: String) -> Result<bool, String> {
        let result = file::Entity::find()
            .filter(file::Column::Path.eq(path))
            .filter(file::Column::IsFolder.eq(true))
            .count(&*self.db_conn)
            .await;

        match result {
            Ok(result) => Ok(result > 0),
            Err(err) => return Err(err.to_string()),
        }
    }

    async fn get_by_id(&self, id: i32) -> Result<file::Model, String> {
        let result = file::Entity::find_by_id(id).one(&*self.db_conn).await;
        match result {
            Ok(result) => Ok(result.unwrap()),
            Err(err) => Err(err.to_string()),
        }
    }

    async fn update_path(&self, id: i32, new_path: String) -> Result<(), String> {
        let result = file::Entity::update_many()
            .col_expr(file::Column::Path, Expr::value(new_path))
            .filter(file::Column::Id.eq(id))
            .exec(&*self.db_conn)
            .await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => return Err(err.to_string()),
        }
    }

    async fn get_folder_sub_files(&self, id: i32) -> Result<Vec<file::Model>, String> {
        let folder = self.get_by_id(id).await?;
        let result = file::Entity::find()
            .filter(file::Column::Path.starts_with(folder.path + "/"))
            .all(&*self.db_conn)
            .await;
        match result {
            Ok(rows) => Ok(rows),
            Err(err) => return Err(err.to_string()),
        }
    }
}

#[async_trait]
impl FileService for DefaultFileService {
    async fn get_files(&self) -> Result<Vec<FileWithRepetitionsCount>, String> {
        let result = file::Entity::find().all(&*self.db_conn).await;
        let files = match result {
            Ok(result) => result,
            Err(err) => return Err(err.to_string()),
        };

        let mut files_with_repetitions_counts: Vec<FileWithRepetitionsCount> = vec![];
        for file in files {
            let repetition_counts = if file.is_folder {
                None
            } else {
                Some(
                    self.repetition_service
                        .get_study_repetition_counts(file.id)
                        .await?,
                )
            };

            files_with_repetitions_counts.push(FileWithRepetitionsCount::new(
                file.id,
                file.path,
                file.is_folder,
                repetition_counts,
            ));
        }

        Ok(files_with_repetitions_counts)
    }

    async fn create_file(&self, path: String) -> Result<i32, String> {
        let path = path.trim_matches('/').to_string();
        if path.trim().is_empty() {
            return Err("Name cannot be empty!".into());
        }
        if path.contains("/") {
            self.create_folder_recursively(&get_folder_path(&path))
                .await?;
        }
        if self.file_exists(path.clone()).await? {
            return Err("File already exists!".into());
        }

        let active_model = file::ActiveModel {
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

    async fn create_folder(&self, path: String) -> Result<i32, String> {
        let path = path.trim_matches('/').to_string();
        if path.trim().is_empty() {
            return Err("Name cannot be empty!".into());
        }
        if self.folder_exists(path.clone()).await? {
            return Err("Folder already exists!".into());
        }
        self.create_folder_recursively(&path).await
    }

    async fn delete_file(&self, file_id: i32) -> Result<(), String> {
        let result = file::Entity::delete_many()
            .filter(file::Column::Id.eq(file_id))
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

        let result = file::Entity::delete_many()
            .filter(file::Column::Path.starts_with(folder.path + "/"))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = file::Entity::delete_many()
            .filter(file::Column::Id.eq(folder_id))
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

    async fn move_file(&self, file_id: i32, destination_folder_id: i32) -> Result<(), String> {
        let file = self.get_by_id(file_id).await?;
        let destination_path = if destination_folder_id == 0 {
            "".into()
        } else {
            self.get_by_id(destination_folder_id).await?.path
        };

        if destination_path == get_folder_path(&file.path) {
            return Ok(());
        }
        let file_name = get_file_name(&file.path);
        let new_path = if destination_path.is_empty() {
            file_name
        } else {
            destination_path + "/" + file_name.as_str()
        };

        if self.file_exists(new_path.clone()).await? {
            return Err("another file with the same name exists!".into());
        }

        self.update_path(file_id, new_path).await
    }

    async fn move_folder(&self, folder_id: i32, destination_folder_id: i32) -> Result<(), String> {
        let folder = self.get_by_id(folder_id).await?;
        let destination_path = if destination_folder_id == 0 {
            "".into()
        } else {
            self.get_by_id(destination_folder_id).await?.path
        };

        if destination_path == folder.path {
            return Ok(());
        } else if destination_path == get_folder_path(&folder.path) {
            return Ok(());
        } else if destination_path.starts_with((folder.path.clone() + "/").as_str()) {
            return Err("You cannot move into an inner folder!".into());
        }
        let folder_name = get_file_name(&folder.path);
        let new_path = if destination_path.is_empty() {
            folder_name
        } else {
            destination_path + "/" + folder_name.as_str()
        };

        if self.folder_exists(new_path.clone()).await? {
            return Err("Another folder with the same name exists!".into());
        }

        let sub_files = self.get_folder_sub_files(folder_id).await?;

        self.update_path(folder_id, new_path.clone()).await?;

        for row in sub_files {
            let new_row_path = new_path.clone()
                + row
                    .path
                    .chars()
                    .skip(folder.path.len())
                    .collect::<String>()
                    .as_str();
            self.update_path(row.id, new_row_path).await?;
        }

        Ok(())
    }

    async fn rename_file(&self, file_id: i32, new_name: String) -> Result<(), String> {
        let new_name = new_name.trim_matches('/').to_string();
        if new_name.trim().is_empty() {
            return Err("Please enter a non empty name!".into());
        }

        let file = self.get_by_id(file_id).await?;

        let new_path = apply_new_name(&file.path, &new_name);
        if self.file_exists(new_path.clone()).await? {
            return Err("Another file with the same name already exists!".into());
        }

        self.create_folder_recursively(&get_folder_path(&new_path))
            .await?;

        self.update_path(file_id, new_path).await
    }

    async fn rename_folder(&self, folder_id: i32, new_name: String) -> Result<(), String> {
        let new_name = new_name.trim_matches('/').to_string();
        if new_name.trim().is_empty() {
            return Err("Please enter a non empty name!".into());
        }

        let folder = self.get_by_id(folder_id).await?;
        let new_path = apply_new_name(&folder.path, &new_name);
        if self.folder_exists(new_path.clone()).await? {
            return Err("Another folder with the same name already exists!".into());
        }

        let sub_files = self.get_folder_sub_files(folder_id).await?;

        self.update_path(folder_id, new_path.clone()).await?;
        self.create_folder_recursively(&get_folder_path(&new_path))
            .await?;

        for row in sub_files {
            let new_row_path = new_path.clone()
                + row
                    .path
                    .chars()
                    .skip(folder.path.len())
                    .collect::<String>()
                    .as_str();
            self.update_path(row.id, new_row_path).await?;
        }

        Ok(())
    }
}

fn get_file_name(path: &String) -> String {
    let index = path.rfind("/");
    match index {
        Some(index) => path.chars().skip(index + 1).collect(),
        None => path.clone(),
    }
}

fn get_folder_path(path: &String) -> String {
    let index = path.rfind("/");
    match index {
        Some(index) => path.chars().take(index).collect::<String>(),
        None => "".into(),
    }
}

fn apply_new_name(path: &String, new_name: &String) -> String {
    let index = path.rfind("/");
    match index {
        Some(index) => path.chars().take(index + 1).collect::<String>() + new_name.as_str(),
        None => new_name.clone(),
    }
}

#[cfg(test)]
pub mod tests {
    use crate::{
        entity::cell::{self, CellType},
        services::{
            cell_service::{CellService, DefaultCellService},
            repetition_service::DefaultRepetitionService,
            tests::get_db,
        },
    };

    use super::*;

    async fn create_service() -> DefaultFileService {
        let db_conn = Arc::new(get_db().await);
        DefaultFileService::new(
            db_conn.clone(),
            Arc::new(DefaultRepetitionService::new(db_conn.clone())),
        )
    }

    fn create_cell_service(service: &DefaultFileService) -> DefaultCellService {
        DefaultCellService::new(service.db_conn.clone(), service.repetition_service.clone())
    }

    #[tokio::test]
    async fn get_files_valid_input_returned_files() {
        // Arrange

        let service = create_service().await;
        service.create_file("file".into()).await.unwrap();
        service.create_folder("folder".into()).await.unwrap();

        // Act

        let actual = service.get_files().await.unwrap();

        // Assert

        assert_eq!(actual.len(), 2);
        assert!(actual.iter().any(|f| f.path == "file".to_string()));
        assert!(actual.iter().any(|f| f.path == "folder".to_string()));
    }

    #[tokio::test]
    async fn create_folder_nested_path_created_all_folders() {
        // Arrange

        let service = create_service().await;

        // Act

        service
            .create_folder("folder 1/folder 2/".into())
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert_eq!(actual.len(), 2);
        assert!(actual.iter().any(|f| f.path == "folder 1".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "folder 1/folder 2".to_string()));
    }

    #[tokio::test]
    async fn create_folder_empty_name_returned_error() {
        // Arrange

        let service = create_service().await;

        // Act

        let actual = service.create_folder("  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_folder_existing_folder_returned_error() {
        // Arrange

        let service = create_service().await;
        service.create_folder("folder 1".into()).await.unwrap();

        // Act

        let actual = service.create_folder("folder 1".into()).await;

        // Assert

        assert_eq!(actual, Err("Folder already exists!".to_string()));
    }

    #[tokio::test]
    async fn create_file_empty_name_returned_error() {
        // Arrange

        let service = create_service().await;

        // Act

        let actual = service.create_file("  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_file_existing_file_returned_error() {
        // Arrange

        let service = create_service().await;
        service.create_file("file 1".into()).await.unwrap();

        // Act

        let actual = service.create_file("file 1".into()).await;

        // Assert

        assert_eq!(actual, Err("File already exists!".to_string()));
    }

    #[tokio::test]
    async fn delete_file_valid_input_deleted_file() {
        // Arrange

        let service = create_service().await;
        service.create_folder("test".into()).await.unwrap();
        service.create_file("test".into()).await.unwrap();
        service.create_file("test 2".into()).await.unwrap();
        let cell_service = create_cell_service(&service);

        let file_id = get_id(&service.db_conn, "test", false).await;
        cell_service
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        let file_id = get_id(&service.db_conn, "test 2", false).await;
        cell_service
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        // Act

        service
            .delete_file(get_id(&service.db_conn, "test", false).await)
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert_eq!(actual.len(), 2);
        let cell_counts = cell::Entity::find().all(&*service.db_conn).await.unwrap();
        assert_eq!(cell_counts.len(), 1);
    }

    #[tokio::test]
    async fn delete_folder_valid_input_deleted_folder() {
        // Arrange

        let service = create_service().await;
        service.create_folder("test".into()).await.unwrap();
        service.create_file("test/file".into()).await.unwrap();
        let file_id = get_id(&service.db_conn, "test/file", false).await;
        let cell_service = create_cell_service(&service);
        cell_service
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        service.create_file("test".into()).await.unwrap();
        let file_id = get_id(&service.db_conn, "test", false).await;
        cell_service
            .create_cell(file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        // Act

        service
            .delete_folder(get_id(&service.db_conn, "test", true).await)
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert_eq!(actual.len(), 1);
        let cell_counts = cell::Entity::find().all(&*service.db_conn).await.unwrap();
        assert_eq!(cell_counts.len(), 1);
    }

    #[tokio::test]
    async fn move_file_valid_input_moved_file() {
        // Arrange

        let service = create_service().await;
        let file_id = service.create_file("test/file".into()).await.unwrap();
        let destination_folder_id = service.create_folder("test 2".into()).await.unwrap();

        // Act

        service
            .move_file(file_id, destination_folder_id)
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert_eq!(actual[1].path, "test 2/file".to_string());
    }

    #[tokio::test]
    async fn move_file_move_to_root_moved_file() {
        // Arrange

        let service = create_service().await;
        let file_id = service.create_file("test/file".into()).await.unwrap();

        // Act

        service.move_file(file_id, 0).await.unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert_eq!(actual[1].path, "file".to_string());
    }

    #[tokio::test]
    async fn move_file_existing_file_error_returned() {
        // Arrange

        let service = create_service().await;
        let file_id = service.create_file("test/file".into()).await.unwrap();
        service.create_file("file".into()).await.unwrap();

        // Act

        let actual = service.move_file(file_id, 0).await;

        // Assert

        assert_eq!(
            actual,
            Err("another file with the same name exists!".to_string())
        );
    }

    #[tokio::test]
    async fn move_folder_valid_input_moved_folder() {
        // Arrange

        let service = create_service().await;
        let folder_id = service.create_folder("test".into()).await.unwrap();
        let destination_folder_id = service.create_folder("destination".into()).await.unwrap();

        service
            .create_file("test/folder 1/folder 2/file".into())
            .await
            .unwrap();
        service.create_file("test/file".into()).await.unwrap();

        // Act

        service
            .move_folder(folder_id, destination_folder_id)
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert!(actual.iter().any(|f| f.path == "destination".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "destination/test/folder 1".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "destination/test/folder 1/folder 2".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "destination/test/folder 1/folder 2/file".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "destination/test/file".to_string()));
    }

    #[tokio::test]
    async fn move_folder_move_to_root_moved_folder() {
        // Arrange

        let service = create_service().await;
        service.create_folder("test".into()).await.unwrap();
        let folder_id = service.create_folder("test/folder 1".into()).await.unwrap();

        service
            .create_file("test/folder 1/folder 2/file".into())
            .await
            .unwrap();
        service.create_file("test/file".into()).await.unwrap();

        // Act

        service.move_folder(folder_id, 0).await.unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert!(actual.iter().any(|f| f.path == "test".to_string()));
        assert!(actual.iter().any(|f| f.path == "folder 1".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "folder 1/folder 2".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "folder 1/folder 2/file".to_string()));
        assert!(actual.iter().any(|f| f.path == "test/file".to_string()));
    }

    #[tokio::test]
    async fn move_folder_move_to_inner_folder_error_returned() {
        // Arrange

        let service = create_service().await;
        let folder_id = service.create_folder("test".into()).await.unwrap();
        let inner_folder_id = service.create_folder("test/folder 1".into()).await.unwrap();

        // Act

        let actual = service.move_folder(folder_id, inner_folder_id).await;

        // Assert

        assert_eq!(
            actual,
            Err("You cannot move into an inner folder!".to_string())
        );
    }

    #[tokio::test]
    async fn move_folder_existing_folder_error_returned() {
        // Arrange

        let service = create_service().await;
        let folder_id = service.create_folder("test/folder 1".into()).await.unwrap();
        service.create_folder("folder 1".into()).await.unwrap();

        // Act

        let actual = service.move_folder(folder_id, 0).await;

        // Assert

        assert_eq!(
            actual,
            Err("Another folder with the same name exists!".to_string())
        );
    }

    #[tokio::test]
    async fn rename_file_inside_folder_renamed_file() {
        // Arrange

        let service = create_service().await;
        let file_id = service.create_file("folder/test".into()).await.unwrap();

        // Act

        service
            .rename_file(file_id, "/new name/".into())
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert_eq!(actual[1].path, "folder/new name".to_string());
    }

    #[tokio::test]
    async fn rename_file_placed_on_root_file_renamed() {
        // Arrange

        let service = create_service().await;
        let file_id = service.create_file("test".into()).await.unwrap();

        // Act

        service
            .rename_file(file_id, "/new name/".into())
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert_eq!(actual[0].path, "new name".to_string());
    }

    #[tokio::test]
    async fn rename_file_existing_file_error_returned() {
        // Arrange

        let service = create_service().await;
        let file_id = service.create_file("test".into()).await.unwrap();
        service.create_file("new name".into()).await.unwrap();

        // Act

        let actual = service.rename_file(file_id, "/new name/".into()).await;

        // Assert

        assert_eq!(
            actual,
            Err("Another file with the same name already exists!".into())
        );
    }

    #[tokio::test]
    async fn rename_folder_valid_input_renamed_folder() {
        // Arrange

        let service = create_service().await;
        let folder_id = service.create_folder("folder 1".into()).await.unwrap();
        service
            .create_file("folder 1/folder 2/file".into())
            .await
            .unwrap();
        service
            .create_file("folder 1/folder 2/folder 3/file".into())
            .await
            .unwrap();

        // Act

        service
            .rename_folder(folder_id, "/new name/subfolder".into())
            .await
            .unwrap();

        // Assert

        let actual = service.get_files().await.unwrap();
        assert!(actual
            .iter()
            .any(|f| f.path == "new name/subfolder".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "new name/subfolder/folder 2".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "new name/subfolder/folder 2/file".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "new name/subfolder/folder 2/folder 3".to_string()));
        assert!(actual
            .iter()
            .any(|f| f.path == "new name/subfolder/folder 2/folder 3/file".to_string()));
    }

    #[tokio::test]
    async fn rename_folder_existing_folder_returned_error() {
        // Arrange

        let service = create_service().await;
        let folder_id = service.create_folder("folder 1".into()).await.unwrap();
        service.create_folder("folder 2".into()).await.unwrap();

        // Act

        let actual = service.rename_folder(folder_id, "folder 2".into()).await;

        // Assert

        assert_eq!(
            actual,
            Err("Another folder with the same name already exists!".into())
        );
    }

    pub async fn get_id(db: &DbConn, path: &str, is_folder: bool) -> i32 {
        file::Entity::find()
            .filter(file::Column::Path.eq(path))
            .filter(file::Column::IsFolder.eq(is_folder))
            .one(db)
            .await
            .unwrap()
            .unwrap()
            .id
    }
}
