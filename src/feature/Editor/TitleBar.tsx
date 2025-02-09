import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiPlayOutline } from "@mdi/js";
import useAppSelector from "../../hooks/useAppSelector";
import {
	selectFileById,
	selectSelectedFileId,
} from "../../store/selectors/fileSystemSelectors";
import FileRepetitionCounts from "../../type/backend/model/fileRepetitionCounts";

interface Props {
	repetitionCounts: FileRepetitionCounts;
	onStudyButtonClick: () => void;
}

function TitleBar({ repetitionCounts, onStudyButtonClick }: Props) {
	const selectedFileId = useAppSelector(selectSelectedFileId);
	const selectedFile = useAppSelector(state =>
		selectFileById(state, selectedFileId!),
	);

	const isStudyButtonDisabled =
		repetitionCounts.new +
			repetitionCounts.learning +
			repetitionCounts.relearning +
			repetitionCounts.review ===
		0;

	return (
		<div className={styles.titleBar}>
			<div className={styles.info}>
				<button
					className={`transparent ${styles.studyButton}`}
					onClick={onStudyButtonClick}
					disabled={isStudyButtonDisabled}>
					<Icon path={mdiPlayOutline} size={1} />
					<span>Study</span>
				</button>
				<div>
					<p>{selectedFile.name}</p>
					<div className={styles.repetitionCounts}>
						<span>New: {repetitionCounts.new}</span>
						<span>&#x2022;</span>
						<span>
							Learning:&nbsp;
							{repetitionCounts.learning +
								repetitionCounts.relearning}
						</span>
						<span>&#x2022;</span>
						<span>Review: {repetitionCounts.review}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TitleBar;
