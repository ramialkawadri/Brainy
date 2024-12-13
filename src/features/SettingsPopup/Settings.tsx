import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiCog, mdiFolderOpenOutline } from "@mdi/js";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import Settings from "../../types/backend/settings";
import { getSettings, updateSettings } from "../../services/settingsService";

interface Props {
	onClose: () => void;
}

// TODO: add outside click, Esc press
function SettingsPopup({ onClose }: Props) {
	const [settings, setSettings] = useState<Settings | null>(null);

	useEffect(() => {
		// TODO: error handling
		void (async () => {
			const settings = await getSettings();
			setSettings(settings);
		})();
	}, []);

	const handleChangeDatabaseLocationClick = async () => {
		let location = await open({
            defaultPath: settings?.databaseLocation,
            directory: true,
		});
		if (!location) return;

        if (location.includes("/")) location += "/";
        else location += "\\";
        location += "brainy.db";

		setSettings({
			...settings,
			databaseLocation: location,
		});
	};

	const handleSave = async () => {
		// TODO: error handling
        await updateSettings({
            databaseLocation: settings!.databaseLocation,
        });
        // TODO: reload the app
		onClose();
	};

	return (
		<div className="overlay">
			<div className={styles.box}>
				<div className={`row ${styles.header}`}>
					<Icon path={mdiCog} size={1.2} />
					<p>Settings</p>
				</div>
				<div className={styles.settingsRows}>
					<div className={styles.settingsRow}>
						<p>Database Location:</p>
						<div className="row">
							<input
								type="text"
								value={settings?.databaseLocation}
								readOnly
							/>
							<button
								className="transparent"
								onClick={() =>
									void handleChangeDatabaseLocationClick()
								}>
								<Icon path={mdiFolderOpenOutline} size={1} />
							</button>
						</div>
					</div>
				</div>
				<div className={styles.buttons}>
					<button className="transparent" onClick={onClose}>
						Cancel
					</button>
					<button
						className="primary"
						onClick={() => void handleSave()}>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

export default SettingsPopup;
