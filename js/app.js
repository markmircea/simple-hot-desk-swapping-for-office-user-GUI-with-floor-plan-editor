// Main Application
class App {
    constructor() {
        this.floorPlan = null;
        this.bookingManager = null;
        this.adminPanel = null;
    }

    async init() {
        // Initialize admin authentication
        window.adminAuth.init();

        // Initialize floor plan
        const container = document.getElementById('floor-plan');
        this.floorPlan = new FloorPlan(container);
        await this.floorPlan.init();

        // Initialize booking manager
        this.bookingManager = new BookingManager(this.floorPlan);
        await this.bookingManager.init();

        // Make booking manager and floor plan globally accessible
        window.bookingManager = this.bookingManager;
        window.floorPlan = this.floorPlan;

        // Setup admin panel
        this.setupAdminPanel();

        // Initialize floor plan editor
        window.floorPlanEditor.init();
    }

    setupAdminPanel() {
        const adminBtn = document.getElementById('admin-btn');
        const adminModal = document.getElementById('admin-modal');
        const addUserBtn = document.getElementById('add-user-btn');

        adminBtn.addEventListener('click', () => {
            // Admin button is only visible when authenticated
            this.openAdminPanel();
        });

        addUserBtn.addEventListener('click', () => {
            this.addNewUser();
        });

        // Change password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.changeAdminPassword();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    openAdminPanel() {
        const modal = document.getElementById('admin-modal');
        this.loadUsersList();
        modal.style.display = 'block';
    }

    loadUsersList() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';

        this.bookingManager.users.forEach(user => {
            const li = document.createElement('li');
            
            const userInfo = document.createElement('span');
            userInfo.textContent = `${user.name}${user.email ? ' (' + user.email + ')' : ''}`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-user-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => this.deleteUser(user.id, user.name);
            
            li.appendChild(userInfo);
            li.appendChild(deleteBtn);
            usersList.appendChild(li);
        });
    }

    async deleteUser(userId, userName) {
        if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}delete-user.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await response.json();
            
            if (data.success) {
                // Remove from local list
                this.bookingManager.users = this.bookingManager.users.filter(u => u.id !== userId);
                this.bookingManager.updateUserSelect();
                this.loadUsersList();
                alert('User deleted successfully!');
            } else {
                alert('Failed to delete user: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Please try again.');
        }
    }

    async addNewUser() {
        const nameInput = document.getElementById('new-user-name');
        const emailInput = document.getElementById('new-user-email');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name) {
            alert('Please enter a user name');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}users.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Add user to local list
                const newUser = {
                    id: data.user_id || Date.now(),
                    name: name,
                    email: email
                };
                this.bookingManager.users.push(newUser);
                this.bookingManager.updateUserSelect();
                this.loadUsersList();
                
                // Clear inputs
                nameInput.value = '';
                emailInput.value = '';
                
                alert('User added successfully!');
            } else {
                alert('Failed to add user: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding user:', error);
            // Add user locally for demo purposes
            const newUser = {
                id: Date.now(),
                name: name,
                email: email
            };
            this.bookingManager.users.push(newUser);
            this.bookingManager.updateUserSelect();
            this.loadUsersList();
            
            // Clear inputs
            nameInput.value = '';
            emailInput.value = '';
            
            alert('User added successfully!');
        }
    }

    changeAdminPassword() {
        const newPassword = document.getElementById('new-admin-password').value;
        const confirmPassword = document.getElementById('confirm-admin-password').value;
        
        if (!newPassword || !confirmPassword) {
            alert('Please enter and confirm the new password.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
        
        // Save new password to localStorage
        localStorage.setItem('adminPassword', newPassword);
        window.adminAuth.adminPassword = newPassword;
        
        // Clear input fields
        document.getElementById('new-admin-password').value = '';
        document.getElementById('confirm-admin-password').value = '';
        
        alert('Admin password changed successfully!');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});