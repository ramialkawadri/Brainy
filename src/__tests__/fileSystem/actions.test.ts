import configureStore from "redux-mock-store";
import { thunk } from "redux-thunk";
import { initialState } from "../../features/fileSystem/fileSystemSlice";
import { fetchFiles } from "../../features/fileSystem/actions";
const mockStore = configureStore([thunk]);

// TODO: mock sqlite in memory

test("Reducer", () => {
    const store = mockStore(initialState);
    store.dispatch(fetchFiles());
    
    console.log(store.getState())
});
