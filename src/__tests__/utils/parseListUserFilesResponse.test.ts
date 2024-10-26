import IUserFileEntity from "../../entities/userFileEntity";
import IFolder from "../../features/fileSystem/folder";
import parseListUserFilesResponse from "../../utils/parseListUserFilesResponse";

describe(parseListUserFilesResponse, () => {
    it("Parse file list correctly", () => {
        // Arrange
        
        const response: IUserFileEntity[] = [
            {
                id: "id 1",
                path: "file 1",
                // repetitionCounts: { new: 1, review: 2, learning: 2, relearning: 0 },
                isFolder: 0,
            },
            {
                id: "id 2",
                path: "folder 1",
                isFolder: 1,
                // repetitionCounts: {},
            },
            {
                id: "id 3",
                path: "folder 1/folder 2",
                isFolder: 1,
                // repetitionCounts: {},
            },
            {
                id: "id 4",
                path: "folder 3",
                isFolder: 1,
                // repetitionCounts: {},
            },
            {
                id: "id 5",
                path: "folder 1/file 1",
                isFolder: 0,
                // repetitionCounts: {},
            },
            {
                id: "id 6",
                path: "folder 1/file 2",
                isFolder: 0,
                // repetitionCounts: { new: 5, review: 9, learning: 15, relearning: 2 },
            },
            {
                id: "id 7",
                path: "folder 1/folder 2/file 1",
                isFolder: 0,
                // repetitionCounts: { new: 1, review: 1, learning: 1, relearning: 1 },
            },
            {
                id: "id 8",
                path: "folder 1/folder 2/file 2",
                isFolder: 0,
                // repetitionCounts: { new: 0, review: 0, learning: 0, relearning: 0 },
            },
            {
                id: "id 9",
                path: "folder 3/file 1",
                isFolder: 0,
                // repetitionCounts: { new: 0, review: 0, learning: 0, relearning: 1 },
            },
        ];

        const folder2: IFolder = {
            id: "id 3",
            name: "folder 2",
            /*repetitionCounts: {
                new: 1, review: 1, learning: 1, relearning: 1,
            },*/
            subFolders: [],
            files: [
                { id: "id 7", name: "file 1", /* repetitionCounts: {
                    new: 1, review: 1, learning: 1, relearning: 1,
                }*/},
                { id: "id 8", name: "file 2",/* repetitionCounts: {
                    new: 0, review: 0, learning: 0, relearning: 0,
                }*/}, 
            ],
        };
        const folder1: IFolder = {
            id: "id 2",
            name: "folder 1",
            /*repetitionCounts: {
                new: 6, review: 10, learning: 17, relearning: 6,
            },*/
            files: [
                { id: "id 5", name: "file 1",/*repetitionCounts: {
                    new: 0, review: 0, learning: 1, relearning: 3,
                }*/},
                { id: "id 6", name: "file 2", /*repetitionCounts: {
                    new: 5, review: 9, learning: 15, relearning: 2,
                }*/},
            ],
            subFolders: [folder2],
        };
        const folder3: IFolder = {
            id: "id 4",
            name: "folder 3",
            /*repetitionCounts: {
                new: 0, review: 0, learning: 0, relearning: 1,
            },*/
            files: [{ id: "id 9", name: "file 1", /*repetitionCounts: {
                new: 0, review: 0, learning: 0, relearning: 1,
            }*/}],
            subFolders: []
        };
        const expected: IFolder = {
            id: "root",
            name: "",
            /*repetitionCounts: {
                new: 7, review: 12, learning: 19, relearning: 7,
            },*/
            files: [{ id: "id 1", name: "file 1", /*repetitionCounts: {
                new: 1, review: 2, learning: 2, relearning: 0,
            }*/}],
            subFolders: [folder1, folder3],
        };

        // Act

        const actual = parseListUserFilesResponse(response);

        // Assert

        expect(actual).toStrictEqual(expected);
    });
});
