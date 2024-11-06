import IFolder from "../types/folder";
import IUiFile from "../types/uiFile";
import IUiFolder from "../types/uiFolder";

function searchFolder(folder: IFolder, searchText: string): IUiFolder {
    const subFolders = folder.subFolders.map(f => searchFolder(f, searchText));
    const files: IUiFile[] = folder.files.map(f => ({
        ...f,
        isVisible: f.name.includes(searchText)
    }));

    const isVisible = searchText.length === 0
        || files.some(f => f.isVisible)
        || subFolders.some(f => f.isVisible);


    return {
        ...folder,
        isVisible,
        subFolders,
        files,
    };
}

export default searchFolder;
