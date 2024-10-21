import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiContentSaveEditOutline, mdiContentSaveSettingsOutline, mdiPlayOutline } from "@mdi/js";
import { CellRepetitionCountsDto } from "../../services/backendApi";

interface IProps {
    title: string,
    isSaving: boolean,
    repetitionCounts: CellRepetitionCountsDto,
    onSave: () => Promise<void>,
    onStudyButtonClick: () => void
}

function TitleBar({
    title, onSave, isSaving, repetitionCounts, onStudyButtonClick }: IProps) {

    const isReviewButtonDisabled = 
        ((repetitionCounts.new ?? 0) +
        (repetitionCounts.learning ?? 0) +
        (repetitionCounts.relearning ?? 0) +
        (repetitionCounts.review ?? 0)) === 0;

    const handleSaveClick = () => {
        if (isSaving) {
            return;
        }
        void onSave();
    };

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
                    <p>{title}</p>
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
            <input type="text" placeholder="Search" />
            <div className={styles.saveButtonContainer}>
                <button className="transparent" onClick={handleSaveClick}>
                    {isSaving &&
                        <>
                            <Icon path={mdiContentSaveSettingsOutline} size={1} />
                            <p>Saving</p>
                        </>}
                    {!isSaving &&
                        <>
                            <Icon path={mdiContentSaveEditOutline} size={1} />
                            <span>Save</span>
                        </>}
                </button>
            </div>
        </div>);
}

export default TitleBar;
