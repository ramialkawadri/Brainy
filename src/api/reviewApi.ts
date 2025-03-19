import { invoke } from "@tauri-apps/api/core";
import ReviewStatistics from "../type/backend/dto/reviewStatistics";
import Repetition from "../type/backend/entity/repetition";
import { Rating } from "../type/backend/entity/rating";

export function registerReview(
	newRepetition: Repetition,
	rating: Rating,
	studyTime: number,
) {
	return invoke("register_review", { newRepetition, rating, studyTime });
}

export function getTodaysReviewStatistics(): Promise<ReviewStatistics> {
	return invoke("get_todays_review_statistics");
}

export function getReviewCountsForEveryDayOfYear(): Promise<
	Record<string, number>
> {
	return invoke("get_review_counts_for_every_day_of_year");
}
