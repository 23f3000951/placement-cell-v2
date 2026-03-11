export default {
    template: `
        <div id="form-body">
            <h1>Login Form</h1>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <form @submit.prevent="login">
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" v-model="email" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" v-model="password" required>
                </div>
                <div class="text-center">
                    <input type="submit" class="btn btn-primary" value="Login"><br>
                    Are you a new user! <router-link to="/register">Register</router-link>
                </div>
            </form>
        </div>
    `,
    data() {
        return { email: '', password: '', error: null }
    },
    methods: {
        async login() {
            this.error = null;
            try {
                const res = await axios.post('/auth/login', { email: this.email, password: this.password });
                const data = res.data;
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_role', data.role);
                localStorage.setItem('user_id', data.id);
                localStorage.setItem('user_name', data.name);
                if (data.role === 'admin') this.$router.push('/admin/dashboard');
                else if (data.role === 'company') this.$router.push('/company/dashboard');
                else this.$router.push('/student/dashboard');
            } catch (err) {
                this.error = err.response?.data?.message || 'Login failed. Check credentials.';
            }
        }
    }
};
