import { useState } from "react";
import styles from "./styles.module.css";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import FileTree from "../fileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import { setErrorMessage } from "../fileSystem/fileSystemSlice";
import useAppDispatch from "../../hooks/useAppDispatch";
import { selectFileSystemError, selectFileSystemRootFolder } from "../fileSystem/selectors";

// TODO: expand/hide sidebar
function SideBar() {

    const rootFolder = useAppSelector(selectFileSystemRootFolder);
    const [searchText, setSearchText] = useState("");
    const errorMessage = useAppSelector(selectFileSystemError);
    const dispatch = useAppDispatch();

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
                    onFolderMove={handleFolderMove}
                    />
            </div>
        </div>
    );
}

export default SideBar;
