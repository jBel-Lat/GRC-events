// Admin Student Management

let currentStudentId = null;

async function loadStudents() {
    const studentsList = document.getElementById('studentsList');
    if (!studentsList) return;

    studentsList.innerHTML = '<div class="empty-state"><p>Loading students...</p></div>';

    const result = await adminApi.getStudents();

    if (result.success) {
        const bulkBtn = document.getElementById('bulkManageEventsBtn');
        if (result.data.length === 0) {
            studentsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎓</div><p>No students yet. Create one to get started!</p></div>';
            if (bulkBtn) bulkBtn.style.display = 'none';
        } else {
            if (bulkBtn) bulkBtn.style.display = 'inline-block';
            
            const eventsResult = await adminApi.getEvents();
            const eventsMap = {};
            if (eventsResult.success) {
                eventsResult.data.forEach(e => { eventsMap[e.id] = e.event_name; });
            }

            const cards = [];
            for (const student of result.data) {
                const assignedResult = await adminApi.getStudentAssignedEvents(student.id);
                const assignedEventIds = (assignedResult.success && Array.isArray(assignedResult.data)) ? assignedResult.data : [];
                const assignedEventNames = assignedEventIds.map(id => eventsMap[id] || `Event ${id}`).join(', ');

                cards.push(`
                    <div class="panelist-card" style="position:relative;">
                        <input type="checkbox" class="student-bulk-checkbox" value="${student.id}" style="position:absolute; top:10px; right:10px; width:20px; height:20px; cursor:pointer;">
                        <div class="event-card-header">
                            <h3>${student.name}</h3>
                            <span class="event-status status-${student.status === 'active' ? 'ongoing' : 'completed'}">${student.status}</span>
                        </div>
                        <div class="event-card-info">
                            <div><strong>Student ID:</strong> ${student.student_number}</div>
                            <div style="margin-top: 8px;"><strong>Assigned Events:</strong> ${assignedEventNames || '<em>None assigned</em>'}</div>
                        </div>
                        <div class="event-card-actions">
                            <button class="btn btn-secondary" onclick="openEditStudentModal(${student.id}, '${student.name}', '${student.student_number}', '${student.status}')">Edit</button>
                            <button class="btn btn-secondary" onclick="openAssignStudentModal(${student.id})">Manage Events</button>
                            <button class="btn btn-danger" onclick="deleteStudentConfirm(${student.id})">Delete</button>
                        </div>
                    </div>
                `);
            }
            studentsList.innerHTML = cards.join('');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const editStudentForm = document.getElementById('editStudentForm');
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', handleEditStudent);
    }

    const bulkManageEventsBtn = document.getElementById('bulkManageEventsBtn');
    if (bulkManageEventsBtn) {
        bulkManageEventsBtn.addEventListener('click', openBulkManageEventsModal);
    }

    const bulkManageEventsForm = document.getElementById('bulkManageEventsForm');
    if (bulkManageEventsForm) {
        bulkManageEventsForm.addEventListener('submit', handleBulkManageEvents);
    }

    setupStudentSearchListeners();
});

function openEditStudentModal(id, name, number, status) {
    document.getElementById('editStudentId').value = id;
    document.getElementById('editStudentName').value = name;
    document.getElementById('editStudentNumber').value = number;
    document.getElementById('editStudentStatus').value = status;
    showModal('editStudentModal');
}

async function handleEditStudent(e) {
    e.preventDefault();

    const studentId = document.getElementById('editStudentId').value;
    const name = document.getElementById('editStudentName').value.trim();
    const studentNumber = document.getElementById('editStudentNumber').value.trim();
    const status = document.getElementById('editStudentStatus').value;

    const payload = { name, student_number: studentNumber, status };
    const result = await adminApi.updateStudent(studentId, payload);

    if (result.success) {
        hideModal('editStudentModal');
        loadStudents();
    } else {
        console.error('Update student failed', result);
        alert(result.message || 'Error updating student');
    }
}

async function deleteStudentConfirm(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        const result = await adminApi.deleteStudent(id);
        if (result.success) {
            loadStudents();
        }
    }
}

async function openAssignStudentModal(studentId) {
    currentStudentId = studentId;

    const eventsResult = await adminApi.getEvents();
    if (eventsResult.success) {
        const container = document.getElementById('studentEventsCheckboxContainer');
        const assignedResult = await adminApi.getStudentAssignedEvents(studentId);
        const assignedSet = new Set((assignedResult.success && Array.isArray(assignedResult.data)) ? assignedResult.data : []);
        window.__initialAssignedStudentEventIds = assignedSet;

        container.innerHTML = eventsResult.data.map(event => `
            <div class="form-group">
                <label>
                    <input type="checkbox" value="${event.id}" class="student-event-checkbox" ${assignedSet.has(event.id) ? 'checked' : ''}>
                    ${event.event_name}
                </label>
            </div>
        `).join('');
        showModal('assignStudentModal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const assignStudentForm = document.getElementById('assignStudentForm');
    if (assignStudentForm) {
        assignStudentForm.addEventListener('submit', handleAssignStudentEvents);
    }
});

async function handleAssignStudentEvents(e) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('.student-event-checkbox');
    const checkedIds = new Set();
    checkboxes.forEach(cb => { if (cb.checked) checkedIds.add(Number(cb.value)); });
    const initial = window.__initialAssignedStudentEventIds || new Set();
    for (const id of checkedIds) {
        if (!initial.has(id)) {
            await adminApi.assignStudentToEvent(currentStudentId, id);
        }
    }
    for (const id of initial) {
        if (!checkedIds.has(id)) {
            await adminApi.removeStudentFromEvent(currentStudentId, id);
        }
    }
    alert('Event assignments updated');
    hideModal('assignStudentModal');
    loadStudents();
}

function setupStudentSearchListeners() {
    const studentsSearchBox = document.getElementById('studentsSearchBox');
    if (studentsSearchBox) {
        studentsSearchBox.addEventListener('keyup', filterStudents);
    }
}

function filterStudents(e) {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.panelist-card');
    cards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const text = card.textContent.toLowerCase();
        if (name.startsWith(searchTerm) || text.startsWith(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Bulk Event Management
async function openBulkManageEventsModal() {
    const eventCheckboxContainer = document.getElementById('bulkEventCheckboxContainer');

    const eventsResult = await adminApi.getEvents();

    // Build event checkboxes
    if (eventsResult.success) {
        eventCheckboxContainer.innerHTML = eventsResult.data.map(event => `
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="display:flex; align-items:center; gap:8px; margin:0;">
                    <input type="checkbox" class="bulk-event-checkbox" value="${event.id}">
                    ${event.event_name}
                </label>
            </div>
        `).join('');
    }

    showModal('bulkManageEventsModal');
}

async function handleBulkManageEvents(e) {
    e.preventDefault();

    const eventCheckboxes = document.querySelectorAll('.bulk-event-checkbox:checked');
    const selectedEvents = Array.from(eventCheckboxes).map(cb => Number(cb.value));

    if (selectedEvents.length === 0) {
        alert('Please select at least one event');
        return;
    }

    // Assign selected events to all students
    const result = await adminApi.assignEventsToAllStudents(selectedEvents);
    
    if (result.success) {
        alert(`Successfully assigned ${selectedEvents.length} event(s) to all students`);
        hideModal('bulkManageEventsModal');
        loadStudents();
    } else {
        alert(result.message || 'Error assigning events');
    }
}
