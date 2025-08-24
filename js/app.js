// --- Component and Page Loading ---
async function loadComponent(componentName) {
    try {
        const response = await fetch(`components/${componentName}.html`);
        if (!response.ok) throw new Error('Component not found');
        return await response.text();
    } catch (error) {
        console.error(`Error loading component: ${componentName}`, error);
        return '';
    }
}

async function loadPageContent(pageName) {
    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) throw new Error('Page not found');
        return await response.text();
    } catch (error) {
        console.error(`Error loading page: ${pageName}`, error);
        return '<div class="text-center p-8">Page not found</div>';
    }
}

// --- RSVP Form Handler ---
function attachRsvpFormHandler() {
    const rsvpForm = document.getElementById('rsvp-form');
    const confirmationMessage = document.getElementById('rsvp-confirmation');
    const submitButton = rsvpForm?.querySelector('button[type="submit"]');

    if (!rsvpForm || !submitButton) return;

    rsvpForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const scriptURL = 'https://script.google.com/macros/s/AKfycbycvufhMJUPCMWZwGuD1-I2JHY6NbHlC7SfXOeTsu1RyNZpkwuqtsrZh4BOHWrucSRL_A/exec';
        const formData = new FormData(rsvpForm);
        
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            const response = await fetch(scriptURL, { 
                method: 'POST', 
                body: formData 
            });
            const data = await response.json();
            
            if (data.result === 'success') {
                rsvpForm.style.display = 'none';
                confirmationMessage.classList.remove('hidden');
            } else {
                throw new Error(data.error || 'Unknown error from Google Script');
            }
        } catch (error) {
            console.error('Error!', error.message);
            submitButton.disabled = false;
            submitButton.textContent = 'Submit RSVP';
            
            let errorMessageDiv = rsvpForm.querySelector('.error-message');
            if (!errorMessageDiv) {
                errorMessageDiv = document.createElement('div');
                errorMessageDiv.className = 'error-message text-center mt-4 p-4 bg-red-100 text-red-800 rounded-md';
                rsvpForm.appendChild(errorMessageDiv);
            }
            errorMessageDiv.textContent = 'Oops! There was a problem submitting your RSVP. Please try again later.';
        }
    });
}

// --- Router and Navigation ---
let currentPage = 'home';

async function updateActiveNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('data-page') || link.getAttribute('href').substring(1);
        const isActive = linkPage === currentPage;
        
        if (isActive) {
            // Active page: rose text with underline, beige background
            link.classList.add('text-rose-600', 'bg-[#ebe8e1]');
            link.classList.remove('text-white', 'text-black', 'text-gray-700', 'bg-rose-600');
        } else {
            // Inactive page: black text, beige background
            link.classList.add('text-black', 'bg-[#ebe8e1]');
            link.classList.remove('text-rose-600', 'text-white', 'text-gray-700', 'bg-rose-600');
        }
    });
}

// --- Scroll Handling ---
function setupScrollListener() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('shadow-lg', 'bg-[#ebe8e1]');
            nav.classList.remove('bg-[#ebe8e1]/90');
        } else {
            nav.classList.remove('shadow-lg', 'bg-[#ebe8e1]');
            nav.classList.add('bg-[#ebe8e1]/90');
        }
    });
}

// --- Page Loading Logic ---
async function loadPage(pageName) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    currentPage = pageName || 'home';
    
    // Show loading state
    mainContent.innerHTML = '<div class="text-center p-12">Loading...</div>';
    
    try {
        // Load and render the page content
        const content = await loadPageContent(currentPage);
        mainContent.innerHTML = content;
        
        // Update navigation
        await updateActiveNav();
        
        // Simple scroll behavior that doesn't depend on navigation element
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };

        // Use setTimeout to ensure any pending DOM updates are complete
        setTimeout(() => {
            try {
                if (currentPage === 'home') {
                    scrollToTop();
                }
                // Removed auto-scrolling for RSVP and other pages
            } catch (error) {
                console.error('Error during scroll handling:', error);
                // Fallback: do nothing instead of auto-scrolling
            }
        }, 50); // Small delay to ensure DOM is ready
        
        // Attach event listeners if needed
        if (currentPage === 'rsvp') {
            attachRsvpFormHandler();
        }
    } catch (error) {
        console.error('Error rendering page:', error);
        mainContent.innerHTML = `
            <div class="text-center p-8">
                <h2 class="text-2xl text-red-600 mb-4">Error loading page</h2>
                <p class="text-gray-600">${error.message}</p>
            </div>
        `;
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Handle navigation clicks
    document.addEventListener('click', async (event) => {
        const link = event.target.closest('.nav-link');
        if (link) {
            event.preventDefault();
            const pageName = link.getAttribute('data-page') || link.getAttribute('href').substring(1);
            if (pageName && pageName !== currentPage) {
                window.location.hash = pageName;
                currentPage = pageName;
                await loadPage(pageName);
                updateActiveNav();
            }
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const pageName = window.location.hash.substring(1) || 'home';
        if (pageName !== currentPage) {
            loadPage(pageName);
        }
    });
}

// --- Initialize App ---
async function initApp() {
    try {
        // Load components
        const [footer, nav] = await Promise.all([
            loadComponent('footer'),
            loadComponent('nav')
        ]);
        
        // Insert components into the DOM
        const footerElement = document.getElementById('app-footer');
        const navElement = document.getElementById('nav-container');
        
        if (footerElement) footerElement.innerHTML = footer;
        if (navElement) navElement.innerHTML = nav;
        
        // Set up event listeners
        setupEventListeners();
        
        // Load the initial page based on the URL hash
        const initialPage = window.location.hash.substring(1) || 'home';
        currentPage = initialPage;
        await loadPage(initialPage);
        
        // Update active navigation link
        updateActiveNav();
        
        // Setup scroll listener
        setupScrollListener();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
