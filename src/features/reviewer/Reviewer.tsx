import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";
import ReviewerCell from "../reviewerCell/ReviewerCell";
import Icon from "@mdi/react";
import { mdiClockOutline, mdiPencilOutline } from "@mdi/js";
import { createEmptyCard, FSRS, generatorParameters, Rating } from "ts-fsrs";
import createCardFromCellRepetitionDto from "../../utils/createCardFromCellRepetitionDto";
import durationToString from "../../utils/durationToString";
import useGlobalKey from "../../hooks/useGlobalKey";
import Cell from "../../entities/cell";
import Repetition from "../../entities/repetition";
import { invoke } from "@tauri-apps/api/core";
import useAppSelector from "../../hooks/useAppSelector";
import { selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";

interface IProps {
    cells: Cell[],
    onEditButtonClick: () => void,
    onReviewEnd: () => void,
    onError: (message: string) => void,
}

// TODO: Make params configurable
const params = generatorParameters({ enable_fuzz: true, enable_short_term: false });
const fsrs = new FSRS(params);

function Reviewer({
    cells, onEditButtonClick, onError, onReviewEnd,
}: IProps) {

    const [showAnswer, setShowAnswer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentCellIndex, setCurrentCellIndex] = useState(0);
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [cellRepetitions, setCellRepetitions] = useState<Repetition[]>([]);
    const [timerTime, setTimerTime] = useState(0);
    const now = useRef(new Date());
    const selectedFileId = useAppSelector(selectSelectedFileId)!;

    useEffect(() => {
        const intervalId = setInterval(() => setTimerTime(timerTime + 1), 1000);
        return () => clearInterval(intervalId);
    }, [timerTime]);

    useEffect(() => {
        void (async () => {
            setIsLoading(true);
            const repetitions: Repetition[] = await invoke("get_file_repetitions", {
                fileId: selectedFileId,
            });
            setCellRepetitions(repetitions);
            setIsLoading(false);
        })();
    }, [selectedFileId]);

    const handleRatingSubmit = async (rating: Rating) => {
        if (isSendingRequest) {
            return;
        }
        setIsSendingRequest(true);
        try {
            // TODO: fix
            // const response = await api(backendApi.registerCellRepetitionReview({
            //     filePath,
            //     cellId: dueToday[currentCellIndex].cellId,
            //     rating: rating,
            // }));
            //
            // if (response.status !== 200) {
            //     const errorMessage = getErrorFromAxiosResponse<ProblemDetails>(
            //         response).detail;
            //     onError(errorMessage ?? "An error happened!");
            // }
        } catch (e) {
            onError("An error happened!");
            console.error(e);
        } finally {
            setIsSendingRequest(false);
        }
        setShowAnswer(false);
        if (currentCellIndex + 1 === dueToday.length) {
            onReviewEnd();
        } else {
            now.current = new Date();
            setCurrentCellIndex(currentCellIndex + 1);
        }
    };

    useGlobalKey(e => {
        if (e.key === " ") {
            setShowAnswer(true);
        } else if (e.key.toLowerCase() === "e") {
            onEditButtonClick();
        }

        if (!showAnswer) {
            return;
        }
        if (e.key === "1") {
            void handleRatingSubmit(Rating.Again);
        } else if (e.key === "2") {
            void handleRatingSubmit(Rating.Hard);
        } else if (e.key === "3") {
            void handleRatingSubmit(Rating.Good);
        } else if (e.key === "4") {
            void handleRatingSubmit(Rating.Easy);
        }
    });

    const dueToday = cellRepetitions.filter(c => new Date(c.due) <= now.current);
    const isCurrentCellNew = !isLoading && dueToday[currentCellIndex].state === "New";
    const isCurrentCellLearning = !isLoading && (
        dueToday[currentCellIndex].state === "Learning" ||
        dueToday[currentCellIndex].state === "Relearning");
    const isCurrentCellReview = !isLoading && dueToday[currentCellIndex].state === "Review";
    const currentCard = isLoading
        ? createEmptyCard()
        : createCardFromCellRepetitionDto(dueToday[currentCellIndex]);

    const schedulingCards = useMemo(
        () => fsrs.repeat(currentCard, now.current), [currentCard, now]);

    const counts = {
        new: 0,
        learning: 0,
        review: 0,
    };
    dueToday.forEach((c, i) => {
        if (i < currentCellIndex) {
            return;
        }
        switch (c.state) {
            case "New":
                counts.new += 1;
            break;
            case "Learning":
            case "Relearning":
                counts.learning += 1;
            break;
            case "Review":
                counts.review += 1;
            break;
        }
    });

    return (
        <div className={styles.reviewer}>
            <div className={`${styles.container}`}>
                {!isLoading && <ReviewerCell
                    cell={cells.find(c => c.id === dueToday[currentCellIndex].cellId)!}
                    showAnswer={showAnswer} />}
            </div>

            <div className={styles.bottomBar}>
                <div className={styles.editButtonContainer}>
                    <p>&nbsp;</p>
                    <button className="row transparent" onClick={onEditButtonClick}>
                        <Icon path={mdiPencilOutline} size={1} />
                        <span>Edit</span>
                    </button>
                </div>

                {!showAnswer && 
                    <div className={styles.buttonColumn}>
                        <div className={styles.countRow}>
                            <p className={`new-color
                                ${isCurrentCellNew && styles.underline}`}>
                                {counts.new}
                            </p>
                            <p>+</p>
                            <p className={`learning-color
                                ${isCurrentCellLearning && styles.underline}`}>
                                {counts.learning}
                            </p>
                            <p>+</p>
                            <p className={`review-color
                                ${isCurrentCellReview && styles.underline}`}>
                                {counts.review}
                            </p>
                        </div>
                        <button className="primary"
                            onClick={() => setShowAnswer(true)}>
                            Show Answer
                        </button>
                    </div>
                }

                {showAnswer &&
                    <div className={styles.buttonRow}>
                        <div className={styles.buttonColumn}>
                            <p>{durationToString(
                                now.current, schedulingCards[Rating.Again].card.due
                            )}</p>
                            <button
                                className={styles.againButton}
                                onClick={() => void handleRatingSubmit(Rating.Again)}
                                disabled={isSendingRequest}>
                                Again
                            </button>
                        </div>
                        <div className={styles.buttonColumn}>
                            <p>{durationToString(
                                now.current, schedulingCards[Rating.Hard].card.due
                            )}</p>
                            <button
                                className={styles.hardButton}
                                onClick={() => void handleRatingSubmit(Rating.Hard)}
                                disabled={isSendingRequest}>
                                Hard
                            </button>
                        </div>
                        <div className={styles.buttonColumn}>
                            <p>{durationToString(
                                now.current, schedulingCards[Rating.Good].card.due
                            )}</p>
                            <button
                                className={styles.goodButton}
                                onClick={() => void handleRatingSubmit(Rating.Good)}
                                disabled={isSendingRequest}>
                                Good
                            </button>
                        </div>
                        <div className={styles.buttonColumn}>
                            <p>{durationToString(
                                now.current, schedulingCards[Rating.Easy].card.due
                            )}</p>
                            <button
                                className={styles.easyButton}
                                onClick={() => void handleRatingSubmit(Rating.Easy)}
                                disabled={isSendingRequest}>
                                Easy
                            </button>
                        </div>
                    </div>}

                <div className={styles.timerContainer}>
                    <div className="row">
                        <Icon path={mdiClockOutline} size={1} />
                        <p>
                            {(timerTime >= 60 * 60) && 
                                Math.floor((timerTime / (60 * 60))).toLocaleString("en-US", {
                                    minimumIntegerDigits: 2,
                                    useGrouping: false
                                }) + ":"
                            }

                            {Math.floor((timerTime % (60 * 60) / 60)).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false
                            })}
                            :
                            {(timerTime % 60).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reviewer;
