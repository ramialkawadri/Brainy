import * as useApi from "../../hooks/useApi";
import * as useAppDispatch from "../../hooks/useAppDispatch";
import * as router from "react-router";
import * as useAppSelector from "../../hooks/useAppSelector";

export function mockUseApi() {
    const useApiSpy = vi.spyOn(useApi, "default");
    const fn = vi.fn();
    useApiSpy.mockReturnValue(fn);
    return fn;
}

export function mockUseAppDispatch() {
    const useAppDispatchSpy = vi.spyOn(useAppDispatch, "default");
    const fn = vi.fn();
    useAppDispatchSpy.mockReturnValue(fn);
    return fn;
}

export function mockUseAppSelector<D>(
    returnValue: D) {
    const useAppIfAuthenticatedSpy = vi.spyOn(useAppSelector, "default");
    useAppIfAuthenticatedSpy.mockReturnValue(returnValue as void);
}

export function mockUseNavigate() {
    const fn = vi.fn();
    vi.spyOn(router, "useNavigate").mockReturnValue(fn);
    return fn;
}
