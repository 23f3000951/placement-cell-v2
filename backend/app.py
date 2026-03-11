import os
from dotenv import load_dotenv

# MUST be called BEFORE importing config.py so os.environ is populated
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from flask import Flask, send_from_directory, request
from config import LocalDevelopmentConfig

def create_app():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    app = Flask(__name__, static_folder=None)  # Disable default static handler
    app.config.from_object(LocalDevelopmentConfig)
    
    # Disable Flask-Security's default views
    app.config['SECURITY_REGISTER_URL'] = None
    app.config['SECURITY_LOGIN_URL'] = None
    app.config['SECURITY_LOGOUT_URL'] = None
    app.config['SECURITY_REDIRECT_BEHAVIOR'] = 'spa'
    app.config['SECURITY_CSRF_COOKIE_NAME'] = None
    app.config['WTF_CSRF_ENABLED'] = False
    
    # Disable session-based login — we only use token auth.
    # This prevents Flask-Security from auto-authenticating via session cookies.
    app.config['SECURITY_TOKEN_AUTHENTICATION_KEY'] = 'auth_token'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['REMEMBER_COOKIE_DURATION'] = 0
    
    from models import db, User, Role
    db.init_app(app)
    from flask_security import SQLAlchemyUserDatastore
    from extensions import security, cache, mail
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    security.init_app(app, datastore=datastore, register_blueprint=False)
    cache.init_app(app)
    mail.init_app(app)
    from resources import auth_bp, admin_bp, company_bp, student_bp
    app.datastore = datastore
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(student_bp)
    
    # Create required directories
    os.makedirs(os.path.join(os.path.dirname(__file__), 'sent_emails'), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'exports'), exist_ok=True)
    
    # Prevent browser caching of JS files during development
    @app.after_request
    def add_no_cache_headers(response):
        if request.path.endswith('.js'):
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response
    
    # Serve frontend SPA
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # If path matches a real file in frontend dir, serve it
        if path and os.path.isfile(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)
        # Otherwise serve index.html (SPA routing)
        return send_from_directory(frontend_dir, 'index.html')

    with app.app_context():
        db.create_all()
        
        # Programmatically create required roles
        datastore.find_or_create_role("admin")
        datastore.find_or_create_role("company")
        datastore.find_or_create_role("student")
        db.session.commit()
        
        # Programmatically create Admin user if not exists
        if not datastore.find_user(email="admin@institute.com"):
            from flask_security import hash_password
            admin_user = datastore.create_user(
                email="admin@institute.com",
                name="Admin",
                password=hash_password("admin123"),
                active=True
            )
            db.session.commit()
            datastore.add_role_to_user(admin_user, "admin")
            db.session.commit()
            
    return app

app = create_app()

if __name__ == "__main__":
    app.run()
