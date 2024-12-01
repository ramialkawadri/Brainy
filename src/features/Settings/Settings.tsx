import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiCog } from "@mdi/js";

interface Props {
	onClose: () => void;
}

function Settings({ onClose }: Props) {
	return (
		<div className="overlay">
			<div className={styles.box}>
				<div className={`row ${styles.header}`}>
					<Icon path={mdiCog} size={1.2} />
					<p>Settings</p>
				</div>
				<div className={styles.content}>
                    <button></button>
                </div>
				<div className={styles.buttons}>
					<button className="transparent" onClick={onClose}>
						Cancel
					</button>
					<button className="primary">Save</button>
				</div>
			</div>
		</div>
	);
}

export default Settings;
