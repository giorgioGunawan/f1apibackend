document.addEventListener('DOMContentLoaded', function() {
    // API base URL
    const API_BASE_URL = '/api';

    // Navigation
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const sections = document.querySelectorAll('.section');

    // Load data for the active section immediately when page loads
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        const sectionId = activeSection.id;
        loadDataForSection(sectionId);
    }

    // Function to load data based on section ID
    function loadDataForSection(sectionId) {
        switch(sectionId) {
            case 'races':
                loadRaces();
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
            case 'widgets':
                initializeWidgets();
                break;
        }
    }

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
            loadDataForSection(sectionId);
        });
    });

    // Modal handling
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        
        // If opening race or live race modals, fetch drivers for dropdowns
        if (modalId === 'race-modal' || modalId === 'live-race-entry-modal') {
            fetch('/api/driver-standings')
                .then(response => response.json())
                .then(drivers => {
                    driversData = drivers;
                    
                    // Sort drivers alphabetically by name
                    drivers.sort((a, b) => a.driver_name.localeCompare(b.driver_name));
                    
                    if (modalId === 'race-modal') {
                        // Populate race podium dropdowns
                        populateDriverDropdowns('race-first', drivers);
                        populateDriverDropdowns('race-second', drivers);
                        populateDriverDropdowns('race-third', drivers);
                    } else {
                        // Populate live race driver dropdown
                        populateLiveRaceDriverDropdown(drivers);
                    }
                })
                .catch(error => {
                    console.error('Error fetching drivers:', error);
                });
        }
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
        // Remove any existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button class="close-alert">&times;</button>
        `;
        
        // Add alert to the document
        document.body.appendChild(alert);
        
        // Add event listener to close button
        alert.querySelector('.close-alert').addEventListener('click', function() {
            alert.remove();
        });
        
        // Auto-dismiss after 5 seconds (except for errors and warnings)
        if (type !== 'danger' && type !== 'warning') {
            setTimeout(() => {
                if (document.body.contains(alert)) {
                    alert.remove();
                }
            }, 5000);
        }
        
        return alert;
    }

    // Global variable to store driver standings data
    let driversData = [];

    // Load driver standings data
    function loadDriverStandings() {
        console.log('Loading driver standings...');
        
        fetch('/api/driver-standings')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Driver standings data loaded:', data);
                driversData = data;
                renderDriverStandingsTable(data);
                
                // Also update driver dropdowns in forms
                updateDriverDropdowns();
            })
            .catch(error => {
                console.error('Error loading driver standings:', error);
                showAlert('Failed to load driver standings: ' + error.message, 'danger');
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
                    number: driver.driver_number,
                    display: driver.display_name
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
        fetch(`${API_BASE_URL}/races`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#races-table tbody');
                tableBody.innerHTML = '';
                
                data.forEach(race => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${race.round || 'N/A'}</td>
                        <td>${race.name}</td>
                        <td>${race.location}</td>
                        <td>${formatDateTime(race.datetime_race)}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-info btn-sm view-race" data-id="${race.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-primary btn-sm edit-race" data-id="${race.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm delete-race" data-id="${race.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
                
                // Add event listeners for the view buttons
                document.querySelectorAll('.view-race').forEach(button => {
                    button.addEventListener('click', function() {
                        const raceId = this.getAttribute('data-id');
                        viewRaceDetails(raceId);
                    });
                });
                
                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-race').forEach(button => {
                    button.addEventListener('click', function() {
                        const raceId = this.getAttribute('data-id');
                        editRace(raceId);
                    });
                });
                
                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-race').forEach(button => {
                    button.addEventListener('click', function() {
                        const raceId = this.getAttribute('data-id');
                        deleteRace(raceId);
                    });
                });
            })
            .catch(error => {
                console.error('Error loading races:', error);
            });
    }

    // Update the viewRaceDetails function to include results and add result buttons
    function viewRaceDetails(raceId) {
        fetch(`${API_BASE_URL}/races/${raceId}`)
            .then(response => response.json())
            .then(race => {
                // Create modal for race details
                const modal = document.createElement('div');
                modal.className = 'modal race-details-modal';
                modal.id = 'race-details-modal';
                modal.style.display = 'block';
                
                // Format all session times
                const fp1Time = formatDateTime(race.datetime_fp1);
                const fp2Time = formatDateTime(race.datetime_fp2);
                const fp3Time = formatDateTime(race.datetime_fp3);
                const sprintTime = formatDateTime(race.datetime_sprint);
                const qualifyingTime = formatDateTime(race.datetime_qualifying);
                const raceTime = formatDateTime(race.datetime_race);
                
                // Create modal content
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 900px; width: 90%;">
                        <span class="close-modal">&times;</span>
                        <h2>${race.name} Details</h2>
                        
                        <div class="tabs">
                            <button class="tab-button active" data-tab="info">Race Info</button>
                            <button class="tab-button" data-tab="fp1">Practice 1</button>
                            <button class="tab-button" data-tab="fp2">Practice 2</button>
                            <button class="tab-button" data-tab="fp3">Practice 3</button>
                            <button class="tab-button" data-tab="sprint">Sprint</button>
                            <button class="tab-button" data-tab="qualifying">Qualifying</button>
                            <button class="tab-button" data-tab="race">Race</button>
                        </div>
                        
                        <div class="tab-content">
                            <div class="tab-pane active" id="info-tab">
                                <div class="race-details">
                                    <div class="detail-section">
                                        <h3>Race Information</h3>
                                        <p><strong>Round:</strong> ${race.round || 'N/A'}</p>
                                        <p><strong>Location:</strong> ${race.location}</p>
                                    </div>
                                    
                                    <div class="detail-section">
                                        <h3>Session Times (UTC)</h3>
                                        <p><strong>Practice 1:</strong> ${fp1Time}</p>
                                        <p><strong>Practice 2:</strong> ${fp2Time}</p>
                                        <p><strong>Practice 3:</strong> ${fp3Time}</p>
                                        <p><strong>Sprint:</strong> ${sprintTime}</p>
                                        <p><strong>Qualifying:</strong> ${qualifyingTime}</p>
                                        <p><strong>Race:</strong> ${raceTime}</p>
                                    </div>
                                    
                                    <div class="detail-section">
                                        <h3>Podium Results</h3>
                                        <p><strong>1st Place:</strong> ${race.first_place || 'Not yet determined'}</p>
                                        <p><strong>2nd Place:</strong> ${race.second_place || 'Not yet determined'}</p>
                                        <p><strong>3rd Place:</strong> ${race.third_place || 'Not yet determined'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="tab-pane" id="fp1-tab">
                                <div class="results-header">
                                    <h3>Practice 1 Results</h3>
                                    <button class="btn btn-primary add-results-btn" data-race-id="${race.id}" data-session="fp1">
                                        Add/Edit Results
                                    </button>
                                </div>
                                <div class="results-container" id="fp1-results">
                                    <p class="loading-text">Loading results...</p>
                                </div>
                            </div>
                            
                            <div class="tab-pane" id="fp2-tab">
                                <div class="results-header">
                                    <h3>Practice 2 Results</h3>
                                    <button class="btn btn-primary add-results-btn" data-race-id="${race.id}" data-session="fp2">
                                        Add/Edit Results
                                    </button>
                                </div>
                                <div class="results-container" id="fp2-results">
                                    <p class="loading-text">Loading results...</p>
                                </div>
                            </div>
                            
                            <div class="tab-pane" id="fp3-tab">
                                <div class="results-header">
                                    <h3>Practice 3 Results</h3>
                                    <button class="btn btn-primary add-results-btn" data-race-id="${race.id}" data-session="fp3">
                                        Add/Edit Results
                                    </button>
                                </div>
                                <div class="results-container" id="fp3-results">
                                    <p class="loading-text">Loading results...</p>
                                </div>
                            </div>
                            
                            <div class="tab-pane" id="sprint-tab">
                                <div class="results-header">
                                    <h3>Sprint Results</h3>
                                    <button class="btn btn-primary add-results-btn" data-race-id="${race.id}" data-session="sprint">
                                        Add/Edit Results
                                    </button>
                                </div>
                                <div class="results-container" id="sprint-results">
                                    <p class="loading-text">Loading results...</p>
                                </div>
                            </div>
                            
                            <div class="tab-pane" id="qualifying-tab">
                                <div class="results-header">
                                    <h3>Qualifying Results</h3>
                                    <button class="btn btn-primary add-results-btn" data-race-id="${race.id}" data-session="qualifying">
                                        Add/Edit Results
                                    </button>
                                </div>
                                <div class="results-container" id="qualifying-results">
                                    <p class="loading-text">Loading results...</p>
                                </div>
                            </div>
                            
                            <div class="tab-pane" id="race-tab">
                                <div class="results-header">
                                    <h3>Race Results</h3>
                                    <button class="btn btn-primary add-results-btn" data-race-id="${race.id}" data-session="race">
                                        Add/Edit Results
                                    </button>
                                </div>
                                <div class="results-container" id="race-results">
                                    <p class="loading-text">Loading results...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add modal to the document
                document.body.appendChild(modal);
                
                // Add event listener to close the modal
                modal.querySelector('.close-modal').addEventListener('click', function() {
                    modal.remove();
                });
                
                // Close modal when clicking outside
                modal.addEventListener('click', function(event) {
                    if (event.target === modal) {
                        modal.remove();
                    }
                });
                
                // Add tab switching functionality
                const tabButtons = modal.querySelectorAll('.tab-button');
                const tabPanes = modal.querySelectorAll('.tab-pane');
                
                tabButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        // Remove active class from all buttons and panes
                        tabButtons.forEach(btn => btn.classList.remove('active'));
                        tabPanes.forEach(pane => pane.classList.remove('active'));
                        
                        // Add active class to clicked button and corresponding pane
                        this.classList.add('active');
                        const tabId = this.getAttribute('data-tab');
                        document.getElementById(`${tabId}-tab`).classList.add('active');
                        
                        // Load results for the selected tab if it's a session tab
                        if (tabId !== 'info') {
                            loadResultsForSession(race.id, tabId);
                        }
                    });
                });
                
                // Add event listeners for add results buttons
                modal.querySelectorAll('.add-results-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const raceId = this.getAttribute('data-race-id');
                        const session = this.getAttribute('data-session');
                        openAddResultsModal(raceId, session);
                    });
                });
            })
            .catch(error => {
                console.error('Error loading race details:', error);
                showAlert('Error loading race details', 'danger');
            });
    }

    // Function to load results for a specific session
    function loadResultsForSession(raceId, session) {
        const resultsContainer = document.getElementById(`${session}-results`);
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '<p class="loading-text">Loading results...</p>';
        
        fetch(`${API_BASE_URL}/results?race_id=${raceId}&session=${session}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load results');
                }
                return response.json();
            })
            .then(results => {
                if (results.length === 0) {
                    resultsContainer.innerHTML = '<p class="no-results">No results available for this session.</p>';
                    return;
                }
                
                // Sort results by position
                results.sort((a, b) => a.position - b.position);
                
                // Create table to display results
                const table = document.createElement('table');
                table.className = 'data-table';
                
                // Create table header
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Pos</th>
                        <th>Driver</th>
                        <th>Team</th>
                        <th>Time/Gap</th>
                        <th>Laps</th>
                        ${session === 'race' ? '<th>Points</th>' : ''}
                    </tr>
                `;
                table.appendChild(thead);
                
                // Create table body
                const tbody = document.createElement('tbody');
                results.forEach(result => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${result.position}</td>
                        <td>${result.driver_name}</td>
                        <td>${result.team_name}</td>
                        <td>${result.time || '-'}</td>
                        <td>${result.laps || '-'}</td>
                        ${session === 'race' ? `<td>${result.points || '0'}</td>` : ''}
                    `;
                    tbody.appendChild(row);
                });
                table.appendChild(tbody);
                
                // Clear container and add table
                resultsContainer.innerHTML = '';
                resultsContainer.appendChild(table);
            })
            .catch(error => {
                console.error('Error loading results:', error);
                resultsContainer.innerHTML = `<p class="error-text">Error loading results: ${error.message}</p>`;
            });
    }

    // Function to open the add results modal
    function openAddResultsModal(raceId, session) {
        // Fetch current driver standings to pre-fill the form
        fetch(`${API_BASE_URL}/driver-standings`)
            .then(response => response.json())
            .then(drivers => {
                // Sort drivers by current position
                drivers.sort((a, b) => a.position - b.position);
                
                // Create modal for adding results
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.id = 'add-results-modal';
                modal.style.display = 'block';
                
                // Get session name for display
                const sessionNames = {
                    'fp1': 'Practice 1',
                    'fp2': 'Practice 2',
                    'fp3': 'Practice 3',
                    'sprint': 'Sprint',
                    'qualifying': 'Qualifying',
                    'race': 'Race'
                };
                
                // Create modal content with pre-filled driver rows
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 900px; width: 95%;">
                        <span class="close-modal">&times;</span>
                        <h2>Add ${sessionNames[session]} Results</h2>
                        
                        <div class="drag-instructions">
                            <i class="fas fa-info-circle"></i> Drag and drop rows to reorder drivers. Positions will update automatically.
                        </div>
                        
                        <form id="results-form">
                            <input type="hidden" id="results-race-id" value="${raceId}">
                            <input type="hidden" id="results-session" value="${session}">
                            
                            <div class="table-container">
                                <table class="data-table" id="results-table">
                                    <thead>
                                        <tr>
                                            <th>Pos</th>
                                            <th>Driver</th>
                                            <th>Team</th>
                                            <th>Time/Gap</th>
                                            <th>Laps</th>
                                            ${session === 'race' ? '<th>Points</th>' : ''}
                                        </tr>
                                    </thead>
                                    <tbody id="results-tbody">
                                        ${generateDriverRows(drivers, session)}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="form-buttons">
                                <button type="button" class="btn" id="results-cancel-btn">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save Results</button>
                            </div>
                        </form>
                    </div>
                `;
                
                // Add modal to the document
                document.body.appendChild(modal);
                
                // Add event listener to close the modal
                modal.querySelector('.close-modal').addEventListener('click', function() {
                    modal.remove();
                });
                
                // Close modal when clicking outside
                modal.addEventListener('click', function(event) {
                    if (event.target === modal) {
                        modal.remove();
                    }
                });
                
                // Add event listener for cancel button
                document.getElementById('results-cancel-btn').addEventListener('click', function() {
                    modal.remove();
                });
                
                // Add event listener for form submission
                document.getElementById('results-form').addEventListener('submit', function(event) {
                    event.preventDefault();
                    saveResults(raceId, session);
                });
                
                // Initialize drag and drop functionality
                initResultsDragAndDrop();
                
                // Check if there are existing results for this race and session
                fetch(`${API_BASE_URL}/results?race_id=${raceId}&session=${session}`)
                    .then(response => response.json())
                    .then(existingResults => {
                        if (existingResults.length > 0) {
                            // If there are existing results, populate the form with them
                            populateExistingResults(existingResults, session);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching existing results:', error);
                    });
            })
            .catch(error => {
                console.error('Error fetching drivers:', error);
                showAlert('Error loading driver data', 'danger');
            });
    }

    // Add this function to generate pre-filled driver rows with drag and drop functionality
    function generateDriverRows(drivers, session) {
        let rows = '';
        
        // Generate 20 rows, using available driver data where possible
        for (let i = 0; i < 20; i++) {
            const driver = i < drivers.length ? drivers[i] : null;
            const position = i + 1;
            
            rows += `
                <tr class="draggable-row" draggable="true">
                    <td class="drag-handle">
                        <i class="fas fa-grip-vertical"></i>
                        <input type="number" class="form-control position-input" value="${position}" min="1" max="20" required readonly>
                    </td>
                    <td>
                        <input type="text" class="form-control driver-input" value="${driver ? driver.driver_name : ''}" required>
                    </td>
                    <td>
                        <input type="text" class="form-control team-input" value="${driver ? driver.team_name : ''}" required>
                    </td>
                    <td>
                        <input type="text" class="form-control time-input" placeholder="e.g. 1:23.456 or +2.345s">
                    </td>
                    <td>
                        <input type="number" class="form-control laps-input" min="0">
                    </td>
                    ${session === 'race' ? `
                        <td>
                            <input type="number" class="form-control points-input" value="${getDefaultPoints(position)}" min="0">
                        </td>
                    ` : ''}
                </tr>
            `;
        }
        
        return rows;
    }

    // Function to get default points based on position (for race results)
    function getDefaultPoints(position) {
        const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        return position <= pointsSystem.length ? pointsSystem[position - 1] : 0;
    }

    // Function to save results
    function saveResults(raceId, session) {
        const rows = document.querySelectorAll('#results-tbody .draggable-row');
        const results = [];
        
        // Collect data from each row
        rows.forEach(row => {
            const position = row.querySelector('.position-input').value;
            const driverName = row.querySelector('.driver-input').value;
            const teamName = row.querySelector('.team-input').value;
            const time = row.querySelector('.time-input').value;
            const laps = row.querySelector('.laps-input').value;
            
            // Skip empty rows
            if (!driverName || !teamName) return;
            
            const result = {
                race_id: raceId,
                session_type: session,
                position: position,
                driver_name: driverName,
                team_name: teamName,
                time: time || null,
                laps: laps || null
            };
            
            // Add points for race results
            if (session === 'race') {
                result.points = row.querySelector('.points-input').value || 0;
            }
            
            results.push(result);
        });
        
        // If there are no results to save, show an error
        if (results.length === 0) {
            showAlert('No valid results to save. Please add at least one driver.', 'warning');
            return;
        }
        
        // Show loading indicator
        const loadingAlert = showAlert('Saving results...', 'info');
        
        // Save each result individually using the existing API
        const savePromises = results.map(result => {
            return fetch(`${API_BASE_URL}/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Failed to save result for ${result.driver_name}: ${text}`);
                    });
                }
                return response.json();
            });
        });
        
        // Wait for all saves to complete
        Promise.all(savePromises)
            .then(() => {
                // Remove loading alert
                if (loadingAlert) loadingAlert.remove();
                
                showAlert('Results saved successfully', 'success');
                
                // Close the modal
                document.getElementById('add-results-modal').remove();
                
                // Refresh the results display
                loadResultsForSession(raceId, session);
            })
            .catch(error => {
                // Remove loading alert
                if (loadingAlert) loadingAlert.remove();
                
                console.error('Error saving results:', error);
                showAlert(`Error: ${error.message}`, 'danger');
            });
    }

    // Edit race
    function editRace(id) {
        console.log('Editing race with ID:', id);
        
        fetch(`/api/races/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(race => {
                console.log('Fetched race data:', race);
                
                document.getElementById('race-form-title').textContent = 'Edit Race';
                document.getElementById('race-id').value = race.id;
                document.getElementById('race-round').value = race.round;
                document.getElementById('race-name').value = race.name;
                document.getElementById('race-location').value = race.location;
                
                // Convert UTC timestamps to local datetime for form inputs
                document.getElementById('race-fp1-date').value = utcTimestampToLocalDateTime(race.datetime_fp1);
                document.getElementById('race-fp2-date').value = utcTimestampToLocalDateTime(race.datetime_fp2);
                document.getElementById('race-fp3-date').value = utcTimestampToLocalDateTime(race.datetime_fp3);
                document.getElementById('race-sprint-date').value = utcTimestampToLocalDateTime(race.datetime_sprint);
                document.getElementById('race-qualifying-date').value = utcTimestampToLocalDateTime(race.datetime_qualifying);
                document.getElementById('race-race-date').value = utcTimestampToLocalDateTime(race.datetime_race);
                
                // Open the modal
                openModal('race-modal');
                
                // Fetch drivers and populate dropdowns
                return fetch('/api/driver-standings');
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(drivers => {
                console.log('Fetched drivers for dropdowns');
                
                // Sort drivers alphabetically by name
                drivers.sort((a, b) => a.driver_name.localeCompare(b.driver_name));
                
                // Populate race podium dropdowns
                populateDriverDropdowns('race-first', drivers);
                populateDriverDropdowns('race-second', drivers);
                populateDriverDropdowns('race-third', drivers);
                
                // Fetch the race data again to ensure we have the latest
                return fetch(`/api/races/${id}`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(race => {
                console.log('Setting podium selections:', {
                    first: race.first_place,
                    second: race.second_place,
                    third: race.third_place
                });
                
                // Set the selected values
                setTimeout(() => {
                    setSelectValue('race-first', race.first_place);
                    setSelectValue('race-second', race.second_place);
                    setSelectValue('race-third', race.third_place);
                }, 100);
            })
            .catch(error => {
                console.error('Error in editRace:', error);
                alert('Error editing race: ' + error.message);
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
    document.getElementById('race-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('race-id').value;
        const isEdit = id !== '';
        
        // Get form values
        const race = {
            round: document.getElementById('race-round').value,
            name: document.getElementById('race-name').value,
            location: document.getElementById('race-location').value,
            
            // Convert local datetime to UTC timestamps
            datetime_fp1: localDateTimeToUTCTimestamp(document.getElementById('race-fp1-date').value),
            datetime_fp2: localDateTimeToUTCTimestamp(document.getElementById('race-fp2-date').value),
            datetime_fp3: localDateTimeToUTCTimestamp(document.getElementById('race-fp3-date').value),
            datetime_sprint: localDateTimeToUTCTimestamp(document.getElementById('race-sprint-date').value),
            datetime_qualifying: localDateTimeToUTCTimestamp(document.getElementById('race-qualifying-date').value),
            datetime_race: localDateTimeToUTCTimestamp(document.getElementById('race-race-date').value),
            
            // Get podium values from dropdowns
            first_place: document.getElementById('race-first').value || null,
            second_place: document.getElementById('race-second').value || null,
            third_place: document.getElementById('race-third').value || null
        };
        
        console.log('Submitting race data:', race);
        
        // API endpoint and method
        const url = isEdit ? `/api/races/${id}` : '/api/races';
        const method = isEdit ? 'PUT' : 'POST';
        
        // Send request
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(race)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Race saved successfully:', data);
            closeModal('race-modal');
            loadRaces();
        })
        .catch(error => {
            console.error('Error saving race:', error);
            alert('Error saving race: ' + error.message);
        });
    });

    // Cancel buttons
    document.getElementById('race-cancel-btn').addEventListener('click', () => {
        closeModal('race-modal');
    });

    // ===== DRIVER STANDINGS =====
    const driverStandingsTable = document.getElementById('driver-standings-table').querySelector('tbody');
    const driverStandingForm = document.getElementById('driver-standing-form');

    // Simplified render driver standings table function
    function renderDriverStandingsTable(data) {
        console.log('Starting to render driver standings table');
        
        // Get the table body element
        const tableBody = document.getElementById('driver-standings-table-body');
        if (!tableBody) {
            console.error('Driver standings table body element not found');
            return;
        }
        
        // Clear the table
        tableBody.innerHTML = '';
        
        try {
            // Sort by points (descending)
            data.sort((a, b) => b.points - a.points);
            
            // Create and append each row
            data.forEach((standing, index) => {
                const row = document.createElement('tr');
                
                // Create a simple row without the display name formatting for now
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${standing.driver_name || 'Unknown'} ${standing.display_name ? `(${standing.display_name})` : ''}</td>
                    <td>${standing.team_name || 'Unknown'}</td>
                    <td>${standing.driver_number || 'N/A'}</td>
                    <td>${standing.points || 0}</td>
                    <td class="action-buttons">
                        <button class="btn btn-info edit-driver-standing" data-id="${standing.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger delete-driver-standing" data-id="${standing.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to buttons
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
            
            console.log('Driver standings table rendering complete');
            
            // Hide loading indicator if it exists
            const loadingIndicator = document.querySelector('#driver-standings .loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Show the table if it was hidden
            const table = document.querySelector('#driver-standings .data-table');
            if (table) {
                table.style.display = 'table';
            }
        } catch (error) {
            console.error('Error rendering driver standings table:', error);
            showAlert('Error rendering driver standings: ' + error.message, 'danger');
        }
    }

    // Add driver standing
    document.getElementById('add-driver-standing-btn').addEventListener('click', () => {
        driverStandingForm.reset();
        document.getElementById('driver-standing-id').value = '';
        document.getElementById('driver-standing-form-title').textContent = 'Add Driver Standing';
        document.getElementById('driver-standing-submit-btn').textContent = 'Add Standing';
        openModal('driver-standing-modal');
    });

    function addDriverStandingEventListeners() {
        document.querySelectorAll('.edit-driver-standing-btn').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const standingId = row.dataset.id;
                editDriverStanding(standingId);
            });
        });

        document.querySelectorAll('.delete-driver-standing-btn').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const standingId = row.dataset.id;
                deleteDriverStanding(standingId);
            });
        });
    }

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
        document.getElementById('driver-standing-display-name').value = data.display_name || '';
    }

    // Event listener for driver standing form submission
    document.getElementById('driver-standing-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('driver-standing-id').value;
        const data = {
            driver_name: document.getElementById('driver-standing-name').value,
            team_name: document.getElementById('driver-standing-team').value,
            points: parseFloat(document.getElementById('driver-standing-points').value),
            driver_number: document.getElementById('driver-standing-number').value || null,
            display_name: document.getElementById('driver-standing-display-name').value || null
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
        fetch('api/constructor-standings')
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
                        <td>
                            <i class="fas fa-edit action-icon edit-icon edit-constructor-standing-btn"></i>
                            <i class="fas fa-trash-alt action-icon delete-icon delete-constructor-standing-btn"></i>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Add event listeners for edit and delete buttons
                addConstructorStandingEventListeners();
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

    function addConstructorStandingEventListeners() {
        document.querySelectorAll('.edit-constructor-standing-btn').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const standingId = row.dataset.id;
                editConstructorStanding(standingId);
            });
        });

        document.querySelectorAll('.delete-constructor-standing-btn').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const standingId = row.dataset.id;
                deleteConstructorStanding(standingId);
            });
        });
    }

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
        fetch('api/live-race')
            .then(response => response.json())
            .then(entries => {
                const tableBody = document.querySelector('#live-race-table tbody');
                tableBody.innerHTML = '';
                
                // Sort entries by position
                entries.sort((a, b) => a.position - b.position);
                
                entries.forEach(entry => {
                    const row = document.createElement('tr');
                    row.dataset.id = entry.id;
                    row.classList.add('draggable');
                    
                    row.innerHTML = `
                        <td><i class="fas fa-grip-lines drag-handle"></i></td>
                        <td>${entry.position}</td>
                        <td>${entry.driver_name}</td>
                        <td>${entry.team_name}</td>
                        <td>${entry.car_number}</td>
                        <td>${entry.time_behind}</td>
                        <td>${entry.current_lap}</td>
                        <td>${entry.is_dnf ? 'Yes' : 'No'}</td>
                        <td>
                            <i class="fas fa-edit action-icon edit-live-race-btn"></i>
                            <i class="fas fa-trash-alt action-icon delete-live-race-btn"></i>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Add event listeners for edit and delete buttons
                addLiveRaceEventListeners();
                
                // Create the batch update button
                createBatchUpdateButton();
                
                // Initialize drag and drop
                setTimeout(() => {
                    initDragAndDrop();
                }, 100);
            })
            .catch(error => {
                console.error('Error loading live race data:', error);
            });
    }

    // Add live race entry
    document.getElementById('add-live-race-entry-btn').addEventListener('click', () => {
        document.getElementById('live-race-entry-form-title').textContent = 'Add Live Race Entry';
        document.getElementById('live-race-entry-form').reset();
        document.getElementById('live-race-entry-id').value = '';
        
        // Clear hidden fields
        document.getElementById('live-race-team-name').value = '';
        document.getElementById('live-race-car-number').value = '';
        
        // Set default values
        document.getElementById('live-race-position').value = '';
        document.getElementById('live-race-time-behind').value = '';
        document.getElementById('live-race-current-lap').value = '';
        document.getElementById('live-race-is-dnf').value = '0';
        
        openModal('live-race-entry-modal');
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

    function addLiveRaceEventListeners() {
        document.querySelectorAll('.edit-live-race-btn').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const id = row.dataset.id;
                editLiveRaceEntry(id);
            });
        });

        document.querySelectorAll('.delete-live-race-btn').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const id = row.dataset.id;
                deleteLiveRaceEntry(id);
            });
        });
    }

    function editLiveRaceEntry(entryId) {
        fetch('/api/live-race/' + entryId)
            .then(response => response.json())
            .then(entry => {
                document.getElementById('live-race-entry-form-title').textContent = 'Edit Live Race Entry';
                document.getElementById('live-race-entry-id').value = entry.id;
                
                // Fetch drivers first to populate dropdown
                fetchDriversForDropdowns().then(() => {
                    // Set driver selection
                    setSelectValue('live-race-driver', entry.driver_name);
                    
                    // Set hidden fields
                    document.getElementById('live-race-team-name').value = entry.team_name;
                    document.getElementById('live-race-car-number').value = entry.car_number;
                });
                
                document.getElementById('live-race-position').value = entry.position;
                document.getElementById('live-race-time-behind').value = entry.time_behind;
                document.getElementById('live-race-current-lap').value = entry.current_lap;
                document.getElementById('live-race-is-dnf').value = entry.is_dnf;
                
                openModal('live-race-entry-modal');
            })
            .catch(error => {
                console.error('Error fetching live race entry:', error);
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
    document.getElementById('live-race-entry-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('live-race-entry-id').value;
        const isEdit = id !== '';
        
        // Get selected driver option
        const driverSelect = document.getElementById('live-race-driver');
        const selectedOption = driverSelect.options[driverSelect.selectedIndex];
        
        // Check if a driver is selected
        if (!driverSelect.value) {
            alert('Please select a driver');
            return;
        }
        
        // Get form values
        const entry = {
            driver_name: driverSelect.value,
            team_name: document.getElementById('live-race-team-name').value || selectedOption.dataset.team,
            car_number: document.getElementById('live-race-car-number').value || selectedOption.dataset.number,
            position: parseInt(document.getElementById('live-race-position').value, 10),
            time_behind: document.getElementById('live-race-time-behind').value,
            current_lap: parseInt(document.getElementById('live-race-current-lap').value, 10),
            is_dnf: parseInt(document.getElementById('live-race-is-dnf').value, 10)
        };
        
        console.log('Submitting live race entry:', entry);
        
        // API endpoint and method
        const url = isEdit ? `/api/live-race/${id}` : '/api/live-race';
        const method = isEdit ? 'PUT' : 'POST';
        
        // Send request
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Live race entry saved successfully:', data);
            closeModal('live-race-entry-modal');
            loadLiveRace();
        })
        .catch(error => {
            console.error('Error saving live race entry:', error);
            alert('Error saving live race entry: ' + error.message);
        });
    });

    // Cancel button for live race
    document.getElementById('live-race-cancel-btn').addEventListener('click', () => {
        closeModal('live-race-entry-modal');
    });

    // Initial load of races
    loadRaces();

    // Load driver standings first to populate dropdowns
    loadDriverStandings();
    
    // Initialize the results section
    initResultsSection();

    // Widget functionality
    initializeWidgets();

    // Display the user's local timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneDisplay = document.getElementById('local-timezone');
    if (timezoneDisplay) {
        timezoneDisplay.textContent = timezone;
    }
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
    fetch('api/races')
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
    fetch('api/driver-standings')
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

// Completely revised drag and drop functionality
function initDragAndDrop() {
    const tbody = document.querySelector('#live-race-table tbody');
    let draggedItem = null;
    
    // Add event listeners for drag and drop
    document.querySelectorAll('#live-race-table tbody tr').forEach(row => {
        // Make only the drag handle initiate dragging
        const dragHandle = row.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', function() {
                row.draggable = true;
            });
        }
        
        // Drag start
        row.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => {
                this.classList.add('dragging');
            }, 0);
        });
        
        // Drag end
        row.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            this.draggable = false;
            
            // Update positions in the database
            savePositionsToServer();
        });
        
        // Drag over
        row.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (draggedItem === this) return;
            
            const mouseY = e.clientY;
            const thisRect = this.getBoundingClientRect();
            const midPoint = thisRect.top + thisRect.height / 2;
            
            if (mouseY < midPoint) {
                tbody.insertBefore(draggedItem, this);
            } else {
                tbody.insertBefore(draggedItem, this.nextSibling);
            }
            
            // Update row numbers visually
            updateRowNumbers();
        });
    });
    
    // Allow dropping on the tbody
    tbody.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    tbody.addEventListener('drop', function(e) {
        e.preventDefault();
        updateRowNumbers();
    });
}

// Update row numbers visually
function updateRowNumbers() {
    const rows = document.querySelectorAll('#live-race-table tbody tr');
    rows.forEach((row, index) => {
        const positionCell = row.querySelector('td:nth-child(2)');
        if (positionCell) {
            positionCell.textContent = index + 1;
        }
    });
}

// Save positions to server - completely revised approach
function savePositionsToServer() {
    const rows = Array.from(document.querySelectorAll('#live-race-table tbody tr'));
    
    // Create an array of updates
    const updates = rows.map((row, index) => {
        return {
            id: row.dataset.id,
            position: index + 1
        };
    });
    
    console.log('Preparing to update positions:', updates);
    
    // Send each update individually
    updates.forEach(update => {
        // Get the current entry data first
        fetch(`api/live-race/${update.id}`)
            .then(response => response.json())
            .then(entry => {
                // Now update with the new position while preserving other data
                const updatedEntry = {
                    ...entry,
                    position: update.position
                };
                
                return fetch(`api/live-race/${update.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedEntry)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to update position for ID ${update.id}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Successfully updated position for ID ${update.id} to ${update.position}`, data);
            })
            .catch(error => {
                console.error(`Error updating position for ID ${update.id}:`, error);
            });
    });
}

// Alternative approach - update all positions at once with a batch endpoint
function createBatchUpdateButton() {
    // Add a button to manually trigger position updates
    const actionsDiv = document.querySelector('#live-race .page-header div');
    
    if (actionsDiv && !document.getElementById('update-positions-btn')) {
        const updateButton = document.createElement('button');
        updateButton.id = 'update-positions-btn';
        updateButton.className = 'btn btn-info';
        updateButton.textContent = 'Save Positions';
        updateButton.addEventListener('click', savePositionsToServer);
        
        actionsDiv.appendChild(updateButton);
    }
}

// Make sure to call this when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Existing code...
    
    // Add event listener for the live race tab
    document.querySelector('.sidebar-menu li[data-section="live-race"]').addEventListener('click', function() {
        setTimeout(() => {
            initDragAndDrop();
        }, 200);
    });
});

// Function to convert local datetime to UTC timestamp
function localDateTimeToUTCTimestamp(dateTimeStr) {
    if (!dateTimeStr) return null;
    
    // Create a date object from the local datetime string
    const date = new Date(dateTimeStr);
    
    // Convert to UTC timestamp (seconds since epoch)
    return Math.floor(date.getTime() / 1000);
}

// Function to convert UTC timestamp to local datetime string
function utcTimestampToLocalDateTime(timestamp) {
    if (!timestamp) return '';
    
    // Create a date object from the UTC timestamp
    const date = new Date(timestamp * 1000);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Global variable to store driver data
let driversData = [];

// Fetch drivers data and populate dropdowns
function fetchDriversForDropdowns() {
    fetch('/api/driver-standings')
        .then(response => response.json())
        .then(drivers => {
            driversData = drivers;
            
            // Sort drivers alphabetically by name
            drivers.sort((a, b) => a.driver_name.localeCompare(b.driver_name));
            
            // Populate race podium dropdowns
            populateDriverDropdowns('race-first', drivers);
            populateDriverDropdowns('race-second', drivers);
            populateDriverDropdowns('race-third', drivers);
            
            // Populate live race driver dropdown
            populateLiveRaceDriverDropdown(drivers);
        })
        .catch(error => {
            console.error('Error fetching drivers:', error);
        });
}

// Populate driver dropdowns for race podium
function populateDriverDropdowns(selectId, drivers) {
    const select = document.getElementById(selectId);
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add driver options
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.driver_name;
        option.textContent = `${driver.driver_name} (${driver.team_name})`;
        select.appendChild(option);
    });
}

// Populate live race driver dropdown with additional data attributes
function populateLiveRaceDriverDropdown(drivers) {
    const select = document.getElementById('live-race-driver');
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add driver options with data attributes
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.driver_name;
        option.textContent = `${driver.driver_name} (${driver.team_name})`;
        option.dataset.team = driver.team_name;
        option.dataset.number = driver.driver_number;
        option.dataset.display = driver.display_name;
        select.appendChild(option);
    });
    
    // Add event listener to update hidden fields when driver is selected
    select.addEventListener('change', function() {
        if (this.selectedIndex > 0) {
            const selectedOption = this.options[this.selectedIndex];
            document.getElementById('live-race-team-name').value = selectedOption.dataset.team || '';
            document.getElementById('live-race-car-number').value = selectedOption.dataset.number || '';
        } else {
            document.getElementById('live-race-team-name').value = '';
            document.getElementById('live-race-car-number').value = '';
        }
    });
}

// Helper function to set select value, handling null/empty values
function setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (!value) {
        select.value = '';
        return;
    }
    
    // Try to find the option with the exact value
    let found = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value) {
            select.selectedIndex = i;
            found = true;
            break;
        }
    }
    
    // If not found and there are options, log a warning
    if (!found && select.options.length > 1) {
        console.warn(`Could not find option with value "${value}" in select "${selectId}"`);
        console.log('Available options:', Array.from(select.options).map(o => o.value));
    }
}

// Function to initialize drag and drop functionality for results table
function initResultsDragAndDrop() {
    const tbody = document.getElementById('results-tbody');
    if (!tbody) return;
    
    let draggedRow = null;
    
    // Add event listeners to all draggable rows
    const rows = tbody.querySelectorAll('.draggable-row');
    
    rows.forEach(row => {
        // Dragstart event - when the user starts dragging
        row.addEventListener('dragstart', function(e) {
            draggedRow = this;
            // Add a class to style the dragged row
            this.classList.add('dragging');
            // Set the drag effect
            e.dataTransfer.effectAllowed = 'move';
            // Set some data (required for Firefox)
            e.dataTransfer.setData('text/plain', '');
        });
        
        // Dragend event - when the user stops dragging
        row.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedRow = null;
            // Update positions after drag
            updatePositions();
        });
        
        // Dragover event - when an element is dragged over a valid drop target
        row.addEventListener('dragover', function(e) {
            e.preventDefault(); // Allow drop
            if (draggedRow && draggedRow !== this) {
                // Determine if we should insert before or after this row
                const rect = this.getBoundingClientRect();
                const midpoint = (rect.top + rect.bottom) / 2;
                
                if (e.clientY < midpoint) {
                    // Insert before
                    tbody.insertBefore(draggedRow, this);
                } else {
                    // Insert after
                    const nextSibling = this.nextElementSibling;
                    if (nextSibling) {
                        tbody.insertBefore(draggedRow, nextSibling);
                    } else {
                        tbody.appendChild(draggedRow);
                    }
                }
            }
        });
    });
    
    // Function to update position numbers after drag and drop
    function updatePositions() {
        const rows = tbody.querySelectorAll('.draggable-row');
        rows.forEach((row, index) => {
            const position = index + 1;
            row.querySelector('.position-input').value = position;
            
            // Update points for race results based on new position
            if (document.getElementById('results-session').value === 'race') {
                const pointsInput = row.querySelector('.points-input');
                if (pointsInput && !pointsInput.dataset.customValue) {
                    pointsInput.value = getDefaultPoints(position);
                }
            }
        });
    }
}

// Function to populate form with existing results
function populateExistingResults(results, session) {
    const tbody = document.getElementById('results-tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Sort results by position
    results.sort((a, b) => a.position - b.position);
    
    // Add rows for each result
    results.forEach(result => {
        const row = document.createElement('tr');
        row.className = 'draggable-row';
        row.draggable = true;
        
        row.innerHTML = `
            <td class="drag-handle">
                <i class="fas fa-grip-vertical"></i>
                <input type="number" class="form-control position-input" value="${result.position}" min="1" max="20" required readonly>
            </td>
            <td>
                <input type="text" class="form-control driver-input" value="${result.driver_name}" required>
            </td>
            <td>
                <input type="text" class="form-control team-input" value="${result.team_name}" required>
            </td>
            <td>
                <input type="text" class="form-control time-input" value="${result.time || ''}" placeholder="e.g. 1:23.456 or +2.345s">
            </td>
            <td>
                <input type="number" class="form-control laps-input" value="${result.laps || ''}" min="0">
            </td>
            ${session === 'race' ? `
                <td>
                    <input type="number" class="form-control points-input" value="${result.points || 0}" min="0" data-custom-value="true">
                </td>
            ` : ''}
        `;
        
        tbody.appendChild(row);
    });
    
    // Add empty rows if needed to reach 20 total
    const currentRowCount = tbody.querySelectorAll('tr').length;
    if (currentRowCount < 20) {
        for (let i = currentRowCount; i < 20; i++) {
            const position = i + 1;
            const row = document.createElement('tr');
            row.className = 'draggable-row';
            row.draggable = true;
            
            row.innerHTML = `
                <td class="drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                    <input type="number" class="form-control position-input" value="${position}" min="1" max="20" required readonly>
                </td>
                <td>
                    <input type="text" class="form-control driver-input" value="" required>
                </td>
                <td>
                    <input type="text" class="form-control team-input" value="" required>
                </td>
                <td>
                    <input type="text" class="form-control time-input" placeholder="e.g. 1:23.456 or +2.345s">
                </td>
                <td>
                    <input type="number" class="form-control laps-input" min="0">
                </td>
                ${session === 'race' ? `
                    <td>
                        <input type="number" class="form-control points-input" value="${getDefaultPoints(position)}" min="0">
                    </td>
                ` : ''}
            `;
            
            tbody.appendChild(row);
        }
    }
    
    // Reinitialize drag and drop
    initResultsDragAndDrop();
} 