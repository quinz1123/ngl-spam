// FIREBASE INIT
const firebaseConfig = {
  apiKey: "AIzaSyD6YeP5f1AQD-abEjT5puQqT7HhysptLQs",
  authDomain: "ngl-project-9eb40.firebaseapp.com",
  projectId: "ngl-project-9eb40",
  storageBucket: "ngl-project-9eb40.appspot.com",
  messagingSenderId: "744594564980",
  appId: "1:744594564980:web:26137932ef850ed0c3ee21"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const statusPage = document.getElementById("statusPage");
const statPage = document.getElementById("statPage");

// Variables
let isSending = false;
let sentCount = 0;
let failedCount = 0;
const totalAttempts = 25;
let logs = [];
let currentLink = '';
let currentPesan = '';

// Event Listeners
window.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    kirimBtn.onclick = showConfirmationModal;
    resetBtn.onclick = resetForm;
    clearLogBtn.onclick = clearLogs;
    menuBtn.onclick = openSidebar;
    overlay.onclick = closeSidebar;
    
    // Setup lihat status button
    if (lihatStatusBtn) {
        lihatStatusBtn.onclick = openStatusPage;
    }
    
    // Pastikan sidebar dan halaman status tertutup saat startup
    closeSidebar();
    closeStatusPage();
    closeStatistikPage();
    
    // Initialize counter
    initCounter();
    
    // Load any existing history
    if (loadHistory().length > 0) {
        updateStatus("📋 Riwayat Tersedia", "Ada riwayat pengiriman sebelumnya", "fa-history");
    }
    
    // Setup sidebar button hover effects
    setupSidebarHover();
}

// Setup sidebar hover effects
function setupSidebarHover() {
    const sidebarButtons = document.querySelectorAll('.sidebar-content button');
    sidebarButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8fafc';
            this.style.color = '#667eea';
            this.style.borderLeft = '4px solid #667eea';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
            this.style.color = '';
            this.style.borderLeft = '';
        });
    });
}

// SIDEBAR FUNCTIONS
function openSidebar() {
    sidebar.classList.add("active");
    overlay.classList.add("active");
}

function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
}

// STATUS PAGE FUNCTIONS
function openStatusPage() {
    renderHistory();
    statusPage.classList.add("active");
    closeSidebar();
}

function closeStatusPage() {
    statusPage.classList.remove("active");
}

// STATISTIK PAGE FUNCTIONS
function openStatistikPage() {
    statPage.classList.add("active");
    closeSidebar();
}

function closeStatistikPage() {
    statPage.classList.remove("active");
}

// INFO FUNCTION
function showInfo() {
    alert("NGL Spam Tool v2.0\n\nFitur:\n• Kirim 25 pesan ke NGL sekaligus\n• Riwayat pengiriman\n• Statistik pengguna realtime\n• Progress tracking\n• Log aktivitas detail\n\nPastikan link NGL valid!\n\nCreator: Agas");
    closeSidebar();
}

// MAIN FUNCTIONS
function showConfirmationModal() {
    currentLink = linkInput.value.trim();
    currentPesan = pesanInput.value.trim();

    if (!currentLink) {
        alert("Link NGL harus diisi!");
        return;
    }
    
    if (!currentPesan) {
        alert("Pesan harus diisi!");
        return;
    }

    // Auto-add https:// if not present
    if (!currentLink.startsWith("https://") && !currentLink.startsWith("http://")) {
        currentLink = "https://" + currentLink;
    }

    // Validate NGL link format
    if (!currentLink.includes("ngl.link/")) {
        if (confirm("Link tidak mengandung 'ngl.link/'. Apakah Anda yakin ini link NGL yang valid?")) {
            // Continue anyway
        } else {
            return;
        }
    }

    // Display shortened versions for modal
    const displayLink = currentLink.length > 25 ? currentLink.substring(0, 22) + "..." : currentLink;
    const displayPesan = currentPesan.length > 25 ? currentPesan.substring(0, 22) + "..." : currentPesan;
    
    confirmLink.textContent = displayLink;
    confirmPesan.textContent = displayPesan;
    confirmationModal.classList.add("active");
}

function cancelSending() {
    confirmationModal.classList.remove("active");
}

function confirmSending() {
    confirmationModal.classList.remove("active");
    startSending();
}

