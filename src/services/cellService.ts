import { invoke } from "@tauri-apps/api/core";
import Cell from "../entities/cell";

export function getFileCellsOrderedByIndex(fileId: number): Promise<Cell[]> {
	return invoke("get_file_cells_ordered_by_index", {
		fileId,
	});
}

export function updateCell(cellId: number, content: string) {
	return invoke("update_cell", {
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
