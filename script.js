let map;
let markers = [];
let gameState = { playerName: "Player", score: 0, foundTreasures: [] };
let activeTreasure = null;

window.onload = () => {
    loadGameState();
    initMap();
    checkPlayerName();
    updateUI();
};

function initMap() {
    // Center map and set zoom based on screen width
    const isMobile = window.innerWidth < 768;
    map = L.map('map', {
        zoomControl: !isMobile, // Hide zoom buttons on mobile for cleaner look
        tap: true // Ensures tap works well on mobile
    }).setView([20, 0], isMobile ? 1 : 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    renderTreasures();
}

function checkPlayerName() {
    if (!localStorage.getItem('treasureHunt_playerName')) {
        const name = prompt("Welcome, Voyager! What is your name?", "Explorer");
        gameState.playerName = name || "Explorer";
        saveGameState();
    }
}

function loadGameState() {
    const saved = localStorage.getItem('treasureHunt_save');
    const savedName = localStorage.getItem('treasureHunt_playerName');
    if (saved) gameState = JSON.parse(saved);
    if (savedName) gameState.playerName = savedName;
}

function saveGameState() {
    localStorage.setItem('treasureHunt_save', JSON.stringify(gameState));
    localStorage.setItem('treasureHunt_playerName', gameState.playerName);
    updateUI();
}

function renderTreasures() {
    if (!map) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    const listContainer = document.getElementById('treasure-list');
    listContainer.innerHTML = '';

    treasures.forEach(treasure => {
        const isFound = gameState.foundTreasures.includes(treasure.id);
        
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="custom-marker">${isFound ? '🪙' : '📦'}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([treasure.lat, treasure.lng], { icon: icon }).addTo(map);
        
        marker.on('click', () => {
            if (isFound) alert(`You've already claimed the ${treasure.name}!`);
            else openClueModal(treasure);
        });

        markers.push(marker);

        // List UI Item
        const item = document.createElement('div');
        item.className = `p-4 rounded-xl flex justify-between items-center transition shadow-sm border border-transparent ${isFound ? 'treasure-found' : 'treasure-hidden hover:border-amber-300'}`;
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${isFound ? '📜' : '🔒'}</span>
                <div>
                    <p class="font-black text-amber-900 leading-tight">${treasure.name}</p>
                    <p class="text-xs font-bold text-amber-600">${treasure.points} Points</p>
                </div>
            </div>
            <div class="h-2 w-2 rounded-full ${isFound ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}"></div>
        `;
        listContainer.appendChild(item);
    });

    document.getElementById('progress-stats').innerText = `${gameState.foundTreasures.length}/${treasures.length} Found`;
}

function updateUI() {
    document.getElementById('player-name-display').innerText = gameState.playerName;
    document.getElementById('score-display').innerText = gameState.score;
}

function openClueModal(treasure) {
    activeTreasure = treasure;
    document.getElementById('modal-title').innerText = treasure.name;
    document.getElementById('modal-clue').innerText = treasure.clue;
    document.getElementById('answer-input').value = "";
    document.getElementById('feedback-msg').classList.add('hidden');
    document.getElementById('clue-modal').classList.remove('hidden');
    document.getElementById('answer-input').focus();

    document.getElementById('submit-btn').onclick = checkAnswer;
}

function closeModal() {
    document.getElementById('clue-modal').classList.add('hidden');
}

function checkAnswer() {
    const input = document.getElementById('answer-input').value.toLowerCase().trim();
    const feedback = document.getElementById('feedback-msg');

    if (input === activeTreasure.answer.toLowerCase()) {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.7 },
            colors: ['#f59e0b', '#fbbf24', '#ffffff']
        });

        gameState.score += activeTreasure.points;
        gameState.foundTreasures.push(activeTreasure.id);
        saveGameState();
        renderTreasures();
        
        feedback.innerText = "TREASURE CLAIMED! 💰";
        feedback.className = "mt-4 font-black text-green-600";
        feedback.classList.remove('hidden');

        setTimeout(closeModal, 1800);
    } else {
        feedback.innerText = "Incorrect answer! ❌";
        feedback.className = "mt-4 font-black text-red-600 animate-bounce";
        feedback.classList.remove('hidden');
    }
}

function resetGame() {
    if (confirm("This will delete your progress and score. Continue?")) {
        localStorage.clear();
        location.reload();
    }
}

// Handle window resizing for map zoom adjustments
window.onresize = () => {
    const isMobile = window.innerWidth < 768;
    if (map) map.setZoom(isMobile ? 1 : 2);
};