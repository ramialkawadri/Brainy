import { invoke } from "@tauri-apps/api/core";
import FileRepetitionCounts from "../entities/fileRepetitionCounts";
import Repetition from "../entities/repetition";

export function getStudyRepetitionCounts(
	fileId: number,
): Promise<FileRepetitionCounts> {
	return invoke("get_study_repetition_counts", {
		fileId,
	});
}

export function updateRepetition(repetition: Repetition) {
	return invoke("update_repetition", { repetition });
}

export function getFileRepetitions(fileId: number): Promise<Repetition[]> {
	return invoke("get_file_repetitions", {
		fileId,
	});
}
