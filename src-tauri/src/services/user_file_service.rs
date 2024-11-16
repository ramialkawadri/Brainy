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

        self.repository
            .update_path(folder_id, new_path.clone())
            .await?;
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

    impl TestDependencies {
        fn new() -> Self {
            TestDependencies {
                user_file_repository: MockUserFileRepository::new(),
            }
        }

        fn to_service(self) -> DefaultUserFileServices {
            DefaultUserFileServices::new(Arc::new(self.user_file_repository))
        }

        fn setup_get_user_files(&mut self, files: Vec<user_file::Model>) {
            self.user_file_repository
                .expect_get_user_files()
                .return_once(|| Ok(files));
        }

        fn setup_get_by_id(&mut self, id: i32, model: user_file::Model) {
            self.user_file_repository
                .expect_get_by_id()
                .with(predicate::eq(id))
                .return_once(|_| Ok(model));
        }

        fn setup_get_folder_sub_files(&mut self, id: i32, files: Vec<user_file::Model>) {
            self.user_file_repository
                .expect_get_folder_sub_files()
                .with(predicate::eq(id))
                .return_once(|_| Ok(files));
        }

        fn setup_folder_exists(&mut self, path: &str, val: bool) {
            self.user_file_repository
                .expect_folder_exists()
                .with(predicate::eq(path.to_string()))
                .return_const(Ok(val));
        }

        fn setup_file_exists(&mut self, path: &str, val: bool) {
            self.user_file_repository
                .expect_file_exists()
                .with(predicate::eq(path.to_string()))
                .return_const(Ok(val));
        }

        fn assert_create_folder(&mut self, path: &str) {
            self.user_file_repository
                .expect_create_folder()
                .with(predicate::eq(path.to_string()))
                .once()
                .return_const(Ok(()));
        }

        fn assert_create_file(&mut self, path: &str) {
            self.user_file_repository
                .expect_create_file()
                .with(predicate::eq(path.to_string()))
                .once()
                .return_const(Ok(()));
        }

        fn assert_update_path(&mut self, id: i32, path: &str) {
            self.user_file_repository
                .expect_update_path()
                .with(predicate::eq(id), predicate::eq(path.to_string()))
                .once()
                .return_const(Ok(()));
        }

        fn assert_delete_folder(&mut self, folder_id: i32) {
            self.user_file_repository
                .expect_delete_folder()
                .with(predicate::eq(folder_id))
                .once()
                .return_const(Ok(()));
        }

        fn assert_delete_file(&mut self, file_id: i32) {
            self.user_file_repository
                .expect_delete_file()
                .with(predicate::eq(file_id))
                .once()
                .return_const(Ok(()));
        }
    }

    #[tokio::test]
    async fn get_user_files_valid_input_returned_user_files() {
        // Arrange

        let mut deps = TestDependencies::new();
        let files: Vec<user_file::Model> = vec![user_file::Model {
            id: 10,
            ..Default::default()
        }];
        deps.setup_get_user_files(files);

        // Act

        let actual = deps.to_service().get_user_files().await.unwrap();

        // Assert

        assert_eq!(actual.len(), 1);
        assert_eq!(actual[0].id, 10);
    }

    #[tokio::test]
    async fn create_folder_nested_path_created_all_folders() {
        // Arrange

        let mut deps = TestDependencies::new();
        deps.setup_folder_exists("folder 1", false);
        deps.setup_folder_exists("folder 1/folder 2", false);

        // Assert

        deps.assert_create_folder("folder 1");
        deps.assert_create_folder("folder 1/folder 2");

        // Act

        deps.to_service()
            .create_folder("folder 1/folder 2".into())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn create_folder_empty_name_returned_error() {
        // Arrange

        let deps = TestDependencies::new();

        // Act

        let actual = deps.to_service().create_folder("  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_folder_existing_folder_returned_error() {
        // Arrange

        let mut deps = TestDependencies::new();
        deps.setup_folder_exists("folder 1", true);

        // Act

        let actual = deps.to_service().create_folder("folder 1".into()).await;

        // Assert

        assert_eq!(actual, Err("Folder already exists!".to_string()));
    }

    #[tokio::test]
    async fn create_file_nested_path_created_all_folders() {
        // Arrange

        let mut deps = TestDependencies::new();
        deps.setup_folder_exists("folder 1", true);
        deps.setup_folder_exists("folder 1/folder 2", false);
        deps.setup_file_exists("folder 1/folder 2/file 1", false);

        // Assert

        deps.assert_create_folder("folder 1/folder 2");
        deps.assert_create_file("folder 1/folder 2/file 1");

        // Act

        deps.to_service()
            .create_file("folder 1/folder 2/file 1".into())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn create_file_empty_name_returned_error() {
        // Arrange

        let deps = TestDependencies::new();

        // Act

        let actual = deps.to_service().create_file("  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_file_existing_file_returned_error() {
        // Arrange

        let mut deps = TestDependencies::new();
        deps.setup_file_exists("file 1", true);

        // Act

        let actual = deps.to_service().create_file("file 1".into()).await;

        // Assert

        assert_eq!(actual, Err("File already exists!".to_string()));
    }

    #[tokio::test]
    async fn delete_file_valid_input_deleted_file() {
        // Arrange

        let mut deps = TestDependencies::new();

        // Assert

        deps.assert_delete_file(10);

        // Act

        deps.to_service().delete_file(10).await.unwrap();
    }

    #[tokio::test]
    async fn delete_folder_valid_input_deleted_folder() {
        // Arrange

        let mut deps = TestDependencies::new();

        // Assert

        deps.assert_delete_folder(10);

        // Act

        deps.to_service().delete_folder(10).await.unwrap();
    }

    #[tokio::test]
    async fn move_file_valid_input_moved_file() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        deps.setup_get_by_id(
            file_id,
            user_file::Model {
                path: "file".into(),
                ..Default::default()
            },
        );
        let destination_folder_id = 2;
        deps.setup_get_by_id(
            destination_folder_id,
            user_file::Model {
                path: "test".into(),
                ..Default::default()
            },
        );
        deps.setup_file_exists("test/file", false);

        // Assert

        deps.assert_update_path(file_id, "test/file");

        // Act

        deps.to_service()
            .move_file(file_id, destination_folder_id)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn move_file_move_to_root_moved_file() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        deps.setup_get_by_id(
            file_id,
            user_file::Model {
                path: "folder 1/file".into(),
                ..Default::default()
            },
        );
        deps.setup_file_exists("file", false);

        // Assert

        deps.assert_update_path(file_id, "file");

        // Act

        deps.to_service().move_file(file_id, 0).await.unwrap();
    }

    #[tokio::test]
    async fn move_file_existing_file_error_returned() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        deps.setup_get_by_id(
            file_id,
            user_file::Model {
                path: "folder 1/file".into(),
                ..Default::default()
            },
        );
        deps.setup_file_exists("file", true);

        // Act

        let actual = deps.to_service().move_file(file_id, 0).await;

        // Assert

        assert_eq!(
            actual,
            Err("Another file with the same name exists!".to_string())
        );
    }

    #[tokio::test]
    async fn move_folder_valid_input_moved_folder() {
        // Arrange

        let mut deps = TestDependencies::new();
        let folder_id = 1;
        deps.setup_get_by_id(
            folder_id,
            user_file::Model {
                path: "test".into(),
                is_folder: true,
                ..Default::default()
            },
        );
        let destination_folder_id = 2;
        deps.setup_get_by_id(
            destination_folder_id,
            user_file::Model {
                path: "test 2".into(),
                is_folder: true,
                ..Default::default()
            },
        );
        deps.setup_folder_exists("test 2/test", false);
        deps.setup_folder_exists("test 2", true);
        let files: Vec<user_file::Model> = vec![
            user_file::Model {
                id: 10,
                path: "test/folder 1/folder 2".into(),
                ..Default::default()
            },
            user_file::Model {
                id: 11,
                path: "test/folder 1/folder 2/file".into(),
                ..Default::default()
            },
            user_file::Model {
                id: 12,
                path: "test/file".into(),
                ..Default::default()
            },
        ];
        deps.setup_get_folder_sub_files(folder_id, files);

        // Assert

        deps.assert_update_path(folder_id, "test 2/test");
        deps.assert_update_path(10, "test 2/test/folder 1/folder 2");
        deps.assert_update_path(11, "test 2/test/folder 1/folder 2/file");
        deps.assert_update_path(12, "test 2/test/file");

        // Act

        deps.to_service()
            .move_folder(folder_id, destination_folder_id)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn move_folder_move_to_root_moved_folder() {
        // Arrange

        let mut deps = TestDependencies::new();
        let folder_id = 1;
        deps.setup_get_by_id(
            folder_id,
            user_file::Model {
                path: "test/folder 1".into(),
                ..Default::default()
            },
        );
        let files: Vec<user_file::Model> = vec![
            user_file::Model {
                id: 10,
                path: "test/folder 1/folder 2".into(),
                ..Default::default()
            },
            user_file::Model {
                id: 11,
                path: "test/folder 1/folder 2/file".into(),
                ..Default::default()
            },
        ];
        deps.setup_get_folder_sub_files(folder_id, files);
        deps.setup_folder_exists("folder 1", false);

        // Assert

        deps.assert_update_path(folder_id, "folder 1");
        deps.assert_update_path(10, "folder 1/folder 2");
        deps.assert_update_path(11, "folder 1/folder 2/file");

        // Act

        deps.to_service().move_folder(folder_id, 0).await.unwrap();
    }

    #[tokio::test]
    async fn move_folder_move_to_inner_folder_error_returned() {
        // Arrange

        let mut deps = TestDependencies::new();
        let folder_id = 1;
        deps.setup_get_by_id(
            folder_id,
            user_file::Model {
                id: folder_id,
                path: "test".to_string(),
                ..Default::default()
            },
        );
        let inner_folder_id = 2;
        deps.setup_get_by_id(
            inner_folder_id,
            user_file::Model {
                id: inner_folder_id,
                path: "test/folder".to_string(),
                ..Default::default()
            },
        );

        // Act

        let actual = deps
            .to_service()
            .move_folder(folder_id, inner_folder_id)
            .await;

        // Assert

        assert_eq!(
            actual,
            Err("You cannot move into an inner folder!".to_string())
        );
    }

    #[tokio::test]
    async fn move_folder_existing_folder_error_returned() {
        // Arrange

        let mut deps = TestDependencies::new();
        let folder_id = 1;
        deps.setup_get_by_id(
            folder_id,
            user_file::Model {
                id: folder_id,
                path: "folder".to_string(),
                ..Default::default()
            },
        );
        let destination_folder_id = 2;
        deps.setup_get_by_id(
            destination_folder_id,
            user_file::Model {
                id: destination_folder_id,
                path: "test".to_string(),
                ..Default::default()
            },
        );
        deps.setup_folder_exists("test/folder", true);

        // Act

        let actual = deps
            .to_service()
            .move_folder(folder_id, destination_folder_id)
            .await;

        // Assert

        assert_eq!(
            actual,
            Err("Another folder with the same name exists!".to_string())
        );
    }

    #[tokio::test]
    async fn rename_file_valid_input_renamed_file() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        deps.setup_get_by_id(
            file_id,
            user_file::Model {
                id: file_id,
                path: "folder/test".to_string(),
                ..Default::default()
            },
        );
        deps.setup_file_exists("folder/new name", false);
        deps.setup_folder_exists("folder", true);

        // Assert

        deps.assert_update_path(file_id, "folder/new name");

        // Act

        deps.to_service()
            .rename_file(file_id, "new name".into())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn rename_file_existing_file_error_returned() {
        // Arrange

        let mut deps = TestDependencies::new();
        let file_id = 1;
        deps.setup_get_by_id(
            file_id,
            user_file::Model {
                id: file_id,
                path: "folder/test".to_string(),
                ..Default::default()
            },
        );
        deps.setup_file_exists("folder/new name", true);

        // Act

        let actual = deps
            .to_service()
            .rename_file(file_id, "new name".into())
            .await;

        // Assert

        assert_eq!(
            actual,
            Err("Another file with the same name already exists!".into())
        );
    }

    #[tokio::test]
    async fn rename_folder_valid_input_renamed_folder() {
        // Arrange

        let mut deps = TestDependencies::new();
        let folder_id = 1;
        deps.setup_get_by_id(
            folder_id,
            user_file::Model {
                id: folder_id,
                path: "test/folder 1".into(),
                ..Default::default()
            },
        );
        let files: Vec<user_file::Model> = vec![
            user_file::Model {
                id: 10,
                path: "test/folder 1/folder 2".into(),
                ..Default::default()
            },
            user_file::Model {
                id: 11,
                path: "test/folder 1/folder 2/file".into(),
                ..Default::default()
            },
        ];
        deps.setup_get_folder_sub_files(folder_id, files);
        deps.setup_folder_exists("test", true);
        deps.setup_folder_exists("test/new name", false);
        deps.setup_folder_exists("test/new name/subfolder", false);

        // Assert

        deps.assert_create_folder("test/new name");
        deps.assert_update_path(folder_id, "test/new name/subfolder");
        deps.assert_update_path(10, "test/new name/subfolder/folder 2");
        deps.assert_update_path(11, "test/new name/subfolder/folder 2/file");

        // Act

        deps.to_service()
            .rename_folder(folder_id, "new name/subfolder".into())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn rename_folder_existing_folder_returned_error() {
        // Arrange

        let mut deps = TestDependencies::new();
        let folder_id = 1;
        deps.setup_get_by_id(
            folder_id,
            user_file::Model {
                id: folder_id,
                path: "test/folder 1".into(),
                ..Default::default()
            },
        );
        deps.setup_folder_exists("test/new name", true);

        // Act

        let actual = deps
            .to_service()
            .rename_folder(folder_id, "new name".into())
            .await;

        // Assert

        assert_eq!(
            actual,
            Err("Another folder with the same name already exists!".into())
        );
    }
}
