// Admin Main Script

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeEventListeners();
});

const ADMIN_BASE = '/$2b$10$RkzXnPj4T9OQh7m9l1LkOe6dTjY9pJv8b3Zf4R2nKxLq5VgHcW8aS';

function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    const path = window.location.pathname;
    const isLoginPage =
        path === '/' ||
        path.includes('admin/index.html') ||
        path === ADMIN_BASE ||
        path === encodeURI(ADMIN_BASE);

    if (!token && !isLoginPage) {
        window.location.href = ADMIN_BASE;
    }

    if (token && isLoginPage) {
        window.location.href = '/admin/dashboard.html';
    }

    // Prevent browser back navigation from returning to login after authenticated
    if (token && !isLoginPage) {
        history.replaceState(null, '', location.href);
        const preventBack = () => history.pushState(null, '', location.href);
        window.removeEventListener('popstate', preventBack);
        window.addEventListener('popstate', preventBack);
    }
}

function displayAdminName() {
    const userDisplay = document.getElementById('userDisplay');
    const roleEl = document.getElementById('userRole');
    if (userDisplay) {
        const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (user && user.username) {
            userDisplay.textContent = user.username;
            if (roleEl) roleEl.textContent = user.role || 'Admin';
        }
    }
}

function initializeEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    // show name if on dashboard
    displayAdminName();
    // prefill username or show welcome on login page
    const welcome = document.getElementById('welcomeBack');
    const usernameInput = document.getElementById('username');
    if (welcome && usernameInput) {
        const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (user && user.username) {
            welcome.textContent = `Welcome back, ${user.username}`;
            usernameInput.value = user.username;
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Back buttons
    const backToEventsBtn = document.getElementById('backToEventsBtn');
    const backToEventDetailsBtn = document.getElementById('backToEventDetailsBtn');
    const backToParticipantsBtn = document.getElementById('backToParticipantsBtn');

    if (backToEventsBtn) {
        backToEventsBtn.addEventListener('click', () => switchSection('events'));
    }
    if (backToEventDetailsBtn) {
        backToEventDetailsBtn.addEventListener('click', () => switchSection('events'));
    }
    if (backToParticipantsBtn) {
        backToParticipantsBtn.addEventListener('click', () => {
            const currentEventId = sessionStorage.getItem('currentEventId');
            switchSection('eventDetails');
        });
    }

    // Modal close buttons
    document.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
                if (modal.id === 'participantDetailsModal' && typeof resetParticipantModalState === 'function') {
                    resetParticipantModalState();
                }
            }
        });
    });

    // Close modal when clicking outside (unless modal is marked to stay open)
    window.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('modal') && !e.target.classList.contains('no-close-on-outside')) {
            e.target.classList.remove('active');
            e.target.style.display = 'none';
            if (e.target.id === 'participantDetailsModal' && typeof resetParticipantModalState === 'function') {
                resetParticipantModalState();
            }
        }
    });

}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const result = await adminApi.login(username, password);

        if (result.success) {
            window.location.href = '/admin/dashboard.html';
        } else {
            errorMessage.textContent = result.message || 'Login failed';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred during login';
        errorMessage.style.display = 'block';
    }
}

async function handleLogout() {
    await adminApi.logout();
    window.location.href = '/admin/index.html';
}

function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const sectionEl = document.getElementById(section + 'Section');
    if (sectionEl) {
        sectionEl.classList.add('active');
    }

    const navItem = document.querySelector(`[data-section="${section}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Load data based on section
    if (section === 'events') {
        loadEvents();
    } else if (section === 'panelists') {
        loadPanelists();
    } else if (section === 'students') {
        loadStudents();
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        // reset scroll when opening modals with content
        const content = modal.querySelector('.modal-content');
        if (content) content.scrollTo({ top: 0, behavior: 'auto' });
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        // clear team members content to avoid stale state when reopening participant modal
        if (modalId === 'participantDetailsModal') {
            if (typeof resetParticipantModalState === 'function') {
                resetParticipantModalState();
            }
        }
    }
}

// Load events on page ready
document.addEventListener('DOMContentLoaded', () => {
    const eventsSection = document.getElementById('eventsSection');
    if (eventsSection) {
        loadEvents();
        loadPanelists();
        loadStudents();
        setupEventSearchListeners();
        setupParticipantSearchListeners();
        setupPanelistSearchListeners();
        setupStudentSearchListeners();
    }
});
