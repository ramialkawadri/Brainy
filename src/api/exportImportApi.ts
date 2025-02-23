import { invoke } from "@tauri-apps/api/core";

export function exportItem(itemId: number, exportPath: string) {
	return invoke("export", {
		itemId,
		exportPath,
	});
}

export function importFile(importItemPath: string, importIntoFolderId: number) {
	return invoke("import", {
		importItemPath,
		importIntoFolderId,
	});
}
