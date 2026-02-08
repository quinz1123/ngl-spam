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
const totalAttempts = 25; // Fix 25 pesan
let logs = [];
let currentLink = '';
let currentPesan = '';

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
        closeConfirmationModal();
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
        return alert("Link NGL dan pesan harus diisi yach!");
    }

    // Validasi format link NGL
    if (!currentLink.includes('ngl.link/')) {
        return alert("Format link NGL tidak valid cuy!\nContoh: https://ngl.link/username");
    }

    // Potong teks jika terlalu panjang
    const displayLink = currentLink.length > 40 ? currentLink.substring(0, 40) + '...' : currentLink;
    const displayPesan = currentPesan.length > 100 ? currentPesan.substring(0, 100) + '...' : currentPesan;

    confirmLink.textContent = displayLink;
    confirmPesan.textContent = displayPesan;
    
    confirmationModal.classList.add("active");
}

function closeConfirmationModal() {
    confirmationModal.classList.remove("active");
}

function confirmSending() {
    closeConfirmationModal();
    startSending();
}

// Main Send Function
async function startSending() {
    if (isSending) return;

    // Reset state
    isSending = true;
    sentCount = 0;
    failedCount = 0;
    
    // Update UI
    kirimBtn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> MENGIRIM...";
    kirimBtn.disabled = true;
    
    // Reset status
    updateStatus("Mengirim...", "Memulai pengiriman 25 pesan...", "fa-paper-plane fa-bounce");
    updateProgress(0);
    logs = [];
    updateLogDisplay();
    
    addLog("🚀 Memulai pengiriman 25 pesan", "info");
    addLog(`🎯 Target: ${currentLink}`, "info");
    addLog(`💬 Pesan: ${currentPesan}`, "info");

    // Kirim pesan satu per satu dengan delay
    for (let i = 0; i < totalAttempts; i++) {
        if (!isSending) break; // Stop jika dibatalkan
        
        try {
            // Kirim menggunakan API Deline langsung
            const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(currentLink)}&message=${encodeURIComponent(currentPesan)}`;
            
            const response = await fetch(apiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json"
                }
            });

            if (response.ok) {
                sentCount++;
                addLog(`Pesan ${i + 1}: ✅ Sukses dikirim`, "success");
            } else {
                failedCount++;
                addLog(`Pesan ${i + 1}: ❌ Gagal (kode: ${response.status})`, "error");
            }
        } catch (error) {
            failedCount++;
            addLog(`Pesan ${i + 1}: ⚠️ Error jaringan`, "error");
        }

        // Update progress
        const done = sentCount + failedCount;
        const progress = Math.round(done / totalAttempts * 100);
        updateProgress(progress);
        
        // Update status dengan animasi berbeda
        const animIcon = i % 2 === 0 ? "fa-paper-plane fa-bounce" : "fa-rocket fa-bounce";
        updateStatus(
            "Mengirim...", 
            `📊 Progress: ${done}/${totalAttempts} | ✅ ${sentCount} | ❌ ${failedCount}`,
            animIcon
        );

        // Delay antar request (0.5-1.5 detik)
        if (i < totalAttempts - 1) {
            await delay(500 + Math.random() * 1000);
        }
    }

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
    showSuccessModal();
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
    
    logContent.innerHTML = logs.map(log => `
        <div class="log-item ${log.type}">
            <div class="log-message">
                <span>${log.message}</span>
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
            kirimBtn.innerHTML = "<i class='fas fa-paper-plane'></i> KIRIM PESAN";
            kirimBtn.disabled = false;
            addLog("⏹️ Pengiriman dibatalkan", "info");
        } else {
            return;
        }
    }
    
    linkInput.value = "";
    pesanInput.value = "isi pesan yang ingin di kirim kan cuy";
    
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
    } else if (sentCount > failedCount) {
        resultMessage.textContent = "👍 Mayoritas pesan berhasil dikirim!";
    } else if (sentCount === 0) {
        resultMessage.textContent = "😞 Tidak ada pesan yang berhasil dikirim.";
    } else {
        resultMessage.textContent = "⚠️ Beberapa pesan gagal dikirim.";
    }
    
    successModal.classList.add("active");
}

function closeSuccessModal() {
    successModal.classList.remove("active");
}

// Initialize
updateLogDisplay();

// Auto focus ke input link saat halaman load
window.onload = function() {
    linkInput.focus();
    linkInput.addEventListener('focus', function() {
        if (this.value === 'isi link nya di sini yach.....') {
            this.value = 'https://ngl.link/';
        }
    });
    
    pesanInput.addEventListener('focus', function() {
        if (this.value === 'isi pesan yang ingin di kirim kan cuy') {
            this.value = '';
        }
    });
};