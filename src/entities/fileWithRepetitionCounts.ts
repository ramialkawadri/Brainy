import File from "./file";
import FileRepetitionCounts from "./fileRepetitionCounts";

// TODO: move backend types to another folder than entities
// TODO: The types are a kind of mess and need fix
export default interface FileWithRepetitionCounts extends File {
	repetitionCounts?: FileRepetitionCounts,
}
