import {
	mdiDeleteOutline,
	mdiDrag,
	mdiInformationOutline,
	mdiPlus,
} from "@mdi/js";
import styles from "./styles.module.css";
import Icon from "@mdi/react";
import RepetitionsInfo from "./RepetitionsInfo";
import Repetition from "../../type/backend/entity/repetition";
import { CellType } from "../../type/backend/entity/cell";
import { useRef, useState } from "react";
import useOutsideClick from "../../hooks/useOutsideClick";

interface Props {
	repetitions: Repetition[];
	cellType: CellType;
	onInsert: () => void;
	onDelete: () => void;
	onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
	onDragEnd: (e: React.DragEvent<HTMLButtonElement>) => void;
}

// TODO: hide repetitions info when other buttons are clicked
function FocusTools({
	repetitions,
	cellType,
	onInsert,
	onDelete,
	onDragStart,
	onDragEnd,
}: Props) {
	const [showRepetitionsInfo, setShowRepetitionsInfo] = useState(false);
	const repetitionsInfoRef = useRef<HTMLButtonElement>(null);

	useOutsideClick(repetitionsInfoRef as React.RefObject<HTMLElement>, () =>
		setShowRepetitionsInfo(false),
	);

	return (
		<div className={styles.focusTools} onClick={e => e.stopPropagation()}>
			<button
				className="transparent"
				title="Insert Cell (Ctrl + Shift + Enter)"
				onClick={() => {
					onInsert();
					setShowRepetitionsInfo(false);
				}}>
				<Icon path={mdiPlus} size={1} />
			</button>

			<button
				className={`transparent ${styles.delete}`}
				title="Delete cell (Alt + Del)"
				onClick={onDelete}>
				<Icon path={mdiDeleteOutline} size={1} />
			</button>

			{cellType !== "Note" && (
				<button
					className={`transparent ${styles.repetitionsInfoButton}`}
					title="Show repetitions info"
					ref={repetitionsInfoRef}
					onClick={() => setShowRepetitionsInfo(value => !value)}>
					<Icon path={mdiInformationOutline} size={1} />
					{showRepetitionsInfo && (
						<RepetitionsInfo
							repetitions={repetitions}
							cellType={cellType}
						/>
					)}
				</button>
			)}

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
	);
}

export default FocusTools;
