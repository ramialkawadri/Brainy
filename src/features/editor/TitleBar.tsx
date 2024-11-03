import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiPlayOutline } from "@mdi/js";
import useAppSelector from "../../hooks/useAppSelector";
import { selectFileById, selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";

interface IProps {
    repetitionCounts: CellRepetitionCountsDto,
    onStudyButtonClick: () => void
}

function TitleBar({
    repetitionCounts, onStudyButtonClick }: IProps) {

    const selectedFileId = useAppSelector(selectSelectedFileId);
    const selectedFile = useAppSelector(state => selectFileById(state, selectedFileId!));

    const isReviewButtonDisabled = 
        ((repetitionCounts.new ?? 0) +
        (repetitionCounts.learning ?? 0) +
        (repetitionCounts.relearning ?? 0) +
        (repetitionCounts.review ?? 0)) === 0;

    return (
        <div className={styles.titleBar}>
            <div className={styles.info}>
                <button
                    className={`transparent ${styles.studyButton}`}
                    onClick={onStudyButtonClick}
                    disabled={isReviewButtonDisabled}>
                    <Icon path={mdiPlayOutline} size={1.2} />
                    <span>Study</span>
                </button>
                <div>
                    <p>{selectedFile.name}</p>
                    <div className={styles.repetitionCounts}>
                        <span>New: {repetitionCounts.new ?? 0}</span>
                        <span>&#x2022;</span>
                        <span>Learning: {(repetitionCounts.learning ?? 0) +
                            (repetitionCounts.relearning ?? 0)}
                        </span>
                        <span>&#x2022;</span>
                        <span>Review: {repetitionCounts.review ?? 0}</span>
                    </div>
                </div>
            </div>
        </div>);
}

export default TitleBar;
