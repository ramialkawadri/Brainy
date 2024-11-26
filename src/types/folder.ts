import FileRepetitionCounts from "../entities/fileRepetitionCounts";
import File from "./file";

export default interface Folder {
	id: number;
	name: string;
	subFolders: Folder[];
	files: File[];
    // TODO: remove nullable
	repetitionCounts?: FileRepetitionCounts,
}
