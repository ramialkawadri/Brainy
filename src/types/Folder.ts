import { CellRepetitionCountsDto } from "../services/backendApi";
import IFile from "./File";

export default interface IFolder {
    id: string,
    name: string,
    subFolders: IFolder[],
    files: IFile[],
    repetitionCounts: CellRepetitionCountsDto,
}
