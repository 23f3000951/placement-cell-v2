export default {
    template: `
        <div class="p-4">
            <h1 class="text-center">Create a Drive</h1>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="success" class="alert alert-success">{{ success }}</div>
            <form @submit.prevent="createDrive">
                <div class="mb-3">
                    <label for="DN" class="form-label">Drive Name</label>
                    <input type="text" class="form-control" id="DN" v-model="title" required>
                </div>
                <div class="mb-3">
                    <label for="JT" class="form-label">Job Title</label>
                    <input type="text" class="form-control" id="JT" v-model="job_title" required>
                </div>
                <div class="mb-3">
                    <label for="JD" class="form-label">Job Description</label>
                    <textarea class="form-control" id="JD" v-model="job_description" required></textarea>
                </div>
                <div class="mb-3">
                    <label for="EC" class="form-label">Eligibility Criteria</label>
                    <input type="text" class="form-control" id="EC" v-model="eligibility" required>
                </div>
                <div class="mb-3">
                    <label for="MC" class="form-label">Minimum CGPA</label>
                    <input type="number" step="0.1" min="0" max="10" class="form-control" id="MC" v-model="min_cgpa">
                </div>
                <div class="mb-3">
                    <label for="AD" class="form-label">Application Deadline</label>
                    <input type="date" class="form-control" id="AD" v-model="deadline" required>
                </div>
                <div class="mb-3">
                    <label for="salary" class="form-label">Salary</label>
                    <input type="number" class="form-control" id="salary" v-model="salary">
                </div>
                <div class="mb-3">
                    <label for="location" class="form-label">Location</label>
                    <input type="text" class="form-control" id="location" v-model="location">
                </div>
                <div class="text-center">
                    <input type="submit" class="btn btn-primary" value="Save">
                    <router-link to="/company/dashboard" class="btn btn-secondary ms-2">Back</router-link>
                </div>
            </form>
        </div>
    `,
    data() {
        return { title: '', job_title: '', job_description: '', eligibility: '', min_cgpa: '', deadline: '', salary: '', location: '', error: null, success: null }
    },
    methods: {
        async createDrive() {
            this.error = null;
            this.success = null;
            try {
                const isoDeadline = new Date(this.deadline).toISOString();
                await axios.post('/api/company/drives', {
                    title: this.title,
                    job_title: this.job_title,
                    job_description: this.job_description,
                    eligibility: this.eligibility,
                    min_cgpa: this.min_cgpa,
                    deadline: isoDeadline,
                    salary: this.salary,
                    location: this.location
                });
                this.success = 'Drive created and pending approval!';
                this.title = ''; this.job_title = ''; this.job_description = ''; this.eligibility = '';
                this.min_cgpa = ''; this.deadline = ''; this.salary = ''; this.location = '';
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to create drive.';
            }
        }
    }
};
