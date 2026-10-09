import os
import numpy as np
import pandas as pd

os.makedirs("datasets", exist_ok=True)

# 1. Student Placement Classification Dataset
np.random.seed(42)
n_students = 140

cgpa = np.round(np.random.uniform(5.5, 9.8, n_students), 2)
internships = np.random.choice([0, 1, 2, 3], size=n_students, p=[0.3, 0.4, 0.2, 0.1])
projects = np.random.choice([1, 2, 3, 4, 5], size=n_students, p=[0.2, 0.35, 0.25, 0.15, 0.05])
workshops = np.random.choice([0, 1, 2, 3, 4], size=n_students)
aptitude = np.random.randint(45, 98, size=n_students)
soft_skills = np.round(np.random.uniform(2.0, 5.0, n_students), 1)
extracurricular = np.random.choice(["Yes", "No"], size=n_students, p=[0.45, 0.55])
stream = np.random.choice(["Computer Science", "Information Technology", "Electronics", "Mechanical"], size=n_students)

# Placement status calculation with slight noise
score = (
    (cgpa - 5.5) * 12 +
    internships * 8 +
    projects * 5 +
    (aptitude - 45) * 0.4 +
    (soft_skills - 2.0) * 4 +
    (extracurricular == "Yes") * 5 +
    np.random.normal(0, 5, n_students)
)
placement_status = np.where(score > 48, "Placed", "Not Placed")

student_ids = [f"STU_{1000 + i}" for i in range(n_students)]

df_placement = pd.DataFrame({
    "Student_ID": student_ids,
    "CGPA": cgpa,
    "Internships": internships,
    "Projects": projects,
    "Workshops_Attended": workshops,
    "Aptitude_Test_Score": aptitude,
    "Soft_Skills_Rating": soft_skills,
    "Extracurricular_Activities": extracurricular,
    "Academic_Stream": stream,
    "Placement_Status": placement_status
})

# Introduce a few realistic missing values
df_placement.loc[5, "CGPA"] = np.nan
df_placement.loc[18, "Soft_Skills_Rating"] = np.nan
df_placement.loc[34, "Extracurricular_Activities"] = np.nan
df_placement.loc[52, "Aptitude_Test_Score"] = np.nan

# Introduce 3 duplicate rows
dup_rows = df_placement.iloc[[10, 25, 40]].copy()
df_placement = pd.concat([df_placement, dup_rows], ignore_index=True)

df_placement.to_csv("datasets/custom_student_placement_classification.csv", index=False)
print(f"Generated placement dataset: {len(df_placement)} rows, {len(df_placement.columns)} columns")

# 2. House Price Regression Dataset
n_houses = 135
area = np.random.randint(750, 4200, size=n_houses)
bedrooms = np.random.choice([1, 2, 3, 4, 5], size=n_houses, p=[0.1, 0.35, 0.35, 0.15, 0.05])
bathrooms = np.clip(np.random.choice([1, 2, 3, 4], size=n_houses, p=[0.25, 0.45, 0.2, 0.1]), 1, bedrooms)
tier = np.random.choice(["Tier-1", "Tier-2", "Tier-3"], size=n_houses, p=[0.4, 0.35, 0.25])
age = np.random.randint(0, 28, size=n_houses)
parking = np.random.choice(["Yes", "No"], size=n_houses, p=[0.7, 0.3])
furnishing = np.random.choice(["Unfurnished", "Semi-Furnished", "Furnished"], size=n_houses, p=[0.3, 0.45, 0.25])

tier_mult = {"Tier-1": 1.45, "Tier-2": 1.15, "Tier-3": 0.85}
furn_add = {"Unfurnished": 0, "Semi-Furnished": 4.5, "Furnished": 10.0}

price = []
for i in range(n_houses):
    base = (area[i] * 0.038) + (bedrooms[i] * 5.2) + (bathrooms[i] * 3.5)
    base = base * tier_mult[tier[i]]
    base -= (age[i] * 0.45)
    base += furn_add[furnishing[i]]
    if parking[i] == "Yes":
        base += 4.0
    base += np.random.normal(0, 4.0)
    price.append(max(round(base, 2), 15.0))

prop_ids = [f"PROP_{2000 + i}" for i in range(n_houses)]

df_houses = pd.DataFrame({
    "Property_ID": prop_ids,
    "Area_SqFt": area,
    "Bedrooms": bedrooms,
    "Bathrooms": bathrooms,
    "Location_Tier": tier,
    "Age_Years": age,
    "Has_Parking": parking,
    "Furnishing_Status": furnishing,
    "Price_Lakhs": price
})

# Introduce a few missing values
df_houses.loc[7, "Age_Years"] = np.nan
df_houses.loc[22, "Furnishing_Status"] = np.nan
df_houses.loc[45, "Area_SqFt"] = np.nan

# Introduce 2 duplicate rows
dup_houses = df_houses.iloc[[12, 30]].copy()
df_houses = pd.concat([df_houses, dup_houses], ignore_index=True)

df_houses.to_csv("datasets/custom_house_price_regression.csv", index=False)
print(f"Generated house price dataset: {len(df_houses)} rows, {len(df_houses.columns)} columns")
