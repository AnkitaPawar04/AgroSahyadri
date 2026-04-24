#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Quick verification script for irrigation model setup
"""

import sys
from pathlib import Path

print("=" * 70)
print("🔍 IRRIGATION MODEL SETUP VERIFICATION")
print("=" * 70)

# Step 1: Check dataset
print("\n[STEP 1] Checking irrigation dataset...")
data_file = Path("ai/irrigation_prediction.csv")
if data_file.exists():
    import pandas as pd
    try:
        df = pd.read_csv(data_file)
        print(f"  ✓ Dataset found: {data_file}")
        print(f"    - Shape: {df.shape}")
        print(f"    - Columns: {list(df.columns)}")
        if 'Irrigation_Need' in df.columns:
            print(f"    - Target classes: {df['Irrigation_Need'].unique()}")
        else:
            print(f"    ⚠️  Warning: 'Irrigation_Need' column not found!")
    except Exception as e:
        print(f"  ✗ Error reading dataset: {e}")
        sys.exit(1)
else:
    print(f"  ✗ Dataset not found: {data_file}")
    sys.exit(1)

# Step 2: Check sklearn version
print("\n[STEP 2] Checking scikit-learn version...")
import sklearn
print(f"  sklearn version: {sklearn.__version__}")

# Step 3: Try to load existing models
print("\n[STEP 3] Checking existing model files...")
model_files = {
    'Model': Path('ai/irrigation_model.pkl'),
    'Encoders': Path('ai/encoders.pkl'),
    'Target Encoder': Path('ai/target_encoder.pkl'),
    'Features': Path('ai/irrigation_features.pkl'),
}

missing_files = []
for name, filepath in model_files.items():
    if filepath.exists():
        print(f"  ✓ {name}: {filepath}")
    else:
        print(f"  ✗ {name}: {filepath} (MISSING)")
        missing_files.append(name)

# Step 4: Recommendation
print("\n[STEP 4] Status & Next Steps...")
if missing_files:
    print(f"  ⚠️  Missing {len(missing_files)} file(s): {', '.join(missing_files)}")
    print("\n  🔧 QUICK FIX:")
    print("  1. Run training script:")
    print("     python ai/train_irrigation_model.py")
    print("\n  2. Wait for completion (should take 10-30 seconds)")
    print("\n  3. Restart backend:")
    print("     Ctrl+C (to stop)")
    print("     uvicorn app.main:app --reload")
    print("\n  4. Test in browser:")
    print("     http://localhost:5173/irrigation")
    sys.exit(1)
else:
    print("  ✓ All model files found!")
    print("\n  🧪 Testing model loading...")
    try:
        from backend.app.utils.irrigation_model import get_irrigation_model
        model = get_irrigation_model()
        print("  ✓ Model loaded successfully!")
        print(f"    - Model type: {type(model.model).__name__}")
        print(f"    - Encoders: {len(model.encoders) if model.encoders else 0}")
        print(f"    - Target classes: {list(model.target_encoder.classes_) if model.target_encoder else 'None'}")
        
        # Try a test prediction
        print("\n  🔮 Testing prediction...")
        test_input = {
            'soil_type': 'Loamy',
            'soil_ph': 6.5,
            'soil_moisture': 50,
            'organic_carbon': 0.5,
            'electrical_conductivity': 1.0,
            'rainfall_mm': 30,
            'previous_irrigation_mm': 25,
            'temperature_c': 28,
            'humidity': 65,
            'sunlight_hours': 8,
            'wind_speed_kmh': 5,
            'crop_type': 'Sugarcane',
            'crop_growth_stage': 'Vegetative',
            'season': 'Kharif',
            'field_area_hectare': 1,
            'mulching_used': 'No',
        }
        result = model.predict(test_input)
        print(f"  ✓ Prediction successful!")
        print(f"    - Prediction: {result['prediction']}")
        print(f"    - Confidence: {result['confidence']}%")
        
        print("\n" + "=" * 70)
        print("✅ ALL CHECKS PASSED! System is ready.")
        print("=" * 70)
        
    except Exception as e:
        print(f"  ✗ Error during model loading: {e}")
        print("\n  🔧 SOLUTION:")
        print("  Run: python ai/train_irrigation_model.py")
        sys.exit(1)
