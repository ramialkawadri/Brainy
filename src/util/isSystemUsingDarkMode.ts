function isSystemUsingDarkTheme() {
	return (
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	);
}

export default isSystemUsingDarkTheme;
