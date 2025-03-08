import { mdiMagnify } from "@mdi/js";
import InputWithIcon from "../../ui/InputWithIcon/InputWithIcon";
import styles from "./styles.module.css";
import { useState } from "react";
import { searchCells } from "../../api/cellApi";
import Cell from "../../type/backend/entity/cell";

function Searcher() {
    const [searchText, setSearchText] = useState("");
    const [cells, setCells] = useState<Cell[]>([]);

    // TODO: error handling
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const retrivedCells = await searchCells(searchText);
        setCells(retrivedCells);
        console.log(retrivedCells);

    };

    // TODO: paging
    // TODO: show cells
    // TODO: shortcut
    return <div className={styles.container}>
        <form onSubmit={e => void handleSubmit(e)}>
            <InputWithIcon
                iconName={mdiMagnify}
                placeholder="Search (Ctrl + f)"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                inputClassName={styles.searchInput}
            />
        </form>

        {cells.map(cell => <p key={cell.id}>{cell.id}</p>)}
    </div>
}

export default Searcher;
