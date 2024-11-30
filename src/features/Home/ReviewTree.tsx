import { useState } from "react";
import ParsedFolder from "../../types/parsedFolder";
import styles from "./styles.module.css";
import ParsedFile from "../../types/parsedFile";
import Row from "./Row";

interface Props {
	folder?: ParsedFolder;
	file?: ParsedFile;
	name?: string;
	indentationLevel: number;
	onFileClick: (file: ParsedFile) => Promise<void>;
	onFolderClick: (folder: ParsedFolder) => Promise<void>;
}

function ReviewTree({
	name,
	folder,
	file,
	indentationLevel,
	onFileClick,
	onFolderClick,
}: Props) {
	const [isExpanded, setIsExpanded] = useState(!name);
	const newCount = file
		? file.repetitionCounts.new
		: folder!.repetitionCounts.new;
	const learningCount = file
		? file.repetitionCounts.learning + file.repetitionCounts.relearning
		: folder!.repetitionCounts.learning +
			folder!.repetitionCounts.relearning;
	const reviewCount = file
		? file.repetitionCounts.review
		: folder!.repetitionCounts?.review;

	return (
		<div className={name && styles.tree}>
			{name && (
				<Row
					expandable={folder !== undefined}
					isExapnded={isExpanded}
					indentationLevel={indentationLevel}
					name={name}
					newCount={newCount}
					learningCount={learningCount}
					reviewCount={reviewCount}
					onExpandClick={() => setIsExpanded(!isExpanded)}
					onClick={() =>
						file ? onFileClick(file) : onFolderClick(folder!)
					}
				/>
			)}

			{isExpanded &&
				folder?.subFolders.map(f => (
					<ReviewTree
						key={f.id}
						name={f.name}
						indentationLevel={indentationLevel + 1}
						folder={f}
						onFileClick={onFileClick}
						onFolderClick={onFolderClick}
					/>
				))}

			{isExpanded &&
				folder?.files.map(f => (
					<ReviewTree
						key={f.id}
						name={f.name}
						indentationLevel={indentationLevel + 1}
						file={f}
						onFileClick={onFileClick}
						onFolderClick={onFolderClick}
					/>
				))}
		</div>
	);
}

export default ReviewTree;
