import { mdiMagnify } from "@mdi/js";
import InputWithIcon from "../../ui/InputWithIcon/InputWithIcon";
import styles from "./styles.module.css";
import { useEffect, useRef, useState } from "react";
import { searchCells } from "../../api/cellApi";
import Cell from "../../type/backend/entity/cell";
import useGlobalKey from "../../hooks/useGlobalKey";
import errorToString from "../../util/errorToString";
import EditableCells from "../EditableCells/EditableCells";

interface Props {
	onError: (error: string) => void;
}

function Searcher({ onError }: Props) {
	const [searchText, setSearchText] = useState("");
	const [cells, setCells] = useState<Cell[]>([]);
	const searchInputRef = useRef<HTMLInputElement>(null);

    const retrieveSearchResult = async () => {
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

    useEffect(() => {
        void retrieveSearchResult();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
        await retrieveSearchResult();
	};

	// TODO: paging
	// TODO: show cells
	// TODO: repetitions
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

			{cells.length > 0 && (
				<EditableCells
					cells={cells}
					onError={onError}
					autoFocusEditor={true}
					onCellsUpdate={retrieveSearchResult}
					repetitions={[]}
					editCellId={null}
					showAddNewCellContainer={false}
					showFileSpecificFocusTools={false}
				/>
			)}
		</div>
	);
}

export default Searcher;
