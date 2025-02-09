import { useState } from "react";
import Cell from "../../type/backend/entity/cell";
import TrueFalse from "../../type/cell/trueFalse";
import styles from "./styles.module.css";

interface Props {
	cell: Cell;
	showAnswer: boolean;
}

export function TrueFalseReviewView({ cell, showAnswer }: Props) {
	const trueFalse = JSON.parse(cell.content) as TrueFalse;
	const [chosenAnswer, setChosenAnswer] = useState<boolean | null>(null);
    // TODO: fix showAnswer

	return (
		<>
			<div dangerouslySetInnerHTML={{ __html: trueFalse.question }} />
			<hr />
			<div className={styles.trueFalseRow}>
				<button
					className={`transparent ${chosenAnswer === true && styles.checked}`}
					onClick={() => setChosenAnswer(true)}>
					True
				</button>
				<button
					className={`transparent ${chosenAnswer === false && styles.checked}`}
					onClick={() => setChosenAnswer(false)}>
					False
				</button>
			</div>
		</>
	);
}

export default TrueFalseReviewView;
