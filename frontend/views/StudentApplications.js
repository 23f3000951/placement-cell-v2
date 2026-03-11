export default {
    template: `
        <div>
            <nav class="navbar navbar-light bg-light border p-2 d-flex justify-content-between">
                <span class="navbar-brand mb-0 h5">Welcome, {{ studentName }}</span>
                <form class="d-flex align-items-center gap-2">
                    <a class="btn btn-outline-primary rounded px-3" href="#" @click.prevent="logout">Log out</a>
                    <router-link class="btn btn-outline-primary rounded px-3" to="/student/dashboard">Back</router-link>
                </form>
            </nav>
            <h1 class="text-center">History</h1>
            <h3 class="headings">Applied Drives</h3>
            <div id="table">
                <table class="table table-bordered text-center align-middle">
                    <thead>
                        <tr>
                            <th>Sr No.</th>
                            <th>Drive Name</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Interview Date</th>
                            <th>Applied Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(app, index) in applications" :key="app.id">
                            <td>{{ index + 1 }}</td>
                            <td>{{ app.drive_title }}</td>
                            <td>{{ app.company_name }}</td>
                            <td>{{ app.status }}</td>
                            <td>{{ app.interview_date ? new Date(app.interview_date).toLocaleString() : '-' }}</td>
                            <td>{{ new Date(app.applied_at).toLocaleDateString() }}</td>
                        </tr>
                        <tr v-if="applications.length === 0">
                            <td colspan="6" class="text-center">Haven't applied in any drive yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="text-center">
                <button class="btn btn-primary" @click="exportCSV">Export as CSV</button>
            </div>
        </div>
    `,
    data() {
        return { applications: [], studentName: localStorage.getItem('user_name') || '' }
    },
    async created() {
        try {
            const res = await axios.get('/api/student/applications');
            this.applications = res.data;
        } catch (err) { console.error(err); }
    },
    methods: {
        async exportCSV() {
            try {
                await axios.post('/api/student/export_csv');
                alert('Export job triggered! You will be notified when ready.');
            } catch (err) {
                alert('Export triggered (mock). Endpoint may need backend implementation.');
            }
        },
        async logout() { 
            try { await axios.post('/auth/logout'); } catch(e) {} 
            localStorage.clear(); 
            this.$router.push('/login'); 
        }
    }
};
