import { useState } from "react";
import styles from "./styles.module.css";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import FileTree from "../fileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import { selectFileSystemRootFolder, setSelectedFilePath } from "../fileSystem/fileSystemSlice";
import useAppDispatch from "../../hooks/useAppDispatch";

interface IProps {
    saveFile: () => Promise<void>,
    onSelectedFileDelete: () => void,
    onFileClick: () => void,
    onFileModification: () => Promise<void>,
}

// TODO: expand/hide sidebar
function SideBar({
    saveFile, onSelectedFileDelete, onFileClick, onFileModification
    }: IProps) {

    const rootFolder = useAppSelector(selectFileSystemRootFolder);

    const [searchText, setSearchText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const dispatch = useAppDispatch();
    // TODO:
    // const selectedFile = searchParams.get(selectedFileQueryStringParameter);
    const selectedFile = "";

    const setSelectedFile = async (filePath: string | null, saveCurrentFile = false) => {
        onFileClick();
        dispatch(setSelectedFilePath(filePath ?? ""));
            // TODO:
        // if (filePath === searchParams.get(selectedFileQueryStringParameter)) {
        //     return;
        // } else if (filePath) {
        //     if (saveCurrentFile) {
        //         await saveFile();
        //     }
        //     setSearchParams({
        //         [selectedFileQueryStringParameter]: filePath,
        //     });
        // } else {
        //     searchParams.delete(selectedFileQueryStringParameter);
        //     setSearchParams(searchParams);
        // }
    };

    const isCurrentFileInFolder = (folderName: string) =>
        selectedFile?.startsWith(folderName);

    const handleFolderRename =
        async (path: string, newName: string) => {
        //
        // if (isCurrentFileInFolder(path)) {
        //     await saveFile();
        // }
        // const newFullPath = renameFile(path, newName);
        // const success = await sendFileModificationCall(backendApi.renameFolder({
        //     oldPath: path,
        //     newPath: newFullPath,
        // }));
        //
        // if (success && isCurrentFileInFolder(path)) {
        //     const newFilePath = newFullPath + "/" +
        //         selectedFile!.substring(path.length + 1);
        //     await setSelectedFile(newFilePath);
        // }
    };

    const handleFileMove = async (filePath: string, destinationFolder: string) => {
        // if (selectedFile === filePath) {
        //     await saveFile();
        // }
        // const fileName = getFileName(filePath);
        // const newPath = destinationFolder === ""
        //     ? fileName
        //     : `${destinationFolder}/${fileName}`;
        // const success = await sendFileModificationCall(backendApi.renameFile({
        //     oldPath: filePath,
        //     newPath,
        // }));
        // if (success && selectedFile === filePath) {
        //     await setSelectedFile(newPath);
        // }
    };

    const handleFolderMove =
        async (folderPath: string, destinationFolder: string) => {
        //
        // if (isCurrentFileInFolder(folderPath)) {
        //     await saveFile();
        // }
        // const folderName = getFileName(folderPath);
        // const newPath = destinationFolder === ""
        //     ? folderName
        //     : `${destinationFolder}/${folderName}`;
        // const succes = await sendFileModificationCall(backendApi.renameFolder({
        //     oldPath: folderPath,
        //     newPath
        // }));
        // if (succes && isCurrentFileInFolder(folderPath)) {
        //     const newFilePath = newPath + "/" +
        //         selectedFile!.substring(folderPath.length + 1);
        //     await setSelectedFile(newFilePath);
        // }
    };

    const handleRootClick = () => {
        // searchParams.delete(selectedFileQueryStringParameter);
        // setSearchParams({ ...searchParams });
        setSelectedFile(null, true);
    };

    // const filteredFiles = userFiles.filter(file =>
    //     file.name!.toLowerCase().includes(searchText.toLowerCase()));

    return (
        <div className={`${styles.sideBar}`}>
            <div>
                <div className={`${styles.searchBar}`}>
                    <input type="text" placeholder="Search"
                        onChange={e => setSearchText(e.target.value)}
                        className={`${styles.sideBarSearch}`} />
                </div>

                {errorMessage && <ErrorBox message={errorMessage}
                    onClose={() => setErrorMessage("")} /> }

                <FileTree folder={rootFolder} forceExpand={searchText !== ""}
                    fullPath="" name=""
                    onFileClick={async filePath => await setSelectedFile(filePath, true)}
                    selectedFile={selectedFile ?? ""}
                    onFolderRename={handleFolderRename}
                    onFileMove={handleFileMove}
                    onFolderMove={handleFolderMove}
                    onRootClick={handleRootClick} />
            </div>
        </div>
    );
}

export default SideBar;
