import { forwardRef, useState } from "react";
import styles from "./styles.module.css";
import Icon from "@mdi/react";
import getCellIcon from "../../utils/getCellIcon";
import { allCellTypes, CellType } from "../../entities/cell";

interface Props {
	className?: string;
	onClick: (cellType: CellType) => void;
}

const NewCellTypeSelector = forwardRef<HTMLDivElement, Props>(
	({ className, onClick }: Props, ref) => {
		const [searchText, setSearchText] = useState("");

		return (
			<div className={`${className} ${styles.newCellSelector}`} ref={ref}>
				<label htmlFor="search-type">Insert New Cell</label>
				<input
					id="search-type"
					type="text"
					placeholder="Search"
					onChange={e => setSearchText(e.target.value)}
					autoFocus
				/>

				{allCellTypes
					.filter(key =>
						key.toLowerCase().includes(searchText.toLowerCase()),
					)
					.map(cellType => (
						<button
							key={cellType}
							className="transparent"
							onClick={() => onClick(cellType)}>
							<Icon path={getCellIcon(cellType)} size={1} />
							<span>{cellType}</span>
						</button>
					))}
			</div>
		);
	},
);

NewCellTypeSelector.displayName = "NewCellTypeSelector";

export default NewCellTypeSelector;
