import IFolder from "./folder";
import IUiFile from "./uiFile";

export default interface IUiFolder extends IFolder {
    subFolders: IUiFolder[],
    files: IUiFile[],
    isVisible: boolean,
}
