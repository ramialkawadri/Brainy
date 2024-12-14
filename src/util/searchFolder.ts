import ParsedFolder from "../type/parsedFolder";
import UiFile from "../type/ui/uiFile";
import UiFolder from "../type/ui/uiFolder";

function searchFolder(folder: ParsedFolder, searchText: string): UiFolder {
	const subFolders = folder.subFolders.map(f => searchFolder(f, searchText));
	const files: UiFile[] = folder.files.map(f => ({
		...f,
		isVisible: f.name.toLowerCase().includes(searchText.toLowerCase()),
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
