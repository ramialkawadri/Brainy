import { FileInfoDto } from "../../services/backendApi";
import IFolder from "../../types/Folder";
import parseListUserFilesResponse from "../../utils/parseListUserFilesResponse";

describe(parseListUserFilesResponse, () => {
    it("Parse file list correctly", () => {
        // Arrange
        
        const response: FileInfoDto[] = [
            {
                id: "id 0",
                name: ".hidden",
                repetitionCounts: {},
            },
            {
                id: "id 1",
                name: "file 1",
                repetitionCounts: { new: 1, review: 2, learning: 2, relearning: 0 },
            },
            {
                id: "id 2",
                name: "folder 1/.hidden",
                repetitionCounts: {},
            },
            {
                id: "id 3",
                name: "folder 1/file 1",
                repetitionCounts: { new: 0, review: 0, learning: 1, relearning: 3 },
            },
            {
                id: "id 4",
                name: "folder 1/file 2",
                repetitionCounts: { new: 5, review: 9, learning: 15, relearning: 2 },
            },
            {
                id: "id 5",
                name: "folder 1/folder 2/file 1",
                repetitionCounts: { new: 1, review: 1, learning: 1, relearning: 1 },
            },
            {
                id: "id 6",
                name: "folder 1/folder 2/file 2",
                repetitionCounts: { new: 0, review: 0, learning: 0, relearning: 0 },
            },
            {
                id: "id 7",
                name: "folder 3/file 1",
                repetitionCounts: { new: 0, review: 0, learning: 0, relearning: 1 },
            },
        ];

        const folder2: IFolder = {
            id: "",
            name: "folder 2",
            repetitionCounts: {
                new: 1, review: 1, learning: 1, relearning: 1,
            },
            subFolders: [],
            files: [
                { id: "id 5", name: "file 1", repetitionCounts: {
                    new: 1, review: 1, learning: 1, relearning: 1,
                }}, 
                { id: "id 6", name: "file 2", repetitionCounts: {
                    new: 0, review: 0, learning: 0, relearning: 0,
                }}, 
            ],
        };
        const folder1: IFolder = {
            id: "id 2",
            name: "folder 1",
            repetitionCounts: {
                new: 6, review: 10, learning: 17, relearning: 6,
            },
            files: [
                { id: "id 3", name: "file 1", repetitionCounts: {
                    new: 0, review: 0, learning: 1, relearning: 3,
                }},
                { id: "id 4", name: "file 2", repetitionCounts: {
                    new: 5, review: 9, learning: 15, relearning: 2,
                }},
            ],
            subFolders: [folder2],
        };
        const folder3: IFolder = {
            id: "",
            name: "folder 3",
            repetitionCounts: {
                new: 0, review: 0, learning: 0, relearning: 1,
            },
            files: [{ id: "id 7", name: "file 1", repetitionCounts: {
                new: 0, review: 0, learning: 0, relearning: 1,
            }}],
            subFolders: []
        };
        const expected: IFolder = {
            id: "id 0",
            name: "",
            repetitionCounts: {
                new: 7, review: 12, learning: 19, relearning: 7,
            },
            files: [{ id: "id 1", name: "file 1", repetitionCounts: {
                new: 1, review: 2, learning: 2, relearning: 0,
            }}],
            subFolders: [folder1, folder3],
        };

        // Act

        const actual = parseListUserFilesResponse(response);

        // Assert

        expect(actual).toStrictEqual(expected);
    });
});
