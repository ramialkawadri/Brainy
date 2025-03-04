import styles from "./styles.module.css";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import FileTree from "../FileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import useAppDispatch from "../../hooks/useAppDispatch";
import {
	selectError,
	selectRootFolder,
	selectSelectedFileId,
} from "../../store/selectors/fileSystemSelectors";
import { setErrorMessage } from "../../store/reducers/fileSystemReducers";
import { useCallback, useMemo, useState } from "react";
import searchFolder from "../../util/searchFolder";
import { mdiArrowCollapseLeft, mdiCog, mdiHelp, mdiHome, mdiMagnify } from "@mdi/js";
import Icon from "@mdi/react";
import InputWithIcon from "../../ui/InputWithIcon/InputWithIcon";
import useGlobalKey from "../../hooks/useGlobalKey";
import { openUrl } from "@tauri-apps/plugin-opener";

interface Props {
	onFileClick: () => void;
	onRootClick: () => void;
	onHomeClick: () => void;
	onSettingsClick: () => void;
}

function SideBar({
	onFileClick,
	onRootClick,
	onHomeClick,
	onSettingsClick,
}: Props) {
	const [searchText, setSearchText] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(true);
	const rootFolder = useAppSelector(selectRootFolder);
	const errorMessage = useAppSelector(selectError);
	const dispatch = useAppDispatch();
	const rootUiFolder = useMemo(
		() => searchFolder(rootFolder, searchText ?? ""),
		[rootFolder, searchText],
	);
	const selectedFileId = useAppSelector(selectSelectedFileId);

    const openHelpWebiste = useCallback(() => {
        void openUrl("https://ramialkawadri.github.io/Brainy-docs/");
    }, []);

	useGlobalKey(e => {
		if (e.ctrlKey && e.key == "\\") {
			setIsExpanded(!isExpanded);
		} else if (e.key === "F1") {
            openHelpWebiste();
        }
	});

	return (
		<div className={`${styles.sideBar} ${!isExpanded && styles.closed}`}>
			<div className={styles.header}>
				<div className={styles.titleRow}>
					<h2>Brainy</h2>
				</div>

				<button
					className={`transparent center ${styles.toggleButton}`}
					onClick={() => setIsExpanded(!isExpanded)}
					title="Toggle sidebar (Ctrl + \)">
					<Icon path={mdiArrowCollapseLeft} size={1} />
				</button>
			</div>

			<button
				className={`${selectedFileId === null ? "primary" : "transparent"} ${styles.row}`}
				title="Home (Ctrl + h)"
				onClick={onHomeClick}>
				<Icon path={mdiHome} size={1} />
				<p>Home</p>
			</button>

			<button
				className={`transparent ${styles.row}`}
				title="Settings (Ctrl + p)"
				onClick={onSettingsClick}>
				<Icon path={mdiCog} size={1} />
				<p>Settings</p>
			</button>

			<button
				className={`transparent ${styles.row}`}
				title="Home (F1)"
				onClick={openHelpWebiste}>
				<Icon path={mdiHelp} size={1} />
				<p>Help</p>
			</button>

			<InputWithIcon
				iconName={mdiMagnify}
				value={searchText ?? ""}
				onChange={e => setSearchText(e.target.value)}
				placeholder="Search"
				className={styles.searchInput}
			/>

			{errorMessage && (
				<ErrorBox
					className={styles.errorBox}
					message={errorMessage}
					onClose={() => dispatch(setErrorMessage(""))}
				/>
			)}

			<FileTree
				folder={rootUiFolder}
				onFileClick={onFileClick}
				onRootClick={onRootClick}
			/>
		</div>
	);
}

export default SideBar;
