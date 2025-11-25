function attemptLogin() {
    const inputField = document.getElementById('ao-code-input');
    const errorMsg = document.getElementById('error-msg');
    const inputVal = inputField.value.trim();

    errorMsg.style.display = 'none';
    
    if (!inputVal) {
        errorMsg.innerText = "Please enter an AO Code.";
        errorMsg.style.display = 'block';
        return;
    }

    if (typeof AUTHORIZED_DB === 'undefined') {
        errorMsg.innerText = "System Error: Database missing.";
        errorMsg.style.display = 'block';
        return;
    }

    const encryptedAttempt = encryptAOCode(inputVal);
    const user = AUTHORIZED_DB.find(u => u.hash === encryptedAttempt);

    if (user) {
        user.displayId = inputVal; 
        // Default to NCR if type is missing for backward compatibility
        if (!user.type) user.type = 'NCR'; 
        
        sessionStorage.setItem('pknpl_user', JSON.stringify(user));

        // --- NEW LOGIC: Intelligent Routing ---
        if (user.type === 'ALC') {
            // ALC skips dashboard (selection) and goes straight to their specific menu
            window.location.href = "menu.html?role=alc";
        } else {
            // NCR/AOs go to standard dashboard to select CC or LF
            window.location.href = "dashboard.html";
        }
        // --------------------------------------

    } else {
        errorMsg.innerText = "Invalid AO Code.";
        errorMsg.style.display = 'block';
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = "index.html";
}

function checkSession() {
    injectHelpModal();

    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) return;

    const userStr = sessionStorage.getItem('pknpl_user');
    if (!userStr) {
        window.location.href = "index.html";
        return null;
    }

    const user = JSON.parse(userStr);
    const idEl = document.getElementById('header-user-id');
    if(idEl && user.displayId) idEl.innerText = user.displayId;
    
    return user;
}

function encryptAOCode(inputCode) {
    let num = parseInt(inputCode);
    if (isNaN(num)) return null;
    let val = (num * 54321) + 98765;
    return val.toString(36).toUpperCase();
}

function injectHelpModal() {
    if(document.getElementById('help-modal')) return;

    const modalHTML = `
    <div id="help-modal" class="modal-overlay">
        <div class="modal-card">
            <h2 style="color:#1e40af; margin-bottom:10px;">Need Support?</h2>
            <p style="color:#64748b; margin-bottom:20px;">If you are facing issues with the OnCeT Quiz, contact us directly.</p>
            
            <div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-bottom:15px;">
                <div style="font-size:0.8rem; color:#64748b; text-transform:uppercase;">Support Hotline</div>
                <div style="font-size:1.2rem; font-weight:bold; color:#334155;">+91 8384858685</div>
            </div>

            <a href="https://wa.me/918384858685?text=pknpl%20oncet%20quiz%20help%20:-" target="_blank" class="whatsapp-btn">
                <span>Chat on WhatsApp</span>
            </a>
            
            <button onclick="closeHelp()" style="margin-top:20px; background:transparent; border:none; color:#94a3b8; font-weight:bold; cursor:pointer; font-size:0.9rem;">Close</button>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openHelp() { document.getElementById('help-modal').classList.add('show'); }
function closeHelp() { document.getElementById('help-modal').classList.remove('show'); }

// Initialize check on load
if (typeof window !== 'undefined') {
    // Prevent check on login page
    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        checkSession();
    }
}