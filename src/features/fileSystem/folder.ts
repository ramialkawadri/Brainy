import IFile from "./file";

export default interface IFolder {
    id: number,
    name: string,
    subFolders: IFolder[],
    files: IFile[],
    // repetitionCounts: CellRepetitionCountsDto,
}
