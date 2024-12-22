import { useMemo } from "react";
import Cell from "../../type/backend/entity/cell";
import Repetition from "../../type/backend/entity/repetition";
import styles from "./styles.module.css";

interface Props {
	cell: Cell;
	showAnswer: boolean;
	repetition: Repetition;
}

function ClozeReviewView({ cell, showAnswer, repetition }: Props) {
	const html = useMemo(() => {
		const tmp = document.createElement("div");
		tmp.innerHTML = cell.content;

		for (const element of tmp.querySelectorAll("cloze")) {
			element.classList.remove(...element.classList);
			if (element.getAttribute("index") == repetition.additionalContent) {
				element.className = styles.cloze;
				if (!showAnswer) element.textContent = "[...]";
			}
		}
		return tmp.innerHTML;
	}, [cell, showAnswer, repetition.additionalContent]);

	return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default ClozeReviewView;
