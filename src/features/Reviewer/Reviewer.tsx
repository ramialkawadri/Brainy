import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";
import ReviewerCell from "../ReviewerCell/ReviewerCell";
import Icon from "@mdi/react";
import { mdiClockOutline, mdiPencilOutline } from "@mdi/js";
import {
	createEmptyCard,
	FSRS,
	generatorParameters,
	Grade,
	Rating,
	RecordLog,
} from "ts-fsrs";
import createCardFromCellRepetitionDto from "../../utils/createCardFromRepetition";
import durationToString from "../../utils/durationToString";
import useGlobalKey from "../../hooks/useGlobalKey";
import Repetition from "../../entities/repetition";
import { invoke } from "@tauri-apps/api/core";
import useAppSelector from "../../hooks/useAppSelector";
import { selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";
import createRepetitionFromCard from "../../utils/createRepetitionFromCard";
import { selectSelectedFileCells } from "../../store/selectors/selectedFileCellsSelectors";

interface Props {
	onEditButtonClick: () => void;
	onReviewEnd: () => void;
	onError: (message: string) => void;
}

const params = generatorParameters();
const fsrs = new FSRS(params);

function Reviewer({ onEditButtonClick, onError, onReviewEnd }: Props) {
	const [showAnswer, setShowAnswer] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [currentCellIndex, setCurrentCellIndex] = useState(0);
	const [isSendingRequest, setIsSendingRequest] = useState(false);
	const [cellRepetitions, setCellRepetitions] = useState<Repetition[]>([]);
	const [timerTime, setTimerTime] = useState(0);
	const cells = useAppSelector(selectSelectedFileCells);
	const startTime = useRef(new Date());
	const selectedFileId = useAppSelector(selectSelectedFileId)!;

	useEffect(() => {
		const intervalId = setInterval(() => setTimerTime(timerTime + 1), 1000);
		return () => clearInterval(intervalId);
	}, [timerTime]);

	useEffect(() => {
		void (async () => {
			setIsLoading(true);
			const repetitions: Repetition[] = await invoke(
				"get_file_repetitions",
				{
					fileId: selectedFileId,
				},
			);
			setCellRepetitions(repetitions);
			setIsLoading(false);
		})();
	}, [selectedFileId]);

	const dueToday = cellRepetitions.filter(
		c => new Date(c.due) <= startTime.current,
	);
	const currentCard = isLoading
		? createEmptyCard()
		: createCardFromCellRepetitionDto(dueToday[currentCellIndex]);

	const schedulingCards: RecordLog = useMemo(
		() => fsrs.repeat(currentCard, startTime.current),
		[currentCard, startTime],
	);

	const handleGradeSubmit = async (grade: Grade) => {
		if (isSendingRequest) {
			return;
		}
		setIsSendingRequest(true);
		try {
			const card = schedulingCards[grade].card;
			const repetition = createRepetitionFromCard(
				card,
				dueToday[currentCellIndex].id,
				dueToday[currentCellIndex].fileId,
				dueToday[currentCellIndex].cellId,
			);
			await invoke("update_repetition", { repetition });
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
			startTime.current = new Date();
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
			void handleGradeSubmit(Rating.Again);
		} else if (e.key === "2") {
			void handleGradeSubmit(Rating.Hard);
		} else if (e.key === "3") {
			void handleGradeSubmit(Rating.Good);
		} else if (e.key === "4") {
			void handleGradeSubmit(Rating.Easy);
		}
	});

	const isCurrentCellNew =
		!isLoading && dueToday[currentCellIndex].state === "New";
	const isCurrentCellLearning =
		!isLoading &&
		(dueToday[currentCellIndex].state === "Learning" ||
			dueToday[currentCellIndex].state === "Relearning");
	const isCurrentCellReview =
		!isLoading && dueToday[currentCellIndex].state === "Review";

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
				{!isLoading && (
					<ReviewerCell
						cell={
							cells.find(
								c => c.id === dueToday[currentCellIndex].cellId,
							)!
						}
						showAnswer={showAnswer}
					/>
				)}
			</div>

			<div className={styles.bottomBar}>
				<div className={styles.editButtonContainer}>
					<p>&nbsp;</p>
					<button
						className="row transparent"
						onClick={onEditButtonClick}>
						<Icon path={mdiPencilOutline} size={1} />
						<span>Edit</span>
					</button>
				</div>

				{!showAnswer && (
					<div className={styles.buttonColumn}>
						<div className={styles.countRow}>
							<p
								className={`new-color
                                ${isCurrentCellNew && styles.underline}`}>
								{counts.new}
							</p>
							<p>+</p>
							<p
								className={`learning-color
                                ${isCurrentCellLearning && styles.underline}`}>
								{counts.learning}
							</p>
							<p>+</p>
							<p
								className={`review-color
                                ${isCurrentCellReview && styles.underline}`}>
								{counts.review}
							</p>
						</div>
						<button
							className="primary"
							onClick={() => setShowAnswer(true)}>
							Show Answer
						</button>
					</div>
				)}

				{showAnswer && (
					<div className={styles.buttonRow}>
						<div className={styles.buttonColumn}>
							<p>
								{durationToString(
									startTime.current,
									schedulingCards[Rating.Again].card.due,
								)}
							</p>
							<button
								className={styles.againButton}
								onClick={() =>
									void handleGradeSubmit(Rating.Again)
								}
								disabled={isSendingRequest}>
								Again
							</button>
						</div>
						<div className={styles.buttonColumn}>
							<p>
								{durationToString(
									startTime.current,
									schedulingCards[Rating.Hard].card.due,
								)}
							</p>
							<button
								className={styles.hardButton}
								onClick={() =>
									void handleGradeSubmit(Rating.Hard)
								}
								disabled={isSendingRequest}>
								Hard
							</button>
						</div>
						<div className={styles.buttonColumn}>
							<p>
								{durationToString(
									startTime.current,
									schedulingCards[Rating.Good].card.due,
								)}
							</p>
							<button
								className={styles.goodButton}
								onClick={() =>
									void handleGradeSubmit(Rating.Good)
								}
								disabled={isSendingRequest}>
								Good
							</button>
						</div>
						<div className={styles.buttonColumn}>
							<p>
								{durationToString(
									startTime.current,
									schedulingCards[Rating.Easy].card.due,
								)}
							</p>
							<button
								className={styles.easyButton}
								onClick={() =>
									void handleGradeSubmit(Rating.Easy)
								}
								disabled={isSendingRequest}>
								Easy
							</button>
						</div>
					</div>
				)}

				<div className={styles.timerContainer}>
					<div className="row">
						<Icon path={mdiClockOutline} size={1} />
						<p>
							{timerTime >= 60 * 60 &&
								Math.floor(
									timerTime / (60 * 60),
								).toLocaleString("en-US", {
									minimumIntegerDigits: 2,
									useGrouping: false,
								}) + ":"}
							{Math.floor(
								(timerTime % (60 * 60)) / 60,
							).toLocaleString("en-US", {
								minimumIntegerDigits: 2,
								useGrouping: false,
							})}
							:
							{(timerTime % 60).toLocaleString("en-US", {
								minimumIntegerDigits: 2,
								useGrouping: false,
							})}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Reviewer;
