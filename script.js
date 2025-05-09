// Books data
let booksData = [];
let filteredBooks = [];
let currentPage = 1;
const booksPerPage = 15; // 5x3 grid
let currentFilter = 'all';
let currentGenreFilter = 'all';
let uniqueGenres = [];

// Navigation setup
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                if (section.id === target) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    // CTA buttons in home section
    const ctaButtons = document.querySelectorAll('.cta-btn');
    ctaButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(navItem => {
                if (navItem.getAttribute('data-section') === target) {
                    navItem.classList.add('active');
                } else {
                    navItem.classList.remove('active');
                }
            });
            
            // Show target section
            sections.forEach(section => {
                if (section.id === target) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            // Scroll to top of the new section
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Set up pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderBooks(getPagedBooks());
            updatePaginationControls();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderBooks(getPagedBooks());
            updatePaginationControls();
        }
    });

    // Set up event listeners for main filters
    const primaryFilterButtons = document.querySelectorAll('.primary-filter');
    primaryFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('active') && currentFilter !== 'all') {
                // Deselect current filter and select "all" instead
                primaryFilterButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector('.primary-filter[data-filter="all"]').classList.add('active');
                currentFilter = 'all';
            } else {
                // Standard filter selection
                primaryFilterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentFilter = button.getAttribute('data-filter');
            }
            currentPage = 1; // Reset to first page when filter changes
            applyFilters();
        });
    });
    
    // Set up event listener for genre filters
    document.querySelector('.secondary-filters').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            const genreButtons = document.querySelectorAll('.secondary-filters .filter-btn');
            
            if (e.target.classList.contains('active') && currentGenreFilter !== 'all') {
                // Deselect current filter and select "all" instead
                genreButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector('.secondary-filters .filter-btn[data-filter="all"]').classList.add('active');
                currentGenreFilter = 'all';
            } else {
                // Standard filter selection
                genreButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentGenreFilter = e.target.getAttribute('data-filter');
            }
            
            currentPage = 1; // Reset to first page
            applyFilters();
        }
    });

    // Set up event listener for search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        currentPage = 1; // Reset to first page when search changes
        applyFilters();
    });
    
    // Add enter key support for search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            currentPage = 1;
            applyFilters();
        }
    });
    
    // Initialize the application
    loadAllBooksData();
    
    // Setup legal text links
    setupLegalLinks();
});

