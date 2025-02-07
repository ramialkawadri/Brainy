import styles from "./styles.module.css";
import Icon from "@mdi/react";

interface IProps {
	iconName: string;
	value: string;
	placeholder: string;
	className?: string;
	id?: string;
	autoFocus?: boolean;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InputWithIcon({
	iconName,
	value,
	placeholder,
	className,
	id,
	autoFocus,
	onChange,
}: IProps) {
	return (
		<div className={styles.container}>
			<Icon path={iconName} size={1} className={styles.icon} />
			<input
				type="text"
				placeholder={placeholder}
				onChange={onChange}
				value={value}
				className={className}
				id={id}
				autoFocus={autoFocus}
			/>
		</div>
	);
}

export default InputWithIcon;
