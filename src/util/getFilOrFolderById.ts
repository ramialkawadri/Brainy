import ParsedFile from "../type/parsedFile";
import ParsedFolder from "../type/parsedFolder";

function getFileOrFolderById(
	folder: ParsedFolder,
	id: number,
): ParsedFile | ParsedFolder | null {
	let queue = [folder];

	while (queue.length > 0) {
		const folder = queue.pop()!;
		if (folder.id === id) return folder;

		for (const file of folder.files) {
			if (file.id === id) return file;
		}
		queue = [...queue, ...folder.subFolders];
	}

	return null;
}

export default getFileOrFolderById;
