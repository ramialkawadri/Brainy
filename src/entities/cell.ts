export default interface ICell {
    id: number,
    file_id: number,
    content: string,
    cellType: "FlashCard" | "Note",
}
