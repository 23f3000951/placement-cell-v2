export default {
    template: `
        <div class="p-4">
            <h1 class="text-center">{{ drive.drive_name }}</h1>
            <div v-if="message" class="alert" :class="messageType === 'success' ? 'alert-success' : 'alert-danger'">{{ message }}</div>
            <form @submit.prevent="applyNow">
                <div class="mb-3">
                    <label class="form-label">Job Title</label>
                    <input class="form-control" type="text" :value="drive.job_title" disabled readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Job Description</label>
                    <textarea class="form-control" rows="3" disabled readonly>{{ drive.job_description }}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Salary</label>
                    <input class="form-control" type="text" :value="drive.salary || 'N/A'" disabled readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Location</label>
                    <input class="form-control" type="text" :value="drive.location || 'N/A'" disabled readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Eligibility</label>
                    <input class="form-control" type="text" :value="drive.eligibility || 'N/A'" disabled readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Min CGPA</label>
                    <input class="form-control" type="text" :value="drive.min_cgpa || 'N/A'" disabled readonly>
                </div>
                <div class="text-center">
                    <button type="submit" class="btn btn-primary">Apply Now</button>
                    <a class="btn btn-primary ms-2" href="#" @click.prevent="goBack">Go Back</a>
                </div>
            </form>
        </div>
    `,
    data() {
        return {
            drive: { drive_name: '', job_title: '', job_description: '', salary: null, location: '', eligibility: '', min_cgpa: null, company_id: null },
            message: null,
            messageType: ''
        }
    },
    async created() {
        try {
            const driveId = this.$route.params.id;
            const res = await axios.get('/api/student/drives/' + driveId);
            this.drive = res.data;
        } catch (err) {
            console.error(err);
            alert('Could not load drive details.');
            this.$router.push('/student/dashboard');
        }
    },
    methods: {
        async applyNow() {
            try {
                const res = await axios.post('/api/student/drives/' + this.drive.id + '/apply');
                this.message = res.data.message;
                this.messageType = 'success';
            } catch (err) {
                this.message = err.response?.data?.message || 'Failed to apply.';
                this.messageType = 'error';
            }
        },
        goBack() {
            if (this.drive.company_id) {
                this.$router.push('/student/company/' + this.drive.company_id);
            } else {
                this.$router.push('/student/dashboard');
            }
        }
    }
};
