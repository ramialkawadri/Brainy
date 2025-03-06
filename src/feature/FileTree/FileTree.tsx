import { useState } from "react";
import ConfirmationDialog from "../../ui/ConfirmationDialog/ConfirmationDialog.tsx";
import useAppDispatch from "../../hooks/useAppDispatch.ts";
import {
	deleteFile,
	deleteFolder,
} from "../../store/actions/fileSystemActions.ts";
import FileTreeItem from "./FileTreeItem.tsx";
import UiFolder from "../../type/ui/uiFolder.ts";
import { useNavigate, useSearchParams } from "react-router";
import { fileIdQueryParameter } from "../../constants.ts";
import useAppSelector from "../../hooks/useAppSelector.ts";
import { selectFolderById } from "../../store/selectors/fileSystemSelectors.ts";
import getFolderChildById from "../../util/getFolderChildById.ts";

interface Props {
	folder: UiFolder;
}

function FileTree({ folder }: Props) {
	const [fileMarkedForDeletionId, setFileMarkedForDeletionId] = useState<
		number | null
	>(null);
	const [folderMarkedForDeletionId, setFolderMarkedForDeletionId] = useState<
		number | null
	>(null);
	const [isAnyItemDragged, setIsAnyItemDragged] = useState(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const selectedFileId = Number(searchParams.get(fileIdQueryParameter));
	const folderMarkedForDeletion = useAppSelector(state =>
		selectFolderById(state, folderMarkedForDeletionId ?? 0),
	);

	const handleDelete = async () => {
		if (folderMarkedForDeletionId) {
			await dispatch(deleteFolder(folderMarkedForDeletionId));
			setFolderMarkedForDeletionId(null);
			if (
				selectedFileId &&
				getFolderChildById(folderMarkedForDeletion!, selectedFileId)
			) {
				await navigate("/");
			}
		}
		if (fileMarkedForDeletionId) {
			await dispatch(deleteFile(fileMarkedForDeletionId));
			setFileMarkedForDeletionId(null);
			if (selectedFileId === fileMarkedForDeletionId) {
				await navigate("/");
			}
		}
	};

	const handleDeleteCancel = () => {
		setFileMarkedForDeletionId(null);
		setFolderMarkedForDeletionId(null);
	};

	const handleMarkForDeletion = (id: number, isFolder: boolean) => {
		if (isFolder) setFolderMarkedForDeletionId(id);
		else setFileMarkedForDeletionId(id);
	};

	return (
		<>
			{(fileMarkedForDeletionId ?? folderMarkedForDeletionId) && (
				<ConfirmationDialog
					text={`Are you sure you want to delete the selected ${
						fileMarkedForDeletionId ? "file" : "folder"
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
				onDragStart={() => setIsAnyItemDragged(true)}
				onDragEnd={() => setIsAnyItemDragged(false)}
			/>
		</>
	);
}

export default FileTree;
