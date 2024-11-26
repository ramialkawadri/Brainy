import File from "../../types/file";
import Folder from "../../types/folder";
import getFileOrFolderById from "../../utils/getFilOrFolderById";

describe(getFileOrFolderById, () => {
	it("Returns existing file", () => {
		// Arrange

		const expectedFile: File = {
			id: 2,
			name: "test",
		};
		const folder: Folder = {
			id: 1,
			name: "",
			files: [expectedFile],
			subFolders: [],
		};

		// Act

		const actual = getFileOrFolderById(folder, expectedFile.id);

		// Assert

		expect(actual).toStrictEqual(expectedFile);
	});

	it("Returns existing folder", () => {
		// Arrange

		const expectedFolder: Folder = {
			id: 2,
			name: "test",
			subFolders: [],
			files: [],
		};
		const folder: Folder = {
			id: 1,
			name: "",
			files: [],
			subFolders: [expectedFolder],
		};

		// Act

		const actual = getFileOrFolderById(folder, expectedFolder.id);

		// Assert

		expect(actual).toStrictEqual(expectedFolder);
	});

	it("Non existing file", () => {
		// Arrange

		const folder: Folder = {
			id: 1,
			name: "",
			files: [],
			subFolders: [],
		};

		// Act

		const actual = getFileOrFolderById(folder, 4);

		// Assert

		expect(actual).toBeNull();
	});
});
