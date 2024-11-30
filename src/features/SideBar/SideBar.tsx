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
import {
	setErrorMessage,
	setSelectedFileId,
} from "../../store/reducers/fileSystemReducers";
import { useMemo, useState } from "react";
import searchFolder from "../../utils/searchFolder";
import { mdiHome, mdiMagnify } from "@mdi/js";
import Icon from "@mdi/react";

interface Props {
	onFileClick: () => void;
	onRootClick: () => void;
}

function SideBar({ onFileClick, onRootClick }: Props) {
	const [searchText, setSearchText] = useState<string | null>(null);
	const rootFolder = useAppSelector(selectRootFolder);
	const errorMessage = useAppSelector(selectError);
	const dispatch = useAppDispatch();
	const rootUiFolder = useMemo(
		() => searchFolder(rootFolder, searchText ?? ""),
		[rootFolder, searchText],
	);
	const selectedFileId = useAppSelector(selectSelectedFileId);

	return (
		<div className={`${styles.sideBar}`}>
			<button
				className={`${selectedFileId === null ? "primary" : "transparent"} ${styles.homeRow}`}
				onClick={() => dispatch(setSelectedFileId(null))}>
				<Icon path={mdiHome} size={1} />
				<p>Home</p>
			</button>

			<div>
				<div className={`${styles.searchBar}`}>
                    <Icon path={mdiMagnify} size={1} className={styles.searchIcon} />
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
		</div>
	);
}

export default SideBar;
