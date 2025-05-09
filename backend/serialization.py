from datetime import time, date
from pydantic import BaseModel, EmailStr, validator
from typing import Optional


class UserBase(BaseModel):
    name: str
    surname: str
    job_start_date: date
    full_time: bool
    phone_number: str
    personal_email: str
    work_email: str
    is_active: Optional[bool] = True
    role: str = "employee"
    iban: str

    class Config:
        orm_mode = True


class UserCreate(UserBase):
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int


class TokenData(BaseModel):
    work_email: str


class UserUpdate(UserBase):
    name: Optional[str]
    surname: Optional[str]
    job_start_date: Optional[date]
    full_time: Optional[bool]
    phone_number: Optional[int]
    personal_email: Optional[str]
    work_email: Optional[str]
    password: Optional[str]
    role: Optional[str]
    iban: Optional[str]
    is_active: Optional[bool]
    id: int


class UserPresence(UserBase):
    name: Optional[str]
    surname: Optional[str]
    job_start_date: Optional[date]
    full_time: Optional[bool]
    phone_number: Optional[int]
    personal_email: Optional[str]
    work_email: Optional[str]
    role: Optional[str]
    iban: Optional[str]
    is_active: Optional[bool]
    id: Optional[int]

    
class PasswordChangeRequest(BaseModel):
    work_email: str
    new_password: str

class EmailOTPRequest(BaseModel):
    email: EmailStr    

    @validator("email", pre=True)
    def strip_and_lower_email(cls, v):
        return v.strip().lower()


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class DailyPresenceBase(BaseModel):
    employee_id: str
    date: date
    entry_time_morning: Optional[time] = None
    exit_time_morning: Optional[time] = None
    entry_time_afternoon: Optional[time] = None
    exit_time_afternoon: Optional[time] = None
    national_holiday: bool
    weekend: bool
    day_off: bool
    time_off: time
    extra_hours: time
    illness: str
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class ModifiedDailyPresenceBase(BaseModel):
    employee_id: str
    date: date
    modified_entry_time_morning: Optional[time] = None
    modified_exit_time_morning: Optional[time] = None
    modified_entry_time_afternoon: Optional[time] = None
    modified_exit_time_afternoon: Optional[time] = None
    modified_national_holiday: bool
    modified_weekend: bool
    modified_day_off: bool
    modified_time_off: time
    modified_extra_hours: time
    modified_illness: str
    modified_notes: Optional[str] = None

    class Config:
        orm_mode = True


class HoursDefaultBase(BaseModel):
    user_id: int
    submitted_by_id: int
    entry_time_morning: Optional[time] = None
    exit_time_morning: Optional[time] = None
    entry_time_afternoon: Optional[time] = None
    exit_time_afternoon: Optional[time] = None

    class Config:
        orm_mode = True


class UserBaseID(UserBase):
    id: int

    class Config:
        orm_mode = True


class EmailRequest(BaseModel):
    yearMonth: str
    textBody: str
    textSubject: str

    class Config:
        orm_mode = True


class EmailRequestAll(BaseModel):
    textBody: str
    textSubject: str

    class Config:
        orm_mode = True


class EmailRequestPerUser(BaseModel):
    user_id: int
    textBody: str
    textSubject: str

    class Config:
        orm_mode = True

