export type RepetitionState = "New" | "Learning" | "Relearning" | "Review";

export default interface IRepetition {
    id: number,
    file_id: number,
    cell_id: number,
    due: string,
    stability: number,
    difficulty: number,
    elapsed_days: number,
    scheduled_days: number,
    reps: number,
    lapses: number,
    state: RepetitionState,
    last_review: string,
}
