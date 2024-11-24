import { Card, State } from "ts-fsrs";
import { CellRepetitionDto, State as DtoState } from "../../services/backendApi";
import createCardFromRepetition from "../../utils/createCardFromRepetition";

describe(createCardFromRepetition, () => {
	it("Returns correct on all status", () => {
		// Arrange

		const statePairs = [
			[DtoState.New, State.New],
			[DtoState.Learning, State.Learning],
			[DtoState.Relearning, State.Relearning],
			[DtoState.Review, State.Review],
		];

		// Act & Assert

		for (const statePair of statePairs) {
			const dto: CellRepetitionDto = {
				due: "2000/12/12",
				state: statePair[0] as DtoState,
				cellId: "guid",
				lastReview: "2005/5/5",
				reps: 1,
				lapses: 2,
				stability: 3,
				difficulty: 4,
				elapsedDays: 5,
				scheduledDays: 6,
			};
			const expected: Card = {
				due: new Date("2000/12/12"),
				state: statePair[1] as State,
				last_review: new Date("2005/5/5"),
				reps: 1,
				lapses: 2,
				stability: 3,
				difficulty: 4,
				elapsed_days: 5,
				scheduled_days: 6,
			};
			const actual = createCardFromRepetition(dto);
			expect(actual).toStrictEqual(expected);
		}
	});
});
