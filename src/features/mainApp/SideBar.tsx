import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import { backendApi, selectedFileQueryStringParameter } from "../../constants";
import { mdiLogout } from "@mdi/js";
import Icon from "@mdi/react";
import { useDispatch } from "react-redux";
import renameFile from "../../utils/renameFile";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import getErrorFromAxiosResponse from "../../utils/getErrorFromAxiosResponse";
import { FileInfoDto, ProblemDetails } from "../../services/backendApi";
import { AxiosResponse } from "axios";
import getFileName from "../../utils/getFileName";
import FileTree from "../fileTree/FileTree";
import parseListUserFilesResponse from "../../utils/parseListUserFilesResponse";

interface IProps {
    userFiles: FileInfoDto[],
    saveFile: () => Promise<void>,
    onSelectedFileDelete: () => void,
    onFileClick: () => void,
    onFileModification: () => Promise<void>,
}

// TODO: expand/hide sidebar
function SideBar({
    userFiles, saveFile, onSelectedFileDelete, onFileClick, onFileModification
    }: IProps) {

    const [searchText, setSearchText] = useState("");
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const dispatch = useDispatch();
    // TODO:
    // const selectedFile = searchParams.get(selectedFileQueryStringParameter);
    const selectedFile = "";


    useEffect(() => {
        const updateUserInfo = async () => {
            try {
            // TODO:
                // const response = await api(backendApi.getUserInformation());
                // if (response.status === 200) {
                //     setFullName(`${response.data.firstName} ${response.data.lastName}`);
                //     setUsername(response.data.username!);
                // } else {
                //     const problemDetails =
                //         getErrorFromAxiosResponse<ProblemDetails>(response);
                //     setErrorMessage(problemDetails.detail ?? "");
                // }
            } catch (e) {
                setErrorMessage("An error happened while fetching user info.");
                console.error(e);
            }
        };

        void updateUserInfo();
    }, []);

    const setSelectedFile = async (filePath?: string, saveCurrentFile = false) => {
        onFileClick();
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

    const handleLogout = async () => {
        const response = await api(backendApi.logout());
        if (response.status === 200) {
            dispatch(setIsLoggedIn(false));
        }
    };

    // Returns true on success and false otherwise.
    const sendFileModificationCall =
        async <T,E,>(call: Promise<AxiosResponse<T, E>>):
        Promise<boolean> => {

        try {
            const response = await api(call);
            if (response.status === 200) {
                await onFileModification();
                return true;
            } else {
                const error = getErrorFromAxiosResponse<ProblemDetails>(response);
                setErrorMessage(error.detail!);
                return false;
            }
        } catch (e) {
            console.error(e);
            setErrorMessage("An error has happened!");
            return false;
        }
    };

    const handleFileRename = async (path: string, newName: string) => {
        if (!newName.trim()) {
            setErrorMessage("Please enter a non empty name!");
            return;
        }

        if (selectedFile === path) {
            await saveFile();
        }
        const newFullPath = renameFile(path, newName);
        const success = await sendFileModificationCall(backendApi.renameFile({
            oldPath: path,
            newPath: newFullPath,
        }));
        if (success && selectedFile === path) {
            await setSelectedFile(newFullPath);
        }
    };

    const isCurrentFileInFolder = (folderName: string) =>
        selectedFile?.startsWith(folderName);

    const handleFolderRename =
        async (path: string, newName: string) => {

        if (isCurrentFileInFolder(path)) {
            await saveFile();
        }
        const newFullPath = renameFile(path, newName);
        const success = await sendFileModificationCall(backendApi.renameFolder({
            oldPath: path,
            newPath: newFullPath,
        }));

        if (success && isCurrentFileInFolder(path)) {
            const newFilePath = newFullPath + "/" +
                selectedFile!.substring(path.length + 1);
            await setSelectedFile(newFilePath);
        }
    };

    const handleDeleteFolder =
        async (path: string) => {
        const success = await sendFileModificationCall(backendApi.deleteFolder({
            folderPath: path,
        }));
        if (success && isCurrentFileInFolder(path)) {
            onSelectedFileDelete();
            await setSelectedFile();
        }
    }

    const handleFileDelete = async (path: string) => {
        const success = await sendFileModificationCall(backendApi.deleteFile({
            filePath: path
        }));
        if (success && path === selectedFile) {
            onSelectedFileDelete();
            await setSelectedFile();
        }
    }
    const handleFileCreate = (path: string) =>
        sendFileModificationCall(backendApi.createFile({
            filePath: path
        }));

    const handleFolderCreate = (path: string) =>
        sendFileModificationCall(backendApi.createFolder({
            folderPath: path
        }));

    const handleFileMove = async (filePath: string, destinationFolder: string) => {
        if (selectedFile === filePath) {
            await saveFile();
        }
        const fileName = getFileName(filePath);
        const newPath = destinationFolder === ""
            ? fileName
            : `${destinationFolder}/${fileName}`;
        const success = await sendFileModificationCall(backendApi.renameFile({
            oldPath: filePath,
            newPath,
        }));
        if (success && selectedFile === filePath) {
            await setSelectedFile(newPath);
        }
    };

    const handleFolderMove =
        async (folderPath: string, destinationFolder: string) => {

        if (isCurrentFileInFolder(folderPath)) {
            await saveFile();
        }
        const folderName = getFileName(folderPath);
        const newPath = destinationFolder === ""
            ? folderName
            : `${destinationFolder}/${folderName}`;
        const succes = await sendFileModificationCall(backendApi.renameFolder({
            oldPath: folderPath,
            newPath
        }));
        if (succes && isCurrentFileInFolder(folderPath)) {
            const newFilePath = newPath + "/" +
                selectedFile!.substring(folderPath.length + 1);
            await setSelectedFile(newFilePath);
        }
    };

    const handleRootClick = () => {
        searchParams.delete(selectedFileQueryStringParameter);
        setSearchParams({ ...searchParams });
    };

    const filteredFiles = userFiles.filter(file =>
        file.name!.toLowerCase().includes(searchText.toLowerCase()));
    const rootFolder = useMemo(() => parseListUserFilesResponse(filteredFiles),
        [filteredFiles]);

    return (
        <div className={`${styles.sideBar}`}>
            <div>
                <div className={`${styles.userProfile}`}>
                    <img src="https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg" alt="User profile picture" />
                    <div>
                        <p>{fullName}</p>
                        <p className="dimmed">@{username}</p>
                    </div>
                </div>

                <div className={`${styles.searchBar}`}>
                    <input type="text" placeholder="Search"
                        onChange={e => setSearchText(e.target.value)}
                        className={`${styles.sideBarSearch}`} />
                </div>

                {errorMessage && <ErrorBox message={errorMessage}
                    onClose={() => setErrorMessage("")} /> }

                <FileTree folder={rootFolder} forceExpand={searchText !== ""}
                    fullPath="" name="/"
                    onFileClick={async filePath => await setSelectedFile(filePath, true)}
                    selectedFile={selectedFile ?? ""}
                    onFileRename={handleFileRename}
                    onFolderRename={handleFolderRename}
                    onFileDelete={handleFileDelete}
                    onFolderDelete={handleDeleteFolder}
                    onFileCreate={handleFileCreate}
                    onFolderCreate={handleFolderCreate}
                    onFileMove={handleFileMove}
                    onFolderMove={handleFolderMove}
                    onRootClick={handleRootClick} />
            </div>
            <button className={`${styles.logoutButton} transparent`}
                onClick={() => void handleLogout()}>
                <Icon path={mdiLogout} size={1} />
                <p>Sign out</p>
            </button>
        </div>
    );
}

export default SideBar;
