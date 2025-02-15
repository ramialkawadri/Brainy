use std::collections::HashSet;

use chrono::Utc;
use rand::{seq::SliceRandom, SeedableRng};
use rand_chacha::ChaCha8Rng;
use regex::Regex;
use sea_orm::{DbConn, Set};

use crate::entity::cell::CellType;
use crate::entity::repetition::{self, State};
use crate::model::file_repetitions_count::FileRepetitionCounts;

use sea_orm::{entity::*, query::*};

const SEED: [u8; 32] = [42u8; 32];

pub async fn update_repetitions_for_cell(
    db_conn: &impl ConnectionTrait,
    file_id: i32,
    cell_id: i32,
    cell_type: CellType,
    content: &String,
) -> Result<(), String> {
    let cell_repetitions = get_repetitions_by_cell_id(db_conn, cell_id).await?;
    let mut repetitions_to_insert: Vec<repetition::ActiveModel> = vec![];
    let mut repetitions_to_remove: Vec<i32> = vec![];

    match cell_type {
        CellType::Note => (),
        CellType::FlashCard | CellType::TrueFalse => {
            if cell_repetitions.len() == 0 {
                repetitions_to_insert.push(repetition::ActiveModel {
                    file_id: Set(file_id),
                    cell_id: Set(cell_id),
                    ..Default::default()
                });
            }
        }
        CellType::Cloze => {
            update_repetitions_for_cloze_cell(
                content,
                file_id,
                cell_id,
                &cell_repetitions,
                &mut repetitions_to_insert,
                &mut repetitions_to_remove,
            );
        }
    }

    for active_model in repetitions_to_insert {
        let result = repetition::Entity::insert(active_model).exec(db_conn).await;
        if let Err(err) = result {
            return Err(err.to_string());
        }
    }

    for id in repetitions_to_remove {
        let result = repetition::Entity::delete_by_id(id).exec(db_conn).await;
        if let Err(err) = result {
            return Err(err.to_string());
        }
    }

    Ok(())
}

async fn get_repetitions_by_cell_id(
    db_conn: &impl ConnectionTrait,
    cell_id: i32,
) -> Result<Vec<repetition::Model>, String> {
    let result = repetition::Entity::find()
        .filter(repetition::Column::CellId.eq(cell_id))
        .all(db_conn)
        .await;
    match result {
        Err(err) => Err(err.to_string()),
        Ok(rows) => Ok(rows),
    }
}

fn update_repetitions_for_cloze_cell(
    content: &String,
    file_id: i32,
    cell_id: i32,
    current_cell_repetitions: &Vec<repetition::Model>,
    repetitions_to_insert: &mut Vec<repetition::ActiveModel>,
    repetitions_to_remove: &mut Vec<i32>,
) {
    let re = Regex::new("<cloze[^>]*index=\"(\\d+)\"[^>]*>").expect("Invalid regex");
    let indices: HashSet<&str> = re
        .captures_iter(&content[..])
        .map(|c| c.extract())
        .map(|c: (&str, [&str; 1])| c.1[0])
        .collect();

    for repetition in current_cell_repetitions {
        if !indices.iter().any(|i| {
            repetition.cell_id == cell_id
                && i.to_string() == repetition.additional_content.as_ref().unwrap()[..]
        }) {
            repetitions_to_remove.push(repetition.id);
        }
    }

    for &index in &indices {
        if !current_cell_repetitions
            .iter()
            .any(|c| c.cell_id == cell_id && c.additional_content.as_ref().unwrap() == index)
        {
            repetitions_to_insert.push(repetition::ActiveModel {
                file_id: Set(file_id),
                cell_id: Set(cell_id),
                additional_content: Set(Some(index.to_string())),
                ..Default::default()
            });
        }
    }
}

pub async fn get_study_repetition_counts(
    db_conn: &DbConn,
    file_id: i32,
) -> Result<FileRepetitionCounts, String> {
    let result = repetition::Entity::find()
        .select_only()
        .column(repetition::Column::State)
        .column_as(repetition::Column::State.count(), "count")
        .filter(repetition::Column::FileId.eq(file_id))
        .filter(repetition::Column::Due.lte(Utc::now().to_utc()))
        .group_by(repetition::Column::State)
        .into_tuple::<(State, i32)>()
        .all(db_conn)
        .await;

    let result = match result {
        Ok(result) => result,
        Err(err) => return Err(err.to_string()),
    };

    let mut counts: FileRepetitionCounts = Default::default();
    for row in result {
        if row.0 == State::New {
            counts.new = row.1;
        } else if row.0 == State::Learning {
            counts.learning = row.1;
        } else if row.0 == State::Relearning {
            counts.relearning = row.1;
        } else if row.0 == State::Review {
            counts.review = row.1;
        }
    }

    Ok(counts)
}

