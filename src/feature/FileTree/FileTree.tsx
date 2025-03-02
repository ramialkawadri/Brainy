import { useState } from "react";
import ConfirmationDialog from "../../ui/ConfirmationDialog/ConfirmationDialog.tsx";
import useAppDispatch from "../../hooks/useAppDispatch.ts";
import {
	deleteFile,
	deleteFolder,
} from "../../store/actions/fileSystemActions.ts";
import FileTreeItem from "./FileTreeItem.tsx";
import UiFolder from "../../type/ui/uiFolder.ts";

interface Props {
	folder: UiFolder;
	onFileClick: () => void;
	onRootClick: () => void;
}

function FileTree({ folder, onFileClick, onRootClick }: Props) {
	const [fileMarkedForDeletion, setFileMarkedForDeletion] = useState<
		number | null
	>(null);
	const [folderMarkedForDeletion, setFolderMarkedForDeletion] = useState<
		number | null
	>(null);
    const [isAnyItemDragged, setIsAnyItemDragged] = useState(false);
	const dispatch = useAppDispatch();

	const handleDelete = async () => {
		if (folderMarkedForDeletion) {
			await dispatch(deleteFolder(folderMarkedForDeletion));
			setFolderMarkedForDeletion(null);
		}
		if (fileMarkedForDeletion) {
			await dispatch(deleteFile(fileMarkedForDeletion));
			setFileMarkedForDeletion(null);
		}
	};

	const handleDeleteCancel = () => {
		setFileMarkedForDeletion(null);
		setFolderMarkedForDeletion(null);
	};

	const handleMarkForDeletion = (id: number, isFolder: boolean) => {
		if (isFolder) setFolderMarkedForDeletion(id);
		else setFileMarkedForDeletion(id);
	};

	return (
		<>
			{(fileMarkedForDeletion ?? folderMarkedForDeletion) && (
				<ConfirmationDialog
					text={`Are you sure you want to delete the selected ${
						fileMarkedForDeletion ? "file" : "folder"
					}?`}
					title="Delete"
					onCancel={handleDeleteCancel}
					onConfirm={() => void handleDelete()}
				/>
			)}

			<FileTreeItem
				fullPath=""
				folder={folder}
				onMarkForDeletion={handleMarkForDeletion}
				id={0}
                isAnyItemDragged={isAnyItemDragged}
				onFileClick={onFileClick}
				onRootClick={onRootClick}
                onDragStart={() => setIsAnyItemDragged(true)}
                onDragEnd={() => setIsAnyItemDragged(false)}
			/>
		</>
	);
}

export default FileTree;
