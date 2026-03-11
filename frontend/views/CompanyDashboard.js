export default {
    template: `
        <div>
            <nav class="navbar navbar-light bg-light border p-2 d-flex justify-content-between">
                <span class="navbar-brand mb-0 h5">Welcome {{ companyName }}</span>
                <form class="d-flex align-items-center gap-2">
                    <router-link class="btn btn-outline-primary rounded px-3" to="/company/profile">Edit Profile</router-link>
                    <router-link class="btn btn-outline-primary rounded px-3" to="/company/drives/create">Create Drive</router-link>
                    <a class="btn btn-outline-primary rounded px-3" href="#" @click.prevent="logout">Log out</a>
                </form>
            </nav>

            <div v-if="!isApproved" class="alert alert-warning" style="margin:25px;">
                Your company account is pending approval from the Admin. You cannot create drives until approved.
            </div>

            <div id="content">
                <h3 class="headings">Ongoing Drives</h3>
                <div id="table">
                    <table class="table table-bordered text-center align-middle">
                        <thead>
                            <tr>
                                <th style="width:80px">Sr No.</th>
                                <th>Drive Name</th>
                                <th style="width:42%">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(drive, index) in approvedDrives" :key="drive.id">
                                <td>{{ index + 1 }}</td>
                                <td>{{ drive.title }}</td>
                                <td>
                                    <router-link class="btn btn-primary" :to="'/company/drives/' + drive.id + '/applications'">View Details</router-link>
                                </td>
                            </tr>
                            <tr v-if="approvedDrives.length === 0">
                                <td colspan="3" class="text-center">No Ongoing Drive.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3 class="headings">Pending Drives</h3>
                <div id="table">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th class="text-center">Sr No.</th>
                                <th class="text-center">Drive Name</th>
                                <th class="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(drive, index) in pendingDrives" :key="drive.id">
                                <td class="text-center align-middle">{{ index + 1 }}</td>
                                <td class="text-center align-middle">{{ drive.title }}</td>
                                <td class="text-center align-middle">{{ drive.status }}</td>
                            </tr>
                            <tr v-if="pendingDrives.length === 0">
                                <td colspan="3" class="text-center">No pending drives.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    data() {
        return { drives: [], companyName: '', isApproved: true }
    },
    computed: {
        approvedDrives() { return this.drives.filter(d => d.status === 'Approved'); },
        pendingDrives() { return this.drives.filter(d => d.status !== 'Approved'); }
    },
    async created() {
        try {
            const dashRes = await axios.get('/api/company/dashboard');
            this.companyName = dashRes.data.company_name;
            this.isApproved = dashRes.data.is_approved;
            const drivesRes = await axios.get('/api/company/drives');
            this.drives = drivesRes.data;
        } catch (err) { console.error(err); }
    },
    methods: {
        async logout() { 
            try { await axios.post('/auth/logout'); } catch(e) {} 
            localStorage.clear(); 
            this.$router.push('/login'); 
        }
    }
};
