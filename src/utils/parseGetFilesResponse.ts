import FileRepetitionCounts from "../entities/fileRepetitionCounts";
import FileWithRepetitionCounts from "../entities/fileWithRepetitionCounts";
import Folder from "../types/folder";

function parseGetFilesResponse(entities: FileWithRepetitionCounts[]): Folder {
	return parseGetFilesResponseHelper(entities, "", 0);
}

function parseGetFilesResponseHelper(
	entities: FileWithRepetitionCounts[],
	folderName: string,
	id: number,
) {
	/* Contains sub folder names as keys, and a list of
	 * their files as values.
	 */
	const subFolders: Record<string, FileWithRepetitionCounts[]> = {};
	const subFoldersIds: Record<string, number> = {};
	const folder: Folder = {
		id,
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

	for (const entity of entities) {
		if (entity.path.includes("/")) {
			const index = entity.path.indexOf("/");
			const folderName = entity.path.substring(0, index);
			const rest = entity.path.substring(index + 1);
			const newEntity: FileWithRepetitionCounts = {
				path: rest,
				id: entity.id,
				isFolder: entity.isFolder,
				repetitionCounts: entity.repetitionCounts,
			};

			if (folderName in subFolders) {
				subFolders[folderName].push(newEntity);
			} else {
				subFolders[folderName] = [newEntity];
			}
		} else if (entity.isFolder) {
			subFoldersIds[entity.path] = entity.id;
		} else {
			folder.files.push({
				id: entity.id,
				name: entity.path,
				repetitionCounts: entity.repetitionCounts ?? {
                    new: 0,
                    review: 0,
                    learning: 0,
                    relearning: 0,
                },
			});
			folder.repetitionCounts = addRepetitionCounts(
			    folder.repetitionCounts ?? {
                    new: 0,
                    review: 0,
                    learning: 0,
                    relearning: 0,
                }, entity.repetitionCounts ?? {
                    // TODO: fix duplication
                    new: 0,
                    review: 0,
                    learning: 0,
                    relearning: 0,
                }
			);
		}
	}

	for (const subFolderName in subFolders) {
		const subFolder = parseGetFilesResponseHelper(
			subFolders[subFolderName],
			subFolderName,
			subFoldersIds[subFolderName],
		);
		folder.repetitionCounts = addRepetitionCounts(
		    folder.repetitionCounts ?? {
                    new: 0,
                    review: 0,
                    learning: 0,
                    relearning: 0,
            }, subFolder.repetitionCounts ?? {
                    new: 0,
                    review: 0,
                    learning: 0,
                    relearning: 0,
            }
		);
		folder.subFolders.push(subFolder);
	}

	for (const subFolderName in subFoldersIds) {
		if (!(subFolderName in subFolders)) {
			folder.subFolders.push({
				id: subFoldersIds[subFolderName],
				name: subFolderName,
				files: [],
				subFolders: [],
                repetitionCounts: {
                    new: 0,
                    review: 0,
                    learning: 0,
                    relearning: 0,
                }
			});
		}
	}

	folder.subFolders = folder.subFolders.sort((a, b) =>
		a.name < b.name ? -1 : 1,
	);
	folder.files = folder.files.sort((a, b) => (a.name < b.name ? -1 : 1));

	return folder;
}

function addRepetitionCounts(
    counts1: FileRepetitionCounts,
    counts2: FileRepetitionCounts): FileRepetitionCounts {

    return {
        new: counts1.new + counts2.new,
        learning: counts1.learning + counts2.learning,
        relearning: counts1.relearning + counts2.relearning,
        review: counts1.review + counts2.review,
    };
}

export default parseGetFilesResponse;
