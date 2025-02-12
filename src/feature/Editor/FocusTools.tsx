import { mdiDeleteOutline, mdiDrag, mdiPlus } from "@mdi/js";
import styles from "./styles.module.css";
import Icon from "@mdi/react";

interface Props {
	onInsert: () => void;
	onDelete: () => void;
	onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
	onDragEnd: (e: React.DragEvent<HTMLButtonElement>) => void;
}

function FocusTools({ onInsert, onDelete, onDragStart, onDragEnd }: Props) {
	return (
		<div className={styles.focusTools} onClick={e => e.stopPropagation()}>
			<button
				className="transparent"
				title="Insert Cell (Ctrl + Shift + Enter)"
				onClick={onInsert}>
				<Icon path={mdiPlus} size={1} />
			</button>

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
	);
}

export default FocusTools;
