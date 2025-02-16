import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";
import ReviewerCell from "../ReviewerCell/ReviewerCell";
import Icon from "@mdi/react";
import { mdiClockOutline, mdiPencilOutline } from "@mdi/js";
import { FSRS, generatorParameters, Grade, Rating, RecordLog } from "ts-fsrs";
import createCardFromCellRepetition from "../../util/createCardFromRepetition";
import durationToString from "../../util/durationToString";
import useGlobalKey from "../../hooks/useGlobalKey";
import Repetition from "../../type/backend/entity/repetition";
import createRepetitionFromCard from "../../util/createRepetitionFromCard";
import Cell from "../../type/backend/entity/cell";
import { updateRepetition } from "../../api/repetitionApi";

// TODO: move tiemr to its own component
interface Props {
	cells: Cell[];
	cellRepetitions: Repetition[];
	onEditButtonClick: (fileId: number, cellId: number) => void;
	onReviewEnd: () => void;
	onError: (message: string) => void;
}

const params = generatorParameters();
const fsrs = new FSRS(params);

function Reviewer({
	cells,
	cellRepetitions,
	onEditButtonClick,
	onError,
	onReviewEnd,
}: Props) {
	const [showAnswer, setShowAnswer] = useState(false);
	const [currentCellIndex, setCurrentCellIndex] = useState(0);
	const [isSendingRequest, setIsSendingRequest] = useState(false);
	const [timerTime, setTimerTime] = useState(0);
	const startTime = useRef(new Date());

	useEffect(() => {
		const intervalId = setInterval(() => setTimerTime(timerTime + 1), 1000);
		return () => clearInterval(intervalId);
	}, [timerTime]);

	const dueToday = cellRepetitions.filter(
		c => new Date(c.due) <= startTime.current,
	);
	if (dueToday.length === 0) onReviewEnd();

	const currentCard = createCardFromCellRepetition(
		dueToday[currentCellIndex],
	);

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
				dueToday[currentCellIndex].additionalContent,
			);
			await updateRepetition(repetition);
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
			onEditButtonClick(
				dueToday[currentCellIndex].fileId,
				dueToday[currentCellIndex].cellId,
			);
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

	const isCurrentCellNew = dueToday[currentCellIndex].state === "New";
	const isCurrentCellLearning =
		dueToday[currentCellIndex].state === "Learning" ||
		dueToday[currentCellIndex].state === "Relearning";
	const isCurrentCellReview = dueToday[currentCellIndex].state === "Review";

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
				<ReviewerCell
					cell={
						cells.find(
							c => c.id === dueToday[currentCellIndex].cellId,
						)!
					}
					repetition={dueToday[currentCellIndex]}
					showAnswer={showAnswer}
					key={currentCellIndex}
				/>
			</div>

			<div className={styles.bottomBar}>
				<div className={styles.editButtonContainer}>
					<p>&nbsp;</p>
					<button
						className="row transparent grey-button"
						onClick={() =>
							onEditButtonClick(
								dueToday[currentCellIndex].fileId,
								dueToday[currentCellIndex].cellId,
							)
						}>
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
