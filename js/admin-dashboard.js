// Admin Dashboard functionality
class AdminDashboard {
    constructor() {
        this.token = localStorage.getItem('pharmalens_token');
        this.user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        this.init();
    }

    init() {
        if (!this.token || this.user.role !== 'admin') {
            window.location.href = '/login';
            return;
        }

        this.setupEventListeners();
        this.loadDashboardData();
        this.displayUserInfo();
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('refreshUsersBtn').addEventListener('click', () => this.loadUsers());
        document.getElementById('refreshScansBtn').addEventListener('click', () => this.loadAllScans());
        
        // Tab switching
        document.getElementById('usersTab').addEventListener('click', () => this.switchTab('users'));
        document.getElementById('scansTab').addEventListener('click', () => this.switchTab('scans'));
        
        // Modal close buttons
        document.getElementById('closeUserModal').addEventListener('click', () => this.closeUserModal());
        document.getElementById('closeScanModal').addEventListener('click', () => this.closeScanModal());
    }

    displayUserInfo() {
        document.getElementById('adminWelcome').textContent = `Welcome, ${this.user.username}`;
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'border-red-600', 'text-red-600');
            btn.classList.add('text-gray-500');
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        if (tab === 'users') {
            document.getElementById('usersTab').classList.add('active', 'border-red-600', 'text-red-600');
            document.getElementById('usersTab').classList.remove('text-gray-500');
            document.getElementById('usersContent').classList.remove('hidden');
            this.loadUsers();
        } else if (tab === 'scans') {
            document.getElementById('scansTab').classList.add('active', 'border-red-600', 'text-red-600');
            document.getElementById('scansTab').classList.remove('text-gray-500');
            document.getElementById('scansContent').classList.remove('hidden');
            this.loadAllScans();
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadUsers()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            const stats = data.stats;

            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('totalScans').textContent = stats.totalScans || 0;
            document.getElementById('todayScans').textContent = stats.todayScans || 0;
            document.getElementById('weekScans').textContent = stats.thisWeekScans || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/dashboard/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            this.displayUsers(data.users);
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('usersTableBody').innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-red-500">
                        <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                        <p>Failed to load users</p>
                    </td>
                </tr>
            `;
        }
    }

    displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                        <p>No users found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-4 text-sm font-medium text-gray-900">${user.username}</td>
                <td class="px-4 py-4 text-sm text-gray-500">${user.email}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                        ${user.role}
                    </span>
                </td>
                <td class="px-4 py-4 text-sm text-gray-500">${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                <td class="px-4 py-4 text-sm">
                    <button onclick="adminDashboard.showUserActions(${user.id}, '${user.username}', '${user.role}')" 
                            class="text-blue-600 hover:text-blue-800 mr-3">
                        <i class="fas fa-cog"></i>
                    </button>
                    ${user.role !== 'admin' ? `
                        <button onclick="adminDashboard.deleteUser(${user.id}, '${user.username}')" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    showUserActions(userId, username, currentRole) {
        const modal = document.getElementById('userModal');
        const actionsContainer = document.getElementById('userActions');
        
        actionsContainer.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold mb-2">User: ${username}</h4>
                    <p class="text-sm text-gray-600">Current Role: ${currentRole}</p>
                </div>
                
                ${currentRole !== 'admin' ? `
                    <div class="space-y-2">
                        <button onclick="adminDashboard.changeUserRole(${userId}, 'admin')" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <i class="fas fa-user-shield mr-2"></i>Make Admin
                        </button>
                        <button onclick="adminDashboard.deleteUser(${userId}, '${username}')" 
                                class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <i class="fas fa-trash mr-2"></i>Delete User
                        </button>
                    </div>
                ` : `
                    <div class="bg-yellow-50 p-3 rounded-lg">
                        <p class="text-sm text-yellow-800">
                            <i class="fas fa-info-circle mr-2"></i>
                            Admin users cannot be modified or deleted.
                        </p>
                    </div>
                `}
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    async changeUserRole(userId, newRole) {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/dashboard/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                throw new Error('Failed to update user role');
            }

            this.showSuccess('User role updated successfully');
            this.closeUserModal();
            this.loadUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            this.showError('Failed to update user role');
        }
    }

    async deleteUser(userId, username) {
        if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/dashboard/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            this.showSuccess('User deleted successfully');
            this.closeUserModal();
            this.loadUsers();
            this.loadStats(); // Refresh stats
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('Failed to delete user');
        }
    }

    async loadAllScans() {
        try {
            const response = await fetch('/api/dashboard/all-scans', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch scans');
            }

            const data = await response.json();
            this.displayAllScans(data.scans);
        } catch (error) {
            console.error('Error loading scans:', error);
            document.getElementById('allScans').innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to load scan history</p>
                </div>
            `;
        }
    }

    displayAllScans(scans) {
        const container = document.getElementById('allScans');
        
        if (!scans || scans.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-camera text-3xl mb-4"></i>
                    <p class="text-lg mb-2">No scans found</p>
                    <p class="text-sm">No users have performed any scans yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = scans.map(scan => `
            <div class="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer" onclick="adminDashboard.viewScanDetails(${scan.id})">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800">Scan #${scan.id}</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            <i class="fas fa-user mr-2"></i>User: ${scan.username}
                        </p>
                        <p class="text-sm text-gray-600">
                            <i class="fas fa-calendar mr-2"></i>
                            ${new Date(scan.scan_date).toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            <i class="fas fa-check mr-1"></i>Completed
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async viewScanDetails(scanId) {
        try {
            const response = await fetch(`/api/dashboard/all-scans`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch scan details');
            }

            const data = await response.json();
            const scan = data.scans.find(s => s.id === scanId);
            
            if (!scan) {
                throw new Error('Scan not found');
            }
            
            this.showScanModal(scan);
        } catch (error) {
            console.error('Error loading scan details:', error);
            this.showError('Failed to load scan details');
        }
    }

    showScanModal(scan) {
        const modal = document.getElementById('scanModal');
        const detailsContainer = document.getElementById('scanDetails');
        
        detailsContainer.innerHTML = `
            <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-2">Scan Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Scan ID:</span>
                            <span class="ml-2 font-medium">#${scan.id}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">User:</span>
                            <span class="ml-2 font-medium">${scan.username}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Date:</span>
                            <span class="ml-2 font-medium">${new Date(scan.scan_date).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-3">OCR Results</h4>
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <pre class="text-sm text-gray-700 whitespace-pre-wrap">${scan.ocr_result || 'No text detected'}</pre>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-3">AI Analysis</h4>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="text-sm text-gray-700 whitespace-pre-wrap">${scan.ai_analysis || 'No analysis available'}</div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeUserModal() {
        document.getElementById('userModal').classList.add('hidden');
    }

    closeScanModal() {
        document.getElementById('scanModal').classList.add('hidden');
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('pharmalens_token');
            localStorage.removeItem('pharmalens_user');
            window.location.href = '/login';
        }
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }
}

// Initialize admin dashboard when page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});
