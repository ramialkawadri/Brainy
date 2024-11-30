import { mdiMinus, mdiPlus } from "@mdi/js";
import styles from "./styles.module.css";
import Icon from "@mdi/react";

interface IProps {
	expandable: boolean;
	isExapnded: boolean;
	indentationLevel: number;
	name: string;
	newCount: number;
	learningCount: number;
	reviewCount: number;
	onExpandClick: () => void;
}

function Row({
	expandable,
	isExapnded,
	indentationLevel,
	name,
	newCount,
	learningCount,
	reviewCount,
	onExpandClick,
}: IProps) {
	return (
		<div className={styles.row + " " + styles.treeRow}>
			<div
				className={styles.buttons}
				style={{ paddingLeft: `${indentationLevel * 12}px` }}>
				<button onClick={onExpandClick}>
					{expandable && (
						<Icon path={isExapnded ? mdiMinus : mdiPlus} size={1} />
					)}
				</button>
				<button>{name}</button>
			</div>
			<div className={styles.columns}>
				<p className={newCount === 0 ? "dimmed" : "new-color"}>
					{newCount}
				</p>
				<p
					className={
						learningCount === 0 ? "dimmed" : "learning-color"
					}>
					{learningCount}
				</p>
				<p className={reviewCount === 0 ? "dimmed" : "review-color"}>
					{reviewCount}
				</p>
			</div>
		</div>
	);
}

export default Row;
