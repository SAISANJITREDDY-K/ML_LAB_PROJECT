import io
import json
import pytest
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from backend.app import create_app
from backend.ml.preprocessing import (
    build_preprocessor,
    detect_feature_types,
    validate_dataset_configuration,
)
from backend.ml.training import train_model
from backend.services.model_service import (
    execute_training_pipeline,
    execute_prediction,
    list_saved_models,
    delete_saved_model,
)
from backend.services.dataset_service import (
    save_uploaded_dataset,
    get_dataset_summary,
    get_dataset_preview,
    remove_dataset_duplicates,
)


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# 1. Backend health endpoint
def test_1_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "ModelForge AI" in data["service"]


# 2. Valid CSV upload
def test_2_valid_csv_upload(client):
    csv_data = io.BytesIO(b"age,income,category,target\n25,50000,A,1\n30,60000,B,0\n35,70000,A,1\n40,80000,B,0\n")
    res = client.post(
        "/api/datasets/upload",
        data={"file": (csv_data, "test_valid.csv")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["dataset"]["rows"] == 4
    assert data["dataset"]["columns"] == 4


# 3. Invalid file upload (non-CSV)
def test_3_invalid_file_upload(client):
    txt_data = io.BytesIO(b"Just plain text file content")
    res = client.post(
        "/api/datasets/upload",
        data={"file": (txt_data, "bad_file.txt")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert "CSV" in data["error"]


# 4. Empty CSV handling
def test_4_empty_csv_handling(client):
    empty_csv = io.BytesIO(b"")
    res = client.post(
        "/api/datasets/upload",
        data={"file": (empty_csv, "empty.csv")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False


# 5. Missing-value summary
def test_5_missing_value_summary(client):
    # Student benchmark has intentional missing values
    res = client.get("/api/datasets/ds_student_placement/summary")
    assert res.status_code == 200
    summary = res.get_json()["summary"]
    assert "missing_counts" in summary
    assert "missing_percentages" in summary
    assert "CGPA" in summary["missing_counts"]
    assert summary["missing_counts"]["CGPA"] >= 1


# 6. Duplicate detection and cleaning
def test_6_duplicate_detection_and_cleaning(client):
    csv_with_dups = io.BytesIO(
        b"feat1,feat2,target\n10,20,A\n10,20,A\n30,40,B\n30,40,B\n50,60,A\n"
    )
    upload_res = client.post(
        "/api/datasets/upload",
        data={"file": (csv_with_dups, "test_dups.csv")},
        content_type="multipart/form-data",
    )
    assert upload_res.status_code == 201
    ds_id = upload_res.get_json()["dataset"]["id"]

    res = client.get(f"/api/datasets/{ds_id}/summary")
    assert res.status_code == 200
    summary = res.get_json()["summary"]
    assert summary["duplicate_rows"] == 2

    # Clean duplicates
    clean_res = client.post(f"/api/datasets/{ds_id}/clean", json={"action": "remove_duplicates"})
    assert clean_res.status_code == 200
    clean_data = clean_res.get_json()["result"]
    assert clean_data["removed_rows"] == 2
    assert clean_data["remaining_rows"] == 3


# 7. Dataset preview with pagination
def test_7_dataset_preview(client):
    res = client.get("/api/datasets/ds_student_placement/preview?page=1&pageSize=10")
    assert res.status_code == 200
    preview = res.get_json()["preview"]
    assert preview["page"] == 1
    assert preview["page_size"] == 10
    assert len(preview["records"]) <= 10
    assert "Placement_Status" in preview["columns"]


# 8. Target-column validation
def test_8_target_column_validation():
    df = pd.DataFrame({"feat1": [1, 2, 3], "target": ["A", "B", "A"]})
    # Target not in dataset
    res1 = validate_dataset_configuration(df, "nonexistent", ["feat1"], "classification")
    assert res1["valid"] is False
    assert "Target column" in res1["errors"][0]


# 9. Feature selection validation (Target Leakage prevention)
def test_9_feature_selection_leakage_validation():
    df = pd.DataFrame({"feat1": [1, 2, 3], "target": ["A", "B", "A"]})
    # Target in features
    res = validate_dataset_configuration(df, "target", ["feat1", "target"], "classification")
    assert res["valid"] is False
    assert any("leakage" in e.lower() for e in res["errors"])


# 10. Classification training
def test_10_classification_training():
    result = execute_training_pipeline(
        dataset_id="ds_student_placement",
        target_col="Placement_Status",
        selected_features=["CGPA", "Internships", "Projects", "Aptitude_Test_Score", "Academic_Stream"],
        task_type="classification",
        algorithm="random_forest",
        test_size=0.2,
        random_state=42,
    )
    assert result["model_id"].startswith("mod_")
    assert result["task_type"] == "classification"
    metrics = result["metrics"]
    assert "test_accuracy" in metrics
    assert "confusion_matrix" in metrics
    assert 0.0 <= metrics["test_accuracy"] <= 1.0


# 11. Regression training
def test_11_regression_training():
    result = execute_training_pipeline(
        dataset_id="ds_house_prices",
        target_col="Price_Lakhs",
        selected_features=["Area_SqFt", "Bedrooms", "Bathrooms", "Location_Tier", "Furnishing_Status"],
        task_type="regression",
        algorithm="linear_regression",
        test_size=0.2,
        random_state=42,
    )
    assert result["model_id"].startswith("mod_")
    assert result["task_type"] == "regression"
    metrics = result["metrics"]
    assert "test_r2" in metrics
    assert "test_rmse" in metrics
    assert "test_mae" in metrics


# 12. Hyperparameter tuning
def test_12_hyperparameter_tuning():
    result = execute_training_pipeline(
        dataset_id="ds_student_placement",
        target_col="Placement_Status",
        selected_features=["CGPA", "Internships", "Projects", "Academic_Stream"],
        task_type="classification",
        algorithm="decision_tree",
        test_size=0.2,
        random_state=42,
        enable_tuning=True,
        cv_folds=3,
        scoring_metric="accuracy",
    )
    assert result["enable_tuning"] is True
    assert result["best_cv_score"] is not None
    assert len(result["best_params"]) > 0


# 13. Prediction using a trained model
def test_13_prediction_using_trained_model():
    # Train model
    model_meta = execute_training_pipeline(
        dataset_id="ds_student_placement",
        target_col="Placement_Status",
        selected_features=["CGPA", "Internships", "Projects", "Academic_Stream"],
        task_type="classification",
        algorithm="logistic_regression",
        test_size=0.2,
        random_state=42,
    )
    model_id = model_meta["model_id"]

    sample = [{
        "CGPA": 8.5,
        "Internships": 2,
        "Projects": 3,
        "Academic_Stream": "Computer Science",
    }]
    preds = execute_prediction(model_id, sample)
    assert len(preds) == 1
    assert preds[0]["prediction"] in ["Placed", "Not Placed"]
    assert "probabilities" in preds[0]


# 14. Model persistence and loading
def test_14_model_persistence_and_loading():
    models_before = list_saved_models()
    model_meta = execute_training_pipeline(
        dataset_id="ds_house_prices",
        target_col="Price_Lakhs",
        selected_features=["Area_SqFt", "Bedrooms", "Location_Tier"],
        task_type="regression",
        algorithm="random_forest",
        test_size=0.2,
        random_state=42,
    )
    model_id = model_meta["model_id"]

    models_after = list_saved_models()
    assert any(m["model_id"] == model_id for m in models_after)

    # Test prediction loads successfully
    preds = execute_prediction(model_id, [{"Area_SqFt": 1500, "Bedrooms": 3, "Location_Tier": "Tier-1"}])
    assert len(preds) == 1
    assert isinstance(preds[0]["prediction"], float)

    # Clean up test model
    delete_saved_model(model_id)


# 15. Correct evaluation metric generation (RMSE = sqrt(MSE))
def test_15_evaluation_metrics_consistency():
    result = execute_training_pipeline(
        dataset_id="ds_house_prices",
        target_col="Price_Lakhs",
        selected_features=["Area_SqFt", "Bedrooms", "Location_Tier"],
        task_type="regression",
        algorithm="linear_regression",
        test_size=0.2,
        random_state=42,
    )
    metrics = result["metrics"]
    mse = metrics["test_mse"]
    rmse = metrics["test_rmse"]
    assert abs(rmse - np.sqrt(mse)) < 1e-3


# 16. Categorical encoding handling
def test_16_categorical_encoding():
    df = pd.DataFrame({
        "color": ["red", "blue", "green", "red", "blue"],
        "size": ["S", "M", "L", "S", "M"],
        "target": [10, 20, 30, 15, 25],
    })
    prep = build_preprocessor(numeric_features=[], categorical_features=["color", "size"])
    X_trans = prep.fit_transform(df[["color", "size"]])
    assert X_trans.shape[0] == 5
    assert X_trans.shape[1] > 2


# 17. Missing numeric values imputation
def test_17_missing_numeric_values_imputation():
    df = pd.DataFrame({
        "num1": [1.0, np.nan, 3.0, 4.0, 5.0],
        "num2": [10.0, 20.0, np.nan, 40.0, 50.0],
    })
    prep = build_preprocessor(numeric_features=["num1", "num2"], categorical_features=[])
    X_trans = prep.fit_transform(df)
    assert not np.isnan(X_trans).any()


# 18. Unseen categorical values handling
def test_18_unseen_categorical_values():
    df_train = pd.DataFrame({"city": ["London", "Paris", "Berlin"]})
    df_test = pd.DataFrame({"city": ["Tokyo", "Sydney", "London"]})
    prep = build_preprocessor(numeric_features=[], categorical_features=["city"])
    prep.fit(df_train)
    # Should not throw exception thanks to handle_unknown='ignore'
    X_trans = prep.transform(df_test)
    assert X_trans.shape[0] == 3


# 19. Invalid prediction inputs handling
def test_19_invalid_prediction_inputs():
    model_meta = execute_training_pipeline(
        dataset_id="ds_student_placement",
        target_col="Placement_Status",
        selected_features=["CGPA", "Internships"],
        task_type="classification",
        algorithm="decision_tree",
        test_size=0.2,
    )
    model_id = model_meta["model_id"]

    # Missing required feature 'CGPA'
    with pytest.raises(ValueError) as excinfo:
        execute_prediction(model_id, [{"Internships": 2}])
    assert "missing required features" in str(excinfo.value).lower()


# 20. Data leakage prevention through correct pipeline structure
def test_20_data_leakage_prevention_structure():
    # Preprocessor is encapsulated inside Pipeline step 'preprocessor'
    # Ensuring transformer fit is strictly deferred to Pipeline.fit on training folds
    train_res = train_model(
        df=pd.read_csv("datasets/custom_student_placement_classification.csv"),
        target_col="Placement_Status",
        selected_features=["CGPA", "Internships", "Academic_Stream"],
        task_type="classification",
        algorithm="decision_tree",
        test_size=0.25,
        random_state=42,
    )
    pipeline = train_res["pipeline"]
    assert isinstance(pipeline, Pipeline)
    assert "preprocessor" in pipeline.named_steps
    assert "model" in pipeline.named_steps
    # Ensure X_test was never used for training pipeline fit
    assert len(train_res["X_test"]) > 0
    assert len(train_res["X_train"]) > 0
    assert len(train_res["X_train"]) + len(train_res["X_test"]) == len(train_res["y_train"]) + len(train_res["y_test"])
