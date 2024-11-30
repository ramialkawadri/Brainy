import Folder from "../parsedFolder";
import UiFile from "./uiFile";

export default interface UiFolder extends Folder {
	subFolders: UiFolder[];
	files: UiFile[];
	isVisible: boolean;
}
