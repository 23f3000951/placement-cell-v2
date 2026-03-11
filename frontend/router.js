const { createRouter, createWebHistory } = VueRouter;

import Home from './views/Home.js';
import Login from './views/Login.js';
import Register from './views/Register.js';
import AdminDashboard from './views/AdminDashboard.js';
import CompanyDashboard from './views/CompanyDashboard.js';
import CompanyCreateDrive from './views/CompanyCreateDrive.js';
import CompanyDriveApplications from './views/CompanyDriveApplications.js';
import CompanyProfileEdit from './views/CompanyProfileEdit.js';
import StudentDashboard from './views/StudentDashboard.js';
import StudentProfile from './views/StudentProfile.js';
import StudentApplications from './views/StudentApplications.js';
import StudentCompanyView from './views/StudentCompanyView.js';
import StudentDriveView from './views/StudentDriveView.js';

const routes = [
    { path: '/', component: Home, name: 'Home' },
    { path: '/login', component: Login, name: 'Login', meta: { guestOnly: true } },
    { path: '/register', component: Register, name: 'Register', meta: { guestOnly: true } },

    // Admin
    { path: '/admin/dashboard', component: AdminDashboard, name: 'AdminDashboard', meta: { requiresAuth: true, role: 'admin' } },

    // Company
    { path: '/company/dashboard', component: CompanyDashboard, name: 'CompanyDashboard', meta: { requiresAuth: true, role: 'company' } },
    { path: '/company/drives/create', component: CompanyCreateDrive, name: 'CompanyCreateDrive', meta: { requiresAuth: true, role: 'company' } },
    { path: '/company/drives/:id/applications', component: CompanyDriveApplications, name: 'CompanyDriveApplications', meta: { requiresAuth: true, role: 'company' } },
    { path: '/company/profile', component: CompanyProfileEdit, name: 'CompanyProfileEdit', meta: { requiresAuth: true, role: 'company' } },

    // Student
    { path: '/student/dashboard', component: StudentDashboard, name: 'StudentDashboard', meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/profile', component: StudentProfile, name: 'StudentProfile', meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/applications', component: StudentApplications, name: 'StudentApplications', meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/company/:id', component: StudentCompanyView, name: 'StudentCompanyView', meta: { requiresAuth: true, role: 'student' } },
    { path: '/student/drive/:id', component: StudentDriveView, name: 'StudentDriveView', meta: { requiresAuth: true, role: 'student' } }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Helper to redirect based on role
function redirectByRole(role, next) {
    if (role === 'admin') next('/admin/dashboard');
    else if (role === 'company') next('/company/dashboard');
    else next('/student/dashboard');
}

// Navigation Guards
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!token) {
            next({ name: 'Login' });
        } else if (to.meta.role && to.meta.role !== role) {
            redirectByRole(role, next);
        } else {
            next();
        }
    } else if (to.matched.some(record => record.meta.guestOnly)) {
        // If user has a token and visits login/register, clear session so they can re-login
        if (token) {
            localStorage.clear();
        }
        next();
    } else {
        next();
    }
});

export default router;
