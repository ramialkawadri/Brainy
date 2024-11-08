import Folder from "./folder";
import UiFile from "./uiFile";

export default interface UiFolder extends Folder {
    subFolders: UiFolder[],
    files: UiFile[],
    isVisible: boolean,
}
