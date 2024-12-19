from datetime import time, date
from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    name: str
    surname: str
    job_start_date: date
    full_time: bool
    phone_number: str
    personal_email: str
    work_email: str
    role: str = "employee"

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
    phone_number: Optional[int]
    personal_email: Optional[str]
    work_email: Optional[str]
    password: Optional[str]
    role: Optional[str]
    id: int


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
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class HoursDefaultBase(BaseModel):
    user_id: int
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
    text: str

    class Config:
        orm_mode = True
