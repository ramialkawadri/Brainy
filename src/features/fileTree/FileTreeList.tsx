import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiDeleteOutline, mdiDotsHorizontal, mdiFileDocumentOutline,
    mdiFileDocumentPlusOutline,
    mdiFileTreeOutline,
    mdiFolderOpenOutline, 
    mdiFolderOutline, 
    mdiFolderPlusOutline, 
    mdiPencilOutline} from "@mdi/js";
import React, { useState } from "react";
import ActionsMenu, { IAction } from "./ActionsMenu";
import getFolderPath from "../../utils/getFolderPath";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { selectSearchText, selectSelectedFilePath } from "../../store/selectors/fileSystemSelectors";
import IFolder from "../../types/folder";
import { createFile, createFolder, moveFile, moveFolder, renameFile, renameFolder } from "../../store/actions/fileSystemActions";
import getFileName from "../../utils/getFileName";
import { setSelectedFilePath } from "../../store/reducers/fileSystemReducers";

const dragFormatForFolder = "brainy/folderpath";
const dragFormatForFile = "brainy/filepath";

interface IProps {
    folder: IFolder | null,
    path: string,
    onMarkForDeletion: (path: string, isFolder: boolean) => void,
}

/**
 * Displays a folder or a file based on whether the folder parameter is given
 * or not.
 */
