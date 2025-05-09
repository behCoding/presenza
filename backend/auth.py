
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer

from database import get_db
from models import User
from serialization import TokenData, UserUpdate
from config import settings
from CRUD import get_user_by_username, send_email_to_employee
import random
import smtplib
from email.mime.text import MIMEText
import os


# Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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
    db_users = db.query(User).filter(User.role == 'employee').all()

    return db_users


def update_user_db(db: Session, user: UserUpdate, background_tasks: BackgroundTasks):
    db_user = db.query(User).filter(User.id == user.id).first()
    if db_user:
        update_data = user.dict(exclude_unset=True)
        for var, value in update_data.items():
            if value and var == "password":
                value = get_password_hash(value)
            if value and var == "iban":
                        text = f"The IBAN of <b>{db_user.name}</b> <b>{db_user.surname}</b> has been changed. <br><br> The new IBAN is: <b>{value.upper()}</b>"
                        email_sender = os.getenv("SMTP_USERNAME")
                        background_tasks.add_task(send_email_to_employee,
                                                  receiver_email=email_sender,
                                                  subject="IBAN MODIFICATION",
                                                  body=text)
                        value = value.upper()
            if value and var == "name":
                value = value.capitalize() 
            if value and var == "surname":
                value = value.capitalize()                 
            setattr(db_user, var, value)
        db.commit()
        db.refresh(db_user)
    else:
        return None
    return db_user


def delete_user_from_db(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return False

    db.delete(db_user)
    db.commit()
    return True


def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(recipient_email: str, otp_code: str):
    smtp_server = "smtps.aruba.it"
    smtp_port = 587
    smtp_user_sender = os.getenv("SMTP_USERNAME")
    smtp_sender_password = os.getenv("SMTP_PASSWORD")

    subject = "Your one-time password (OTP)"
    body = f"Your OTP code is:\n\n{otp_code}\n\nThe code will expire in 5 minutes."
    msg = MIMEText(body)
    msg['subject'] = subject
    msg['from'] = os.getenv("SMTP_USERNAME")
    msg['to'] = recipient_email
    
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user_sender, smtp_sender_password)
            server.sendmail(smtp_user_sender, recipient_email, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=200, detail=f"Failed to send email: {str(e)}")        