pub async fn get_file_repetitions(
    db_conn: &DbConn,
    file_id: i32,
) -> Result<Vec<repetition::Model>, String> {
    let result = repetition::Entity::find()
        .filter(repetition::Column::FileId.eq(file_id))
        .all(db_conn)
        .await;

    match result {
        Ok(mut result) => {
            let mut rng = ChaCha8Rng::from_seed(SEED);
            result.shuffle(&mut rng);
            Ok(result)
        }
        Err(err) => Err(err.to_string()),
    }
}

pub async fn update_repetition(
    db_conn: &DbConn,
    repetition: repetition::Model,
) -> Result<(), String> {
    let active_entity = repetition::ActiveModel {
        id: Set(repetition.id),
        file_id: Set(repetition.file_id),
        cell_id: Set(repetition.cell_id),
        due: Set(repetition.due),
        stability: Set(repetition.stability),
        difficulty: Set(repetition.difficulty),
        elapsed_days: Set(repetition.elapsed_days),
        scheduled_days: Set(repetition.scheduled_days),
        reps: Set(repetition.reps),
        lapses: Set(repetition.lapses),
        state: Set(repetition.state),
        last_review: Set(repetition.last_review),
        additional_content: Set(repetition.additional_content),
    };
    let result = active_entity.update(db_conn).await;
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

pub async fn get_repetitions_for_files(
    db_conn: &DbConn,
    file_ids: Vec<i32>,
) -> Result<Vec<repetition::Model>, String> {
    let mut repetitions: Vec<repetition::Model> = Vec::new();
    for file_id in file_ids {
        let mut file_repetitions = get_file_repetitions(db_conn, file_id).await?;
        repetitions.append(&mut file_repetitions);
    }
    Ok(repetitions)
}

#[cfg(test)]
mod tests {
    use chrono::Duration;

    use crate::service::{cell_service, file_service, tests::get_db};

    use super::*;

    async fn create_file_cell(db_conn: &DbConn, file_name: &str) -> (i32, i32) {
        let file_id = file_service::create_file(db_conn, file_name.into())
            .await
            .unwrap();
        let cell_id = cell_service::create_cell(db_conn, file_id, "".into(), CellType::Note, 0)
            .await
            .unwrap();
        (file_id, cell_id)
    }

    #[tokio::test]
    async fn update_repetitions_for_cell_flash_card_with_no_repetitions_added_repetition() {
        // Arrange

        let db_conn = get_db().await;
        let (file_id, cell_id) = create_file_cell(&db_conn, "file 1").await;

        // Act

        update_repetitions_for_cell(&db_conn, file_id, cell_id, CellType::FlashCard, &"".into())
            .await
            .unwrap();

        // Assert

        let actual = get_file_repetitions(&db_conn, file_id).await.unwrap();
        assert_eq!(actual.len(), 1);
    }

    #[tokio::test]
    async fn update_repetitions_for_cell_flash_card_with_repetitions_no_repetition_added() {
        // Arrange

        let db_conn = get_db().await;
        let (file_id, cell_id) = create_file_cell(&db_conn, "file 1").await;
        repetition::ActiveModel {
            file_id: Set(file_id),
            cell_id: Set(cell_id),
            ..Default::default()
        }
        .insert(&db_conn)
        .await
        .unwrap();

        // Act

        update_repetitions_for_cell(&db_conn, file_id, cell_id, CellType::FlashCard, &"".into())
            .await
            .unwrap();

        // Assert

        let actual = get_file_repetitions(&db_conn, file_id).await.unwrap();
        assert_eq!(actual.len(), 1);
    }

    #[tokio::test]
    async fn update_repetitions_for_cloze_added_new_repetitions() {
        // Arrange

        let db_conn = get_db().await;
        let (file_id, cell_id) = create_file_cell(&db_conn, "file 1").await;
        let content = r#"
            <cloze index="0">First cloze</cloze>
            <cloze index="1">Second cloze</cloze>
        "#;
        // Only adding the first cloze.
        repetition::ActiveModel {
            file_id: Set(file_id),
            cell_id: Set(cell_id),
            additional_content: Set(Some("0".into())),
            ..Default::default()
        }
        .insert(&db_conn)
        .await
        .unwrap();

        // Act

        update_repetitions_for_cell(&db_conn, file_id, cell_id, CellType::Cloze, &content.into())
            .await
            .unwrap();

        // Assert

        let actual = get_file_repetitions(&db_conn, file_id).await.unwrap();
        assert_eq!(actual.len(), 2);
        assert_eq!(actual[0].additional_content, Some("0".to_string()));
        assert_eq!(actual[1].additional_content, Some("1".to_string()));
    }

    #[tokio::test]
    async fn get_study_repetition_counts_valid_input_returned_count() {
        // Arrange

        let db_conn = get_db().await;
        let (file_id, cell_id) = create_file_cell(&db_conn, "file 1").await;
        for _ in 0..2 {
            insert_repetitions(
                &db_conn,
                vec![repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::New),
                    ..Default::default()
                }],
            )
            .await
            .unwrap();
        }

        insert_repetitions(
            &db_conn,
            vec![
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Review),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Learning),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    cell_id: Set(cell_id),
                    file_id: Set(file_id),
                    state: Set(State::Learning),
                    due: Set((Utc::now() + Duration::days(1)).to_utc()),
                    ..Default::default()
                },
            ],
        )
        .await
        .unwrap();

        // Act

        let actual = get_study_repetition_counts(&db_conn, file_id)
            .await
            .unwrap();

        // Assert

        assert_eq!(2, actual.new);
        assert_eq!(1, actual.learning);
        assert_eq!(0, actual.relearning);
        assert_eq!(1, actual.review);
    }

    #[tokio::test]
    async fn get_file_repetitions_valid_input_returned_repetitions() {
        // Arrange

        let db_conn = get_db().await;
        let (file_id, cell_id) = create_file_cell(&db_conn, "file 1").await;
        let (file_id_2, cell_id_2) = create_file_cell(&db_conn, "file 2").await;
        insert_repetitions(
            &db_conn,
            vec![
                repetition::ActiveModel {
                    file_id: Set(file_id),
                    cell_id: Set(cell_id),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    file_id: Set(file_id_2),
                    cell_id: Set(cell_id_2),
                    ..Default::default()
                },
            ],
        )
        .await
        .unwrap();

        // Act

        let actual = get_file_repetitions(&db_conn, file_id).await.unwrap();

        // Assert

        assert_eq!(actual.len(), 1);
    }

    #[tokio::test]
    async fn update_repetition_valid_input_updated_repetition() {
        // Arrange

        let db_conn = get_db().await;
        let (file_id, cell_id) = create_file_cell(&db_conn, "file 1").await;
        insert_repetitions(
            &db_conn,
            vec![repetition::ActiveModel {
                file_id: Set(file_id),
                cell_id: Set(cell_id),
                ..Default::default()
            }],
        )
        .await
        .unwrap();
        let repetition_id = repetition::Entity::find()
            .one(&db_conn)
            .await
            .unwrap()
            .unwrap()
            .id;
        let date = Utc::now().to_utc();
        let repetition = repetition::Model {
            id: repetition_id,
            file_id,
            cell_id,
            due: date,
            reps: 1,
            stability: 2.1f32,
            difficulty: 4.2f32,
            elapsed_days: 5,
            scheduled_days: 6,
            lapses: 7,
            state: State::New,
            last_review: date,
            additional_content: Some("".into()),
        };

        // Act

        update_repetition(&db_conn, repetition.clone())
            .await
            .unwrap();

        // Assert

        let actual = repetition::Entity::find()
            .one(&db_conn)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(actual.id, repetition.id);
        assert_eq!(actual.file_id, repetition.file_id);
        assert_eq!(actual.cell_id, repetition.cell_id);
        assert_eq!(actual.due, repetition.due);
        assert_eq!(actual.reps, repetition.reps);
        assert_eq!(actual.stability, repetition.stability);
        assert_eq!(actual.difficulty, repetition.difficulty);
        assert_eq!(actual.elapsed_days, repetition.elapsed_days);
        assert_eq!(actual.scheduled_days, repetition.scheduled_days);
        assert_eq!(actual.lapses, repetition.lapses);
        assert_eq!(actual.state, repetition.state);
        assert_eq!(actual.last_review, repetition.last_review);
    }

    #[tokio::test]
    async fn get_repetitions_for_files_valid_input_returned_repetitions() {
        // Arrange

        let db_conn = get_db().await;
        let (file1_id, cell1_id) = create_file_cell(&db_conn, "file 1").await;

        insert_repetitions(
            &db_conn,
            vec![
                repetition::ActiveModel {
                    file_id: Set(file1_id),
                    cell_id: Set(cell1_id),
                    ..Default::default()
                },
                repetition::ActiveModel {
                    file_id: Set(file1_id),
                    cell_id: Set(cell1_id),
                    ..Default::default()
                },
            ],
        )
        .await
        .unwrap();
        let (file2_id, cell2_id) = create_file_cell(&db_conn, "file 2").await;
        insert_repetitions(
            &db_conn,
            vec![repetition::ActiveModel {
                file_id: Set(file2_id),
                cell_id: Set(cell2_id),
                ..Default::default()
            }],
        )
        .await
        .unwrap();

        // Act

        let actual = get_repetitions_for_files(&db_conn, vec![file1_id, file2_id])
            .await
            .unwrap();

        // Assert

        assert_eq!(3, actual.len());
    }

    async fn insert_repetitions(
        db_conn: &DbConn,
        repetitions: Vec<repetition::ActiveModel>,
    ) -> Result<(), String> {
        let txn = match db_conn.begin().await {
            Ok(txn) => txn,
            Err(err) => return Err(err.to_string()),
        };

        for active_model in repetitions {
            let result = repetition::Entity::insert(active_model).exec(&txn).await;
            if let Err(err) = result {
                return Err(err.to_string());
            }
        }

        let result = txn.commit().await;
        match result {
            Ok(_) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }
}
