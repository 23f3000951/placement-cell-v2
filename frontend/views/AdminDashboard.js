export default {
    template: `
        <div>
            <nav class="navbar navbar-light bg-light border p-2 d-flex justify-content-between">
                <span class="navbar-brand mb-0 h5">Welcome Admin</span>
                <form class="d-flex align-items-center gap-2">
                    <input class="form-control rounded-pill border-primary bg-light" type="search" v-model="searchQuery" placeholder="student, company" style="width: 200px;">
                    <select v-model="searchKey" class="form-select rounded-pill" style="width: 130px;">
                        <option value="student">Student</option>
                        <option value="company">Company</option>
                    </select>
                    <button type="button" class="btn btn-primary" @click="search">Submit</button>
                    <a href="#" class="btn btn-outline-primary" @click.prevent="logout">Log out</a>
                </form>
            </nav>

            <!-- Search Results -->
            <div v-if="searchResults !== null" id="content">
                <h3 class="headings">Search Results for: "{{ searchQuery }}"</h3>
                <div id="table" v-if="searchResults.length > 0">
                    <table class="table table-bordered text-center align-middle">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th v-if="searchKey === 'student'">Department</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in searchResults" :key="r.id">
                                <td>{{ r.id }}</td>
                                <td>{{ r.name }}</td>
                                <td v-if="searchKey === 'student'">{{ r.department || '' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="alert alert-warning" style="margin:25px;">No results found!</div>
                <div class="text-center"><button class="btn btn-secondary" @click="searchResults = null">Go back</button></div>
            </div>

            <!-- Dashboard Content -->
            <div v-else id="content">
                <h3 class="headings">Placement Statistics</h3>
                <div style="margin: 0 25px 20px 25px;">
                    <div class="row text-center">
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.total_students }}</strong><br><small>Students</small></div></div>
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.total_companies }}</strong><br><small>Companies</small></div></div>
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.total_drives }}</strong><br><small>Total Drives</small></div></div>
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.approved_drives }}</strong><br><small>Active Drives</small></div></div>
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.total_applications }}</strong><br><small>Applications</small></div></div>
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.total_selected }}</strong><br><small>Selected</small></div></div>
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.total_shortlisted }}</strong><br><small>Shortlisted</small></div></div>
                        <div class="col"><div class="border rounded p-2"><strong>{{ stats.total_rejected }}</strong><br><small>Rejected</small></div></div>
                    </div>
                </div>

                <h3 class="headings">Registered Companies</h3>
                <div id="table">
                    <table class="table table-bordered">
                        <thead><tr><th>Company Name</th><th style="width:20%" class="text-center">Action</th></tr></thead>
                        <tbody>
                            <tr v-for="c in companies" :key="c.id">
                                <td>{{ c.name }}</td>
                                <td class="text-center align-middle">
                                    <button class="btn btn-danger" @click="blockUser(c.user_id)">Block</button>
                                    <button v-if="!c.active" class="btn btn-success ms-1" @click="activateUser(c.user_id)">Activate</button>
                                </td>
                            </tr>
                            <tr v-if="companies.length === 0"><td colspan="2" class="text-center">No company registered yet.</td></tr>
                        </tbody>
                    </table>
                </div>

                <h3 class="headings">Registered Students</h3>
                <div id="table">
                    <table class="table table-bordered">
                        <thead><tr><th>Student Name</th><th style="width:20%" class="text-center">Action</th></tr></thead>
                        <tbody>
                            <tr v-for="s in students" :key="s.id">
                                <td>{{ s.name }}</td>
                                <td class="text-center align-middle">
                                    <button class="btn btn-danger" @click="blockUser(s.user_id)">Block</button>
                                    <button v-if="!s.active" class="btn btn-success ms-1" @click="activateUser(s.user_id)">Activate</button>
                                </td>
                            </tr>
                            <tr v-if="students.length === 0"><td colspan="2" class="text-center">No student registered yet.</td></tr>
                        </tbody>
                    </table>
                </div>

                <h3 class="headings">Company Applications</h3>
                <div id="table">
                    <table class="table table-bordered">
                        <thead><tr><th>Company Name</th><th style="width:20%" class="text-center">Action</th></tr></thead>
                        <tbody>
                            <tr v-for="c in pendingCompanies" :key="c.id">
                                <td>{{ c.name }}</td>
                                <td class="text-center align-middle">
                                    <button class="btn btn-success" @click="approveCompany(c.id)">Accept</button>
                                </td>
                            </tr>
                            <tr v-if="pendingCompanies.length === 0"><td colspan="2" class="text-center">No company application yet.</td></tr>
                        </tbody>
                    </table>
                </div>

                <h3 class="headings">Student Applications</h3>
                <div id="table">
                    <table class="table table-bordered text-center align-middle">
                        <thead><tr><th>Sr No.</th><th>Name</th><th>Drive</th><th>Company</th><th style="width:20%">Status</th></tr></thead>
                        <tbody>
                            <tr v-for="(app, index) in studentApps" :key="app.id">
                                <td>{{ index + 1 }}</td>
                                <td>{{ app.student_name }}</td>
                                <td>{{ app.drive_title }}</td>
                                <td>{{ app.company_name }}</td>
                                <td>{{ app.status }}</td>
                            </tr>
                            <tr v-if="studentApps.length === 0"><td colspan="5" class="text-center">No student have been applied in any company yet.</td></tr>
                        </tbody>
                    </table>
                </div>

                <h3 class="headings">Ongoing Drives</h3>
                <div id="table">
                    <table class="table table-bordered text-center align-middle">
                        <thead><tr><th style="width:80px">Sr No.</th><th>Drive Name</th><th>Action</th></tr></thead>
                        <tbody>
                            <tr v-for="(drive, index) in ongoingDrives" :key="drive.id">
                                <td>{{ index + 1 }}</td>
                                <td>{{ drive.title }}</td>
                                <td>
                                    <button v-if="drive.status === 'Pending'" class="btn btn-success" @click="approveDrive(drive.id)">Approve</button>
                                    <button v-if="drive.status === 'Pending'" class="btn btn-danger ms-1" @click="rejectDrive(drive.id)">Reject</button>
                                    <span v-if="drive.status !== 'Pending'">{{ drive.status }}</span>
                                </td>
                            </tr>
                            <tr v-if="ongoingDrives.length === 0"><td colspan="3" class="text-center">Any company have opened any drive yet.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            companies: [], students: [], pendingCompanies: [], studentApps: [], ongoingDrives: [],
            stats: { total_students: 0, total_companies: 0, total_drives: 0, approved_drives: 0, total_applications: 0, total_selected: 0, total_shortlisted: 0, total_rejected: 0 },
            searchQuery: '', searchKey: 'student', searchResults: null
        }
    },
    async created() { await this.loadAll(); },
    methods: {
        async loadAll() {
            try {
                const dashRes = await axios.get('/api/admin/dashboard');
                this.stats = dashRes.data;
                const compRes = await axios.get('/api/admin/companies?status=approved');
                this.companies = compRes.data;
                const pendRes = await axios.get('/api/admin/companies?status=pending');
                this.pendingCompanies = pendRes.data;
                const stuRes = await axios.get('/api/admin/students');
                this.students = stuRes.data;
                const appRes = await axios.get('/api/admin/applications');
                this.studentApps = appRes.data;
                const driveRes = await axios.get('/api/admin/drives?status=all');
                this.ongoingDrives = driveRes.data;
            } catch (err) { console.error(err); }
        },
        async search() {
            if (!this.searchQuery) return;
            try {
                const res = await axios.get('/api/admin/search?q=' + this.searchQuery + '&type=' + this.searchKey);
                this.searchResults = res.data;
            } catch (err) { console.error(err); this.searchResults = []; }
        },
        async blockUser(userId) {
            if (!confirm('Block this user?')) return;
            try { await axios.put('/api/admin/users/' + userId + '/deactivate'); this.loadAll(); } catch(e) { alert('Failed'); }
        },
        async activateUser(userId) {
            try { await axios.put('/api/admin/users/' + userId + '/activate'); this.loadAll(); } catch(e) { alert('Failed'); }
        },
        async approveCompany(id) {
            try { await axios.put('/api/admin/companies/' + id + '/approve'); this.loadAll(); } catch(e) { alert('Failed'); }
        },
        async approveDrive(id) {
            try { await axios.put('/api/admin/drives/' + id + '/approve'); this.loadAll(); } catch(e) { alert('Failed'); }
        },
        async rejectDrive(id) {
            try { await axios.put('/api/admin/drives/' + id + '/reject'); this.loadAll(); } catch(e) { alert('Failed'); }
        },
        async logout() { 
            try { await axios.post('/auth/logout'); } catch(e) {} 
            localStorage.clear(); 
            this.$router.push('/login'); 
        }
    }
};
