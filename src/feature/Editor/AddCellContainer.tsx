import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiPlus } from "@mdi/js";
import NewCellTypeSelector from "./NewCellTypeSelector";
import { useRef, useState } from "react";
import useOutsideClick from "../../hooks/useOutsideClick";
import { CellType } from "../../type/backend/entity/cell";
import useGlobalKey from "../../hooks/useGlobalKey";

interface Props {
	isDragOver: boolean;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDrop: () => void;
	onAddNewCell: (cellType: CellType) => void;
	onPopupHide: () => void;
}

function AddCellContainer({
	isDragOver,
	onDragOver,
	onDrop,
	onDragLeave,
	onAddNewCell,
	onPopupHide,
}: Props) {
	const [showAddNewCellPopup, setShowAddNewCellPopup] = useState(false);
	const addNewCellPopupRef = useRef<HTMLDivElement>(null);

	const hidePopup = () => {
		onPopupHide();
		setShowAddNewCellPopup(false);
	};

	useOutsideClick(
		addNewCellPopupRef as React.RefObject<HTMLElement>,
		hidePopup,
	);

	useGlobalKey(e => {
		if (e.key === "Escape") {
			hidePopup();
		} else if (e.ctrlKey && !e.shiftKey && e.code === "Enter") {
			setShowAddNewCellPopup(true);
		}
	}, "keydown");

	return (
		<>
			<div
				className={`${styles.addButtonContainer}
                    ${isDragOver ? styles.dragOver : ""}`}
				onDragOver={onDragOver}
				onDrop={onDrop}
				onDragLeave={onDragLeave}>
				<button
					className={`${styles.addButton} grey-button`}
					onClick={() => setShowAddNewCellPopup(true)}>
					<Icon path={mdiPlus} size={1} />
					<span title="Ctrl + Enter">Add Cell</span>
				</button>
			</div>

			{showAddNewCellPopup && (
				<div className="overlay">
					<NewCellTypeSelector
						className={styles.overlayCellSelector}
						onClick={cellType => {
							onAddNewCell(cellType);
							hidePopup();
						}}
						ref={addNewCellPopupRef}
					/>
				</div>
			)}
		</>
	);
}

export default AddCellContainer;
