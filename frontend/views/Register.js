export default {
    template: `
        <div class="p-4">
            <h1 class="text-center">Register Form</h1>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="success" class="alert alert-success">{{ success }}</div>
            <form @submit.prevent="register">
                <div class="mb-3 fs-5">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" v-model="name" required>
                </div>
                <div class="mb-3 fs-5">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" v-model="email" required>
                </div>
                <div class="mb-3 fs-5">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" v-model="password" required>
                </div>
                <div class="mb-3 fs-5">
                    <label for="role" class="form-label">Register As</label>
                    <select class="form-select" id="role" v-model="role" required>
                        <option value="student">Student</option>
                        <option value="company">Company</option>
                    </select>
                </div>
                <div class="mb-3 fs-5" v-if="role === 'student'">
                    <label for="department" class="form-label">Student Department</label>
                    <input type="text" class="form-control" id="department" v-model="department" placeholder="Only for Students (e.g. CS, IT). Companies leave blank.">
                </div>

                <div class="text-center">
                    <input type="submit" class="btn btn-primary" value="Register"><br>
                    Already registered? <router-link to="/login">Login</router-link>
                </div>
            </form>
        </div>
    `,
    data() {
        return { name: '', email: '', password: '', role: 'student', department: '', error: null, success: null }
    },
    methods: {
        async register() {
            this.error = null;
            this.success = null;
            try {
                const payload = { name: this.name, email: this.email, password: this.password, role: this.role };
                if (this.role === 'student' && this.department) payload.department = this.department;
                await axios.post('/auth/register', payload);
                this.success = 'Registration successful! Please login.';
                if (this.role === 'company') this.success += ' (Your account needs admin approval before you can create drives.)';
            } catch (err) {
                this.error = err.response?.data?.message || 'Registration failed.';
            }
        }
    }
};
