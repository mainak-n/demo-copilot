import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
const API_KEY = "AIzaSyDiFAdpUCz3agJBTHHf9QFAUTH4F3guAzU"; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- STATE & DOM ---
const input = document.getElementById("msgInput");
const chat = document.getElementById("chat");
const sendBtn = document.getElementById("sendBtn");

let isFirstMessage = true;
let isLoopFinished = false;

// Default Data
let clientData = {
    name: "John Doe",
    email: "john.doe@client.com",
    description: "Standard order details.",
    quantity: 10,
    discount: 0
};

// --- EVENT LISTENERS ---
input.addEventListener("keyup", (e) => { if (e.key === "Enter") handleUserMessage(); });
sendBtn.addEventListener("click", handleUserMessage);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);

// --- EXPOSE FUNCTIONS ---
window.useSuggestion = (text) => { input.value = text; handleUserMessage(); };
window.startProposalFlow = () => { triggerDiscountAsk(); }; 
window.handleDiscountSelection = (id, discount) => { 
    handleDiscountSelectionUI(id, discount); 
    triggerProposalReview(discount); 
};
window.handleApprovalClick = handleApprovalClick;
window.openWordModal = openWordModal;
window.rewriteDocumentWithAI = rewriteDocumentWithAI;
window.switchToOutlook = switchToOutlook;
window.sendEmailAndFinish = sendEmailAndFinish;

// --- MAIN CHAT LOGIC ---
async function handleUserMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = ""; 

    // 1. RESTART LOOP IF FINISHED
    if (isLoopFinished || isFirstMessage) {
        resetLoop();
        setTimeout(() => renderWelcomeMessage(), 600);
        return; 
    }

    const lower = text.toLowerCase();

    if (lower.includes("stock") || lower.includes("inventory")) {
        triggerInventoryFlow();
    } 
    else if (lower.includes("draft") || lower.includes("proposal") || lower.includes("quote")) {
        startProposalFlow();
    } 
    else {
        await generateGeminiResponse(text);
    }
}

function resetLoop() {
    isLoopFinished = false;
    isFirstMessage = false; 
    clientData = { name: "John Doe", email: "john.doe@client.com", description: "Standard order details.", quantity: 10, discount: 0 };
}

async function generateGeminiResponse(userPrompt) {
    const thoughtId = showThinkingSpinner();
    try {
        const result = await model.generateContent(`You are a Sales Assistant. Keep answers under 40 words. User: ${userPrompt}`);
        const response = result.response.text();
        removeThinkingSpinner(thoughtId);
        addMessage(response, "bot");
    } catch (error) {
        removeThinkingSpinner(thoughtId);
        addMessage("⚠️ AI Error: " + error.message, "bot");
    }
}

