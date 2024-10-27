use crate::entity::user_file;
use crate::entity::UserFile;

use sea_orm::DatabaseConnection;
use sea_orm::{entity::*, query::*};

// TODO: check that everything from the backend is moved here

pub async fn get_user_files(db: &DatabaseConnection) -> Result<Vec<user_file::Model>, String> {
    let result = UserFile::find().all(db).await;
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn create_folder(db: &DatabaseConnection, path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Name cannot be empty!".into());
    }
    create_folder_recursively(db, path, true).await
}

pub async fn create_file(db: &DatabaseConnection, path: String) -> Result<(), String> {
    // TODO: test
    if path.contains("/") {
        create_folder_recursively(db, get_folder_path(&path), false).await?;
    }
    let result = UserFile::find()
        .filter(user_file::Column::Path.eq(path.clone()))
        .filter(user_file::Column::IsFolder.eq(false))
        .count(db)
        .await;
    match result {
        Ok(result) => {
            if result > 0 {
                return Err("File already exists!".into());
            }
        }
        Err(err) => return Err(err.to_string()),
    }
    let active_model = user_file::ActiveModel {
        path: Set(path.clone()),
        is_folder: Set(false),
        ..Default::default()
    };
    UserFile::insert(active_model).exec(db).await.unwrap();
    Ok(())
}

fn get_folder_path(path: &String) -> String {
    let index = path.rfind("/");
    match index {
        Some(index) => path.chars().take(index).collect::<String>(),
        None => "".into(),
    }
}

async fn create_folder_recursively(
    db: &DatabaseConnection,
    path: String,
    check_existense: bool,
) -> Result<(), String> {
    let mut current_path = String::new();

    for name in path.split("/") {
        if !current_path.is_empty() {
            current_path.push_str("/");
        }
        current_path.push_str(name);

        let result = UserFile::find()
            .filter(user_file::Column::Path.eq(current_path.clone()))
            .filter(user_file::Column::IsFolder.eq(true))
            .count(db)
            .await;
        match result {
            Ok(result) => {
                if result > 0 && current_path == path && check_existense {
                    return Err("Folder already exists!".into());
                }
            }
            Err(err) => return Err(err.to_string()),
        }

        let active_model = user_file::ActiveModel {
            path: Set(current_path.to_string()),
            is_folder: Set(true),
            ..Default::default()
        };

        let result = active_model.insert(db).await;
        match result {
            Err(err) => return Err(err.to_string()),
            _ => (),
        };
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use sea_orm::Database;

    async fn get_db() -> DatabaseConnection {
        let connection = Database::connect("sqlite::memory:").await.unwrap();
        crate::migration::setup_schema(&connection).await.unwrap();
        connection
    }

    #[tokio::test]
    async fn create_folder_valid_input_created_folder() {
        // Arrange

        let db = get_db().await;

        // Act

        create_folder(&db, "folder 1".into()).await.unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 1);
        assert_eq!(actual[0].path, "folder 1");
        assert_eq!(actual[0].is_folder, true);
        assert_eq!(actual[0].id, 1);
    }

    #[tokio::test]
    async fn create_folder_neste_path_created_all_folders() {
        // Arrange

        let db = get_db().await;

        // Act

        create_folder(&db, "folder 1/folder 2".into())
            .await
            .unwrap();
        create_folder(&db, "folder 1/folder 3".into())
            .await
            .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 3);
        assert!(actual.iter().any(|item| item.path == "folder 1"));
        assert!(actual.iter().any(|item| item.path == "folder 1/folder 2"));
        assert!(actual.iter().any(|item| item.path == "folder 1/folder 3"));
    }

    #[tokio::test]
    async fn create_folder_empty_name_returned_error() {
        // Arrange

        let db = get_db().await;

        // Act

        let actual = create_folder(&db, "  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_folder_existing_folder_returned_error() {
        // Arrange

        let db = get_db().await;

        // Act

        create_folder(&db, "folder 1".into()).await.unwrap();
        let actual = create_folder(&db, "folder 1".into()).await;

        // Assert

        assert_eq!(actual, Err("Folder already exists!".to_string()));
    }
}
