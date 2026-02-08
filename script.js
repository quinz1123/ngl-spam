// DOM Elements
const linkInput = document.getElementById('link');
const pesanInput = document.getElementById('pesan');
const kirimBtn = document.getElementById('kirim');
const resetBtn = document.getElementById('reset');
const lihatStatusBtn = document.getElementById('lihat-status');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const logContent = document.getElementById('log-content');
const clearLogBtn = document.getElementById('clear-log');
const confirmationModal = document.getElementById('confirmation-modal');
const successModal = document.getElementById('success-modal');
const confirmLink = document.getElementById('confirm-link');
const confirmPesan = document.getElementById('confirm-pesan');
const successCount = document.getElementById('success-count');
const failCount = document.getElementById('fail-count');
const resultMessage = document.getElementById('result-message');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const statusIcon = document.getElementById('status-icon');

let isSending = false;
let sentCount = 0;
let failedCount = 0;
const totalAttempts = 25;
let logs = [];
let currentLink = '';
let currentPesan = '';

// EVENTS
kirimBtn.onclick = showConfirmationModal;
resetBtn.onclick = resetForm;
lihatStatusBtn.onclick = () => statusPage.classList.add("active");
clearLogBtn.onclick = clearLogs;

// CONFIRM
function showConfirmationModal() {
    currentLink = linkInput.value.trim();
    currentPesan = pesanInput.value.trim();

    if (!currentLink || !currentPesan) return alert("Link & pesan wajib");

    if (!currentLink.startsWith("https://")) currentLink = "https://" + currentLink;

    confirmLink.textContent = currentLink;
    confirmPesan.textContent = currentPesan;
    confirmationModal.classList.add("active");
}

function confirmSending() {
    confirmationModal.classList.remove("active");
    startSending();
}

// MAIN SEND (SINGLE REQUEST)
async function startSending() {
    if (isSending) return;
    isSending = true;

    sentCount = 0;
    failedCount = 0;
    logs = [];

    kirimBtn.disabled = true;
    kirimBtn.innerHTML = "MENGIRIM...";

    addLog("🚀 Mengirim pesan...");
    updateStatus("📤 Mengirim", "Mohon tunggu...", "fa-spinner fa-spin");

    try {
        const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(currentLink)}&message=${encodeURIComponent(currentPesan)}`;

        const controller = new AbortController();
        setTimeout(() => controller.abort(), 30000);

        const res = await fetch(apiUrl, { signal: controller.signal });
        const data = await res.json();

        if (!data.status) throw "API ERROR";

        // PAKAI DATA ASLI API
        sentCount = data.result.berhasil_dikirim;
        failedCount = data.result.gagal_dikirim;

        updateProgress(100);
        addLog(`✅ Berhasil: ${sentCount}`);
        addLog(`❌ Gagal: ${failedCount}`);

        updateStatus("✅ Selesai", "Pengiriman selesai", "fa-check-circle");

    } catch (e) {
        failedCount = totalAttempts;
        addLog("❌ Request gagal / timeout");
    }

    kirimBtn.disabled = false;
    kirimBtn.innerHTML = "KIRIM PESAN";

    setTimeout(showSuccessModal, 400);
}

// UI HELPERS
function updateProgress(p) {
    progressFill.style.width = p + "%";
    progressText.textContent = `${p}%`;
}

function updateStatus(t, d, i) {
    statusTitle.textContent = t;
    statusDesc.textContent = d;
    statusIcon.className = "fas " + i;
}

function addLog(msg) {
    logs.unshift({ msg, time: new Date().toLocaleTimeString() });
    logContent.innerHTML = logs.map(l =>
        `<div class="log-item"><span>${l.msg}</span><small>${l.time}</small></div>`
    ).join("");
}

function clearLogs() {
    logs = [];
    logContent.innerHTML = "";
}

function resetForm() {
    linkInput.value = "";
    pesanInput.value = "";
}

function showSuccessModal() {
    successCount.textContent = sentCount;
    failCount.textContent = failedCount;
    resultMessage.textContent = "🔥 Done";
    successModal.classList.add("active");
}

function closeSuccessModal() {
    successModal.classList.remove("active");
}
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const statusPage = document.getElementById("statusPage");

menuBtn.onclick = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
};

overlay.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
};

function openStatus() {
    statusPage.classList.add("active");
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
}

function closeStatus() {
    statusPage.classList.remove("active");
}