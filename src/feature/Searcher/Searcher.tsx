import { mdiMagnify } from "@mdi/js";
import InputWithIcon from "../../ui/InputWithIcon/InputWithIcon";
import styles from "./styles.module.css";
import { useRef, useState } from "react";
import { searchCells } from "../../api/cellApi";
import Cell from "../../type/backend/entity/cell";
import useGlobalKey from "../../hooks/useGlobalKey";
import errorToString from "../../util/errorToString";

interface Props {
	onError: (error: string) => void;
}

function Searcher({ onError }: Props) {
	const [searchText, setSearchText] = useState("");
	const [cells, setCells] = useState<Cell[]>([]);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const retrivedCells = await searchCells(searchText);
			setCells(retrivedCells);
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

	// TODO: paging
	// TODO: show cells
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

			{cells.map(cell => (
				<p key={cell.id}>{cell.id}</p>
			))}
		</div>
	);
}

export default Searcher;
