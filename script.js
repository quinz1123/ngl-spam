// DOM Elements
const linkInput = document.getElementById('link');
const pesanInput = document.getElementById('pesan');
const kirimBtn = document.getElementById('kirim');
const resetBtn = document.getElementById('reset');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const logContent = document.getElementById('log-content');
const clearLogBtn = document.getElementById('clear-log');
const successModal = document.getElementById('success-modal');
const closeSuccessBtn = document.getElementById('close-success');
const successMessage = document.getElementById('success-message');

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const statusPage = document.getElementById("statusPage");

// State
let isSending = false;
let sentCount = 0;
let failedCount = 0;
let totalAttempts = 25; // Fix 25 pesan sesuai API Deline
let logs = [];

// Sidebar Functions
menuBtn.onclick = () => sidebar.classList.toggle("active");

function openStatus() {
    statusPage.classList.add("active");
    sidebar.classList.remove("active");
}

function closeStatus() {
    statusPage.classList.remove("active");
}

// Event Listeners
kirimBtn.onclick = startSending;
resetBtn.onclick = resetForm;
clearLogBtn.onclick = clearLogs;
closeSuccessBtn.onclick = closeSuccessModal;

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
        return alert("Format link NGL tidak valid! Contoh: https://ngl.link/username");
    }

    isSending = true;
    sentCount = 0;
    failedCount = 0;

    kirimBtn.innerHTML = "⏳ Mengirim 25 Pesan...";
    kirimBtn.disabled = true;
    
    // Buka halaman status
    openStatus();
    updateProgress(0);
    addLog("Memulai pengiriman 25 pesan...", "info");

    // Kirim 25 pesan secara paralel dengan delay
    const promises = [];
    
    for (let i = 0; i < totalAttempts; i++) {
        // Tambah delay progresif
        const delayTime = i * 500; // 0.5 detik antar request
        promises.push(sendMessageWithDelay(i, link, pesan, delayTime));
    }

    // Tunggu semua selesai
    await Promise.all(promises);

    // Tampilkan hasil
    isSending = false;
    kirimBtn.innerHTML = "KIRIM PESAN";
    kirimBtn.disabled = false;

    // Tampilkan modal hasil
    showSuccessModal();
}

// Send Single Message with Delay
async function sendMessageWithDelay(index, link, pesan, delayTime) {
    await new Promise(resolve => setTimeout(resolve, delayTime));
    
    try {
        // Gunakan API Deline
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
            addLog(`Pesan ${index + 1}: Sukses dikirim`, "success");
        } else {
            failedCount++;
            addLog(`Pesan ${index + 1}: Gagal (${response.status})`, "error");
        }
    } catch (error) {
        failedCount++;
        addLog(`Pesan ${index + 1}: Error - ${error.message}`, "error");
    }

    // Update progress
    const done = sentCount + failedCount;
    updateProgress(Math.round(done / totalAttempts * 100));
}

// Fallback API Function (Jika Deline tidak bekerja)
async function sendViaFallback(link, pesan) {
    try {
        // API fallback alternatif
        const apiUrl = `https://api-faa.my.id/faa/ngl-spam?link=${encodeURIComponent(link)}&pesan=${encodeURIComponent(pesan)}&jumlah=1`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        return data.status === true;
    } catch {
        return false;
    }
}

// Helper Functions
function updateProgress(percent) {
    progressFill.style.width = percent + "%";
    progressText.innerHTML = `${percent}% (${sentCount + failedCount}/${totalAttempts})`;
    
    // Update status text
    const statusText = document.querySelector('.status-text h3');
    const statusDesc = document.querySelector('.status-text p');
    
    if (percent === 0) {
        statusText.textContent = "Menunggu";
        statusDesc.textContent = "Belum ada pengiriman pesan";
    } else if (percent < 100) {
        statusText.textContent = "Mengirim...";
        statusDesc.textContent = `Terkirim: ${sentCount}, Gagal: ${failedCount}`;
    } else {
        statusText.textContent = "Selesai!";
        statusDesc.textContent = `Pengiriman selesai! Sukses: ${sentCount}, Gagal: ${failedCount}`;
    }
}

function addLog(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
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
            <span class="log-time">${log.time}</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');
}

function clearLogs() {
    logs = [];
    updateLogDisplay();
    addLog("Log berhasil dibersihkan", "info");
}

function resetForm() {
    if (isSending) {
        if (!confirm("Pengiriman sedang berjalan. Yakin ingin reset?")) return;
        isSending = false;
        kirimBtn.innerHTML = "KIRIM PESAN";
        kirimBtn.disabled = false;
    }
    
    linkInput.value = "";
    pesanInput.value = "";
    updateProgress(0);
    addLog("Form berhasil direset", "info");
}

function showSuccessModal() {
    successMessage.innerHTML = `
        <div class="result-summary">
            <h4><i class="fas fa-chart-bar"></i> Hasil Pengiriman</h4>
            <div class="result-item success">
                <i class="fas fa-check-circle"></i>
                <span>Berhasil dikirim: <strong>${sentCount}</strong></span>
            </div>
            <div class="result-item ${failedCount > 0 ? 'error' : 'success'}">
                <i class="fas ${failedCount > 0 ? 'fa-times-circle' : 'fa-check-circle'}"></i>
                <span>Gagal dikirim: <strong>${failedCount}</strong></span>
            </div>
            <div class="result-item info">
                <i class="fas fa-paper-plane"></i>
                <span>Total percobaan: <strong>${totalAttempts}</strong></span>
            </div>
        </div>
    `;
    successModal.classList.add("active");
}

function closeSuccessModal() {
    successModal.classList.remove("active");
}

// Initialize
updateLogDisplay();