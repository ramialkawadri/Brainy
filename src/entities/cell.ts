export type CellType = "FlashCard" | "Note";
export const allCellTypes: CellType[] = ["FlashCard", "Note"]; 

export default interface ICell {
    id?: number,
    fileId: number,
    content: string,
    cellType: CellType,
    index: number,
}
