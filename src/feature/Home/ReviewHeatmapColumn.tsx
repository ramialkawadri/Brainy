import { useMemo } from "react";
import styles from "./styles.module.css";
import { Tooltip } from 'react-tooltip';

interface Props {
	date: Date;
	currentYear: number;
	reviewCounts: Record<string, number>;
}

function ReviwerHeatmapColumn({ date, currentYear, reviewCounts }: Props) {
	const dates = useMemo(() => {
		const days = [...Array(7).keys()];
		return days.map(day => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + day);
			const formattedDate = newDate.toISOString().split("T")[0];
			return {
				date: newDate,
				formattedDate,
				reviewCounts: reviewCounts[formattedDate] ?? 0,
			};
		});
	}, [date, reviewCounts]);

    // TODO: change popup color on dark theme
	// TODO: add also due color
	return (
		<div className={styles.reviwerHeatmapColumn}>
			{dates.map((obj, i) => (
                <>
				<span
					key={i}
					style={{
						backgroundColor: getColor(obj.reviewCounts / 300),
					}}
					className={`${styles.heatmapBox}
                ${obj.date.getFullYear() !== currentYear || obj.date.getFullYear() > currentYear ? styles.hidden : ""}`}

                data-tooltip-id={obj.formattedDate} data-tooltip-content={`${obj.reviewCounts} reviews on ${obj.formattedDate}`}>
				</span>
                <Tooltip id={obj.formattedDate} className={styles.tooltip} />
                </>
			))}
		</div>
	);
}

const fromColor = {
	r: 206,
	g: 225,
	b: 247,
};

const toColor = {
	r: 74,
	g: 144,
	b: 226,
};

function getColor(ratio: number) {
	if (ratio === 0) return undefined;
	if (ratio > 1) ratio = 1;

	const r = Math.ceil(fromColor.r + (toColor.r - fromColor.r) * ratio);
	const g = Math.ceil(fromColor.g + (toColor.g - fromColor.g) * ratio);
	const b = Math.ceil(fromColor.b + (toColor.b - fromColor.r) * ratio);

	return `rgb(${r}, ${g}, ${b})`;
}

export default ReviwerHeatmapColumn;
