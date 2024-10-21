import IFile from "./file";

export default interface IFolder {
    id: string,
    name: string,
    subFolders: IFolder[],
    files: IFile[],
    // repetitionCounts: CellRepetitionCountsDto,
}
