import Folder from "../types/folder";
import UiFile from "../types/uiFile";
import UiFolder from "../types/uiFolder";

// TODO: test
function searchFolder(folder: Folder, searchText: string): UiFolder {
	const subFolders = folder.subFolders.map(f => searchFolder(f, searchText));
	const files: UiFile[] = folder.files.map(f => ({
		...f,
		isVisible: f.name.includes(searchText),
	}));

	const isVisible =
		searchText.length === 0 ||
		files.some(f => f.isVisible) ||
		subFolders.some(f => f.isVisible);

	return {
		...folder,
		isVisible,
		subFolders,
		files,
	};
}

export default searchFolder;
