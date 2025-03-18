import styles from "./styles.module.css";

interface Props {
	date: Date;
	currentYear: number;
}

function ReviwerHeatmapColumn({ date, currentYear }: Props) {
	const days = [...Array(7).keys()];

	return (
		<div className={styles.reviwerHeatmapColumn}>
			{days.map(day => (
				<span
					key={day}
					className={`${styles.heatmapBox}
                ${day < date.getDay() || isNextYearWhenDaysAdded(date, day, currentYear) ? styles.hidden : ""}`}>
                <div className={styles.heatmapPopup}>Popup</div>
                </span>
			))}
		</div>
	);
}

function isNextYearWhenDaysAdded(
	date: Date,
	days: number,
	currentYear: number,
) {
	const newDate = new Date(date);
	newDate.setDate(newDate.getDate() + days);
	return newDate.getFullYear() > currentYear;
}

export default ReviwerHeatmapColumn;
