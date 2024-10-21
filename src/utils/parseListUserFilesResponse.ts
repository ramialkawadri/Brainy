import IUserFileEntity from "../entities/userFileEntity";
import IFolder from "../features/fileSystem/folder";

function parseListUserFilesResponse(entities: IUserFileEntity[]): IFolder {
    return parseListUserFilesResponseHelper(entities, "", "root");
}

function parseListUserFilesResponseHelper(
    entities: IUserFileEntity[], folderName: string, id: string) {

    /* Contains sub folder names as keys, and a list of
     * their files as values.
     */
    const subFolders: Record<string, IUserFileEntity[]> = {};
    const subFoldersIds: Record<string, string> = {};
    const folder: IFolder = {
        id,
        name: folderName,
        subFolders: [],
        files: [],
        // repetitionCounts: {
        //     new: 0,
        //     learning: 0,
        //     relearning: 0,
        //     review: 0,
        // },
    };

    // TODO: repetition counts
    for (const entity of entities) {
        if (entity.path.includes("/")) {
            const index = entity.path.indexOf("/");
            const folderName = entity.path.substring(0, index);
            const rest = entity.path.substring(index + 1);
            const newEntity: IUserFileEntity = {
                path: rest,
                id: entity.id,
                isFolder: entity.isFolder,
                // repetitionCounts: fileInfo.repetitionCounts!,
            };

            if (folderName in subFolders) {
                subFolders[folderName].push(newEntity);
            } else {
                subFolders[folderName] = [newEntity];
            }
        } else if (entity.isFolder === 1) {
            subFoldersIds[entity.path] = entity.id;
        } else {
            folder.files.push({
                id: entity.id,
                name: entity.path,
                // repetitionCounts: fileInfo.repetitionCounts!,
            });
            // folder.repetitionCounts = addRepetitionCounts(
            //     folder.repetitionCounts, fileInfo.repetitionCounts!
            // );
        }
    }

    for (const subFolderName in subFolders) {
        const subFolder = parseListUserFilesResponseHelper(
            subFolders[subFolderName], subFolderName, subFoldersIds[subFolderName]);
        // folder.repetitionCounts = addRepetitionCounts(
        //     folder.repetitionCounts, subFolder.repetitionCounts
        // );
        folder.subFolders.push(subFolder);
    }

    for (const subFolderName in subFoldersIds) {
        if (!(subFolderName in subFolders)) {
            folder.subFolders.push({
                id: subFoldersIds[subFolderName],
                name: subFolderName,
                files: [],
                subFolders: [],
            });
        }
    }

    return folder;
}

// function addRepetitionCounts(
//     counts1: CellRepetitionCountsDto,
//     counts2: CellRepetitionCountsDto): CellRepetitionCountsDto {
//     
//     return {
//         new: counts1.new! + counts2.new!,
//         learning: counts1.learning! + counts2.learning!,
//         relearning: counts1.relearning! + counts2.relearning!,
//         review: counts1.review! + counts2.review!,
//     };
// }

export default parseListUserFilesResponse;
