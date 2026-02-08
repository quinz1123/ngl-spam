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
const mainPage = document.getElementById("mainPage");

// Variables
let isSending = false;
let sentCount = 0;
let failedCount = 0;
const totalAttempts = 25;
let logs = [];
let currentLink = '';
let currentPesan = '';
let lastTouchTime = 0;
const TOUCH_DELAY = 300; // 300ms delay between touches

// Event Listeners
window.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Prevent accidental double taps
function preventDoubleTap(e) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastTouchTime;
    
    if (timeDiff < TOUCH_DELAY) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    lastTouchTime = currentTime;
    return true;
}

function initApp() {
    // Add ripple effect to all buttons
    addRippleEffectToButtons();
    
    // Setup event listeners with debouncing
    kirimBtn.addEventListener('click', debounce(showConfirmationModal, 300));
    resetBtn.addEventListener('click', debounce(resetForm, 300));
    clearLogBtn.addEventListener('click', debounce(clearLogs, 300));
    
    // Fix sidebar buttons
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', debounce(function(e) {
            if (!preventDoubleTap(e)) return;
            
            const page = this.getAttribute('data-page');
            if (page) {
                openPage(page);
            }
            closeSidebar();
        }, 300));
    });
    
    // Menu button with ripple
    menuBtn.addEventListener('click', debounce(openSidebar, 300));
    
    overlay.addEventListener('click', closeSidebar);
    
    // Setup lihat status button
    if (lihatStatusBtn) {
        lihatStatusBtn.addEventListener('click', debounce(openStatusPage, 300));
    }
    
    // Close all pages on startup
    closeAllPages();
    
    // Initialize counter
    initCounter();
    
    // Load any existing history
    if (loadHistory().length > 0) {
        updateStatus("📋 Riwayat Tersedia", "Ada riwayat pengiriman sebelumnya", "fa-history");
    }
    
    // Setup all button animations
    setupButtonAnimations();
    
    // Add input animations
    setupInputAnimations();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function addRippleEffectToButtons() {
    const buttons = document.querySelectorAll('button:not(.no-ripple)');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Prevent multiple ripples
            if (this.classList.contains('rippling')) return;
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            // Add rippling class to prevent multiple ripples
            this.classList.add('rippling');
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
                this.classList.remove('rippling');
            }, 600);
        });
    });
}

function setupButtonAnimations() {
    const buttons = document.querySelectorAll('.btn-animate');
    
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        // Touch events
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
        }, { passive: false });
        
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(1)';
        }, { passive: false });
    });
}

function setupInputAnimations() {
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
}

// PAGE MANAGEMENT
function openPage(pageId) {
    closeAllPages();
    
    switch(pageId) {
        case 'statusPage':
            openStatusPage();
            break;
        case 'statPage':
            openStatistikPage();
            break;
    }
}

function closeAllPages() {
    statusPage.classList.remove("active");
    statPage.classList.remove("active");
    mainPage.classList.add("active");
}

// SIDEBAR FUNCTIONS
function openSidebar() {
    if (!preventDoubleTap(new Event('click'))) return;
    
    sidebar.classList.add("active");
    overlay.classList.add("active");
    
    // Add animation
    sidebar.style.animation = 'slideInRight 0.3s ease-out';
}

function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    sidebar.style.animation = '';
}

// STATUS PAGE FUNCTIONS
function openStatusPage() {
    renderHistory();
    statusPage.classList.add("active");
    mainPage.classList.remove("active");
    closeSidebar();
    
    // Add animation
    statusPage.style.animation = 'slideInRight 0.3s ease-out';
}

function closeStatusPage() {
    statusPage.classList.remove("active");
    mainPage.classList.add("active");
    statusPage.style.animation = '';
}

// STATISTIK PAGE FUNCTIONS
function openStatistikPage() {
    statPage.classList.add("active");
    mainPage.classList.remove("active");
    closeSidebar();
    
    // Add animation
    statPage.style.animation = 'slideInRight 0.3s ease-out';
}

