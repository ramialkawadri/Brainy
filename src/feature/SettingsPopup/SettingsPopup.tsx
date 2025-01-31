import Icon from "@mdi/react";
import styles from "./styles.module.css";
import { mdiCog, mdiFolderOpenOutline } from "@mdi/js";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState } from "react";
import Settings, { Theme } from "../../type/backend/model/settings";
import { getSettings, updateSettings } from "../../api/settingsApi";
import useOutsideClick from "../../hooks/useOutsideClick";
import useGlobalKey from "../../hooks/useGlobalKey";
import useAppDispatch from "../../hooks/useAppDispatch";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import { setSelectedFileId } from "../../store/reducers/fileSystemReducers";

interface Props {
	onClose: () => void;
	onError: (error: string) => void;
}

// TODO: dark theme, follow the setting
function SettingsPopup({ onClose, onError }: Props) {
	const [settings, setSettings] = useState<Settings | null>(null);
	const boxRef = useRef<HTMLDivElement>(null);
	const dispatch = useAppDispatch();

	useOutsideClick(boxRef as React.RefObject<HTMLElement>, onClose);

	useEffect(() => {
		void (async () => {
			try {
				const settings = await getSettings();
				setSettings(settings);
			} catch (e) {
				if (e instanceof Error) onError(e.message);
				else onError(e as string);
			}
		})();
	}, [onError]);

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
			...settings!,
			databaseLocation: location,
		});
	};

	const handleSave = async () => {
		try {
			await updateSettings({
				...settings!,
			});
			await dispatch(fetchFiles());
			dispatch(setSelectedFileId(null));
			onClose();
		} catch (e) {
			if (e instanceof Error) onError(e.message);
			else onError(e as string);
		}
	};

	useGlobalKey((e: KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	});

	return (
		<div className="overlay">
			<div className={styles.box} ref={boxRef}>
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
								value={settings?.databaseLocation ?? ""}
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
					<div className={styles.settingsRow}>
						<p>Theme:</p>
						<select
							value={settings?.theme}
							onChange={e =>
								setSettings({
									...settings!,
									theme: e.target.value as Theme,
								})
							}>
							<option value="FollowSystem">Follow system</option>
							<option value="Light">Light</option>
							<option value="Dark">Dark</option>
						</select>
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
