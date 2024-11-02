use crate::entity::cell::{self, CellType};

use prelude::Expr;
use sea_orm::DatabaseConnection;
use sea_orm::{entity::*, query::*};

pub async fn get_cells(
    db: &DatabaseConnection,
    file_id: i32,
) -> Result<Vec<cell::Model>, String> {
    let result = cell::Entity::find()
        .filter(cell::Column::FileId.eq(file_id))
        .order_by_asc(cell::Column::Index)
        .all(db)
        .await;
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn create_cell(
    db: &DatabaseConnection,
    file_id: i32,
    content: String,
    cell_type: CellType,
    index: i32,
) -> Result<(), String> {
    let result = cell::Entity::update_many()
        .filter(cell::Column::FileId.eq(file_id))
        .filter(cell::Column::Index.gte(index))
        .col_expr(cell::Column::Index, Expr::col(cell::Column::Index).add(1))
        .exec(db)
        .await;
    if let Err(err) = result {
        return Err(err.to_string());
    }
    
    let active_model = cell::ActiveModel {
        file_id: Set(file_id),
        cell_type: Set(cell_type),
        content: Set(content),
        index: Set(index),
        ..Default::default()
    };
    let result = cell::Entity::insert(active_model).exec(db).await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::service::tests::*;
    use crate::service::user_file_service::*;
    use crate::service::user_file_service::tests::*;

    #[tokio::test]
    async fn create_cell_valid_input_created_cells() {
        // Arrange

        let db = get_db().await;
        create_file(&db, "file 1".into()).await.unwrap();
        let file_id = get_id(&db, "file 1", false).await;

        // Act

        create_cell(&db, file_id, "1".into(), CellType::FlashCard, 0).await.unwrap();
        create_cell(&db, file_id, "2".into(), CellType::FlashCard, 0).await.unwrap();
        create_cell(&db, file_id, "3".into(), CellType::FlashCard, 0).await.unwrap();
        create_cell(&db, file_id, "4".into(), CellType::Note, 0).await.unwrap();

        // Assert

        let actual = get_cells(&db, file_id).await.unwrap();
        assert_eq!(actual.len(), 4);
        assert_eq!(actual[0].content, "4");
        assert_eq!(actual[1].content, "3");
        assert_eq!(actual[2].content, "2");
        assert_eq!(actual[3].content, "1");

        assert_eq!(actual[0].cell_type, CellType::Note);
        assert_eq!(actual[1].cell_type, CellType::FlashCard);
        assert_eq!(actual[2].cell_type, CellType::FlashCard);
        assert_eq!(actual[3].cell_type, CellType::FlashCard);
    }
}
