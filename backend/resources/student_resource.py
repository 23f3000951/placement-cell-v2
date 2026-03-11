import os
from flask import Blueprint, jsonify, request
from flask_security import auth_required, roles_required, current_user
from models import db, PlacementDrive, Application, User, StudentProfile, CompanyProfile
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from extensions import cache

student_bp = Blueprint("student", __name__, url_prefix="/api/student")

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'backend', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@student_bp.route("/dashboard", methods=["GET"])
@auth_required("token")
@roles_required("student")
def get_dashboard():
    search_q = request.args.get("q", "").strip()
    eligible_only = request.args.get("eligible", "").lower() == "true"
    
    query = PlacementDrive.query.filter_by(status="Approved")
    
    # Filter by eligibility (CGPA)
    if eligible_only:
        profile = StudentProfile.query.filter_by(user_id=current_user.id).first()
        student_cgpa = profile.cgpa if profile and profile.cgpa else 0.0
        query = query.filter(
            db.or_(PlacementDrive.min_cgpa == None, PlacementDrive.min_cgpa <= student_cgpa)
        )
    
    drives = query.all()
    result = []
    for d in drives:
        company_name = User.query.get(d.company_id).name
        # Filter by search query (title or company name)
        if search_q and search_q.lower() not in d.title.lower() and search_q.lower() not in company_name.lower():
            continue
        result.append({
            "id": d.id,
            "company_name": company_name,
            "title": d.title,
            "job_title": d.job_title,
            "min_cgpa": d.min_cgpa,
            "deadline": d.deadline.isoformat()
        })
    return jsonify(result), 200


@student_bp.route("/companies", methods=["GET"])
@auth_required("token")
@roles_required("student")
@cache.cached(timeout=60)
def get_companies():
    """List all approved companies"""
    profiles = CompanyProfile.query.filter_by(is_approved=True).all()
    result = []
    for p in profiles:
        user = p.user
        if user.active:
            result.append({
                "id": p.id,
                "user_id": user.id,
                "name": user.name,
            })
    return jsonify(result), 200


@student_bp.route("/companies/<int:company_user_id>", methods=["GET"])
@auth_required("token")
@roles_required("student")
def get_company_detail(company_user_id):
    """Get company info with its active drives"""
    user = User.query.get_or_404(company_user_id)
    profile = CompanyProfile.query.filter_by(user_id=user.id).first()
    drives = PlacementDrive.query.filter_by(company_id=user.id, status="Approved").all()
    drive_list = []
    for d in drives:
        drive_list.append({
            "id": d.id,
            "drive_name": d.title,
            "job_title": d.job_title or "",
            "status": d.status
        })
    return jsonify({
        "id": user.id,
        "name": user.name,
        "overview": profile.description if profile else "",
        "drives": drive_list
    }), 200


@student_bp.route("/drives/<int:drive_id>", methods=["GET"])
@auth_required("token")
@roles_required("student")
def get_drive_detail(drive_id):
    """Get single drive detail for student view"""
    drive = PlacementDrive.query.get_or_404(drive_id)
    company = User.query.get(drive.company_id)
    return jsonify({
        "id": drive.id,
        "drive_name": drive.title,
        "job_title": drive.job_title,
        "job_description": drive.job_description,
        "salary": drive.salary,
        "location": drive.location,
        "eligibility": drive.eligibility,
        "min_cgpa": drive.min_cgpa,
        "deadline": drive.deadline.isoformat(),
        "company_id": drive.company_id,
        "company_name": company.name if company else ""
    }), 200




@student_bp.route("/drives/<int:drive_id>/apply", methods=["POST"])
@auth_required("token")
@roles_required("student")
def apply_to_drive(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.status != "Approved":
        return jsonify({"message": "Drive is not active or approved."}), 400
    profile = StudentProfile.query.filter_by(user_id=current_user.id).first()
    if not profile or not profile.cgpa:
        return jsonify({"message": "Please complete your profile (CGPA needed) before applying."}), 400
    if drive.min_cgpa and profile.cgpa < drive.min_cgpa:
        return jsonify({"message": "You do not meet the minimum CGPA requirement for this drive."}), 400
    app_record = Application(student_id=current_user.id, drive_id=drive_id, status="Applied")
    db.session.add(app_record)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "You have already applied to this drive."}), 400
    return jsonify({"message": "Application successful."}), 201


@student_bp.route("/applications", methods=["GET"])
@auth_required("token")
@roles_required("student")
def get_applications():
    apps = Application.query.filter_by(student_id=current_user.id).all()
    result = []
    for a in apps:
        drive = PlacementDrive.query.get(a.drive_id)
        result.append({
            "id": a.id,
            "drive_title": drive.title,
            "company_name": User.query.get(drive.company_id).name,
            "status": a.status,
            "interview_date": a.interview_date.isoformat() if a.interview_date else None,
            "applied_at": a.applied_at.isoformat()
        })
    return jsonify(result), 200


@student_bp.route("/profile", methods=["GET", "PUT"])
@auth_required("token")
@roles_required("student")
def manage_profile():
    profile = StudentProfile.query.filter_by(user_id=current_user.id).first()
    if request.method == "GET":
        if not profile:
            return jsonify({"message": "Profile not created yet"}), 404
        return jsonify({
            "cgpa": profile.cgpa,
            "branch": profile.branch,
            "phone_number": profile.phone_number,
            "resume_file": profile.resume_file
        }), 200
    if request.method == "PUT":
        if not profile:
            profile = StudentProfile(user_id=current_user.id)
            db.session.add(profile)
        data = request.form
        if 'cgpa' in data:
            profile.cgpa = float(data['cgpa'])
        if 'branch' in data:
            profile.branch = data['branch']
        if 'phone_number' in data:
            profile.phone_number = data['phone_number']
        if 'resume' in request.files:
            file = request.files['resume']
            if file.filename != '':
                filename = secure_filename(f"{current_user.id}_{file.filename}")
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                profile.resume_file = filepath
        db.session.commit()
        return jsonify({"message": "Profile updated successfully."}), 200


@student_bp.route("/export_csv", methods=["POST"])
@auth_required("token")
@roles_required("student")
def trigger_csv_export():
    from tasks import export_csv
    task = export_csv.delay(current_user.id)
    return jsonify({"message": "Export job triggered! You will be notified when ready.", "task_id": task.id}), 200
