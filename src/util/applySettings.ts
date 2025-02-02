import Settings from "../type/backend/model/settings";

function applySettings(settings: Settings) {
    if (
        settings.theme === "Dark" ||
        (settings.theme === "FollowSystem" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        )
    ) {
        document.body.classList.add("dark");
    }
    document.body.style.zoom = `${settings?.zoomPercentage}%`;
}

export default applySettings;
