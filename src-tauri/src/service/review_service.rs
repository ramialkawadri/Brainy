use chrono::{NaiveTime, Utc};
use sea_orm::{DbConn, entity::*, query::*};

use crate::{dto::review_statistics::ReviewStatistics, entity::review};

// TODO: test
pub async fn get_todays_review_statistics(db_conn: &DbConn) -> Result<ReviewStatistics, String> {
    let start_of_today = Utc::now()
        .with_time(NaiveTime::from_hms_opt(0, 0, 0).unwrap())
        .unwrap()
        .to_utc();

    let end_of_today = Utc::now()
        .with_time(NaiveTime::from_hms_opt(23, 59, 59).unwrap())
        .unwrap()
        .to_utc();

    let filter =
        review::Entity::find().filter(review::Column::Date.between(start_of_today, end_of_today));

    let number_of_reviews = match filter.clone().count(db_conn).await {
        Err(err) => return Err(err.to_string()),
        Ok(number_of_reviews) => number_of_reviews,
    };

    let total_time = match filter
        .select_only()
        .column_as(review::Column::StudyTime.sum(), "sum")
        .into_tuple::<i32>()
        .one(db_conn)
        .await
    {
        Err(err) => return Err(err.to_string()),
        Ok(total_time) => total_time.unwrap(),
    };

    Ok(ReviewStatistics {
        number_of_reviews,
        total_time,
    })
}
