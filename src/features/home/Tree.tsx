import { useState } from "react";
import styles from "./styles.module.css";
import Icon from "@mdi/react";
import { mdiMinus, mdiPlus } from "@mdi/js";

interface IProps {
	folder?: IFolder;
	file?: IFile;
	name: string;
	depthLevel: number;
}

function Tree({ name, folder, file, depthLevel }: IProps) {
	const [isExpanded, setIsExpanded] = useState(!name);
	// const newCount = file
	//     ? file.repetitionCounts.new
	//     : folder!.repetitionCounts.new;
	// const learningCount = file
	//     ? (file.repetitionCounts.learning! + file.repetitionCounts.relearning!)
	//     : (folder!.repetitionCounts.learning! + folder!.repetitionCounts.relearning!);
	// const reviewCount = file
	//     ? file.repetitionCounts.review
	//     : folder!.repetitionCounts.review;
	//
	// TODO: the row css class must be each own component
	return (
		<div className={name && styles.tree}>
			{/*TODO: 
            {name &&
                <div className={styles.row + " " + styles.treeRow}>
                    <div className={styles.buttons} style={{ paddingLeft: `${depthLevel * 12}px` }}>
                        <button onClick={() => setIsExpanded(!isExpanded)}>
                            {folder &&
                                <Icon path={isExpanded ? mdiMinus : mdiPlus} size={1} />}
                        </button>
                        <button>{name}</button>
                    </div>
                    <div className={styles.columns}>
                        <p className={newCount === 0 ? "dimmed" : "new-color"}>
                            {newCount}
                        </p>
                        <p className={learningCount === 0 ? "dimmed" : "learning-color"}>
                            {learningCount}
                        </p>
                        <p className={reviewCount === 0 ? "dimmed" : "review-color"}>
                            {reviewCount}
                        </p>
                    </div>
                </div>}

            {isExpanded && folder?.subFolders.map(f => 
                <Tree key={f.id} name={f.name} depthLevel={depthLevel + 1} folder={f} />)}

            {isExpanded && folder?.files.map(f => 
                <Tree key={f.id} name={f.name} depthLevel={depthLevel + 1} file={f} />)}
            */}
		</div>
	);
}

export default Tree;
