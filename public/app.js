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

    // Global variable to store driver standings data
    let driversData = [];

    // Load driver standings data
    function loadDriverStandings() {
        fetch('/api/driver-standings')
            .then(response => response.json())
            .then(data => {
                driversData = data;
                renderDriverStandingsTable(data);
                
                // Also update driver dropdowns in forms
                updateDriverDropdowns();
            })
            .catch(error => {
                console.error('Error loading driver standings:', error);
            });
    }

    // Update all driver dropdowns with current driver data
    function updateDriverDropdowns() {
        const driverSelects = document.querySelectorAll('.driver-select');
        
        driverSelects.forEach(select => {
            // Save current selection if any
            const currentValue = select.value;
            
            // Clear options except the first placeholder
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add options for each driver
            driversData.forEach(driver => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    name: driver.driver_name,
                    team: driver.team_name,
                    number: driver.driver_number
                });
                option.textContent = `${driver.driver_name} (${driver.driver_number || 'N/A'}) - ${driver.team_name}`;
                select.appendChild(option);
            });
            
            // Restore selection if possible
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    // Initialize the results section
    function initResultsSection() {
        // Load races for the dropdown
        fetch('/api/races')
            .then(response => response.json())
            .then(data => {
                const raceSelect = document.getElementById('result-race');
                const batchRaceSelect = document.getElementById('batch-race');
                
                // Clear existing options
                raceSelect.innerHTML = '<option value="">Select Race</option>';
                batchRaceSelect.innerHTML = '<option value="">Select Race</option>';
                
                // Add options for each race
                data.forEach(race => {
                    const option1 = document.createElement('option');
                    option1.value = race.id;
                    option1.textContent = `${race.name} (${race.location})`;
                    raceSelect.appendChild(option1);
                    
                    const option2 = document.createElement('option');
                    option2.value = race.id;
                    option2.textContent = `${race.name} (${race.location})`;
                    batchRaceSelect.appendChild(option2);
                });
            })
            .catch(error => {
                console.error('Error loading races:', error);
            });
        
        // Make the driver select a driver-select class for auto-updating
        document.getElementById('result-driver').classList.add('driver-select');
        
        // Handle driver selection change
        document.getElementById('result-driver').addEventListener('change', function() {
            if (this.value) {
                const driverData = JSON.parse(this.value);
                document.getElementById('result-team').value = driverData.team;
            } else {
                document.getElementById('result-team').value = '';
            }
        });
        
        // Add event listener for batch results button
        document.getElementById('add-batch-results-btn').addEventListener('click', function() {
            openBatchResultsModal();
        });
        
        // Add event listener for adding a row in batch results
        document.getElementById('add-batch-row-btn').addEventListener('click', function() {
            addBatchResultRow();
        });
        
        // Add event listener for clearing all rows in batch results
        document.getElementById('clear-batch-rows-btn').addEventListener('click', function() {
            document.querySelector('#batch-results-table tbody').innerHTML = '';
        });
        
        // Add event listener for batch results form submission
        document.getElementById('batch-results-form').addEventListener('submit', function(e) {
            e.preventDefault();
            submitBatchResults();
        });
        
        // Add event listener for batch cancel button
        document.getElementById('batch-cancel-btn').addEventListener('click', function() {
            closeModal('batch-results-modal');
        });
    }

    // Open the batch results modal
    function openBatchResultsModal() {
        // Clear previous entries
        document.querySelector('#batch-results-table tbody').innerHTML = '';
        
        // Add initial rows (e.g., 20 for a full F1 grid)
        for (let i = 1; i <= 20; i++) {
            addBatchResultRow(i);
        }
        
        openModal('batch-results-modal');
    }

    // Add a row to the batch results table
    function addBatchResultRow(position = null) {
        const tbody = document.querySelector('#batch-results-table tbody');
        const row = document.createElement('tr');
        
        // Create position cell
        const posCell = document.createElement('td');
        const posInput = document.createElement('input');
        posInput.type = 'number';
        posInput.className = 'form-control batch-position';
        posInput.min = '1';
        posInput.required = true;
        posInput.value = position || '';
        posCell.appendChild(posInput);
        
        // Create driver cell
        const driverCell = document.createElement('td');
        const driverSelect = document.createElement('select');
        driverSelect.className = 'form-control driver-select batch-driver';
        driverSelect.innerHTML = '<option value="">Select Driver</option>';
        
        // Add driver options
        driversData.forEach(driver => {
            const option = document.createElement('option');
            option.value = JSON.stringify({
                name: driver.driver_name,
                team: driver.team_name,
                number: driver.driver_number
            });
            option.textContent = `${driver.driver_name} (${driver.driver_number || 'N/A'})`;
            driverSelect.appendChild(option);
        });
        
        // Add change event to update team
        driverSelect.addEventListener('change', function() {
            const teamInput = this.parentNode.nextElementSibling.querySelector('input');
            if (this.value) {
                const driverData = JSON.parse(this.value);
                teamInput.value = driverData.team;
            } else {
                teamInput.value = '';
            }
        });
        
        driverCell.appendChild(driverSelect);
        
        // Create team cell
        const teamCell = document.createElement('td');
        const teamInput = document.createElement('input');
        teamInput.type = 'text';
        teamInput.className = 'form-control batch-team';
        teamInput.readOnly = true;
        teamCell.appendChild(teamInput);
        
        // Create time cell
        const timeCell = document.createElement('td');
        const timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.className = 'form-control batch-time';
        timeInput.placeholder = 'e.g. 1:23.456 or +5.123s';
        timeCell.appendChild(timeInput);
        
        // Create laps cell
        const lapsCell = document.createElement('td');
        const lapsInput = document.createElement('input');
        lapsInput.type = 'number';
        lapsInput.className = 'form-control batch-laps';
        lapsInput.min = '0';
        lapsCell.appendChild(lapsInput);
        
        // Create points cell
        const pointsCell = document.createElement('td');
        const pointsInput = document.createElement('input');
        pointsInput.type = 'number';
        pointsInput.className = 'form-control batch-points';
        pointsInput.min = '0';
        pointsInput.step = '0.01';
        
        // Auto-fill points based on position for race sessions
        if (position && document.getElementById('batch-session').value === 'race') {
            const pointsMap = {
                1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 
                6: 8, 7: 6, 8: 4, 9: 2, 10: 1
            };
            pointsInput.value = pointsMap[position] || 0;
        }
        
        pointsCell.appendChild(pointsInput);
        
        // Add all cells to the row
        row.appendChild(posCell);
        row.appendChild(driverCell);
        row.appendChild(teamCell);
        row.appendChild(timeCell);
        row.appendChild(lapsCell);
        row.appendChild(pointsCell);
        
        // Add the row to the table
        tbody.appendChild(row);
    }

    // Submit batch results
    function submitBatchResults() {
        const raceId = document.getElementById('batch-race').value;
        const sessionType = document.getElementById('batch-session').value;
        
        if (!raceId || !sessionType) {
            alert('Please select a race and session type');
            return;
        }
        
        const rows = document.querySelectorAll('#batch-results-table tbody tr');
        const results = [];
        
        // Collect data from each row
        rows.forEach(row => {
            const position = row.querySelector('.batch-position').value;
            const driverSelect = row.querySelector('.batch-driver');
            const time = row.querySelector('.batch-time').value;
            const laps = row.querySelector('.batch-laps').value;
            const points = row.querySelector('.batch-points').value;
            
            // Skip rows without position or driver
            if (!position || !driverSelect.value) return;
            
            const driverData = JSON.parse(driverSelect.value);
            
            results.push({
                race_id: raceId,
                session_type: sessionType,
                position: position,
                driver_name: driverData.name,
                team_name: driverData.team,
                time: time || null,
                laps: laps || null,
                points: points || null
            });
        });
        
        if (results.length === 0) {
            alert('Please add at least one valid result');
            return;
        }
        
        // Show loading state
        document.getElementById('batch-submit-btn').disabled = true;
        document.getElementById('batch-submit-btn').textContent = 'Saving...';
        
        // Send all results as a batch
        const promises = results.map(result => 
            fetch('/api/results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result)
            })
        );
        
        Promise.all(promises)
            .then(responses => {
                // Check if all responses are ok
                const allOk = responses.every(response => response.ok);
                if (!allOk) {
                    throw new Error('Some results failed to save');
                }
                
                // Close modal and reload results
                closeModal('batch-results-modal');
                loadResults();
                
                // Reset button state
                document.getElementById('batch-submit-btn').disabled = false;
                document.getElementById('batch-submit-btn').textContent = 'Save All Results';
            })
            .catch(error => {
                console.error('Error saving batch results:', error);
                alert('There was a problem saving some or all results');
                
                // Reset button state
                document.getElementById('batch-submit-btn').disabled = false;
                document.getElementById('batch-submit-btn').textContent = 'Save All Results';
            });
    }

    // ===== RACES =====
    const racesTable = document.getElementById('races-table').querySelector('tbody');
    const raceForm = document.getElementById('race-form');

    // Load races
    function loadRaces() {
        fetch('https://f1apibackend-1.onrender.com/api/races')
            .then(response => response.json())
            .then(races => {
                const tableBody = document.querySelector('#races-table tbody');
                tableBody.innerHTML = '';
                
                races.forEach(race => {
                    const row = document.createElement('tr');
                    row.dataset.id = race.id; // Store ID as data attribute but don't display it
                    
                    // Format race date
                    const raceDate = new Date(race.datetime_race * 1000).toLocaleDateString();
                    
                    // Format podium
                    let podium = 'Not completed';
                    if (race.first_place) {
                        podium = `1. ${race.first_place}`;
                        if (race.second_place) podium += `<br>2. ${race.second_place}`;
                        if (race.third_place) podium += `<br>3. ${race.third_place}`;
                    }
                    
                    row.innerHTML = `
                        <td>${race.round}</td>
                        <td>${race.name}</td>
                        <td>${race.location}</td>
                        <td>${raceDate}</td>
                        <td>${podium}</td>
                        <td class="action-buttons">
                            <button class="btn btn-info edit-race-btn">Edit</button>
                            <button class="btn btn-danger delete-race-btn">Delete</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Add event listeners for edit and delete buttons
                attachRaceButtonListeners();
            })
            .catch(error => {
                console.error('Error loading races:', error);
            });
    }

    function attachRaceButtonListeners() {
        document.querySelectorAll('.edit-race-btn').forEach(button => {
            button.addEventListener('click', function() {
                const raceId = this.closest('tr').dataset.id;
                editRace(raceId);
            });
        });

        document.querySelectorAll('.delete-race-btn').forEach(button => {
            button.addEventListener('click', function() {
                const raceId = this.closest('tr').dataset.id;
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
        fetch('/api/races/' + raceId)
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
        fetch('/api/races/' + raceId, {
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
        const url = raceId ? '/api/races/' + raceId : '/api/races';

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
        fetch('https://f1apibackend-1.onrender.com/api/results')
            .then(response => response.json())
            .then(results => {
                const tableBody = document.querySelector('#results-table tbody');
                tableBody.innerHTML = '';
                
                // Also fetch races to get race names
                fetch('https://f1apibackend-1.onrender.com/api/races')
                    .then(response => response.json())
                    .then(races => {
                        const raceMap = {};
                        races.forEach(race => {
                            raceMap[race.id] = race.name;
                        });
                        
                        results.forEach(result => {
                            const row = document.createElement('tr');
                            row.dataset.id = result.id; // Store ID as data attribute
                            
                            // Format session type
                            const sessionType = formatSessionType(result.session_type);
                            
                            row.innerHTML = `
                                <td>${raceMap[result.race_id] || `Race ${result.race_id}`}</td>
                                <td>${sessionType}</td>
                                <td>${result.position}</td>
                                <td>${result.driver_name}</td>
                                <td>${result.team_name}</td>
                                <td>${result.time || '-'}</td>
                                <td>${result.points}</td>
                                <td class="action-buttons">
                                    <button class="btn btn-info edit-result-btn">Edit</button>
                                    <button class="btn btn-danger delete-result-btn">Delete</button>
                                </td>
                            `;
                            
                            tableBody.appendChild(row);
                        });
                        
                        // Add event listeners for edit and delete buttons
                        attachResultButtonListeners();
                    });
            })
            .catch(error => {
                console.error('Error loading results:', error);
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
        document.querySelectorAll('.edit-result-btn').forEach(button => {
            button.addEventListener('click', function() {
                const resultId = this.closest('tr').dataset.id;
                editResult(resultId);
            });
        });

        document.querySelectorAll('.delete-result-btn').forEach(button => {
            button.addEventListener('click', function() {
                const resultId = this.closest('tr').dataset.id;
                if (confirm('Are you sure you want to delete this result?')) {
                    deleteResult(resultId);
                }
            });
        });
    }

    function editResult(resultId) {
        fetch('/api/results/' + resultId)
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
        fetch('/api/results/' + resultId, {
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
        
        const id = document.getElementById('result-id').value;
        const driverSelect = document.getElementById('result-driver');
        let driverName, teamName;
        
        if (driverSelect.value) {
            const driverData = JSON.parse(driverSelect.value);
            driverName = driverData.name;
            teamName = driverData.team;
        } else {
            alert('Please select a driver');
            return;
        }
        
        const data = {
            race_id: document.getElementById('result-race').value,
            session_type: document.getElementById('result-session').value,
            position: document.getElementById('result-position').value,
            driver_name: driverName,
            team_name: teamName,
            time: document.getElementById('result-time').value || null,
            laps: document.getElementById('result-laps').value || null,
            points: document.getElementById('result-points').value || null
        };
        
        const method = id ? 'PUT' : 'POST';
        const url = id ? '/api/results/' + id : '/api/results';
        
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
            closeModal('result-modal');
            loadResults();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was a problem saving the result');
        });
    });

    // Cancel button for results
    document.getElementById('result-cancel-btn').addEventListener('click', () => {
        closeModal('result-modal');
    });

    // ===== DRIVER STANDINGS =====
    const driverStandingsTable = document.getElementById('driver-standings-table').querySelector('tbody');
    const driverStandingForm = document.getElementById('driver-standing-form');

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
            row.dataset.id = standing.id; // Store ID as data attribute
            
            row.innerHTML = `
                <td>${standing.driver_name}</td>
                <td>${standing.driver_number || '-'}</td>
                <td>${standing.team_name}</td>
                <td>${standing.points}</td>
                <td class="action-buttons">
                    <button class="btn btn-info edit-driver-standing-btn">Edit</button>
                    <button class="btn btn-danger delete-driver-standing-btn">Delete</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-driver-standing-btn').forEach(button => {
            button.addEventListener('click', function() {
                const standingId = this.closest('tr').dataset.id;
                editDriverStanding(standingId);
            });
        });
        
        document.querySelectorAll('.delete-driver-standing-btn').forEach(button => {
            button.addEventListener('click', function() {
                const standingId = this.closest('tr').dataset.id;
                deleteDriverStanding(standingId);
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
        fetch('/api/driver-standings/' + standingId)
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
        fetch('/api/driver-standings/' + standingId, {
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
        const url = id ? '/api/driver-standings/' + id : '/api/driver-standings';
        
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
        fetch('https://f1apibackend-1.onrender.com/api/constructor-standings')
            .then(response => response.json())
            .then(standings => {
                const tableBody = document.querySelector('#constructor-standings-table tbody');
                tableBody.innerHTML = '';
                
                standings.forEach(standing => {
                    const row = document.createElement('tr');
                    row.dataset.id = standing.id; // Store ID as data attribute
                    
                    row.innerHTML = `
                        <td>${standing.constructor_name}</td>
                        <td>${standing.points}</td>
                        <td>${standing.driver_name_1 || '-'}</td>
                        <td>${standing.driver_name_2 || '-'}</td>
                        <td>${standing.driver_name_3 || '-'}</td>
                        <td class="action-buttons">
                            <button class="btn btn-info edit-constructor-standing-btn">Edit</button>
                            <button class="btn btn-danger delete-constructor-standing-btn">Delete</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Add event listeners for edit and delete buttons
                attachConstructorStandingEventListeners();
            })
            .catch(error => {
                console.error('Error loading constructor standings:', error);
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
        fetch('/api/constructor-standings/' + standingId)
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
        fetch('/api/constructor-standings/' + standingId, {
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
        const url = id ? '/api/constructor-standings/' + id : '/api/constructor-standings';
        
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
        fetch('/api/live-race')
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
                            <button class="btn btn-info edit-live-race-btn">Edit</button>
                            <button class="btn btn-danger delete-live-race-btn">Delete</button>
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
            fetch('/api/live-race', {
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
        document.querySelectorAll('.edit-live-race-btn').forEach(button => {
            button.addEventListener('click', function() {
                const entryId = this.closest('tr').dataset.id;
                editLiveRaceEntry(entryId);
            });
        });

        document.querySelectorAll('.delete-live-race-btn').forEach(button => {
            button.addEventListener('click', function() {
                const entryId = this.closest('tr').dataset.id;
                if (confirm('Are you sure you want to delete this entry?')) {
                    deleteLiveRaceEntry(entryId);
                }
            });
        });
    }

    function editLiveRaceEntry(entryId) {
        fetch('/api/live-race/' + entryId)
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
        fetch('/api/live-race/' + entryId, {
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
        const url = entryId ? '/api/live-race/' + entryId : '/api/live-race';

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

    // Load driver standings first to populate dropdowns
    loadDriverStandings();
    
    // Initialize the results section
    initResultsSection();

    // Widget functionality
    initializeWidgets();
});

// Widget functionality
function initializeWidgets() {
    // Initialize racing widget
    initializeRacingWidget();
    
    // Initialize driver widget selector
    initializeDriverSelector();
}

// Initialize racing widget with next race data
function initializeRacingWidget() {
    const widgetContent = document.getElementById('racing-widget-content');
    widgetContent.innerHTML = '<div class="widget-loading">Loading race data...</div>';
    
    // Fetch races data from the correct API endpoint
    fetch('https://f1apibackend-1.onrender.com/api/races')
        .then(response => response.json())
        .then(races => {
            // Find the next upcoming race
            const now = Math.floor(Date.now() / 1000); // Current time in seconds
            const upcomingRaces = races.filter(race => race.datetime_race > now);
            
            if (upcomingRaces.length === 0) {
                widgetContent.innerHTML = '<div class="widget-loading">No upcoming races found</div>';
                return;
            }
            
            // Sort by date and get the next race
            upcomingRaces.sort((a, b) => a.datetime_race - b.datetime_race);
            const nextRace = upcomingRaces[0];
            
            // Format dates
            const startDate = new Date(nextRace.datetime_fp1 * 1000);
            const endDate = new Date(nextRace.datetime_race * 1000);
            
            const formatDate = (date) => {
                return date.getDate() + ' ' + date.toLocaleString('default', { month: 'short' });
            };
            
            const dateRange = formatDate(startDate) + ' - ' + formatDate(endDate);
            
            // Calculate countdown
            const countdown = calculateCountdown(nextRace.datetime_race);
            
            // Update widget content
            widgetContent.innerHTML = `
                <div class="race-round">Round ${nextRace.round}</div>
                <div class="race-name">${nextRace.name}</div>
                <div class="race-location">${nextRace.location}</div>
                <div class="race-dates">${dateRange}</div>
                <div class="race-countdown">Race starts in ${countdown}</div>
            `;
            
            // Update countdown every second
            const countdownInterval = setInterval(() => {
                const updatedCountdown = calculateCountdown(nextRace.datetime_race);
                const countdownElement = widgetContent.querySelector('.race-countdown');
                if (countdownElement) {
                    countdownElement.textContent = `Race starts in ${updatedCountdown}`;
                } else {
                    clearInterval(countdownInterval);
                }
            }, 1000);
            
            // Clear interval when switching tabs
            document.querySelectorAll('.sidebar-menu li').forEach(item => {
                item.addEventListener('click', function() {
                    if (this.getAttribute('data-section') !== 'widgets') {
                        clearInterval(countdownInterval);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching race data:', error);
            widgetContent.innerHTML = '<div class="widget-loading">Error loading race data</div>';
        });
}

// Calculate countdown string from timestamp
function calculateCountdown(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = timestamp - now;
    
    if (timeRemaining <= 0) {
        return "Race has started!";
    }
    
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else {
        return `${minutes}m ${seconds}s`;
    }
}

// Update driver selector with all drivers
function initializeDriverSelector() {
    const driverSelector = document.getElementById('driver-widget-selector');
    
    // Clear existing options except the first one
    while (driverSelector.options.length > 1) {
        driverSelector.remove(1);
    }
    
    // Fetch driver standings from the correct API endpoint
    fetch('https://f1apibackend-1.onrender.com/api/driver-standings')
        .then(response => response.json())
        .then(drivers => {
            // Sort drivers by points (descending)
            drivers.sort((a, b) => b.points - a.points);
            
            // Add drivers to selector
            drivers.forEach((driver, index) => {
                const option = document.createElement('option');
                option.value = driver.id;
                option.textContent = `${index + 1}. ${driver.driver_name}`;
                option.dataset.position = index + 1;
                option.dataset.driver = JSON.stringify(driver);
                driverSelector.appendChild(option);
            });
            
            // If there are drivers, select the first one
            if (drivers.length > 0) {
                driverSelector.selectedIndex = 1;
                updateDriverWidget();
            }
        })
        .catch(error => {
            console.error('Error fetching driver data:', error);
        });
        
    // Add change event listener directly to the selector
    driverSelector.addEventListener('change', function() {
        updateDriverWidget();
    });
}

// Update driver widget with selected driver data
function updateDriverWidget() {
    const widgetContent = document.getElementById('driver-widget-content');
    const driverSelector = document.getElementById('driver-widget-selector');
    const selectedOption = driverSelector.options[driverSelector.selectedIndex];
    
    if (!selectedOption || !selectedOption.dataset.driver) {
        widgetContent.innerHTML = '<div class="widget-loading">Driver data not available</div>';
        return;
    }
    
    const driver = JSON.parse(selectedOption.dataset.driver);
    const position = selectedOption.dataset.position;
    
    widgetContent.innerHTML = `
        <div class="driver-header">
            <div class="driver-number">${driver.driver_number || '??'}</div>
            <div class="driver-name">${driver.driver_name}</div>
        </div>
        <div class="driver-team">${driver.team_name}</div>
        <div class="driver-stats">
            <div class="stat">
                <div class="stat-value">${position}</div>
                <div class="stat-label">POSITION</div>
            </div>
            <div class="stat">
                <div class="stat-value">${driver.points}</div>
                <div class="stat-label">POINTS</div>
            </div>
        </div>
    `;
}

// Remove the duplicate event listener in the DOMContentLoaded section
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for the refresh widgets button
    document.getElementById('refresh-widgets-btn').addEventListener('click', function() {
        initializeWidgets();
    });
    
    // Check if widgets section is already active on page load
    if (document.getElementById('widgets').classList.contains('active')) {
        initializeWidgets();
    }
    
    // Add event listeners to sidebar menu items
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            
            // If widgets section is selected, initialize widgets
            if (section === 'widgets') {
                initializeWidgets();
            }
        });
    });
});

// Helper function to format session type
function formatSessionType(sessionType) {
    switch(sessionType) {
        case 'fp1': return 'Practice 1';
        case 'fp2': return 'Practice 2';
        case 'fp3': return 'Practice 3';
        case 'sprint': return 'Sprint';
        case 'qualifying': return 'Qualifying';
        case 'race': return 'Race';
        default: return sessionType;
    }
} 