// Setup legal text links (Impressum and Datenschutzerklärung)
function setupLegalLinks() {
    const modal = document.getElementById('legal-modal');
    const closeModal = document.querySelector('.close-modal');
    const legalTitle = document.getElementById('legal-title');
    const legalContent = document.getElementById('legal-content');
    
    // Impressum link
    document.getElementById('imprint-link').addEventListener('click', function(e) {
        e.preventDefault();
        loadLegalText('imprint.txt', 'Impressum');
    });
    
    // Datenschutzerklärung link
    document.getElementById('privacy-link').addEventListener('click', function(e) {
        e.preventDefault();
        loadLegalText('privacy_policy.txt', 'Datenschutzerklärung');
    });
    
    // Close modal when clicking on X
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Load legal text from file
    function loadLegalText(filename, title) {
        fetch(`legal_texts/${filename}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                // Use marked.js to parse markdown
                legalTitle.textContent = title;
                legalContent.innerHTML = marked.parse(text);
                modal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading legal text:', error);
                legalTitle.textContent = title;
                legalContent.innerHTML = '<p>Fehler beim Laden des Textes. Bitte versuchen Sie es später erneut.</p>';
                modal.style.display = 'block';
            });
    }
}

// Load books data from CSV file
function loadAllBooksData() {
    // Show loader
    document.getElementById('books-loader').style.display = 'block';
    
    // Use fetch API to load the CSV file
    fetch('LitPro_list_of_all_books_read_so_far.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            // Parse CSV using PapaParse
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results) {
                    booksData = results.data;
                    
                    // Sort books by date (newest first)
                    booksData.sort((a, b) => {
                        if (!a.Lesedatum) return 1;
                        if (!b.Lesedatum) return -1;
                        
                        const dateA = parseGermanDate(a.Lesedatum);
                        const dateB = parseGermanDate(b.Lesedatum);
                        
                        return dateB - dateA;
                    });
                    
                    filteredBooks = [...booksData];
                    
                    // Extract unique genres for filters
                    uniqueGenres = [...new Set(booksData.filter(book => book.Genre).map(book => book.Genre))];
                    
                    // Create genre filter buttons
                    createGenreFilters(uniqueGenres);
                    
                    // Hide loader
                    document.getElementById('books-loader').style.display = 'none';
                    
                    // Update book grid
                    renderBooks(getPagedBooks());
                    updatePaginationControls();
                    
                    // Update statistics
                    updateStatistics();
                    
                    // Generate charts
                    generateCharts();
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    document.getElementById('books-loader').style.display = 'none';
                    document.getElementById('books-container').innerHTML = '<div class="no-results">Fehler beim Laden der Bücher</div>';
                }
            });
        })
        .catch(error => {
            console.error('Error loading CSV file:', error);
            document.getElementById('books-loader').style.display = 'none';
            document.getElementById('books-container').innerHTML = '<div class="no-results">Fehler beim Laden der CSV-Datei</div>';
        });
}

// Parse German date format (DD.MM.YYYY)
function parseGermanDate(dateStr) {
    if (!dateStr) return new Date(0); // Return oldest date possible if empty
    
    const parts = dateStr.split('.');
    if (parts.length !== 3) return new Date(0);
    
    // Create Date object (months are 0-indexed)
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

// Create genre filter buttons
function createGenreFilters(genres) {
    const genreFiltersContainer = document.querySelector('.genre-filters');
    genreFiltersContainer.innerHTML = '';
    
    // Sort genres alphabetically
    genres.sort();
    
    // Add event listener for "Alle Genres" button
    const allGenresBtn = document.querySelector('.secondary-filters .filter-btn[data-filter="all"]');
    allGenresBtn.addEventListener('click', () => {
        // Remove active class from all genre buttons
        document.querySelectorAll('.secondary-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
        // Add active class to this button
        allGenresBtn.classList.add('active');
        
        currentGenreFilter = 'all';
        currentPage = 1; // Reset to first page
        applyFilters();
    });
    
    genres.forEach(genre => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.setAttribute('data-filter', genre);
        button.textContent = genre;
        
        genreFiltersContainer.appendChild(button);
    });
}

// Apply filters to books
function applyFilters() {
    console.log("applyFilters aufgerufen mit:", {
        searchTerm: document.getElementById('search-input').value,
        currentFilter,
        currentGenreFilter
    });
    
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredBooks = booksData.filter(book => {
        // Filter by category if not "all"
        const categoryMatch = currentFilter === 'all' || book.Kategorie === currentFilter;
        
        // Filter by genre if not "all"
        const genreMatch = currentGenreFilter === 'all' || book.Genre === currentGenreFilter;
        
        // Search term matching - make sure to check if properties exist and are strings
        const searchMatch = !searchTerm || 
            (book.Titel && typeof book.Titel === 'string' && book.Titel.toLowerCase().includes(searchTerm)) || 
            (book.Autor && typeof book.Autor === 'string' && book.Autor.toLowerCase().includes(searchTerm)) || 
            (book.Genre && typeof book.Genre === 'string' && book.Genre.toLowerCase().includes(searchTerm));
        
        return categoryMatch && genreMatch && searchMatch;
    });
    
    console.log(`Gefunden: ${filteredBooks.length} Bücher`);
    
    renderBooks(getPagedBooks());
    updatePaginationControls();
}

// Get books for current page
function getPagedBooks() {
    const startIndex = (currentPage - 1) * booksPerPage;
    return filteredBooks.slice(startIndex, startIndex + booksPerPage);
}

// Update pagination buttons and indicator
function updatePaginationControls() {
    const totalPages = Math.max(1, Math.ceil(filteredBooks.length / booksPerPage));
    
    document.getElementById('page-indicator').textContent = `Seite ${currentPage} von ${totalPages}`;
    
    // Disable/enable buttons
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

// Render books to the grid
function renderBooks(books) {
    const booksContainer = document.getElementById('books-container');
    booksContainer.innerHTML = '';
    
    if (books.length === 0) {
        booksContainer.innerHTML = '<div class="no-results">Keine Bücher gefunden</div>';
        return;
    }
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // Default image path - changed to use local default_image.png
        const defaultImage = 'images/default_image.png';
        
        bookCard.innerHTML = `
            <div style="position: relative;">
                <img src="${book.CoverURL || defaultImage}" alt="${book.Titel || 'Buchcover'}" class="book-image" onerror="this.src='images/default_image.png'; this.onerror=null;">
                <div class="book-category">${book.Kategorie || 'Unbekannt'}</div>
            </div>
            <div class="book-info">
                <div class="book-title">${book.Titel || 'Unbekannter Titel'}</div>
                <div class="book-author">${book.Autor || 'Unbekannter Autor'}</div>
                <div class="book-genre">${book.Genre || 'Unbekanntes Genre'}</div>
                <div class="book-date">${book.Lesedatum ? `Gelesen: ${book.Lesedatum}` : 'Datum unbekannt'}</div>
            </div>
        `;
        
        booksContainer.appendChild(bookCard);
    });
}

// Update statistics based on the books data
function updateStatistics() {
    // Calculate statistics
    const totalBooks = booksData.length;
    const totalClassics = booksData.filter(book => book.Kategorie === 'Klassiker').length;
    const totalSecondary = booksData.filter(book => book.Kategorie === 'Zweitbuch').length;
    
    // Get unique genres
    const genres = [...new Set(booksData.filter(book => book.Genre).map(book => book.Genre))];
    const totalGenres = genres.length;
    
    // Update the stats in the DOM
    document.getElementById('total-books').textContent = totalBooks;
    document.getElementById('total-classics').textContent = totalClassics;
    document.getElementById('total-secondary').textContent = totalSecondary;
    document.getElementById('total-genres').textContent = totalGenres;
}

// Generate charts based on book data
function generateCharts() {
    generateGenresChart();
    generateCategoryChart();
    generateStackedYearlyChart();
}

// Create a chart comparing classic vs. second books
function generateCategoryChart() {
    const categories = ['Klassiker', 'Zweitbuch'];
    const counts = categories.map(category => 
        booksData.filter(book => book.Kategorie === category).length
    );
    
    // Create chart
    const ctx = document.getElementById('classic-vs-second-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: ['#2F4F4F', '#5BA3A3'],
                borderColor: '#f0f0f0',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create a stacked bar chart showing books by year and genre
function generateStackedYearlyChart() {
    // Get years from data
    const years = [];
    booksData.forEach(book => {
        if (book.Lesedatum) {
            const parts = book.Lesedatum.split('.');
            if (parts.length === 3) {
                const year = parts[2];
                if (!years.includes(year)) {
                    years.push(year);
                }
            }
        }
    });
    
    // Sort years chronologically
    years.sort();
    
    // Get top genres (limit to top 8 for readability)
    const genreCounts = {};
    booksData.forEach(book => {
        if (book.Genre) {
            genreCounts[book.Genre] = (genreCounts[book.Genre] || 0) + 1;
        }
    });
    
    const topGenres = Object.keys(genreCounts)
        .sort((a, b) => genreCounts[b] - genreCounts[a])
        .slice(0, 8);
    
    // Prepare data for each genre
    const datasets = topGenres.map((genre, index) => {
        // Create a color palette
        const colors = [
            '#2F4F4F', '#3D6B6B', '#4C8787', '#5BA3A3', 
            '#6ABFBF', '#79DBDB', '#88F7F7', '#97FFFF'
        ];
        
        return {
            label: genre,
            data: years.map(year => {
                return booksData.filter(book => {
                    if (!book.Lesedatum || !book.Genre) return false;
                    
                    const dateParts = book.Lesedatum.split('.');
                    return dateParts.length === 3 && 
                           dateParts[2] === year && 
                           book.Genre === genre;
                }).length;
            }),
            backgroundColor: colors[index % colors.length]
        };
    });
    
    // Create chart
    const ctx = document.getElementById('yearly-stacked-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Jahr'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Anzahl Bücher'
                    },
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create a chart showing distribution of genres
function generateGenresChart() {
    const genreCounts = {};
    
    // Count books by genre
    booksData.forEach(book => {
        if (book.Genre) {
            genreCounts[book.Genre] = (genreCounts[book.Genre] || 0) + 1;
        }
    });
    
    // Sort by count (descending)
    const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
    
    // Take top 8 genres for readability
    const topGenres = sortedGenres.slice(0, 8);
    const otherCount = sortedGenres.slice(8).reduce((sum, genre) => sum + genreCounts[genre], 0);
    
    const labels = [...topGenres];
    const data = topGenres.map(genre => genreCounts[genre]);
    
    // Add "Other" category if there are more genres
    if (otherCount > 0) {
        labels.push('Andere');
        data.push(otherCount);
    }
    
    // Create chart
    const ctx = document.getElementById('genres-chart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#2F4F4F', '#3D6B6B', '#4C8787', '#5BA3A3', '#6ABFBF',
                    '#79DBDB', '#88F7F7', '#97FFFF', '#A6FFFF'
                ],
                borderColor: '#f0f0f0',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            family: 'Segoe UI'
                        }
                    }
                }
            }
        }
    });
}