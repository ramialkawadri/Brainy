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
import { useMemo, useState } from "react";
import searchFolder from "../../utils/searchFolder";
import { mdiArrowCollapseLeft, mdiCog, mdiHome, mdiMagnify } from "@mdi/js";
import Icon from "@mdi/react";

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

	return (
		<div className={`${styles.sideBar} ${!isExpanded && styles.closed}`}>
			<div className={styles.header}>
				<h2>Brainy</h2>
				<button
					className={`transparent center ${styles.toggleButton}`}
					onClick={() => setIsExpanded(!isExpanded)}>
					<Icon path={mdiArrowCollapseLeft} size={1.2} />
				</button>
			</div>

			<button
				className={`${selectedFileId === null ? "primary" : "transparent"} ${styles.row}`}
				onClick={onHomeClick}>
				<Icon path={mdiHome} size={1.2} />
				<p>Home</p>
			</button>

			<button
				className={`transparent ${styles.row}`}
				onClick={onSettingsClick}>
				<Icon path={mdiCog} size={1.2} />
				<p>Settings</p>
			</button>

			<div className={`${styles.searchBar}`}>
				<Icon
					path={mdiMagnify}
					size={1}
					className={styles.searchIcon}
				/>
				<input
					type="text"
					placeholder="Search"
					onChange={e => setSearchText(e.target.value)}
					value={searchText ?? ""}
				/>
			</div>

			{errorMessage && (
				<ErrorBox
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
