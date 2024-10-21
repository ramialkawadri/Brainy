import { backendApi } from "../../constants";

export function spyOnBackend() {
    const loginSpy = vi.spyOn(backendApi, "login");
    const registerSpy = vi.spyOn(backendApi, "register");

    return { loginSpy, registerSpy };
}
