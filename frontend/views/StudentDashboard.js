export default {
    template: `
        <div>
            <nav class="navbar navbar-light bg-light border p-2 d-flex justify-content-between">
                <span class="navbar-brand mb-0 h5">Welcome, {{ studentName }}</span>
                <form class="d-flex align-items-center gap-2">
                    <router-link class="btn btn-outline-primary rounded px-3" to="/student/applications">History</router-link>
                    <router-link class="btn btn-outline-primary rounded px-3" to="/student/profile">Profile</router-link>
                    <a class="btn btn-outline-primary rounded px-3" href="#" @click.prevent="logout">Log out</a>
                </form>
            </nav>

            <h3 class="headings">Approved Placement Drives</h3>
            <div style="margin: 0 25px 10px 25px;">
                <div class="row g-2 align-items-center">
                    <div class="col-auto">
                        <input class="form-control" type="search" v-model="searchQuery" placeholder="Search drives / companies..." style="width:250px" @keyup.enter="searchDrives">
                    </div>
                    <div class="col-auto">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="eligibleFilter" v-model="eligibleOnly" @change="searchDrives">
                            <label class="form-check-label" for="eligibleFilter">Show only eligible (by CGPA)</label>
                        </div>
                    </div>
                    <div class="col-auto">
                        <button class="btn btn-primary btn-sm" @click="searchDrives">Search</button>
                        <button class="btn btn-secondary btn-sm ms-1" @click="clearSearch">Clear</button>
                    </div>
                </div>
            </div>
            <div id="table">
                <table class="table table-bordered text-center align-middle">
                    <thead>
                        <tr>
                            <th style="width:60px">Sr No.</th>
                            <th>Drive Name</th>
                            <th>Company</th>
                            <th>Min CGPA</th>
                            <th>Deadline</th>
                            <th style="width:18%">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(drive, index) in drives" :key="drive.id">
                            <td>{{ index + 1 }}</td>
                            <td>{{ drive.title }}</td>
                            <td>{{ drive.company_name }}</td>
                            <td>{{ drive.min_cgpa || 'N/A' }}</td>
                            <td>{{ new Date(drive.deadline).toLocaleDateString() }}</td>
                            <td>
                                <router-link class="btn btn-primary btn-sm" :to="'/student/drive/' + drive.id">View</router-link>
                            </td>
                        </tr>
                        <tr v-if="drives.length === 0">
                            <td colspan="6" class="text-center">No drives found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 class="headings">Organizations</h3>
            <div id="table">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th style="width:20%" class="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="company in companies" :key="company.id">
                            <td>{{ company.name }}</td>
                            <td class="text-center align-middle">
                                <router-link class="btn btn-primary" :to="'/student/company/' + company.user_id">View details</router-link>
                            </td>
                        </tr>
                        <tr v-if="companies.length === 0">
                            <td colspan="2" class="text-center">No companies registered yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 class="headings">Applied Drives</h3>
            <div id="table">
                <table class="table table-bordered text-center align-middle">
                    <thead>
                        <tr>
                            <th>Sr No.</th>
                            <th>Drive Name</th>
                            <th>Company</th>
                            <th style="width:20%">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(app, index) in applications" :key="app.id">
                            <td>{{ index + 1 }}</td>
                            <td>{{ app.drive_title }}</td>
                            <td>{{ app.company_name }}</td>
                            <td>
                                <router-link class="btn btn-secondary btn-sm" to="/student/applications">View History</router-link>
                            </td>
                        </tr>
                        <tr v-if="applications.length === 0">
                            <td colspan="4" class="text-center">Haven't applied in any drive.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    data() {
        return {
            companies: [], applications: [], drives: [],
            studentName: localStorage.getItem('user_name') || '',
            searchQuery: '', eligibleOnly: false
        }
    },
    async created() {
        try {
            await this.loadDrives();
            const compRes = await axios.get('/api/student/companies');
            this.companies = compRes.data;
            const appsRes = await axios.get('/api/student/applications');
            this.applications = appsRes.data;
        } catch (err) { console.error(err); }
    },
    methods: {
        async loadDrives() {
            let url = '/api/student/dashboard?';
            if (this.searchQuery) url += 'q=' + encodeURIComponent(this.searchQuery) + '&';
            if (this.eligibleOnly) url += 'eligible=true&';
            const res = await axios.get(url);
            this.drives = res.data;
        },
        async searchDrives() {
            try { await this.loadDrives(); } catch(e) { console.error(e); }
        },
        async clearSearch() {
            this.searchQuery = '';
            this.eligibleOnly = false;
            try { await this.loadDrives(); } catch(e) { console.error(e); }
        },
        async logout() { 
            try { await axios.post('/auth/logout'); } catch(e) {} 
            localStorage.clear(); 
            this.$router.push('/login'); 
        }
    }
};
