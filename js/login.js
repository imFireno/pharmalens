// Login dan Registrasi
// Login functionality
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is already logged in
        const token = localStorage.getItem('pharmalens_token');
        const user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        
        if (token && user.id) {
            this.redirectToDashboard(user.role);
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.querySelector('.sign-in form');
        const registerForm = document.querySelector('.sign-up form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Toggle between login and register forms
        this.setupFormToggle();
        
        // Real-time validation for registration
        this.setupRegistrationValidation();
        
        // Forgot password functionality
        this.setupForgotPassword();
    }

    setupFormToggle() {
        const container = document.querySelector('.container');
        const registerBtns = document.querySelectorAll('.register-btn');
        const loginBtns = document.querySelectorAll('.login-btn');

        registerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                container.classList.add('active');
            });
        });

        loginBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                container.classList.remove('active');
            });
        });
    }

    setupRegistrationValidation() {
        const registerForm = document.querySelector('.register-form');
        if (!registerForm) return;

        const usernameInput = registerForm.querySelector('input[name="username"]');
        const emailInput = registerForm.querySelector('input[name="email"]');
        const passwordInput = registerForm.querySelector('input[name="password"]');
        const confirmPasswordInput = registerForm.querySelector('input[name="confirmPassword"]');

        // Username validation
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                this.validateUsername(usernameInput);
            });
        }

        // Email validation
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this.validateEmail(emailInput);
            });
        }

        // Password validation
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword(passwordInput);
                if (confirmPasswordInput.value) {
                    this.validatePasswordMatch(passwordInput, confirmPasswordInput);
                }
            });
        }

        // Confirm password validation
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch(passwordInput, confirmPasswordInput);
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username') || formData.get('email');
        const password = formData.get('password');

        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user info
            localStorage.setItem('pharmalens_token', data.token);
            localStorage.setItem('pharmalens_user', JSON.stringify(data.user));

            // Show spectacular login success notification
            this.showLoginSuccess(data.user);
            
            // Redirect based on role
            setTimeout(() => {
                this.redirectToDashboard(data.user.role);
            }, 2500);

        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const termsAccepted = formData.get('terms');

        // Comprehensive validation
        if (!username || !email || !password || !confirmPassword) {
            this.showError('Semua field harus diisi');
            return;
        }

        if (!termsAccepted) {
            this.showError('Anda harus menyetujui syarat dan ketentuan');
            return;
        }

        if (username.length < 3) {
            this.showError('Username minimal 3 karakter');
            return;
        }

        if (password.length < 6) {
            this.showError('Password minimal 6 karakter');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Password dan konfirmasi password tidak cocok');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Format email tidak valid');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registrasi gagal');
            }

            // Store token and user info
            localStorage.setItem('pharmalens_token', data.token);
            localStorage.setItem('pharmalens_user', JSON.stringify(data.user));

            // Show registration success notification
            this.showRegistrationSuccess(data.user);
            
            // Redirect to user dashboard (new users are always 'user' role)
            setTimeout(() => {
                this.redirectToDashboard('user');
            }, 2500);

        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    // Validation helper functions
    validateUsername(input) {
        const value = input.value.trim();
        const isValid = value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value);
        
        this.setFieldValidation(input, isValid, 
            isValid ? 'Username tersedia' : 'Username minimal 3 karakter, hanya huruf, angka, dan underscore'
        );
        
        return isValid;
    }

    validateEmail(input) {
        const value = input.value.trim();
        const isValid = this.isValidEmail(value);
        
        this.setFieldValidation(input, isValid, 
            isValid ? 'Format email valid' : 'Format email tidak valid'
        );
        
        return isValid;
    }

    validatePassword(input) {
        const value = input.value;
        const isValid = value.length >= 6;
        
        this.setFieldValidation(input, isValid, 
            isValid ? 'Password cukup kuat' : 'Password minimal 6 karakter'
        );
        
        return isValid;
    }

    validatePasswordMatch(passwordInput, confirmPasswordInput) {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const isValid = password === confirmPassword && confirmPassword.length > 0;
        
        this.setFieldValidation(confirmPasswordInput, isValid, 
            isValid ? 'Password cocok' : 'Password tidak cocok'
        );
        
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setFieldValidation(input, isValid, message) {
        const inputBox = input.parentElement;
        let messageElement = inputBox.querySelector('.validation-message');
        
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'validation-message';
            inputBox.appendChild(messageElement);
        }
        
        messageElement.textContent = message;
        messageElement.className = `validation-message ${isValid ? 'success-message' : 'error-message'}`;
        messageElement.style.display = 'block';
        
        // Update input styling
        input.style.borderColor = isValid ? '#7bf1a8' : '#ff6b6b';
    }

    setupForgotPassword() {
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }
    }

    showForgotPasswordModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="forgotPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div class="text-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">Lupa Password?</h2>
                        <p class="text-gray-600 text-sm">Masukkan email Anda untuk mendapatkan link reset password</p>
                    </div>
                    
                    <form id="forgotPasswordForm">
                        <div class="mb-4">
                            <input type="email" id="forgotEmail" name="email" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" 
                                   placeholder="Email Anda" required>
                            <div class="error-message text-red-500 text-sm mt-1 hidden" id="forgotEmailError"></div>
                        </div>
                        
                        <div class="flex gap-3">
                            <button type="button" id="cancelForgotBtn" 
                                    class="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                                Batal
                            </button>
                            <button type="submit" id="sendResetBtn" 
                                    class="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                Kirim Link Reset
                            </button>
                        </div>
                    </form>
                    
                    <div id="forgotPasswordResult" class="mt-4 p-3 rounded-lg hidden">
                        <p id="forgotPasswordMessage"></p>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup event listeners
        const modal = document.getElementById('forgotPasswordModal');
        const form = document.getElementById('forgotPasswordForm');
        const cancelBtn = document.getElementById('cancelForgotBtn');
        const sendBtn = document.getElementById('sendResetBtn');

        // Close modal events
        cancelBtn.addEventListener('click', () => this.closeForgotPasswordModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeForgotPasswordModal();
        });

        // Form submit
        form.addEventListener('submit', (e) => this.handleForgotPassword(e));
    }

    closeForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.remove();
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('forgotEmail').value;
        const sendBtn = document.getElementById('sendResetBtn');
        const resultDiv = document.getElementById('forgotPasswordResult');
        const messageP = document.getElementById('forgotPasswordMessage');

        if (!email) {
            this.showForgotError('Email diperlukan');
            return;
        }

        // Set loading state
        sendBtn.disabled = true;
        sendBtn.textContent = 'Mengirim...';

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Gagal mengirim email reset');
            }

            // Show success message
            resultDiv.className = 'mt-4 p-3 rounded-lg bg-green-100 border border-green-300';
            messageP.textContent = data.message;
            resultDiv.classList.remove('hidden');

            // For testing purposes, show reset link if provided
            if (data.resetUrl) {
                const linkHTML = `<br><br><strong>Link Reset (untuk testing):</strong><br>
                    <a href="${data.resetUrl}" class="text-blue-600 hover:underline break-all">${data.resetUrl}</a>`;
                messageP.innerHTML = data.message + linkHTML;
            }

            // Hide form
            document.getElementById('forgotPasswordForm').style.display = 'none';

        } catch (error) {
            console.error('Forgot password error:', error);
            this.showForgotError(error.message);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Kirim Link Reset';
        }
    }

    showForgotError(message) {
        const resultDiv = document.getElementById('forgotPasswordResult');
        const messageP = document.getElementById('forgotPasswordMessage');
        
        resultDiv.className = 'mt-4 p-3 rounded-lg bg-red-100 border border-red-300';
        messageP.textContent = message;
        resultDiv.classList.remove('hidden');
    }

    redirectToDashboard(role) {
        if (role === 'admin') {
            window.location.href = '/admin';
        } else {
            // Redirect regular users to homepage
            window.location.href = '/';
        }
    }

    setLoading(isLoading) {
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(button => {
            if (isLoading) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
            } else {
                button.disabled = false;
                button.innerHTML = button.classList.contains('btn-login') ? 'Sign In' : 'Sign Up';
            }
        });
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc2626',
            toast: false,
            position: 'center',
            showConfirmButton: true,
            timer: false,
            customClass: {
                popup: 'animated fadeInDown'
            }
        });
    }

    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#059669',
            toast: false,
            position: 'center',
            showConfirmButton: true,
            timer: 2000,
            timerProgressBar: true,
            customClass: {
                popup: 'animated fadeInDown'
            }
        });
    }

    showLoginSuccess(user) {
        Swal.fire({
            icon: 'success',
            title: '🎉 Selamat Datang!',
            html: `
                <div class="text-center">
                    <div class="mb-4">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-3">
                            <i class="fas fa-user-check text-3xl text-green-600"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Halo, ${user.username}!</h3>
                    <p class="text-gray-600 mb-4">Login berhasil sebagai <span class="font-semibold text-green-600">${user.role === 'admin' ? 'Administrator' : 'User'}</span></p>
                    <div class="flex items-center justify-center text-sm text-gray-500">
                        <i class="fas fa-clock mr-2"></i>
                        <span>Mengalihkan ke dashboard...</span>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'animated bounceIn',
                timerProgressBar: 'bg-green-600'
            },
            didOpen: () => {
                // Add some confetti effect
                const popup = Swal.getPopup();
                popup.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                popup.style.border = '2px solid #22c55e';
                popup.style.boxShadow = '0 25px 50px -12px rgba(34, 197, 94, 0.25)';
            }
        });
    }

    showRegistrationSuccess(user) {
        Swal.fire({
            icon: 'success',
            title: '🎊 Selamat!',
            html: `
                <div class="text-center">
                    <div class="mb-4">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-3">
                            <i class="fas fa-user-plus text-3xl text-blue-600"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Akun berhasil dibuat!</h3>
                    <p class="text-gray-600 mb-2">Selamat datang, <span class="font-semibold text-blue-600">${user.username}</span>!</p>
                    <p class="text-sm text-gray-500 mb-4">Anda telah terdaftar sebagai pengguna PharmaLens</p>
                    <div class="flex items-center justify-center text-sm text-gray-500">
                        <i class="fas fa-rocket mr-2"></i>
                        <span>Mengalihkan ke dashboard...</span>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'animated tada',
                timerProgressBar: 'bg-blue-600'
            },
            didOpen: () => {
                const popup = Swal.getPopup();
                popup.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                popup.style.border = '2px solid #3b82f6';
                popup.style.boxShadow = '0 25px 50px -12px rgba(59, 130, 246, 0.25)';
            }
        });
    }

    // Keep the old showMessage method for backward compatibility, but use SweetAlert
    showMessage(message, type) {
        if (type === 'error') {
            this.showError(message);
        } else {
            this.showSuccess(message);
        }
    }
}

// Initialize auth manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    new AuthManager();
});
