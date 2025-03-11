import { mdiMagnify } from "@mdi/js";
import InputWithIcon from "../../ui/InputWithIcon/InputWithIcon";
import styles from "./styles.module.css";
import { useRef, useState } from "react";
import useGlobalKey from "../../hooks/useGlobalKey";
import errorToString from "../../util/errorToString";
import EditableCells from "../EditableCells/EditableCells";
import SearchResult from "../../type/backend/dto/searchResult";
import { searchCells } from "../../api/searchApi";

interface Props {
	onError: (error: string) => void;
	onEditButtonClick: (fileId: number, cellId: number) => void;
}

function Searcher({ onError, onEditButtonClick }: Props) {
	const [searchText, setSearchText] = useState("");
	const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const retrieveSearchResult = async () => {
		try {
			const result = await searchCells(searchText);
			setSearchResult(result);
		} catch (e) {
			console.error(e);
			onError(errorToString(e));
		}
	};

	useGlobalKey(e => {
		if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "f") {
			e.preventDefault();
			searchInputRef.current?.focus();
		}
	}, "keydown");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await retrieveSearchResult();
	};

	return (
		<div className={styles.container}>
			<form onSubmit={e => void handleSubmit(e)}>
				<InputWithIcon
					iconName={mdiMagnify}
					placeholder="Search (Ctrl + f)"
					value={searchText}
					onChange={e => setSearchText(e.target.value)}
					inputClassName={styles.searchInput}
					ref={searchInputRef}
					autoFocus
				/>
			</form>

			{!searchResult && (
				<p className={styles.noSearchLabel}>
					Type something and press Enter.
				</p>
			)}

			{searchResult?.cells.length === 0 && (
				<p className={styles.noSearchLabel}>No result found!</p>
			)}

			{searchResult && searchResult.cells.length > 0 && (
				<EditableCells
					cells={searchResult.cells}
					onError={onError}
					autoFocusEditor={true}
					onCellsUpdate={retrieveSearchResult}
					repetitions={searchResult.repetitions}
					editCellId={null}
					enableFileSpecificFunctionality={false}
					onEditButtonClick={onEditButtonClick}
				/>
			)}
		</div>
	);
}

export default Searcher;
