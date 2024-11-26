import FileRepetitionCounts from "../entities/fileRepetitionCounts";

export default interface File {
	id: number;
	name: string;
	repetitionCounts: FileRepetitionCounts;
}
