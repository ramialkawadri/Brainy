import React, { useState } from "react";
import Cell from "../../type/backend/entity/cell";
import TrueFalse from "../../type/cell/trueFalse";
import styles from "./styles.module.css";

interface Props {
	cell: Cell;
	showAnswer: boolean;
}

// TODO: better style for selected
export function TrueFalseReviewView({ cell, showAnswer }: Props) {
	const trueFalse = JSON.parse(cell.content) as TrueFalse;
	const [chosenAnswer, setChosenAnswer] = useState<boolean | null>(null);

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (e.code === "Space") {
            console.log("stopped");
            e.stopPropagation();
        }
    }

	return (
		<>
			<div dangerouslySetInnerHTML={{ __html: trueFalse.question }} />
			<hr />
			<div className={styles.trueFalseRow}>
				<button
					className={`transparent
                        ${chosenAnswer === true && !showAnswer && styles.checked}
                        ${showAnswer && trueFalse.isTrue && styles.correct}`}
                    disabled={showAnswer && !trueFalse.isTrue}
                    onKeyUp={handleKeyUp}
					onClick={() => setChosenAnswer(true)}>
					True
				</button>
				<button
					className={`transparent
                        ${chosenAnswer === false && !showAnswer && styles.checked}
                        ${showAnswer && !trueFalse.isTrue && styles.correct}`}
                    disabled={showAnswer && trueFalse.isTrue}
                    onKeyUp={handleKeyUp}
					onClick={() => setChosenAnswer(false)}>
					False
				</button>
			</div>
		</>
	);
}

export default TrueFalseReviewView;
