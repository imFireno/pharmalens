// Scan Page functionality
class ScanPage {
    constructor() {
        this.token = localStorage.getItem('pharmalens_token');
        this.user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        this.init();
    }

    init() {
        // Check if user is logged in
        if (!this.token || !this.user.id) {
            this.redirectToLogin();
            return;
        }

        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    redirectToLogin() {
        alert('Please login to access the scan feature.');
        window.location.href = '/login';
    }

    setupEventListeners() {
        const uploadInput = document.getElementById('upload');
        const uploadForm = document.getElementById('uploadForm');
        const removeImageBtn = document.getElementById('removeImage');

        // File input change
        uploadInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Form submission
        uploadForm.addEventListener('submit', (e) => this.handleScan(e));
        
        // Remove image
        removeImageBtn.addEventListener('click', () => this.removeImage());
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea').parentElement;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.highlight(uploadArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.unhighlight(uploadArea), false);
        });

        // Handle dropped files
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('border-green-500', 'bg-green-50');
    }

    unhighlight(element) {
        element.classList.remove('border-green-500', 'bg-green-50');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const uploadInput = document.getElementById('upload');
            uploadInput.files = files;
            this.handleFileSelect({ target: uploadInput });
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        this.displayPreview(file);
    }

    displayPreview(file) {
        const preview = document.getElementById('preview');
        const previewContainer = document.getElementById('previewContainer');
        const uploadArea = document.getElementById('uploadArea').parentElement;

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            uploadArea.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    removeImage() {
        const uploadInput = document.getElementById('upload');
        const preview = document.getElementById('preview');
        const previewContainer = document.getElementById('previewContainer');
        const uploadArea = document.getElementById('uploadArea').parentElement;
        const resultsSection = document.getElementById('resultsSection');

        uploadInput.value = '';
        preview.src = '';
        previewContainer.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    }

    async handleScan(e) {
        e.preventDefault();
        
        const uploadInput = document.getElementById('upload');
        const file = uploadInput.files[0];
        
        if (!file) {
            alert('Please select an image first.');
            return;
        }

        this.showLoading(true);
        this.hideResults();

        try {
            const formData = new FormData();
            formData.append('image', file);
            // Add scan_date in WIB (Asia/Jakarta) timezone
            const nowJakarta = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
            const isoJakarta = new Date(nowJakarta).toISOString();
            formData.append('scan_date', isoJakarta);

            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Scan failed');
            }

            if (result.success) {
                this.displayResults(result);
            } else {
                throw new Error('Scan processing failed');
            }

        } catch (error) {
            console.error('Scan error:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const scanBtn = document.getElementById('scanBtn');

        if (show) {
            loadingState.classList.remove('hidden');
            scanBtn.disabled = true;
            scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        } else {
            loadingState.classList.add('hidden');
            scanBtn.disabled = false;
            scanBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Scan Medicine';
        }
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.add('hidden');
    }

    displayResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        const scanResults = document.getElementById('scanResults');

        scanResults.innerHTML = `
            <div class="space-y-6">
                <!-- OCR Results -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 class="font-semibold text-blue-800 mb-3 flex items-center">
                        <i class="fas fa-eye mr-2"></i>Text Detected (OCR)
                    </h4>
                    <div class="bg-white p-4 rounded border">
                        <pre class="text-sm text-gray-700 whitespace-pre-wrap">${result.ocrResult || 'No text detected'}</pre>
                    </div>
                </div>

                <!-- AI Analysis -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 class="font-semibold text-green-800 mb-3 flex items-center">
                        <i class="fas fa-brain mr-2"></i>AI Analysis
                    </h4>
                    <div class="bg-white p-4 rounded border">
                        <div class="text-sm text-gray-700 whitespace-pre-wrap">${result.aiAnalysis || 'No analysis available'}</div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-cog mr-2"></i>Actions
                    </h4>
                    <div class="flex flex-wrap gap-3">
                        <button onclick="scanPage.saveToHistory(${result.scanId})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <i class="fas fa-save mr-2"></i>Saved to History
                        </button>
                        <a href="/history" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <i class="fas fa-history mr-2"></i>View All History
                        </a>
                        <button onclick="scanPage.scanAnother()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <i class="fas fa-plus mr-2"></i>Scan Another
                        </button>
                    </div>
                </div>

                <!-- Success Message -->
                <div class="bg-green-100 border border-green-300 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-green-600 mr-3"></i>
                        <div>
                            <p class="font-semibold text-green-800">Scan Completed Successfully!</p>
                            <p class="text-green-700 text-sm">Your scan has been processed and saved to your history.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showError(message) {
        const resultsSection = document.getElementById('resultsSection');
        const scanResults = document.getElementById('scanResults');

        scanResults.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                <div class="flex items-center mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 mr-3 text-xl"></i>
                    <h4 class="font-semibold text-red-800">Scan Failed</h4>
                </div>
                <p class="text-red-700 mb-4">${message}</p>
                <div class="flex flex-wrap gap-3">
                    <button onclick="scanPage.scanAnother()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        <i class="fas fa-redo mr-2"></i>Try Again
                    </button>
                    <a href="/history" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        <i class="fas fa-history mr-2"></i>View History
                    </a>
                </div>
            </div>
        `;

        resultsSection.classList.remove('hidden');
    }

    scanAnother() {
        this.removeImage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    saveToHistory(scanId) {
        // This is just for UI feedback - the scan is already saved
        const button = event.target;
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }
}

// Initialize scan page when DOM is loaded
let scanPage;
document.addEventListener('DOMContentLoaded', () => {
    scanPage = new ScanPage();
});
