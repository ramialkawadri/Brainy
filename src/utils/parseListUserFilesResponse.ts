import { CellRepetitionCountsDto, FileInfoDto } from "../services/backendApi";
import IFolder from "../types/Folder";

function parseListUserFilesResponse(files: FileInfoDto[]): IFolder {
    return parseListUserFilesResponseHelper(files, "");
}

function parseListUserFilesResponseHelper(
    files: FileInfoDto[], folderName: string) {

    /* Contains folder names as keys, and a list of
     * their files as values.
     */
    const subFoldersFiles: Record<string, FileInfoDto[]> = {};
    const folder: IFolder = {
        id: "",
        name: folderName,
        subFolders: [],
        files: [],
        repetitionCounts: {
            new: 0,
            learning: 0,
            relearning: 0,
            review: 0,
        },
    };

    for (const fileInfo of files) {
        if (fileInfo.name!.includes("/")) {
            const index = fileInfo.name!.indexOf("/");
            const folderName = fileInfo.name!.substring(0, index);
            const rest = fileInfo.name!.substring(index + 1);
            const newFileInfo: FileInfoDto = {
                name: rest,
                id: fileInfo.id,
                repetitionCounts: fileInfo.repetitionCounts!,
            };

            if (folderName in subFoldersFiles) {
                subFoldersFiles[folderName].push(newFileInfo);
            } else {
                subFoldersFiles[folderName] = [newFileInfo];
            }
        } else if (fileInfo.name === ".hidden") {
            folder.id = fileInfo.id!;
        } else {
            folder.files.push({
                id: fileInfo.id!,
                name: fileInfo.name!,
                repetitionCounts: fileInfo.repetitionCounts!,
            });
            folder.repetitionCounts = addRepetitionCounts(
                folder.repetitionCounts, fileInfo.repetitionCounts!
            );
        }
    }

    for (const subFolderName in subFoldersFiles) {
        const subFolder = parseListUserFilesResponseHelper(
            subFoldersFiles[subFolderName], subFolderName);
        folder.repetitionCounts = addRepetitionCounts(
            folder.repetitionCounts, subFolder.repetitionCounts
        );
        folder.subFolders.push(subFolder);
    }

    return folder;
}

function addRepetitionCounts(
    counts1: CellRepetitionCountsDto,
    counts2: CellRepetitionCountsDto): CellRepetitionCountsDto {
    
    return {
        new: counts1.new! + counts2.new!,
        learning: counts1.learning! + counts2.learning!,
        relearning: counts1.relearning! + counts2.relearning!,
        review: counts1.review! + counts2.review!,
    };
}

export default parseListUserFilesResponse;
