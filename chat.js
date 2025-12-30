const input = document.getElementById("msgInput");
const chat = document.getElementById("chat");
let isFirstMessage = true; 

input.addEventListener("keyup", e => { if (e.key === "Enter") handleUserMessage(); });

function useSuggestion(text) {
    input.value = text;
    handleUserMessage();
}

function handleUserMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = ""; 

    // FIRST MESSAGE (Welcome)
    if (isFirstMessage) {
        isFirstMessage = false;
        setTimeout(() => {
            renderWelcomeMessage();
        }, 600);
        return; 
    }

    const lower = text.toLowerCase();

    // INTENT: Inventory
    if (lower.includes("stock") || lower.includes("inventory") || lower.includes("x500")) {
        triggerInventoryFlow();
    } 
    // INTENT: Proposal (Number given -> Direct)
    else if ((lower.includes("proposal") || lower.includes("draft")) && text.match(/(\d+)%/)) {
        const match = text.match(/(\d+)%/);
        const discount = match ? parseInt(match[1]) : 0;
        triggerProposalFlow(discount);
    }
    // INTENT: Proposal (No number -> Ask Template)
    else if (lower.includes("proposal") || lower.includes("draft") || lower.includes("quote")) {
        triggerDiscountAsk(); 
    } 
    else {
        simulateAgentThinking(["Parsing intent..."], () => {
            addMessage("I can help with Sales. Try: 'Check stock for X500' or 'Draft proposal'.", "bot");
        });
    }
}

function renderWelcomeMessage() {
    const msgDiv = document.createElement("div");
    msgDiv.className = "msg bot";
    msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="msg-content">
            Hi! I'm Sales Copilot, connected to <strong>Contoso ERP</strong> and <strong>Outlook</strong>.<br><br>
            <strong>Suggested actions:</strong>
            <div class="suggestion-chips">
                <button onclick="useSuggestion('Check stock for X500 unit')">📦 Check stock for X500</button>
                <button onclick="useSuggestion('Draft sales proposal')">📄 Draft Sales Proposal</button>
            </div>
        </div>`;
    chat.appendChild(msgDiv);
    chat.scrollTop = chat.scrollHeight;
}

function triggerInventoryFlow() {
    simulateAgentThinking(
        ["Connecting to ERP...", "Querying ID: #992-X500...", "Checking Warehouse A..."], 
        () => {
            renderInventoryCard("X500 Unit", 42, "Warehouse A");
        }
    );
}

function triggerDiscountAsk() {
    addMessage("Sure, I can draft a proposal for <strong>John Doe</strong>. Which pricing route should we take?", "bot");
    setTimeout(() => {
        renderDiscountSelector(); 
    }, 500);
}

function triggerProposalFlow(discount) {
    const steps = ["Retrieving Client Context...", "Validating Pricing Model...", "Checking Approval Policies..."];
    simulateAgentThinking(steps, () => {
        if (discount > 5) {
            addMessage(`You selected a <strong>${discount}% discount</strong>. This requires manager approval.`, "bot");
            setTimeout(() => {
                renderApprovalCard("John Doe", discount);
            }, 600);
        } else {
            addMessage(`Applying standard <strong>${discount}% discount</strong>. Drafting document...`, "bot");
            setTimeout(() => {
                renderOpenWordCard("John Doe", discount);
            }, 600);
        }
    });
}

function simulateAgentThinking(thoughts, onComplete) {
    const id = "thought-" + Date.now();
    const thoughtDiv = document.createElement("div");
    thoughtDiv.className = "msg bot";
    thoughtDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>
        <div class="msg-content">
            <div class="thought-box" id="${id}">
                <div class="thought-step"><i class="fa-solid fa-circle-notch spinner" style="color:#5b5fc7"></i> Thinking...</div>
            </div>
        </div>`;
    chat.appendChild(thoughtDiv);
    chat.scrollTop = chat.scrollHeight;

    let stepIndex = 0;
    const interval = setInterval(() => {
        const container = document.getElementById(id);
        if (!container) { clearInterval(interval); return; }

        if (stepIndex < thoughts.length) {
            container.innerHTML = thoughts.map((t, i) => {
                if (i < stepIndex) return `<div class="thought-step"><i class="fa-solid fa-check" style="color:green"></i> ${t}</div>`;
                if (i === stepIndex) return `<div class="thought-step"><i class="fa-solid fa-circle-notch spinner" style="color:#5b5fc7"></i> ${t}</div>`;
                return "";
            }).join("");
            stepIndex++;
        } else {
            clearInterval(interval);
            thoughtDiv.remove();
            onComplete();
        }
    }, 800);
}

function addMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${sender}`;
    const avatar = sender === 'bot' ? `<div class="msg-avatar"><i class="fa-solid fa-sparkles"></i></div>` : '';
    msgDiv.innerHTML = `${avatar}<div class="msg-content">${text}</div>`;
    chat.appendChild(msgDiv);
    chat.scrollTop = chat.scrollHeight;
}