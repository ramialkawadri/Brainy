import { Card, createEmptyCard, State } from "ts-fsrs";
import { CellRepetitionDto, State as DtoState } from "../services/backendApi";

function createCardFromCellRepetitionDto(dto: CellRepetitionDto): Card {
    const card = createEmptyCard();
    card.due = new Date(dto.due!);
    card.reps = dto.reps!;
    card.lapses = dto.lapses!;
    card.difficulty = dto.difficulty!;
    card.elapsed_days = dto.elapsedDays!;
    card.last_review = new Date(dto.lastReview!);
    card.stability = dto.stability!;
    card.scheduled_days = dto.scheduledDays!;

    switch (dto.state) {
        case DtoState.New:
            card.state = State.New;
            break;
        case DtoState.Learning:
            card.state = State.Learning;
            break;
        case DtoState.Relearning:
            card.state = State.Relearning;
            break;
        case DtoState.Review:
            card.state = State.Review;
            break;
    }
    return card;
}

export default createCardFromCellRepetitionDto;