function closeStatistikPage() {
    statPage.classList.remove("active");
    mainPage.classList.add("active");
    statPage.style.animation = '';
}

// INFO FUNCTION
function showInfo() {
    const infoText = "NGL Spam Tool v2.0\n\nFitur:\n• Kirim 25 pesan ke NGL sekaligus\n• Riwayat pengiriman\n• Statistik pengguna realtime\n• Progress tracking\n• Log aktivitas detail\n\nPastikan link NGL valid!\n\nCreator: Agas";
    
    // Create custom modal for info
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content info-modal modal-small">
            <div class="modal-body">
                <div class="info-content">
                    <div class="info-icon animate-pulse">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <h4 class="info-title">Info Aplikasi</h4>
                    <div class="info-text">
                        ${infoText.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
            <div class="modal-footer-small">
                <button onclick="this.closest('.modal').remove()" class="btn-close-small btn-animate">
                    <i class="fas fa-times"></i> Tutup
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    closeSidebar();
}

// MAIN FUNCTIONS
function showConfirmationModal() {
    if (isSending) return;
    
    currentLink = linkInput.value.trim();
    currentPesan = pesanInput.value.trim();

    if (!currentLink) {
        showToast("Link NGL harus diisi!", "error");
        return;
    }
    
    if (!currentPesan) {
        showToast("Pesan harus diisi!", "error");
        return;
    }

    // Auto-add https:// if not present
    if (!currentLink.startsWith("https://") && !currentLink.startsWith("http://")) {
        currentLink = "https://" + currentLink;
    }

    // Validate NGL link format
    if (!currentLink.includes("ngl.link/")) {
        showConfirmDialog(
            "Perhatian",
            "Link tidak mengandung 'ngl.link/'. Apakah Anda yakin ini link NGL yang valid?",
            () => proceedWithConfirmation(),
            () => null
        );
        return;
    }
    
    proceedWithConfirmation();
}

function proceedWithConfirmation() {
    // Display shortened versions for modal
    const displayLink = currentLink.length > 25 ? currentLink.substring(0, 22) + "..." : currentLink;
    const displayPesan = currentPesan.length > 25 ? currentPesan.substring(0, 22) + "..." : currentPesan;
    
    confirmLink.textContent = displayLink;
    confirmPesan.textContent = displayPesan;
    confirmationModal.classList.add("active");
    document.body.classList.add('modal-open');
}

function cancelSending() {
    confirmationModal.classList.remove("active");
    document.body.classList.remove('modal-open');
}

function confirmSending() {
    confirmationModal.classList.remove("active");
    document.body.classList.remove('modal-open');
    startSending();
}

async function startSending() {
    if (isSending) {
        showToast("Sedang mengirim pesan, tunggu hingga selesai!", "warning");
        return;
    }
    
    isSending = true;
    
    // Reset counters
    sentCount = 0;
    failedCount = 0;
    logs = [];
    
    // UI Reset with animations
    kirimBtn.disabled = true;
    kirimBtn.innerHTML = '<i class="fas fa-spinner spinner"></i> MENGIRIM...';
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
            
            // Show success log with animation
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
        
        // Show success modal after delay with animation
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
    // Add bounce animation at 100%
    if (percentage === 100) {
        progressFill.style.animation = 'bounce 0.5s';
        setTimeout(() => {
            progressFill.style.animation = '';
        }, 500);
    }
}

function updateStatus(title, description, iconClass) {
    statusTitle.textContent = title;
    statusDesc.textContent = description;
    statusIcon.className = "fas " + iconClass;
    
    // Add animation
    statusTitle.style.animation = 'fadeInUp 0.3s';
    statusDesc.style.animation = 'fadeInUp 0.3s 0.1s';
    setTimeout(() => {
        statusTitle.style.animation = '';
        statusDesc.style.animation = '';
    }, 400);
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
    
    // Create log item with animation
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${type}`;
    logItem.style.opacity = '0';
    logItem.style.transform = 'translateY(10px)';
    
    // Clean message
    const cleanMessage = message
        .replace(/✔/g, '✅')
        .replace(/❌/g, '❌')
        .replace(/\|\s*$/g, '');
    
    logItem.innerHTML = `
        <div class="log-message">${cleanMessage}</div>
        <div class="log-time">${time}</div>
    `;
    
    // Add to top of log
    logContent.insertBefore(logItem, logContent.firstChild);
    
    // Animate in
    setTimeout(() => {
        logItem.style.opacity = '1';
        logItem.style.transform = 'translateY(0)';
        logItem.style.transition = 'all 0.3s ease-out';
    }, 10);
    
    // Store in memory (limit to 50 items)
    logs.unshift({ message: cleanMessage, time, type });
    if (logs.length > 50) logs.pop();
    
    // Auto scroll to top
    logContent.scrollTop = 0;
}

function clearLogs() {
    showConfirmDialog(
        "Hapus Log",
        "Yakin ingin menghapus semua log aktivitas?",
        () => {
            logs = [];
            logContent.innerHTML = `
                <div class="log-empty">
                    <i class="fas fa-clipboard-list animate-bounce"></i>
                    <p>Log aktivitas akan muncul di sini</p>
                </div>
            `;
            showToast("Log berhasil dihapus", "success");
        },
        () => null
    );
}

function resetForm() {
    if (isSending) {
        showConfirmDialog(
            "Konfirmasi Reset",
            "Pengiriman sedang berjalan. Yakin ingin reset form?",
            () => performReset(),
            () => null
        );
        return;
    }
    
    performReset();
}

function performReset() {
    linkInput.value = "";
    pesanInput.value = "";
    linkInput.focus();
    
    // Add animation
    linkInput.style.animation = 'fadeIn 0.5s';
    pesanInput.style.animation = 'fadeIn 0.5s';
    setTimeout(() => {
        linkInput.style.animation = '';
        pesanInput.style.animation = '';
    }, 500);
    
    showToast("Form berhasil direset", "success");
}

function showSuccessModal() {
    successCount.textContent = sentCount;
    failCount.textContent = failedCount;
    
    // Animate numbers
    successCount.style.animation = 'countUp 0.8s ease';
    failCount.style.animation = 'countUp 0.8s ease 0.2s';
    
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
    document.body.classList.add('modal-open');
}

function closeSuccessModal() {
    successModal.classList.remove("active");
    document.body.classList.remove('modal-open');
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
            minute: '2-digit',
            second: '2-digit'
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
    logContent.innerHTML = '';
    
    if (history.length === 0) {
        addLog("📋 Belum ada riwayat pengiriman", "info");
        return;
    }
    
    // Add history header
    addLog("📋 RIWAYAT PENGGUNAAN", "start");
    
    // Show latest 5 entries with better formatting
    history.slice(0, 5).forEach((entry, index) => {
        let pesanDisplay = entry.pesan;
        if (pesanDisplay.length > 25) {
            pesanDisplay = pesanDisplay.substring(0, 22) + "...";
        }
        
        const waktuParts = entry.waktu.split(', ');
        const tanggal = waktuParts[0];
        const jam = waktuParts[1] || "";
        
        addLog(`${tanggal} | ${jam} | ✅${entry.sukses} ❌${entry.gagal} | ${pesanDisplay}`, "info");
    });
    
    if (history.length > 5) {
        addLog(`📖 Dan ${history.length - 5} riwayat lainnya...`, "info");
    }
}

// TOAST NOTIFICATION
function showToast(message, type = "info") {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// CONFIRM DIALOG
function showConfirmDialog(title, message, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.className = 'modal active';
    dialog.innerHTML = `
        <div class="modal-content confirm-dialog modal-small">
            <div class="modal-body">
                <div class="dialog-content">
                    <div class="dialog-icon animate-pulse">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <h4 class="dialog-title">${title}</h4>
                    <p class="dialog-message">${message}</p>
                </div>
            </div>
            <div class="modal-footer-small">
                <button class="btn-cancel-small btn-animate dialog-cancel">
                    <i class="fas fa-times"></i> Batal
                </button>
                <button class="btn-confirm-small btn-animate dialog-confirm">
                    <i class="fas fa-check"></i> Ya
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    document.body.classList.add('modal-open');
    
    // Add event listeners
    dialog.querySelector('.dialog-cancel').addEventListener('click', () => {
        dialog.remove();
        document.body.classList.remove('modal-open');
        if (onCancel) onCancel();
    });
    
    dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
        dialog.remove();
        document.body.classList.remove('modal-open');
        if (onConfirm) onConfirm();
    });
}

