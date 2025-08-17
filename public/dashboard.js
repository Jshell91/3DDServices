// Dashboard JavaScript
// Use relative URLs instead of absolute to avoid HTTPS issues
const API_BASE = window.location.origin;

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        window.location.href = '/dashboard/login.html';
        return;
    }
    
    // If authenticated, load dashboard
    console.log('Dashboard initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    refreshAllData();
    
    // Auto-refresh every 30 seconds
    setInterval(loadStats, 30000);
});

// Setup event listeners for buttons
function setupEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            showTab(tabName);
        });
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', refreshAllData);
    
    // Map editing buttons (using event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('select-btn')) {
            const mapId = e.target.getAttribute('data-map-id');
            openEditModal(mapId);
        }
    });
    
    // Modal event listeners
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelEdit').addEventListener('click', closeModal);
    document.getElementById('saveMapChanges').addEventListener('click', saveMapFromModal);
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('editMapModal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/admin/check');
        const data = await response.json();
        return data.ok && data.isAuthenticated;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

// Utility function to make authenticated API calls
async function apiCall(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        
        if (response.status === 401) {
            // Redirect to login if unauthorized
            window.location.href = '/dashboard/login.html';
            return { ok: false, error: 'Unauthorized' };
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API call error:', error);
        return { ok: false, error: error.message };
    }
}

// Tab switching functionality
function showTab(tabName) {
    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab panel
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button - find the button for this tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Load data for the specific tab
    switch(tabName) {
        case 'players':
            loadPlayers();
            break;
        case 'likes':
            loadLikes();
            break;
        case 'maps':
            loadMaps();
            break;
        case 'online-maps':
            loadOnlineMaps();
            break;
        case 'open-maps':
            loadOpenMaps();
            break;
    }
}

