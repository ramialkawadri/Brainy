import { invoke } from "@tauri-apps/api/core";
import ReviewStatistics from "../type/backend/dto/reviewStatistics";

export function getTodaysReviewStatistics(): Promise<ReviewStatistics> {
	return invoke("get_todays_review_statistics");
}
