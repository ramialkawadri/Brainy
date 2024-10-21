import { useEffect } from "react";

function useGlobalKey(
    cb: (e: KeyboardEvent) => void, eventName: "keyup" | "keydown" = "keyup") {

    useEffect(() => {
        function handleKeyUp(e: KeyboardEvent) {
            cb(e);
        }

        document.addEventListener(eventName, handleKeyUp);
        return () => {
            document.removeEventListener(eventName, handleKeyUp);
        };
    }, [cb, eventName]);
}

export default useGlobalKey;
