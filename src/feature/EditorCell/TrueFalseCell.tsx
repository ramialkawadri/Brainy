import { Editor } from "@tiptap/react";
import Cell from "../../type/backend/entity/cell";
import TrueFalse from "../../type/cell/trueFalse";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";

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

	const handleQuestionUpdate = (html: string) =>
		onUpdate(
			JSON.stringify({
				question: html,
				isTrue: trueFalse.isTrue,
			} as TrueFalse),
		);

	const handleTrueFalseUpdate = (isTrue: boolean) =>
		onUpdate(
			JSON.stringify({
				question: trueFalse.question,
				isTrue,
			} as TrueFalse),
		);

	return (
		<div className={styles.trueFalse}>
			<RichTextEditor
				title="Question"
				content={trueFalse.question}
				onUpdate={handleQuestionUpdate}
				editable={editable}
				autofocus={autofocus}
				onFocus={onFocus}
			/>
			<div className={styles.buttonsRow}>
				<button
					className={`transparent ${trueFalse.isTrue && styles.checked}`}
					onClick={e => {
						e.stopPropagation();
						handleTrueFalseUpdate(true);
					}}>
					True
				</button>
				<button
					className={`transparent ${!trueFalse.isTrue && styles.checked}`}
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
