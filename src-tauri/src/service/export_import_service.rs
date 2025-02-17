use std::fs;

use sea_orm::DbConn;

use crate::{
    dto::exported_item::{ExportedItem, ExportedItemType},
    entity::cell,
};

use super::{cell_service, file_service};

// TODO: test
pub async fn export_item(
    db_conn: &DbConn,
    item_id: i32,
    export_path: String,
) -> Result<(), String> {
    let exported_item = get_exported_item(db_conn, item_id).await?;
    let result = fs::write(export_path, serde_json::to_string(&exported_item).unwrap());

    if let Err(err) = result {
        return Err(err.to_string());
    }

    Ok(())
}

// TODO: fix relative path
async fn get_exported_item(db_conn: &DbConn, item_id: i32) -> Result<ExportedItem, String> {
    let item = file_service::get_by_id(db_conn, item_id).await?;
    let cells: Option<Vec<cell::Model>> = if item.is_folder {
        None
    } else {
        Some(cell_service::get_file_cells_ordered_by_index(db_conn, item_id).await?)
    };
    let mut children: Option<Vec<ExportedItem>> = None;

    if item.is_folder {
        let sub_files = file_service::get_folder_sub_files(db_conn, item_id).await?;
        let mut children_vec = Vec::with_capacity(sub_files.len());
        for sub_file in sub_files {
            children_vec.push(Box::pin(get_exported_item(db_conn, sub_file.id)).await?);
        }
        children = Some(children_vec);
    }

    let exported_item = ExportedItem::new(
        item.path,
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
