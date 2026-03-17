/**
 * Tournament Management Module
 * Admin view: team management + bracket matches with per-match live links.
 */

let tournamentState = {
    selectedEventId: null,
    selectedTeams: [],
    eventTeams: [],
    matches: [],
    expandedMatchId: null,
    autoRefreshTimer: null
};

function initTournament() {
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('createTournamentBtn')?.addEventListener('click', openCreateTournamentModal);
    document.getElementById('createTournamentForm')?.addEventListener('submit', handleCreateTournament);
    document.getElementById('tournamentEventSelect')?.addEventListener('change', handleTournamentEventSelect);
    document.getElementById('addTeamToTournamentBtn')?.addEventListener('click', openAddTeamModal);
    document.getElementById('addTeamToTournamentForm')?.addEventListener('submit', handleAddTeamToTournament);
    document.getElementById('generateBracketBtn')?.addEventListener('click', generateBracket);
    document.getElementById('refreshMatchesBtn')?.addEventListener('click', () => {
        if (tournamentState.selectedEventId) loadMatchesForEvent(tournamentState.selectedEventId);
    });

    document.getElementById('bracketTypeSelect')?.addEventListener('change', updateBracketButtonLabel);

    document.querySelectorAll('.modal .close-btn').forEach((btn) => btn.addEventListener('click', closeAllModals));
    document.querySelectorAll('.close-btn-action').forEach((btn) => btn.addEventListener('click', closeAllModals));

    const tournamentSection = document.getElementById('tournamentSection');
    if (!tournamentSection) return;

    const observer = new MutationObserver(() => {
        const isActive = tournamentSection.classList.contains('active');
        if (isActive) {
            loadTournamentEvents();
            startAutoRefresh();
            if (tournamentState.selectedEventId) {
                loadMatchesForEvent(tournamentState.selectedEventId);
            }
        } else {
            stopAutoRefresh();
        }
    });

    observer.observe(tournamentSection, { attributes: true, attributeFilter: ['class'] });
}

function updateBracketButtonLabel() {
    const btn = document.getElementById('generateBracketBtn');
    const select = document.getElementById('bracketTypeSelect');
    if (!btn || !select) return;
    btn.textContent = select.value === 'mobile_legends' ? 'Generate Mobile Legends Bracket' : 'Generate Bracket';
}

function startAutoRefresh() {
    stopAutoRefresh();
    tournamentState.autoRefreshTimer = setInterval(() => {
        if (tournamentState.selectedEventId) {
            loadMatchesForEvent(tournamentState.selectedEventId, { silent: true });
        }
    }, 10000);
}

function stopAutoRefresh() {
    if (tournamentState.autoRefreshTimer) {
        clearInterval(tournamentState.autoRefreshTimer);
        tournamentState.autoRefreshTimer = null;
    }
}

