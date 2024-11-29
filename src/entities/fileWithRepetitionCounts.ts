import FileRepetitionCounts from "./fileRepetitionCounts";

// TODO: The types are a kind of mess and need fix
export default interface FileWithRepetitionCounts {
	id: number;
	path: string;
	isFolder: boolean;
	repetitionCounts?: FileRepetitionCounts;
}
