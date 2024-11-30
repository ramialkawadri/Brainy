import FileRepetitionCounts from "./backend/fileRepetitionCounts";

export default interface ParsedFile {
	id: number;
	name: string;
	repetitionCounts: FileRepetitionCounts;
}
