import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";

const useAppDispatch: () => AppDispatch = useDispatch;
export default useAppDispatch;
