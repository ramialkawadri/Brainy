import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiCog } from "@mdi/js";
import { open } from '@tauri-apps/plugin-dialog';

interface Props {
	onClose: () => void;
}

// TODO: add outside click
function Settings({ onClose }: Props) {
    const handleChangeDatabaseLocationClick = async () => {
        const location = await open({
            directory: true,
        });
        if (!location) return;
        // TODO: implement logic
        console.log(location);
    };

	return (
		<div className="overlay">
			<div className={styles.box}>
				<div className={`row ${styles.header}`}>
					<Icon path={mdiCog} size={1.2} />
					<p>Settings</p>
				</div>
				<div className={styles.content}>
                    <button onClick={() => void handleChangeDatabaseLocationClick()}>Open</button>
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
