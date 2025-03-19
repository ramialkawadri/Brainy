import { useEffect, useMemo, useState } from "react";
import ReviwerHeatmapColumn from "./ReviewHeatmapColumn";
import styles from "./styles.module.css";
import { getReviewCountsForEveryDayOfYear } from "../../api/reviewApi";
import errorToString from "../../util/errorToString";

interface Props {
	onError: (message: string) => void;
}

function ReviwerHeatmap({onError}: Props) {
	const [reviewCounts, setReviewCounts] = useState<Record<
		string,
		number
	> | null>(null);

	const weeksOfYear = useMemo(() => {
		const dates = [];
		const currentYear = new Date().getFullYear();
		const initialDate = new Date(new Date().getFullYear(), 0, 1);
		initialDate.setDate(initialDate.getDate() - initialDate.getDay());

		for (
			let date = initialDate;
			date.getFullYear() <= currentYear;
			date.setDate(date.getDate() + (7 - date.getDay()))
		) {
			dates.push(new Date(date));
		}
		return dates;
	}, []);

	useEffect(() => {
		void (async () => {
            try {
                setReviewCounts(await getReviewCountsForEveryDayOfYear());
            } catch (e) {
                console.error(e);
                onError(errorToString(e));
            }
		})();
	}, [onError]);

	return (
		<div className={styles.reviwerHeatmap}>
			{reviewCounts &&
				weeksOfYear.map((week, i) => (
					<ReviwerHeatmapColumn
						currentYear={new Date().getFullYear()}
						key={i}
						date={week}
						reviewCounts={reviewCounts}
					/>
				))}
		</div>
	);
}

export default ReviwerHeatmap;
