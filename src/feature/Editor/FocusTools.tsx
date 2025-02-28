import {
	mdiDeleteOutline,
	mdiDrag,
	mdiInformationOutline,
	mdiPlus,
	mdiRestore,
} from "@mdi/js";
import styles from "./styles.module.css";
import Icon from "@mdi/react";
import RepetitionsInfo from "./RepetitionsInfo";
import Repetition from "../../type/backend/entity/repetition";
import Cell from "../../type/backend/entity/cell";
import { useRef, useState } from "react";
import useOutsideClick from "../../hooks/useOutsideClick";
import ConfirmationDialog from "../../ui/ConfirmationDialog/ConfirmationDialog";
import { resetRepetitionsForCell } from "../../api/repetitionApi";
import errorToString from "../../util/errorToString";

interface Props {
	repetitions: Repetition[];
	cell: Cell;
	onInsert: () => void;
	onDelete: () => void;
	onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
	onDragEnd: (e: React.DragEvent<HTMLButtonElement>) => void;
	onShowRepetitionsInfo: () => void;
	onResetRepetitions: () => void;
	onError: (error: string) => void;
}

function FocusTools({
	repetitions,
	cell,
	onInsert,
	onDelete,
	onDragStart,
	onDragEnd,
	onShowRepetitionsInfo,
	onResetRepetitions,
	onError,
}: Props) {
	const [showRepetitionsInfo, setShowRepetitionsInfo] = useState(false);
	const [showResetRepetitionsDialog, setShowResetRepetitionsDialog] =
		useState(false);
	const repetitionsInfoRef = useRef<HTMLButtonElement>(null);

	useOutsideClick(repetitionsInfoRef as React.RefObject<HTMLElement>, () =>
		setShowRepetitionsInfo(false),
	);

	const handleShowRepetitionsInfoClick = () => {
		setShowRepetitionsInfo(value => !value);
		if (!showRepetitionsInfo) onShowRepetitionsInfo();
	};

	const handleResetRepetitionsConfirm = async () => {
		try {
			setShowResetRepetitionsDialog(false);
			await resetRepetitionsForCell(cell.id!);
			onResetRepetitions();
		} catch (e) {
			console.error(e);
			onError(errorToString(e));
		}
	};

	return (
		<>
			{showResetRepetitionsDialog && (
				<ConfirmationDialog
					text="Are you sure you want to reset all repetitions related to this cell?"
					title="Reset repetitions"
					onCancel={() => setShowResetRepetitionsDialog(false)}
					onConfirm={() => void handleResetRepetitionsConfirm()}
				/>
			)}

			<div
				className={styles.focusTools}
				onClick={e => e.stopPropagation()}>
				<button
					className="transparent"
					title="Insert Cell (Ctrl + Shift + Enter)"
					onClick={() => {
						onInsert();
						setShowRepetitionsInfo(false);
					}}>
					<Icon path={mdiPlus} size={1} />
				</button>

				{cell.cellType !== "Note" && (
					<>
						<button
							className="transparent"
							title="Reset all repetitions for this cells"
							onClick={() => setShowResetRepetitionsDialog(true)}>
							<Icon path={mdiRestore} size={1} />
						</button>

						<button
							className={`transparent ${styles.repetitionsInfoButton}`}
							title="Show repetitions info"
							ref={repetitionsInfoRef}
							onClick={() => handleShowRepetitionsInfoClick()}>
							<Icon path={mdiInformationOutline} size={1} />
							{showRepetitionsInfo && (
								<RepetitionsInfo
									repetitions={repetitions}
									cellType={cell.cellType}
								/>
							)}
						</button>
					</>
				)}

				<button
					className={`transparent ${styles.delete}`}
					title="Delete cell (Alt + Del)"
					onClick={onDelete}>
					<Icon path={mdiDeleteOutline} size={1} />
				</button>

				<button
					tabIndex={-1}
					className={styles.drag}
					title="Drag cell"
					draggable
					onDragStart={onDragStart}
					onDragEnd={onDragEnd}>
					<Icon path={mdiDrag} size={1} />
				</button>
			</div>
		</>
	);
}

export default FocusTools;