// --- FLOWS ---
function renderWelcomeMessage() {
    const div = document.createElement("div");
    div.className = "msg bot";
    div.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="msg-content">
            Hi! I'm Sales Copilot.<br><br>
            <div class="suggestion-chips">
                <button onclick="useSuggestion('Check stock for X500')">📦 Check stock</button>
                <button onclick="useSuggestion('Draft proposal')">📄 Draft Proposal</button>
            </div>
        </div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function triggerInventoryFlow() {
    simulateThinking(() => {
        // Random Stock 1000 - 10000
        const stockCount = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        
        const html = `
        <div class="msg bot">
            <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
            <div class="adaptive-card">
                <div class="card-title">📦 Inventory Status</div>
                <div class="card-row"><span>Product:</span> <strong>X500 Unit</strong></div>
                <div class="card-row"><span>Stock:</span> <strong style="color:green">${stockCount.toLocaleString()} Available</strong></div>
                <div class="card-row"><span>Location:</span> Warehouse A</div>
                <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                <button class="btn-primary" onclick="startProposalFlow()">Start Quote</button>
            </div>
        </div>`;
        chat.insertAdjacentHTML('beforeend', html);
        chat.scrollTop = chat.scrollHeight;
    });
}

function triggerDiscountAsk() {
    addMessage("Sure. Please confirm the details below.", "bot");
    setTimeout(() => {
        const id = "disc-" + Date.now();
        const html = `
        <div class="msg bot" id="${id}">
            <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
            <div class="adaptive-card" style="width:320px;">
                <div class="card-title">📝 Proposal Details</div>
                
                <label class="card-label">Client Name</label>
                <input type="text" id="${id}-name" class="card-input" value="John Doe">
                
                <label class="card-label">Quantity</label>
                <input type="number" id="${id}-qty" class="card-input" value="10">

                <label class="card-label">Description (Optional)</label>
                <textarea id="${id}-desc" class="card-textarea" placeholder="Add specific requirements..."></textarea>

                <div class="card-title" style="margin-top:10px;">💲 Select Pricing</div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button style="text-align:left; padding:10px; border:1px solid #ddd; background:white;" onclick="handleDiscountSelection('${id}', 0)"><strong>Standard</strong> (0%)</button>
                    <button style="text-align:left; padding:10px; border:1px solid #ddd; background:white;" onclick="handleDiscountSelection('${id}', 10)"><strong>Partner</strong> (10%)</button>
                    <button style="text-align:left; padding:10px; border:1px solid #ddd; background:white;" onclick="handleDiscountSelection('${id}', 20)"><strong>Aggressive</strong> (20%) (Approval)</button>
                </div>
            </div>
        </div>`;
        chat.insertAdjacentHTML('beforeend', html);
        chat.scrollTop = chat.scrollHeight;
    }, 500);
}

function handleDiscountSelectionUI(id, discount) {
    // CAPTURE INPUTS
    const nameInput = document.getElementById(id + "-name");
    const qtyInput = document.getElementById(id + "-qty");
    const descInput = document.getElementById(id + "-desc");
    
    if (nameInput && nameInput.value.trim() !== "") {
        clientData.name = nameInput.value.trim();
        clientData.email = clientData.name.toLowerCase().replace(/\s+/g, '.') + "@client.com";
    }
    if (qtyInput && qtyInput.value.trim() !== "") {
        clientData.quantity = parseInt(qtyInput.value);
    }
    if (descInput && descInput.value.trim() !== "") {
        clientData.description = descInput.value.trim();
    }

    // UPDATE CARD TO READ-ONLY
    const container = document.getElementById(id);
    if (!container) return;

    let label = discount === 0 ? "Standard (0%)" : discount === 10 ? "Partner (10%)" : "Aggressive (20%)";

    container.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="adaptive-card" style="width:320px; background:#f9f9f9; border-color:#ddd;">
            <div class="card-title" style="color:#666; font-size:13px; margin-bottom:5px;">✅ Details Confirmed</div>
            <div class="card-row"><span>Client:</span> <strong>${clientData.name}</strong></div>
            <div class="card-row"><span>Quantity:</span> <strong>${clientData.quantity} Units</strong></div>
            <div class="card-row"><span>Discount:</span> <strong>${label}</strong></div>
        </div>`;
}

function triggerProposalReview(discount) {
    clientData.discount = discount;
    simulateThinking(() => {
        // Logic: Approval needed > 10%
        if (discount > 10) {
            const id = "app-" + Date.now();
            const html = `
            <div class="msg bot">
                <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
                <div class="adaptive-card">
                    <div class="card-title">⚠️ Approval Required</div>
                    <div style="background:#fff4ce; color:#5c4700; padding:8px; border-radius:4px; font-size:12px; margin-bottom:10px;">Discount (${discount}%) exceeds policy.</div>
                    <div id="${id}-actions"><button class="btn-primary" onclick="handleApprovalClick('${id}')">Request Approval</button></div>
                </div>
            </div>`;
            chat.insertAdjacentHTML('beforeend', html);
        } else {
            renderReadyCard();
        }
        chat.scrollTop = chat.scrollHeight;
    });
}

function handleApprovalClick(id) {
    document.getElementById(id + "-actions").innerHTML = `<button class="btn-primary" disabled style="background:#ccc;">Request Sent...</button>`;
    
    setTimeout(() => {
        showToast("Sarah Jones", "Approved! ✅");
        
        document.getElementById(id + "-actions").innerHTML = `<div style="color:green; font-size:12px; margin-bottom:5px;"><strong>Approved</strong></div><button class="btn-primary" onclick="openWordModal()">Open in Word</button>`;

        // UPDATE SIDEBAR SARAH
        const sarahItem = document.getElementById("sarahChatItem");
        const sarahPreview = document.getElementById("sarahPreview");
        const sarahTime = document.getElementById("sarahTime");

        if (sarahItem && sarahPreview) {
            sarahPreview.innerHTML = `<strong>✅ Approved:</strong> ${clientData.name}`;
            sarahPreview.style.color = "#107c10";
            sarahTime.innerText = "Now";
            sarahItem.classList.add("chat-item-new");
            // Move to top of recent
            const parent = sarahItem.parentNode;
            // Insert after "Recent" (index 3)
            parent.insertBefore(sarahItem, parent.children[4]);
        }

    }, 2000);
}

function renderReadyCard() {
    const html = `
    <div class="msg bot">
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="adaptive-card">
            <div class="card-title">📄 Document Ready</div>
            <button class="btn-primary" onclick="openWordModal()">Launch Word</button>
        </div>
    </div>`;
    chat.insertAdjacentHTML('beforeend', html);
    chat.scrollTop = chat.scrollHeight;
}

// --- MODAL LOGIC ---
function openWordModal() {
    document.getElementById("appModal").classList.remove("hidden");
    document.getElementById("modalHeader").className = "modal-header word";
    document.getElementById("modalIcon").className = "fa-solid fa-file-word";
    document.getElementById("appTitle").textContent = `${clientData.name.replace(/\s/g, '_')}_Proposal.docx`;
    
    // CALCULATIONS
    const unitPrice = 1000;
    const subTotal = unitPrice * clientData.quantity;
    const discountAmt = subTotal * (clientData.discount / 100);
    const finalPrice = subTotal - discountAmt;
    const fmt = (num) => "$" + num.toLocaleString();

    document.getElementById("appCanvas").innerHTML = `
        <div class="page-sheet" contenteditable="true" style="outline:none;">
            <h1 style="color:#2b579a;">Sales Proposal</h1>
            <p><strong>Prepared for:</strong> ${clientData.name}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <hr>
            <h3 style="color:#444;">1. Executive Summary</h3>
            <p id="doc-summary" style="line-height:1.6;">${clientData.description} We are pleased to offer the X500 solution to improve your efficiency.</p>
            <br>
            <h3 style="color:#444;">2. Pricing</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                <tr style="background:#f0f0f0; text-align:left;"><th style="padding:8px;">Item</th><th style="padding:8px;">Qty</th><th style="padding:8px;">Unit Price</th><th style="padding:8px;">Total</th></tr>
                <tr>
                    <td style="padding:8px; border-bottom:1px solid #eee;">X500 Unit</td>
                    <td style="padding:8px; border-bottom:1px solid #eee;">${clientData.quantity}</td>
                    <td style="padding:8px; border-bottom:1px solid #eee;">$1,000</td>
                    <td style="padding:8px; border-bottom:1px solid #eee;">${fmt(subTotal)}</td>
                </tr>
                <tr style="color:${clientData.discount > 0 ? 'green' : 'black'};">
                    <td colspan="3" style="padding:8px; text-align:right;"><strong>Discount (${clientData.discount}%)</strong></td>
                    <td style="padding:8px;">-${fmt(discountAmt)}</td>
                </tr>
                <tr style="font-size:16px;">
                    <td colspan="3" style="padding:8px; text-align:right;"><strong>Grand Total</strong></td>
                    <td style="padding:8px;"><strong>${fmt(finalPrice)}</strong></td>
                </tr>
            </table>
            <br>
            <p style="color:#888;">[End of Document]</p>
        </div>`;

    document.getElementById("copilotSideStream").innerHTML = `<div style="background:#f0f0f0; padding:10px; border-radius:6px;"><strong>Copilot:</strong> Draft created for ${clientData.name}.</div>`;
    renderSideButtons();
}

function renderSideButtons() {
    document.getElementById("sideSuggestions").innerHTML = `
        <button style="display:block !important;" onclick="rewriteDocumentWithAI()">✨ Rewrite Summary (AI)</button>
        <button style="display:block !important; background:#0078d4; color:white;" onclick="switchToOutlook()">📧 Draft Email to Client</button>
    `;
}

async function rewriteDocumentWithAI() {
    const stream = document.getElementById("copilotSideStream");
    const suggestions = document.getElementById("sideSuggestions");
    
    stream.innerHTML += `<div style="background:#e8ebfa; padding:10px; border-radius:6px; margin-top:10px; align-self:flex-end;">Rewrite summary...</div>`;
    suggestions.innerHTML = `<button disabled style="color:#999;">Rewriting...</button>`;

    try {
        const result = await model.generateContent(`Rewrite this sales summary to be persuasive for client '${clientData.name}': '${clientData.description}'`);
        const newText = result.response.text();
        
        document.getElementById("doc-summary").innerHTML = "<strong>AI Update:</strong> " + newText;
        document.getElementById("doc-summary").style.backgroundColor = "#fff4ce";
        stream.innerHTML += `<div style="background:#f0f0f0; padding:10px; border-radius:6px; margin-top:10px;"><strong>Copilot:</strong> Done.</div>`;
    } catch(e) {
        stream.innerHTML += `<div style="color:red;">AI Error</div>`;
    } finally {
        renderSideButtons();
    }
}

function switchToOutlook() {
    document.getElementById("modalHeader").className = "modal-header outlook";
    document.getElementById("modalIcon").className = "fa-solid fa-envelope";
    document.getElementById("appTitle").textContent = "New Message";
    
    document.getElementById("appCanvas").innerHTML = `
        <div class="outlook-compose" contenteditable="true" style="outline:none;">
            <div class="outlook-header" contenteditable="false">
                <div class="outlook-field"><div class="outlook-label">To</div><input class="outlook-input" value="${clientData.email}"></div>
                <div class="outlook-field"><div class="outlook-label">Cc</div><input class="outlook-input" placeholder="Add recipients"></div>
                <div class="outlook-field"><div class="outlook-label">Subject</div><input class="outlook-input" value="Proposal Attached: ${clientData.name}"></div>
            </div>
            
            <div class="outlook-toolbar" contenteditable="false">
                <span>File</span> <span>Insert</span> <span>Options</span> &nbsp;|&nbsp; 
                <i class="fa-solid fa-bold"></i> <i class="fa-solid fa-italic"></i> <i class="fa-solid fa-underline"></i>
            </div>

            <div class="outlook-body">
                <p>Hi,</p>
                <p>Please find the attached proposal for <strong>${clientData.name}</strong>.</p>
                <p>Order Quantity: ${clientData.quantity} Units.</p>
                <br>
                <div class="outlook-attachment" contenteditable="false">
                    <i class="fa-solid fa-file-word" style="color:#2b579a;"></i> 
                    <span>Proposal_${clientData.name.replace(/\s/g, '_')}.docx</span>
                </div>
                <br>
                <p>Best regards,<br>Sales Copilot</p>
            </div>
        </div>`;
    
    document.getElementById("copilotSideStream").innerHTML += `<div style="background:#f0f0f0; padding:10px; border-radius:6px; margin-top:10px;"><strong>Copilot:</strong> Email drafted for ${clientData.name}.</div>`;
    
    document.getElementById("sideSuggestions").innerHTML = `
        <button style="display:block !important; background:#0078d4; color:white; padding:15px; font-size:14px;" onclick="sendEmailAndFinish()">
            <i class="fa-solid fa-paper-plane"></i> Send Email
        </button>
    `;
}

function sendEmailAndFinish() {
    closeModal();
    showToast("System", "Email Sent! 🚀");
    setTimeout(() => addMessage("✅ Email sent. Loop complete. Type anything to restart.", "bot"), 1000);
    isLoopFinished = true;
}

function closeModal() { document.getElementById("appModal").classList.add("hidden"); }

// --- HELPERS ---
function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = `msg ${sender}`;
    div.innerHTML = sender === 'bot' ? `<div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div><div class="msg-content">${text}</div>` : `<div class="msg-content">${text}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function showThinkingSpinner() {
    const id = "thought-" + Date.now();
    const div = document.createElement("div");
    div.id = id;
    div.className = "msg bot";
    div.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div><div class="msg-content">Thinking...</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return id;
}

function removeThinkingSpinner(id) { document.getElementById(id)?.remove(); }

function simulateThinking(callback) {
    const id = showThinkingSpinner();
    setTimeout(() => { removeThinkingSpinner(id); callback(); }, 1000);
}
function showToast(title, msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toastTitle").innerText = title;
    document.getElementById("toastBody").innerText = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}
