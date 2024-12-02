import { invoke } from "@tauri-apps/api/core";
import Settings from "../types/backend/settings";

export function getSettings(): Promise<Settings> {
	return invoke("get_settings");
}
