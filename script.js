// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyD6YeP5f1AQD-abEjT5puQqT7HhysptLQs",
  authDomain: "ngl-project-9eb40.firebaseapp.com",
  projectId: "ngl-project-9eb40",
  storageBucket: "ngl-project-9eb40.firebasestorage.app",
  messagingSenderId: "744594564980",
  appId: "1:744594564980:web:26137932ef850ed0c3ee21"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= DOM =================
const linkInput = document.getElementById('link');
const pesanInput = document.getElementById('pesan');
const kirimBtn = document.getElementById('kirim');
const resetBtn = document.getElementById('reset');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const logContent = document.getElementById('log-content');
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

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const statusPage = document.getElementById("statusPage");
const statPage = document.getElementById("statPage");
const visitCount = document.getElementById("visitCount");

// ================= STATE =================
let isSending = false;
let sentCount = 0;
let failedCount = 0;
const totalAttempts = 25;
let logs = [];
let currentLink = '';
let currentPesan = '';

// ================= SIDEBAR =================
menuBtn.onclick = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
};

overlay.onclick = closeSidebar;

function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
}

function openStatus() {
    renderHistory();
    statusPage.classList.add("active");
    closeSidebar();
}

function closeStatus() {
    statusPage.classList.remove("active");
}

function openStatistik() {
    statPage.classList.add("active");
    closeSidebar();
}

function closeStatistik() {
    statPage.classList.remove("active");
}

// ================= MODAL =================
kirimBtn.onclick = showConfirmationModal;
resetBtn.onclick = resetForm;

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

function closeSuccessModal() {
    successModal.classList.remove("active");
}

// ================= SEND =================
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

    const history = loadHistory();

    history.unshift({
        link: currentLink,
        pesan: currentPesan,
        sukses: sentCount,
        gagal: failedCount,
        waktu: new Date().toLocaleString()
    });

    saveHistory(history.slice(0,10));
    setTimeout(showSuccessModal, 400);
}

// ================= UI =================
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

// ================= HISTORY =================
function saveHistory(data) {
    localStorage.setItem("ngl_history", JSON.stringify(data));
}

function loadHistory() {
    const h = localStorage.getItem("ngl_history");
    return h ? JSON.parse(h) : [];
}

function renderHistory() {
    const history = loadHistory();
    if (!history.length) return;

    history.forEach(h => {
        addLog(`📌 ${h.waktu} | ✅ ${h.sukses} | ❌ ${h.gagal}`);
    });
}

// ================= FIREBASE VISITOR (ANTI REFRESH) =================
const VISIT_KEY = "ngl_unique_device";
const visitRef = db.collection("stats").doc("visitors");

async function firebaseCounter() {

    if (!localStorage.getItem(VISIT_KEY)) {
        await visitRef.set({
            total: firebase.firestore.FieldValue.increment(1)
        }, { merge:true });

        localStorage.setItem(VISIT_KEY,"1");
    }

    visitRef.onSnapshot(doc=>{
        if(doc.exists){
            visitCount.textContent = doc.data().total || 0;
        }
    });
}

window.addEventListener("load", firebaseCounter);

// ================= INFO =================
function showInfo(){
    alert("NGL Spam Tool\nRealtime Statistik\nBy You 😅");
}