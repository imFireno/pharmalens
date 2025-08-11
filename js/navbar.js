// Dynamic Navbar Component
class Navbar {
    constructor() {
        this.token = localStorage.getItem('pharmalens_token');
        this.user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        this.init();
    }

    init() {
        this.renderNavbar();
        this.setupEventListeners();
    }

    renderNavbar() {
        const navbarContainer = document.getElementById('navbar');
        if (!navbarContainer) return;

        const isLoggedIn = this.token && this.user.id;
        
        navbarContainer.innerHTML = `
            <div class="container mx-auto">
                <div class="navbar-box flex items-center justify-between">
                    <!-- Logo -->
                    <div class="logo flex items-center gap-x-2">
                        <img src="./img/pharmalens.png" alt="PharmaLens" class="w-10 h-10">
                        <a href="/" class="text-2xl font-bold text-green-900 hover:text-green-700 transition-colors">
                            PharmaLens
                        </a>
                    </div>

                    <!-- Desktop Menu -->
                    <div class="menu hidden md:flex items-center gap-x-6">
                        <a href="/" class="nav-link text-green-900 hover:text-green-700 font-medium transition-colors">
                            <i class="fas fa-home mr-2"></i>Home
                        </a>
                        
                        ${isLoggedIn ? `
                            <a href="/scan" class="nav-link text-green-900 hover:text-green-700 font-medium transition-colors">
                                <i class="fas fa-camera mr-2"></i>Scan
                            </a>
                            <a href="/history" class="nav-link text-green-900 hover:text-green-700 font-medium transition-colors">
                                <i class="fas fa-history mr-2"></i>History
                            </a>
                            ${this.user.role === 'admin' ? `
                                <a href="/admin" class="nav-link text-red-600 hover:text-red-700 font-medium transition-colors">
                                    <i class="fas fa-user-shield mr-2"></i>Admin
                                </a>
                            ` : ''}
                        ` : ''}
                    </div>

                    <!-- Auth Buttons -->
                    <div class="auth-buttons flex items-center gap-x-4">
                        ${isLoggedIn ? `
                            <!-- User Info -->
                            <div class="user-info hidden md:flex items-center gap-x-3">
                                <div class="text-right">
                                    <p class="text-sm font-medium text-green-900">Welcome,</p>
                                    <p class="text-xs text-green-700">${this.user.username}</p>
                                </div>
                                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user text-white text-sm"></i>
                                </div>
                            </div>
                            
                            <!-- Logout Button -->
                            <button id="logoutBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <i class="fas fa-sign-out-alt mr-2"></i>Logout
                            </button>
                        ` : `
                            <!-- Login Button -->
                            <a href="/login" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <i class="fas fa-sign-in-alt mr-2"></i>Login
                            </a>
                        `}

                        <!-- Mobile Menu Toggle -->
                        <button id="mobileMenuToggle" class="md:hidden text-green-900 hover:text-green-700">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu -->
                <div id="mobileMenu" class="mobile-menu md:hidden hidden mt-4 pb-4 border-t border-green-200">
                    <div class="flex flex-col space-y-3 pt-4">
                        <a href="/" class="nav-link text-green-900 hover:text-green-700 font-medium transition-colors py-2">
                            <i class="fas fa-home mr-2"></i>Home
                        </a>
                        
                        ${isLoggedIn ? `
                            <a href="/scan" class="nav-link text-green-900 hover:text-green-700 font-medium transition-colors py-2">
                                <i class="fas fa-camera mr-2"></i>Scan
                            </a>
                            <a href="/history" class="nav-link text-green-900 hover:text-green-700 font-medium transition-colors py-2">
                                <i class="fas fa-history mr-2"></i>History
                            </a>
                            ${this.user.role === 'admin' ? `
                                <a href="/admin" class="nav-link text-red-600 hover:text-red-700 font-medium transition-colors py-2">
                                    <i class="fas fa-user-shield mr-2"></i>Admin
                                </a>
                            ` : ''}
                            
                            <!-- Mobile User Info -->
                            <div class="border-t border-green-200 pt-3 mt-3">
                                <p class="text-sm text-green-700 mb-2">
                                    <i class="fas fa-user mr-2"></i>Logged in as: <strong>${this.user.username}</strong>
                                </p>
                                <button id="mobileLogoutBtn" class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                </button>
                            </div>
                        ` : `
                            <div class="border-t border-green-200 pt-3 mt-3">
                                <a href="/login" class="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center">
                                    <i class="fas fa-sign-in-alt mr-2"></i>Login
                                </a>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        // Highlight current page
        this.highlightCurrentPage();
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '/' && href === '/')) {
                link.classList.add('text-green-600', 'font-bold');
                link.classList.remove('text-green-900');
            }
        });
    }

    setupEventListeners() {
        // Logout button (desktop)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Logout button (mobile)
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => this.logout());
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                const icon = mobileMenuToggle.querySelector('i');
                if (mobileMenu.classList.contains('hidden')) {
                    icon.className = 'fas fa-bars text-xl';
                } else {
                    icon.className = 'fas fa-times text-xl';
                }
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu && mobileMenuToggle) {
                if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-bars text-xl';
                }
            }
        });

        // Close mobile menu when window is resized to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && mobileMenu) {
                mobileMenu.classList.add('hidden');
                const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                if (mobileMenuToggle) {
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-bars text-xl';
                }
            }
        });
    }

    async logout() {
        try {
            // Show loading state
            const logoutBtns = document.querySelectorAll('#logoutBtn, #mobileLogoutBtn');
            logoutBtns.forEach(btn => {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging out...';
            });

            // Call logout API
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('pharmalens_token');
            localStorage.removeItem('pharmalens_user');
            
            // Redirect to home page
            window.location.href = '/';
        }
    }

    // Method to refresh navbar when auth state changes
    refresh() {
        this.token = localStorage.getItem('pharmalens_token');
        this.user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        this.renderNavbar();
        this.setupEventListeners();
    }
}

// Initialize navbar when DOM is loaded
let navbar;
document.addEventListener('DOMContentLoaded', () => {
    navbar = new Navbar();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navbar;
}