async function startSending() {
    if (isSending) {
        alert("Sedang mengirim pesan, tunggu hingga selesai!");
        return;
    }
    
    isSending = true;
    
    // Reset counters
    sentCount = 0;
    failedCount = 0;
    logs = [];
    
    // UI Reset
    kirimBtn.disabled = true;
    kirimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENGIRIM...';
    updateProgress(0);
    updateStatus("📤 Mengirim", "Sedang mengirim 25 pesan sekaligus...", "fa-paper-plane");
    
    // Clear and setup log
    clearLogs();
    addLog("🚀 Memulai pengiriman 25 pesan...", "start");
    addLog(`📌 Target: ${currentLink}`, "info");
    addLog(`💬 Pesan: "${currentPesan}"`, "info");

    try {
        // Show progress animation
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progress > 90) {
                clearInterval(progressInterval);
                progress = 90;
            }
            updateProgress(progress);
            progressText.textContent = `${progress}% (0/25)`;
        }, 50);

        // Send ALL 25 messages at once via API
        const result = await sendBulkMessages(currentLink, currentPesan);
        
        clearInterval(progressInterval);
        
        // Update counters based on API response
        if (result.success) {
            sentCount = result.data.result.berhasil_dikirim || 0;
            failedCount = result.data.result.gagal_dikirim || 0;
            
            // Update progress to 100%
            updateProgress(100);
            progressText.textContent = `100% (25/25)`;
            
            // Show success log
            addLog(`✅ API Response: Berhasil ${sentCount}, Gagal ${failedCount}`, "success");
            
            // Show target username if available
            if (result.data.result.username_target) {
                addLog(`🎯 Target: ${result.data.result.username_target}`, "info");
            }
            
            updateStatus("✅ Selesai", `Berhasil: ${sentCount}, Gagal: ${failedCount}`, "fa-check-circle");
            addLog(`🎉 Pengiriman selesai!`, "complete");
        } else {
            failedCount = 25;
            addLog(`❌ API Error: ${result.error}`, "error");
            updateStatus("❌ Gagal", "API mengembalikan error", "fa-exclamation-circle");
        }
        
    } catch (error) {
        console.error("Error during sending:", error);
        updateStatus("⚠️ Error", "Terjadi kesalahan sistem", "fa-exclamation-triangle");
        addLog("❌ Error sistem: " + error.message, "error");
    } finally {
        // Cleanup
        kirimBtn.disabled = false;
        kirimBtn.innerHTML = '<i class="fas fa-paper-plane"></i> KIRIM PESAN';
        isSending = false;
        
        // Save to history
        saveToHistory();
        
        // Show success modal after delay
        setTimeout(showSuccessModal, 1000);
    }
}

async function sendBulkMessages(link, message) {
    try {
        // Construct API URL
        const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(link)}&message=${encodeURIComponent(message)}`;
        
        // Set timeout (30 seconds for bulk operation)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        // Send request
        const response = await fetch(apiUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        clearTimeout(timeoutId);
        
        // Check HTTP status
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Parse response
        const data = await response.json();
        
        // Check API response
        if (data && data.status === true) {
            return { 
                success: true, 
                data: data,
                message: "Berhasil mengirim 25 pesan"
            };
        } else {
            return { 
                success: false, 
                error: data?.message || "API returned false",
                data: data
            };
        }
        
    } catch (error) {
        // Handle specific errors
        let errorMsg = "Network error";
        if (error.name === 'AbortError') {
            errorMsg = "Timeout (30 detik)";
        } else if (error.message.includes('HTTP')) {
            errorMsg = error.message;
        }
        
        return { 
            success: false, 
            error: errorMsg
        };
    }
}

// UI HELPER FUNCTIONS
function updateProgress(percentage) {
    progressFill.style.width = percentage + "%";
}

function updateStatus(title, description, iconClass) {
    statusTitle.textContent = title;
    statusDesc.textContent = description;
    statusIcon.className = "fas " + iconClass;
}

function addLog(message, type = "info") {
    const time = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Remove empty state if present
    const emptyState = logContent.querySelector('.log-empty');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create log item
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${type}`;
    
    // Format waktu lebih baik
    const timeFormatted = `<small>${time}</small>`;
    
    logItem.innerHTML = `
        <div class="log-message">${message}</div>
        <div class="log-time">${timeFormatted}</div>
    `;
    
    // Add to top of log
    logContent.insertBefore(logItem, logContent.firstChild);
    
    // Store in memory (limit to 50 items)
    logs.unshift({ message, time, type });
    if (logs.length > 50) logs.pop();
    
    // Auto scroll to top
    logContent.scrollTop = 0;
}

function clearLogs() {
    logs = [];
    logContent.innerHTML = `
        <div class="log-empty">
            <i class="fas fa-clipboard-list"></i>
            <p>Log aktivitas akan muncul di sini</p>
        </div>
    `;
}

