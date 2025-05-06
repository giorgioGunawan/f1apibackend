const API_URL = 'https://f1apibackend-1.onrender.com:3000';

// Format timestamp to readable date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

// Convert datetime-local to Unix timestamp
function dateTimeToTimestamp(dateTimeString) {
    const date = new Date(dateTimeString);
    return Math.floor(date.getTime() / 1000);
}

// Fetch all races
async function fetchRaces() {
    try {
        const response = await fetch(`${API_URL}/api/races`);
        if (!response.ok) {
            throw new Error('Failed to fetch races');
        }
        const races = await response.json();
        
        const tableBody = document.getElementById('races-table-body');
        tableBody.innerHTML = '';
        
        races.forEach(race => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${race.id}</td>
                <td>${race.name}</td>
                <td>${race.location}</td>
                <td>${formatDate(race.datetime)}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching races:', error);
        document.getElementById('races-table-body').innerHTML = 
            `<tr><td colspan="4">Error loading races: ${error.message}</td></tr>`;
    }
}

// Fetch next race
async function fetchNextRace() {
    try {
        const response = await fetch(`${API_URL}/api/nextrace`);
        const nextRaceElement = document.getElementById('next-race-details');
        
        if (response.status === 404) {
            nextRaceElement.innerHTML = 'No upcoming races scheduled.';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch next race');
        }
        
        const race = await response.json();
        nextRaceElement.innerHTML = `
            <p><strong>${race.name}</strong></p>
            <p>Location: ${race.location}</p>
            <p>Date & Time: ${formatDate(race.datetime)}</p>
        `;
    } catch (error) {
        console.error('Error fetching next race:', error);
        document.getElementById('next-race-details').innerHTML = 
            `Error loading next race: ${error.message}`;
    }
}

// Add new race
async function addRace(event) {
    event.preventDefault();
    
    const formMessage = document.getElementById('form-message');
    formMessage.className = '';
    formMessage.textContent = '';
    
    const name = document.getElementById('name').value;
    const location = document.getElementById('location').value;
    const datetimeLocal = document.getElementById('datetime').value;
    
    if (!name || !location || !datetimeLocal) {
        formMessage.className = 'error';
        formMessage.textContent = 'Please fill in all fields';
        return;
    }
    
    const datetime = dateTimeToTimestamp(datetimeLocal);
    
    try {
        const response = await fetch(`${API_URL}/api/races`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, location, datetime })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add race');
        }
        
        const result = await response.json();
        
        // Clear form
        document.getElementById('add-race-form').reset();
        
        // Show success message
        formMessage.className = 'success';
        formMessage.textContent = `Race "${result.name}" added successfully!`;
        
        // Refresh race lists
        fetchRaces();
        fetchNextRace();
        
    } catch (error) {
        console.error('Error adding race:', error);
        formMessage.className = 'error';
        formMessage.textContent = `Error: ${error.message}`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchRaces();
    fetchNextRace();
    document.getElementById('add-race-form').addEventListener('submit', addRace);
});