#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Irrigation Model Training Script
Trains ML model for irrigation prediction using the irrigation_prediction.csv dataset
"""

import pandas as pd
import numpy as np
import pickle
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import warnings

warnings.filterwarnings('ignore')

# Set up paths
CURRENT_DIR = Path(__file__).parent
DATA_FILE = CURRENT_DIR / "irrigation_prediction.csv"
OUTPUT_DIR = CURRENT_DIR

print("=" * 70)
print("IRRIGATION PREDICTION MODEL TRAINING")
print("=" * 70)

# ============================================================================
# STEP 1: Load Data
# ============================================================================
print("\n[STEP 1] Loading Data...")

try:
    df = pd.read_csv(DATA_FILE)
    print(f"✓ Loaded irrigation data: {df.shape}")
    print(f"  Columns: {list(df.columns)}")
    print(f"\n Data preview:")
    print(df.head())
except FileNotFoundError as e:
    print(f"✗ Error: {e}")
    print(f"  Expected file: {DATA_FILE}")
    exit(1)

# ============================================================================
# STEP 2: Data Preparation & Feature Engineering
# ============================================================================
print("\n[STEP 2] Preparing Data...")

# Create a copy for processing
df_processed = df.copy()

print(f"  Original shape: {df_processed.shape}")
print(f"  Missing values:\n{df_processed.isnull().sum()}")

# Drop rows with missing target
if 'Irrigation_Need' in df_processed.columns:
    df_processed = df_processed.dropna(subset=['Irrigation_Need'])
else:
    print("✗ Error: 'Irrigation_Need' column not found!")
    print(f"  Available columns: {list(df_processed.columns)}")
    exit(1)

print(f"  After cleaning: {df_processed.shape}")
print(f"  Target distribution:\n{df_processed['Irrigation_Need'].value_counts()}")

# ============================================================================
# STEP 3: Feature Selection & Encoding
# ============================================================================
print("\n[STEP 3] Feature Selection & Encoding...")

# Define categorical columns explicitly (they must be encoded)
categorical_cols = [
    'Soil_Type', 'Crop_Type', 'Crop_Growth_Stage', 'Season',
    'Irrigation_Type', 'Water_Source', 'Mulching_Used', 'Region'
]

# Define numeric columns
numeric_cols = [
    'Soil_pH', 'Soil_Moisture', 'Organic_Carbon', 'Electrical_Conductivity',
    'Temperature_C', 'Humidity', 'Rainfall_mm', 'Sunlight_Hours',
    'Wind_Speed_kmh', 'Field_Area_hectare', 'Previous_Irrigation_mm'
]

print(f"  Categorical features: {categorical_cols}")
print(f"  Numeric features: {numeric_cols}")

# Select the most important features for irrigation prediction
# Priority order: Soil -> Water -> Weather -> Crop info
selected_features = categorical_cols + numeric_cols

print(f"  Selected {len(selected_features)} features for training")

# Create feature matrix
X = df_processed[selected_features].copy()
y = df_processed['Irrigation_Need'].copy()

print(f"  Feature matrix shape: {X.shape}")
print(f"  Target shape: {y.shape}")

# Initialize encoders dictionary
encoders = {}

# Encode categorical variables FIRST before model training
print("\n  Encoding categorical variables...")
for col in categorical_cols:
    if col in X.columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le
        print(f"    - {col}: {list(le.classes_)}")

print(f"\n  After encoding, feature matrix shape: {X.shape}")
print(f"  Data types:\n{X.dtypes}")

# Encode target variable
print("\n  Encoding target variable...")
target_encoder = LabelEncoder()
y_encoded = target_encoder.fit_transform(y)
print(f"    Classes: {list(target_encoder.classes_)}")

# Handle missing values in numeric columns
print("\n  Handling missing values...")
for col in numeric_cols:
    if col in X.columns and X[col].isnull().any():
        X[col] = X[col].fillna(X[col].mean())

print(f"  Final feature matrix shape: {X.shape}")
print(f"  Data types after cleaning:\n{X.dtypes}")

# ============================================================================
# STEP 4: Train-Test Split
# ============================================================================
print("\n[STEP 4] Splitting Data...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

print(f"  Training set: {X_train.shape}")
print(f"  Test set: {X_test.shape}")
print(f"  Train target distribution:\n{pd.Series(y_train).value_counts()}")

# ============================================================================
# STEP 5: Model Training
# ============================================================================
print("\n[STEP 5] Training Model...")

# Train Random Forest model (more robust with mixed features)
print("  Training RandomForestClassifier...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'
)

model.fit(X_train, y_train)
print("  ✓ Model trained successfully")

# ============================================================================
# STEP 6: Model Evaluation
# ============================================================================
print("\n[STEP 6] Evaluating Model...")

# Predictions
y_pred_train = model.predict(X_train)
y_pred_test = model.predict(X_test)

# Accuracy
train_accuracy = accuracy_score(y_train, y_pred_train)
test_accuracy = accuracy_score(y_test, y_pred_test)

print(f"  Training Accuracy: {train_accuracy:.4f}")
print(f"  Test Accuracy: {test_accuracy:.4f}")

print("\n  Classification Report (Test Set):")
print(classification_report(y_test, y_pred_test, target_names=target_encoder.classes_))

print("\n  Confusion Matrix (Test Set):")
print(confusion_matrix(y_test, y_pred_test))

# Feature importance
print("\n  Top 10 Important Features:")
feature_importance = pd.DataFrame({
    'feature': selected_features,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

for idx, row in feature_importance.head(10).iterrows():
    print(f"    {row['feature']}: {row['importance']:.4f}")

# ============================================================================
# STEP 7: Save Models
# ============================================================================
print("\n[STEP 7] Saving Models and Encoders...")

# Save model
model_file = OUTPUT_DIR / 'irrigation_model.pkl'
with open(model_file, 'wb') as f:
    pickle.dump(model, f, protocol=pickle.HIGHEST_PROTOCOL)
print(f"  ✓ Saved model to: {model_file}")

# Save feature encoders
encoders_file = OUTPUT_DIR / 'encoders.pkl'
with open(encoders_file, 'wb') as f:
    pickle.dump(encoders, f, protocol=pickle.HIGHEST_PROTOCOL)
print(f"  ✓ Saved encoders to: {encoders_file}")

# Save target encoder
target_encoder_file = OUTPUT_DIR / 'target_encoder.pkl'
with open(target_encoder_file, 'wb') as f:
    pickle.dump(target_encoder, f, protocol=pickle.HIGHEST_PROTOCOL)
print(f"  ✓ Saved target encoder to: {target_encoder_file}")

# Save feature names for inference
features_file = OUTPUT_DIR / 'irrigation_features.pkl'
with open(features_file, 'wb') as f:
    pickle.dump(selected_features, f, protocol=pickle.HIGHEST_PROTOCOL)
print(f"  ✓ Saved feature names to: {features_file}")

# ============================================================================
# STEP 8: Testing
# ============================================================================
print("\n[STEP 8] Testing Model with Sample Data...")

# Create a sample prediction
sample_data = X_test.iloc[0:5].copy()
sample_predictions = model.predict(sample_data)
sample_probabilities = model.predict_proba(sample_data)

print("\n  Sample Predictions:")
for i, (idx, row) in enumerate(sample_data.iterrows()):
    pred_class = target_encoder.inverse_transform([sample_predictions[i]])[0]
    confidence = sample_probabilities[i].max() * 100
    print(f"    Sample {i+1}: {pred_class} (Confidence: {confidence:.1f}%)")

print("\n" + "=" * 70)
print("✓ MODEL TRAINING COMPLETED SUCCESSFULLY!")
print("=" * 70)
print(f"\nFiles created:")
print(f"  1. {model_file.name} - Trained model")
print(f"  2. {encoders_file.name} - Feature encoders")
print(f"  3. {target_encoder_file.name} - Target encoder")
print(f"  4. {features_file.name} - Feature names")
print(f"\nModel ready for irrigation predictions!")
