import * as useAppDispatch from "../../hooks/useAppDispatch";
import * as useAppSelector from "../../hooks/useAppSelector";

export function mockUseAppDispatch() {
	const useAppDispatchSpy = vi.spyOn(useAppDispatch, "default");
	const fn = vi.fn();
	useAppDispatchSpy.mockReturnValue(fn);
	return fn;
}

export function mockUseAppSelector<D>(returnValue: D) {
	const useAppIfAuthenticatedSpy = vi.spyOn(useAppSelector, "default");
	useAppIfAuthenticatedSpy.mockReturnValue(returnValue as void);
}
