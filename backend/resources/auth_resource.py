from flask import Blueprint, jsonify, request
from flask_security import verify_password, hash_password, auth_token_required, current_user
from models import User, db
from flask import current_app

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/validate", methods=['GET'])
@auth_token_required
def validate_token():
    """Check if the current auth token is still valid."""
    role_str = current_user.roles[0].name if current_user.roles else "student"
    return jsonify({
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": role_str,
        "valid": True
    }), 200


@auth_bp.route("/logout", methods=['POST'])
@auth_token_required
def logout():
    """Logout - invalidate session on server side."""
    from flask_security import logout_user
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/login", methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"message": "invalid input"}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    if not verify_password(password, user.password):
        return jsonify({"message": "wrong password"}), 400
    
    # Check if user is active (companies pending approval will be inactive)
    if not user.active:
        return jsonify({"message": "Your account is not active. Please wait for admin approval."}), 403
    
    role_str = user.roles[0].name if user.roles else "student"
    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "token": user.get_auth_token(),
        "role": role_str
    }), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    from models import StudentProfile, CompanyProfile
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role_name = data.get("role")
    
    if not name or not email or not password or role_name not in ["company", "student"]:
        return jsonify({"message": "invalid input"}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "user already exist"}), 400
    
    # Companies start as inactive (need admin approval), students are active
    active = True if role_name == "student" else False
        
    datastore = current_app.datastore
    user = datastore.create_user(name=name, email=email, password=hash_password(password), active=active)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "error creating user"}), 400

    role_obj = datastore.find_role(role_name)
    datastore.add_role_to_user(user, role_obj)
    
    # Create profile
    if role_name == "student":
        department = data.get("department", "")
        profile = StudentProfile(user_id=user.id, branch=department if department else None)
        db.session.add(profile)
    elif role_name == "company":
        profile = CompanyProfile(user_id=user.id, is_approved=False)
        db.session.add(profile)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "error saving profile"}), 400
        
    msg = "Registration successful!"
    if role_name == "company":
        msg = "Registration successful! Your account needs admin approval before you can log in."
    
    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": role_name,
        "message": msg
    }), 201