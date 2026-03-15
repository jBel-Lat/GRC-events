// Admin Panelists Management

let currentPanelistId = null;

async function loadPanelists() {
    const panelistsList = document.getElementById('panelistsList');
    if (!panelistsList) return;

    panelistsList.innerHTML = '<div class="empty-state"><p>Loading panelists...</p></div>';

    const result = await adminApi.getPanelists();

    if (result.success) {
        if (result.data.length === 0) {
            panelistsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>No panelists yet. Create one to get started!</p></div>';
        } else {
            panelistsList.innerHTML = result.data.map(panelist => `
                <div class="panelist-card">
                    <div class="event-card-header">
                        <h3>${panelist.full_name}</h3>
                        <span class="event-status status-${panelist.status === 'active' ? 'ongoing' : 'completed'}">${panelist.status}</span>
                    </div>
                    <div class="event-card-info">
                        <div><strong>Username:</strong> ${panelist.username}</div>
                    </div>
                    <div class="event-card-actions">
                        <button class="btn btn-secondary" onclick="openEditPanelistModal(${panelist.id}, '${panelist.username}', '${panelist.full_name}')">Edit</button>
                        <button class="btn btn-secondary" onclick="openAssignModal(${panelist.id})">Assign Events</button>
                        <button class="btn btn-danger" onclick="deletePanelistConfirm(${panelist.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addPanelistBtn = document.getElementById('addPanelistBtn');
    if (addPanelistBtn) {
        addPanelistBtn.addEventListener('click', () => {
            document.getElementById('addPanelistForm').reset();
            showModal('addPanelistModal');
        });
    }

    const addPanelistForm = document.getElementById('addPanelistForm');
    if (addPanelistForm) {
        addPanelistForm.addEventListener('submit', handleAddPanelist);
    }

    const editPanelistForm = document.getElementById('editPanelistForm');
    if (editPanelistForm) {
        editPanelistForm.addEventListener('submit', handleEditPanelist);
    }

    // Setup search listeners
    setupPanelistSearchListeners();
});

async function handleAddPanelist(e) {
    e.preventDefault();

    const username = document.getElementById('panelistUsername').value.trim();
    const password = document.getElementById('panelistPassword').value;
    const fullName = document.getElementById('panelistFullName').value.trim();

    // basic client-side validation
    if (!username || !password || !fullName) {
        alert('Please fill in username, password, and full name.');
        return;
    }

    const result = await adminApi.createPanelist({
        username,
        password,
        full_name: fullName
    });

    if (result.success) {
        hideModal('addPanelistModal');
        loadPanelists();
    } else {
        console.error('Create panelist failed', result);
        let msg = result.message || 'Error creating panelist';
        if (result.received) {
            msg += '\nReceived:' + JSON.stringify(result.received);
        }
        alert(msg);
    }
}

function openEditPanelistModal(panelistId, username, fullName) {
    document.getElementById('editPanelistId').value = panelistId;
    document.getElementById('editPanelistUsername').value = username;
    document.getElementById('editPanelistFullName').value = fullName;
    document.getElementById('editPanelistPassword').value = '';
    showModal('editPanelistModal');
}

async function handleEditPanelist(e) {
    e.preventDefault();

    const panelistId = document.getElementById('editPanelistId').value;
    const username = document.getElementById('editPanelistUsername').value;
    const fullName = document.getElementById('editPanelistFullName').value;
    const password = document.getElementById('editPanelistPassword').value;

    const payload = {
        username,
        full_name: fullName
    };

    if (password && password.trim() !== '') {
        payload.password = password;
    }

    const result = await adminApi.updatePanelist(panelistId, payload);

    if (result.success) {
        hideModal('editPanelistModal');
        loadPanelists();
    } else {
        console.error('Update panelist failed', result);
        alert(result.message || 'Error updating panelist');
    }
}

async function deletePanelistConfirm(panelistId) {
    if (confirm('Are you sure you want to delete this panelist?')) {
        const result = await adminApi.deletePanelist(panelistId);

        if (result.success) {
            loadPanelists();
        }
    }
}

async function openAssignModal(panelistId) {
    currentPanelistId = panelistId;

    // Load all events
    const eventsResult = await adminApi.getEvents();

    if (eventsResult.success) {
        const container = document.getElementById('eventsCheckboxContainer');
        // Fetch currently assigned events for this panelist
        const assignedResult = await adminApi.getPanelistAssignedEvents(panelistId);
        const assignedSet = new Set((assignedResult.success && Array.isArray(assignedResult.data)) ? assignedResult.data : []);
        // store initial assigned ids for diff on submit
        window.__initialAssignedEventIds = assignedSet;

        container.innerHTML = eventsResult.data.map(event => `
            <div class="form-group">
                <label>
                    <input type="checkbox" value="${event.id}" class="event-checkbox" ${assignedSet.has(event.id) ? 'checked' : ''}>
                    ${event.event_name}
                </label>
            </div>
        `).join('');

        showModal('assignPanelistModal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const assignPanelistForm = document.getElementById('assignPanelistForm');
    if (assignPanelistForm) {
        assignPanelistForm.addEventListener('submit', handleAssignEvents);
    }
});

async function handleAssignEvents(e) {
    e.preventDefault();

    const checkboxes = document.querySelectorAll('.event-checkbox');
    const checkedIds = new Set();
    for (const cb of checkboxes) {
        if (cb.checked) checkedIds.add(Number(cb.value));
    }

    const initialAssigned = window.__initialAssignedEventIds || new Set();

    // Assign newly checked events
    for (const id of checkedIds) {
        if (!initialAssigned.has(id)) {
            await adminApi.assignPanelistToEvent(currentPanelistId, id);
        }
    }

    // Remove unchecked (previously assigned) events
    for (const id of initialAssigned) {
        if (!checkedIds.has(id)) {
            await adminApi.removePanelistFromEvent(currentPanelistId, id);
        }
    }

    alert('Event assignments updated');
    hideModal('assignPanelistModal');
    loadPanelists();
}

// Search/Filter functionality for panelists
function setupPanelistSearchListeners() {
    const panelistsSearchBox = document.getElementById('panelistsSearchBox');
    
    if (panelistsSearchBox) {
        panelistsSearchBox.addEventListener('keyup', filterPanelists);
    }
}

function filterPanelists(e) {
    const searchTerm = e.target.value.toLowerCase();
    const panelistCards = document.querySelectorAll('.panelist-card');
    
    panelistCards.forEach(card => {
        const fullName = card.querySelector('h3').textContent.toLowerCase();
        const username = card.textContent.toLowerCase();
        
        if (fullName.startsWith(searchTerm) || username.startsWith(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}
