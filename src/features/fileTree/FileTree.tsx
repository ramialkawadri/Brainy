import { useState } from "react";
import ConfirmationDialog from "../../ui/confirmationDialog/ConfirmationDialog";
import useAppDispatch from "../../hooks/useAppDispatch";
import { deleteFile, deleteFolder } from "../../store/actions/fileSystemActions.ts";
import FileTreeItem from "./FileTreeItem";
import UiFolder from "../../types/uiFolder.ts";


interface IProps {
    folder: UiFolder,
}

function FileTree({ folder }: IProps) {
    const [fileMarkedForDeletion, setFileMarkedForDeletion] =
        useState<number | null>(null);
    const [folderMarkedForDeletion, setFolderMarkedForDeletion] =
        useState<number | null>(null);
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
            {(fileMarkedForDeletion ?? folderMarkedForDeletion) &&
                <ConfirmationDialog
                    text={`Are you sure you want to delete the selected ${
                        fileMarkedForDeletion ? "file" : "folder"}?`}
                    title="Delete"
                    onCancel={handleDeleteCancel}
                    onConfirm={() => void handleDelete()} />}

            <FileTreeItem
                path=""
                folder={folder}
                onMarkForDeletion={handleMarkForDeletion}
                id={0} />
        </>
    );
}

export default FileTree;
