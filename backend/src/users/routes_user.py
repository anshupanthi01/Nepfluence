from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query,BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from src.database import get_db  # CORRECT
from src.users import model_user, schema_user
from src.auth import (
    hash_password, 
    verify_password, 
    create_access_token,
    get_current_user,
    CurrentUser,
    hash_reset_token,
    generate_reset_token
)
from src.config import settings
from src.email_utils import send_password_reset_email
from sqlalchemy import delete as sql_delete
from datetime import timedelta,UTC,datetime

router = APIRouter()

# ============= REGISTER / CREATE USER =============
@router.post("/register", response_model=schema_user.UserPrivate, status_code=status.HTTP_201_CREATED)
async def register_user(
    user: schema_user.UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Check if username exists
    result = await db.execute(
        select(model_user.User).where(
            func.lower(model_user.User.username) == user.username.lower()
        )
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email exists
    result = await db.execute(
        select(model_user.User).where(
            func.lower(model_user.User.email) == user.email.lower()
        )
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    if user.phone_number:
        result = await db.execute(
            select(model_user.User).where(
                model_user.User.phone_number == user.phone_number
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already exists"
            )
    # Create new user
    new_user = model_user.User(
        username=user.username,
        email=user.email.lower(),
        password_hash=hash_password(user.password),
        phone_number=user.phone_number,
        country=user.country,
        role=user.role
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


# ============= LOGIN / TOKEN =============
@router.post("/login", response_model=schema_user.Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Find user by email
    result = await db.execute(
        select(model_user.User).where(
            func.lower(model_user.User.email) == form_data.username.lower()
        )
    )
    user = result.scalars().first()
    
    # Verify credentials
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return schema_user.Token(access_token=access_token, token_type="bearer")


# ============= GET CURRENT USER (ME) =============
@router.get("/me", response_model=schema_user.UserPrivate)
async def get_me(
    current_user: CurrentUser
):
    return current_user


# ============= GET ALL USERS (Public) =============
@router.get("/", response_model=List[schema_user.UserPublic])
async def get_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    result = await db.execute(
        select(model_user.User)
        .offset(skip)
        .limit(limit)
        .order_by(model_user.User.id)
    )
    users = result.scalars().all()
    return users


# ============= GET SINGLE USER (Public) =============
@router.get("/{user_id}", response_model=schema_user.UserPublic)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    result = await db.execute(
        select(model_user.User).where(model_user.User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


# ============= UPDATE USER (Protected) =============
@router.patch("/{user_id}", response_model=schema_user.UserPrivate)
async def update_user(
    user_id: int,
    user_update: schema_user.UserUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Check authorization (users can only update themselves)
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # Check if new username already exists
    if user_update.username and user_update.username.lower() != current_user.username.lower():
        result = await db.execute(
            select(model_user.User).where(
                func.lower(model_user.User.username) == user_update.username.lower()
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        current_user.username = user_update.username
    
    # Check if new email already exists
    if user_update.email and user_update.email.lower() != current_user.email.lower():
        result = await db.execute(
            select(model_user.User).where(
                func.lower(model_user.User.email) == user_update.email.lower()
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        current_user.email = user_update.email.lower()
    
    # Update optional fields
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
    if user_update.country is not None:
        current_user.country = user_update.country
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ============= DELETE USER (Protected) =============
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Check authorization
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user"
        )
    
    await db.delete(current_user)
    await db.commit()
    return None

@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(
    request_data: schema_user.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    result = await db.execute(
        select(model_user.User).where(
            func.lower(model_user.User.email) == request_data.email.lower(),
        )
    )
    user = result.scalars().first()
    
    if user:
        # Delete any existing reset tokens for this user
        await db.execute(
            sql_delete(model_user.PasswordResetToken).where(
                model_user.PasswordResetToken.user_id == user.id
            )
        )
        
        # Create new reset token
        token = generate_reset_token()
        token_hash = hash_reset_token(token)
        expires_at = datetime.now(UTC) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MIN
        )
        
        reset_token = model_user.PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token)
        await db.commit()
        
        # Send email in background
        background_tasks.add_task(
            send_password_reset_email,
            to_email=user.email,
            username=user.username,
            token=token
        )
    
    # Always return same message for security (don't reveal if email exists)
    return {
        "message": "If an account exists with this email, you will receive password reset instructions"
    }

# ============= RESET PASSWORD =============
@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request_data: schema_user.ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token_hash = hash_reset_token(request_data.token)
    
    result = await db.execute(
        select(model_user.PasswordResetToken).where(
            model_user.PasswordResetToken.token_hash == token_hash,
        ),
    )
    reset_token = result.scalars().first()
    
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    if reset_token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
        await db.delete(reset_token)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    result = await db.execute(
        select(model_user.User).where(model_user.User.id == reset_token.user_id),
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    # Update password
    user.password_hash = hash_password(request_data.new_password)
    
    # Delete all used reset tokens
    await db.execute(
        sql_delete(model_user.PasswordResetToken).where(
            model_user.PasswordResetToken.user_id == user.id,
        ),
    )
    
    await db.commit()
    return {
        "message": "Password reset successfully. You can now log in with your new password.",
    }

# ============= CHANGE PASSWORD (Authenticated) =============
@router.patch("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: schema_user.ChangePasswordRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.password_hash = hash_password(password_data.new_password)
    
    # Delete all reset tokens for this user after password change
    await db.execute(
        sql_delete(model_user.PasswordResetToken).where(
            model_user.PasswordResetToken.user_id == current_user.id
        )
    )
    
    await db.commit()
    return {
        "message": "Password changed successfully"
    }