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
const successModal = document.getElementById('success-modal');
const closeSuccessBtn = document.getElementById('close-success');
const successCount = document.getElementById('success-count');
const failCount = document.getElementById('fail-count');
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

// Event Listeners
kirimBtn.onclick = startSending;
resetBtn.onclick = resetForm;
lihatStatusBtn.onclick = openStatus;
clearLogBtn.onclick = clearLogs;
closeSuccessBtn.onclick = closeSuccessModal;

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === successModal) {
        closeSuccessModal();
    }
}

// Main Send Function
async function startSending() {
    if (isSending) return;

    const link = linkInput.value.trim();
    const pesan = pesanInput.value.trim();

    if (!link || !pesan) {
        return alert("Link NGL dan pesan harus diisi!");
    }

    // Validasi format link NGL
    if (!link.includes('ngl.link/')) {
        return alert("Format link NGL tidak valid!\nContoh: https://ngl.link/username");
    }

    // Konfirmasi sebelum mengirim
    if (!confirm(`Anda akan mengirim 25 pesan ke:\n${link}\n\nPesan: "${pesan}"\n\nLanjutkan?`)) {
        return;
    }

    // Reset state
    isSending = true;
    sentCount = 0;
    failedCount = 0;
    
    // Update UI
    kirimBtn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> MENGIRIM...";
    kirimBtn.disabled = true;
    
    // Reset status
    updateStatus("Mengirim...", "Mengirim 25 pesan...", "fa-spinner fa-spin");
    updateProgress(0);
    addLog("Memulai pengiriman 25 pesan...", "info");
    addLog(`Target: ${link}`, "info");
    addLog(`Pesan: ${pesan}`, "info");

    // Kirim pesan satu per satu dengan delay
    for (let i = 0; i < totalAttempts; i++) {
        if (!isSending) break; // Stop jika dibatalkan
        
        try {
            // Kirim menggunakan API Deline langsung
            const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(link)}&message=${encodeURIComponent(pesan)}`;
            
            const response = await fetch(apiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                sentCount++;
                addLog(`Pesan ${i + 1}: ✅ Sukses`, "success");
            } else {
                failedCount++;
                addLog(`Pesan ${i + 1}: ❌ Gagal (${response.status})`, "error");
            }
        } catch (error) {
            failedCount++;
            addLog(`Pesan ${i + 1}: ⚠️ Error jaringan`, "error");
        }

        // Update progress
        const done = sentCount + failedCount;
        const progress = Math.round(done / totalAttempts * 100);
        updateProgress(progress);
        
        // Update status
        updateStatus(
            "Mengirim...", 
            `Terkirim: ${sentCount}, Gagal: ${failedCount} (${done}/${totalAttempts})`,
            "fa-spinner fa-spin"
        );

        // Delay antar request (1-2 detik agar tidak spam)
        if (i < totalAttempts - 1) {
            await delay(1000 + Math.random() * 1000);
        }
    }

    // Selesai
    isSending = false;
    kirimBtn.innerHTML = "<i class='fas fa-paper-plane'></i> KIRIM PESAN";
    kirimBtn.disabled = false;
    
    // Update final status
    if (sentCount + failedCount === totalAttempts) {
        updateStatus(
            "Selesai!", 
            `Pengiriman selesai! Sukses: ${sentCount}, Gagal: ${failedCount}`,
            "fa-check-circle"
        );
        
        // Tampilkan modal hasil
        showSuccessModal();
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
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; color: #666;">${log.time}</span>
                <span style="font-size: 14px; font-weight: 500;">${log.message}</span>
            </div>
        </div>
    `).join('');
}

function clearLogs() {
    if (logs.length === 0) return;
    
    if (confirm("Hapus semua log aktivitas?")) {
        logs = [];
        updateLogDisplay();
        addLog("Log berhasil dibersihkan", "info");
    }
}

function resetForm() {
    if (isSending) {
        if (confirm("Pengiriman sedang berjalan. Batalkan pengiriman dan reset form?")) {
            isSending = false;
            kirimBtn.innerHTML = "<i class='fas fa-paper-plane'></i> KIRIM PESAN";
            kirimBtn.disabled = false;
            addLog("Pengiriman dibatalkan oleh pengguna", "info");
        } else {
            return;
        }
    }
    
    linkInput.value = "";
    pesanInput.value = "";
    
    // Reset status display
    updateStatus("Menunggu", "Belum ada pengiriman pesan", "fa-clock");
    updateProgress(0);
    
    addLog("Form berhasil direset", "info");
}

function showSuccessModal() {
    successCount.textContent = sentCount;
    failCount.textContent = failedCount;
    successModal.classList.add("active");
}

function closeSuccessModal() {
    successModal.classList.remove("active");
}

// Initialize
updateLogDisplay();

// API Fallback function (tidak langsung digunakan, backup saja)
async function sendViaAPI(link, pesan) {
    try {
        // Coba API lokal dulu (jika ada)
        const localApi = `/api/send?link=${encodeURIComponent(link)}&pesan=${encodeURIComponent(pesan)}`;
        
        const response = await fetch(localApi);
        if (response.ok) {
            const data = await response.json();
            return data.status === true;
        }
        return false;
    } catch {
        return false;
    }
}