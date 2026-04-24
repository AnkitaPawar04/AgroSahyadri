import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.farmer import Farmer

load_dotenv()
database_url = os.getenv("DATABASE_URL")
engine = create_engine(database_url)
Session = sessionmaker(bind=engine)
db = Session()

# Update the admin password
admin = db.query(Farmer).filter(Farmer.email == 'ankita.pawarr19@gmail.com').first()
if admin:
    admin.password_hash = '$2b$12$WmH9VePVP/KcgdRW3I7o8.EQtst3egfxgvFbR3od3Gp9DabIzafCK'
    db.commit()
    print(f"✓ Admin password updated successfully")
    print(f"  Email: {admin.email}")
    print(f"  Password: Ankita@1904")
else:
    print("✗ Admin user not found")

db.close()
