import { invoke } from "@tauri-apps/api/core";
import Settings from "../type/backend/model/settings";
import UpdateSettingsRequest from "../type/backend/dto/updateSettingsRequestDto";

export function getSettings(): Promise<Settings> {
	return invoke("get_settings");
}

export function updateSettings(
	updateSettingsRequest: UpdateSettingsRequest,
): Promise<void> {
	return invoke("update_settings", {
		newSettings: updateSettingsRequest,
	});
}
