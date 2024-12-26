use crate::entity::cell::{self, CellType};

use prelude::Expr;
use sea_orm::{entity::*, query::*, DbConn};

use super::repetition_service;

pub async fn get_file_cells_ordered_by_index(
    db_conn: &DbConn,
    file_id: i32,
) -> Result<Vec<cell::Model>, String> {
    let result = cell::Entity::find()
        .filter(cell::Column::FileId.eq(file_id))
        .order_by_asc(cell::Column::Index)
        .all(db_conn)
        .await;
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn create_cell(
    db_conn: &DbConn,
    file_id: i32,
    content: String,
    cell_type: CellType,
    index: i32,
) -> Result<i32, String> {
    increase_cells_indices_starting_from(db_conn, file_id, index, 1).await?;

    let active_model = cell::ActiveModel {
        file_id: Set(file_id),
        cell_type: Set(cell_type.clone()),
        content: Set(content.clone()),
        index: Set(index),
        ..Default::default()
    };
    let result = cell::Entity::insert(active_model).exec(db_conn).await;
    let cell_id = match result {
        Ok(insert_result) => insert_result.last_insert_id,
        Err(err) => return Err(err.to_string()),
    };

    repetition_service::update_repetitions_for_cell(db_conn, file_id, cell_id, cell_type, &content)
        .await?;
    Ok(cell_id)
}

pub async fn delete_cell(db_conn: &DbConn, cell_id: i32) -> Result<(), String> {
    let cell = get_cell_by_id(db_conn, cell_id).await?;

    let result = cell::Entity::delete_many()
        .filter(cell::Column::Id.eq(cell_id))
        .exec(db_conn)
        .await;
    if let Err(err) = result {
        return Err(err.to_string());
    }

    increase_cells_indices_starting_from(db_conn, cell.file_id, cell.index, -1).await?;
    Ok(())
}

pub async fn move_cell(db_conn: &DbConn, cell_id: i32, new_index: i32) -> Result<(), String> {
    let cell = get_cell_by_id(db_conn, cell_id).await?;
    let new_index = if new_index > cell.index {
        new_index - 1
    } else {
        new_index
    };
    increase_cells_indices_starting_from(db_conn, cell.file_id, cell.index + 1, -1).await?;
    increase_cells_indices_starting_from(db_conn, cell.file_id, new_index, 1).await?;
    update_cell(
        db_conn,
        cell::ActiveModel {
            id: Set(cell_id),
            index: Set(new_index),
            ..Default::default()
        },
    )
    .await?;
    Ok(())
}

async fn increase_cells_indices_starting_from(
    db_conn: &DbConn,
    file_id: i32,
    start_index: i32,
    increase_value: i32,
) -> Result<(), String> {
    let result = cell::Entity::update_many()
        .filter(cell::Column::FileId.eq(file_id))
        .filter(cell::Column::Index.gte(start_index))
        .col_expr(
            cell::Column::Index,
            Expr::col(cell::Column::Index).add(increase_value),
        )
        .exec(db_conn)
        .await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn update_cell_content(
    db_conn: &DbConn,
    cell_id: i32,
    content: String,
) -> Result<(), String> {
    let cell = get_cell_by_id(db_conn, cell_id).await?;
    update_cell(
        db_conn,
        cell::ActiveModel {
            id: Set(cell_id),
            content: Set(content.clone()),
            ..Default::default()
        },
    )
    .await?;

    repetition_service::update_repetitions_for_cell(
        db_conn,
        cell.file_id,
        cell_id,
        cell.cell_type,
        &content,
    )
    .await
}

async fn get_cell_by_id(db_conn: &DbConn, cell_id: i32) -> Result<cell::Model, String> {
    let result = cell::Entity::find_by_id(cell_id).one(db_conn).await;
    match result {
        Ok(cell) => Ok(cell.unwrap()),
        Err(err) => Err(err.to_string()),
    }
}

async fn update_cell(db_conn: &DbConn, cell: cell::ActiveModel) -> Result<(), String> {
    let result = cell::Entity::update(cell).exec(db_conn).await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn get_cells_for_files(
    db_conn: &DbConn,
    file_ids: Vec<i32>,
) -> Result<Vec<cell::Model>, String> {
    let mut cells: Vec<cell::Model> = Vec::new();
    for file_id in file_ids {
        let result = cell::Entity::find()
            .filter(cell::Column::FileId.eq(file_id))
            .all(db_conn)
            .await;
        let mut file_cells = match result {
            Ok(result) => result,
            Err(err) => return Err(err.to_string()),
        };
        cells.append(&mut file_cells);
    }
    Ok(cells)
}

#[cfg(test)]
mod tests {
    use crate::service::{file_service, tests::get_db};

    use super::*;

    async fn create_file(db_conn: &DbConn, path: &str) -> i32 {
        file_service::create_file(db_conn, path.to_string())
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn create_cell_valid_input_created_cells() {
        // Arrange

        let db_conn = get_db().await;
        let file_id = create_file(&db_conn, "file 1").await;
        let index = 1;

        for i in 0..2 {
            cell::ActiveModel {
                index: Set(i),
                file_id: Set(file_id),
                content: Set("Already created".into()),
                cell_type: Set(CellType::Note),
                ..Default::default()
            }
            .insert(&db_conn)
            .await
            .unwrap();
        }

        // Act

        create_cell(
            &db_conn,
            file_id,
            "New cell content".into(),
            CellType::Note,
            index,
        )
        .await
        .unwrap();

        // Assert

        let actual = get_file_cells_ordered_by_index(&db_conn, file_id)
            .await
            .unwrap();
        assert_eq!(actual[1].content, String::from("New cell content"));
    }

    #[tokio::test]
    pub async fn delete_cell_valid_input_deleted_cell() {
        // Arrange

        let db_conn = get_db().await;
        let file_id = create_file(&db_conn, "file 1").await;
        let cell_id = create_cell(&db_conn, file_id, "".into(), CellType::Note, 0)
            .await
            .unwrap();

        // Act

        delete_cell(&db_conn, cell_id).await.unwrap();

        // Assert

        let actual = get_file_cells_ordered_by_index(&db_conn, file_id)
            .await
            .unwrap();
        assert_eq!(actual.len(), 0);
    }

    #[tokio::test]
    pub async fn move_cell_move_forward_moved_cell() {
        // Arrange

        let db_conn = get_db().await;
        let file_id = create_file(&db_conn, "file 1").await;
        create_cell(&db_conn, file_id, "0".into(), CellType::FlashCard, 0)
            .await
            .unwrap();
        let cell_id = create_cell(&db_conn, file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        create_cell(&db_conn, file_id, "2".into(), CellType::FlashCard, 2)
            .await
            .unwrap();
        create_cell(&db_conn, file_id, "3".into(), CellType::Note, 3)
            .await
            .unwrap();
        let new_index = 3;

        // Act

        move_cell(&db_conn, cell_id, new_index).await.unwrap();

        // Assert

        let actual = get_file_cells_ordered_by_index(&db_conn, file_id)
            .await
            .unwrap();
        assert_eq!(actual[0].content, "0".to_string());
        assert_eq!(actual[1].content, "2".to_string());
        assert_eq!(actual[2].content, "1".to_string());
        assert_eq!(actual[3].content, "3".to_string());
    }

    #[tokio::test]
    pub async fn move_cell_move_backward_moved_cell() {
        // Arrange

        let db_conn = get_db().await;
        let file_id = create_file(&db_conn, "file 1").await;
        create_cell(&db_conn, file_id, "0".into(), CellType::FlashCard, 0)
            .await
            .unwrap();
        create_cell(&db_conn, file_id, "1".into(), CellType::FlashCard, 1)
            .await
            .unwrap();
        let cell_id = create_cell(&db_conn, file_id, "2".into(), CellType::FlashCard, 2)
            .await
            .unwrap();
        create_cell(&db_conn, file_id, "3".into(), CellType::Note, 3)
            .await
            .unwrap();
        let new_index = 1;

        // Act

        move_cell(&db_conn, cell_id, new_index).await.unwrap();

        // Assert

        let actual = get_file_cells_ordered_by_index(&db_conn, file_id)
            .await
            .unwrap();
        assert_eq!(actual[0].content, "0".to_string());
        assert_eq!(actual[1].content, "2".to_string());
        assert_eq!(actual[2].content, "1".to_string());
        assert_eq!(actual[3].content, "3".to_string());
    }

    #[tokio::test]
    pub async fn update_cell_content_valid_input_content_updated() {
        // Arrange

        let db_conn = get_db().await;
        let file_id = create_file(&db_conn, "file 1").await;
        let cell_id = create_cell(
            &db_conn,
            file_id,
            "Old content".into(),
            CellType::FlashCard,
            2,
        )
        .await
        .unwrap();

        // Act

        update_cell_content(&db_conn, cell_id, "New content".into())
            .await
            .unwrap();

        // Assert

        let actual = get_cell_by_id(&db_conn, cell_id).await.unwrap();
        assert_eq!(actual.content, "New content".to_string());
    }

    #[tokio::test]
    pub async fn get_cells_for_files_valid_input_returned_cells() {
        // Arrange

        let db_conn = get_db().await;
        let file1_id = create_file(&db_conn, "file 1").await;

        for i in 0..2 {
            create_cell(&db_conn, file1_id, "".into(), CellType::Note, i)
                .await
                .unwrap();
        }

        let file2_id = create_file(&db_conn, "file 2").await;
        for i in 0..3 {
            create_cell(&db_conn, file2_id, "".into(), CellType::Note, i)
                .await
                .unwrap();
        }

        // Act

        let actual = get_cells_for_files(&db_conn, vec![file1_id, file2_id])
            .await
            .unwrap();

        // Assert

        assert_eq!(5, actual.len());
    }
}
