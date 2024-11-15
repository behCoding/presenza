
from sqlalchemy.orm import Session
from models import DailyPresence, User, HoursDefault
from serialization import DailyPresenceBase, HoursDefaultBase


def get_user_by_username(db: Session, work_email: str):
    return db.query(User).filter(User.work_email == work_email).first()


# Get Daily Presences for a specific user and month
def get_daily_presences(db: Session, user_id: int, year: int, month: int):
    return db.query(DailyPresence).filter(
        DailyPresence.user_id == user_id,
        DailyPresence.date.year == year,
        DailyPresence.date.month == month).all()


# Create or update a daily presence record
def create_or_update_daily_presence(db: Session, user_id: int, daily_presence_data: DailyPresenceBase):
    presence_record = db.query(DailyPresence).filter(
        DailyPresence.user_id == user_id,
        DailyPresence.date == daily_presence_data.date
    ).first()

    if presence_record:
        # Update existing record
        for key, value in daily_presence_data.dict().items():
            setattr(presence_record, key, value)
    else:
        # Create new record
        presence_record = DailyPresence(user_id=user_id, **daily_presence_data.dict())
        db.add(presence_record)

    db.commit()
    db.refresh(presence_record)
    return presence_record


# Get or create default hours for a user
def create_default_hours(db: Session, defaults: HoursDefaultBase):
    default_hours = db.query(HoursDefault).filter(HoursDefault.user_id == defaults.user_id).first()

    if not default_hours:
        default_hours = HoursDefault(**defaults.dict())
        db.add(default_hours)

    else:
        default_hours.entry_time_morning = defaults.entry_time_morning
        default_hours.exit_time_morning = defaults.exit_time_morning
        default_hours.entry_time_afternoon = defaults.entry_time_afternoon
        default_hours.exit_time_afternoon = defaults.exit_time_afternoon

    db.commit()
    db.refresh(default_hours)
    return default_hours


def get_user_default_hours(db: Session, user_id: int):
    default_hours = db.query(HoursDefault).filter(HoursDefault.user_id == user_id).first()

    return default_hours


def get_user_by_id(db: Session, user_id: int):
    employee = db.query(User).filter(User.id == user_id).first()
    return employee

