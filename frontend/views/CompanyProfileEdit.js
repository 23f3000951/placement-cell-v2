export default {
    template: `
        <div class="p-4">
            <h1 class="text-center">Company Profile</h1>
            <div v-if="success" class="alert alert-success">{{ success }}</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <form @submit.prevent="updateProfile">
                <div class="mb-3">
                    <label for="name" class="form-label">Company Name</label>
                    <input type="text" class="form-control" id="name" v-model="profile.name" required>
                </div>
                <div class="mb-3">
                    <label for="description" class="form-label">Description / Overview</label>
                    <textarea class="form-control" id="description" v-model="profile.description" rows="4" placeholder="Brief description about your company"></textarea>
                </div>
                <div class="mb-3">
                    <label for="website" class="form-label">Website</label>
                    <input type="url" class="form-control" id="website" v-model="profile.website" placeholder="https://example.com">
                </div>
                <div class="mb-3">
                    <label for="location" class="form-label">Location</label>
                    <input type="text" class="form-control" id="location" v-model="profile.location" placeholder="e.g. Mumbai, Delhi">
                </div>
                <div class="mb-3">
                    <label for="phone" class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="phone" v-model="profile.phone_number" placeholder="e.g. 9876543210">
                </div>
                <div class="text-center">
                    <input type="submit" class="btn btn-primary" value="Save">
                    <router-link to="/company/dashboard" class="btn btn-secondary ms-2">Back</router-link>
                </div>
            </form>
        </div>
    `,
    data() {
        return { profile: { name: '', description: '', website: '', location: '', phone_number: '' }, success: null, error: null }
    },
    async created() {
        try {
            const res = await axios.get('/api/company/profile');
            this.profile = {
                name: res.data.name || '',
                description: res.data.description || '',
                website: res.data.website || '',
                location: res.data.location || '',
                phone_number: res.data.phone_number || ''
            };
        } catch (err) {
            if (err.response && err.response.status !== 404) console.error(err);
        }
    },
    methods: {
        async updateProfile() {
            this.success = null; this.error = null;
            try {
                await axios.put('/api/company/profile', this.profile);
                this.success = 'Profile updated successfully.';
                // Update name in localStorage if changed
                if (this.profile.name) {
                    localStorage.setItem('user_name', this.profile.name);
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to update profile.';
            }
        }
    }
};
