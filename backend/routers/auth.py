from datetime import datetime, timedelta
from models.password_reset import PasswordResetOTP
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.otp import OTPVerification
from models.user import User
from schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    OTPVerificationResponse,
    ResendOTPRequest,
    ResetPasswordRequest,
    SignupRequest,
    UpdateProfileRequest,
    UserPublicResponse,
    VerifyOTPRequest,
    VerifyResetOTPRequest,
)
from utils.email_service import send_otp_email
from utils.otp import generate_otp_code, hash_otp, otp_expires_at, verify_otp
from utils.password_service import hash_password, verify_password
from utils.jwt_service import create_access_token
from utils.auth_dependency import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_ATTEMPT_LIMIT = 5
OTP_COOLDOWN_SECONDS = 60


@router.post(
    "/signup",
    response_model=UserPublicResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_verified=False,
    )

    try:
        db.add(user)
        db.flush()

        otp_code = generate_otp_code()

        otp_record = OTPVerification(
            user_id=user.id,
            otp_hash=hash_otp(otp_code),
            expires_at=otp_expires_at(),
            attempts=0,
        )

        db.add(otp_record)
        db.flush()

        send_otp_email(user.email, otp_code)

        db.commit()
        db.refresh(user)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user or send OTP. Please try again later.",
        ) from exc

    return user


@router.post(
    "/verify-otp",
    response_model=OTPVerificationResponse,
)
def verify_otp_endpoint(
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified",
        )

    otp_record = (
        db.query(OTPVerification)
        .filter(OTPVerification.user_id == user.id)
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active OTP found. Please request a new OTP.",
        )

    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="OTP has expired. Please request a new OTP.",
        )

    if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OTP attempts exceeded. Please request a new OTP.",
        )

    if not verify_otp(payload.otp, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()

        if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OTP attempts exceeded. Please request a new OTP.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP",
        )

    user.is_verified = True

    db.delete(otp_record)
    db.commit()

    return {"message": "OTP verified successfully"}


