use crate::entity::{cell, user_file};
use crate::entity::repetition;

use prelude::Expr;
use sea_orm::DatabaseConnection;
use sea_orm::{entity::*, query::*};

pub async fn get_user_files(db: &DatabaseConnection) -> Result<Vec<user_file::Model>, String> {
    let result = user_file::Entity::find().all(db).await;
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn create_file(db: &DatabaseConnection, path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Name cannot be empty!".into());
    }
    if path.contains("/") {
        create_folder_recursively(db, &get_folder_path(&path)).await?;
    }
    if file_exists(db, &path).await? {
        return Err("File already exists!".into());
    }
    let active_model = user_file::ActiveModel {
        path: Set(path.clone()),
        is_folder: Set(false),
        ..Default::default()
    };
    let result = user_file::Entity::insert(active_model).exec(db).await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn create_folder(db: &DatabaseConnection, path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Name cannot be empty!".into());
    }
    if folder_exists(db, &path).await? {
        return Err("Folder already exists!".into());
    }
    create_folder_recursively(db, &path).await
}

pub async fn delete_file(db: &DatabaseConnection, file_id: i32) -> Result<(), String> {
    let txn = match db.begin().await {
        Ok(txn) => txn,
        Err(err) => return Err(err.to_string()),
    };

    // TODO: update test
    let result = repetition::Entity::delete_many()
        .filter(repetition::Column::FileId.eq(file_id))
        .exec(&txn)
        .await;
    if let Err(err) = result {
        return Err(err.to_string());
    }

    let result = cell::Entity::delete_many()
        .filter(cell::Column::FileId.eq(file_id))
        .exec(&txn)
        .await;
    if let Err(err) = result {
        return Err(err.to_string());
    }

    let result = user_file::Entity::delete_many()
        .filter(user_file::Column::Id.eq(file_id))
        .exec(&txn)
        .await;
    if let Err(err) = result {
        return Err(err.to_string());
    }

    let result = txn.commit().await;

    match result {
        Err(err) => return Err(err.to_string()),
        _ => Ok(()),
    }
}

pub async fn delete_folder(db: &DatabaseConnection, folder_id: i32) -> Result<(), String> {
    let folder = get_by_id(db, folder_id).await?;

    let files = match user_file::Entity::find()
        .filter(user_file::Column::Path.starts_with(folder.path.clone() + "/"))
        .filter(user_file::Column::IsFolder.eq(false))
        .column(user_file::Column::Id)
        .all(db)
        .await
    {
        Ok(file_id) => file_id,
        Err(err) => return Err(err.to_string()),
    };

    let txn = match db.begin().await {
        Ok(txn) => txn,
        Err(err) => return Err(err.to_string()),
    };

    for file in files {
        // TODO: update test
        let result = repetition::Entity::delete_many()
            .filter(repetition::Column::FileId.eq(file.id))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }

        let result = cell::Entity::delete_many()
            .filter(cell::Column::FileId.eq(file.id))
            .exec(&txn)
            .await;
        if let Err(err) = result {
            return Err(err.to_string());
        }
    }

    let result = user_file::Entity::delete_many()
        .filter(user_file::Column::Path.starts_with(folder.path.clone() + "/"))
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
        Err(err) => return Err(err.to_string()),
        _ => Ok(()),
    }
}

