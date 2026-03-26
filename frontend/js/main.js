document.addEventListener('DOMContentLoaded', () => {
    // Handle form submissions for auth pages
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Signing in...';
            btn.disabled = true;
            
            const email = document.getElementById('email')?.value || '';
            const password = document.getElementById('password')?.value || '';
            
            try {
                const response = await fetch('http://localhost:8081/api/users/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password })
                });
                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = 'farmer-dashboard.html';
                } else {
                    alert('Invalid credentials');
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Creating Account...';
            btn.disabled = true;
            
            const username = document.getElementById('username')?.value || 'Farmer_' + Date.now();
            const email = document.getElementById('email')?.value || '';
            const password = document.getElementById('password')?.value || '';
            const farmName = document.getElementById('farm-name')?.value || 'My Farm';
            
            try {
                const response = await fetch('http://localhost:8081/api/users', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username, email, password, role: 'FARMER', farmName })
                });
                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = 'farmer-dashboard.html';
                } else {
                    alert('Signup failed (email might exist).');
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // Dashboard Interactivity
    setupDashboard();
});

function setupDashboard() {
    const cropForm = document.getElementById('add-crop-form');
    if (cropForm) {
        cropForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cropName = document.getElementById('crop-name').value;
            const cropQty = document.getElementById('crop-qty').value;
            
            if (cropName && cropQty) {
                addCropToList(cropName, cropQty);
                cropForm.reset();
                showToast('Crop successfully listed for sale!');
            }
        });
    }

    // Load the community orders network data
    loadFarmerCommunityOrders();
}

function addCropToList(name, qty) {
    const list = document.getElementById('available-crops-list');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'crop-item';
    item.innerHTML = `
        <div class="crop-info">
            <h4>${escapeHtml(name)}</h4>
            <p class="crop-meta">Quantity: ${escapeHtml(qty)}</p>
        </div>
        <button class="btn-small btn-outline" onclick="this.parentElement.remove()">Remove</button>
    `;
    list.appendChild(item);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.className = 'toast hide';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

async function loadFarmerCommunityOrders() {
    const list = document.getElementById('farmer-community-orders-list');
    if (!list) return;
    
    try {
        const res = await fetch('http://localhost:8081/api/orders/aggregated');
        if (!res.ok) throw new Error('Failed to fetch network orders');
        const grouped = await res.json();
        
        const communityNames = Object.keys(grouped);
        if (communityNames.length === 0) {
            list.innerHTML = `<div class="demand-item"><p class="crop-meta" style="width: 100%; text-align: center;">No local community network orders at this time.</p></div>`;
            return;
        }
        
        list.innerHTML = '';
        
        for (const [communityName, crops] of Object.entries(grouped)) {
            let cropsHtml = '';
            for (const [crop, total] of Object.entries(crops)) {
                 cropsHtml += `<span style="display: inline-block; background: rgba(0,0,0,0.3); padding: 0.2rem 0.6rem; border-radius: 6px; margin-right: 0.5rem; margin-top: 0.5rem; font-size: 0.9rem;">${escapeHtml(crop)}: <strong style="color: #e879f9;">${escapeHtml(String(total))}kg</strong></span>`;
            }
            
            const item = document.createElement('div');
            item.className = 'demand-item';
            item.style.borderLeftColor = '#c084fc';
            item.innerHTML = `
                <div class="demand-info" style="width: 100%;">
                    <h4 style="font-size: 1.1rem; color: #f8fafc;">${escapeHtml(communityName)}</h4>
                    <div style="margin-top: 0.5rem;">
                        ${cropsHtml}
                    </div>
                </div>
                <button class="btn-small btn-primary" style="background: linear-gradient(135deg, #a855f7, #ec4899); border: none; padding: 0.6rem 1.2rem; margin-left: 1rem;">Accept Order</button>
            `;
            list.appendChild(item);
        }
    } catch (err) {
        console.error(err);
        list.innerHTML = `<p style="color:red; text-align:center;">Error loading live network orders from backend.</p>`;
    }
}
