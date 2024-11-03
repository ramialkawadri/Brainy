import IFile from "../types/file";
import IFolder from "../types/folder";

function getFileOrFolderById(folder: IFolder, id: number): IFile | IFolder | null {
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
};

export default getFileOrFolderById;
