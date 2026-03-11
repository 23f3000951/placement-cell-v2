export default {
    template: `
        <div class="p-4">
            <h1 class="text-center">Student Profile</h1>
            <div v-if="success" class="alert alert-success">{{ success }}</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <form @submit.prevent="updateProfile">
                <div class="mb-3">
                    <label for="cgpa" class="form-label">CGPA (out of 10)</label>
                    <input type="number" step="0.01" min="0" max="10" class="form-control" id="cgpa" v-model="profile.cgpa" required>
                </div>
                <div class="mb-3">
                    <label for="branch" class="form-label">Branch / Department</label>
                    <input type="text" class="form-control" id="branch" v-model="profile.branch" placeholder="e.g. CS, IT" required>
                </div>
                <div class="mb-3">
                    <label for="phone" class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="phone" v-model="profile.phone_number">
                </div>
                <div class="mb-3">
                    <label for="resume" class="form-label">Resume (PDF)</label>
                    <input type="file" class="form-control" id="resume" @change="handleFile" accept="application/pdf">
                </div>
                <div class="text-center">
                    <input type="submit" class="btn btn-primary" value="Save">
                    <router-link to="/student/dashboard" class="btn btn-secondary ms-2">Back</router-link>
                </div>
            </form>
        </div>
    `,
    data() {
        return { profile: { cgpa: '', branch: '', phone_number: '' }, resumeFile: null, success: null, error: null }
    },
    async created() {
        try {
            const res = await axios.get('/api/student/profile');
            this.profile = res.data;
        } catch (err) {
            if (err.response && err.response.status !== 404) console.error(err);
        }
    },
    methods: {
        handleFile(e) { this.resumeFile = e.target.files[0]; },
        async updateProfile() {
            this.success = null; this.error = null;
            try {
                const formData = new FormData();
                formData.append('cgpa', this.profile.cgpa);
                formData.append('branch', this.profile.branch);
                formData.append('phone_number', this.profile.phone_number || '');
                if (this.resumeFile) formData.append('resume', this.resumeFile);
                await axios.put('/api/student/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                this.success = 'Profile updated successfully.';
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to update profile.';
            }
        }
    }
};
