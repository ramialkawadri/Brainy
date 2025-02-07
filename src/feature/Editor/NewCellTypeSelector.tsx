import { forwardRef, useState } from "react";
import styles from "./styles.module.css";
import Icon from "@mdi/react";
import getCellIcon from "../../util/getCellIcon";
import { allCellTypes, CellType } from "../../type/backend/entity/cell";
import InputWithIcon from "../../ui/InputWithIcon/InputWithIcon";
import { mdiMagnify } from "@mdi/js";

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
				<InputWithIcon
					id="search-type"
					placeholder="Search"
					onChange={e => setSearchText(e.target.value)}
					autoFocus
					iconName={mdiMagnify}
					value={searchText}
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
