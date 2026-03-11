from flask import Blueprint, jsonify, request
from flask_security import auth_required, roles_required
from models import db, User, Role, CompanyProfile, PlacementDrive, Application, StudentProfile
from extensions import cache


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/dashboard", methods=["GET"])
@auth_required("token")
@roles_required("admin")
@cache.cached(timeout=60)
def get_dashboard():
    student_role = Role.query.filter_by(name="student").first()
    company_role = Role.query.filter_by(name="company").first()
    total_students = len(student_role.users) if student_role else 0
    total_companies = len(company_role.users) if company_role else 0
    total_drives = PlacementDrive.query.count()
    pending_companies = CompanyProfile.query.filter_by(is_approved=False).count()
    pending_drives = PlacementDrive.query.filter_by(status='Pending').count()
    
    # Placement statistics
    total_applications = Application.query.count()
    total_selected = Application.query.filter_by(status='Selected').count()
    total_shortlisted = Application.query.filter_by(status='Shortlisted').count()
    total_rejected = Application.query.filter_by(status='Rejected').count()
    approved_drives = PlacementDrive.query.filter_by(status='Approved').count()
    
    return jsonify({
        "total_students": total_students,
        "total_companies": total_companies,
        "total_drives": total_drives,
        "pending_companies": pending_companies,
        "pending_drives": pending_drives,
        "total_applications": total_applications,
        "total_selected": total_selected,
        "total_shortlisted": total_shortlisted,
        "total_rejected": total_rejected,
        "approved_drives": approved_drives
    }), 200


@admin_bp.route("/companies", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def get_companies():
    status = request.args.get("status", "all")
    query = CompanyProfile.query
    if status == "pending":
        query = query.filter_by(is_approved=False)
    elif status == "approved":
        query = query.filter_by(is_approved=True)
    companies = query.all()
    result = []
    for c in companies:
        user = c.user
        result.append({
            "id": c.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "is_approved": c.is_approved,
            "active": user.active
        })
    return jsonify(result), 200


@admin_bp.route("/companies/<int:id>/<action>", methods=["PUT"])
@auth_required("token")
@roles_required("admin")
def manage_company(id, action):
    company = CompanyProfile.query.get_or_404(id)
    if action == "approve":
        company.is_approved = True
        company.user.active = True
        db.session.commit()
        return jsonify({"message": "Company approved successfully."}), 200
    elif action == "reject":
        db.session.delete(company)
        db.session.delete(company.user)
        db.session.commit()
        return jsonify({"message": "Company rejected and removed."}), 200
    return jsonify({"message": "Invalid action"}), 400


@admin_bp.route("/drives", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def get_drives():
    status = request.args.get("status", "all")
    query = PlacementDrive.query
    if status != "all":
        query = query.filter_by(status=status.capitalize())
    drives = query.all()
    result = []
    for d in drives:
        result.append({
            "id": d.id,
            "company_name": User.query.get(d.company_id).name,
            "title": d.title,
            "job_title": d.job_title,
            "job_description": d.job_description,
            "salary": d.salary,
            "location": d.location,
            "status": d.status,
            "min_cgpa": d.min_cgpa,
            "deadline": d.deadline.isoformat()
        })
    return jsonify(result), 200


@admin_bp.route("/drives/<int:id>/<action>", methods=["PUT"])
@auth_required("token")
@roles_required("admin")
def manage_drive(id, action):
    drive = PlacementDrive.query.get_or_404(id)
    if action == "approve":
        drive.status = "Approved"
        db.session.commit()
        return jsonify({"message": "Drive approved successfully."}), 200
    elif action == "reject":
        drive.status = "Rejected"
        db.session.commit()
        return jsonify({"message": "Drive rejected."}), 200
    return jsonify({"message": "Invalid action"}), 400


@admin_bp.route("/users/<int:user_id>/<action>", methods=["PUT"])
@auth_required("token")
@roles_required("admin")
def manage_user_status(user_id, action):
    user = User.query.get_or_404(user_id)
    if action == "deactivate":
        user.active = False
        db.session.commit()
        return jsonify({"message": "User deactivated (blacklisted)."}), 200
    elif action == "activate":
        user.active = True
        db.session.commit()
        return jsonify({"message": "User activated."}), 200
    return jsonify({"message": "Invalid action"}), 400


@admin_bp.route("/applications", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def get_all_applications():
    apps = Application.query.all()
    result = []
    for a in apps:
        student = User.query.get(a.student_id)
        drive = PlacementDrive.query.get(a.drive_id)
        company = User.query.get(drive.company_id)
        result.append({
            "id": a.id,
            "student_name": student.name,
            "company_name": company.name,
            "drive_title": drive.title,
            "status": a.status,
            "applied_at": a.applied_at.isoformat()
        })
    return jsonify(result), 200


@admin_bp.route("/students", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def get_students():
    student_role = Role.query.filter_by(name="student").first()
    if not student_role:
        return jsonify([]), 200
    result = []
    for u in student_role.users:
        profile = StudentProfile.query.filter_by(user_id=u.id).first()
        result.append({
            "id": u.id,
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "active": u.active,
            "department": profile.branch if profile else None
        })
    return jsonify(result), 200


@admin_bp.route("/search", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def search():
    query = request.args.get("q", "")
    search_type = request.args.get("type", "")
    if not query:
        return jsonify([]), 200
    users = User.query.filter(User.name.ilike(f"%{query}%")).all()
    results = []
    for u in users:
        roles = [r.name for r in u.roles]
        if "admin" in roles:
            continue
        if search_type == "student" and "student" not in roles:
            continue
        if search_type == "company" and "company" not in roles:
            continue
        entry = {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "roles": roles,
            "active": u.active
        }
        if "student" in roles:
            profile = StudentProfile.query.filter_by(user_id=u.id).first()
            entry["department"] = profile.branch if profile else None
        results.append(entry)
    return jsonify(results), 200