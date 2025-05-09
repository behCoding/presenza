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
    iban = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    password = Column(String, nullable=False)  # Password hash

    # Relationships
    daily_presences = relationship('DailyPresence', back_populates='employee', cascade="all, delete-orphan")
    default_hours = relationship(
        "HoursDefault",
        foreign_keys="[HoursDefault.user_id]",  # Specify the foreign key for clarity
        back_populates="user",
        uselist=False  # Assuming one-to-one relationship
    )
    submitted_hours = relationship(
        "HoursDefault",
        foreign_keys="[HoursDefault.submitted_by_id]",  # Specify the foreign key for clarity
        back_populates="submitted_by",
        cascade="all, delete-orphan"
    )

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
    illness = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    employee = relationship('User', back_populates='daily_presences')
    admin_modification = relationship(
        'AdminModifiedPresence',
        back_populates='original_presence',
        uselist=False,  # Ensures one-to-one relationship
        cascade="all, delete-orphan"
    )

class HoursDefault(Base):
    __tablename__ = 'hours_default'

    id = Column(Integer, primary_key=True, index=True)
    entry_time_morning = Column(Time, nullable=True)
    exit_time_morning = Column(Time, nullable=True)
    entry_time_afternoon = Column(Time, nullable=True)
    exit_time_afternoon = Column(Time, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    submitted_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship("User", back_populates="default_hours")


    user = relationship(
        "User",
        foreign_keys=[user_id],  # Explicitly specify the foreign key for `user`
        back_populates="default_hours")
    submitted_by = relationship(
        "User",
        foreign_keys=[submitted_by_id],  # Explicitly specify the foreign key for `submitted_by`
        back_populates="submitted_hours")


class NationalHolidays(Base):
    __tablename__ = 'national_holidays'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)


class AdminModifiedPresence(Base):
    __tablename__ = 'admin_modified_presence'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('users.id'))
    original_presence_id = Column(Integer, ForeignKey('daily_presence.id'))
    date = Column(Date, nullable=False)
    modified_entry_time_morning = Column(Time, nullable=True)
    modified_exit_time_morning = Column(Time, nullable=True)
    modified_entry_time_afternoon = Column(Time, nullable=True)
    modified_exit_time_afternoon = Column(Time, nullable=True)
    modified_national_holiday = Column(Boolean, nullable=True)
    modified_weekend = Column(Boolean, nullable=True)
    modified_day_off = Column(Boolean, nullable=True)
    modified_time_off = Column(Time, nullable=True)
    modified_extra_hours = Column(Time, nullable=True)
    modified_illness = Column(String, nullable=True)
    modified_notes = Column(Text, nullable=True)

    # Relationships
    original_presence = relationship(
        'DailyPresence',
        back_populates='admin_modification',
        uselist=False  # Ensures one-to-one relationship
    )