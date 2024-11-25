import File from "../types/file";
import Folder from "../types/folder";

// TODO: test
function getFileOrFolderById(folder: Folder, id: number): File | Folder | null {
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
