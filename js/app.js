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
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('text-rose-600', 'font-semibold');
        if (link.getAttribute('href') === `#${currentPage}`) {
            link.classList.add('text-rose-600', 'font-semibold');
        }
    });
}

// --- Scroll Handling ---
function setupScrollListener() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('shadow-lg', 'bg-white/95');
            nav.classList.remove('bg-white/90');
        } else {
            nav.classList.remove('shadow-lg', 'bg-white/95');
            nav.classList.add('bg-white/90');
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
        
        // If it's the home page, scroll to top
        if (currentPage === 'home') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // Scroll to main content area with offset for fixed header
            const headerOffset = document.getElementById('main-nav').offsetHeight;
            const elementPosition = mainContent.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        
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
            const pageName = link.getAttribute('href').substring(1);
            window.location.hash = pageName;
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
    // Load components
    const header = document.getElementById('app-header');
    const nav = document.getElementById('app-nav');
    const footer = document.getElementById('app-footer');
    
    if (header) header.innerHTML = await loadComponent('header');
    if (nav) nav.innerHTML = await loadComponent('nav');
    if (footer) footer.innerHTML = await loadComponent('footer');
    
    // Setup event listeners
    setupEventListeners();
    setupScrollListener();
    
    // Load initial page
    const initialPage = window.location.hash.substring(1) || 'home';
    await loadPage(initialPage);
}

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
