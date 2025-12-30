// --- INVENTORY CARD ---
function renderInventoryCard(item, count, location) {
    const chat = document.getElementById("chat");
    const html = `
    <div class="msg bot">
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="adaptive-card">
            <div class="card-title">📦 Inventory Status</div>
            <div class="card-row"><span>Product:</span> <strong>${item}</strong></div>
            <div class="card-row"><span>Stock:</span> <strong style="color:green">In Stock (${count})</strong></div>
            <div class="card-row"><span>Location:</span> ${location}</div>
            <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
            <button class="btn-primary" onclick="triggerDiscountAsk()">
                Start Quote for Customer
            </button>
        </div>
    </div>`;
    chat.insertAdjacentHTML('beforeend', html);
    chat.scrollTop = chat.scrollHeight;
}

// --- DISCOUNT SELECTOR ---
function renderDiscountSelector() {
    const chat = document.getElementById("chat");
    const id = "disc-" + Date.now();
    const html = `
    <div class="msg bot" id="${id}">
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="adaptive-card" style="width:300px;">
            <div class="card-title">💲 Select Pricing Route</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <button style="text-align:left; padding:10px; border:1px solid #ddd; background:white; border-radius:4px; cursor:pointer;" onclick="handleDiscountSelection('${id}', 0)">
                    <strong>Standard Price</strong> <span style="color:#666; font-size:11px;">(0% Discount)</span>
                </button>
                <button style="text-align:left; padding:10px; border:1px solid #ddd; background:white; border-radius:4px; cursor:pointer;" onclick="handleDiscountSelection('${id}', 5)">
                    <strong>Preferred Partner</strong> <span style="color:green; font-size:11px;">(5% - Auto Approved)</span>
                </button>
                <button style="text-align:left; padding:10px; border:1px solid #ddd; background:white; border-radius:4px; cursor:pointer;" onclick="handleDiscountSelection('${id}', 10)">
                    <strong>Aggressive Offer</strong> <span style="color:#d13438; font-size:11px;">(10% - Needs Approval)</span>
                </button>
            </div>
        </div>
    </div>`;
    chat.insertAdjacentHTML('beforeend', html);
    chat.scrollTop = chat.scrollHeight;
}

function handleDiscountSelection(elementId, discount) {
    const el = document.getElementById(elementId);
    if(el) el.remove();
    triggerProposalFlow(discount);
}

// --- APPROVAL CARD ---
function renderApprovalCard(client, discount) {
    const chat = document.getElementById("chat");
    const id = "app-" + Date.now();
    const html = `
    <div class="msg bot">
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="adaptive-card">
            <div class="card-title">⚠️ Approval Required</div>
            <div style="background:#fff4ce; color:#5c4700; padding:8px; border-radius:4px; font-size:12px; margin-bottom:10px;">
                Discount (${discount}%) exceeds policy limit of 5%.
            </div>
            <div class="card-row"><span>Approver:</span> Sarah Jones</div>
            <div id="${id}-actions">
                <button class="btn-primary" onclick="handleApprovalClick('${id}', '${client}', ${discount})">Request Approval</button>
            </div>
        </div>
    </div>`;
    chat.insertAdjacentHTML('beforeend', html);
    chat.scrollTop = chat.scrollHeight;
}

function handleApprovalClick(id, client, discount) {
    document.getElementById(id + "-actions").innerHTML = `<button class="btn-primary" disabled style="background:#ccc;">Request Sent...</button>`;
    
    setTimeout(() => {
        showToast("Sarah Jones", "Looks good. Approved! ✅");
        const actionsDiv = document.getElementById(id + "-actions");
        if(actionsDiv) {
            actionsDiv.innerHTML = `
                <div style="color:green; font-size:12px; margin-bottom:5px; font-weight:bold;"><i class="fa-solid fa-check"></i> Approved by Sarah</div>
                <button class="btn-primary" onclick="openWordModal('${client}', ${discount})">Open in Word</button>
            `;
        }
        if(typeof addMessage === "function") {
            addMessage("Sarah approved it. I've prepared the file.", "bot");
        }
    }, 2500);
}

// --- DOCUMENT READY CARD ---
function renderOpenWordCard(client, discount) {
    const chat = document.getElementById("chat");
    const html = `
    <div class="msg bot">
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="adaptive-card">
            <div class="card-title">📄 Document Ready</div>
            <div style="font-size:13px; color:#666;">Sales_Proposal_v1.docx</div>
            <button class="btn-primary" onclick="openWordModal('${client}', ${discount})">Launch Word</button>
        </div>
    </div>`;
    chat.insertAdjacentHTML('beforeend', html);
    chat.scrollTop = chat.scrollHeight;
}

// --- MODAL LOGIC ---

