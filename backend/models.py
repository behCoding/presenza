from sqlalchemy import Column, String, Integer, Date, Boolean, ForeignKey, Time, Text
from sqlalchemy.orm import relationship, declarative_base


Base = declarative_base()


# User Table
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    job_start_date = Column(Date, nullable=False)
    full_time = Column(Boolean, default=True)
    phone_number = Column(String, nullable=False)
    personal_email = Column(String, unique=True)
    work_email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    password = Column(String, nullable=False)  # Password hash

    # Relationships
    daily_presences = relationship('DailyPresence', back_populates='employee', cascade="all, delete-orphan")


# DailyPresence Table
class DailyPresence(Base):
    __tablename__ = 'daily_presence'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('users.id'))
    date = Column(Date, nullable=False)
    entry_time_morning = Column(Time, nullable=True)
    exit_time_morning = Column(Time, nullable=True)
    entry_time_afternoon = Column(Time, nullable=True)
    exit_time_afternoon = Column(Time, nullable=True)
    national_holiday = Column(Boolean, default=False)
    weekend = Column(Boolean, default=False)
    day_off = Column(Boolean, default=False)
    time_off = Column(Time, nullable=True)
    extra_hours = Column(Time, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    employee = relationship('User', back_populates='daily_presences')


class HoursDefault(Base):
    __tablename__ = 'hours_default'

    id = Column(Integer, primary_key=True, index=True)
    entry_time_morning = Column(Time, nullable=True)
    exit_time_morning = Column(Time, nullable=True)
    entry_time_afternoon = Column(Time, nullable=True)
    exit_time_afternoon = Column(Time, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship("User", back_populates="default_hours")


# Linking HoursDefault to User (if applicable)
User.default_hours = relationship("HoursDefault", uselist=False, back_populates="user")
