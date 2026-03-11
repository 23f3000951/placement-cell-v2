from extensions import db
from datetime import datetime, timezone
from flask_security import UserMixin, RoleMixin

roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)

# 1. Role Table
class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False) # 'admin', 'company', 'student'

# 2. User Table
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), index=True) # Search optimize karne ke liye
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone = True), default=lambda:datetime.now(timezone.utc))
    
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    active = db.Column(db.Boolean(), default=True)
    roles = db.relationship('Role', secondary="roles_users", backref='users')

    # Relationships for easy access
    student_profile = db.relationship('StudentProfile', backref='user', uselist=False)
    company_profile = db.relationship('CompanyProfile', backref='user', uselist=False)

# 3. Student Profile
class StudentProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True)
    cgpa = db.Column(db.Float)
    branch = db.Column(db.String(50))
    resume_file = db.Column(db.String(255), nullable=True)
    phone_number = db.Column(db.String(15), nullable=True) # Reminders ke liye
    created_at = db.Column(db.DateTime(timezone = True), default=lambda:datetime.now(timezone.utc))

# 4. Company Profile
class CompanyProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True)
    is_approved = db.Column(db.Boolean(), default=False)
    description = db.Column(db.Text, nullable=True)
    website = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    phone_number = db.Column(db.String(15), nullable=True)
    created_at = db.Column(db.DateTime(timezone = True), default=lambda:datetime.now(timezone.utc))

# 5. Placement Drive
class PlacementDrive(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(100), index=True)
    job_title = db.Column(db.String(100))
    job_description = db.Column(db.Text)
    eligibility = db.Column(db.String(200))
    salary = db.Column(db.Float)
    location = db.Column(db.String(100))
    min_cgpa = db.Column(db.Float) 
    status = db.Column(db.String(20), default='Pending') 
    deadline = db.Column(db.DateTime, nullable=False) 
    created_at = db.Column(db.DateTime(timezone = True), default=lambda:datetime.now(timezone.utc))

# 6. Application
class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    drive_id = db.Column(db.Integer, db.ForeignKey('placement_drive.id'))
    status = db.Column(db.String(20), default='Applied') 
    interview_date = db.Column(db.DateTime, nullable=True)
    applied_at = db.Column(db.DateTime(timezone = True), default=lambda:datetime.now(timezone.utc))
    
    # Relationships for Reports/CSV
    student = db.relationship('User', foreign_keys=[student_id])
    drive = db.relationship('PlacementDrive', backref='applications')

    # Corrected syntax for Unique Constraint
    __table_args__ = (db.UniqueConstraint('student_id', 'drive_id', name='_student_drive_uc'),)