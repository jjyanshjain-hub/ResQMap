// Official Command Center Password (ONLY FOR RESCUE PORTAL)
const COMMAND_CENTER_PASSWORD = "8058";

function protectRescueDashboard() {
    if (window.location.pathname.includes("rescue.html")) {
        const isAuthorized = sessionStorage.getItem("resqmap_authorized");

        if (isAuthorized !== "true") {
            const userPass = prompt("🔒 SECURE COMMAND CENTER ACCESS\n\nPlease enter Official Rescue Officer Password:");
            
            if (userPass === COMMAND_CENTER_PASSWORD) {
                sessionStorage.setItem("resqmap_authorized", "true");
                alert("✅ Access Granted! Welcome to ResQMap Command Center.");
            } else {
                alert("❌ Unauthorized Access Blocked! Redirecting to Victim Portal...");
                window.location.href = "victim.html";
            }
        }
    }
}

// Security Check Execute
protectRescueDashboard();

// Global Variables & Setup
let userLat = null;
let userLng = null;
let map;
let markers = [];
let heatPoints = [];
let heatLayer;

const GEMINI_API_KEY = "AQ.Ab8RN6JvSniB1Rid8u8o0AVkikSgKM-e1l9FVi8Z3RTyHNyG7g";

// Safe Elevated Zones Data
const safeZones = [
    { name: "Government High School Terrace", lat: 27.5750, lng: 76.6390, elev: "High Elevation (Flood Safe)" },
    { name: "Central Elevated Relief Camp", lat: 27.5650, lng: 76.6310, elev: "High Ground Shelter" }
];

// Landslide Risk Danger Zones Data
const landslideZones = [
    { name: "North Hill Slope Road", lat: 27.5810, lng: 76.6450, risk: "High Soil Erosion & Falling Debris" },
    { name: "Eastern Ridge Bypass", lat: 27.5580, lng: 76.6480, risk: "Active Landslide Hazard" }
];

// Rescue Patrol Routes
const rescueRoutes = [
    { team: "Alpha Rescue Patrol Route", path: [[27.5706, 76.6369], [27.5750, 76.6390], [27.5810, 76.6450]] },
    { team: "Bravo Evacuation Route", path: [[27.5706, 76.6369], [27.5650, 76.6310], [27.5580, 76.6480]] }
];

window.onload = function() {
    if (!window.location.search.includes('developer=jyansh-jain')) {
        window.history.replaceState(null, '', window.location.pathname + '?developer=jyansh-jain');
    }

    const mapElement = document.getElementById('map');
    if (mapElement) {
        initMap();
    }

    loadSavedRequests();

    // Live Tab Sync Interval
    setInterval(() => {
        loadSavedRequests();
    }, 1500);
};

