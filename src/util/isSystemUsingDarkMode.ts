function isSystemUsingDarkMode() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default isSystemUsingDarkMode;
