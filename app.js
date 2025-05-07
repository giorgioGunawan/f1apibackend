const API_URL = 'https://f1apibackend-1.onrender.com';

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

// Convert timestamp to datetime-local format for form inputs
function timestampToDateTimeLocal(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    // Format: YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
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
                <td>${race.datetime_fp1 ? formatDate(race.datetime_fp1) : 'N/A'}</td>
                <td>${race.datetime_fp2 ? formatDate(race.datetime_fp2) : 'N/A'}</td>
                <td>${race.datetime_fp3 ? formatDate(race.datetime_fp3) : 'N/A'}</td>
                <td>${race.datetime_sprint ? formatDate(race.datetime_sprint) : 'N/A'}</td>
                <td>${race.datetime_qualifying ? formatDate(race.datetime_qualifying) : 'N/A'}</td>
                <td>${race.datetime_race ? formatDate(race.datetime_race) : 'N/A'}</td>
                <td>
                    <button class="edit-btn" data-id="${race.id}">Edit</button>
                    <button class="delete-btn" data-id="${race.id}" data-name="${race.name}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEditRace);
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDeleteRace);
        });
    } catch (error) {
        console.error('Error fetching races:', error);
        document.getElementById('races-table-body').innerHTML = 
            `<tr><td colspan="10">Error loading races: ${error.message}</td></tr>`;
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

// Handle edit race button click
async function handleEditRace(event) {
    const raceId = event.target.dataset.id;
    
    try {
        const response = await fetch(`${API_URL}/api/races/${raceId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch race details');
        }
        
        const race = await response.json();
        
        // Switch form to edit mode
        document.getElementById('form-title').textContent = 'Edit Race';
        document.getElementById('race-form').dataset.mode = 'edit';
        document.getElementById('race-form').dataset.raceId = raceId;
        
        // Fill form with race data
        document.getElementById('name').value = race.name;
        document.getElementById('location').value = race.location;
        document.getElementById('datetime_fp1').value = race.datetime_fp1 ? timestampToDateTimeLocal(race.datetime_fp1) : '';
        document.getElementById('datetime_fp2').value = race.datetime_fp2 ? timestampToDateTimeLocal(race.datetime_fp2) : '';
        document.getElementById('datetime_fp3').value = race.datetime_fp3 ? timestampToDateTimeLocal(race.datetime_fp3) : '';
        document.getElementById('datetime_sprint').value = race.datetime_sprint ? timestampToDateTimeLocal(race.datetime_sprint) : '';
        document.getElementById('datetime_qualifying').value = race.datetime_qualifying ? timestampToDateTimeLocal(race.datetime_qualifying) : '';
        document.getElementById('datetime_race').value = race.datetime_race ? timestampToDateTimeLocal(race.datetime_race) : '';
        
        // Change button text
        document.getElementById('form-submit-btn').textContent = 'Update Race';
        
        // Add cancel button functionality
        document.getElementById('form-cancel-btn').style.display = 'inline-block';
        
        // Scroll to form
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error fetching race details:', error);
        alert(`Error: ${error.message}`);
    }
}

// Handle delete race
async function handleDeleteRace(event) {
    const raceId = event.target.dataset.id;
    const raceName = event.target.dataset.name;
    
    if (confirm(`Are you sure you want to delete "${raceName}"?`)) {
        try {
            const response = await fetch(`${API_URL}/api/races/${raceId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete race');
            }
            
            // Refresh race lists
            fetchRaces();
            fetchNextRace();
            
        } catch (error) {
            console.error('Error deleting race:', error);
            alert(`Error: ${error.message}`);
        }
    }
}

// Reset form to add mode
function resetForm() {
    document.getElementById('form-title').textContent = 'Add New Race';
    document.getElementById('race-form').dataset.mode = 'add';
    document.getElementById('race-form').reset();
    document.getElementById('form-submit-btn').textContent = 'Add Race';
    document.getElementById('form-cancel-btn').style.display = 'none';
    document.getElementById('form-message').className = '';
    document.getElementById('form-message').textContent = '';
}

// Handle form submission (both add and edit)
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formMessage = document.getElementById('form-message');
    formMessage.className = '';
    formMessage.textContent = '';
    
    const name = document.getElementById('name').value;
    const location = document.getElementById('location').value;
    const datetime_fp1 = document.getElementById('datetime_fp1').value ? dateTimeToTimestamp(document.getElementById('datetime_fp1').value) : null;
    const datetime_fp2 = document.getElementById('datetime_fp2').value ? dateTimeToTimestamp(document.getElementById('datetime_fp2').value) : null;
    const datetime_fp3 = document.getElementById('datetime_fp3').value ? dateTimeToTimestamp(document.getElementById('datetime_fp3').value) : null;
    const datetime_sprint = document.getElementById('datetime_sprint').value ? dateTimeToTimestamp(document.getElementById('datetime_sprint').value) : null;
    const datetime_qualifying = document.getElementById('datetime_qualifying').value ? dateTimeToTimestamp(document.getElementById('datetime_qualifying').value) : null;
    const datetime_race = document.getElementById('datetime_race').value ? dateTimeToTimestamp(document.getElementById('datetime_race').value) : null;
    
    if (!name || !location || !datetime_race) {
        formMessage.className = 'error';
        formMessage.textContent = 'Please fill in all required fields';
        return;
    }
    
    const raceData = { 
        name, 
        location, 
        datetime_fp1, 
        datetime_fp2, 
        datetime_fp3, 
        datetime_sprint, 
        datetime_qualifying, 
        datetime_race 
    };
    
    const isEditMode = document.getElementById('race-form').dataset.mode === 'edit';
    const raceId = document.getElementById('race-form').dataset.raceId;
    
    try {
        const url = isEditMode 
            ? `${API_URL}/api/races/${raceId}` 
            : `${API_URL}/api/races`;
            
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(raceData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'add'} race`);
        }
        
        const result = await response.json();
        
        // Reset form
        resetForm();
        
        // Show success message
        formMessage.className = 'success';
        formMessage.textContent = `Race "${result.name}" ${isEditMode ? 'updated' : 'added'} successfully!`;
        
        // Refresh race lists
        fetchRaces();
        fetchNextRace();
        
    } catch (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'adding'} race:`, error);
        formMessage.className = 'error';
        formMessage.textContent = `Error: ${error.message}`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchRaces();
    fetchNextRace();
    document.getElementById('race-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('form-cancel-btn').addEventListener('click', (e) => {
        e.preventDefault();
        resetForm();
    });
});