function initMap() {
    const streetView = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    });

    const satelliteView = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri Satellite'
    });

    map = L.map('map', {
        center: [27.5706, 76.6369],
        zoom: 13,
        layers: [satelliteView]
    });

    if (typeof L.heatLayer === 'function') {
        heatLayer = L.heatLayer([], { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    }

    const baseMaps = {
        "🛰️ Satellite View": satelliteView,
        "🗺️ Standard Map": streetView
    };
    L.control.layers(baseMaps).addTo(map);

    renderSafeZones();
    renderLandslideZones();
    renderMultipleRescueRoutes();
}

function renderSafeZones() {
    if (!map) return;
    safeZones.forEach(zone => {
        L.circle([zone.lat, zone.lng], {
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.35,
            radius: 300
        }).addTo(map);

        L.marker([zone.lat, zone.lng]).addTo(map).bindPopup(`
            <div style="font-family: sans-serif; color: #0f172a;">
                <b style="color: #22c55e;">🟢 SAFE ELEVATED ZONE</b><br>
                <b>Location:</b> ${zone.name}<br>
                <b>Status:</b> ${zone.elev}
            </div>
        `);
    });
}

function renderLandslideZones() {
    if (!map) return;
    landslideZones.forEach(zone => {
        L.circle([zone.lat, zone.lng], {
            color: '#f97316',
            fillColor: '#ef4444',
            fillOpacity: 0.45,
            radius: 400
        }).addTo(map);

        L.marker([zone.lat, zone.lng]).addTo(map).bindPopup(`
            <div style="font-family: sans-serif; color: #0f172a;">
                <b style="color: #f97316;">⚠️ LANDSLIDE RISK ZONE</b><br>
                <b>Area:</b> ${zone.name}<br>
                <b>Hazard Info:</b> ${zone.risk}
            </div>
        `);
    });
}

function renderMultipleRescueRoutes() {
    if (!map) return;
    rescueRoutes.forEach(route => {
        L.polyline(route.path, {
            color: '#06b6d4',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8'
        }).addTo(map).bindPopup(`<b>🚁 ${route.team}</b>`);
    });
}

function getLocation() {
    const locStatus = document.getElementById('locStatus');
    if (!locStatus) return;

    if (navigator.geolocation) {
        locStatus.innerText = "Fetching GPS Location...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                locStatus.innerText = `GPS Fixed: (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;
                locStatus.style.color = "#4ade80";
                if (map) map.setView([userLat, userLng], 14);
            },
            () => {
                userLat = 27.5710 + (Math.random() - 0.5) * 0.02;
                userLng = 76.6370 + (Math.random() - 0.5) * 0.02;
                locStatus.innerText = `GPS Simulated: (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;
                locStatus.style.color = "#38bdf8";
                if (map) map.setView([userLat, userLng], 14);
            }
        );
    } else {
        locStatus.innerText = "Geolocation not supported by browser.";
    }
}

async function classifyWithAI(userNeed, userMessage) {
    const promptText = `Analyze this disaster relief request message. Categorize it strictly into one word: either "critical" or "moderate".
    Rules:
    - "critical": Immediate life threat, medical emergency, drowning, trapped, infant/elderly in danger.
    - "moderate": Needs food, water, basic shelter, general inquiry.

    Request Need Type: ${userNeed}
    Victim Message: "${userMessage}"
    
    Respond with ONLY ONE WORD ("critical" or "moderate").`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text.trim().toLowerCase();
        return aiResponse.includes("critical") ? "critical" : "moderate";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return (userNeed.includes("Medical") || userNeed.includes("Trapped")) ? "critical" : "moderate";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sosForm = document.getElementById('sosForm');
    if (sosForm) {
        sosForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!userLat || !userLng) {
                userLat = 27.5706 + (Math.random() - 0.5) * 0.03;
                userLng = 76.6369 + (Math.random() - 0.5) * 0.03;
            }

            const submitBtn = e.target.querySelector('.submit-btn');
            submitBtn.innerText = "AI Analyzing Emergency...";
            submitBtn.disabled = true;

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const need = document.getElementById('needType').value;
            const message = document.getElementById('message').value;

            const priority = await classifyWithAI(need, message);

            submitBtn.innerText = "SEND SOS ALERT NOW";
            submitBtn.disabled = false;

            const newRequest = {
                id: Date.now(),
                name,
                phone,
                need,
                message,
                priority,
                lat: userLat,
                lng: userLng
            };

            saveRequestToStorage(newRequest);
            lastRenderedState = "";
            loadSavedRequests();

            alert("🚨 SOS Alert Sent Successfully! Location synced with Rescue Command Center.");

            document.getElementById('sosForm').reset();
            const locStatus = document.getElementById('locStatus');
            if (locStatus) {
                locStatus.innerText = "Location reset. Get location again for new SOS.";
                locStatus.style.color = "#94a3b8";
            }
            userLat = null;
            userLng = null;
        });
    }
});

function saveRequestToStorage(requestObj) {
    let requests = JSON.parse(localStorage.getItem('resqmap_requests') || '[]');
    requests.unshift(requestObj);
    localStorage.setItem('resqmap_requests', JSON.stringify(requests));
}

function deleteRequest(id) {
    let requests = JSON.parse(localStorage.getItem('resqmap_requests') || '[]');
    requests = requests.filter(req => req.id !== id);
    localStorage.setItem('resqmap_requests', JSON.stringify(requests));
    lastRenderedState = "";
    loadSavedRequests();
}

let lastRenderedState = "";

function loadSavedRequests() {
    let requests = JSON.parse(localStorage.getItem('resqmap_requests') || '[]');
    const currentState = JSON.stringify(requests);

    if (currentState === lastRenderedState) return;
    lastRenderedState = currentState;

    updateAnalyticsCounters(requests);

    const cardContainer = document.getElementById('requestCards');
    if (cardContainer) cardContainer.innerHTML = '';

    if (markers.length > 0) {
        markers.forEach(m => map && map.removeLayer(m));
        markers = [];
    }
    heatPoints = [];

    requests.forEach(req => {
        if (map) {
            addMarkerToMap(req.lat, req.lng, req.name, req.need, req.priority, req.message);
        }
        if (cardContainer) {
            addRequestCard(req);
        }
    });

    if (heatLayer && map) {
        heatLayer.setLatLngs(heatPoints);
    }
}

function updateAnalyticsCounters(requests) {
    const cntTotal = document.getElementById('cntTotal');
    const cntCritical = document.getElementById('cntCritical');
    const cntModerate = document.getElementById('cntModerate');

    if (cntTotal && cntCritical && cntModerate) {
        const criticalCount = requests.filter(r => r.priority === 'critical').length;
        const moderateCount = requests.filter(r => r.priority === 'moderate').length;

        cntTotal.innerText = requests.length;
        cntCritical.innerText = criticalCount;
        cntModerate.innerText = moderateCount;
    }
}

function addMarkerToMap(lat, lng, name, need, priority, message) {
    if (!map) return;
    const marker = L.marker([lat, lng]).addTo(map);

    // Google Street View 360 Direct Pano URL
    const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

    marker.bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; min-width: 200px;">
            <b style="color: ${priority === 'critical' ? '#ef4444' : '#eab308'}; text-transform: uppercase;">🚨 ${priority} ALERT</b><br>
            <b>Name:</b> ${name}<br>
            <b>Need:</b> ${need}<br>
            <b>Message:</b> ${message}<br><br>
            
            <a href="${streetViewUrl}" target="_blank" style="
                display: block;
                background: #0284c7;
                color: white;
                text-align: center;
                padding: 6px 10px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 11px;
                margin-top: 5px;
            ">
                🌐 Open 360° Interactive Road View
            </a>
        </div>
    `);
    markers.push(marker);

    const intensity = priority === 'critical' ? 1.0 : 0.5;
    heatPoints.push([lat, lng, intensity]);
}

function addRequestCard(req) {
    const cardContainer = document.getElementById('requestCards');
    if (!cardContainer) return;

    const cleanPhone = req.phone.replace(/[^0-9]/g, '');
    const waMessage = encodeURIComponent(`Hello ${req.name}, Rescue Team has received your SOS Alert (${req.need}) on ResQMap. Relief is on the way!`);
    
    const card = document.createElement('div');
    card.className = `req-card ${req.priority}`;
    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4>${req.name}</h4>
            <span style="font-weight:bold; font-size:11px; padding: 2px 6px; border-radius:4px; background: ${req.priority === 'critical' ? '#ef4444' : '#eab308'}; color:white; text-transform:uppercase;">${req.priority}</span>
        </div>
        <p style="margin-top:5px;"><strong>Need:</strong> ${req.need}</p>
        <p><strong>Detail:</strong> ${req.message}</p>
        
        <div class="card-actions">
            <a href="tel:${req.phone}" class="btn-action btn-call">📞 Call (${req.phone})</a>
            <a href="https://wa.me/${cleanPhone}?text=${waMessage}" target="_blank" class="btn-action btn-wa">💬 WhatsApp</a>
        </div>
        
        <button onclick="deleteRequest(${req.id})" class="btn-solve">
            ✓ Mark as Solved (Delete)
        </button>
    `;
    cardContainer.appendChild(card);
}