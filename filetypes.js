
class FileTypesViewer {
    constructor() {
        this.allFileTypes = [];
        this.filteredFileTypes = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        
        // Initialize UI elements
        this.ui = {
            searchInput: document.getElementById('search'),
            searchBtn: document.getElementById('search-btn'),
            filetypeList: document.getElementById('filetype-list'),
            prevPageBtn: document.getElementById('prev-page'),
            nextPageBtn: document.getElementById('next-page'),
            pageInfo: document.getElementById('page-info'),
            detailsPanel: document.getElementById('details-panel'),
            detailExtension: document.getElementById('detail-extension'),
            detailContent: document.getElementById('detail-content'),
            closeDetailsBtn: document.getElementById('close-details'),
            categoryFilter: document.getElementById('category-filter')
        };
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load data
        this.loadData();
    }
    
    async loadData() {
        try {
            const response = await fetch('.filetypes/out/index.json');
            const data = await response.json();
            this.allFileTypes = Object.entries(data).map(([ext, info]) => ({
                extension: ext,
                ...info
            }));
            this.filteredFileTypes = [...this.allFileTypes];
            this.renderTable();
            this.populateCategoryFilter();
            
            // Update header with count
            document.querySelector('h1').textContent += ` (${this.allFileTypes.length} file types)`;
        } catch (error) {
            console.error('Error loading file types:', error);
            this.ui.filetypeList.innerHTML = '<tr><td colspan="3">Error loading file types data</td></tr>';
        }
    }
    
    populateCategoryFilter() {
        const categories = new Set();
        this.allFileTypes.forEach(filetype => {
            if (filetype.category) {
                categories.add(filetype.category);
            }
        });
        
        const sortedCategories = Array.from(categories).sort();
        this.ui.categoryFilter.innerHTML = `
            <option value="">All Categories</option>
            ${sortedCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        `;
        
        // Add count to category options
        sortedCategories.forEach(cat => {
            const count = this.allFileTypes.filter(ft => ft.category === cat).length;
            const option = this.ui.categoryFilter.querySelector(`option[value="${cat}"]`);
            if (option) {
                option.textContent += ` (${count})`;
            }
        });
    }
    
    renderTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedData = this.filteredFileTypes.slice(startIndex, endIndex);
        
        this.ui.filetypeList.innerHTML = paginatedData.map(filetype => `
            <tr data-extension="${filetype.extension}">
                <td>.${filetype.extension}</td>
                <td>${filetype.description || 'N/A'}</td>
                <td>${filetype.category || 'Unknown'}</td>
            </tr>
        `).join('');
        
        // Update pagination info
        const totalPages = Math.ceil(this.filteredFileTypes.length / this.itemsPerPage);
        this.ui.pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        
        // Disable/enable pagination buttons
        this.ui.prevPageBtn.disabled = this.currentPage === 1;
        this.ui.nextPageBtn.disabled = this.currentPage === totalPages;
    }
    
    async showDetails(extension) {
        try {
            const response = await fetch(`.filetypes/out/json/${extension}.json`);
            const details = await response.json();
            
            this.ui.detailExtension.textContent = `.${extension}`;
            this.ui.detailContent.innerHTML = this.generateDetailsHTML(details);
            this.ui.detailsPanel.style.display = 'block';
        } catch (error) {
            console.error('Error loading file type details:', error);
            this.ui.detailContent.innerHTML = '<p>Error loading details for this file type</p>';
        }
    }
    
    generateDetailsHTML(details) {
        return `
            <div class="detail-section">
                <h3>Basic Information</h3>
                <p><strong>Description:</strong> ${details.description || 'N/A'}</p>
                <p><strong>Category:</strong> ${details.category || 'Unknown'}</p>
                <p><strong>MIME Type:</strong> ${details.mime || 'N/A'}</p>
            </div>
            
            ${details.notes ? `
            <div class="detail-section">
                <h3>Notes</h3>
                <p>${details.notes}</p>
            </div>
            ` : ''}
            
            ${details.hex_signature || details.ascii_signature ? `
            <div class="detail-section">
                <h3>Signatures</h3>
                ${details.hex_signature ? `<p><strong>Hex Signature:</strong> ${details.hex_signature}</p>` : ''}
                ${details.ascii_signature ? `<p><strong>ASCII Signature:</strong> ${details.ascii_signature}</p>` : ''}
            </div>
            ` : ''}
            
            ${details.developer ? `
            <div class="detail-section">
                <h3>Developer Information</h3>
                <p><strong>Developer:</strong> ${details.developer}</p>
                ${details.developer_url ? `<p><strong>Developer URL:</strong> <a href="${details.developer_url}" target="_blank">${details.developer_url}</a></p>` : ''}
            </div>
            ` : ''}
        `;
    }
    
    applyFilters() {
        const searchTerm = this.ui.searchInput.value.toLowerCase();
        const categoryFilter = this.ui.categoryFilter.value;
        
        this.filteredFileTypes = this.allFileTypes.filter(filetype => {
            const matchesSearch = 
                filetype.extension.toLowerCase().includes(searchTerm) ||
                (filetype.description && filetype.description.toLowerCase().includes(searchTerm)) ||
                (filetype.category && filetype.category.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !categoryFilter || filetype.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
        
        this.currentPage = 1;
        this.renderTable();
    }
    
    initEventListeners() {
        // Search functionality
        this.ui.searchBtn.addEventListener('click', () => this.applyFilters());
        this.ui.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
        
        // Debounce search input
        this.ui.searchInput.addEventListener('input', () => {
            clearTimeout(this.searchDebounce);
            this.searchDebounce = setTimeout(() => this.applyFilters(), 300);
        });
        
        // Category filter
        this.ui.categoryFilter.addEventListener('change', () => this.applyFilters());
        
        // Pagination
        this.ui.prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });
        
        this.ui.nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredFileTypes.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable();
            }
        });
        
        // Row clicks
        this.ui.filetypeList.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                this.showDetails(row.dataset.extension);
            }
        });
        
        // Close details panel
        this.ui.closeDetailsBtn.addEventListener('click', () => {
            this.ui.detailsPanel.style.display = 'none';
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FileTypesViewer();
});
