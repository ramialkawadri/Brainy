import styles from "./styles.module.css";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import FileTree from "../FileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import useAppDispatch from "../../hooks/useAppDispatch";
import {
	selectError,
	selectRootFolder,
} from "../../store/selectors/fileSystemSelectors";
import { setErrorMessage } from "../../store/reducers/fileSystemReducers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import searchFolder from "../../util/searchFolder";
import {
	mdiArrowCollapseLeft,
	mdiCog,
	mdiHelp,
	mdiHome,
	mdiMagnify,
} from "@mdi/js";
import Icon from "@mdi/react";
import InputWithIcon from "../../ui/InputWithIcon/InputWithIcon";
import useGlobalKey from "../../hooks/useGlobalKey";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { fileIdQueryParameter } from "../../constants";

const SMALL_SCREEN_MAX_WIDTH = 600;

interface Props {
	onHomeClick: () => void;
	onSettingsClick: () => void;
}

function SideBar({ onHomeClick, onSettingsClick }: Props) {
	const [searchText, setSearchText] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(true);
	const rootFolder = useAppSelector(selectRootFolder);
	const errorMessage = useAppSelector(selectError);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const isSmallScreen = useRef(window.innerWidth <= SMALL_SCREEN_MAX_WIDTH);
	const rootUiFolder = useMemo(
		() => searchFolder(rootFolder, searchText ?? ""),
		[rootFolder, searchText],
	);
	const [searchParams] = useSearchParams();
	const selectedFileId = Number(searchParams.get(fileIdQueryParameter));

	useEffect(() => {
		window.addEventListener("resize", () => {
			isSmallScreen.current = window.innerWidth <= SMALL_SCREEN_MAX_WIDTH;
		});
	}, []);

	useEffect(() => {
		if (!isSmallScreen.current) return;
		if (location.pathname === "/") {
			setIsExpanded(true);
		} else {
			setIsExpanded(false);
		}
	}, [location]);

	const openHelpWebiste = useCallback(() => {
		void openUrl("https://ramialkawadri.github.io/Brainy-docs/");
	}, []);

	useGlobalKey(e => {
		if (e.ctrlKey && e.key == "\\") {
			setIsExpanded(!isExpanded);
		} else if (e.key === "F1") {
			openHelpWebiste();
		} else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
			void navigate("/search");
		}
	});

	const handleToggleSidebarClick = () => {
		if (isSmallScreen.current) {
			void navigate({
				pathname: "/",
				search: searchParams.toString(),
			});
		} else {
			setIsExpanded(!isExpanded);
		}
	};

	return (
		<div className={`${styles.sideBar} ${!isExpanded && styles.closed}`}>
			<div className={styles.header}>
				<div className={styles.titleRow}>
					<h2>Brainy</h2>
				</div>

				<button
					className={`transparent center ${styles.toggleButton}`}
					onClick={handleToggleSidebarClick}
					title="Expand/Collapse sidebar (Ctrl + \)">
					<Icon path={mdiArrowCollapseLeft} size={1} />
				</button>
			</div>

			<button
				className={`${
					selectedFileId === 0 &&
					(location.pathname === "/" ||
						location.pathname.startsWith("/home"))
						? "primary"
						: "transparent"
				} ${styles.row}`}
				title="Home (Ctrl + h)"
				onClick={onHomeClick}>
				<Icon path={mdiHome} size={1} />
				<p>Home</p>
			</button>

			<button
				className={`${
					selectedFileId === 0 &&
					location.pathname.startsWith("/search")
						? "primary"
						: "transparent"
				} ${styles.row}`}
				title="Search (Ctrl + Shift + f)"
				onClick={() => void navigate("/search")}>
				<Icon path={mdiMagnify} size={1} />
				<p>Search</p>
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
				title="Help (F1)"
				onClick={openHelpWebiste}>
				<Icon path={mdiHelp} size={1} />
				<p>Help</p>
			</button>

			<InputWithIcon
				iconName={mdiMagnify}
				value={searchText ?? ""}
				onChange={e => setSearchText(e.target.value)}
				placeholder="Search"
				inputClassName={styles.searchInput}
			/>

			{errorMessage && (
				<ErrorBox
					className={styles.errorBox}
					message={errorMessage}
					onClose={() => dispatch(setErrorMessage(""))}
				/>
			)}

			<FileTree folder={rootUiFolder} />
		</div>
	);
}

export default SideBar;
