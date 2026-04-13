#!/usr/bin/env python
"""
Script to clear all users and predictions from the database
"""
from app.database.config import SessionLocal
from app.models.farmer import Farmer, Prediction

def clear_database():
    db = SessionLocal()
    try:
        # Delete all predictions first (foreign key constraint)
        prediction_count = db.query(Prediction).delete()
        print(f"✅ Deleted {prediction_count} predictions")
        
        # Delete all farmers
        farmer_count = db.query(Farmer).delete()
        print(f"✅ Deleted {farmer_count} farmers/users")
        
        db.commit()
        print("\n✨ Database cleared successfully! You can now sign up as admin.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_database()