async function loadTournamentEvents() {
    try {
        const result = await adminApi.getEvents();
        if (!result.success || !Array.isArray(result.data)) {
            throw new Error(result.message || 'Unable to load events.');
        }

        const tournamentEvents = result.data.filter((event) => (
            event.is_tournament === true || event.is_tournament === 1 || String(event.is_tournament) === '1'
        ));

        const select = document.getElementById('tournamentEventSelect');
        if (!select) return;

        const selectedBefore = String(tournamentState.selectedEventId || '');
        select.innerHTML = '<option value="">-- Choose a tournament event --</option>';

        tournamentEvents.forEach((event) => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.event_name || event.name;
            if (selectedBefore && selectedBefore === String(event.id)) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        if (!tournamentEvents.length) {
            showTournamentMessage('No tournament events found. Create an event and enable tournament mode.', 'info');
        }
    } catch (error) {
        console.error('Error loading tournament events:', error);
        showTournamentMessage(`Error loading events: ${error.message}`, 'error');
    }
}

async function handleTournamentEventSelect(e) {
    const eventId = Number(e.target.value) || null;
    tournamentState.selectedEventId = eventId;
    tournamentState.expandedMatchId = null;

    const teamsArea = document.getElementById('teamsManagementArea');
    const bracketArea = document.getElementById('bracketGenerationArea');

    if (!eventId) {
        tournamentState.eventTeams = [];
        tournamentState.selectedTeams = [];
        tournamentState.matches = [];
        if (teamsArea) teamsArea.style.display = 'none';
        if (bracketArea) bracketArea.style.display = 'none';
        renderTournamentTeamsList([]);
        renderMatches([]);
        return;
    }

    if (teamsArea) teamsArea.style.display = 'block';
    if (bracketArea) bracketArea.style.display = 'block';

    await loadTeamsForEvent(eventId);
    await loadMatchesForEvent(eventId);
}

async function loadTeamsForEvent(eventId) {
    try {
        const result = await adminApi.getEventParticipants(eventId);
        if (!result.success || !Array.isArray(result.data)) {
            throw new Error(result.message || 'Unable to load teams.');
        }

        const groups = new Map();
        result.data.forEach((participant) => {
            const teamName = (participant.team_name || '').trim();
            if (!teamName) return;
            if (!groups.has(teamName)) {
                groups.set(teamName, {
                    id: participant.id,
                    team_name: teamName,
                    registration_number: participant.registration_number || ''
                });
            }
        });

        tournamentState.eventTeams = Array.from(groups.values());
        tournamentState.selectedTeams = [...tournamentState.eventTeams];
        renderTournamentTeamsList(tournamentState.selectedTeams);
    } catch (error) {
        console.error('Error loading teams for event:', error);
        showTournamentMessage(`Error loading teams: ${error.message}`, 'error');
    }
}

function renderTournamentTeamsList(teams) {
    const container = document.getElementById('tournamentTeamsList');
    if (!container) return;

    if (!teams.length) {
        container.innerHTML = '<p style="color:#999;">No teams selected yet.</p>';
        return;
    }

    container.innerHTML = teams.map((team) => `
        <div class="tournament-team-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#f5f5f5; border-radius:8px; margin-bottom:8px; gap:10px;">
            <div>
                <div style="font-weight:700;">${escapeHtml(team.team_name)}</div>
                <div style="font-size:0.85em; color:#666;">${escapeHtml(team.registration_number || 'Team')}</div>
            </div>
            <button class="btn btn-danger btn-small" onclick="removeTeamFromTournament(${Number(team.id)})">Remove</button>
        </div>
    `).join('');
}

function removeTeamFromTournament(teamId) {
    tournamentState.selectedTeams = tournamentState.selectedTeams.filter((team) => Number(team.id) !== Number(teamId));
    renderTournamentTeamsList(tournamentState.selectedTeams);
}

function openCreateTournamentModal() {
    const modal = document.getElementById('createTournamentModal');
    if (modal) modal.style.display = 'block';
}

async function handleCreateTournament(e) {
    e.preventDefault();

    const name = document.getElementById('tournamentEventName')?.value?.trim() || '';
    const description = document.getElementById('tournamentEventDescription')?.value?.trim() || '';

    if (!name) {
        showTournamentMessage('Tournament name is required.', 'error');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const result = await adminApi.createEvent({
        event_name: name,
        description,
        start_date: today,
        end_date: endDate.toISOString().split('T')[0],
        is_tournament: true,
        criteria: []
    });

    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to create tournament event.', 'error');
        return;
    }

    showTournamentMessage('Tournament event created successfully.', 'success');
    closeAllModals();
    document.getElementById('createTournamentForm')?.reset();
    loadTournamentEvents();
}

function openAddTeamModal() {
    if (!tournamentState.selectedEventId) {
        showTournamentMessage('Please select a tournament event first.', 'error');
        return;
    }

    const select = document.getElementById('availableTeamsSelect');
    if (!select) return;

    const availableTeams = tournamentState.eventTeams.filter(
        (team) => !tournamentState.selectedTeams.some((selected) => Number(selected.id) === Number(team.id))
    );

    if (!availableTeams.length) {
        showTournamentMessage('No additional teams available for this tournament event.', 'info');
        return;
    }

    select.innerHTML = '<option value="">-- Choose a team --</option>';
    availableTeams.forEach((team) => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.team_name;
        select.appendChild(option);
    });

    const modal = document.getElementById('addTeamToTournamentModal');
    if (modal) modal.style.display = 'block';
}

function handleAddTeamToTournament(e) {
    e.preventDefault();

    const teamId = Number(document.getElementById('availableTeamsSelect')?.value);
    if (!Number.isFinite(teamId) || teamId <= 0) {
        showTournamentMessage('Please select a valid team.', 'error');
        return;
    }

    const team = tournamentState.eventTeams.find((entry) => Number(entry.id) === teamId);
    if (!team) {
        showTournamentMessage('Team not found.', 'error');
        return;
    }

    tournamentState.selectedTeams.push(team);
    renderTournamentTeamsList(tournamentState.selectedTeams);
    closeAllModals();
    document.getElementById('addTeamToTournamentForm')?.reset();
    showTournamentMessage('Team added to tournament pool.', 'success');
}

