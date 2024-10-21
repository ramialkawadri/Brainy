import { useState } from "react";
import styles from "./styles.module.css";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import FileTree from "../fileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import { setErrorMessage, setSelectedFilePath } from "../fileSystem/fileSystemSlice";
import useAppDispatch from "../../hooks/useAppDispatch";
import { selectFileSelectedFilePath, selectFileSystemError, selectFileSystemRootFolder } from "../fileSystem/selectors";
import renameFile from "../../utils/renameFile";
import { deleteFile, deleteFolder, moveFile, updateFileName } from "../fileSystem/actions";

interface IProps {
    saveFile: () => Promise<void>,
    onSelectedFileDelete: () => void,
    onFileClick: () => void,
}

// TODO: expand/hide sidebar
function SideBar({
    saveFile,
    onSelectedFileDelete,
    onFileClick,
}: IProps) {

    const rootFolder = useAppSelector(selectFileSystemRootFolder);
    const [searchText, setSearchText] = useState("");
    const selectedFile = useAppSelector(selectFileSelectedFilePath);
    const errorMessage = useAppSelector(selectFileSystemError);
    const dispatch = useAppDispatch();

    const setSelectedFile = async (filePath: string | null, saveCurrentFile = false) => {
        onFileClick();
        if (filePath === selectedFile) {
            return;
        } else if (filePath) {
            if (saveCurrentFile) {
                await saveFile();
            }
        }
        dispatch(setSelectedFilePath(filePath ?? ""));
    };

    const handleFileRename = async (path: string, newName: string) => {
        if (!newName.trim()) {
            dispatch(setErrorMessage("Please enter a non empty name!"));
            return;
        }

        if (selectedFile === path) {
            await saveFile();
        }
        const newFullPath = renameFile(path, newName);
        await dispatch(updateFileName(path, newFullPath));
        if (selectedFile === path) {
            await setSelectedFile(newFullPath);
        }
    };

    const isCurrentFileInFolder = (folderName: string) =>
        selectedFile.startsWith(folderName);
    
    const handleFolderDelete = async (path: string) => {
        await dispatch(deleteFolder(path));

        if (isCurrentFileInFolder(path)) {
            onSelectedFileDelete();
            await setSelectedFile(null);
        }
    }

    const handleFileDelete = async (path: string) => {
        await dispatch(deleteFile(path));
        if (path === selectedFile) {
            onSelectedFileDelete();
            await setSelectedFile(null);
        }
    }

    const handleFolderRename = async (path: string, newName: string) => {
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
        if (selectedFile === filePath) {
            await saveFile();
        }
        const newPath = await dispatch(moveFile(filePath, destinationFolder)) as unknown as string;
        if (selectedFile === filePath) {
            await setSelectedFile(newPath);
        }
    };

    const handleFolderMove = async (folderPath: string, destinationFolder: string) => {
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
                    onClose={() => dispatch(setErrorMessage(""))} /> }

                <FileTree folder={rootFolder} forceExpand={searchText !== ""}
                    name=""
                    fullPath=""
                    onFileClick={async filePath => await setSelectedFile(filePath, true)}
                    onFolderRename={handleFolderRename}
                    onFileMove={handleFileMove}
                    onFolderMove={handleFolderMove}
                    onFileRename={handleFileRename}
                    onFolderDelete={handleFolderDelete}
                    onFileDelete={handleFileDelete}
                    onRootClick={() => void setSelectedFile(null, true)} />
            </div>
        </div>
    );
}

export default SideBar;
