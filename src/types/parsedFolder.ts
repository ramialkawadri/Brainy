import FileRepetitionCounts from "./backend/fileRepetitionCounts";
import ParsedFile from "./parsedFile";

export default interface ParsedFolder {
	id: number;
	name: string;
	subFolders: ParsedFolder[];
	files: ParsedFile[];
	repetitionCounts: FileRepetitionCounts;
}
