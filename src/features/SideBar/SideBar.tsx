import styles from "./styles.module.css";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import FileTree from "../FileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import useAppDispatch from "../../hooks/useAppDispatch";
import { selectError, selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import { setErrorMessage } from "../../store/reducers/fileSystemReducers";
import { useMemo, useState } from "react";
import searchFolder from "../../utils/searchFolder";

function SideBar() {
	const [searchText, setSearchText] = useState<string | null>(null);
	const rootFolder = useAppSelector(selectRootFolder);
	const errorMessage = useAppSelector(selectError);
	const dispatch = useAppDispatch();
	const rootUiFolder = useMemo(
		() => searchFolder(rootFolder, searchText ?? ""),
		[rootFolder, searchText],
	);

	return (
		<div className={`${styles.sideBar}`}>
			<div>
				<div className={`${styles.searchBar}`}>
					<input
						type="text"
						placeholder="Search"
						onChange={e => setSearchText(e.target.value)}
						value={searchText ?? ""}
						className={`${styles.sideBarSearch}`}
					/>
				</div>

				{errorMessage && (
					<ErrorBox
						message={errorMessage}
						onClose={() => dispatch(setErrorMessage(""))}
					/>
				)}

				<FileTree folder={rootUiFolder} />
			</div>
		</div>
	);
}

export default SideBar;
