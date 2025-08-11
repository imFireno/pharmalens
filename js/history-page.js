// History Page functionality
class HistoryPage {
    constructor() {
        this.token = localStorage.getItem('pharmalens_token');
        this.user = JSON.parse(localStorage.getItem('pharmalens_user') || '{}');
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.allHistory = [];
        this.filteredHistory = [];
        this.init();
    }

    init() {
        // Check if user is logged in
        if (!this.token || !this.user.id) {
            this.redirectToLogin();
            return;
        }

        this.setupEventListeners();
        this.loadHistoryData();
    }

    redirectToLogin() {
        alert('Please login to access your scan history.');
        window.location.href = '/login';
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchHistory');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshHistory');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadHistoryData());
        }

        // Modal close
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (prevPage) {
            prevPage.addEventListener('click', () => this.changePage(-1));
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => this.changePage(1));
        }
    }

    async loadHistoryData() {
        try {
            this.showLoading(true);
            
            // Load scan history and stats in parallel
            await Promise.all([
                this.loadScanHistory(),
                this.loadStats()
            ]);
            
        } catch (error) {
            console.error('Error loading history data:', error);
            this.showError('Failed to load history data');
        } finally {
            this.showLoading(false);
        }
    }

    async loadScanHistory() {
        try {
            const response = await fetch('/api/scan/history', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch scan history');
            }

            const data = await response.json();
            this.allHistory = data.history || [];
            this.filteredHistory = [...this.allHistory];
            this.displayHistory();
            
        } catch (error) {
            console.error('Error loading scan history:', error);
            this.showEmptyState();
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
            this.displayStats(data.stats);
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    displayStats(stats) {
        document.getElementById('totalScans').textContent = stats.myScans || 0;
        
        // Calculate month and week scans from history
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const monthScans = this.allHistory.filter(scan => {
            const scanDate = new Date(scan.scan_date);
            return scanDate.getMonth() === thisMonth && scanDate.getFullYear() === thisYear;
        }).length;

        const weekScans = this.allHistory.filter(scan => {
            const scanDate = new Date(scan.scan_date);
            return scanDate >= oneWeekAgo;
        }).length;

        document.getElementById('monthScans').textContent = monthScans;
        document.getElementById('weekScans').textContent = weekScans;
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');
        const emptyHistory = document.getElementById('emptyHistory');
        
        if (!this.filteredHistory || this.filteredHistory.length === 0) {
            this.showEmptyState();
            return;
        }

        // Show history list, hide empty state
        historyList.classList.remove('hidden');
        emptyHistory.classList.add('hidden');

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredHistory.slice(startIndex, endIndex);

        // Generate history items HTML
        historyList.innerHTML = pageItems.map(scan => `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" 
                 onclick="historyPage.viewScanDetails(${scan.id})">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-blue-200 hover:border-blue-300 transition-colors">
                                ${scan.image_filename ? 
                                    `<img src="/uploads/${scan.image_filename}" 
                                         alt="Scan Image" 
                                         class="object-cover w-full h-full hover:scale-105 transition-transform cursor-pointer" 
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                         onclick="historyPage.showImagePreview('/uploads/${scan.image_filename}', 'Scan #${scan.id}')">
                                     <div class="hidden w-full h-full bg-red-100 items-center justify-center">
                                         <i class="fas fa-exclamation-triangle text-red-500 text-sm"></i>
                                     </div>` 
                                    : 
                                    `<i class="fas fa-camera text-blue-600 text-2xl"></i>`}
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-800">Scan #${scan.id}</h3>
                                <p class="text-sm text-gray-500">
                                    <i class="fas fa-calendar mr-1"></i>
                                    ${new Date(scan.scan_date).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                        
                        <!-- OCR Preview -->
                        <div class="bg-gray-50 rounded-lg p-3 mb-3">
                            <p class="text-xs text-gray-600 mb-1">OCR Result Preview:</p>
                            <p class="text-sm text-gray-800 line-clamp-2">
                                ${scan.ocr_result ? this.truncateText(scan.ocr_result, 100) : 'No text detected'}
                            </p>
                        </div>
                        
                        <!-- AI Analysis Preview -->
                        <div class="bg-green-50 rounded-lg p-3">
                            <p class="text-xs text-green-600 mb-1">AI Analysis Preview:</p>
                            <p class="text-sm text-green-800 line-clamp-2">
                                ${scan.ai_analysis ? this.truncateText(scan.ai_analysis, 120) : 'No analysis available'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="ml-4 text-right">
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            <i class="fas fa-check mr-1"></i>Completed
                        </span>
                        <div class="mt-2">
                            <button class="text-blue-600 hover:text-blue-800 text-sm">
                                <i class="fas fa-eye mr-1"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Update pagination
        this.updatePagination();
    }

    showEmptyState() {
        const historyList = document.getElementById('historyList');
        const emptyHistory = document.getElementById('emptyHistory');
        
        historyList.classList.add('hidden');
        emptyHistory.classList.remove('hidden');
    }

    showLoading(show) {
        const loadingHistory = document.getElementById('loadingHistory');
        const historyList = document.getElementById('historyList');
        const emptyHistory = document.getElementById('emptyHistory');
        
        if (show) {
            loadingHistory.classList.remove('hidden');
            historyList.classList.add('hidden');
            emptyHistory.classList.add('hidden');
        } else {
            loadingHistory.classList.add('hidden');
        }
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredHistory = [...this.allHistory];
        } else {
            this.filteredHistory = this.allHistory.filter(scan => {
                return (
                    scan.ocr_result?.toLowerCase().includes(searchTerm) ||
                    scan.ai_analysis?.toLowerCase().includes(searchTerm) ||
                    scan.id.toString().includes(searchTerm)
                );
            });
        }
        
        this.currentPage = 1; // Reset to first page
        this.displayHistory();
    }

    async viewScanDetails(scanId) {
        try {
            const response = await fetch(`/api/scan/${scanId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch scan details');
            }

            const data = await response.json();
            this.showModal(data.scan);
            
        } catch (error) {
            console.error('Error loading scan details:', error);
            alert('Failed to load scan details');
        }
    }

    showModal(scan) {
        const modal = document.getElementById('scanModal');
        const detailsContainer = document.getElementById('scanDetails');
        
        detailsContainer.innerHTML = `
            <div class="space-y-6">
                <!-- Scan Image -->
                <div class="flex justify-center mb-4">
                    ${scan.image_filename ? 
                        `<div class="relative group">
                            <img src="/uploads/${scan.image_filename}" 
                                 alt="Scan Image" 
                                 class="object-contain max-h-64 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-200 hover:border-blue-300" 
                                 onclick="historyPage.showImagePreview('/uploads/${scan.image_filename}', 'Scan #${scan.id}')"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="hidden text-center p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                <i class="fas fa-exclamation-triangle text-gray-400 text-3xl mb-2"></i>
                                <p class="text-gray-500">Image not available</p>
                            </div>
                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div class="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                                    <i class="fas fa-search-plus mr-1"></i>Click to enlarge
                                </div>
                            </div>
                         </div>` 
                        : 
                        `<div class="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <i class="fas fa-camera text-gray-400 text-4xl mb-3"></i>
                            <p class="text-gray-500">No image available</p>
                         </div>`}
                </div>
                <!-- Scan Information -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-3 flex items-center">
                        <i class="fas fa-info-circle mr-2 text-blue-600"></i>Scan Information
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Scan ID:</span>
                            <span class="ml-2 font-medium">#${scan.id}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Date:</span>
                            <span class="ml-2 font-medium">${new Date(scan.scan_date).toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Status:</span>
                            <span class="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                <i class="fas fa-check mr-1"></i>Completed
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- OCR Results -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-semibold mb-3 flex items-center text-blue-800">
                        <i class="fas fa-eye mr-2"></i>OCR Results
                    </h4>
                    <div class="bg-white p-4 rounded border">
                        <pre class="text-sm text-gray-700 whitespace-pre-wrap">${scan.ocr_result || 'No text detected'}</pre>
                    </div>
                </div>
                
                <!-- AI Analysis -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-semibold mb-3 flex items-center text-green-800">
                        <i class="fas fa-brain mr-2"></i>AI Analysis
                    </h4>
                    <div class="bg-white p-4 rounded border">
                        <div class="text-sm text-gray-700 whitespace-pre-wrap">${scan.ai_analysis || 'No analysis available'}</div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-wrap gap-3 pt-4 border-t">
                    <button onclick="historyPage.closeModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        <i class="fas fa-times mr-2"></i>Close
                    </button>
                    <a href="/scan" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        <i class="fas fa-camera mr-2"></i>New Scan
                    </a>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('scanModal');
        modal.classList.add('hidden');
    }

    showImagePreview(imageSrc, title) {
        // Create image preview modal
        const imageModal = document.createElement('div');
        imageModal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4';
        imageModal.innerHTML = `
            <div class="relative max-w-4xl max-h-full">
                <div class="absolute top-4 right-4 z-10">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="bg-white rounded-lg p-4 max-h-full overflow-auto">
                    <div class="text-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                    </div>
                    <div class="flex justify-center">
                        <img src="${imageSrc}" 
                             alt="${title}" 
                             class="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div class="hidden text-center p-8">
                            <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-3"></i>
                            <p class="text-gray-600">Failed to load image</p>
                        </div>
                    </div>
                    <div class="mt-4 text-center">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-times mr-2"></i>Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add click outside to close
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                imageModal.remove();
            }
        });

        // Add escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                imageModal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        document.body.appendChild(imageModal);
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (totalPages <= 1) {
            pagination.classList.add('hidden');
            return;
        }
        
        pagination.classList.remove('hidden');
        pageInfo.textContent = `${this.currentPage} of ${totalPages}`;
        
        prevPage.disabled = this.currentPage === 1;
        nextPage.disabled = this.currentPage === totalPages;
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.displayHistory();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    showError(message) {
        const historyContainer = document.getElementById('historyContainer');
        historyContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-red-600 mb-2">Error Loading History</h3>
                <p class="text-red-500 mb-6">${message}</p>
                <button onclick="historyPage.loadHistoryData()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors">
                    <i class="fas fa-redo mr-2"></i>Try Again
                </button>
            </div>
        `;
    }
}

// Initialize history page when DOM is loaded
let historyPage;
document.addEventListener('DOMContentLoaded', () => {
    historyPage = new HistoryPage();
});
