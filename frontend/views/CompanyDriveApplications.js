export default {
    template: `
        <div>
            <div id="content">
                <h1 class="text-center">Update Applications for the Drive</h1>
                <h4 style="margin:28px;" v-if="driveTitle">Job Title :- {{ driveTitle }}</h4>
                <h3 class="headings">Received Applications</h3>
                <div id="table">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Department</th>
                                <th>CGPA</th>
                                <th class="text-center">Status</th>
                                <th class="text-center">Interview Date</th>
                                <th style="width:10%" class="text-center">Save</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="app in applications" :key="app.application_id">
                                <td>{{ app.student_name }}</td>
                                <td>{{ app.branch || '' }}</td>
                                <td>{{ app.cgpa || 'N/A' }}</td>
                                <td class="text-center align-middle">
                                    <select class="form-select d-inline-block" style="width:150px" v-model="app.status">
                                        <option value="Applied">Applied</option>
                                        <option value="Shortlisted">Shortlisted</option>
                                        <option value="Selected">Selected</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </td>
                                <td class="text-center align-middle">
                                    <input type="datetime-local" class="form-control d-inline-block" style="width:190px" v-model="app.interview_date_input">
                                </td>
                                <td class="text-center align-middle">
                                    <button class="btn btn-success btn-sm" @click="saveApplication(app)">Save</button>
                                </td>
                            </tr>
                            <tr v-if="applications.length === 0">
                                <td colspan="6" class="text-center">No Applications received yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="successMsg" class="alert alert-success" style="margin:0 25px;">{{ successMsg }}</div>
                <div class="text-center">
                    <router-link to="/company/dashboard" class="btn btn-secondary">Back</router-link>
                </div>
            </div>
        </div>
    `,
    data() {
        return { applications: [], driveId: this.$route.params.id, driveTitle: '', successMsg: '' }
    },
    async created() {
        try {
            const res = await axios.get('/api/company/drives/' + this.driveId + '/applications');
            this.applications = res.data.map(app => ({
                ...app,
                interview_date_input: app.interview_date ? app.interview_date.slice(0, 16) : ''
            }));
            // Get drive info for title
            const drivesRes = await axios.get('/api/company/drives');
            const drive = drivesRes.data.find(d => d.id == this.driveId);
            if (drive) this.driveTitle = drive.job_title || drive.title;
        } catch (err) {
            console.error(err);
            alert('Could not load applications.');
            this.$router.push('/company/dashboard');
        }
    },
    methods: {
        async saveApplication(app) {
            this.successMsg = '';
            try {
                const payload = { status: app.status };
                if (app.interview_date_input) {
                    payload.interview_date = new Date(app.interview_date_input).toISOString();
                }
                await axios.put('/api/company/applications/' + app.application_id + '/status', payload);
                this.successMsg = app.student_name + ' — Status updated to ' + app.status + (app.interview_date_input ? ', Interview scheduled.' : '');
            } catch (err) {
                alert('Failed to update: ' + (err.response?.data?.message || 'Error'));
            }
        }
    }
};
