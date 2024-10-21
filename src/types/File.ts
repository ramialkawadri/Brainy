import { CellRepetitionCountsDto } from "../services/backendApi";

export default interface IFile {
    id: string,
    name: string,
    repetitionCounts: CellRepetitionCountsDto,
}
