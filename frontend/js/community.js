document.addEventListener('DOMContentLoaded', () => {
    // Resident Auth logic
    const signupForm = document.getElementById('resident-signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Joining Network...';
            btn.disabled = true;
            
            const username = document.getElementById('username')?.value || 'Resident_' + Date.now();
            const email = document.getElementById('email')?.value || '';
            const password = document.getElementById('password')?.value || '';
            const communityName = document.getElementById('community-name')?.value || 'Sunrise Apartments';
            
            try {
                const response = await fetch('http://localhost:8081/api/users', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username, email, password, role: 'RESIDENT', communityName })
                });
                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    localStorage.setItem('userCommunity', communityName);
                    window.location.href = 'resident-dashboard.html';
                } else {
                    alert('Signup failed.');
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

    const loginForm = document.getElementById('resident-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Signing In...';
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
                    localStorage.setItem('userCommunity', user.communityName || 'Sunrise Apartments');
                    window.location.href = 'resident-dashboard.html';
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

    // Determine community name dynamically
    const communityNameElements = document.querySelectorAll('#nav-community-name, #network-community-name');
    const userCommunity = localStorage.getItem('userCommunity') || 'Sunrise Apartments';
    
    communityNameElements.forEach(el => {
        el.textContent = userCommunity;
    });

    setupResidentDashboard();
    setupCommunityDashboard();
});

function setupResidentDashboard() {
    const orderForm = document.getElementById('resident-order-form');
    if (!orderForm) return;

    renderMyOrders();

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const crop = document.getElementById('crop-select').value;
        const qty = parseInt(document.getElementById('order-qty').value, 10);
        
        if (crop && qty > 0) {
            addResidentOrder(crop, qty);
            orderForm.reset();
            if (typeof showToast === 'function') {
                showToast(`Added ${qty}kg of ${crop} to your requirements.`);
            } else {
                alert(`Added ${qty}kg of ${crop} to your requirements.`);
            }
        }
    });
}

async function addResidentOrder(crop, qty) {
    const userCommunity = localStorage.getItem('userCommunity') || 'Sunrise Apartments';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const residentId = currentUser ? currentUser.id : 1; // Default to ID 1 if not thoroughly logged in during testing
    
    try {
        await fetch('http://localhost:8081/api/orders', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ cropName: crop, quantity: qty, communityName: userCommunity, residentId: residentId })
        });
        renderMyOrders();
    } catch(err) {
        console.error(err);
    }
}

async function renderMyOrders() {
    const list = document.getElementById('my-orders-list');
    if (!list) return;
    
    const userCommunity = localStorage.getItem('userCommunity') || 'Sunrise Apartments';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const residentId = currentUser ? currentUser.id : 1;
    
    try {
        const res = await fetch(`http://localhost:8081/api/orders/community/${encodeURIComponent(userCommunity)}`);
        if (!res.ok) throw new Error('Failed to fetch personal orders');
        const allOrders = await res.json();
        const myOrders = allOrders.filter(o => o.residentId === residentId);
        
        list.innerHTML = '';
        if (myOrders.length === 0) {
            list.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">No requirements added yet. Place an order above.</p>`;
            return;
        }
        
        myOrders.forEach(order => {
            const item = document.createElement('div');
            item.className = 'demand-item';
            item.innerHTML = `
                <div class="demand-info">
                    <h4 style="color: #c084fc;">${order.cropName}</h4>
                    <p class="crop-meta">Requested: ${order.quantity} kg</p>
                </div>
            `;
            list.appendChild(item);
        });
    } catch(err) {
        console.error(err);
    }
}

async function setupCommunityDashboard() {
    const grid = document.getElementById('aggregated-demand-grid');
    if (!grid) return;

    const userCommunity = localStorage.getItem('userCommunity') || 'Sunrise Apartments';
    
    try {
        const res = await fetch(`http://localhost:8081/api/orders/community/${encodeURIComponent(userCommunity)}`);
        if (!res.ok) throw new Error('Failed to fetch community aggregation');
        const communityOrders = await res.json();
        
        // Aggregate by crop
        const aggregated = communityOrders.reduce((acc, current) => {
            acc[current.cropName] = (acc[current.cropName] || 0) + current.quantity;
            return acc;
        }, {});
        
        grid.innerHTML = '';
        const crops = Object.keys(aggregated);
        
        if (crops.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">No orders placed yet in this community network.</p>`;
            document.getElementById('total-residents-node').textContent = '0';
            return;
        }

        document.getElementById('total-residents-node').textContent = new Set(communityOrders.map(o => o.residentId)).size.toString();

        crops.forEach(crop => {
            const total = aggregated[crop];
            const card = document.createElement('div');
            card.className = 'glass-panel crop-card';
            card.style.borderColor = 'rgba(192, 132, 252, 0.3)';
            
            let icon = '📦';
            if(crop === 'Tomatoes') icon = '🍅';
            if(crop === 'Sweet Corn') icon = '🌽';
            if(crop === 'Cucumbers') icon = '🥒';
            if(crop === 'Potatoes') icon = '🥔';
            if(crop === 'Onions') icon = '🧅';
            if(crop === 'Organic Soybeans') icon = '🌱';
            if(crop === 'Apples') icon = '🍎';
            
            card.innerHTML = `
                <div class="crop-icon" style="font-size: 3.5rem;">${icon}</div>
                <div class="crop-name" style="color: #fff; font-size: 1.4rem;">${crop}</div>
                <div style="margin-top: 1rem; padding: 0.5rem; background: rgba(168, 85, 247, 0.2); border-radius: 8px; color: #e879f9; font-weight: 700; font-size: 1.2rem;">
                    Total: ${total} kg
                </div>
            `;
            grid.appendChild(card);
        });
    } catch(err) {
        console.error(err);
    }
}