async function generateBracket() {
    if (!tournamentState.selectedEventId) {
        showTournamentMessage('Please select a tournament event first.', 'error');
        return;
    }

    if (tournamentState.selectedTeams.length < 2) {
        showTournamentMessage('At least 2 teams are required to generate a bracket.', 'error');
        return;
    }

    const bracketType = document.getElementById('bracketTypeSelect')?.value || 'single_elimination';
    const payload = {
        event_id: tournamentState.selectedEventId,
        team_ids: tournamentState.selectedTeams.map((team) => team.id),
        bracket_type: bracketType
    };

    const result = await adminApi.generateMatches(payload);
    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to generate bracket matches.', 'error');
        return;
    }

    tournamentState.expandedMatchId = null;
    showTournamentMessage('Bracket generated successfully.', 'success');
    await loadMatchesForEvent(tournamentState.selectedEventId);
}

async function loadMatchesForEvent(eventId, options = {}) {
    const { silent = false } = options;
    if (!eventId) return;

    const result = await adminApi.getMatches(eventId);
    if (!result.success) {
        if (!silent) {
            showTournamentMessage(result.message || 'Unable to load matches.', 'error');
        }
        return;
    }

    tournamentState.matches = Array.isArray(result.data) ? result.data : [];
    renderMatches(tournamentState.matches);
}

