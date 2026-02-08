// ================= FIREBASE INIT =================
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
const linkInput = document.getElementById("link");
const pesanInput = document.getElementById("pesan");
const kirimBtn = document.getElementById("kirim");
const resetBtn = document.getElementById("reset");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const logContent = document.getElementById("log-content");
const confirmationModal = document.getElementById("confirmation-modal");
const successModal = document.getElementById("success-modal");
const confirmLink = document.getElementById("confirm-link");
const confirmPesan = document.getElementById("confirm-pesan");
const successCount = document.getElementById("success-count");
const failCount = document.getElementById("fail-count");
const resultMessage = document.getElementById("result-message");
const statusTitle = document.getElementById("status-title");
const statusDesc = document.getElementById("status-desc");
const statusIcon = document.getElementById("status-icon");
const visitCount = document.getElementById("visitCount");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const statusPage = document.getElementById("statusPage");
const statPage = document.getElementById("statPage");

// ================= SIDEBAR =================
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

function openStatistik() {
  statPage.classList.add("active");
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

function closeStatistik() {
  statPage.classList.remove("active");
}

// ================= MODAL =================
function showConfirmationModal() {
  confirmLink.textContent = linkInput.value;
  confirmPesan.textContent = pesanInput.value;
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
  kirimBtn.disabled = true;
  kirimBtn.innerHTML = "MENGIRIM...";

  updateStatus("📤 Mengirim", "Mohon tunggu...", "fa-spinner fa-spin");

  try {
    const api = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(linkInput.value)}&message=${encodeURIComponent(pesanInput.value)}`;
    const res = await fetch(api);
    const data = await res.json();

    successCount.textContent = data.result.berhasil_dikirim;
    failCount.textContent = data.result.gagal_dikirim;

    updateProgress(100);
    updateStatus("✅ Selesai", "Pengiriman selesai", "fa-check-circle");

  } catch {
    failCount.textContent = 25;
  }

  kirimBtn.disabled = false;
  kirimBtn.innerHTML = "KIRIM PESAN";
  successModal.classList.add("active");
}

// ================= UI =================
function updateProgress(p) {
  progressFill.style.width = p + "%";
  progressText.textContent = p + "%";
}

function updateStatus(t, d, i) {
  statusTitle.textContent = t;
  statusDesc.textContent = d;
  statusIcon.className = "fas " + i;
}

// ================= FIREBASE VISITOR =================
const VISIT_KEY = "ngl_firebase_visit";

async function firebaseCounter() {
  const ref = db.collection("stats").doc("visits");

  if (!localStorage.getItem(VISIT_KEY)) {
    await ref.set({ total: firebase.firestore.FieldValue.increment(1) }, { merge: true });
    localStorage.setItem(VISIT_KEY, "true");
  }

  ref.onSnapshot(doc => {
    if (doc.exists) {
      visitCount.textContent = doc.data().total || 0;
    }
  });
}

window.onload = firebaseCounter;