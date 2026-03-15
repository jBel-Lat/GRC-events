// Elimination feature functions

async function toggleElimination(participantId, isEliminated) {
    try {
        const response = await fetch(`/api/participants/${participantId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                is_eliminated: isEliminated
            })
        });

        const result = await response.json();
        if (result.success) {
            const eventId = currentEventId;
            loadEventParticipants(eventId);
        } else {
            alert(result.message || 'Failed to update elimination status');
        }
    } catch (error) {
        console.error('Error toggling elimination:', error);
        alert('Error updating elimination status');
    }
}

function openEliminationModal(participantId) {
    const round = prompt('Enter elimination round (e.g., Round 1, Semis, Finals):');
    if (round === null) return; // Cancelled
    
    if (!round.trim()) {
        alert('Please enter a round name');
        return;
    }
    
    markAsEliminated(participantId, round);
}

async function markAsEliminated(participantId, round) {
    try {
        const response = await fetch(`/api/participants/${participantId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                is_eliminated: true,
                elimination_round: round
            })
        });

        const result = await response.json();
        if (result.success) {
            const eventId = currentEventId;
            loadEventParticipants(eventId);
        } else {
            alert(result.message || 'Failed to mark as eliminated');
        }
    } catch (error) {
        console.error('Error marking as eliminated:', error);
        alert('Error marking as eliminated');
    }
}