pub async fn move_file(
    db: &DatabaseConnection,
    file_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    let file = get_by_id(db, file_id).await?;
    let destination_path = if destination_folder_id == 0 {
        "".into()
    } else {
        get_by_id(db, destination_folder_id).await?.path
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

    if file_exists(db, &new_path).await? {
        return Err("Another file with the same name exists!".into());
    }

    let result = user_file::Entity::update_many()
        .col_expr(user_file::Column::Path, Expr::value(new_path))
        .filter(user_file::Column::Id.eq(file_id))
        .exec(db)
        .await;
    if let Err(err) = result {
        return Err(err.to_string());
    }

    return Ok(());
}

pub async fn move_folder(
    db: &DatabaseConnection,
    folder_id: i32,
    destination_folder_id: i32,
) -> Result<(), String> {
    let folder = get_by_id(db, folder_id).await?;
    let destination_path = if destination_folder_id == 0 {
        "".into()
    } else {
        get_by_id(db, destination_folder_id).await?.path
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

    if folder_exists(db, &new_path).await? {
        return Err("Another folder with the same name exists!".into());
    }

    let result = user_file::Entity::update_many()
        .col_expr(user_file::Column::Path, Expr::value(new_path.clone()))
        .filter(user_file::Column::Id.eq(folder_id))
        .exec(db)
        .await;
    if let Err(err) = result {
        return Err(err.to_string());
    }

    create_folder_recursively(db, &new_path).await?;

    let result = user_file::Entity::find()
        .filter(user_file::Column::Path.starts_with(folder.path.clone() + "/"))
        .all(db)
        .await;

    if let Err(err) = result {
        return Err(err.to_string());
    }

    for row in result.unwrap() {
        let new_row_path = new_path.clone()
            + row
                .path
                .chars()
                .skip(folder.path.len())
                .collect::<String>()
                .as_str();
        let mut row: user_file::ActiveModel = row.into();
        row.path = Set(new_row_path.to_string());
        let result = row.update(db).await;

        if let Err(err) = result {
            return Err(err.to_string());
        }
    }

    Ok(())
}

fn get_file_name(path: &String) -> String {
    let index = path.rfind("/");
    match index {
        Some(index) => path.chars().skip(index + 1).collect(),
        None => path.clone(),
    }
}

pub async fn rename_file(
    db: &DatabaseConnection,
    file_id: i32,
    new_name: String,
) -> Result<(), String> {
    if new_name.trim().is_empty() {
        return Err("Please enter a non empty name!".into());
    }

    let file = get_by_id(db, file_id).await?;

    let new_path = appy_new_name(&file.path, &new_name);
    if file_exists(db, &new_path).await? {
        return Err("Another file with the same name already exists!".into());
    }

    create_folder_recursively(db, &get_folder_path(&new_path)).await?;

    let result = user_file::Entity::update_many()
        .filter(user_file::Column::Id.eq(file_id))
        .col_expr(user_file::Column::Path, Expr::value(new_path))
        .exec(db)
        .await;

    if let Err(err) = result {
        return Err(err.to_string());
    }

    Ok(())
}

pub async fn rename_folder(
    db: &DatabaseConnection,
    folder_id: i32,
    new_name: String,
) -> Result<(), String> {
    if new_name.trim().is_empty() {
        return Err("Please enter a non empty name!".into());
    }

    let folder = get_by_id(db, folder_id).await?;
    let new_path = appy_new_name(&folder.path, &new_name);
    if folder_exists(db, &new_path).await? {
        return Err("Another folder with the same name already exists!".into());
    }

    create_folder_recursively(db, &get_folder_path(&new_path)).await?;

    let result = user_file::Entity::update_many()
        .filter(user_file::Column::Id.eq(folder_id))
        .col_expr(user_file::Column::Path, Expr::value(new_path.clone()))
        .exec(db)
        .await;

    if let Err(err) = result {
        return Err(err.to_string());
    }

    let result = user_file::Entity::find()
        .filter(user_file::Column::Path.starts_with(folder.path.clone() + "/"))
        .all(db)
        .await;

    if let Err(err) = result {
        return Err(err.to_string());
    }

    for row in result.unwrap() {
        let new_row_path = new_path.clone()
            + row
                .path
                .chars()
                .skip(folder.path.len())
                .collect::<String>()
                .as_str();
        let mut row: user_file::ActiveModel = row.into();
        row.path = Set(new_row_path.to_string());
        let result = row.update(db).await;

        if let Err(err) = result {
            return Err(err.to_string());
        }
    }

    Ok(())
}

fn get_folder_path(path: &String) -> String {
    let index = path.rfind("/");
    match index {
        Some(index) => path.chars().take(index).collect::<String>(),
        None => "".into(),
    }
}

fn appy_new_name(path: &String, new_name: &String) -> String {
    let index = path.rfind("/");
    match index {
        Some(index) => path.chars().take(index + 1).collect::<String>() + new_name.as_str(),
        None => new_name.clone(),
    }
}

async fn file_exists(db: &DatabaseConnection, path: &String) -> Result<bool, String> {
    let result = user_file::Entity::find()
        .filter(user_file::Column::Path.eq(path.clone()))
        .filter(user_file::Column::IsFolder.eq(false))
        .count(db)
        .await;

    match result {
        Ok(result) => Ok(result > 0),
        Err(err) => return Err(err.to_string()),
    }
}

async fn create_folder_recursively(db: &DatabaseConnection, path: &String) -> Result<(), String> {
    if path.is_empty() {
        return Ok(());
    }
    let mut current_path = String::new();

    for name in path.split("/") {
        if !current_path.is_empty() {
            current_path.push_str("/");
        }
        current_path.push_str(name);

        if folder_exists(db, &current_path).await? {
            continue;
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

async fn folder_exists(db: &DatabaseConnection, path: &String) -> Result<bool, String> {
    let result = user_file::Entity::find()
        .filter(user_file::Column::Path.eq(path.clone()))
        .filter(user_file::Column::IsFolder.eq(true))
        .count(db)
        .await;

    match result {
        Ok(result) => Ok(result > 0),
        Err(err) => return Err(err.to_string()),
    }
}

async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<user_file::Model, String> {
    let result = user_file::Entity::find_by_id(id).one(db).await;
    match result {
        Ok(result) => Ok(result.unwrap()),
        Err(err) => Err(err.to_string()),
    }
}

#[cfg(test)]
pub mod tests {
    use cell::CellType;

    use super::*;
    use crate::service::{cell_services::create_cell, tests::*};

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
    async fn create_folder_nested_path_created_all_folders() {
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
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/folder 2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/folder 3" && item.is_folder));
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

    #[tokio::test]
    async fn create_file_nested_path_created_all_folders() {
        // Arrange

        let db = get_db().await;

        // Act

        create_file(&db, "folder 1/folder 2/file 1".into())
            .await
            .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 3);
        assert!(actual.iter().any(|item| item.path == "folder 1"));
        assert!(actual.iter().any(|item| item.path == "folder 1/folder 2"));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/folder 2/file 1" && !item.is_folder));
    }

    #[tokio::test]
    async fn create_file_empty_name_returned_error() {
        // Arrange

        let db = get_db().await;

        // Act

        let actual = create_file(&db, "  ".into()).await;

        // Assert

        assert_eq!(actual, Err("Name cannot be empty!".to_string()));
    }

    #[tokio::test]
    async fn create_file_existing_file_returned_error() {
        // Arrange

        let db = get_db().await;

        // Act

        create_file(&db, "file 1".into()).await.unwrap();
        let actual = create_file(&db, "file 1".into()).await;

        // Assert

        assert_eq!(actual, Err("File already exists!".to_string()));
    }

    #[tokio::test]
    async fn delete_file_valid_input_deleted_file() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "test".into()).await.unwrap();
        create_file(&db, "test".into()).await.unwrap();
        create_file(&db, "test 2".into()).await.unwrap();

        let file_id = get_id(&db, "test", false).await;
        create_cell(&db, file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        let file_id = get_id(&db, "test 2", false).await;
        create_cell(&db, file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        // Act

        delete_file(&db, get_id(&db, "test", false).await)
            .await
            .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 2);
        let cell_counts = cell::Entity::find().all(&db).await.unwrap();
        assert_eq!(cell_counts.len(), 1);
    }

    #[tokio::test]
    async fn delete_folder_valid_input_deleted_folder() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "test".into()).await.unwrap();
        create_file(&db, "test/file".into()).await.unwrap();
        let file_id = get_id(&db, "test/file", false).await;
        create_cell(&db, file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        create_file(&db, "test".into()).await.unwrap();
        let file_id = get_id(&db, "test", false).await;
        create_cell(&db, file_id, "".into(), CellType::FlashCard, 0)
            .await
            .unwrap();

        // Act

        delete_folder(&db, get_id(&db, "test", true).await)
            .await
            .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 1);
        let cell_counts = cell::Entity::find().all(&db).await.unwrap();
        assert_eq!(cell_counts.len(), 1);
    }

    #[tokio::test]
    async fn move_file_valid_input_moved_file() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "test".into()).await.unwrap();
        create_folder(&db, "test 2".into()).await.unwrap();
        create_file(&db, "test".into()).await.unwrap();

        // Act

        move_file(
            &db,
            get_id(&db, "test", false).await,
            get_id(&db, "test 2", true).await,
        )
        .await
        .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 3);
        assert!(actual
            .iter()
            .any(|item| item.path == "test" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test 2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test 2/test" && !item.is_folder));
    }

    #[tokio::test]
    async fn move_file_move_to_root_moved_file() {
        // Arrange

        let db = get_db().await;
        create_file(&db, "test/folder 1/folder 2/file".into())
            .await
            .unwrap();

        // Act

        move_file(
            &db,
            get_id(&db, "test/folder 1/folder 2/file", false).await,
            0,
        )
        .await
        .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 4);
        assert!(actual
            .iter()
            .any(|item| item.path == "test" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test/folder 1" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test/folder 1/folder 2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "file" && !item.is_folder));
    }

    #[tokio::test]
    async fn move_file_existing_file_error_returned() {
        // Arrange

        let db = get_db().await;
        create_file(&db, "test".into()).await.unwrap();
        create_file(&db, "folder/test".into()).await.unwrap();

        // Act

        let actual = move_file(
            &db,
            get_id(&db, "test", false).await,
            get_id(&db, "folder", true).await,
        )
        .await;

        // Assert

        assert_eq!(
            actual,
            Err("Another file with the same name exists!".to_string())
        );
    }

    #[tokio::test]
    async fn move_folder_valid_input_moved_folder() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "test/folder 1/folder 2".into())
            .await
            .unwrap();
        create_file(&db, "test/folder 1/folder 2/file".into())
            .await
            .unwrap();
        create_folder(&db, "test 2".into()).await.unwrap();
        create_file(&db, "test".into()).await.unwrap();

        // Act

        move_folder(
            &db,
            get_id(&db, "test", true).await,
            get_id(&db, "test 2", true).await,
        )
        .await
        .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 6);
        assert!(actual
            .iter()
            .any(|item| item.path == "test" && !item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test 2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test 2/test" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test 2/test/folder 1" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test 2/test/folder 1/folder 2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "test 2/test/folder 1/folder 2/file" && !item.is_folder));
    }

    #[tokio::test]
    async fn move_folder_move_to_root_moved_folder() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "test/folder 1/folder 2".into())
            .await
            .unwrap();
        create_file(&db, "test/folder 1/folder 2/file".into())
            .await
            .unwrap();

        // Act

        move_folder(&db, get_id(&db, "test/folder 1", true).await, 0)
            .await
            .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 4);
        assert!(actual
            .iter()
            .any(|item| item.path == "test" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/folder 2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/folder 2/file" && !item.is_folder));
    }

    #[tokio::test]
    async fn move_folder_move_to_inner_folder_error_returned() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "test/folder 1/folder 2".into())
            .await
            .unwrap();

        // Act

        let actual = move_folder(
            &db,
            get_id(&db, "test", true).await,
            get_id(&db, "test/folder 1", true).await,
        )
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

        let db = get_db().await;
        create_folder(&db, "test".into()).await.unwrap();
        create_folder(&db, "test 2/test".into()).await.unwrap();

        // Act

        let actual = move_folder(
            &db,
            get_id(&db, "test", true).await,
            get_id(&db, "test 2", true).await,
        )
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

        let db = get_db().await;
        create_file(&db, "test".into()).await.unwrap();
        create_file(&db, "folder 1/test 2".into()).await.unwrap();
        create_file(&db, "folder 1/test 3".into()).await.unwrap();

        // Act

        rename_file(&db, get_id(&db, "test", false).await, "new_name".into())
            .await
            .unwrap();
        rename_file(
            &db,
            get_id(&db, "folder 1/test 2", false).await,
            "new_name_2".into(),
        )
        .await
        .unwrap();
        rename_file(
            &db,
            get_id(&db, "folder 1/test 3", false).await,
            "folder 2/new_name_3".into(),
        )
        .await
        .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 5);
        assert!(actual
            .iter()
            .any(|item| item.path == "new_name" && !item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/new_name_2" && !item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/folder 2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "folder 1/folder 2/new_name_3" && !item.is_folder));
    }

    #[tokio::test]
    async fn rename_file_existing_file_error_returned() {
        // Arrange

        let db = get_db().await;
        create_file(&db, "test".into()).await.unwrap();
        create_file(&db, "test 2".into()).await.unwrap();

        // Act

        let actual = rename_file(&db, get_id(&db, "test", false).await, "test 2".into()).await;

        // Assert

        assert_eq!(
            actual,
            Err("Another file with the same name already exists!".into())
        );
    }

    #[tokio::test]
    async fn rename_folder_valid_input_rename_folder() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "folder 1".into()).await.unwrap();
        create_folder(&db, "folder 2/folder 3".into())
            .await
            .unwrap();
        create_file(&db, "folder 2/file".into()).await.unwrap();

        // Act

        rename_folder(&db, get_id(&db, "folder 1", true).await, "new_name".into())
            .await
            .unwrap();
        rename_folder(
            &db,
            get_id(&db, "folder 2", true).await,
            "new_name_2".into(),
        )
        .await
        .unwrap();

        // Assert

        let actual = get_user_files(&db).await.unwrap();
        assert_eq!(actual.len(), 4);
        assert!(actual
            .iter()
            .any(|item| item.path == "new_name" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "new_name_2" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "new_name_2/folder 3" && item.is_folder));
        assert!(actual
            .iter()
            .any(|item| item.path == "new_name_2/file" && !item.is_folder));
    }

    #[tokio::test]
    async fn rename_folder_existing_folder_error_returned() {
        // Arrange

        let db = get_db().await;
        create_folder(&db, "test".into()).await.unwrap();
        create_folder(&db, "test 2".into()).await.unwrap();

        // Act

        let actual = rename_folder(&db, get_id(&db, "test", true).await, "test 2".into()).await;

        // Assert

        assert_eq!(
            actual,
            Err("Another folder with the same name already exists!".into())
        );
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
