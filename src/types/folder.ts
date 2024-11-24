import File from "./file";

export default interface Folder {
	id: number;
	name: string;
	subFolders: Folder[];
	files: File[];
	// repetitionCounts: CellRepetitionCountsDto,
}
