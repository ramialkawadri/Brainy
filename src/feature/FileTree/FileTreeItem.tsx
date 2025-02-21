import {
	save as openSaveDialog,
	open as openOpenDialog,
} from "@tauri-apps/plugin-dialog";
import Icon from "@mdi/react";
import styles from "./styles.module.css";
import {
	mdiDeleteOutline,
	mdiExport,
	mdiFileDocumentPlusOutline,
	mdiFolderPlusOutline,
	mdiImport,
	mdiPencilOutline,
} from "@mdi/js";
import React, { useState } from "react";
import { Action } from "./ActionsMenu";
import useAppDispatch from "../../hooks/useAppDispatch";
import {
	createFile,
	createFolder,
	importFile,
	moveFile,
	moveFolder,
	renameFile,
	renameFolder,
} from "../../store/actions/fileSystemActions";
import getFileName from "../../util/getFileName";
import { setSelectedFileId } from "../../store/reducers/fileSystemReducers";
import UiFolder from "../../type/ui/uiFolder";
import { exportItem } from "../../api/exportImportApi";
import FileTreeItemRow from "./FileTreeItemRow";

const dragFormatForFolder = "brainy/folderpath";
const dragFormatForFile = "brainy/filepath";

interface Props {
	folder: UiFolder | null;
	fullPath: string;
	id: number;
	onMarkForDeletion: (id: number, isFolder: boolean) => void;
	onFileClick: () => void;
	onRootClick: () => void;
}

/**
 * Displays a folder or a file based on whether the folder parameter is given
 * or not.
 */
