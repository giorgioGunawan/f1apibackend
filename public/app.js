document.addEventListener('DOMContentLoaded', function() {
    // API base URL
    const API_BASE_URL = '/api';

    // Navigation
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const sections = document.querySelectorAll('.section');

    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all menu items and sections
            menuItems.forEach(mi => mi.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked menu item and corresponding section
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            // Load data for the selected section
            switch(sectionId) {
                case 'races':
                    loadRaces();
                    break;
                case 'results':
                    loadResults();
                    break;
                case 'driver-standings':
                    loadDriverStandings();
                    break;
                case 'constructor-standings':
                    loadConstructorStandings();
                    break;
                case 'live-race':
                    loadLiveRace();
                    break;
            }
        });
    });

    // Modal handling
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Helper functions
    function formatDateTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    function formatDateTimeForInput(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toISOString().slice(0, 16);
    }

    function timestampFromInput(dateTimeString) {
        if (!dateTimeString) return null;
        return Math.floor(new Date(dateTimeString).getTime() / 1000);
    }

    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // ===== RACES =====
    const racesTable = document.getElementById('races-table').querySelector('tbody');
    const raceForm = document.getElementById('race-form');

    // Load races
    function loadRaces() {
        fetch(`${API_BASE_URL}/races`)
            .then(response => response.json())
            .then(races => {
                racesTable.innerHTML = races.length ? '' : '<tr><td colspan="7">No races found</td></tr>';
                
                races.forEach(race => {
                    const row = document.createElement('tr');
                    let podiumInfo = 'Not completed';
                    if (race.first_place) {
                        podiumInfo = `1. ${race.first_place}<br>2. ${race.second_place}<br>3. ${race.third_place}`;
                    }
                    
                    row.innerHTML = `
                        <td>${race.id}</td>
                        <td>${race.round || 'N/A'}</td>
                        <td>${race.name}</td>
                        <td>${race.location}</td>
                        <td>${formatDateTime(race.datetime_race)}</td>
                        <td>${podiumInfo}</td>
                        <td class="action-buttons">
                            <button class="btn btn-info edit-race" data-id="${race.id}">Edit</button>
                            <button class="btn btn-danger delete-race" data-id="${race.id}">Delete</button>
                        </td>
                    `;
                    racesTable.appendChild(row);
                });

                // Add event listeners to buttons
                attachRaceButtonListeners();
            })
            .catch(error => {
                console.error('Error loading races:', error);
                showAlert('Error loading races', 'danger');
            });
    }

    function attachRaceButtonListeners() {
        document.querySelectorAll('.edit-race').forEach(button => {
            button.addEventListener('click', function() {
                const raceId = this.getAttribute('data-id');
                editRace(raceId);
            });
        });

        document.querySelectorAll('.delete-race').forEach(button => {
            button.addEventListener('click', function() {
                const raceId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this race?')) {
                    deleteRace(raceId);
                }
            });
        });
    }

    // Add race
    document.getElementById('add-race-btn').addEventListener('click', () => {
        raceForm.reset();
        document.getElementById('race-id').value = '';
        document.getElementById('race-form-title').textContent = 'Add Race';
        document.getElementById('race-submit-btn').textContent = 'Add Race';
        openModal('race-modal');
    });

    // Edit race
    function editRace(raceId) {
        fetch(`${API_BASE_URL}/races/${raceId}`)
            .then(response => response.json())
            .then(race => {
                document.getElementById('race-id').value = race.id;
                document.getElementById('race-round').value = race.round || '';
                document.getElementById('race-name').value = race.name;
                document.getElementById('race-location').value = race.location;
                document.getElementById('race-fp1').value = formatDateTimeForInput(race.datetime_fp1);
                document.getElementById('race-fp2').value = formatDateTimeForInput(race.datetime_fp2);
                document.getElementById('race-fp3').value = formatDateTimeForInput(race.datetime_fp3);
                document.getElementById('race-sprint').value = formatDateTimeForInput(race.datetime_sprint);
                document.getElementById('race-qualifying').value = formatDateTimeForInput(race.datetime_qualifying);
                document.getElementById('race-race').value = formatDateTimeForInput(race.datetime_race);
                document.getElementById('race-first').value = race.first_place || '';
                document.getElementById('race-second').value = race.second_place || '';
                document.getElementById('race-third').value = race.third_place || '';
                
                document.getElementById('race-form-title').textContent = 'Edit Race';
                document.getElementById('race-submit-btn').textContent = 'Update Race';
                openModal('race-modal');
            })
            .catch(error => {
                console.error('Error loading race:', error);
                showAlert('Error loading race details', 'danger');
            });
    }

    // Delete race
    function deleteRace(raceId) {
        fetch(`${API_BASE_URL}/races/${raceId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            loadRaces();
            showAlert('Race deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting race:', error);
            showAlert('Error deleting race', 'danger');
        });
    }

    // Handle race form submission
    raceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const raceId = document.getElementById('race-id').value;
        const raceData = {
            round: document.getElementById('race-round').value || null,
            name: document.getElementById('race-name').value,
            location: document.getElementById('race-location').value,
            datetime_fp1: timestampFromInput(document.getElementById('race-fp1').value),
            datetime_fp2: timestampFromInput(document.getElementById('race-fp2').value),
            datetime_fp3: timestampFromInput(document.getElementById('race-fp3').value),
            datetime_sprint: timestampFromInput(document.getElementById('race-sprint').value),
            datetime_qualifying: timestampFromInput(document.getElementById('race-qualifying').value),
            datetime_race: timestampFromInput(document.getElementById('race-race').value),
            first_place: document.getElementById('race-first').value || null,
            second_place: document.getElementById('race-second').value || null,
            third_place: document.getElementById('race-third').value || null
        };

        const method = raceId ? 'PUT' : 'POST';
        const url = raceId ? `${API_BASE_URL}/races/${raceId}` : `${API_BASE_URL}/races`;

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(raceData)
        })
        .then(response => response.json())
        .then(() => {
            closeModal('race-modal');
            loadRaces();
            showAlert(`Race ${raceId ? 'updated' : 'added'} successfully`);
        })
        .catch(error => {
            console.error('Error saving race:', error);
            showAlert('Error saving race', 'danger');
        });
    });

    // Cancel buttons
    document.getElementById('race-cancel-btn').addEventListener('click', () => {
        closeModal('race-modal');
    });

    // ===== RESULTS =====
    const resultsTable = document.getElementById('results-table').querySelector('tbody');
    const resultForm = document.getElementById('result-form');

    function loadResults() {
        // First load races for the select dropdown
        fetch(`${API_BASE_URL}/races`)
            .then(response => response.json())
            .then(races => {
                const raceSelect = document.getElementById('result-race');
                raceSelect.innerHTML = '<option value="">Select Race</option>';
                races.forEach(race => {
                    raceSelect.innerHTML += `<option value="${race.id}">${race.name}</option>`;
                });
            });

        // Then load results
        fetch(`${API_BASE_URL}/results`)
            .then(response => response.json())
            .then(results => {
                resultsTable.innerHTML = results.length ? '' : '<tr><td colspan="9">No results found</td></tr>';
                
                results.forEach(result => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${result.id}</td>
                        <td>${result.race_name || 'Unknown Race'}</td>
                        <td>${result.session_type}</td>
                        <td>${result.position}</td>
                        <td>${result.driver_name}</td>
                        <td>${result.team_name}</td>
                        <td>${result.time || 'N/A'}</td>
                        <td>${result.points || '0'}</td>
                        <td class="action-buttons">
                            <button class="btn btn-info edit-result" data-id="${result.id}">Edit</button>
                            <button class="btn btn-danger delete-result" data-id="${result.id}">Delete</button>
                        </td>
                    `;
                    resultsTable.appendChild(row);
                });

                attachResultButtonListeners();
            })
            .catch(error => {
                console.error('Error loading results:', error);
                showAlert('Error loading results', 'danger');
            });
    }

    // Add result
    document.getElementById('add-result-btn').addEventListener('click', () => {
        resultForm.reset();
        document.getElementById('result-id').value = '';
        document.getElementById('result-form-title').textContent = 'Add Result';
        document.getElementById('result-submit-btn').textContent = 'Add Result';
        openModal('result-modal');
    });

    function attachResultButtonListeners() {
        document.querySelectorAll('.edit-result').forEach(button => {
            button.addEventListener('click', function() {
                const resultId = this.getAttribute('data-id');
                editResult(resultId);
            });
        });

        document.querySelectorAll('.delete-result').forEach(button => {
            button.addEventListener('click', function() {
                const resultId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this result?')) {
                    deleteResult(resultId);
                }
            });
        });
    }

    function editResult(resultId) {
        fetch(`${API_BASE_URL}/results/${resultId}`)
            .then(response => response.json())
            .then(result => {
                document.getElementById('result-id').value = result.id;
                document.getElementById('result-race').value = result.race_id;
                document.getElementById('result-session').value = result.session_type;
                document.getElementById('result-position').value = result.position;
                document.getElementById('result-driver').value = result.driver_name;
                document.getElementById('result-team').value = result.team_name;
                document.getElementById('result-time').value = result.time || '';
                document.getElementById('result-points').value = result.points || 0;
                document.getElementById('result-laps').value = result.laps || 0;
                
                document.getElementById('result-form-title').textContent = 'Edit Result';
                document.getElementById('result-submit-btn').textContent = 'Update Result';
                openModal('result-modal');
            })
            .catch(error => {
                console.error('Error loading result:', error);
                showAlert('Error loading result details', 'danger');
            });
    }

    function deleteResult(resultId) {
        fetch(`${API_BASE_URL}/results/${resultId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            loadResults();
            showAlert('Result deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting result:', error);
            showAlert('Error deleting result', 'danger');
        });
    }

    // Handle result form submission
    resultForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const resultId = document.getElementById('result-id').value;
        const resultData = {
            race_id: document.getElementById('result-race').value,
            session_type: document.getElementById('result-session').value,
            position: Number(document.getElementById('result-position').value),
            driver_name: document.getElementById('result-driver').value,
            team_name: document.getElementById('result-team').value,
            time: document.getElementById('result-time').value || null,
            laps: Number(document.getElementById('result-laps').value) || null,
            points: Number(document.getElementById('result-points').value) || 0
        };

        const method = resultId ? 'PUT' : 'POST';
        const url = resultId ? 
            `${API_BASE_URL}/results/${resultId}` : 
            `${API_BASE_URL}/results`;

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resultData)
        })
        .then(response => response.json())
        .then(() => {
            closeModal('result-modal');
            loadResults();
            showAlert(`Result ${resultId ? 'updated' : 'added'} successfully`);
        })
        .catch(error => {
            console.error('Error saving result:', error);
            showAlert('Error saving result', 'danger');
        });
    });

    // Cancel button for results
    document.getElementById('result-cancel-btn').addEventListener('click', () => {
        closeModal('result-modal');
    });

    // ===== DRIVER STANDINGS =====
    const driverStandingsTable = document.getElementById('driver-standings-table').querySelector('tbody');
    const driverStandingForm = document.getElementById('driver-standing-form');

    function loadDriverStandings() {
        fetch(`${API_BASE_URL}/driver-standings`)
            .then(response => response.json())
            .then(standings => {
                renderDriverStandingsTable(standings);
            })
            .catch(error => {
                console.error('Error loading driver standings:', error);
                showAlert('Error loading driver standings', 'danger');
            });
    }

    // Function to render driver standings table
    function renderDriverStandingsTable(data) {
        const tbody = document.querySelector('#driver-standings-table tbody');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6">No driver standings found</td>';
            tbody.appendChild(row);
            return;
        }
        
        data.forEach(standing => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${standing.id}</td>
                <td>${standing.driver_name}</td>
                <td>${standing.driver_number || ''}</td>
                <td>${standing.team_name}</td>
                <td>${standing.points}</td>
                <td class="action-buttons">
                    <button class="btn btn-info edit-driver-standing" data-id="${standing.id}">Edit</button>
                    <button class="btn btn-danger delete-driver-standing" data-id="${standing.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-driver-standing').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editDriverStanding(id);
            });
        });
        
        document.querySelectorAll('.delete-driver-standing').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteDriverStanding(id);
            });
        });
    }

    // Add driver standing
    document.getElementById('add-driver-standing-btn').addEventListener('click', () => {
        driverStandingForm.reset();
        document.getElementById('driver-standing-id').value = '';
        document.getElementById('driver-standing-form-title').textContent = 'Add Driver Standing';
        document.getElementById('driver-standing-submit-btn').textContent = 'Add Standing';
        openModal('driver-standing-modal');
    });

    function editDriverStanding(standingId) {
        fetch(`${API_BASE_URL}/driver-standings/${standingId}`)
            .then(response => response.json())
            .then(standing => {
                populateDriverStandingForm(standing);
                document.getElementById('driver-standing-form-title').textContent = 'Edit Driver Standing';
                document.getElementById('driver-standing-submit-btn').textContent = 'Update Standing';
                openModal('driver-standing-modal');
            })
            .catch(error => {
                console.error('Error loading driver standing:', error);
                showAlert('Error loading driver standing details', 'danger');
            });
    }

    function deleteDriverStanding(standingId) {
        fetch(`${API_BASE_URL}/driver-standings/${standingId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            loadDriverStandings();
            showAlert('Driver standing deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting driver standing:', error);
            showAlert('Error deleting driver standing', 'danger');
        });
    }

    // Function to populate driver standing form for editing
    function populateDriverStandingForm(data) {
        document.getElementById('driver-standing-id').value = data.id || '';
        document.getElementById('driver-standing-name').value = data.driver_name || '';
        document.getElementById('driver-standing-team').value = data.team_name || '';
        document.getElementById('driver-standing-points').value = data.points || '';
        document.getElementById('driver-standing-number').value = data.driver_number || '';
    }

    // Event listener for driver standing form submission
    document.getElementById('driver-standing-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('driver-standing-id').value;
        const data = {
            driver_name: document.getElementById('driver-standing-name').value,
            team_name: document.getElementById('driver-standing-team').value,
            points: parseFloat(document.getElementById('driver-standing-points').value),
            driver_number: document.getElementById('driver-standing-number').value || null
        };
        
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/driver-standings/${id}` : '/api/driver-standings';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            closeModal('driver-standing-modal');
            loadDriverStandings();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was a problem saving the driver standing');
        });
    });

    // Cancel button for driver standings
    document.getElementById('driver-standing-cancel-btn').addEventListener('click', () => {
        closeModal('driver-standing-modal');
    });

    // ===== CONSTRUCTOR STANDINGS =====
    const constructorStandingsTable = document.getElementById('constructor-standings-table').querySelector('tbody');
    const constructorStandingForm = document.getElementById('constructor-standing-form');

    function loadConstructorStandings() {
        fetch(`${API_BASE_URL}/constructor-standings`)
            .then(response => response.json())
            .then(standings => {
                renderConstructorStandingsTable(standings);
            })
            .catch(error => {
                console.error('Error loading constructor standings:', error);
                showAlert('Error loading constructor standings', 'danger');
            });
    }

    // Function to render constructor standings table
    function renderConstructorStandingsTable(data) {
        const tbody = document.querySelector('#constructor-standings-table tbody');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7">No constructor standings found</td>';
            tbody.appendChild(row);
            return;
        }
        
        data.forEach(standing => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${standing.id}</td>
                <td>${standing.constructor_name}</td>
                <td>${standing.points}</td>
                <td>${standing.driver_name_1 || ''}</td>
                <td>${standing.driver_name_2 || ''}</td>
                <td>${standing.driver_name_3 || ''}</td>
                <td class="action-buttons">
                    <button class="btn btn-info edit-constructor-standing" data-id="${standing.id}">Edit</button>
                    <button class="btn btn-danger delete-constructor-standing" data-id="${standing.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-constructor-standing').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editConstructorStanding(id);
            });
        });
        
        document.querySelectorAll('.delete-constructor-standing').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteConstructorStanding(id);
            });
        });
    }

    // Add constructor standing
    document.getElementById('add-constructor-standing-btn').addEventListener('click', () => {
        constructorStandingForm.reset();
        document.getElementById('constructor-standing-id').value = '';
        document.getElementById('constructor-standing-form-title').textContent = 'Add Constructor Standing';
        document.getElementById('constructor-standing-submit-btn').textContent = 'Add Standing';
        openModal('constructor-standing-modal');
    });

    function editConstructorStanding(standingId) {
        fetch(`${API_BASE_URL}/constructor-standings/${standingId}`)
            .then(response => response.json())
            .then(standing => {
                populateConstructorStandingForm(standing);
                document.getElementById('constructor-standing-form-title').textContent = 'Edit Constructor Standing';
                document.getElementById('constructor-standing-submit-btn').textContent = 'Update Standing';
                openModal('constructor-standing-modal');
            })
            .catch(error => {
                console.error('Error loading constructor standing:', error);
                showAlert('Error loading constructor standing details', 'danger');
            });
    }

    function deleteConstructorStanding(standingId) {
        fetch(`${API_BASE_URL}/constructor-standings/${standingId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            loadConstructorStandings();
            showAlert('Constructor standing deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting constructor standing:', error);
            showAlert('Error deleting constructor standing', 'danger');
        });
    }

    // Function to populate constructor standing form for editing
    function populateConstructorStandingForm(data) {
        document.getElementById('constructor-standing-id').value = data.id || '';
        document.getElementById('constructor-standing-name').value = data.constructor_name || '';
        document.getElementById('constructor-standing-points').value = data.points || '';
        document.getElementById('constructor-standing-driver1').value = data.driver_name_1 || '';
        document.getElementById('constructor-standing-driver2').value = data.driver_name_2 || '';
        document.getElementById('constructor-standing-driver3').value = data.driver_name_3 || '';
    }

    // Event listener for constructor standing form submission
    document.getElementById('constructor-standing-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('constructor-standing-id').value;
        const data = {
            constructor_name: document.getElementById('constructor-standing-name').value,
            points: parseFloat(document.getElementById('constructor-standing-points').value),
            driver_name_1: document.getElementById('constructor-standing-driver1').value || null,
            driver_name_2: document.getElementById('constructor-standing-driver2').value || null,
            driver_name_3: document.getElementById('constructor-standing-driver3').value || null
        };
        
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/constructor-standings/${id}` : '/api/constructor-standings';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            closeModal('constructor-standing-modal');
            loadConstructorStandings();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was a problem saving the constructor standing');
        });
    });

    // Cancel button for constructor standings
    document.getElementById('constructor-standing-cancel-btn').addEventListener('click', () => {
        closeModal('constructor-standing-modal');
    });

    // ===== LIVE RACE =====
    const liveRaceTable = document.getElementById('live-race-table').querySelector('tbody');
    const liveRaceForm = document.getElementById('live-race-form');

    function loadLiveRace() {
        fetch(`${API_BASE_URL}/live-race`)
            .then(response => response.json())
            .then(entries => {
                liveRaceTable.innerHTML = entries.length ? '' : '<tr><td colspan="8">No live race entries found</td></tr>';
                
                entries.forEach(entry => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${entry.position}</td>
                        <td>${entry.driver_name}</td>
                        <td>${entry.team_name}</td>
                        <td>${entry.car_number}</td>
                        <td>${entry.gap || 'LEADER'}</td>
                        <td>${entry.lap || 'N/A'}</td>
                        <td>${entry.dnf ? 'Yes' : 'No'}</td>
                        <td class="action-buttons">
                            <button class="btn btn-info edit-live-race" data-id="${entry.id}">Edit</button>
                            <button class="btn btn-danger delete-live-race" data-id="${entry.id}">Delete</button>
                        </td>
                    `;
                    liveRaceTable.appendChild(row);
                });

                attachLiveRaceButtonListeners();
            })
            .catch(error => {
                console.error('Error loading live race:', error);
                showAlert('Error loading live race data', 'danger');
            });
    }

    // Add live race entry
    document.getElementById('add-live-race-entry-btn').addEventListener('click', () => {
        liveRaceForm.reset();
        document.getElementById('live-race-id').value = '';
        document.getElementById('live-race-form-title').textContent = 'Add Live Race Entry';
        document.getElementById('live-race-submit-btn').textContent = 'Add Entry';
        openModal('live-race-modal');
    });

    // Clear all live race entries
    document.getElementById('clear-live-race-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all live race entries?')) {
            fetch(`${API_BASE_URL}/live-race`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(() => {
                loadLiveRace();
                showAlert('Live race data cleared successfully');
            })
            .catch(error => {
                console.error('Error clearing live race:', error);
                showAlert('Error clearing live race data', 'danger');
            });
        }
    });

    function attachLiveRaceButtonListeners() {
        document.querySelectorAll('.edit-live-race').forEach(button => {
            button.addEventListener('click', function() {
                const entryId = this.getAttribute('data-id');
                editLiveRaceEntry(entryId);
            });
        });

        document.querySelectorAll('.delete-live-race').forEach(button => {
            button.addEventListener('click', function() {
                const entryId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this entry?')) {
                    deleteLiveRaceEntry(entryId);
                }
            });
        });
    }

    function editLiveRaceEntry(entryId) {
        fetch(`${API_BASE_URL}/live-race/${entryId}`)
            .then(response => response.json())
            .then(entry => {
                document.getElementById('live-race-id').value = entry.id;
                document.getElementById('live-race-driver').value = entry.driver_name;
                document.getElementById('live-race-team').value = entry.team_name;
                document.getElementById('live-race-car').value = entry.car_number;
                document.getElementById('live-race-position').value = entry.position;
                document.getElementById('live-race-gap').value = entry.gap || '';
                document.getElementById('live-race-lap').value = entry.lap || '';
                document.getElementById('live-race-dnf').value = entry.dnf ? '1' : '0';
                
                document.getElementById('live-race-form-title').textContent = 'Edit Live Race Entry';
                document.getElementById('live-race-submit-btn').textContent = 'Update Entry';
                openModal('live-race-modal');
            })
            .catch(error => {
                console.error('Error loading live race entry:', error);
                showAlert('Error loading entry details', 'danger');
            });
    }

    function deleteLiveRaceEntry(entryId) {
        fetch(`${API_BASE_URL}/live-race/${entryId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            loadLiveRace();
            showAlert('Live race entry deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting live race entry:', error);
            showAlert('Error deleting entry', 'danger');
        });
    }

    // Handle live race form submission
    liveRaceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const entryId = document.getElementById('live-race-id').value;
        const entryData = {
            driver_name: document.getElementById('live-race-driver').value,
            team_name: document.getElementById('live-race-team').value,
            car_number: Number(document.getElementById('live-race-car').value),
            position: Number(document.getElementById('live-race-position').value),
            gap: document.getElementById('live-race-gap').value || null,
            lap: Number(document.getElementById('live-race-lap').value) || null,
            dnf: document.getElementById('live-race-dnf').value === '1'
        };

        const method = entryId ? 'PUT' : 'POST';
        const url = entryId ? 
            `${API_BASE_URL}/live-race/${entryId}` : 
            `${API_BASE_URL}/live-race`;

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entryData)
        })
        .then(response => response.json())
        .then(() => {
            closeModal('live-race-modal');
            loadLiveRace();
            showAlert(`Live race entry ${entryId ? 'updated' : 'added'} successfully`);
        })
        .catch(error => {
            console.error('Error saving live race entry:', error);
            showAlert('Error saving entry', 'danger');
        });
    });

    // Cancel button for live race
    document.getElementById('live-race-cancel-btn').addEventListener('click', () => {
        closeModal('live-race-modal');
    });

    // Initial load of races
    loadRaces();
}); 