export default {
    template: `
        <div>
            <nav class="navbar navbar-light bg-light border p-2 d-flex justify-content-between">
                <span class="navbar-brand mb-0 h5">Welcome {{ studentName }}</span>
                <form class="d-flex align-items-center gap-2">
                    <router-link class="btn btn-outline-primary rounded px-3" to="/student/applications">History</router-link>
                    <a class="btn btn-outline-primary rounded px-3" href="#" @click.prevent="logout">Log out</a>
                </form>
            </nav>
            <h1 class="headings">{{ company.name }}</h1>
            <h3 class="headings">Overview</h3>
            <p style="margin:25px; margin-top:10px; padding:4px">{{ company.overview || 'No description available.' }}</p>
            <h3 class="headings">Current Drive</h3>
            <div id="table">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Drive Name</th>
                            <th>Job Title</th>
                            <th style="width:30%" class="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="drive in company.drives" :key="drive.id">
                            <td>{{ drive.drive_name }}</td>
                            <td>{{ drive.job_title }}</td>
                            <td class="text-center align-middle">
                                <router-link class="btn btn-primary" :to="'/student/drive/' + drive.id">View details</router-link>
                            </td>
                        </tr>
                        <tr v-if="!company.drives || company.drives.length === 0">
                            <td colspan="3" class="text-center">No active drives found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    data() {
        return {
            company: { name: '', overview: '', drives: [] },
            studentName: localStorage.getItem('user_name') || ''
        }
    },
    async created() {
        try {
            const companyId = this.$route.params.id;
            const res = await axios.get('/api/student/companies/' + companyId);
            this.company = res.data;
        } catch (err) {
            console.error(err);
            alert('Could not load company details.');
            this.$router.push('/student/dashboard');
        }
    },
    methods: {
        async logout() { 
            try { await axios.post('/auth/logout'); } catch(e) {} 
            localStorage.clear(); 
            this.$router.push('/login'); 
        }
    }
};
