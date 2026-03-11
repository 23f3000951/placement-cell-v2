from celery import Celery
from celery.schedules import crontab

celery = Celery('placement_cell')

# Redis as broker and backend
celery.conf.broker_url = 'redis://localhost:6379/0'
celery.conf.result_backend = 'redis://localhost:6379/1'
celery.conf.timezone = 'Asia/Kolkata'

# Celery Beat Schedule
celery.conf.beat_schedule = {
    # Daily reminder at 8:00 AM
    'daily-deadline-reminder': {
        'task': 'tasks.send_daily_reminders',
        'schedule': crontab(hour='8',minute='0'),
    },
    # Monthly report on 1st of each month at 9:00 AM
    'monthly-activity-report': {
        'task': 'tasks.send_monthly_report',
        'schedule': crontab(day_of_month='1', hour='9*', minute='0'),
    },
}