function FileTree({folder, path, onMarkForDeletion }: IProps) {
    const isRoot = path === "";
    const [showActions, setShowActions] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState("");
    const [creatingNewFolder, setCreatingNewFolder] = useState(false);
    const [creatingNewFile, setCreatingNewFile] = useState(false);
    // Creating new folder or file share the same controlled input.
    const [newItemName, setNewItemName] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const selectedFile = useAppSelector(selectSelectedFilePath);
    const [isOpen, setIsOpen] = useState(
        isRoot || getFolderPath(selectedFile).startsWith(path));
    const dispatch = useAppDispatch();
    const searchText = useAppSelector(selectSearchText);

    const isExpanded = searchText || isOpen;
    const isSelected = selectedFile === path && !isRoot;

    const actions: IAction[] = [];

    if (folder) {
        actions.push(
            {
                iconName: mdiFolderPlusOutline,
                text: "New Folder",
                onClick: () => {
                    setCreatingNewFolder(true);
                    setCreatingNewFile(false);
                    setIsOpen(true);
                    setShowActions(false);
                },
            },
            {
                iconName: mdiFileDocumentPlusOutline,
                text: "New Notebook",
                onClick: () => {
                    setCreatingNewFolder(false);
                    setCreatingNewFile(true);
                    setIsOpen(true);
                    setShowActions(false);
                },
            },
        );
    }

    const onFileCreate = (path: string) => dispatch(createFile(path));
    const onFolderCreate = (path: string) => dispatch(createFolder(path));

    if (!isRoot) {
        actions.push(
            {
                iconName: mdiPencilOutline,
                text: "Rename",
                onClick: enableRenaming,
                shortcut: "F2",
            },
            {
                iconName: mdiDeleteOutline,
                text: "Delete",
                onClick: markForDeletion,
                shortcut: "DEL"
            }
        );
    }

    function enableRenaming() {
        if (isRoot) {
            return;
        }
        setShowActions(false);
        setRenaming(true);
        setNewName(getFileName(path));
    }

    function markForDeletion() {
        if (isRoot) {
            return;
        }
        onMarkForDeletion(path, folder !== null);
        setShowActions(false);
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (renaming) {
            return;
        }
        if (folder) {
            if (isRoot) {
                dispatch(setSelectedFilePath(null));
            } else {
                setIsOpen(!isOpen);
            }
        } else {
            dispatch(setSelectedFilePath(path));
        }
    };

    const handleShowActions = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setShowActions(!showActions);
    };

    const handleRenaming = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setRenaming(false);

        if (folder) {
            await dispatch(renameFolder(path, newName));
        }
        else {
            await dispatch(renameFile(path, newName));
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (renaming) {
            return;
        }
        if (e.code === "F2") {
            enableRenaming();
        } else if (e.code === "Delete") {
            markForDeletion();
        }
    };

    const handleCreateNewItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newItemPath = isRoot ? newItemName : path + "/" + newItemName;
        if (creatingNewFolder) {
            await onFolderCreate(newItemPath);
        } else if (creatingNewFile) {
            await onFileCreate(newItemPath);
        }
        setNewItemName("");
        setCreatingNewFolder(false);
        setCreatingNewFile(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (renaming) {
            return;
        }
        const format = folder ? dragFormatForFolder : dragFormatForFile;
        e.dataTransfer.setData(format, path);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!folder ||
            (!e.dataTransfer.types.includes(dragFormatForFile)
                && !e.dataTransfer.types.includes(dragFormatForFolder))) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        if (folder) {
            setIsDragOver(false);
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        if (!folder) {
            return;
        }
        e.stopPropagation();
        setIsDragOver(false);

        const filePath = e.dataTransfer.getData(dragFormatForFile);
        const folderPath = e.dataTransfer.getData(dragFormatForFolder);
        const sourceFolder = filePath
            ? getFolderPath(filePath)
            : folderPath;
        if (sourceFolder === path) {
            return;
        }
        if (filePath) {
            await dispatch(moveFile(filePath, path));
        } else if (folderPath) {
            await dispatch(moveFolder(folderPath, path));
        }
    };

    return (
        <div
            className={`${styles.outerContainer}
            ${isDragOver ? styles.outerContainerDragOver : ""}`}
            onDragStart={handleDragStart}
            onDrop={(e) => void handleDrop(e)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}>
            <div
                className={`${styles.fileTree}`}
                draggable={!isRoot && !renaming}>

                <button
                    className={`${styles.fileTreeButton}
                    ${isSelected && !folder && !renaming ? "primary" : "transparent"}`}
                    onClick={(e) => void handleClick(e)}
                    onKeyUp={handleKeyUp}>

                    <div>
                        <Icon
                            path={isRoot ? mdiFileTreeOutline
                            : folder ? (isExpanded ? mdiFolderOpenOutline : mdiFolderOutline)
                            : mdiFileDocumentOutline}
                            size={1} />
                        {renaming && 
                            <form onSubmit={(e) => void handleRenaming(e)}>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onFocus={e => e.target.select()}
                                    autoFocus
                                    className={`${styles.fileTreeRenameInput}`}
                                    onBlur={() => setRenaming(false)} />
                            </form>
                        }
                        {!renaming && <p>{isRoot ? "Files" : getFileName(path)}</p>}
                    </div>
                </button>

                {!renaming && <button
                    title="Actions"
                    onClick={handleShowActions}
                    className={`${styles.fileTreeDots}
                        ${isSelected ? styles.fileTreeDotsSelected : ""}`}>
                    <Icon path={mdiDotsHorizontal} size={1} />
                </button>}

                {showActions && <ActionsMenu
                    onOutsideClick={() => setShowActions(false)}
                    actions={actions} />}
            </div>
            
            {/* The subfolders and files */}
            {folder && isExpanded &&
                <div className={`${styles.fileTreeChildren}`}>

                    {(creatingNewFile || creatingNewFolder) && 
                        <form
                            className={styles.fileTreeNewItemRow}
                            onSubmit={(e) => void handleCreateNewItemSubmit(e)}>
                            <Icon path={creatingNewFolder
                                ? mdiFolderPlusOutline
                                : mdiFileDocumentPlusOutline} size={1} />
                            <input
                                type="text"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                placeholder="Enter the name" autoFocus
                                onBlur={() => {
                                    setCreatingNewFolder(false);
                                    setCreatingNewFile(false);
                                }} />
                        </form>}

                    {folder.subFolders.length + folder.files.length === 0 &&
                        !creatingNewFolder && !creatingNewFile &&
                        <p>This folder is empty, create a file</p>}
                    
                    {folder.subFolders.map(subFolder =>
                        <FileTree
                            key={subFolder.id}
                            folder={subFolder}
                            onMarkForDeletion={onMarkForDeletion}
                            path={getChildPath(path, subFolder.name)} /> )}

                    {folder.files.map(file =>
                        <FileTree
                            key={file.id}
                            folder={null}
                            onMarkForDeletion={onMarkForDeletion}
                            path={getChildPath(path, file.name)} /> )}
                </div>
            }
        </div>
    );
}

function getChildPath(parentPath: string, childName: string) {
    return parentPath === "" ? childName : parentPath + "/" + childName;
}

export default FileTree;
