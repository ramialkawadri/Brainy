#[cfg(test)]
use mockall::{automock, predicate::*};
use std::sync::Arc;

use crate::entities::user_file;
use crate::repositories::user_file_repository::UserFileRepository;

use async_trait::async_trait;

#[cfg_attr(test, automock)]
#[async_trait]
pub trait UserFileService {
    async fn get_user_files(&self) -> Result<Vec<user_file::Model>, String>;
    async fn create_file(&self, path: String) -> Result<(), String>;
    async fn create_folder(&self, path: String) -> Result<(), String>;
    async fn delete_file(&self, file_id: i32) -> Result<(), String>;
    async fn delete_folder(&self, folder_id: i32) -> Result<(), String>;
    async fn move_file(&self, file_id: i32, destination_folder_id: i32) -> Result<(), String>;
    async fn move_folder(&self, folder_id: i32, destination_folder_id: i32) -> Result<(), String>;
    async fn rename_file(&self, file_id: i32, new_name: String) -> Result<(), String>;
    async fn rename_folder(&self, folder_id: i32, new_name: String) -> Result<(), String>;
}

pub struct DefaultUserFileServices {
    repository: Arc<dyn UserFileRepository + Sync + Send>,
}

impl DefaultUserFileServices {
    pub fn new(repository: Arc<dyn UserFileRepository + Sync + Send>) -> Self {
        Self { repository }
    }

    async fn create_folder_recursively(&self, path: &String) -> Result<(), String> {
        if path.is_empty() {
            return Ok(());
        }
        let mut current_path = String::new();

        for name in path.split("/") {
            if !current_path.is_empty() {
                current_path.push_str("/");
            }
            current_path.push_str(name);

            if !self
                .repository
                .folder_exists(current_path.to_string())
                .await?
            {
                self.repository
                    .create_folder(current_path.to_string())
                    .await?;
            }
        }

        Ok(())
    }
}

#[async_trait]
impl UserFileService for DefaultUserFileServices {
    async fn get_user_files(&self) -> Result<Vec<user_file::Model>, String> {
        self.repository.get_user_files().await
    }

    async fn create_file(&self, path: String) -> Result<(), String> {
        if path.trim().is_empty() {
            return Err("Name cannot be empty!".into());
        }
        if path.contains("/") {
            self.create_folder_recursively(&get_folder_path(&path))
                .await?;
        }
        if self.repository.file_exists(path.clone()).await? {
            return Err("File already exists!".into());
        }
        self.repository.create_file(path).await
    }

    async fn create_folder(&self, path: String) -> Result<(), String> {
        if path.trim().is_empty() {
            return Err("Name cannot be empty!".into());
        }
        if self.repository.folder_exists(path.clone()).await? {
            return Err("Folder already exists!".into());
        }
        self.create_folder_recursively(&path).await
    }

    async fn delete_file(&self, file_id: i32) -> Result<(), String> {
        self.repository.delete_file(file_id).await
    }

    async fn delete_folder(&self, folder_id: i32) -> Result<(), String> {
        self.repository.delete_folder(folder_id).await
    }

