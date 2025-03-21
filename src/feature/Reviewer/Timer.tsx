import styles from "./styles.module.css";
import { mdiClockOutline } from "@mdi/js";
import Icon from "@mdi/react";
import { useEffect, useState } from "react";

function Timer() {
	const [time, setTime] = useState(0);

	useEffect(() => {
		const intervalId = setInterval(() => setTime(time => time + 1), 1000);
		return () => clearInterval(intervalId);
	}, []);

	return (
		<div className={styles.timerContainer}>
			<div className="row">
				<Icon path={mdiClockOutline} size={1} />
				<p>
					{time >= 60 * 60 &&
						Math.floor(time / (60 * 60)).toLocaleString("en-US", {
							minimumIntegerDigits: 2,
							useGrouping: false,
						}) + ":"}
					{Math.floor((time % (60 * 60)) / 60).toLocaleString(
						"en-US",
						{
							minimumIntegerDigits: 2,
							useGrouping: false,
						},
					)}
					:
					{(time % 60).toLocaleString("en-US", {
						minimumIntegerDigits: 2,
						useGrouping: false,
					})}
				</p>
			</div>
		</div>
	);
}

export default Timer;
