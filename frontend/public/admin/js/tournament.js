/**
 * Tournament Management Module
 * Manages tournament events, team registration, and bracket generation
 */

let tournamentState = {
    selectedEventId: null,
    selectedTeams: [],
    allTeams: [],
    currentRound: 1,
    matchResults: {}, // {matchId: winnerId}
    bracket: [] // stores bracket structure
};

// Initialize tournament module
function initTournament() {
    setupEventListeners();
    // Don't load events/teams on init - load them when user navigates to tournament section
}

// Setup event listeners
function setupEventListeners() {
    // Create tournament button
    document.getElementById('createTournamentBtn')?.addEventListener('click', openCreateTournamentModal);
    
    // Create tournament form
    document.getElementById('createTournamentForm')?.addEventListener('submit', handleCreateTournament);
    
    // Tournament event selection
    document.getElementById('tournamentEventSelect')?.addEventListener('change', handleTournamentEventSelect);
    
    // Add team button
    document.getElementById('addTeamToTournamentBtn')?.addEventListener('click', openAddTeamModal);
    
    // Add team form
    document.getElementById('addTeamToTournamentForm')?.addEventListener('submit', handleAddTeamToTournament);
    
    // Generate bracket button
    document.getElementById('generateBracketBtn')?.addEventListener('click', generateBracket);
    document.getElementById('bracketTypeSelect')?.addEventListener('change', updateBracketButtonLabel);
    
    // Modal close buttons
    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.querySelectorAll('.close-btn-action').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Listen for tournament section navigation
    const tournamentSection = document.getElementById('tournamentSection');
    if (tournamentSection) {
        // Use a mutation observer to detect when the tournament section becomes active
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (tournamentSection.classList.contains('active')) {
                        // Load data when tournament section becomes active
                        loadTournamentEvents();
                        loadAllTeams();
                    }
                }
            });
        });
        
        observer.observe(tournamentSection, { attributes: true, attributeFilter: ['class'] });
    }
}

function updateBracketButtonLabel() {
    const btn = document.getElementById('generateBracketBtn');
    const select = document.getElementById('bracketTypeSelect');
    if (!btn || !select) return;
    btn.textContent = select.value === 'mobile_legends'
        ? 'Generate Mobile Legends Bracket'
        : 'Generate Bracket';
}

// Load all tournament events
async function loadTournamentEvents() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('No authorization token found');
            return;
        }
        
        const response = await fetch('/api/events', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const events = data.data || data;
        
        if (!Array.isArray(events)) {
            throw new Error('Events data is not an array');
        }
        
        console.log('All events loaded:', events); // Debug log
        
        // Filter only tournament events (handle true, 1, and string '1')
        const tournamentEvents = events.filter(event => {
            const isTournament = event.is_tournament === true || event.is_tournament === 1 || String(event.is_tournament) === '1';
            console.log(`Event "${event.event_name}" - is_tournament value: ${event.is_tournament}, is tournament: ${isTournament}`);
            return isTournament;
        });
        
        console.log('Filtered tournament events:', tournamentEvents); // Debug log
        
        const select = document.getElementById('tournamentEventSelect');
        select.innerHTML = '<option value="">-- Choose a tournament event --</option>';
        
        if (tournamentEvents.length === 0) {
            select.innerHTML += '<option disabled style="color: #999;">No tournament events available. Create an event and mark it as a tournament event.</option>';
            showTournamentMessage('No tournament events found. Create an event with "Tournament Event" checkbox enabled.', 'info');
        } else {
            tournamentEvents.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.event_name || event.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading tournament events:', error);
        showTournamentMessage('Error loading events: ' + error.message, 'error');
    }
}

