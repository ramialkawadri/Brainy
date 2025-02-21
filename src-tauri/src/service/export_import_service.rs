use std::fs::{self, File};

use sea_orm::{DbConn, query::*};

use crate::dto::exported_item::{ExportedCell, ExportedItem, ExportedItemType};

use super::{cell_service, file_service};

// TODO: unit test
pub async fn export_item(
    db_conn: &DbConn,
    item_id: i32,
    export_path: String,
) -> Result<(), String> {
    let item = file_service::get_by_id(db_conn, item_id).await?;
    let slash_index = item.path.find('/');
    let skip_prefix_length = if let Some(index) = slash_index {
        index + 1
    } else {
        0
    };
    let exported_item = get_exported_item(db_conn, item_id, skip_prefix_length).await?;
    let result = fs::write(export_path, serde_json::to_string(&exported_item).unwrap());

    if let Err(err) = result {
        return Err(err.to_string());
    }

    Ok(())
}

async fn get_exported_item(
    db_conn: &DbConn,
    item_id: i32,
    skip_prefix_length: usize,
) -> Result<ExportedItem, String> {
    let item = file_service::get_by_id(db_conn, item_id).await?;
    let cells: Option<Vec<ExportedCell>> = if item.is_folder {
        None
    } else {
        Some(
            cell_service::get_file_cells_ordered_by_index(db_conn, item_id)
                .await?
                .into_iter()
                .map(|cell| ExportedCell::from(cell))
                .collect(),
        )
    };
    let mut children: Option<Vec<ExportedItem>> = None;

    if item.is_folder {
        let folder_children = file_service::list_folder_children(db_conn, item_id).await?;
        let mut children_vec = Vec::with_capacity(folder_children.len());
        for folder_child in folder_children {
            children_vec.push(
                Box::pin(get_exported_item(
                    db_conn,
                    folder_child.id,
                    skip_prefix_length,
                ))
                .await?,
            );
        }
        children = Some(children_vec);
    }

    let exported_item = ExportedItem::new(
        item.path.chars().skip(skip_prefix_length).collect(),
        if item.is_folder {
            ExportedItemType::Folder
        } else {
            ExportedItemType::File
        },
        cells,
        children,
    );

    Ok(exported_item)
}

// TODO: unit test
pub async fn import_file(
    db_conn: &DbConn,
    import_item_path: String,
    // TODO: make into a number
    import_into_path: String,
) -> Result<(), String> {
    let import_file = match File::open(import_item_path) {
        Err(err) => return Err(err.to_string()),
        Ok(file) => file,
    };

    let exported_item: ExportedItem = match serde_json::from_reader(import_file) {
        Err(err) => return Err(err.to_string()),
        Ok(exported_item) => exported_item,
    };

    let txn = match db_conn.begin().await {
        Ok(txn) => txn,
        Err(err) => return Err(err.to_string()),
    };

    import_exported_item(&txn, &exported_item, &import_into_path).await?;

    let result = txn.commit().await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => return Err(err.to_string()),
    }
}

async fn import_exported_item(
    db_conn: &impl ConnectionTrait,
    exported_item: &ExportedItem,
    parent_folder_path: &String,
) -> Result<(), String> {
    match exported_item.item_type {
        ExportedItemType::File => {
            import_file_from_exported_item(db_conn, exported_item, parent_folder_path).await
        }
        ExportedItemType::Folder => {
            Box::pin(import_folder_from_exported_item(
                db_conn,
                exported_item,
                parent_folder_path,
            ))
            .await
        }
    }
}

async fn import_file_from_exported_item(
    db_conn: &impl ConnectionTrait,
    exported_item: &ExportedItem,
    parent_folder_path: &String,
) -> Result<(), String> {
    let file_id = file_service::create_file(
        db_conn,
        format!("{parent_folder_path}/{}", exported_item.path),
    )
    .await?;

    match exported_item.cells.as_ref() {
        Some(cells) => {
            for (i, cell) in cells.iter().enumerate() {
                cell_service::create_cell_no_transaction(
                    db_conn,
                    file_id,
                    &cell.content,
                    &cell.cell_type,
                    i as i32,
                )
                .await?;
            }
        }
        _ => {}
    }

    Ok(())
}

async fn import_folder_from_exported_item(
    db_conn: &impl ConnectionTrait,
    exported_item: &ExportedItem,
    parent_folder_path: &String,
) -> Result<(), String> {
    file_service::create_folder(
        db_conn,
        format!("{parent_folder_path}/{}", exported_item.path),
    )
    .await?;

    match exported_item.children.as_ref() {
        Some(children) => {
            for child in children {
                import_exported_item(db_conn, &child, parent_folder_path).await?
            }
        }
        _ => {}
    }

    Ok(())
}
