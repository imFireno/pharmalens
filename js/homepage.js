// Homepage functionality
class Homepage {
    constructor() {
        this.token = localStorage.getItem('pharmalens_token');
        this.user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupHamburgerMenu();
    }

    setupEventListeners() {
        // CTA button event listeners
        const scanCTA = document.getElementById('scanCTA');
        const historyCTA = document.getElementById('historyCTA');

        if (scanCTA) {
            scanCTA.addEventListener('click', (e) => this.handleScanCTA(e));
        }

        if (historyCTA) {
            historyCTA.addEventListener('click', (e) => this.handleHistoryCTA(e));
        }
    }

    setupHamburgerMenu() {
        // Original hamburger menu functionality for mobile
        const hamburger = document.querySelector(".hamburger");
        const menu = document.querySelector(".menu");

        if (hamburger && menu) {
            hamburger.addEventListener("click", () => {
                hamburger.classList.toggle('is-active');
                menu.classList.toggle("menu-active");
            });

            window.addEventListener("scroll", () => {
                hamburger.classList.remove("is-active");
                menu.classList.remove("menu-active");
            });
        }
    }

    checkAuthStatus() {
        const isLoggedIn = this.token && this.user.id;
        const loginNotice = document.getElementById('loginNotice');
        const scanCTA = document.getElementById('scanCTA');
        const historyCTA = document.getElementById('historyCTA');

        if (!isLoggedIn) {
            // Show login notice
            if (loginNotice) {
                loginNotice.classList.remove('hidden');
            }

            // Update CTA buttons to show login requirement
            if (scanCTA) {
                scanCTA.classList.add('opacity-75');
                scanCTA.innerHTML = '<i class="fas fa-lock mr-2"></i>Login Required';
            }

            if (historyCTA) {
                historyCTA.classList.add('opacity-75');
                historyCTA.innerHTML = '<i class="fas fa-lock mr-2"></i>Login Required';
            }
        } else {
            // Hide login notice for logged in users
            if (loginNotice) {
                loginNotice.classList.add('hidden');
            }

            // Update CTA buttons for logged in users
            if (scanCTA) {
                scanCTA.classList.remove('opacity-75');
                scanCTA.innerHTML = '<i class="fas fa-camera mr-2"></i>Mulai Scan';
            }

            if (historyCTA) {
                historyCTA.classList.remove('opacity-75');
                historyCTA.innerHTML = '<i class="fas fa-history mr-2"></i>Lihat Riwayat';
            }
        }
    }

    handleScanCTA(e) {
        const isLoggedIn = this.token && this.user.id;
        
        if (!isLoggedIn) {
            e.preventDefault();
            this.showLoginPrompt('scan');
            return false;
        }

        // Allow navigation to scan page
        return true;
    }

    handleHistoryCTA(e) {
        const isLoggedIn = this.token && this.user.id;
        
        if (!isLoggedIn) {
            e.preventDefault();
            this.showLoginPrompt('history');
            return false;
        }

        // Allow navigation to history page
        return true;
    }

    showLoginPrompt(feature) {
        const featureName = feature === 'scan' ? 'scan obat' : 'melihat riwayat';
        
        if (confirm(`Anda perlu login terlebih dahulu untuk ${featureName}. Apakah Anda ingin login sekarang?`)) {
            window.location.href = '/login';
        }
    }

    // Method to refresh auth status (can be called from other scripts)
    refreshAuthStatus() {
        this.token = localStorage.getItem('pharmalens_token');
        this.user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        this.checkAuthStatus();
    }
}

// Initialize homepage when DOM is loaded
let homepage;
document.addEventListener('DOMContentLoaded', () => {
    homepage = new Homepage();
});

// Listen for auth state changes
window.addEventListener('storage', (e) => {
    if (e.key === 'pharmalens_token' || e.key === 'pharmalens_user') {
        if (homepage) {
            homepage.refreshAuthStatus();
        }
    }
});