// Load all teams from all events
async function loadAllTeams() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('No authorization token found');
            return;
        }
        
        const response = await fetch('/api/events', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const events = data.data || data;
        
        if (!Array.isArray(events)) {
            throw new Error('Events data is not an array');
        }
        
        tournamentState.allTeams = [];
        
        // Fetch participants for each event
        for (const event of events) {
            try {
                const participantsRes = await fetch(`/api/participants/admin/event/${event.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!participantsRes.ok) {
                    console.warn(`Could not load teams for event ${event.id}`);
                    continue;
                }
                
                const participantData = await participantsRes.json();
                const participants = participantData.data || participantData;
                if (Array.isArray(participants)) {
                    tournamentState.allTeams.push(...participants);
                }
            } catch (error) {
                console.error(`Error loading teams for event ${event.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        showTournamentMessage('Error loading teams: ' + error.message, 'error');
    }
}

// Handle tournament event selection
function handleTournamentEventSelect(e) {
    const eventId = e.target.value;
    tournamentState.selectedEventId = eventId;
    
    if (eventId) {
        loadTeamsForEvent(eventId);
        document.getElementById('teamsManagementArea').style.display = 'block';
        document.getElementById('bracketGenerationArea').style.display = 'none';
        tournamentState.selectedTeams = [];
        tournamentState.currentRound = 1;
        tournamentState.matchResults = {};
        tournamentState.bracket = [];
    } else {
        document.getElementById('teamsManagementArea').style.display = 'none';
        document.getElementById('bracketGenerationArea').style.display = 'none';
    }
}

// Load teams for selected event
async function loadTeamsForEvent(eventId) {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('No authorization token found');
            return;
        }
        
        const response = await fetch(`/api/participants/admin/event/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const participants = data.data || data;
        
        if (!Array.isArray(participants)) {
            throw new Error('Participants data is not an array');
        }
        
        // Store teams and display
        tournamentState.selectedTeams = participants;
        renderTournamentTeamsList(participants);
        
        // Show bracket area if teams exist
        if (participants.length > 0) {
            document.getElementById('bracketGenerationArea').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading teams for event:', error);
        showTournamentMessage('Error loading teams: ' + error.message, 'error');
    }
}

// Render teams list for tournament
function renderTournamentTeamsList(teams) {
    const container = document.getElementById('tournamentTeamsList');
    
    if (teams.length === 0) {
        container.innerHTML = '<p style="color: #999;">No teams added yet. Click "+ Add Team" to get started.</p>';
        return;
    }
    
    container.innerHTML = teams.map((team, index) => `
        <div class="tournament-team-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; 
            background: #f5f5f5; border-radius: 4px; margin-bottom: 8px;">
            <div>
                <div style="font-weight: bold;">${team.team_name || team.participant_name || team.name}</div>
                <div style="font-size: 0.9em; color: #666;">${team.registration_number || 'Team'}</div>
            </div>
            <button class="btn btn-danger btn-small" onclick="removeTeamFromTournament(${team.id})">Remove</button>
        </div>
    `).join('');
}

// Remove team from tournament
function removeTeamFromTournament(teamId) {
    tournamentState.selectedTeams = tournamentState.selectedTeams.filter(t => t.id !== teamId);
    renderTournamentTeamsList(tournamentState.selectedTeams);
    
    // Reset bracket if teams change
    tournamentState.currentRound = 1;
    tournamentState.matchResults = {};
    tournamentState.bracket = [];
    document.getElementById('bracketContainer').innerHTML = '';
    
    if (tournamentState.selectedTeams.length === 0) {
        document.getElementById('bracketGenerationArea').style.display = 'none';
    }
}

// Open create tournament modal
function openCreateTournamentModal() {
    document.getElementById('createTournamentModal').style.display = 'block';
}

// Handle create tournament
async function handleCreateTournament(e) {
    e.preventDefault();
    
    const name = document.getElementById('tournamentEventName').value;
    const description = document.getElementById('tournamentEventDescription').value;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                event_name: name,
                description: description,
                start_date: today,
                end_date: endDateStr,
                is_tournament: true,
                criteria: []
            })
        });
        
        if (response.ok) {
            showTournamentMessage('Tournament created successfully!', 'success');
            closeAllModals();
            document.getElementById('createTournamentForm').reset();
            loadTournamentEvents();
        } else {
            const errorData = await response.json();
            console.error('Response error:', errorData);
            showTournamentMessage(errorData.message || 'Error creating tournament', 'error');
        }
    } catch (error) {
        console.error('Error creating tournament:', error);
        showTournamentMessage('Error creating tournament: ' + error.message, 'error');
    }
}

// Open add team modal
function openAddTeamModal() {
    if (!tournamentState.selectedEventId) {
        showTournamentMessage('Please select a tournament event first', 'error');
        return;
    }
    
    const select = document.getElementById('availableTeamsSelect');
    select.innerHTML = '<option value="">-- Choose a team --</option>';
    
    // Get teams not already in tournament
    const availableTeams = tournamentState.allTeams.filter(
        team => !tournamentState.selectedTeams.some(t => t.id === team.id)
    );
    
    availableTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.team_name || team.participant_name || team.name;
        select.appendChild(option);
    });
    
    document.getElementById('addTeamToTournamentModal').style.display = 'block';
}

// Handle add team to tournament
function handleAddTeamToTournament(e) {
    e.preventDefault();
    
    const teamId = parseInt(document.getElementById('availableTeamsSelect').value);
    
    if (!teamId) {
        showTournamentMessage('Please select a team', 'error');
        return;
    }
    
    // Add team to selected teams
    const team = tournamentState.allTeams.find(t => t.id === teamId);
    if (!team) {
        showTournamentMessage('Team not found', 'error');
        return;
    }
    
    tournamentState.selectedTeams.push(team);
    renderTournamentTeamsList(tournamentState.selectedTeams);
    document.getElementById('bracketGenerationArea').style.display = 'block';
    
    closeAllModals();
    document.getElementById('addTeamToTournamentForm').reset();
    showTournamentMessage('Team added successfully!', 'success');
}

// Generate bracket
async function generateBracket() {
    if (tournamentState.selectedTeams.length === 0) {
        showTournamentMessage('No teams in tournament', 'error');
        return;
    }
    
    try {
        const bracketType = document.getElementById('bracketTypeSelect')?.value || 'single_elimination';
        let bracketTeams = [...tournamentState.selectedTeams];

        if (bracketType === 'mobile_legends') {
            // Keep stable ordering to mimic seeded Mobile Legends style brackets.
            bracketTeams = [...tournamentState.selectedTeams];
            showTournamentMessage('Mobile Legends bracket generated with seeded ordering.', 'success');
        } else {
            // Default single elimination uses shuffled seeding.
            bracketTeams = [...tournamentState.selectedTeams].sort(() => Math.random() - 0.5);
        }

        // Generate bracket
        tournamentState.bracket = generateBracketStructure(bracketTeams);
        tournamentState.matchResults = {}; // Reset match results
        tournamentState.currentRound = 1;
        
        renderBracketWithSelection(tournamentState.bracket, 1);
        
        if (bracketType !== 'mobile_legends') {
            showTournamentMessage('Bracket generated successfully! Click on teams to select winners.', 'success');
        }
    } catch (error) {
        console.error('Error generating bracket:', error);
        showTournamentMessage('Error generating bracket', 'error');
    }
}

// Generate single elimination bracket structure
function generateBracketStructure(teams) {
    // Calculate next power of 2
    const targetSize = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    
    // Pad with BYEs
    const paddedTeams = [...teams];
    while (paddedTeams.length < targetSize) {
        paddedTeams.push({ id: null, name: 'BYE' });
    }
    
    // Create first round matches
    const matches = [];
    for (let i = 0; i < paddedTeams.length; i += 2) {
        matches.push({
            team1: paddedTeams[i],
            team2: paddedTeams[i + 1],
            round: 1,
            matchIndex: i / 2
        });
    }
    
    return matches;
}

// Render bracket using flexbox with selection capability
function renderBracketWithSelection(matches, round) {
    const container = document.getElementById('bracketContainer');
    
    let html = `
        <div style="margin-bottom: 20px; padding: 12px; background: #f0f0f0; border-radius: 4px;">
            <strong>Round ${round}</strong> - Click on a team to select them as the winner
        </div>
        <div style="display: flex; gap: 40px; overflow-x: auto; padding: 20px;">
            <div class="bracket-round" style="flex-shrink: 0;">
                <h4 style="margin-bottom: 12px;">Round ${round}</h4>
    `;
    
    matches.forEach((match, idx) => {
        const matchId = `match_${round}_${idx}`;
        const selectedWinnerId = tournamentState.matchResults[matchId];
        
        const team1Name = match.team1 ? (match.team1.team_name || match.team1.participant_name || match.team1.name) : 'BYE';
        const team1Id = match.team1?.id;
        const team2Name = match.team2 ? (match.team2.team_name || match.team2.participant_name || match.team2.name) : 'BYE';
        const team2Id = match.team2?.id;
        
        // Determine if each team is selected as winner
        const team1Selected = selectedWinnerId === team1Id;
        const team2Selected = selectedWinnerId === team2Id;
        
        html += `
            <div class="match-container" style="margin-bottom: 12px;">
                <div style="border: 2px solid #ddd; border-radius: 4px; overflow: hidden; background: white;">
                    <div class="team-option" data-match-id="${matchId}" data-winner-id="${team1Id}" 
                         onclick="selectWinner('${matchId}', ${team1Id})"
                         style="padding: 10px; cursor: pointer; background: ${team1Selected ? '#667eea' : '#f9f9f9'}; 
                                 color: ${team1Selected ? 'white' : 'black'}; border-bottom: 1px solid #ddd;
                                 transition: all 0.2s; font-weight: ${team1Selected ? 'bold' : 'normal'};">
                        ${team1Name} ${team1Selected ? '✓' : ''}
                    </div>
                    <div class="team-option" data-match-id="${matchId}" data-winner-id="${team2Id}"
                         onclick="selectWinner('${matchId}', ${team2Id})"
                         style="padding: 10px; cursor: pointer; background: ${team2Selected ? '#667eea' : '#f9f9f9'}; 
                                 color: ${team2Selected ? 'white' : 'black'};
                                 transition: all 0.2s; font-weight: ${team2Selected ? 'bold' : 'normal'};">
                        ${team2Name} ${team2Selected ? '✓' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="proceedToNextRound()" class="btn btn-primary" id="nextRoundBtn" style="display: ${canProceedToNextRound(matches) ? 'block' : 'none'};">
                Next Round →
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

// Check if all matches in current round have winners selected
function canProceedToNextRound(matches) {
    return matches.every((match, idx) => {
        const matchId = `match_${tournamentState.currentRound}_${idx}`;
        return tournamentState.matchResults[matchId] !== undefined;
    });
}

// Select a winner for a match
function selectWinner(matchId, teamId) {
    // Toggle: if same team clicked again, deselect
    if (tournamentState.matchResults[matchId] === teamId) {
        delete tournamentState.matchResults[matchId];
    } else {
        tournamentState.matchResults[matchId] = teamId;
    }
    
    // Re-render current round
    renderBracketWithSelection(tournamentState.bracket, tournamentState.currentRound);
    
    // Check if all matches have winners
    if (canProceedToNextRound(tournamentState.bracket)) {
        showTournamentMessage('All matches have winners! Click "Next Round" to continue.', 'success');
    }
}

// Proceed to next round
function proceedToNextRound() {
    const currentMatches = tournamentState.bracket;
    
    // Get winners and create next round matches
    const nextRoundTeams = currentMatches.map((match, idx) => {
        const matchId = `match_${tournamentState.currentRound}_${idx}`;
        const winnerId = tournamentState.matchResults[matchId];
        
        // Find the winner team object
        if (match.team1?.id === winnerId) return match.team1;
        if (match.team2?.id === winnerId) return match.team2;
        return null;
    }).filter(t => t !== null);
    
    if (nextRoundTeams.length === 1) {
        // Tournament is over!
        const champion = nextRoundTeams[0];
        const championName = champion.team_name || champion.participant_name || champion.name;
        showTournamentMessage(`🏆 Tournament Complete! ${championName} is the Champion! 🏆`, 'success');
        
        const container = document.getElementById('bracketContainer');
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; border-radius: 8px; margin: 20px 0;">
                <h2 style="font-size: 2em; margin: 0;">🏆 CHAMPION 🏆</h2>
                <h1 style="font-size: 3em; margin: 10px 0;">${championName}</h1>
                <button onclick="resetTournament()" class="btn btn-secondary" style="margin-top: 20px;">Start New Tournament</button>
            </div>
        `;
        return;
    }
    
    // Generate next round bracket
    tournamentState.bracket = generateBracketStructure(nextRoundTeams);
    tournamentState.currentRound++;
    
    renderBracketWithSelection(tournamentState.bracket, tournamentState.currentRound);
    showTournamentMessage(`Proceeding to Round ${tournamentState.currentRound}...`, 'success');
}

// Reset tournament
function resetTournament() {
    tournamentState.currentRound = 1;
    tournamentState.matchResults = {};
    tournamentState.bracket = [];
    document.getElementById('bracketContainer').innerHTML = '';
    showTournamentMessage('Tournament reset. Generate a new bracket to start.', 'info');
}

// Show tournament message
function showTournamentMessage(message, type = 'info') {
    const messageDiv = document.getElementById('tournamentMessage');
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = type === 'error' ? '#fee' : type === 'success' ? '#efe' : '#eef';
    messageDiv.style.color = type === 'error' ? '#c33' : type === 'success' ? '#3c3' : '#33c';
    messageDiv.style.borderLeft = `4px solid ${type === 'error' ? '#c33' : type === 'success' ? '#3c3' : '#33c'}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initTournament();
    updateBracketButtonLabel();
});