// VISIT COUNTER - FIXED
const VISIT_KEY = "ngl_visit_today";
const visitRef = firebase.firestore().collection("stats").doc("visits");

async function initCounter() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `${VISIT_KEY}_${today}`;
    
    // Only count once per day per device
    if (!localStorage.getItem(todayKey)) {
        try {
            // Use transaction to prevent race conditions
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(visitRef);
                
                let currentCount = 0;
                if (doc.exists) {
                    currentCount = doc.data().total || 0;
                }
                
                // Update the count
                transaction.set(visitRef, {
                    total: currentCount + 1,
                    lastUpdate: new Date().toISOString(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            
            // Mark as counted for today
            localStorage.setItem(todayKey, "true");
            
        } catch (error) {
            console.error("Error updating counter:", error);
        }
    }

    // Real-time listener for visitor count
    visitRef.onSnapshot(
        (doc) => {
            if (doc.exists) {
                const count = doc.data().total || 0;
                const visitCountElement = document.getElementById("visitCount");
                if (visitCountElement) {
                    // Animate count change
                    const oldCount = parseInt(visitCountElement.innerText.replace(/,/g, '')) || 0;
                    if (count !== oldCount) {
                        visitCountElement.innerText = count.toLocaleString('id-ID');
                        visitCountElement.style.animation = 'bounce 0.5s';
                        setTimeout(() => {
                            visitCountElement.style.animation = '';
                        }, 500);
                    }
                }
            }
        },
        (error) => {
            console.error("Error listening to counter:", error);
            document.getElementById("visitCount").innerText = "0";
        }
    );
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
window.closeAllPages = closeAllPages;

// Add CSS for new components
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        transform: translateX(150%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 9999;
        max-width: 300px;
    }
    
    .toast.show {
        transform: translateX(0);
    }
    
    .toast-success {
        border-left: 4px solid #10b981;
    }
    
    .toast-error {
        border-left: 4px solid #dc2626;
    }
    
    .toast-warning {
        border-left: 4px solid #f59e0b;
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .toast-content i {
        font-size: 1.2rem;
    }
    
    .toast-success .toast-content i {
        color: #10b981;
    }
    
    .toast-error .toast-content i {
        color: #dc2626;
    }
    
    .toast-warning .toast-content i {
        color: #f59e0b;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .info-modal .info-icon {
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 2rem;
        color: white;
    }
    
    .info-title {
        color: #2d3748;
        font-size: 1.5rem;
        margin-bottom: 15px;
        text-align: center;
        font-weight: 600;
    }
    
    .info-text {
        color: #4a5568;
        line-height: 1.6;
        text-align: center;
    }
    
    .confirm-dialog .dialog-icon {
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 2rem;
        color: white;
    }
    
    .dialog-title {
        color: #2d3748;
        font-size: 1.5rem;
        margin-bottom: 10px;
        text-align: center;
        font-weight: 600;
    }
    
    .dialog-message {
        color: #4a5568;
        text-align: center;
        line-height: 1.5;
    }
    
    .form-group.focused label {
        color: #667eea;
        transform: translateY(-2px);
        transition: all 0.3s;
    }
`;

document.head.appendChild(style);