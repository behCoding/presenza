import copy
from fastapi import Body, FastAPI, Query, Path, BackgroundTasks, Response, Form
from pydantic import EmailStr
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import request_validation_exception_handler

from auth import get_password_hash, authenticate_user, \
    create_access_token, delete_user_from_db, get_current_user, update_user_db, get_all_users, get_all_employees, generate_otp, send_otp_email
from config import ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from models import User, NationalHolidays, AdminModifiedPresence
from datetime import datetime, timedelta, time
from typing import List
from models import DailyPresence
from serialization import UserCreate, Token, UserUpdate, DailyPresenceBase, HoursDefaultBase, UserBase, UserBaseID, \
    EmailRequest, EmailRequestPerUser, ModifiedDailyPresenceBase, PasswordChangeRequest, EmailOTPRequest, OTPVerifyRequest
from CRUD import get_daily_presences, get_user_default_hours, create_default_hours, get_user_by_id, get_hour_minute, \
    has_submitted_presence, send_email_to_employee, calculate_hours_per_day, create_excel_original, create_excel_modified


app = FastAPI()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
otp_storage = {} #Consider using database if needed

origins = [
    "http://localhost:3000",  # React frontend
    "http://localhost:8000",  # Backend 
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


@app.delete("/users/delete/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_deleted = delete_user_from_db(db=db, user_id=user_id)
    if not user_deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User with ID {user_id} has been successfully deleted."}


@app.put("/users/update/{user_id}", response_model=UserUpdate)
async def update_user(user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated_user = update_user_db(db=db, user=user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@app.put("/users/change-password")
async def change_password(request: PasswordChangeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.work_email == request.work_email).first()
    if not user:
        raise HTTPException(status_code=200, detail="User with this email does not exist")

    user.password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@app.get("/users", response_model=List[UserBaseID])
async def fetch_employees(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_users = get_all_employees(db=db)
    return db_users


@app.get("/users/{employeeId}", response_model=UserBase)
async def fetch_user(db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user),
                     employeeId: int = Path(..., description="ID of the employee to retrieve")):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return get_user_by_id(db=db, user_id=employeeId)


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
    hours_data = create_default_hours(db, default_hours)
    if hours_data is None:
        raise HTTPException(status_code=404, detail="Data not found-post")
    return hours_data


@app.put("/default-hours", response_model=HoursDefaultBase)
def set_default_hours(default_hours: HoursDefaultBase, db: Session = Depends(get_db)):
    hours_data = create_default_hours(db, default_hours)
    if hours_data is None:
        raise HTTPException(status_code=200, detail="Data not found-put")
    return hours_data


@app.get("/get-default-hours", response_model=HoursDefaultBase)
def get_default_hours(user_id: int = Query(...), submitted_by_id: int = Query(...), db: Session = Depends(get_db)):
    hours_data = get_user_default_hours(db, user_id, submitted_by_id)
    if hours_data is None:
        raise HTTPException(status_code=200, detail="Data not found-get")
    return hours_data


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

        admin_existing_record = (
            db.query(AdminModifiedPresence)
            .filter(AdminModifiedPresence.employee_id == user_id, AdminModifiedPresence.date == day_data.date)
            .first()
        )

        if day_data.day_off or day_data.national_holiday:
            day_data.entry_time_morning = time(0, 0)
            day_data.exit_time_morning = time(0, 0)
            day_data.entry_time_afternoon = time(0, 0)
            day_data.exit_time_afternoon = time(0, 0)

        if existing_record:
            existing_record.entry_time_morning = day_data.entry_time_morning
            existing_record.exit_time_morning = day_data.exit_time_morning
            existing_record.entry_time_afternoon = day_data.entry_time_afternoon
            existing_record.exit_time_afternoon = day_data.exit_time_afternoon
            existing_record.national_holiday = day_data.national_holiday
            existing_record.weekend = day_data.weekend
            existing_record.day_off = day_data.day_off
            existing_record.time_off = day_data.time_off
            existing_record.extra_hours = day_data.extra_hours
            existing_record.illness = day_data.illness
            existing_record.notes = day_data.notes

            if admin_existing_record:
                admin_existing_record.modified_entry_time_morning = day_data.entry_time_morning
                admin_existing_record.modified_exit_time_morning = day_data.exit_time_morning
                admin_existing_record.modified_entry_time_afternoon = day_data.entry_time_afternoon
                admin_existing_record.modified_exit_time_afternoon = day_data.exit_time_afternoon
                admin_existing_record.modified_national_holiday = day_data.national_holiday
                admin_existing_record.modified_weekend = day_data.weekend
                admin_existing_record.modified_day_off = day_data.day_off
                admin_existing_record.modified_time_off = day_data.time_off
                admin_existing_record.modified_extra_hours = day_data.extra_hours
                admin_existing_record.modified_illness = day_data.illness
                admin_existing_record.modified_notes = day_data.notes
            else:
                new_admin_record = AdminModifiedPresence(
                    employee_id=user_id,
                    original_presence_id=existing_record.id,
                    date=day_data.date,
                    modified_entry_time_morning=day_data.entry_time_morning,
                    modified_exit_time_morning=day_data.exit_time_morning,
                    modified_entry_time_afternoon=day_data.entry_time_afternoon,
                    modified_exit_time_afternoon=day_data.exit_time_afternoon,
                    modified_national_holiday=day_data.national_holiday,
                    modified_weekend=day_data.weekend,
                    modified_day_off=day_data.day_off,
                    modified_time_off=day_data.time_off,
                    modified_extra_hours=day_data.extra_hours,
                    modified_illness=day_data.illness,
                    modified_notes=day_data.notes,
                )
                db.add(new_admin_record)
            response_data.append(existing_record)
        else:
            new_employee_record = DailyPresence(
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
                illness=day_data.illness,
                notes=day_data.notes,
            )
            db.add(new_employee_record)
            db.commit()
            db.refresh(new_employee_record)

            new_admin_record = AdminModifiedPresence(
                employee_id=user_id,
                original_presence_id=new_employee_record.id,
                date=day_data.date,
                modified_entry_time_morning=day_data.entry_time_morning,
                modified_exit_time_morning=day_data.exit_time_morning,
                modified_entry_time_afternoon=day_data.entry_time_afternoon,
                modified_exit_time_afternoon=day_data.exit_time_afternoon,
                modified_national_holiday=day_data.national_holiday,
                modified_weekend=day_data.weekend,
                modified_day_off=day_data.day_off,
                modified_time_off=day_data.time_off,
                modified_extra_hours=day_data.extra_hours,
                modified_illness=day_data.illness,
                modified_notes=day_data.notes,
            )
            db.add(new_admin_record)
            db.commit()
            response_data.append(new_employee_record)

    db.commit()

    for record in response_data:
        db.refresh(record)

    return response_data


@app.post("/submit-admin-presence", response_model=List[DailyPresenceBase])
def update_monthly_presence(
        presence_data: List[DailyPresenceBase],
        user_id: int = Query(..., description="User ID required"),
        db: Session = Depends(get_db)):

    updated_records = []
    if not presence_data:
        raise HTTPException(status_code=422, detail="No records found for this month")

    for day_data in presence_data:
        admin_existing_record = (
            db.query(AdminModifiedPresence)
            .filter(AdminModifiedPresence.employee_id == user_id, AdminModifiedPresence.date == day_data.date)
            .first()
        )

        if day_data.day_off or day_data.national_holiday:
            day_data.entry_time_morning = time(0, 0)
            day_data.exit_time_morning = time(0, 0)
            day_data.entry_time_afternoon = time(0, 0)
            day_data.exit_time_afternoon = time(0, 0)

        if admin_existing_record:
            admin_existing_record.modified_entry_time_morning = day_data.entry_time_morning
            admin_existing_record.modified_exit_time_morning = day_data.exit_time_morning
            admin_existing_record.modified_entry_time_afternoon = day_data.entry_time_afternoon
            admin_existing_record.modified_exit_time_afternoon = day_data.exit_time_afternoon
            admin_existing_record.modified_national_holiday = day_data.national_holiday
            admin_existing_record.modified_weekend = day_data.weekend
            admin_existing_record.modified_day_off = day_data.day_off
            admin_existing_record.modified_time_off = day_data.time_off
            admin_existing_record.modified_illness = day_data.illness
            admin_existing_record.modified_notes = day_data.notes
        updated_records.append(admin_existing_record)
        
        if not admin_existing_record :
            raise HTTPException(status_code=200, detail="Data is not present in the system for current month")

    db.commit()
    for record in updated_records:
        db.refresh(record)

    response_data = [
    DailyPresenceBase(
        employee_id=record.employee_id,
        date=record.date,
        entry_time_morning=record.modified_entry_time_morning,
        exit_time_morning=record.modified_exit_time_morning,
        entry_time_afternoon=record.modified_entry_time_afternoon,
        exit_time_afternoon=record.modified_exit_time_afternoon,
        national_holiday=record.modified_national_holiday,
        weekend=record.modified_weekend,
        day_off=record.modified_day_off,
        time_off=record.modified_time_off,
        extra_hours=record.modified_extra_hours,
        illness=record.modified_illness,
        notes=record.modified_notes
    )
    for record in updated_records]    

    return response_data


@app.get("/employee-presence/{user_id}/{year}/{month}", response_model=List[DailyPresenceBase])
def get_daily_presence(user_id: int, month: str, year: str, db: Session = Depends(get_db)):
    try:
        # Parse the month string to a datetime object
        month_start = datetime.strptime(year+month, "%Y%m")
        if month_start.month == 12:
            month_end = datetime(month_start.year, month_start.month, 31)
            presence_data = (
            db.query(DailyPresence)
            .filter(
                DailyPresence.employee_id == user_id,
                DailyPresence.date >= month_start,
                DailyPresence.date <= month_end
            )
            .all())
        else:    
            month_end = datetime(month_start.year, month_start.month + 1, 1)

            presence_data = (
            db.query(DailyPresence)
            .filter(
                DailyPresence.employee_id == user_id,
                DailyPresence.date >= month_start,
                DailyPresence.date < month_end
            )
            .all())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use 'YYYY-MM'.")



    return presence_data


@app.get("/admin-modified-presence/{user_id}/{year}/{month}", response_model=List[DailyPresenceBase])
def get_admin_modified_presence(user_id: int, month: str, year: str, db: Session = Depends(get_db)):
    try:
        month_start = datetime.strptime(year+month, "%Y%m")
        if month_start.month == 12:
            month_end = datetime(month_start.year, month_start.month, 31)
        else:    
            month_end = datetime(month_start.year, month_start.month + 1, 1)    
            

        db_records = (
        db.query(AdminModifiedPresence)
        .filter(
            AdminModifiedPresence.employee_id == user_id,
            AdminModifiedPresence.date >= month_start,
            AdminModifiedPresence.date < month_end
        )
        .all()
        )
        response_data = []
        for record in db_records:
            daily_presence = DailyPresenceBase(
                employee_id=record.employee_id,
                date=record.date,
                entry_time_morning=record.modified_entry_time_morning,
                exit_time_morning=record.modified_exit_time_morning,
                entry_time_afternoon=record.modified_entry_time_afternoon,
                exit_time_afternoon=record.modified_exit_time_afternoon,
                national_holiday=record.modified_national_holiday,
                weekend=record.modified_weekend,
                day_off=record.modified_day_off,
                time_off=record.modified_time_off,
                extra_hours=record.modified_extra_hours,
                illness=record.modified_illness,
                notes=record.modified_notes
            )
            response_data.append(daily_presence)

    except ValueError:
        raise HTTPException(status_code=200, detail="Invalid month format. Use 'YYYY-MM'.")

    return response_data


@app.get("/employee-total_presence/{user_id}/{year}/{month}", response_model=dict)
def get_employee_overview(user_id: int, month: str, year: str, db: Session = Depends(get_db)):
    try:
        # Parse the month string to a datetime object
        month_start = datetime.strptime(year+month, "%Y%m")
        if month_start.month == 12:
            month_end = datetime(month_start.year, month_start.month, 31)
            presence_data = (
            db.query(DailyPresence)
            .filter(
                DailyPresence.employee_id == user_id,
                DailyPresence.date >= month_start,
                DailyPresence.date <= month_end
            )
            .order_by(DailyPresence.date).all())
        else:    
            month_end = datetime(month_start.year, month_start.month + 1, 1)

            presence_data = (
            db.query(DailyPresence)
            .filter(
                DailyPresence.employee_id == user_id,
                DailyPresence.date >= month_start,
                DailyPresence.date < month_end
            )
            .order_by(DailyPresence.date).all())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use 'YYYY-MM'.")


    rawOverviewOfMonth = {'isSubmitted': False,
                          'notes': '',
                          'totalWorkedHoursInMonth': 0,
                          'totalExtraHoursInMonth': 0,
                          'totalOffHoursInMonth': 0,
                          'totalOffDaysInMonth': 0,
                          'totalExpectedWorkingHours': 0}

    extraHoursInDays = ''
    offHoursInDays = ''
    daysOffInDays = ''

    if presence_data:
        rawOverviewOfMonth['isSubmitted'] = True

        for day in presence_data:
            if not (day.national_holiday or day.weekend):
                rawOverviewOfMonth['totalExpectedWorkingHours'] += 8
                if not day.day_off:
                    workedHoursPerDay = calculate_hours_per_day(day.entry_time_morning,
                                                                day.exit_time_morning,
                                                                day.entry_time_afternoon,
                                                                day.exit_time_afternoon)
                    rawOverviewOfMonth['totalWorkedHoursInMonth'] += workedHoursPerDay
                else:
                    rawOverviewOfMonth['totalOffDaysInMonth'] += 1
                    daysOffInDays += f'{day.date.day}\n'
            if day.notes:
                rawOverviewOfMonth['notes'] += f'day={day.date.day} : {day.notes}\n'

            if day.extra_hours != time(0, 0):
                rawOverviewOfMonth['totalExtraHoursInMonth'] += (datetime.combine(datetime.today(), day.extra_hours)
                                                                 - datetime.combine(datetime.today(),
                                                                                    time(0, 0))).seconds / 3600
                extraHoursInDays += f'{day.date.day}\n'
            if day.time_off != time(0, 0):
                rawOverviewOfMonth['totalOffHoursInMonth'] += (datetime.combine(datetime.today(), day.time_off)
                                                               - datetime.combine(datetime.today(),
                                                                                  time(0, 0))).seconds / 3600
                offHoursInDays += f'{day.date.day}\n'

    overviewOfMonth = copy.deepcopy(rawOverviewOfMonth)
    totalWorkedHours, totalWorkedRemainedMinutes = get_hour_minute(rawOverviewOfMonth['totalWorkedHoursInMonth'])
    overviewOfMonth['totalWorkedHoursInMonth'] = f'{totalWorkedHours}:{totalWorkedRemainedMinutes}'

    extraHoursHour, extraHoursMinute = get_hour_minute(rawOverviewOfMonth['totalExtraHoursInMonth'])
    overviewOfMonth['totalExtraHoursInMonth'] = f'{extraHoursHour}:{extraHoursMinute} in days: {extraHoursInDays}'

    offHoursHour, offHoursMinute = get_hour_minute(rawOverviewOfMonth['totalOffHoursInMonth'])
    overviewOfMonth['totalOffHoursInMonth'] = f'{offHoursHour}:{offHoursMinute} in days: {offHoursInDays} '

    totalOffDaysInMonth = rawOverviewOfMonth['totalOffDaysInMonth']
    overviewOfMonth['totalOffDaysInMonth'] = f' {totalOffDaysInMonth} in days: {daysOffInDays}'

    return overviewOfMonth


@app.get("/retrieve_not_submitted_presence/{year}/{month}", response_model=List[UserBase])
def retrieve_not_submitted_presence(month: str,
                                    year: str,
                                    db: Session = Depends(get_db)):

    allEmployees = get_all_employees(db)

    missing_employees = []
    for employee in allEmployees:
        if not has_submitted_presence(employee.id, year=year, month=month, db=db):
            missing_employees.append(employee)

    return missing_employees


@app.get("/retrieve_submitted_presence/{year}/{month}", response_model=List[UserBase])
def retrieve_submitted_presence(month: str,
                                year: str,
                                db: Session = Depends(get_db)):

    allEmployees = get_all_employees(db)

    submitted_employees = []
    for employee in allEmployees:
        if has_submitted_presence(employee.id, year=year, month=month, db=db):
            submitted_employees.append(employee)

    return submitted_employees


@app.post("/send_email_to_missing", response_model=List[UserBase])
def send_email_to_missing(request: EmailRequest,
               background_tasks: BackgroundTasks,
               db: Session = Depends(get_db)):
    year, month = request.yearMonth.split("-")
    text = request.text

    allEmployees = get_all_employees(db)

    missing_employees = []
    for employee in allEmployees:
        if not has_submitted_presence(employee.id, year=year, month=month, db=db):
            missing_employees.append(employee)
    for employee in missing_employees:
        background_tasks.add_task(
            send_email_to_employee,
            receiver_email=employee.work_email,
            subject="Attendance Submission Reminder",
            body=text)

    return missing_employees


@app.post("/send_email_to_employee", response_model=UserBase)
def send_email_to_one(request: EmailRequestPerUser,
                      background_tasks: BackgroundTasks,
                      db: Session = Depends(get_db)):
    userID = request.user_id
    text = request.text
    employee = db.query(User).filter(User.id == userID).first()
    background_tasks.add_task(
        send_email_to_employee,
        receiver_email=employee.work_email,
        subject="Attendance Submission Reminder",
        body=text)

    return employee


@app.get("/get_national_holidays/{year}", response_model=List)
def get_national_holidays(year: int, db: Session = Depends(get_db)):
    year_start = datetime(year, 1,1)
    year_end = datetime(year,12, 31)

    national_holidays = (db.query(NationalHolidays).filter(
        NationalHolidays.date >= year_start,
        NationalHolidays.date<= year_end).all())

    return national_holidays


@app.post("/add_national_holiday")
def add_national_holiday(nationalHolidayDate: str= Body(..., embed=True), db: Session = Depends(get_db)):
        holiday_date = datetime.strptime(nationalHolidayDate, "%Y-%m-%d").date()
        existing_record = db.query(NationalHolidays).filter(NationalHolidays.date == holiday_date).first()

        if existing_record:
            raise HTTPException(status_code=200, detail="Date is already added")

        else:
            new_record = NationalHolidays(date=holiday_date)
            db.add(new_record)
            db.commit()
            db.refresh(new_record)

        return {'message': 'Added successfully'}


@app.delete("/remove_national_holiday/{nationalHolidayDate}")
def remove_national_holiday(nationalHolidayDate: str, db: Session = Depends(get_db)):
    existing_record = db.query(NationalHolidays).filter(NationalHolidays.date == nationalHolidayDate).first()

    if existing_record:
        db.delete(existing_record)
        db.commit()
        return {"message": "Removed successfully"}
    else:
        raise HTTPException(status_code=404, detail="Date is not present in the system")


@app.get("/export_original_presence_overview/{user_id}/{year}/{month}")
def export_presence_overview(user_id: int, year: str, month: str, db: Session = Depends(get_db)):
    overview = get_employee_overview(user_id, month, year, db)

    if month == '12':
            presence_data = (
        db.query(DailyPresence)
        .filter(DailyPresence.employee_id == user_id,
                DailyPresence.date >= datetime.strptime(year + month, "%Y%m"),
                DailyPresence.date <= datetime(int(year),int(month), 31))
        .order_by(DailyPresence.date).all())
    else:
        presence_data = (
            db.query(DailyPresence)
            .filter(DailyPresence.employee_id == user_id,
                    DailyPresence.date >= datetime.strptime(year + month, "%Y%m"),
                    DailyPresence.date < datetime(int(year),int(month) + 1, 1))
            .order_by(DailyPresence.date).all())
    employee = db.query(User).filter(User.id == user_id).first()

    excel_output = create_excel_original(presence_data, overview)

    headers = {
        'Content-Disposition': f'attachment; filename="presence_overview_{year}_{month}_{employee.name}_{employee.surname}.xlsx"'
    }
    return Response(content=excel_output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)


@app.get("/export_modified_presence_overview/{user_id}/{year}/{month}")
def export_presence_overview(user_id: int, year: str, month: str, db: Session = Depends(get_db)):
    if month == '12':
        presence_data = (
        db.query(AdminModifiedPresence)
        .filter(AdminModifiedPresence.employee_id == user_id,
                AdminModifiedPresence.date >= datetime.strptime(year + month, "%Y%m"),
                AdminModifiedPresence.date <= datetime(int(year),int(month) , 31))
        .order_by(AdminModifiedPresence.date).all())
    else:
        presence_data = (
            db.query(AdminModifiedPresence)
            .filter(AdminModifiedPresence.employee_id == user_id,
                    AdminModifiedPresence.date >= datetime.strptime(year + month, "%Y%m"),
                    AdminModifiedPresence.date < datetime(int(year), int(month) + 1, 1))
            .order_by(AdminModifiedPresence.date).all())
    employee = db.query(User).filter(User.id == user_id).first()

    excel_output = create_excel_modified(presence_data, employee)

    headers = {
        'Content-Disposition': f'attachment; filename="presence_overview_{year}_{month}_{employee.name}_{employee.surname}.xlsx"'
    }
    return Response(content=excel_output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error: {exc}")
    return await request_validation_exception_handler(request, exc)


@app.post("/send_otp")
async def send_otp(request: EmailOTPRequest):
    email = request.email.strip().lower()
    if not email.endswith("@storelink.it"):
        raise HTTPException(status_code=400, detail="Only company emails are allowed")
    otp_code=generate_otp()
    otp_storage[email] = otp_code
    send_otp_email(email, otp_code) 

    return {"message": "OTP sent successfully"}   


@app.post("/verify_otp")
async def verify_otp(request: OTPVerifyRequest):

    email = request.email.strip().lower()
    otp = request.otp
    if otp_storage.get(email) == otp:
        del otp_storage[email]
        return {"message": "OTP verified successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
