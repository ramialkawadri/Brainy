use crate::entity::user_file;
use crate::entity::UserFile;
use crate::AppState;
use sea_orm::{entity::*, query::*};
use tauri::State;
use tokio::sync::Mutex;

// TODO: check that everything from the backend is moved here

#[tauri::command]
pub async fn get_files(state: State<'_, Mutex<AppState>>) -> Result<Vec<user_file::Model>, String> {
    let state = state.lock().await;
    let result = UserFile::find().all(&state.connection).await;
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn create_folder(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), String> {
    // TODO: create recusively
    if path.trim().len() == 0 {
        return Err("Name cannot be empty".into());
    }

    let state = state.lock().await;
    let result = UserFile::find()
        .filter(user_file::Column::Path.eq(path.clone()))
        .count(&state.connection)
        .await;
    match result {
        Ok(result) => {
            if result > 0 {
                return Err("Folder already exists!".into());
            }
        }
        Err(err) => return Err(err.to_string()),
    }

    let active_model = user_file::ActiveModel {
        path: Set(path),
        is_folder: Set(true),
        ..Default::default()
    };
    let result = active_model.insert(&state.connection).await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn create_file(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), ()> {
    let state = state.lock().await;
    let active_model = user_file::ActiveModel {
        path: Set(path),
        is_folder: Set(false),
        ..Default::default()
    };
    UserFile::insert(active_model)
        .exec(&state.connection)
        .await
        .unwrap();
    // TODO: handle error
    return Ok(());
}
