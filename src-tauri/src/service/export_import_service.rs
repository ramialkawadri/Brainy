use std::fs;

use sea_orm::DbConn;

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
            children_vec
                .push(Box::pin(get_exported_item(db_conn, folder_child.id, skip_prefix_length)).await?);
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

// TODO: when importing be aware of ids!