// Load dashboard statistics
async function loadStats() {
    try {
        const statsData = await apiCall('/admin/api/stats');
        
        if (statsData.ok && statsData.stats) {
            const { totalPlayers, totalLikes, totalMaps, onlineMaps } = statsData.stats;
            
            // Update UI
            document.getElementById('totalPlayers').textContent = totalPlayers;
            document.getElementById('totalLikes').textContent = totalLikes;
            document.getElementById('totalMaps').textContent = totalMaps;
            document.getElementById('onlineMaps').textContent = onlineMaps;
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load players data
async function loadPlayers() {
    const tableBody = document.querySelector('#playersTable tbody');
    tableBody.innerHTML = '<tr><td colspan="2" class="loading">Loading players data...</td></tr>';
    
    const data = await apiCall('/admin/api/players');
    
    if (data.ok && data.data) {
        tableBody.innerHTML = '';
        data.data.forEach(level => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${level.level_name}</td>
                <td><strong>${level.count}</strong></td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="2">Error loading data</td></tr>';
    }
}

// Load artwork likes data
async function loadLikes() {
    const tableBody = document.querySelector('#likesTable tbody');
    tableBody.innerHTML = '<tr><td colspan="2" class="loading">Loading likes data...</td></tr>';
    
    const data = await apiCall('/admin/api/likes');
    
    if (data.ok && data.data) {
        tableBody.innerHTML = '';
        data.data.forEach(artwork => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${artwork.artwork_id}</td>
                <td><strong>${artwork.likes}</strong></td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="2">Error loading data</td></tr>';
    }
}

// Load maps data
async function loadMaps() {
    console.log('🗺️ Loading maps data...');
    const tableBody = document.querySelector('#maps-tbody');
    if (!tableBody) {
        console.error('❌ Table body #maps-tbody not found');
        return;
    }
    
    console.log('✅ Table body found, setting loading message...');
    tableBody.innerHTML = '<tr><td colspan="9" class="loading">Loading maps data...</td></tr>';
    
    const data = await apiCall('/admin/api/maps');
    console.log('📊 API response:', data);
    
    if (data.ok && data.data) {
        console.log(`📋 Got ${data.data.length} maps`);
        // Store maps data globally for drag & drop
        window.mapsData = data.data;
        
        renderMapsTable();
        initializeDragDrop();
    } else {
        console.error('❌ Error in API response:', data);
        tableBody.innerHTML = '<tr><td colspan="9">Error loading data</td></tr>';
    }
}

// Render maps table
function renderMapsTable() {
    console.log('🎨 Rendering maps table...');
    const tableBody = document.querySelector('#maps-tbody');
    tableBody.innerHTML = '';
    
    console.log(`📊 Rendering ${window.mapsData.length} maps`);
    
    window.mapsData.forEach((map, index) => {
        console.log(`📋 Rendering map ${index + 1}: ${map.name} (order: ${map.display_order})`);
        const row = document.createElement('tr');
        row.dataset.mapId = map.id;
        
        // Create individual cells to avoid innerHTML issues
        row.innerHTML = '';
        
        // 1. Order input
        const orderCell = document.createElement('td');
        const orderInput = document.createElement('input');
        orderInput.type = 'number';
        orderInput.value = map.display_order || (index + 1);
        orderInput.className = 'display-order-input';
        orderInput.min = '1';
        orderInput.setAttribute('onchange', `updateMapOrder(${map.id}, this.value)`);
        orderCell.appendChild(orderInput);
        row.appendChild(orderCell);
        
        // 2. Name
        const nameCell = document.createElement('td');
        nameCell.textContent = map.name;
        row.appendChild(nameCell);
        
        // 3. Game Name
        const gameNameCell = document.createElement('td');
        gameNameCell.textContent = map.name_in_game || 'N/A';
        row.appendChild(gameNameCell);
        
        // 4. Code Map
        const codeMapCell = document.createElement('td');
        codeMapCell.textContent = map.codemap || 'N/A';
        row.appendChild(codeMapCell);
        
        // 5. Max Players
        const maxPlayersCell = document.createElement('td');
        maxPlayersCell.textContent = map.max_players;
        row.appendChild(maxPlayersCell);
        
        // 6. Single Player
        const singlePlayerCell = document.createElement('td');
        const singlePlayerSpan = document.createElement('span');
        singlePlayerSpan.className = `boolean-${map.is_single_player}`;
        singlePlayerSpan.textContent = map.is_single_player ? 'Yes' : 'No';
        singlePlayerCell.appendChild(singlePlayerSpan);
        row.appendChild(singlePlayerCell);
        
        // 7. Online
        const onlineCell = document.createElement('td');
        const onlineSpan = document.createElement('span');
        onlineSpan.className = `boolean-${map.is_online}`;
        onlineSpan.textContent = map.is_online ? 'Yes' : 'No';
        onlineCell.appendChild(onlineSpan);
        row.appendChild(onlineCell);
        
        // 8. Visible
        const visibleCell = document.createElement('td');
        const visibleSpan = document.createElement('span');
        visibleSpan.className = `boolean-${map.visible_map_select}`;
        visibleSpan.textContent = map.visible_map_select ? 'Yes' : 'No';
        visibleCell.appendChild(visibleSpan);
        row.appendChild(visibleCell);
        
        // 9. Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';
        
        const editMapBtn = document.createElement('button');
        editMapBtn.className = 'select-btn';
        editMapBtn.textContent = '📝 Edit Map';
        editMapBtn.setAttribute('onclick', `openEditModal(${map.id})`);
        actionsCell.appendChild(editMapBtn);
        
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
    
    console.log('✅ Table rendered successfully');
}

// Initialize drag & drop functionality
function initializeDragDrop() {
    // Drag & drop disabled since we removed the drag handle
    // Users can use the Order input field to change order manually
    console.log('💡 Drag & drop disabled - use Order input field to change order');
}

// Load online maps data
async function loadOnlineMaps() {
    const tableBody = document.querySelector('#onlineMapsTable tbody');
    tableBody.innerHTML = '<tr><td colspan="8" class="loading">Loading online maps data...</td></tr>';
    
    const data = await apiCall('/admin/api/online-maps');
    
    if (data.ok && data.data) {
        tableBody.innerHTML = '';
        data.data.forEach(map => {
            const row = document.createElement('tr');
            const openedDate = new Date(map.opened_stamp).toLocaleString();
            const closedDate = map.closed_stamp ? new Date(map.closed_stamp).toLocaleString() : '-';
            row.innerHTML = `
                <td>${map.id}</td>
                <td>${map.map_name}</td>
                <td>${map.address}</td>
                <td>${map.port}</td>
                <td>${map.current_players}/${map.max_players}</td>
                <td><span class="status-${map.status}">${map.status.toUpperCase()}</span></td>
                <td>${openedDate}</td>
                <td>${closedDate}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="8">Error loading data</td></tr>';
    }
}

// Load open maps data (only OPEN status)
async function loadOpenMaps() {
    const tableBody = document.querySelector('#openMapsTable tbody');
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading open maps data...</td></tr>';
    
    const data = await apiCall('/admin/api/online-maps');
    
    if (data.ok && data.data) {
        tableBody.innerHTML = '';
        // Filter only OPEN maps
        const openMaps = data.data.filter(map => map.status.toUpperCase() === 'OPEN');
        
        if (openMaps.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No open maps found</td></tr>';
            return;
        }
        
        openMaps.forEach(map => {
            const row = document.createElement('tr');
            const openedDate = new Date(map.opened_stamp).toLocaleString();
            row.innerHTML = `
                <td>${map.id}</td>
                <td>${map.map_name}</td>
                <td>${map.address}</td>
                <td>${map.port}</td>
                <td>${map.current_players}/${map.max_players}</td>
                <td>${openedDate}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="6">Error loading data</td></tr>';
    }
}

// Refresh all data
async function refreshAllData() {
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    try {
        // Always load stats
        await loadStats();
        
        // Load data for currently active tab
        const activeTab = document.querySelector('.tab-panel.active');
        if (activeTab) {
            const tabId = activeTab.id;
            switch(tabId) {
                case 'players':
                    await loadPlayers();
                    break;
                case 'likes':
                    await loadLikes();
                    break;
                case 'maps':
                    await loadMaps();
                    break;
                case 'online-maps':
                    await loadOnlineMaps();
                    break;
                case 'open-maps':
                    await loadOpenMaps();
                    break;
            }
        } else {
            // Default to loading players data if no active tab
            await loadPlayers();
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
    } finally {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/admin/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.href = '/dashboard/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if logout request fails
        window.location.href = '/dashboard/login.html';
    }
}

// Map editing functions
function openEditModal(mapId) {
    // Get all maps data to find the complete record
    apiCall('/admin/api/maps').then(response => {
        if (response.ok) {
            const map = response.data.find(m => m.id == mapId);
            if (map) {
                populateModal(map);
                document.getElementById('editMapModal').style.display = 'block';
            }
        }
    });
}

function populateModal(map) {
    document.getElementById('mapId').value = map.id;
    document.getElementById('mapName').value = map.name || '';
    document.getElementById('mapGameName').value = map.name_in_game || '';
    document.getElementById('mapCodeMap').value = map.codemap || '';
    document.getElementById('mapMaxPlayers').value = map.max_players || 1;
    document.getElementById('mapSinglePlayer').value = map.is_single_player ? 'true' : 'false';
    document.getElementById('mapOnline').value = map.is_online ? 'true' : 'false';
    document.getElementById('mapVisible').value = map.visible_map_select ? 'true' : 'false';
    document.getElementById('mapViews').value = map.views || 0;
    document.getElementById('mapDisplayOrder').value = map.display_order || 1;
    document.getElementById('mapSponsor').value = map.sponsor || '';
    document.getElementById('mapImage').value = map.image || '';
}

// ===== DISPLAY ORDER FUNCTIONS =====

// Save drag order
async function saveDragOrder() {
    try {
        showMessage('Saving new order...', 'info');
        
        // Update each map with new order
        for (const map of window.mapsData) {
            await apiCall(`/admin/api/maps/${map.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    display_order: map.display_order
                })
            });
        }
        
        showMessage('Order updated successfully!', 'success');
    } catch (error) {
        showMessage('Error saving order: ' + error.message, 'error');
        loadMaps(); // Reload to reset
    }
}

// Update map order manually
async function updateMapOrder(mapId, newOrder) {
    try {
        const order = parseInt(newOrder);
        if (order < 1) {
            showMessage('Order must be greater than 0', 'error');
            return;
        }
        
        showMessage('Updating order...', 'info');
        
        const result = await apiCall(`/admin/api/maps/${mapId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                display_order: order
            })
        });
        
        if (result.ok) {
            showMessage('Order updated successfully!', 'success');
            loadMaps(); // Reload to show changes
        } else {
            showMessage('Error updating order: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error updating order: ' + error.message, 'error');
    }
}

// Edit map order modal
function editMapOrder(mapId) {
    const map = window.mapsData.find(m => m.id === mapId);
    if (!map) return;
    
    window.currentEditingMap = map;
    document.getElementById('modal-map-name').textContent = map.name;
    document.getElementById('modal-current-order').textContent = map.display_order;
    document.getElementById('new-order').value = map.display_order;
    document.getElementById('editOrderModal').style.display = 'block';
}

// Close edit order modal
function closeEditOrderModal() {
    document.getElementById('editOrderModal').style.display = 'none';
    window.currentEditingMap = null;
}

// Save order from modal
async function saveOrder() {
    if (!window.currentEditingMap) return;
    
    const newOrder = parseInt(document.getElementById('new-order').value);
    if (newOrder < 1) {
        showMessage('Order must be greater than 0', 'error');
        return;
    }
    
    await updateMapOrder(window.currentEditingMap.id, newOrder);
    closeEditOrderModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editOrderModal');
    if (event.target === modal) {
        closeEditOrderModal();
    }
}

// Helper function to show messages
function showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('status-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'status-message';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(messageEl);
    }
    
    // Set color based on type
    const colors = {
        info: '#007bff',
        success: '#28a745',
        error: '#dc3545'
    };
    
    messageEl.style.backgroundColor = colors[type] || colors.info;
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

function closeModal() {
    document.getElementById('editMapModal').style.display = 'none';
    document.getElementById('editMapForm').reset();
}

async function saveMapFromModal() {
    const form = document.getElementById('editMapForm');
    const formData = new FormData(form);
    const mapId = formData.get('mapId');
    
    // Validate required fields
    const name = formData.get('name').trim();
    const nameInGame = formData.get('name_in_game').trim();
    const maxPlayers = parseInt(formData.get('max_players'));
    
    if (!name || !nameInGame || !maxPlayers) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }
    
    const updateData = {
        name: name,
        game_name: nameInGame,
        codemap: formData.get('codemap')?.trim() || '',
        max_players: maxPlayers,
        single_player: formData.get('is_single_player') === 'true',
        online: formData.get('is_online') === 'true',
        visible_map_select: formData.get('visible_map_select') === 'true',
        views: parseInt(formData.get('views')) || 0,
        display_order: parseInt(formData.get('display_order')) || 1,
        sponsor: formData.get('sponsor')?.trim() || '',
        image: formData.get('image')?.trim() || ''
    };
    
    try {
        const response = await fetch(`/admin/api/maps/${mapId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.ok) {
            closeModal();
            await loadMaps();
            alert('Map updated successfully!');
        } else {
            alert('Error updating map: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving map:', error);
        alert('Error saving map. Please try again.');
    }
}
