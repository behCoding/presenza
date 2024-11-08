from fastapi import FastAPI, Query

from backend.auth import get_password_hash, authenticate_user, \
    create_access_token, delete_user_from_db, get_current_user, update_user_db, get_all_users
from backend.config import ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from models import User
from datetime import datetime, timedelta
from typing import List
from models import DailyPresence
from serialization import  UserCreate, Token, UserUpdate, DailyPresenceBase, HoursDefaultBase
from CRUD import get_daily_presences, get_user_default_hours, create_default_hours

app = FastAPI()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

origins = [
    "http://localhost:3000",  # React frontend
    "http://localhost:8000",  # Backend (optional)
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/register", response_model=UserCreate)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.work_email == user.work_email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="A user with this email is already registered in the system")
    hashed_password = get_password_hash(user.password)
    new_user = User(name=str.lower(user.name), surname=str.lower(user.surname), job_start_date=user.job_start_date,
                    full_time=user.full_time, phone_number=str(user.phone_number), personal_email=str.lower(user.personal_email),
                    work_email=str.lower(user.work_email), password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.work_email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.id}


@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return delete_user_from_db(db=db, user_id=user_id)


@app.put("/users/{user_id}", response_model=UserUpdate)
async def update_user(user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return update_user_db(db=db, user=user)


@app.get("/users", response_model=List[UserUpdate])
async def fetch_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return get_all_users(db=db)


# Get Daily Presence records for a user in a specific month
@app.get("/employee-dashboard", response_model=List[DailyPresenceBase])
def get_daily_presence_records(user_id: int, year: int, month: int, db: Session = Depends(get_db)):
    daily_presences = get_daily_presences(db, user_id, year, month)
    if not daily_presences:
        raise HTTPException(status_code=404, detail="No records found for this month")
    return daily_presences


# Set default hours for a user
@app.post("/default-hours", response_model=HoursDefaultBase)
def set_default_hours(default_hours: HoursDefaultBase, db: Session = Depends(get_db)):
    return create_default_hours(db, default_hours)


@app.put("/default-hours", response_model=HoursDefaultBase)
def set_default_hours(default_hours: HoursDefaultBase, db: Session = Depends(get_db)):
    return create_default_hours(db, default_hours)


@app.get("/get-default-hours", response_model=HoursDefaultBase)
def get_default_hours(user_id: int = Query(...), db: Session = Depends(get_db)):
    return get_user_default_hours(db, user_id)


@app.post("/employee-dashboard", response_model=List[DailyPresenceBase])
def create_update_monthly_presence(
        presence_data: List[DailyPresenceBase],
        user_id: int = Query(..., description="User ID required"),
        db: Session = Depends(get_db)):

    response_data = []
    if not presence_data:
        raise HTTPException(status_code=422, detail="No records found for this month")

    for day_data in presence_data:
        existing_record = (
            db.query(DailyPresence)
            .filter(DailyPresence.employee_id == user_id, DailyPresence.date == day_data.date)
            .first()
        )

        if existing_record:
            # Update existing record
            existing_record.entry_time_morning = day_data.entry_time_morning
            existing_record.exit_time_morning = day_data.exit_time_morning
            existing_record.entry_time_afternoon = day_data.entry_time_afternoon
            existing_record.exit_time_afternoon = day_data.exit_time_afternoon
            existing_record.national_holiday = day_data.national_holiday
            existing_record.weekend = day_data.weekend
            existing_record.day_off = day_data.day_off
            existing_record.time_off = day_data.time_off
            existing_record.notes = day_data.notes
            response_data.append(existing_record)
        else:
            # Create a new record for the day
            new_record = DailyPresence(
                employee_id=user_id,
                date=day_data.date,
                entry_time_morning=day_data.entry_time_morning,
                exit_time_morning=day_data.exit_time_morning,
                entry_time_afternoon=day_data.entry_time_afternoon,
                exit_time_afternoon=day_data.exit_time_afternoon,
                national_holiday=day_data.national_holiday,
                weekend=day_data.weekend,
                day_off=day_data.day_off,
                time_off=day_data.time_off,
                extra_hours=day_data.extra_hours,
                notes=day_data.notes,
            )
            db.add(new_record)
            response_data.append(new_record)

    db.commit()
    # Refresh the data after commit for updated response
    for record in response_data:
        db.refresh(record)

    return response_data


@app.get("/daily-presence/{user_id}/{month}", response_model=List[DailyPresenceBase])
def get_daily_presence(user_id: int, month: str, db: Session = Depends(get_db)):
    try:
        # Parse the month string to a datetime object
        month_start = datetime.strptime(month, "%Y-%m")
        month_end = datetime(month_start.year, month_start.month + 1, 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use 'YYYY-MM'.")

    # Query for presence data within the specified month range
    presence_data = (
        db.query(DailyPresence)
        .filter(
            DailyPresence.employee_id == user_id,
            DailyPresence.date >= month_start,
            DailyPresence.date < month_end
        )
        .all()
    )

    return presence_data


def calculate_hours(morning_in, morning_out, afternoon_in, afternoon_out):
    total_hours = 0.0

    if morning_in and morning_out:
        morning_in_time = datetime.strptime(morning_in, "%H:%M").time()
        morning_out_time = datetime.strptime(morning_out, "%H:%M").time()
        total_hours += (datetime.combine(datetime.today(), morning_out_time) -
                        datetime.combine(datetime.today(), morning_in_time)).seconds / 3600

    if afternoon_in and afternoon_out:
        afternoon_in_time = datetime.strptime(afternoon_in, "%H:%M").time()
        afternoon_out_time = datetime.strptime(afternoon_out, "%H:%M").time()
        total_hours += (datetime.combine(datetime.today(), afternoon_out_time) -
                        datetime.combine(datetime.today(), afternoon_in_time)).seconds / 3600

    return total_hours


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