function FileTreeItem({
	folder,
	fullPath,
	id,
	onMarkForDeletion,
	onFileClick,
	onRootClick,
}: Props) {
	const isRoot = fullPath === "";
	const [showActions, setShowActions] = useState(false);
	const [isRenaming, setIsRenaming] = useState(false);
	const [newName, setNewName] = useState("");
	const [creatingNewFolder, setCreatingNewFolder] = useState(false);
	const [creatingNewFile, setCreatingNewFile] = useState(false);
	// Creating new folder or file share the same controlled input.
	const [newItemName, setNewItemName] = useState("");
	const [isDragOver, setIsDragOver] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const dispatch = useAppDispatch();
	const isExpanded = isRoot || isOpen;

	const actions: Action[] = [];

	const showCreateNewFileInput = () => {
		setCreatingNewFolder(false);
		setCreatingNewFile(true);
		setIsOpen(true);
		setShowActions(false);
	};

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
				text: "New File",
				onClick: showCreateNewFileInput,
				shortcut: "Ctrl + N",
			},
		);
	}

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
				shortcut: "DEL",
			},
		);
	}

	actions.push({
		iconName: mdiExport,
		text: "Export",
		onClick: () => {
			void (async () => {
				setShowActions(false);
				const savePath = await openSaveDialog({
					filters: [
						{
							name: "JSON file",
							extensions: ["json"],
						},
					],
					defaultPath: getFileName(fullPath),
				});
				if (!savePath) return;
				// TODO: error handling
				await exportItem(id, savePath);
			})();
		},
	});

	if (folder) {
		actions.push({
			iconName: mdiImport,
			text: "Import",
			onClick: () => {
				void (async () => {
					setShowActions(false);
					const openPath = await openOpenDialog({
						filters: [
							{
								name: "JSON file",
								extensions: ["json"],
							},
						],
					});
					if (!openPath) return;
					await dispatch(importFile(openPath, fullPath));
				})();
			},
		});
	}

	function enableRenaming() {
		if (isRoot) return;
		setShowActions(false);
		setIsRenaming(true);
		setNewName(getFileName(fullPath));
	}

	function markForDeletion() {
		if (isRoot) return;
		onMarkForDeletion(id, folder !== null);
		setShowActions(false);
	}

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		if (isRenaming) return;

		if (folder) {
			if (isRoot) {
				onRootClick();
				dispatch(setSelectedFileId(null));
			} else {
				setIsOpen(!isOpen);
			}
		} else {
			onFileClick();
			dispatch(setSelectedFileId(id));
		}
	};

	const handleShowActions = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		setShowActions(!showActions);
	};

	const handleRenaming = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsRenaming(false);

		if (folder) await dispatch(renameFolder(id, newName));
		else await dispatch(renameFile(id, newName));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		e.stopPropagation();

		if (e.key === "F2") {
			enableRenaming();
		} else if (e.key === "Delete" && !isRenaming) {
			markForDeletion();
		} else if (e.ctrlKey && e.key.toLowerCase() === "n") {
			showCreateNewFileInput();
		} else if (e.key === "Escape") {
			setShowActions(false);
			setCreatingNewFile(false);
			setCreatingNewFolder(false);
		}
	};

	const handleCreateNewItemSubmit = async (
		e: React.FormEvent<HTMLFormElement>,
	) => {
		e.preventDefault();
		const newItemPath = isRoot ? newItemName : fullPath + "/" + newItemName;
		if (creatingNewFolder) {
			await dispatch(createFolder(newItemPath));
		} else if (creatingNewFile) {
			await dispatch(createFile(newItemPath));
		}
		setNewItemName("");
		setCreatingNewFolder(false);
		setCreatingNewFile(false);
	};

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		e.stopPropagation();
		if (isRenaming) return;
		setShowActions(false);
		const format = folder ? dragFormatForFolder : dragFormatForFile;
		e.dataTransfer.setData(format, id.toString());
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		if (
			!folder ||
			(!e.dataTransfer.types.includes(dragFormatForFile) &&
				!e.dataTransfer.types.includes(dragFormatForFolder))
		) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};

	const handleDragLeave = () => {
		if (folder) setIsDragOver(false);
	};

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		if (!folder) return;
		e.stopPropagation();
		setIsDragOver(false);

		const fileId = e.dataTransfer.getData(dragFormatForFile);
		const folderId = e.dataTransfer.getData(dragFormatForFolder);
		if (fileId) {
			await dispatch(moveFile(Number(fileId), id));
		} else if (folderId) {
			await dispatch(moveFolder(Number(folderId), id));
		}
	};

	return (
		(!folder || isRoot || folder.isVisible) && (
			<div
				className={`${styles.fileItemOuterContainer} ${isDragOver ? styles.dragOver : ""}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={e => void handleDrop(e)}
				onKeyDown={handleKeyDown}>
				<FileTreeItemRow
					isRoot={isRoot}
					id={id}
					isFolder={folder !== null}
					isRenaming={isRenaming}
					showActions={showActions}
					isExpanded={isExpanded}
					actions={actions}
                    newName={newName}
                    onDragStart={handleDragStart}
					onRenameSubmit={e => void handleRenaming(e)}
					fullPath={fullPath}
					onShowActionsClick={handleShowActions}
					onClick={handleClick}
					onHideActions={() => setShowActions(false)}
                    onNewNameUpdate={setNewName}
                    onStopRenaming={() => setIsRenaming(false)}
				/>

				{folder && isExpanded && (
					<div className={`${styles.fileTreeChildren}`}>
						{(creatingNewFile || creatingNewFolder) && (
							<form
								className={styles.fileTreeNewItemRow}
								onSubmit={e =>
									void handleCreateNewItemSubmit(e)
								}>
								<Icon
									path={
										creatingNewFolder
											? mdiFolderPlusOutline
											: mdiFileDocumentPlusOutline
									}
									size={1}
								/>
								<input
									type="text"
									value={newItemName}
									onChange={e =>
										setNewItemName(e.target.value)
									}
									placeholder="Enter the name"
									autoFocus
									onBlur={() => {
										setCreatingNewFolder(false);
										setCreatingNewFile(false);
									}}
								/>
							</form>
						)}

						{folder.subFolders.length + folder.files.length === 0 &&
							!creatingNewFolder &&
							!creatingNewFile && (
								<p>
									This folder is empty,
									<button
										onClick={() => setCreatingNewFile(true)}
										className="link">
										&nbsp;create a file
									</button>
								</p>
							)}

						{folder.subFolders.map(subFolder => (
							<FileTreeItem
								key={subFolder.id}
								folder={subFolder}
								onMarkForDeletion={onMarkForDeletion}
								fullPath={
									fullPath
										? fullPath + "/" + subFolder.name
										: subFolder.name
								}
								id={subFolder.id}
								onFileClick={onFileClick}
								onRootClick={onRootClick}
							/>
						))}

						{folder.files.map(
							file =>
								file.isVisible && (
									<FileTreeItem
										key={file.id}
										folder={null}
										onMarkForDeletion={onMarkForDeletion}
										fullPath={
											fullPath
												? fullPath + "/" + file.name
												: file.name
										}
										id={file.id}
										onFileClick={onFileClick}
										onRootClick={onRootClick}
									/>
								),
						)}
					</div>
				)}
			</div>
		)
	);
}

export default FileTreeItem;
