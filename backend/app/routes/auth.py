from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database.config import get_db
from ..models.farmer import Farmer
from ..utils.auth import hash_password, verify_password, create_access_token
from ..utils.otp import generate_otp, store_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["authentication"])

class SendOTPRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class LoginRequest(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[str] = None
    password: str

class RegisterRequest(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str

class OTPResponse(BaseModel):
    message: str
    phone_number: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    message: str

@router.post("/send-otp", response_model=OTPResponse)
async def send_otp(request: SendOTPRequest, db: Session = Depends(get_db)):
    """Send OTP to farmer's phone number"""
    phone_number = request.phone_number
    
    if not phone_number or len(phone_number) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    otp = generate_otp()
    store_otp(phone_number, otp)
    
    # Send OTP via Twilio SMS
    from ..utils.otp import send_sms_otp
    sms_sent = send_sms_otp(phone_number, otp)
    
    if not sms_sent:
        print(f"Warning: SMS failed, but OTP stored for {phone_number}")
    
    return {
        "message": f"OTP sent successfully to +91{phone_number}",
        "phone_number": phone_number
    }

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP and create/update farmer"""
    phone_number = request.phone_number
    otp = request.otp
    
    if not verify_otp(phone_number, otp):
        raise HTTPException(status_code=401, detail="Invalid OTP")
    
    # Check if farmer exists
    farmer = db.query(Farmer).filter(Farmer.phone_number == phone_number).first()
    
    if not farmer:
        # Create new farmer
        farmer = Farmer(
            phone_number=phone_number,
            first_name=request.first_name or "Farmer",
            last_name=request.last_name or "",
            name=f"{request.first_name or 'Farmer'} {request.last_name or ''}".strip(),
            is_verified=True
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)
    else:
        # Update existing farmer with name if provided
        if request.first_name:
            farmer.first_name = request.first_name
        if request.last_name:
            farmer.last_name = request.last_name
        # Update the name field
        farmer.name = f"{farmer.first_name or ''} {farmer.last_name or ''}".strip()
        farmer.is_verified = True
        db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(farmer.id), "phone": phone_number}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful"
    }

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone number or email and password"""
    farmer = None
    
    # Try email first (priority for admin)
    if request.email:
        farmer = db.query(Farmer).filter(Farmer.email == request.email).first()
    # Then try phone number
    elif request.phone_number:
        farmer = db.query(Farmer).filter(Farmer.phone_number == request.phone_number).first()
    
    if not farmer or not farmer.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, farmer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": str(farmer.id), "phone": request.phone_number}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful"
    }

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user with email and password"""
    
    # At least one of email or phone must be provided
    if not request.email and not request.phone_number:
        raise HTTPException(status_code=400, detail="Either email or phone number is required")
    
    # Check if email or phone already exists
    if request.email:
        existing = db.query(Farmer).filter(Farmer.email == request.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if request.phone_number:
        existing = db.query(Farmer).filter(Farmer.phone_number == request.phone_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create new farmer
    first_name = request.first_name or "User"
    last_name = request.last_name or ""
    full_name = f"{first_name} {last_name}".strip()
    
    farmer = Farmer(
        email=request.email,
        phone_number=request.phone_number,
        first_name=first_name,
        last_name=last_name,
        name=full_name,
        password_hash=hash_password(request.password),
        is_verified=True
    )
    
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(farmer.id), "email": request.email or request.phone_number}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Registration successful"
    }