function renderMatches(matches) {
    const container = document.getElementById('bracketContainer');
    if (!container) return;

    if (!matches.length) {
        container.innerHTML = '<p style="color:#777; margin:0;">No matches yet. Generate a bracket to create match cards.</p>';
        return;
    }

    const grouped = matches.reduce((acc, match) => {
        const key = match.round_name || `Round ${match.round_number || 1}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
    }, {});

    const roundsHtml = Object.keys(grouped).map((roundName) => {
        const roundMatches = grouped[roundName]
            .slice()
            .sort((a, b) => Number(a.match_order || 0) - Number(b.match_order || 0));

        const cards = roundMatches.map((match) => renderMatchCard(match)).join('');
        return `
            <section class="admin-round-block" style="margin-bottom:16px;">
                <h4 style="margin:0 0 10px 0; color:#1f2a44;">${escapeHtml(roundName)}</h4>
                <div style="display:grid; gap:12px;">${cards}</div>
            </section>
        `;
    }).join('');

    container.innerHTML = roundsHtml;
}

function renderMatchCard(match) {
    const matchId = Number(match.id);
    const isExpanded = tournamentState.expandedMatchId === matchId;
    const status = String(match.status || 'pending').toLowerCase();
    const statusColor = status === 'ongoing' ? '#b91c1c' : status === 'finished' ? '#166534' : '#475569';
    const hasLive = Boolean((match.facebook_live_url || '').trim());
    const showLiveBadge = status === 'ongoing' && hasLive;
    const winnerSide = Number(match.winner_team_id) && Number(match.winner_team_id) === Number(match.teamA_participant_id)
        ? 'teamA'
        : (Number(match.winner_team_id) && Number(match.winner_team_id) === Number(match.teamB_participant_id) ? 'teamB' : 'none');
    const winnerLabel = winnerSide === 'teamA'
        ? `${match.teamA} (Team A)`
        : (winnerSide === 'teamB' ? `${match.teamB} (Team B)` : 'Not selected');

    return `
        <article class="admin-match-card" style="border:1px solid #e2e8f0; border-radius:10px; padding:12px; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;">
                <div>
                    <div style="font-size:0.9em; color:#64748b; margin-bottom:4px;">Match #${Number(match.match_order || 0)}</div>
                    <div style="font-size:1rem; font-weight:700;">${escapeHtml(match.teamA)} <span style="color:#64748b;">vs</span> ${escapeHtml(match.teamB)}</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <span style="padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700; color:#fff; background:${statusColor}; text-transform:uppercase;">${escapeHtml(status)}</span>
                    ${showLiveBadge ? '<span style="padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:700; color:#fff; background:#dc2626;">LIVE</span>' : ''}
                </div>
            </div>
            <div style="margin-top:8px; font-size:0.9em; color:#334155;"><strong>Winner:</strong> ${escapeHtml(winnerLabel)}</div>

            <div style="display:grid; grid-template-columns: minmax(180px, 1fr) auto auto auto; gap:8px; margin-top:10px; align-items:center;" class="admin-match-controls">
                <input type="text" id="matchLiveUrl-${matchId}" value="${escapeAttr(match.facebook_live_url || '')}" placeholder="Paste Facebook Live URL" class="search-box" style="width:100%;">
                <button class="btn btn-secondary" onclick="saveMatchLiveUrl(${matchId})">Save Link</button>
                <button class="btn btn-secondary" onclick="removeMatchLiveUrl(${matchId})">Remove Link</button>
                <select id="matchStatus-${matchId}" class="search-box" style="padding:8px 10px;">
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="ongoing" ${status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                    <option value="finished" ${status === 'finished' ? 'selected' : ''}>Finished</option>
                </select>
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                <button class="btn btn-primary" onclick="updateMatchStatus(${matchId})">Update Status</button>
                <button class="btn btn-secondary" onclick="toggleMatchVideo(${matchId})">${isExpanded ? 'Switch Video' : 'Watch Video'}</button>
            </div>
            <div style="display:grid; grid-template-columns: minmax(170px,1fr) minmax(170px,1fr) auto auto; gap:8px; margin-top:8px; align-items:center;" class="admin-match-controls">
                <input type="text" id="matchTeamA-${matchId}" value="${escapeAttr(match.teamA || '')}" class="search-box" placeholder="Team A name">
                <input type="text" id="matchTeamB-${matchId}" value="${escapeAttr(match.teamB || '')}" class="search-box" placeholder="Team B name">
                <button class="btn btn-secondary" onclick="saveMatchOpponents(${matchId})">Update Opponents</button>
                <select id="matchWinner-${matchId}" class="search-box" style="padding:8px 10px;">
                    <option value="none" ${winnerSide === 'none' ? 'selected' : ''}>No Winner</option>
                    <option value="teamA" ${winnerSide === 'teamA' ? 'selected' : ''}>Winner: Team A</option>
                    <option value="teamB" ${winnerSide === 'teamB' ? 'selected' : ''}>Winner: Team B</option>
                </select>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                <button class="btn btn-primary" onclick="saveMatchWinner(${matchId})">Update Winner</button>
                <button class="btn btn-secondary" onclick="revertMatchWinner(${matchId})">Revert Winner</button>
            </div>

            <div class="match-video-panel ${isExpanded ? 'expanded' : ''}" style="margin-top:10px; overflow:hidden; transition:max-height .25s ease, opacity .25s ease; max-height:${isExpanded ? '700px' : '0'}; opacity:${isExpanded ? '1' : '0'};">
                ${isExpanded ? renderMatchVideoPanel(match) : ''}
            </div>
        </article>
    `;
}

function renderMatchVideoPanel(match) {
    const rawUrl = (match.facebook_live_url || '').trim();
    if (!rawUrl) {
        return `
            <div style="padding:10px; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc;">
                <p style="margin:0 0 8px 0; color:#475569;">Live stream not available for this battle yet.</p>
                <button class="btn btn-secondary" onclick="minimizeMatchVideo()">Minimize Video</button>
            </div>
        `;
    }

    const embedUrl = toFacebookEmbedUrl(rawUrl);
    return `
        <div style="padding:10px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc;">
            <div style="position:relative; padding-top:56.25%; border-radius:8px; overflow:hidden; background:#000;">
                <iframe
                    src="${escapeAttr(embedUrl)}"
                    style="position:absolute; inset:0; width:100%; height:100%; border:0;"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowfullscreen
                    loading="lazy"
                    title="Match ${Number(match.id)} live video"
                ></iframe>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                <a class="btn btn-secondary" href="${escapeAttr(rawUrl)}" target="_blank" rel="noopener">Watch on Facebook</a>
                <button class="btn btn-secondary" onclick="minimizeMatchVideo()">Minimize Video</button>
            </div>
        </div>
    `;
}

function toFacebookEmbedUrl(url) {
    const trimmed = String(url || '').trim();
    if (!trimmed) return '';
    if (trimmed.includes('facebook.com/plugins/video.php')) return trimmed;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false&width=1280`;
}

function toggleMatchVideo(matchId) {
    const parsedId = Number(matchId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) return;

    if (tournamentState.expandedMatchId === parsedId) {
        tournamentState.expandedMatchId = null;
    } else {
        tournamentState.expandedMatchId = parsedId;
    }

    renderMatches(tournamentState.matches);
}

function minimizeMatchVideo() {
    tournamentState.expandedMatchId = null;
    renderMatches(tournamentState.matches);
}

async function saveMatchLiveUrl(matchId) {
    const input = document.getElementById(`matchLiveUrl-${matchId}`);
    const value = input ? input.value.trim() : '';

    const result = await adminApi.updateMatchLiveUrl(matchId, value);
    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to save live link.', 'error');
        return;
    }

    showTournamentMessage('Live link updated.', 'success');
    await loadMatchesForEvent(tournamentState.selectedEventId);
}

async function removeMatchLiveUrl(matchId) {
    const result = await adminApi.updateMatchLiveUrl(matchId, '');
    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to remove live link.', 'error');
        return;
    }

    if (tournamentState.expandedMatchId === Number(matchId)) {
        tournamentState.expandedMatchId = null;
    }

    showTournamentMessage('Live link removed.', 'success');
    await loadMatchesForEvent(tournamentState.selectedEventId);
}

async function updateMatchStatus(matchId) {
    const select = document.getElementById(`matchStatus-${matchId}`);
    const status = select ? select.value : '';

    const result = await adminApi.updateMatchStatus(matchId, status);
    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to update match status.', 'error');
        return;
    }

    showTournamentMessage('Match status updated.', 'success');
    await loadMatchesForEvent(tournamentState.selectedEventId);
}