function resetForm() {
    if (isSending) {
        if (!confirm("Pengiriman sedang berjalan. Reset form?")) {
            return;
        }
    }
    
    linkInput.value = "";
    pesanInput.value = "";
    linkInput.focus();
}

function showSuccessModal() {
    successCount.textContent = sentCount;
    failCount.textContent = failedCount;
    
    // Set result message based on success rate
    if (sentCount === totalAttempts) {
        resultMessage.textContent = "🎉 Semua 25 pesan berhasil dikirim!";
    } else if (sentCount >= 20) {
        resultMessage.textContent = "✅ Sangat berhasil! Hanya sedikit gagal";
    } else if (sentCount >= 10) {
        resultMessage.textContent = "👍 Lumayan, setengah lebih berhasil";
    } else if (sentCount > 0) {
        resultMessage.textContent = "⚠️ Hanya sedikit yang berhasil";
    } else {
        resultMessage.textContent = "❌ Semua pesan gagal dikirim";
    }
    
    successModal.classList.add("active");
}

function closeSuccessModal() {
    successModal.classList.remove("active");
}

// UTILITY FUNCTIONS
function saveToHistory() {
    const history = loadHistory();
    
    const historyEntry = {
        link: currentLink,
        pesan: currentPesan.length > 50 ? currentPesan.substring(0, 47) + "..." : currentPesan,
        sukses: sentCount,
        gagal: failedCount,
        waktu: new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: new Date().getTime()
    };
    
    history.unshift(historyEntry);
    
    // Keep only last 10 entries
    if (history.length > 10) {
        history.length = 10;
    }
    
    saveHistory(history);
}

function saveHistory(data) {
    try {
        localStorage.setItem("ngl_history", JSON.stringify(data));
    } catch (e) {
        console.error("Error saving history:", e);
    }
}

function loadHistory() {
    try {
        const history = localStorage.getItem("ngl_history");
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.error("Error loading history:", e);
        return [];
    }
}

function renderHistory() {
    const history = loadHistory();
    
    // Clear current logs
    clearLogs();
    
    if (history.length === 0) {
        addLog("📋 Belum ada riwayat pengiriman", "info");
        return;
    }
    
    // Add history header
    addLog("📋 RIWAYAT PENGGUNAAN", "start");
    
    // Show latest 5 entries with better formatting
    history.slice(0, 5).forEach((entry, index) => {
        const status = entry.sukses > entry.gagal ? "✅" : "⚠️";
        const pesanShort = entry.pesan.length > 30 ? entry.pesan.substring(0, 27) + "..." : entry.pesan;
        addLog(`${status} ${entry.waktu} | ✅${entry.sukses} ❌${entry.gagal} | ${pesanShort}`, "info");
    });
    
    if (history.length > 5) {
        addLog(`📖 Dan ${history.length - 5} riwayat lainnya...`, "info");
    }
}

// VISIT COUNTER - FIXED
const VISIT_KEY = "ngl_visit_counted";
const visitRef = firebase.firestore().collection("stats").doc("visits");

async function initCounter() {
    // Only count once per device (using localStorage, not sessionStorage)
    if (!localStorage.getItem(VISIT_KEY)) {
        try {
            // First, get current count
            const doc = await visitRef.get();
            let currentCount = 0;
            
            if (doc.exists) {
                currentCount = doc.data().total || 0;
            }
            
            // Increment by 1
            await visitRef.set({
                total: currentCount + 1,
                lastUpdate: new Date().toISOString()
            }, { merge: true });
            
            // Mark as counted
            localStorage.setItem(VISIT_KEY, "true");
            console.log("Visitor counted: ", currentCount + 1);
        } catch (error) {
            console.error("Error updating counter:", error);
        }
    }

    // Real-time listener for visitor count
    visitRef.onSnapshot(doc => {
        if (doc.exists) {
            const count = doc.data().total || 0;
            const visitCountElement = document.getElementById("visitCount");
            if (visitCountElement) {
                visitCountElement.innerText = count.toLocaleString('id-ID');
            }
        }
    }, error => {
        console.error("Error listening to counter:", error);
    });
}

// EXPORT FUNCTIONS FOR HTML ONCLICK
window.cancelSending = cancelSending;
window.confirmSending = confirmSending;
window.closeSuccessModal = closeSuccessModal;
window.closeSidebar = closeSidebar;
window.openStatusPage = openStatusPage;
window.closeStatusPage = closeStatusPage;
window.openStatistikPage = openStatistikPage;
window.closeStatistikPage = closeStatistikPage;
window.showInfo = showInfo;