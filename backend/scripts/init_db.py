from app import create_app
from models import db, StudentProfile, CompanyProfile
from flask_security import SQLAlchemyUserDatastore
from flask_security import hash_password

#this is independent of app.py, so first run this using "python -m scripts.init_db" from backend, then run app.py

#this script helps us to avoid manual deletaion/creation of database, like after when we have any change in database, 
# because it handels both deletition as well as creation. 
app = create_app()

with app.app_context():
    db.drop_all() #delete all files
    db.create_all() # create fresh tables
    datastore : SQLAlchemyUserDatastore = app.datastore
    admin_role = datastore.find_or_create_role("admin")
    company_role = datastore.find_or_create_role("company")
    student_role = datastore.find_or_create_role("student")

    if not datastore.find_user(email = "admin@institute.com"):
        datastore.create_user(
            email = "admin@institute.com",
            name = "Admin",
            password = hash_password("admin123")
        )

    if not datastore.find_user(email = "company@gmail"):
        datastore.create_user(
            email = "company@gmail",
            name = "company_01",
            password = hash_password("com123")
        )

    if not datastore.find_user(email = "student@gmail"):
        datastore.create_user(
            email = "student@gmail",
            name = "student_01",
            password = hash_password("stu123")
        )

    try:
        db.session.commit()
        print("Created successfully")
    except:
        db.session.rollback()
        print("Error in creating")

    admin = datastore.find_user(email="admin@institute.com")
    company_01 = datastore.find_user(email="company@gmail")
    student_01 = datastore.find_user(email="student@gmail")

    admin_role = datastore.find_role("admin")
    company_role = datastore.find_role("company")
    student_role = datastore.find_role("student")

    datastore.add_role_to_user(admin, admin_role)
    datastore.add_role_to_user(company_01, company_role)
    datastore.add_role_to_user(student_01, student_role)

    # Create profiles for company and student
    if not CompanyProfile.query.filter_by(user_id=company_01.id).first():
        cp = CompanyProfile(user_id=company_01.id, is_approved=True)
        db.session.add(cp)

    if not StudentProfile.query.filter_by(user_id=student_01.id).first():
        sp = StudentProfile(user_id=student_01.id, branch="CS", cgpa=8.0)
        db.session.add(sp)

    try:
        db.session.commit()
        print("Added roles and profiles")
    except:
        db.session.rollback()
        print("Error in adding roles/profiles")
