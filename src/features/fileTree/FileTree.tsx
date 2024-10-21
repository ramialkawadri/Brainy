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
import ConfirmationDialog from "../../ui/ConfirmationDialog/ConfirmationDialog";
import useAppDispatch from "../../hooks/useAppDispatch";
import { createFile, createFolder, deleteFile, deleteFolder, selectFileSelectedFilePath, updateFileName } from "../fileSystem/fileSystemSlice";
import IFolder from "../fileSystem/Folder";
import useAppSelector from "../../hooks/useAppSelector";

const dragFormatForFolder = "folderPath";
const dragFormatForFile = "filePath";

interface IProps {
    folder?: IFolder,
    name: string,
    forceExpand: boolean,
    fullPath: string,
    onFileClick?: (path: string) => Promise<void>,
    onFolderRename?: (path: string, newName: string) => Promise<void>,
    onFileMove?: (filePath: string, destinationFolder: string) => Promise<void>,
    onFolderMove?: (folderPath: string, destinationFolder: string) => Promise<void>,
    onRootClick: () => void,
}

// TODO: force save when clicking on files like when changing file!
/**
 * Displays a folder or a file based on whether the folder parameter is given
 * or not.
 */
function FileTree({
    folder, name, forceExpand = false,
    fullPath, onFileClick,
    onFolderRename,
    onFileMove, onFolderMove, onRootClick
}: IProps) {
    const isRoot = fullPath === "";
    const selectedFile = useAppSelector(selectFileSelectedFilePath);
    const [isOpen, setIsOpen] = useState(
        isRoot || getFolderPath(selectedFile).startsWith(fullPath));
    const [showActions, setShowActions] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [creatingNewFolder, setCreatingNewFolder] = useState(false);
    const [creatingNewFile, setCreatingNewFile] = useState(false);
    // Creating new folder or file share the same controlled input.
    const [newItemName, setNewItemName] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const dispatch = useAppDispatch();

    const isExpanded = forceExpand || isOpen;
    const isSelected = selectedFile === fullPath && !isRoot;

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

    // TODO: refactor
    const onFileCreate = (path: string) => dispatch(createFile(path));
    const onFolderCreate = (path: string) => dispatch(createFolder(path));
    const onFileDelete = (path: string) => dispatch(deleteFile(path));
    const onFolderDelete =  (path: string) => dispatch(deleteFolder(path));
    const onFileRename =  (path: string, newName: string) => dispatch(updateFileName(path, newName));

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
                onClick: makeDeleteDialogVisible,
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
        setNewName(name);
    }

    function makeDeleteDialogVisible() {
        if (isRoot) {
            return;
        }
        setShowDeleteDialog(true);
        setShowActions(false);
    }

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (renaming) {
            return;
        }
        if (folder) {
            if (isRoot) {
                onRootClick();
            } else {
                setIsOpen(!isOpen);
            }
        } else {
            if (onFileClick) {
                await onFileClick(fullPath);
            }
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
            if (onFolderRename) {
                await onFolderRename(fullPath, newName);
            }
        }
        else {
            if (onFileRename) {
                await onFileRename(fullPath, newName);
            }
        }
    };

    const handleDelete = async () => {
        if (folder) {
            if (onFolderDelete) {
                await onFolderDelete(fullPath);
            }
        } else {
            if (onFileDelete) {
                await onFileDelete(fullPath);
            }
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (renaming) {
            return;
        }
        if (e.code === "F2") {
            enableRenaming();
        } else if (e.code === "Delete") {
            makeDeleteDialogVisible();
        }
    };

    const handleCreateNewItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newItemPath = isRoot ? newItemName : fullPath + "/" + newItemName;
        if (creatingNewFolder) {
            if (onFolderCreate) {
                await onFolderCreate(newItemPath);
            }
        } else if (creatingNewFile) {
            if (onFileCreate) {
                await onFileCreate(newItemPath);
            }
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
        e.dataTransfer.setData(format, fullPath);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!folder ||
            (!e.dataTransfer.getData(dragFormatForFile)
                && !e.dataTransfer.getData(dragFormatForFolder))) {
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
        if (sourceFolder === fullPath) {
            return;
        }
        if (filePath) {
            if (onFileMove) {
                await onFileMove(filePath, fullPath);
            }
        } else if (folderPath) {
            if (onFolderMove) {
                await onFolderMove(folderPath, fullPath);
            }
        }
    };

    return (
        <>
            {showDeleteDialog && <ConfirmationDialog
                text={`Are you sure you want to delete "${name}"?`}
                title="Delete" onCancel={() => setShowDeleteDialog(false)}
                onConfirm={() => void handleDelete()} />
            }

            {/* The tree name */}
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
                            {!renaming && <p>{isRoot ? "Files" : name}</p>}
                        </div>
                    </button>

                    {!renaming &&
                        <button
                            title="Actions"
                            onClick={handleShowActions}
                            className={`${styles.fileTreeDots}
                                ${isSelected ? styles.fileTreeDotsSelected : ""}`}>
                            <Icon path={mdiDotsHorizontal} size={1} />
                        </button>
                    }

                    {showActions &&
                        <ActionsMenu onOutsideClick={() => setShowActions(false)}
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
                        
                        {folder.subFolders.map(subFolder =>
                            <FileTree
                                key={subFolder.id}
                                forceExpand={forceExpand}
                                name={subFolder.name}
                                folder={subFolder}
                                fullPath={getChildFullPath(fullPath, subFolder.name)}
                                onFileClick={onFileClick} 
                                onFolderRename={onFolderRename}
                                onFileMove={onFileMove}
                                onFolderMove={onFolderMove}
                                onRootClick={onRootClick} /> )}

                        {folder.files.map(file =>
                            <FileTree
                                key={file.id}
                                forceExpand={forceExpand}
                                name={file.name}
                                fullPath={getChildFullPath(fullPath, file.name)}
                                onFileClick={onFileClick}
                                onFolderRename={onFolderRename}
                                onFileMove={onFileMove}
                                onFolderMove={onFolderMove}
                                onRootClick={onRootClick} /> )}
                    </div>
                }
            </div>
        </>
    );
}

function getChildFullPath(parentFullPath: string, childName: string) {
    return parentFullPath === "" ? childName : parentFullPath + "/" + childName;
}

export default FileTree;
