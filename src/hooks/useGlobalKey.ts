import { useEffect } from "react";

function useGlobalKey(
	cb: (e: KeyboardEvent) => void,
	eventName: "keyup" | "keydown" = "keyup",
) {
	useEffect(() => {
		document.addEventListener(eventName, cb);
		return () => {
			document.removeEventListener(eventName, cb);
		};
	}, [cb, eventName]);
}

export default useGlobalKey;
