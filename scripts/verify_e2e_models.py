import json
from backend.services.dataset_service import seed_default_datasets, list_datasets
from backend.services.model_service import execute_training_pipeline, execute_prediction, list_saved_models

print("--- Step 1: Seeding datasets ---")
seed_default_datasets()
datasets = list_datasets()
print(f"Datasets available: {[d['name'] for d in datasets]}")

print("\n--- Step 2: Training Classification on Student Placement Dataset ---")
student_model = execute_training_pipeline(
    dataset_id="ds_student_placement",
    target_col="Placement_Status",
    selected_features=[
        "CGPA",
        "Internships",
        "Projects",
        "Workshops_Attended",
        "Aptitude_Test_Score",
        "Soft_Skills_Rating",
        "Extracurricular_Activities",
        "Academic_Stream",
    ],
    task_type="classification",
    algorithm="random_forest",
    test_size=0.2,
    random_state=42,
    enable_tuning=True,
    cv_folds=5,
    scoring_metric="f1_weighted",
)
print(f"Classification Model ID: {student_model['model_id']}")
print(f"Classification Test Accuracy: {student_model['metrics']['test_accuracy'] * 100:.2f}%")
print(f"Classification Test F1-Score: {student_model['metrics']['f1_weighted']:.4f}")
print(f"Classification Best CV Score: {student_model['best_cv_score']}")
print(f"Classification Best Parameters: {student_model['best_params']}")

pred_sample_student = [{
    "CGPA": 8.5,
    "Internships": 2,
    "Projects": 3,
    "Workshops_Attended": 2,
    "Aptitude_Test_Score": 85,
    "Soft_Skills_Rating": 4.5,
    "Extracurricular_Activities": "Yes",
    "Academic_Stream": "Computer Science",
}]
pred_res_student = execute_prediction(student_model["model_id"], pred_sample_student)
print(f"Sample Student Prediction: {pred_res_student[0]['prediction']}, Probabilities: {pred_res_student[0].get('probabilities')}")

print("\n--- Step 3: Training Regression on House Price Dataset ---")
house_model = execute_training_pipeline(
    dataset_id="ds_house_prices",
    target_col="Price_Lakhs",
    selected_features=[
        "Area_SqFt",
        "Bedrooms",
        "Bathrooms",
        "Location_Tier",
        "Age_Years",
        "Has_Parking",
        "Furnishing_Status",
    ],
    task_type="regression",
    algorithm="random_forest",
    test_size=0.2,
    random_state=42,
    enable_tuning=True,
    cv_folds=5,
    scoring_metric="r2",
)
print(f"Regression Model ID: {house_model['model_id']}")
print(f"Regression Test R²: {house_model['metrics']['test_r2']:.4f}")
print(f"Regression Test RMSE: {house_model['metrics']['test_rmse']:.4f}")
print(f"Regression Test MAE: {house_model['metrics']['test_mae']:.4f}")
print(f"Regression Best CV Score: {house_model['best_cv_score']}")
print(f"Regression Best Parameters: {house_model['best_params']}")

pred_sample_house = [{
    "Area_SqFt": 2200,
    "Bedrooms": 3,
    "Bathrooms": 3,
    "Location_Tier": "Tier-1",
    "Age_Years": 4,
    "Has_Parking": "Yes",
    "Furnishing_Status": "Furnished",
}]
pred_res_house = execute_prediction(house_model["model_id"], pred_sample_house)
print(f"Sample House Prediction: {pred_res_house[0]['prediction']} Lakhs")

print(f"\nTotal Saved Models in Registry: {len(list_saved_models())}")
print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