@router.post(
    "/resend-otp",
    response_model=OTPVerificationResponse,
)
def resend_otp(
    payload: ResendOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Resend OTP for signup/email verification.
    """

    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified",
        )

    recent_otp = (
        db.query(OTPVerification)
        .filter(OTPVerification.user_id == user.id)
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if recent_otp:
        cooldown_deadline = (
            recent_otp.created_at
            + timedelta(seconds=OTP_COOLDOWN_SECONDS)
        )

        if datetime.utcnow() < cooldown_deadline:
            remaining_seconds = int(
                (cooldown_deadline - datetime.utcnow()).total_seconds()
            ) + 1

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining_seconds} seconds before requesting a new OTP.",
            )

    try:
        new_otp_code = generate_otp_code()
        new_otp_hash = hash_otp(new_otp_code)

        # Remove previous OTP
        db.query(OTPVerification).filter(
            OTPVerification.user_id == user.id
        ).delete()

        new_otp = OTPVerification(
            user_id=user.id,
            otp_hash=new_otp_hash,
            expires_at=otp_expires_at(),
            attempts=0,
        )

        db.add(new_otp)
        db.flush()

        send_otp_email(user.email, new_otp_code)

        db.commit()

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please try again later.",
        ) from exc

    return {"message": "A new OTP has been sent to your email."}


@router.post(
    "/login",
    response_model=UserPublicResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    # Email does not exist
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have an account yet. Please create an account.",
        )

    # Email exists, but password is incorrect
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    try:
        # Remove any previous OTP
        db.query(OTPVerification).filter(
            OTPVerification.user_id == user.id
        ).delete()

        otp_code = generate_otp_code()

        otp_record = OTPVerification(
            user_id=user.id,
            otp_hash=hash_otp(otp_code),
            expires_at=otp_expires_at(),
            attempts=0,
        )

        db.add(otp_record)
        db.flush()

        send_otp_email(user.email, otp_code)

        db.commit()

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send OTP. Please try again later.",
        ) from exc

    return user

@router.post(
    "/forgot-password",
    response_model=OTPVerificationResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email.",
        )

    # Remove any previous password-reset OTP
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id
    ).delete()

    try:
        otp_code = generate_otp_code()

        reset_otp = PasswordResetOTP(
            user_id=user.id,
            otp_hash=hash_otp(otp_code),
            expires_at=otp_expires_at(),
            attempts=0,
        )

        db.add(reset_otp)
        db.flush()

        send_otp_email(user.email, otp_code)

        db.commit()

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send password reset OTP. Please try again later.",
        ) from exc

    return {
        "message": "A password reset OTP has been sent to your email."
    }

@router.post(
    "/verify-reset-otp",
    response_model=OTPVerificationResponse,
)
def verify_reset_otp(
    payload: VerifyResetOTPRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email.",
        )

    otp_record = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.user_id == user.id)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No password reset OTP found. Please request a new one.",
        )

    if otp_record.expires_at < datetime.utcnow():
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Password reset OTP has expired. Please request a new one.",
        )

    if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OTP attempts exceeded. Please request a new OTP.",
        )

    if not verify_otp(payload.otp, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()

        if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OTP attempts exceeded. Please request a new OTP.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP",
        )

    return {
        "message": "Password reset OTP verified successfully."
    }

@router.post(
    "/reset-password",
    response_model=OTPVerificationResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email.",
        )

    otp_record = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.user_id == user.id)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No password reset OTP found. Please request a new one.",
        )

    if otp_record.expires_at < datetime.utcnow():
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Password reset OTP has expired. Please request a new one.",
        )

    if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OTP attempts exceeded. Please request a new OTP.",
        )

    if not verify_otp(payload.otp, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()

        if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OTP attempts exceeded. Please request a new OTP.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP",
        )

    # Hash the new password before storing it
    user.password_hash = hash_password(payload.new_password)

    # OTP can no longer be reused
    db.delete(otp_record)

    db.commit()

    return {
        "message": "Password reset successfully. You can now sign in."
    }

@router.post(
    "/resend-login-otp",
    response_model=OTPVerificationResponse,
)
def resend_login_otp(
    payload: ResendOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Resend OTP for login verification.
    """

    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Login OTP is only available for verified users
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is not verified. Please verify your email first.",
        )

    recent_otp = (
        db.query(OTPVerification)
        .filter(OTPVerification.user_id == user.id)
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if recent_otp:
        cooldown_deadline = (
            recent_otp.created_at
            + timedelta(seconds=OTP_COOLDOWN_SECONDS)
        )

        if datetime.utcnow() < cooldown_deadline:
            remaining_seconds = int(
                (cooldown_deadline - datetime.utcnow()).total_seconds()
            ) + 1

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining_seconds} seconds before requesting a new OTP.",
            )

    try:
        new_otp_code = generate_otp_code()
        new_otp_hash = hash_otp(new_otp_code)

        # Remove previous OTP
        db.query(OTPVerification).filter(
            OTPVerification.user_id == user.id
        ).delete()

        new_otp = OTPVerification(
            user_id=user.id,
            otp_hash=new_otp_hash,
            expires_at=otp_expires_at(),
            attempts=0,
        )

        db.add(new_otp)
        db.flush()

        send_otp_email(user.email, new_otp_code)

        db.commit()

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send login OTP. Please try again later.",
        ) from exc

    return {"message": "A new login OTP has been sent to your email."}


@router.post(
    "/verify-login-otp",
    response_model=OTPVerificationResponse,
)
def verify_login_otp(
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Login OTP is only for an existing verified user
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is not verified. Please verify your email first.",
        )

    otp_record = (
        db.query(OTPVerification)
        .filter(OTPVerification.user_id == user.id)
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active login OTP found. Please login again.",
        )

    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="OTP has expired. Please login again.",
        )

    if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OTP attempts exceeded. Please login again.",
        )

    if not verify_otp(payload.otp, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()

        if otp_record.attempts >= OTP_ATTEMPT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OTP attempts exceeded. Please login again.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP",
        )

    # Login OTP successfully verified
    db.delete(otp_record)
    db.commit()

    access_token = create_access_token(user.id)

    return {
        "message": "Login OTP verified successfully",
        "access_token": access_token,
        "token_type": "bearer",
    }
  
@router.get(
    "/me",
    response_model=UserPublicResponse,
)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put(
    "/me",
    response_model=UserPublicResponse,
)
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name cannot be empty",
        )

    current_user.name = name

    db.commit()
    db.refresh(current_user)

    return current_user