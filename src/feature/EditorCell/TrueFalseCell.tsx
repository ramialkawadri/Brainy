import { Editor } from "@tiptap/react";
import Cell from "../../type/backend/entity/cell";
import TrueFalse from "../../type/cell/trueFalse";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";
import { useState } from "react";

interface Props {
	cell: Cell;
	editable: boolean;
	autofocus: boolean;
	onUpdate: (content: string) => void;
	onFocus: (editor: Editor) => void;
}

export function TrueFalseCell({
	cell,
	editable,
	autofocus,
	onUpdate,
	onFocus,
}: Props) {
	const trueFalse = JSON.parse(cell.content) as TrueFalse;

	const [question, setQuestion] = useState(trueFalse.question);
	const [isTrue, setIsTrue] = useState(trueFalse.isTrue);

	const handleQuestionUpdate = (html: string) => {
		setQuestion(html);
		onUpdate(
			JSON.stringify({
				question: html,
				isTrue: isTrue,
			} as TrueFalse),
		);
	};

	const handleTrueFalseUpdate = (isTrue: boolean) => {
		setIsTrue(isTrue);
		onUpdate(
			JSON.stringify({
				question: question,
				isTrue,
			} as TrueFalse),
		);
	};

	return (
		<div className={styles.trueFalse}>
			<RichTextEditor
				title="Question"
				initialContent={question}
				onUpdate={handleQuestionUpdate}
				editable={editable}
				autofocus={autofocus}
				onFocus={onFocus}
			/>
			<div className={styles.buttonsRow}>
				<button
					className={`transparent ${isTrue && styles.checked}`}
					onClick={e => {
						e.stopPropagation();
						handleTrueFalseUpdate(true);
					}}>
					True
				</button>
				<button
					className={`transparent ${!isTrue && styles.checked}`}
					onClick={e => {
						e.stopPropagation();
						handleTrueFalseUpdate(false);
					}}>
					False
				</button>
			</div>
		</div>
	);
}

export default TrueFalseCell;
