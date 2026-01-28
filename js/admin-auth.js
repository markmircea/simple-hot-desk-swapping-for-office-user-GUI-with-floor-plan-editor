// Admin Authentication System
class AdminAuth {
    constructor() {
        this.isAuthenticated = false;
        this.adminPassword = localStorage.getItem('adminPassword') || 'tpgcluj'; // Default password
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
        this.pendingAction = null;
    }

    init() {
        // Check if admin session exists in sessionStorage
        const adminSession = sessionStorage.getItem('adminSession');
        if (adminSession) {
            const session = JSON.parse(adminSession);
            if (new Date().getTime() < session.expiry) {
                this.isAuthenticated = true;
                this.startSessionTimer();
            } else {
                sessionStorage.removeItem('adminSession');
            }
        }

        this.setupEventListeners();
        this.updateUIState();
    }

    updateUIState() {
        const adminOnlyButtons = document.querySelectorAll('.admin-only');
        const loginButton = document.getElementById('admin-login-toggle-btn');
        
        if (this.isAuthenticated) {
            // Show admin buttons
            adminOnlyButtons.forEach(btn => {
                btn.style.display = 'inline-block';
            });
            // Change login button text
            loginButton.textContent = 'Admin Mode';
            loginButton.style.background = '#27ae60';
        } else {
            // Hide admin buttons
            adminOnlyButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            // Reset login button
            loginButton.textContent = 'Admin Login';
            loginButton.style.background = '';
        }
    }

    setupEventListeners() {
        // Admin login toggle button
        document.getElementById('admin-login-toggle-btn').addEventListener('click', () => {
            if (this.isAuthenticated) {
                alert('You are already logged in as admin.');
            } else {
                this.showLoginModal('Admin Access');
            }
        });

        // Admin logout button
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                this.logout();
                this.updateUIState();
                alert('Logged out successfully.');
            }
        });

        // Admin login modal
        document.getElementById('admin-login-btn').addEventListener('click', () => {
            this.attemptLogin();
        });

        document.getElementById('admin-cancel-btn').addEventListener('click', () => {
            this.closeLoginModal();
        });

        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.attemptLogin();
            }
        });

        // Close login modal
        const loginModal = document.getElementById('admin-login-modal');
        loginModal.querySelector('.close').addEventListener('click', () => {
            this.closeLoginModal();
        });
    }

    requireAuth(callback, actionName = 'perform this action') {
        if (this.isAuthenticated) {
            callback();
        } else {
            this.pendingAction = callback;
            this.showLoginModal(actionName);
        }
    }

    showLoginModal(actionName) {
        const modal = document.getElementById('admin-login-modal');
        modal.querySelector('h2').textContent = `Admin Login - ${actionName}`;
        modal.style.display = 'block';
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').focus();
    }

    closeLoginModal() {
        document.getElementById('admin-login-modal').style.display = 'none';
        document.getElementById('admin-password').value = '';
        this.pendingAction = null;
    }

    attemptLogin() {
        const password = document.getElementById('admin-password').value;
        
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            
            // Store session
            const session = {
                authenticated: true,
                expiry: new Date().getTime() + this.sessionTimeout
            };
            sessionStorage.setItem('adminSession', JSON.stringify(session));
            
            this.startSessionTimer();
            this.updateUIState();
            this.closeLoginModal();
            
            // Execute pending action if any
            if (this.pendingAction) {
                this.pendingAction();
                this.pendingAction = null;
            }
            
            alert('Admin login successful! Admin panel and floor plan editor are now available.');
        } else {
            alert('Invalid password. Please try again.');
            document.getElementById('admin-password').value = '';
            document.getElementById('admin-password').focus();
        }
    }

    startSessionTimer() {
        // Clear existing timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        // Set new timer
        this.sessionTimer = setTimeout(() => {
            this.logout();
            alert('Admin session expired. Please login again.');
        }, this.sessionTimeout);
    }

    logout() {
        this.isAuthenticated = false;
        sessionStorage.removeItem('adminSession');
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    checkAuth() {
        return this.isAuthenticated;
    }
}

// Create global admin auth instance
window.adminAuth = new AdminAuth();