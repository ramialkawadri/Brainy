import { useEffect } from "react";

function useBeforeUnload(cb: (e: BeforeUnloadEvent) => void) {
    useEffect(() => {
        window.addEventListener("beforeunload", cb);

        return () => {
            window.removeEventListener("beforeunload", cb);
        };
    }, [cb]);
}

export default useBeforeUnload;
