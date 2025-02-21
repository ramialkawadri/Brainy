import Icon from "@mdi/react";
import styles from "./styles.module.css";
import {
	mdiDotsHorizontal,
	mdiFileDocumentOutline,
	mdiFileTreeOutline,
	mdiFolderOpenOutline,
	mdiFolderOutline,
} from "@mdi/js";
import ActionsMenu from "./ActionsMenu";
import useAppSelector from "../../hooks/useAppSelector";
import { Action } from "./ActionsMenu";
import { selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";
import getFileName from "../../util/getFileName";

interface Props {
	isRoot: boolean;
	id: number;
	isFolder: boolean;
	isRenaming: boolean;
	isExpanded: boolean;
	showActions: boolean;
	actions: Action[];
	fullPath: string;
    newName: string,
    onNewNameUpdate: (newName: string) => void;
	onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
	onRenameSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onShowActionsClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
	onHideActions: () => void;
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onStopRenaming: () => void;
}

// TODO: move some of the state here
function FileTreeItemRow({
	isRoot,
	id,
	isFolder,
	isRenaming,
	isExpanded,
	showActions,
	actions,
	fullPath,
    newName,
    onNewNameUpdate,
	onDragStart,
	onRenameSubmit,
	onShowActionsClick,
	onClick,
	onHideActions,
    onStopRenaming,
}: Props) {
	const selectedFileId = useAppSelector(selectSelectedFileId);
	const isSelected = selectedFileId === id && !isRoot;

	return (
		<div
			className={`${styles.fileTreeItem}`}
			draggable={!isRoot && !isRenaming}
			onDragStart={onDragStart}>
			<button
				className={`${styles.fileTreeButton}
                ${isSelected && !isFolder && !isRenaming ? "primary" : "transparent"}`}
				onClick={onClick}>
				<Icon
					path={
						isRoot
							? mdiFileTreeOutline
							: isFolder
								? isExpanded
									? mdiFolderOpenOutline
									: mdiFolderOutline
								: mdiFileDocumentOutline
					}
					size={1}
				/>
				{isRenaming && (
					<form onSubmit={onRenameSubmit}>
						<input
							type="text"
							value={newName}
							onChange={e => onNewNameUpdate(e.target.value)}
							onFocus={e => e.target.select()}
							autoFocus
							className={`${styles.fileTreeRenameInput}`}
							onBlur={onStopRenaming}
						/>
					</form>
				)}
				{!isRenaming && (
					<p>{isRoot ? "Files" : getFileName(fullPath)}</p>
				)}
			</button>

			{!isRenaming && (
				<button
					title="Actions"
					onClick={onShowActionsClick}
					className={`${styles.fileTreeDots}
                        ${isSelected ? styles.fileTreeDotsSelected : ""}`}>
					<Icon path={mdiDotsHorizontal} size={1} />
				</button>
			)}

			{showActions && (
				<ActionsMenu onOutsideClick={onHideActions} actions={actions} />
			)}
		</div>
	);
}

export default FileTreeItemRow;
