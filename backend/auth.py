
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from database import get_db
from models import User
from serialization import TokenData, UserUpdate
from config import settings
from CRUD import get_user_by_username

# Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = 180

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=20)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, work_email: str, password: str):
    user = get_user_by_username(db, work_email)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(work_email=username)
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, work_email=token_data.work_email)
    if user is None:
        raise credentials_exception
    return user


def get_all_users(db: Session):
    db_users = db.query(User).all()

    return db_users


def get_all_employees(db: Session):
    db_users = db.query(User).filter(User.role == 'employee')

    return db_users


def update_user_db(db: Session, user: UserUpdate):
    db_user = db.query(User).filter(User.id == user.id).first()
    if db_user:
        update_data = user.dict(exclude_unset=True)
        for var, value in update_data.items():
            if value and var == "password":
                value = get_password_hash(value)
            setattr(db_user, var, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def delete_user_from_db(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user
