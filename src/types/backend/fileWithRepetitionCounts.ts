import FileRepetitionCounts from "./fileRepetitionCounts";

export default interface FileWithRepetitionCounts {
	id: number;
	path: string;
	isFolder: boolean;
	repetitionCounts?: FileRepetitionCounts;
}
