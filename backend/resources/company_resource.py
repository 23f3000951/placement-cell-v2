from flask import Blueprint, jsonify, request
from flask_security import auth_required, roles_required, current_user
from models import db, PlacementDrive, Application, CompanyProfile, User, StudentProfile
from datetime import datetime
from extensions import cache

company_bp = Blueprint("company", __name__, url_prefix="/api/company")


@company_bp.route("/dashboard", methods=["GET"])
@auth_required("token")
@roles_required("company")
def get_dashboard():
    profile = CompanyProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = CompanyProfile(user_id=current_user.id, is_approved=False)
        db.session.add(profile)
        db.session.commit()
    drives = PlacementDrive.query.filter_by(company_id=current_user.id).all()
    total_drives = len(drives)
    approved_drives = [d for d in drives if d.status == "Approved"]
    total_applicants = 0
    for d in drives:
        total_applicants += len(d.applications)
    return jsonify({
        "company_name": current_user.name,
        "is_approved": profile.is_approved,
        "total_drives_created": total_drives,
        "total_approved_drives": len(approved_drives),
        "total_applicants_received": total_applicants
    }), 200


@company_bp.route("/profile", methods=["GET", "PUT"])
@auth_required("token")
@roles_required("company")
def manage_profile():
    profile = CompanyProfile.query.filter_by(user_id=current_user.id).first()
    if request.method == "GET":
        if not profile:
            return jsonify({"message": "Profile not created yet"}), 404
        return jsonify({
            "name": current_user.name,
            "description": profile.description,
            "website": profile.website,
            "location": profile.location,
            "phone_number": profile.phone_number
        }), 200
    if request.method == "PUT":
        if not profile:
            profile = CompanyProfile(user_id=current_user.id)
            db.session.add(profile)
        data = request.get_json()
        if 'name' in data and data['name']:
            current_user.name = data['name']
        if 'description' in data:
            profile.description = data['description']
        if 'website' in data:
            profile.website = data['website']
        if 'location' in data:
            profile.location = data['location']
        if 'phone_number' in data:
            profile.phone_number = data['phone_number']
        db.session.commit()
        return jsonify({"message": "Profile updated successfully."}), 200


@company_bp.route("/drives", methods=["POST"])
@auth_required("token")
@roles_required("company")
def create_drive():
    profile = CompanyProfile.query.filter_by(user_id=current_user.id).first()
    if not profile or not profile.is_approved:
        return jsonify({"message": "Company not approved by admin. Cannot create drives."}), 403
    data = request.get_json()
    title = data.get("title")
    job_title = data.get("job_title", "")
    job_description = data.get("job_description", "")
    eligibility = data.get("eligibility", "")
    salary = data.get("salary")
    location = data.get("location", "")
    min_cgpa = data.get("min_cgpa")
    deadline_str = data.get("deadline")
    if not title or not deadline_str:
        return jsonify({"message": "Missing required fields (title, deadline)"}), 400
    try:
        deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
    except ValueError:
        return jsonify({"message": "Invalid deadline format. Use ISO format."}), 400
    new_drive = PlacementDrive(
        company_id=current_user.id,
        title=title,
        job_title=job_title,
        job_description=job_description,
        eligibility=eligibility,
        salary=float(salary) if salary else None,
        location=location,
        min_cgpa=float(min_cgpa) if min_cgpa else None,
        status="Pending",
        deadline=deadline
    )
    db.session.add(new_drive)
    db.session.commit()
    return jsonify({"message": "Placement drive created and pending approval", "id": new_drive.id}), 201


@company_bp.route("/drives", methods=["GET"])
@auth_required("token")
@roles_required("company")
def get_drives():
    drives = PlacementDrive.query.filter_by(company_id=current_user.id).all()
    result = []
    for d in drives:
        result.append({
            "id": d.id,
            "title": d.title,
            "job_title": d.job_title,
            "job_description": d.job_description,
            "eligibility": d.eligibility,
            "salary": d.salary,
            "location": d.location,
            "status": d.status,
            "min_cgpa": d.min_cgpa,
            "deadline": d.deadline.isoformat(),
            "applicant_count": len(d.applications)
        })
    return jsonify(result), 200


@company_bp.route("/drives/<int:drive_id>/applications", methods=["GET"])
@auth_required("token")
@roles_required("company")
def get_drive_applications(drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.company_id != current_user.id:
        return jsonify({"message": "Unauthorized"}), 403
    apps = Application.query.filter_by(drive_id=drive_id).all()
    result = []
    for a in apps:
        student = User.query.get(a.student_id)
        student_profile = StudentProfile.query.filter_by(user_id=student.id).first()
        result.append({
            "application_id": a.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_email": student.email,
            "cgpa": student_profile.cgpa if student_profile else None,
            "branch": student_profile.branch if student_profile else None,
            "status": a.status,
            "interview_date": a.interview_date.isoformat() if a.interview_date else None,
            "applied_at": a.applied_at.isoformat()
        })
    return jsonify(result), 200


@company_bp.route("/applications/<int:app_id>/status", methods=["PUT"])
@auth_required("token")
@roles_required("company")
def update_application_status(app_id):
    app_record = Application.query.get_or_404(app_id)
    drive = PlacementDrive.query.get(app_record.drive_id)
    if not drive or drive.company_id != current_user.id:
        return jsonify({"message": "Unauthorized"}), 403
    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ["Applied", "Shortlisted", "Selected", "Rejected"]:
        return jsonify({"message": "Invalid status."}), 400
    app_record.status = new_status
    # Optional: set interview date
    interview_date_str = data.get("interview_date")
    if interview_date_str:
        try:
            app_record.interview_date = datetime.fromisoformat(interview_date_str.replace("Z", "+00:00"))
        except ValueError:
            pass
    db.session.commit()
    return jsonify({"message": f"Application status updated to {new_status}"}), 200