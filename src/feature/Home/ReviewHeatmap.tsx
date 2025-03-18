import { useMemo } from "react";
import ReviwerHeatmapColumn from "./ReviewHeatmapColumn";
import styles from "./styles.module.css";

function ReviwerHeatmap() {
	const weeksOfYear = useMemo(() => {
		const dates = [];
		const currentYear = new Date().getFullYear();

		for (
			let date = new Date(new Date().getFullYear(), 0, 1);
			date.getFullYear() <= currentYear;
			date.setDate(date.getDate() + (7 - date.getDay()))
		) {
			dates.push(new Date(date));
		}
		return dates;
	}, []);

	return (
		<div className={styles.reviwerHeatmap}>
			{weeksOfYear.map((week, i) => (
				<ReviwerHeatmapColumn
					currentYear={new Date().getFullYear()}
					key={i}
					date={week}
				/>
			))}
		</div>
	);
}

export default ReviwerHeatmap;
