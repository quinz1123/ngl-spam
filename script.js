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

// State
let isSending = false;
let sentCount = 0;
let failedCount = 0;
const totalAttempts = 25;
let logs = [];
let currentLink = '';
let currentPesan = '';
let abortController = null;

// Sidebar Functions
menuBtn.onclick = openSidebar;
overlay.onclick = closeSidebar;

function openSidebar() {
    sidebar.classList.add("active");
    overlay.classList.add("active");
}

function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
}

function openStatus() {
    statusPage.classList.add("active");
    closeSidebar();
}

function closeStatus() {
    statusPage.classList.remove("active");
}

function showInfo() {
    alert('✨ NGL Spam Tool ✨\n\nKirim pesan ke NGL secara otomatis\nMenggunakan API dari deline.web.id\n\n• Otomatis kirim 25 pesan\n• Tampilkan status real-time\n• Log aktivitas lengkap\n\nBy Agas');
    closeSidebar();
}

// Event Listeners
kirimBtn.onclick = showConfirmationModal;
resetBtn.onclick = resetForm;
lihatStatusBtn.onclick = openStatus;
clearLogBtn.onclick = clearLogs;

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === confirmationModal) {
        cancelSending();
    }
    if (event.target === successModal) {
        closeSuccessModal();
    }
}

// Confirmation Modal
function showConfirmationModal() {
    currentLink = linkInput.value.trim();
    currentPesan = pesanInput.value.trim();

    if (!currentLink || !currentPesan) {
        return showAlert("error", "Link NGL dan pesan harus diisi!");
    }

    // Validasi format link NGL
    if (!currentLink.includes('ngl.link/')) {
        return showAlert("error", "Format link NGL tidak valid!\nContoh: https://ngl.link/username");
    }

    // Pastikan link diawali dengan https://
    if (!currentLink.startsWith('https://')) {
        currentLink = 'https://' + currentLink;
        linkInput.value = currentLink;
    }

    // Potong teks jika terlalu panjang untuk display
    const displayLink = currentLink.length > 30 ? currentLink.substring(0, 30) + '...' : currentLink;
    const displayPesan = currentPesan.length > 50 ? currentPesan.substring(0, 50) + '...' : currentPesan;

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

// Custom Alert Function
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert ${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Main Send Function - HANYA PAKAI API DELINE
async function startSending() {
    if (isSending) return;

    // Reset state
    isSending = true;
    sentCount = 0;
    failedCount = 0;
    abortController = new AbortController();
    
    // Update UI
    kirimBtn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> MENGIRIM...";
    kirimBtn.disabled = true;
    
    // Buka status page
    openStatus();
    
    // Reset status
    updateStatus("⚡ Mengirim...", "Memulai pengiriman 25 pesan...", "fa-bolt fa-spin");
    updateProgress(0);
    logs = [];
    updateLogDisplay();
    
    addLog("🚀 Memulai pengiriman 25 pesan", "info");
    addLog(`🎯 Target: ${currentLink}`, "info");
    addLog(`💬 Pesan: "${currentPesan}"`, "info");

    try {
        // Kirim pesan satu per satu
        for (let i = 0; i < totalAttempts; i++) {
            if (!isSending) break; // Stop jika dibatalkan
            
            try {
                await sendSingleMessage(i);
            } catch (error) {
                failedCount++;
                addLog(`Pesan ${i + 1}: ❌ Gagal`, "error");
            }
            
            // Update progress
            const done = sentCount + failedCount;
            const progress = Math.round(done / totalAttempts * 100);
            updateProgress(progress);
            
            // Update status
            updateStatus(
                "📤 Mengirim...", 
                `Progress: ${done}/${totalAttempts} | ✅ ${sentCount} | ❌ ${failedCount}`,
                "fa-paper-plane fa-bounce"
            );

            // Delay kecil antara pesan (200-400ms)
            if (i < totalAttempts - 1) {
                await delay(200 + Math.random() * 200);
            }
        }
    } catch (error) {
        addLog(`⚠️ Proses dihentikan: ${error.message}`, "error");
    } finally {
        // Selesai
        isSending = false;
        kirimBtn.innerHTML = "<i class='fas fa-paper-plane'></i> KIRIM PESAN";
        kirimBtn.disabled = false;
        
        // Update final status
        updateStatus(
            "✅ Selesai!", 
            `Pengiriman selesai! Sukses: ${sentCount}, Gagal: ${failedCount}`,
            "fa-check-circle"
        );
        
        // Tampilkan modal hasil
        setTimeout(() => {
            showSuccessModal();
        }, 500);
    }
}

// Fungsi untuk kirim single message dengan API Deline
async function sendSingleMessage(index) {
    try {
        const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(currentLink)}&message=${encodeURIComponent(currentPesan)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout 10 detik

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Origin": "https://deline.web.id",
                "Referer": "https://deline.web.id/"
            },
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            
            // Check response dari API Deline
            if (data.status === true) {
                sentCount++;
                addLog(`Pesan ${index + 1}: ✅ Sukses`, "success");
                return { success: true };
            } else {
                throw new Error('API response not success');
            }
        } else {
            throw new Error(`HTTP ${response.status}`);
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('timeout');
        } else {
            throw error;
        }
    }
}