    async fn move_file(&self, file_id: i32, destination_folder_id: i32) -> Result<(), String> {
        let file = self.repository.get_by_id(file_id).await?;
        let destination_path = if destination_folder_id == 0 {
            "".into()
        } else {
            self.repository.get_by_id(destination_folder_id).await?.path
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

        if self.repository.file_exists(new_path.clone()).await? {
            return Err("Another file with the same name exists!".into());
        }

        self.repository.update_path(file_id, new_path).await
    }

    async fn move_folder(&self, folder_id: i32, destination_folder_id: i32) -> Result<(), String> {
        let folder = self.repository.get_by_id(folder_id).await?;
        let destination_path = if destination_folder_id == 0 {
            "".into()
        } else {
            self.repository.get_by_id(destination_folder_id).await?.path
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

        if self.repository.folder_exists(new_path.clone()).await? {
            return Err("Another folder with the same name exists!".into());
        }

        let sub_files = self.repository.get_folder_sub_files(folder_id).await?;

        self.repository
            .update_path(folder_id, new_path.clone())
            .await?;
        self.create_folder_recursively(&new_path).await?;

        for row in sub_files {
            let new_row_path = new_path.clone()
                + row
                    .path
                    .chars()
                    .skip(folder.path.len())
                    .collect::<String>()
                    .as_str();
            self.repository.update_path(row.id, new_row_path).await?;
        }

        Ok(())
    }

    async fn rename_file(&self, file_id: i32, new_name: String) -> Result<(), String> {
        if new_name.trim().is_empty() {
            return Err("Please enter a non empty name!".into());
        }

        let file = self.repository.get_by_id(file_id).await?;

        let new_path = apply_new_name(&file.path, &new_name);
        if self.repository.file_exists(new_path.clone()).await? {
            return Err("Another file with the same name already exists!".into());
        }

        self.create_folder_recursively(&get_folder_path(&new_path))
            .await?;

        self.repository.update_path(file_id, new_path).await
    }

    async fn rename_folder(&self, folder_id: i32, new_name: String) -> Result<(), String> {
        if new_name.trim().is_empty() {
            return Err("Please enter a non empty name!".into());
        }

        let folder = self.repository.get_by_id(folder_id).await?;
        let new_path = apply_new_name(&folder.path, &new_name);
        if self.repository.folder_exists(new_path.clone()).await? {
            return Err("Another folder with the same name already exists!".into());
        }

        let sub_files = self.repository.get_folder_sub_files(folder_id).await?;

        self.create_folder_recursively(&get_folder_path(&new_path))
            .await?;
        self.repository
            .update_path(folder_id, new_path.clone())
            .await?;

        for row in sub_files {
            let new_row_path = new_path.clone()
                + row
                    .path
                    .chars()
                    .skip(folder.path.len())
                    .collect::<String>()
                    .as_str();
            self.repository.update_path(row.id, new_row_path).await?;
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
    use mockall::predicate;

    use super::*;
    use crate::repositories::user_file_repository::MockUserFileRepository;

    struct TestDependencies {
        user_file_repository: MockUserFileRepository,
    }

    fn create_dependencies() -> TestDependencies {
        TestDependencies {
            user_file_repository: MockUserFileRepository::new(),
        }
    }

    fn create_service(deps: TestDependencies) -> DefaultUserFileServices {
        DefaultUserFileServices::new(Arc::new(deps.user_file_repository))
    }

    #[tokio::test]
    async fn get_user_files_valid_input_returned_user_files() {
        // Arrange

        let mut deps = create_dependencies();
        let files: Vec<user_file::Model> = vec![user_file::Model {
            id: 10,
            ..Default::default()
        }];
        deps.user_file_repository
            .expect_get_user_files()
            .return_once(|| Ok(files));
        let service = create_service(deps);

        // Act

        let actual = service.get_user_files().await.unwrap();

        // Assert

        assert_eq!(actual.len(), 1);
        assert_eq!(actual[0].id, 10);
    }

    #[tokio::test]
    async fn create_folder_nested_path_created_all_folders() {
        // Arrange

        let mut deps = create_dependencies();
        deps.user_file_repository
            .expect_folder_exists()
            .return_const(Ok(false));
        deps.user_file_repository
            .expect_create_folder()
            .with(predicate::eq("folder 1".to_string()))
            .times(2)
            .return_const(Ok(()));
        deps.user_file_repository
            .expect_create_folder()
            .with(predicate::eq("folder 1/folder 2".to_string()))
            .times(1)
            .return_const(Ok(()));
        deps.user_file_repository
            .expect_create_folder()
            .with(predicate::eq("folder 1/folder 3".to_string()))
            .times(1)
            .return_const(Ok(()));
        let service = create_service(deps);

        // Act & Assert

        service
            .create_folder("folder 1/folder 2".into())
            .await
            .unwrap();
        service
            .create_folder("folder 1/folder 3".into())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn create_folder_empty_name_returned_error() {
        // Arrange

        let deps = create_dependencies();
        let service = create_service(deps);

        // Act

        let actual = service.create_folder("  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_folder_existing_folder_returned_error() {
        // Arrange

        let mut deps = create_dependencies();
        deps.user_file_repository
            .expect_folder_exists()
            .return_const(Ok(true));
        let service = create_service(deps);

        // Act

        let actual = service.create_folder("folder 1".into()).await;

        // Assert

        assert_eq!(actual, Err("Folder already exists!".to_string()));
    }

    #[tokio::test]
    async fn create_file_nested_path_created_all_folders() {
        // Arrange

        let mut deps = create_dependencies();
        deps.user_file_repository
            .expect_folder_exists()
            .return_const(Ok(false));
        deps.user_file_repository
            .expect_file_exists()
            .return_const(Ok(false));
        deps.user_file_repository
            .expect_create_folder()
            .with(predicate::eq("folder 1".to_string()))
            .times(1)
            .return_const(Ok(()));
        deps.user_file_repository
            .expect_create_folder()
            .with(predicate::eq("folder 1/folder 2".to_string()))
            .times(1)
            .return_const(Ok(()));
        deps.user_file_repository
            .expect_create_file()
            .with(predicate::eq("folder 1/folder 2/file 1".to_string()))
            .times(1)
            .return_const(Ok(()));
        let service = create_service(deps);

        // Act

        service
            .create_file("folder 1/folder 2/file 1".into())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn create_file_empty_name_returned_error() {
        // Arrange

        let deps = create_dependencies();
        let service = create_service(deps);

        // Act

        let actual = service.create_file("  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_file_existing_file_returned_error() {
        // Arrange
    
        let mut deps = create_dependencies();
        deps.user_file_repository
            .expect_file_exists()
            .return_const(Ok(true));
        let service = create_service(deps);
    
        // Act
    
        let actual = service.create_file("file 1".into()).await;
    
        // Assert
    
        assert_eq!(actual, Err("File already exists!".to_string()));
    }
    
    // #[tokio::test]
    // async fn delete_file_valid_input_deleted_file() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_folder("test".into()).await.unwrap();
    //     service.create_file("test".into()).await.unwrap();
    //     service.create_file("test 2".into()).await.unwrap();
    //     let cell_service = create_cell_service(service.db_conn.clone());
    //
    //     let file_id = get_id(&service.db_conn, "test", false).await;
    //     cell_service
    //         .create_cell(file_id, "".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //
    //     let file_id = get_id(&service.db_conn, "test 2", false).await;
    //     cell_service
    //         .create_cell(file_id, "".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //
    //     // Act
    //
    //     service
    //         .delete_file(get_id(&service.db_conn, "test", false).await)
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 2);
    //     let cell_counts = cell::Entity::find().all(&*service.db_conn).await.unwrap();
    //     assert_eq!(cell_counts.len(), 1);
    // }
    //
    // #[tokio::test]
    // async fn delete_folder_valid_input_deleted_folder() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_folder("test".into()).await.unwrap();
    //     service.create_file("test/file".into()).await.unwrap();
    //     let file_id = get_id(&service.db_conn, "test/file", false).await;
    //     let cell_service = create_cell_service(service.db_conn.clone());
    //     cell_service
    //         .create_cell(file_id, "".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //
    //     service.create_file("test".into()).await.unwrap();
    //     let file_id = get_id(&service.db_conn, "test", false).await;
    //     cell_service
    //         .create_cell(file_id, "".into(), CellType::FlashCard, 0)
    //         .await
    //         .unwrap();
    //
    //     // Act
    //
    //     service
    //         .delete_folder(get_id(&service.db_conn, "test", true).await)
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 1);
    //     let cell_counts = cell::Entity::find().all(&*service.db_conn).await.unwrap();
    //     assert_eq!(cell_counts.len(), 1);
    // }
    //
    // #[tokio::test]
    // async fn move_file_valid_input_moved_file() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_folder("test".into()).await.unwrap();
    //     service.create_folder("test 2".into()).await.unwrap();
    //     service.create_file("test".into()).await.unwrap();
    //
    //     // Act
    //
    //     service
    //         .move_file(
    //             get_id(&service.db_conn, "test", false).await,
    //             get_id(&service.db_conn, "test 2", true).await,
    //         )
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 3);
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test 2" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test 2/test" && !item.is_folder));
    // }
    //
    // #[tokio::test]
    // async fn move_file_move_to_root_moved_file() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service
    //         .create_file("test/folder 1/folder 2/file".into())
    //         .await
    //         .unwrap();
    //
    //     // Act
    //
    //     service
    //         .move_file(
    //             get_id(&service.db_conn, "test/folder 1/folder 2/file", false).await,
    //             0,
    //         )
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 4);
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test/folder 1" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test/folder 1/folder 2" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "file" && !item.is_folder));
    // }
    //
    // #[tokio::test]
    // async fn move_file_existing_file_error_returned() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_file("test".into()).await.unwrap();
    //     service.create_file("folder/test".into()).await.unwrap();
    //
    //     // Act
    //
    //     let actual = service
    //         .move_file(
    //             get_id(&service.db_conn, "test", false).await,
    //             get_id(&service.db_conn, "folder", true).await,
    //         )
    //         .await;
    //
    //     // Assert
    //
    //     assert_eq!(
    //         actual,
    //         Err("Another file with the same name exists!".to_string())
    //     );
    // }
    //
    // #[tokio::test]
    // async fn move_folder_valid_input_moved_folder() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service
    //         .create_folder("test/folder 1/folder 2".into())
    //         .await
    //         .unwrap();
    //     service
    //         .create_file("test/folder 1/folder 2/file".into())
    //         .await
    //         .unwrap();
    //     service.create_folder("test 2".into()).await.unwrap();
    //     service.create_file("test".into()).await.unwrap();
    //
    //     // Act
    //
    //     service
    //         .move_folder(
    //             get_id(&service.db_conn, "test", true).await,
    //             get_id(&service.db_conn, "test 2", true).await,
    //         )
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 6);
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test" && !item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test 2" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test 2/test" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test 2/test/folder 1" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test 2/test/folder 1/folder 2" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test 2/test/folder 1/folder 2/file" && !item.is_folder));
    // }
    //
    // #[tokio::test]
    // async fn move_folder_move_to_root_moved_folder() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service
    //         .create_folder("test/folder 1/folder 2".into())
    //         .await
    //         .unwrap();
    //     service
    //         .create_file("test/folder 1/folder 2/file".into())
    //         .await
    //         .unwrap();
    //
    //     // Act
    //
    //     service
    //         .move_folder(get_id(&service.db_conn, "test/folder 1", true).await, 0)
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 4);
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "test" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "folder 1" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "folder 1/folder 2" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "folder 1/folder 2/file" && !item.is_folder));
    // }
    //
    // #[tokio::test]
    // async fn move_folder_move_to_inner_folder_error_returned() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service
    //         .create_folder("test/folder 1/folder 2".into())
    //         .await
    //         .unwrap();
    //
    //     // Act
    //
    //     let actual = service
    //         .move_folder(
    //             get_id(&service.db_conn, "test", true).await,
    //             get_id(&service.db_conn, "test/folder 1", true).await,
    //         )
    //         .await;
    //
    //     // Assert
    //
    //     assert_eq!(
    //         actual,
    //         Err("You cannot move into an inner folder!".to_string())
    //     );
    // }
    //
    // #[tokio::test]
    // async fn move_folder_existing_folder_error_returned() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_folder("test".into()).await.unwrap();
    //     service.create_folder("test 2/test".into()).await.unwrap();
    //
    //     // Act
    //
    //     let actual = service
    //         .move_folder(
    //             get_id(&service.db_conn, "test", true).await,
    //             get_id(&service.db_conn, "test 2", true).await,
    //         )
    //         .await;
    //
    //     // Assert
    //
    //     assert_eq!(
    //         actual,
    //         Err("Another folder with the same name exists!".to_string())
    //     );
    // }
    //
    // #[tokio::test]
    // async fn rename_file_valid_input_renamed_file() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_file("test".into()).await.unwrap();
    //     service.create_file("folder 1/test 2".into()).await.unwrap();
    //     service.create_file("folder 1/test 3".into()).await.unwrap();
    //
    //     // Act
    //
    //     service
    //         .rename_file(
    //             get_id(&service.db_conn, "test", false).await,
    //             "new_name".into(),
    //         )
    //         .await
    //         .unwrap();
    //     service
    //         .rename_file(
    //             get_id(&service.db_conn, "folder 1/test 2", false).await,
    //             "new_name_2".into(),
    //         )
    //         .await
    //         .unwrap();
    //     service
    //         .rename_file(
    //             get_id(&service.db_conn, "folder 1/test 3", false).await,
    //             "folder 2/new_name_3".into(),
    //         )
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 5);
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "new_name" && !item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "folder 1" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "folder 1/new_name_2" && !item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "folder 1/folder 2" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "folder 1/folder 2/new_name_3" && !item.is_folder));
    // }
    //
    // #[tokio::test]
    // async fn rename_file_existing_file_error_returned() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_file("test".into()).await.unwrap();
    //     service.create_file("test 2".into()).await.unwrap();
    //
    //     // Act
    //
    //     let actual = service
    //         .rename_file(
    //             get_id(&service.db_conn, "test", false).await,
    //             "test 2".into(),
    //         )
    //         .await;
    //
    //     // Assert
    //
    //     assert_eq!(
    //         actual,
    //         Err("Another file with the same name already exists!".into())
    //     );
    // }
    //
    // #[tokio::test]
    // async fn rename_folder_valid_input_rename_folder() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_folder("folder 1".into()).await.unwrap();
    //     service
    //         .create_folder("folder 2/folder 3".into())
    //         .await
    //         .unwrap();
    //     service.create_file("folder 2/file".into()).await.unwrap();
    //
    //     // Act
    //
    //     service
    //         .rename_folder(
    //             get_id(&service.db_conn, "folder 1", true).await,
    //             "new_name".into(),
    //         )
    //         .await
    //         .unwrap();
    //     service
    //         .rename_folder(
    //             get_id(&service.db_conn, "folder 2", true).await,
    //             "new_name_2".into(),
    //         )
    //         .await
    //         .unwrap();
    //
    //     // Assert
    //
    //     let actual = service.get_user_files().await.unwrap();
    //     assert_eq!(actual.len(), 4);
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "new_name" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "new_name_2" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "new_name_2/folder 3" && item.is_folder));
    //     assert!(actual
    //         .iter()
    //         .any(|item| item.path == "new_name_2/file" && !item.is_folder));
    // }
    //
    // #[tokio::test]
    // async fn rename_folder_existing_folder_error_returned() {
    //     // Arrange
    //
    //     let service = create_service().await;
    //     service.create_folder("test".into()).await.unwrap();
    //     service.create_folder("test 2".into()).await.unwrap();
    //
    //     // Act
    //
    //     let actual = service
    //         .rename_folder(
    //             get_id(&service.db_conn, "test", true).await,
    //             "test 2".into(),
    //         )
    //         .await;
    //
    //     // Assert
    //
    //     assert_eq!(
    //         actual,
    //         Err("Another folder with the same name already exists!".into())
    //     );
    // }
    //
}