async function saveMatchWinner(matchId) {
    const winnerSelect = document.getElementById(`matchWinner-${matchId}`);
    const winnerSide = winnerSelect ? winnerSelect.value : 'none';
    const result = await adminApi.updateMatchWinner(matchId, winnerSide);
    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to update winner.', 'error');
        return;
    }
    showTournamentMessage('Winner updated.', 'success');
    await loadMatchesForEvent(tournamentState.selectedEventId);
}

async function revertMatchWinner(matchId) {
    const result = await adminApi.updateMatchWinner(matchId, 'none');
    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to revert winner.', 'error');
        return;
    }
    const winnerSelect = document.getElementById(`matchWinner-${matchId}`);
    if (winnerSelect) winnerSelect.value = 'none';
    showTournamentMessage('Winner reverted successfully.', 'success');
    await loadMatchesForEvent(tournamentState.selectedEventId);
}

async function saveMatchOpponents(matchId) {
    const teamAInput = document.getElementById(`matchTeamA-${matchId}`);
    const teamBInput = document.getElementById(`matchTeamB-${matchId}`);
    const teamA = teamAInput ? teamAInput.value.trim() : '';
    const teamB = teamBInput ? teamBInput.value.trim() : '';

    if (!teamA || !teamB) {
        showTournamentMessage('Both Team A and Team B are required.', 'error');
        return;
    }

    const current = tournamentState.matches.find((m) => Number(m.id) === Number(matchId));
    const payload = {
        teamA,
        teamB,
        teamA_participant_id: current?.teamA === teamA ? current?.teamA_participant_id : null,
        teamB_participant_id: current?.teamB === teamB ? current?.teamB_participant_id : null
    };

    const result = await adminApi.updateMatchOpponents(matchId, payload);
    if (!result.success) {
        showTournamentMessage(result.message || 'Failed to update opponents.', 'error');
        return;
    }
    showTournamentMessage('Opponents updated. Winner was reset to avoid mismatch.', 'success');
    await loadMatchesForEvent(tournamentState.selectedEventId);
}

function showTournamentMessage(message, type = 'info') {
    const messageDiv = document.getElementById('tournamentMessage');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#eff6ff';
    messageDiv.style.color = type === 'error' ? '#b91c1c' : type === 'success' ? '#166534' : '#1d4ed8';
    messageDiv.style.borderLeft = `4px solid ${type === 'error' ? '#b91c1c' : type === 'success' ? '#166534' : '#1d4ed8'}`;

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 4500);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.style.display = 'none';
    });
}

window.removeTeamFromTournament = removeTeamFromTournament;
window.toggleMatchVideo = toggleMatchVideo;
window.minimizeMatchVideo = minimizeMatchVideo;
window.saveMatchLiveUrl = saveMatchLiveUrl;
window.removeMatchLiveUrl = removeMatchLiveUrl;
window.updateMatchStatus = updateMatchStatus;
window.saveMatchWinner = saveMatchWinner;
window.revertMatchWinner = revertMatchWinner;
window.saveMatchOpponents = saveMatchOpponents;

document.addEventListener('DOMContentLoaded', () => {
    initTournament();
    updateBracketButtonLabel();
});