// Helper Functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStatus(title, desc, iconClass) {
    statusTitle.textContent = title;
    statusDesc.textContent = desc;
    statusIcon.className = "fas " + iconClass;
}

function updateProgress(percent) {
    progressFill.style.width = percent + "%";
    progressText.textContent = `${percent}% (${sentCount + failedCount}/${totalAttempts})`;
}

function addLog(message, type = "info") {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    const logEntry = {
        time: timestamp,
        message: message,
        type: type
    };
    
    logs.unshift(logEntry);
    updateLogDisplay();
}

function updateLogDisplay() {
    if (logs.length === 0) {
        logContent.innerHTML = `
            <div class="log-empty">
                <i class="fas fa-clipboard-list"></i>
                <p>Log aktivitas akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    // Batasi log maksimal 30 item
    const displayLogs = logs.slice(0, 30);
    
    logContent.innerHTML = displayLogs.map(log => `
        <div class="log-item ${log.type}">
            <div class="log-message">
                ${log.message}
            </div>
            <div class="log-time">${log.time}</div>
        </div>
    `).join('');
}

function clearLogs() {
    if (logs.length === 0) return;
    
    if (confirm("Yakin hapus semua log aktivitas?")) {
        logs = [];
        updateLogDisplay();
        addLog("🧹 Log berhasil dibersihkan", "info");
    }
}

function resetForm() {
    if (isSending) {
        if (confirm("Pengiriman sedang berjalan. Batalkan pengiriman dan reset form?")) {
            isSending = false;
            if (abortController) {
                abortController.abort();
            }
            kirimBtn.innerHTML = "<i class='fas fa-paper-plane'></i> KIRIM PESAN";
            kirimBtn.disabled = false;
            addLog("⏹️ Pengiriman dibatalkan", "info");
        } else {
            return;
        }
    }
    
    linkInput.value = "";
    pesanInput.value = "";
    
    // Reset status display
    updateStatus("⏳ Menunggu", "Belum ada pengiriman pesan", "fa-clock");
    updateProgress(0);
    
    addLog("🔄 Form berhasil direset", "info");
}

function showSuccessModal() {
    successCount.textContent = sentCount;
    failCount.textContent = failedCount;
    
    // Set pesan hasil
    if (sentCount === totalAttempts) {
        resultMessage.textContent = "🎉 Semua pesan berhasil dikirim!";
    } else if (sentCount > 0) {
        resultMessage.textContent = `👍 ${sentCount} pesan berhasil dikirim`;
    } else {
        resultMessage.textContent = "😞 Tidak ada pesan yang berhasil dikirim.";
    }
    
    successModal.classList.add("active");
}

function closeSuccessModal() {
    successModal.classList.remove("active");
}

// Initialize
updateLogDisplay();

// Add custom alert styles
const style = document.createElement('style');
style.textContent = `
    .custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        border-left: 3px solid #667eea;
    }
    
    .custom-alert.error {
        border-left-color: #ff6b6b;
    }
    
    .custom-alert i {
        font-size: 18px;
        color: #667eea;
    }
    
    .custom-alert.error i {
        color: #ff6b6b;
    }
    
    .custom-alert span {
        flex: 1;
        font-size: 13px;
        color: #333;
    }
    
    .custom-alert button {
        background: none;
        border: none;
        font-size: 18px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }
    
    .custom-alert button:hover {
        background: #f5f5f5;
        color: #666;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Auto focus ke input link saat halaman load
window.onload = function() {
    // Set placeholder text
    linkInput.placeholder = "https://ngl.link/username";
    pesanInput.placeholder = "masukkan pesan yang akan dikirimkan";
    
    // Focus ke input link
    setTimeout(() => {
        linkInput.focus();
    }, 100);
};