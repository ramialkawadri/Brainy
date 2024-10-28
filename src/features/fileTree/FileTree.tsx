import { useState } from "react";
import ConfirmationDialog from "../../ui/confirmationDialog/ConfirmationDialog";
import useAppDispatch from "../../hooks/useAppDispatch";
import IFolder from "../../types/folder.ts";
import { deleteFile, deleteFolder } from "../../store/actions/fileSystemActions.ts";
import getFileName from "../../utils/getFileName.ts";
import FileTreeItem from "./FileTreeItem";


interface IProps {
    folder: IFolder,
}

function FileTree({ folder }: IProps) {
    const [fileMarkedForDeletion, setFileMarkedForDeletion] =
        useState<string | null>(null);
    const [folderMarkedForDeletion, setFolderMarkedForDeletion] =
        useState<string | null>(null);
    const dispatch = useAppDispatch();

    const handleDelete = async () => {
        if (folderMarkedForDeletion) {
            await dispatch(deleteFolder(folderMarkedForDeletion));
            setFileMarkedForDeletion(null);
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

    const handleMarkForDeletion = (path: string, isFolder: boolean) => {
        if (isFolder) setFolderMarkedForDeletion(path);
        else setFileMarkedForDeletion(path);
    };

    return (
        <>
            {(fileMarkedForDeletion ?? folderMarkedForDeletion) && <ConfirmationDialog
                text={`Are you sure you want to delete "${
                    getFileName(fileMarkedForDeletion ?? folderMarkedForDeletion!)
                }"?`}
                title="Delete"
                onCancel={handleDeleteCancel}
                onConfirm={() => void handleDelete()} />
            }

            <FileTreeItem
                path=""
                folder={folder}
                onMarkForDeletion={handleMarkForDeletion}
                id={0} />
        </>
    );
}

export default FileTree;