function openWordModal(client, discount) {
    const modal = document.getElementById("appModal");
    const canvas = document.getElementById("appCanvas");
    const modalHeader = document.getElementById("modalHeader");
    const appTitle = document.getElementById("appTitle");
    const modalIcon = document.getElementById("modalIcon");
    const sideStream = document.getElementById("copilotSideStream");
    const sideSuggestions = document.getElementById("sideSuggestions");

    modal.classList.remove("hidden");
    modalHeader.className = "modal-header word";
    modalIcon.className = "fa-solid fa-file-word";
    appTitle.textContent = "Sales_Proposal.docx";

    canvas.innerHTML = `
        <div class="page-sheet">
            <h1 style="color:#2b579a; margin-top:0;">Sales Proposal</h1>
            <p><strong>Prepared for:</strong> ${client}</p>
            <hr style="border:0; border-top:1px solid #ddd; margin:20px 0;">
            <h3 style="color:#444;">Executive Summary</h3>
            <p id="doc-summary" style="line-height:1.6;">We are pleased to offer the X500 solution.</p>
            <h3 style="color:#444;">Pricing</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                <tr style="background:#f0f0f0; text-align:left;"><th style="padding:8px;">Item</th><th style="padding:8px;">Price</th></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;">X500 Units (x10)</td><td style="padding:8px; border-bottom:1px solid #eee;">$10,000</td></tr>
                <tr style="color:${discount > 0 ? 'green' : 'black'}; font-weight:bold;">
                    <td style="padding:8px;">Discount</td>
                    <td style="padding:8px;">${discount > 0 ? '-' + discount + '%' : '0%'}</td>
                </tr>
            </table>
        </div>
    `;

    sideStream.innerHTML = `<div style="background:#f0f0f0; padding:10px; border-radius:6px;"><strong>Copilot:</strong> Draft created with ${discount}% discount.</div>`;

    // FORCE BUTTONS (BLUE STYLE)
    if(sideSuggestions) {
        sideSuggestions.innerHTML = `
            <button onclick="rewriteDocument()">✨ Rewrite "Executive Summary"</button>
            <button onclick="switchToOutlook()" style="background:#0078d4; color:white;">📧 Draft Email to Client</button>
        `;
    }
}

function rewriteDocument() {
    const sideStream = document.getElementById("copilotSideStream");
    const sideSuggestions = document.getElementById("sideSuggestions");

    sideStream.insertAdjacentHTML('beforeend', `<div style="background:#e8ebfa; padding:10px; border-radius:6px; align-self:flex-end; margin-top:10px;">Rewrite summary.</div>`);
    sideSuggestions.innerHTML = `<button disabled style="color:#999; cursor:wait;">Rewriting...</button>`;

    setTimeout(() => {
        const summary = document.getElementById("doc-summary");
        if(summary) {
            summary.style.backgroundColor = "#fff4ce"; 
            summary.innerHTML = "<strong>Update:</strong> The X500 is a catalyst for growth with 40% efficiency gains.";
        }
        sideStream.insertAdjacentHTML('beforeend', `<div style="background:#f0f0f0; padding:10px; border-radius:6px; margin-top:10px;"><strong>Copilot:</strong> Done.</div>`);
        
        // Re-render Draft Email button with BLUE STYLE
        sideSuggestions.innerHTML = `
            <button onclick="switchToOutlook()" style="background:#0078d4; color:white;">📧 Draft Email to Client</button>
        `;
    }, 1000);
}

function switchToOutlook() {
    const modalHeader = document.getElementById("modalHeader");
    const modalIcon = document.getElementById("modalIcon");
    const appTitle = document.getElementById("appTitle");
    const canvas = document.getElementById("appCanvas");
    const sideStream = document.getElementById("copilotSideStream");
    const sideSuggestions = document.getElementById("sideSuggestions");

    modalHeader.className = "modal-header outlook";
    modalIcon.className = "fa-solid fa-envelope";
    appTitle.textContent = "New Message";
    
    canvas.innerHTML = `
        <div class="page-sheet" style="min-height:400px; padding:30px;">
            <div style="border-bottom:1px solid #ddd; padding-bottom:10px; margin-bottom:15px;">
                <div><strong>To:</strong> john.doe@client.com</div>
                <div><strong>Subject:</strong> Proposal Attached</div>
            </div>
            <p>Hi John,</p>
            <p>Please find the proposal attached.</p>
            <br>
            <div style="background:#f3f2f1; padding:8px 12px; border-radius:4px; display:inline-flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-file-word" style="color:#2b579a;"></i> Sales_Proposal.docx
            </div>
            <br><br>
            <button onclick="sendEmailAndFinish()" style="background:#0078d4; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">Send Email</button>
        </div>
    `;

    sideStream.innerHTML = "";
    sideStream.insertAdjacentHTML('beforeend', `<div style="background:#f0f0f0; padding:10px; border-radius:6px;"><strong>Copilot:</strong> I've prepared the draft email.</div>`);
    sideSuggestions.innerHTML = ""; 
}

function sendEmailAndFinish() {
    closeModal();
    showToast("System", "Email sent successfully! 🚀");
    
    if(typeof addMessage === "function") {
        setTimeout(() => {
            addMessage("✅ I've sent the email to John Doe with the proposal attached. Is there anything else?", "bot");
        }, 500);
    }
}

function closeModal() {
    document.getElementById("appModal").classList.add("hidden");
}

function showToast(title, body) {
    const toast = document.getElementById("toast");
    document.getElementById("toastTitle").innerText = title;
    document.getElementById("toastBody").innerText = body;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}