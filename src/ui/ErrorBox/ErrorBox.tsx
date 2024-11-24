import { mdiCloseThick } from "@mdi/js";
import styles from "./styles.module.css";
import Icon from "@mdi/react";

interface IProps {
	message: string;
	onClose?: () => void;
}

function ErrorBox({ message, onClose: onCloseClick }: IProps) {
	return (
		<div className={`${styles.errorBox}`}>
			<p>{message}</p>
			{onCloseClick && (
				<button type="button" onClick={onCloseClick}>
					<Icon path={mdiCloseThick} size={1} />
				</button>
			)}
		</div>
	);
}

export default ErrorBox;
