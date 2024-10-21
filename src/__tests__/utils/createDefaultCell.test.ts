import * as uuid from "uuid";
import { CellInfoDto, CellType } from "../../services/backendApi";
import createDefaultCell from "../../utils/createDefaultCell";

describe(createDefaultCell, () => {
    const mockedId = "mocked-guid";
    
    beforeAll(() => {
        const uuidv4Spy = vi.spyOn(uuid, "v4");
        uuidv4Spy.mockReturnValue(mockedId);
    });

    it("Note", () => {
        // Arrange
        
        const expected: CellInfoDto = {
            id: mockedId,
            type: CellType.Note,
            data: "",
        };

        // Act
        
        const actual = createDefaultCell(CellType.Note);

        // Assert

        expect(actual).toStrictEqual(expected);
    });

    it("Flash Card", () => {
        // Arrange
        
        const expected: CellInfoDto = {
            id: mockedId,
            type: CellType.FlashCard,
            data: { question: "", answer: "" },
        };

        // Act
        
        const actual = createDefaultCell(CellType.FlashCard);

        // Assert

        expect(actual).toStrictEqual(expected);
    });
});
