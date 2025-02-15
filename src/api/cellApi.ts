import { invoke } from "@tauri-apps/api/core";
import Cell from "../type/backend/entity/cell";

export function getFileCellsOrderedByIndex(fileId: number): Promise<Cell[]> {
	return invoke("get_file_cells_ordered_by_index", {
		fileId,
	});
}

// TODO: update to take rust changes into here
export function updateCellContent(cellId: number, content: string) {
	return invoke("update_cell_content", {
		cellId,
		content,
	});
}

export function createCell(cell: Cell) {
	return invoke("create_cell", { ...cell });
}

export function deleteCell(cellId: number) {
	return invoke("delete_cell", { cellId });
}

export function moveCell(cellId: number, newIndex: number) {
	return invoke("move_cell", {
		cellId,
		newIndex,
	});
}

export function getCellsForFiles(fileIds: number[]): Promise<Cell[]> {
	return invoke("get_cells_for_files", { fileIds });
}
