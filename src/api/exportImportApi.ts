import { invoke } from "@tauri-apps/api/core";

export function exportItem(itemId: number, exportPath: string) {
	return invoke("export_item", {
		itemId,
		exportPath,
	});
}
