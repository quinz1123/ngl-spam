// DOM Elements
const linkInput = document.getElementById('link');
const pesanInput = document.getElementById('pesan');
const jumlahInput = document.getElementById('jumlah');
const jumlahRange = document.getElementById('jumlah-range');
const kirimBtn = document.getElementById('kirim');
const resetBtn = document.getElementById('reset');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const logContent = document.getElementById('log-content');
const clearLogBtn = document.getElementById('clear-log');
const loadingModal = document.getElementById('loading-modal');
const successModal = document.getElementById('success-modal');
const closeSuccessBtn = document.getElementById('close-success');
const modalProgressFill = document.getElementById('modal-progress-fill');
const modalProgressText = document.getElementById('modal-progress-text');
const loadingDetail = document.getElementById('loading-detail');
const successMessage = document.getElementById('success-message');

// State variables
let isSending = false;
let sentCount = 0;
let totalToSend = 0;
let failedCount = 0;
let logs = [];
let currentRetryCount = 0;
const MAX_RETRIES = 2; // Maksimal percobaan ulang per pesan
const REQUEST_DELAY = 500; // Delay antar request (ms)

// Initialize
function init() {
    // Sync range and number input
    jumlahRange.addEventListener('input', () => {
        jumlahInput.value = jumlahRange.value;
    });
    
    jumlahInput.addEventListener('input', () => {
        let value = parseInt(jumlahInput.value) || 1;
        if (value < 1) value = 1;
        if (value > 1000) value = 1000;
        jumlahInput.value = value;
        jumlahRange.value = value;
    });
    
    // Button event listeners
    kirimBtn.addEventListener('click', startSending);
    resetBtn.addEventListener('click', resetForm);
    clearLogBtn.addEventListener('click', clearLogs);
    closeSuccessBtn.addEventListener('click', () => {
        successModal.classList.remove('active');
    });
    
    // Update status indicator
    updateStatusIndicator();
    
    // Load saved logs from localStorage
    loadLogs();
}

// Update status indicator
function updateStatusIndicator() {
    const statusIcon = document.querySelector('.status-icon i');
    const statusTitle = document.querySelector('.status-text h3');
    const statusDesc = document.querySelector('.status-text p');
    
    if (totalToSend > 0 && (sentCount + failedCount) === totalToSend) {
        statusIcon.className = 'fas fa-check-circle';
        statusIcon.parentElement.style.color = '#38ef7d';
        statusTitle.textContent = 'Selesai';
        if (failedCount > 0) {
            statusDesc.textContent = `Berhasil: ${sentCount}, Gagal: ${failedCount} dari ${totalToSend} pesan`;
        } else {
            statusDesc.textContent = `Berhasil mengirim ${sentCount} pesan`;
        }
    } else if (isSending) {
        statusIcon.className = 'fas fa-sync-alt fa-spin';
        statusIcon.parentElement.style.color = '#4776E6';
        statusTitle.textContent = 'Mengirim...';
        statusDesc.textContent = `Progress: ${sentCount + failedCount}/${totalToSend} (${failedCount} gagal)`;
    } else {
        statusIcon.className = 'fas fa-clock';
        statusIcon.parentElement.style.color = '#4776E6';
        statusTitle.textContent = 'Menunggu';
        statusDesc.textContent = 'Belum ada pengiriman pesan';
    }
}

// Fungsi untuk delay dengan promise
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi untuk mengirim satu pesan dengan retry logic
async function sendSingleMessage(apiUrl, messageNumber, totalMessages) {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
        try {
            // Tambah timeout untuk fetch request (8 detik)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            loadingDetail.textContent = `Mengirim pesan ${messageNumber} dari ${totalMessages}${retries > 0 ? ` (Percobaan ${retries + 1})` : ''}`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return { success: true, message: `Pesan ${messageNumber} berhasil dikirim` };
            } else {
                // Jika response tidak OK, coba lagi
                if (retries < MAX_RETRIES) {
                    addLog(`Pesan ${messageNumber} gagal (HTTP ${response.status}), mencoba lagi...`, 'warning');
                    await delay(1000); // Tunggu 1 detik sebelum retry
                    retries++;
                    continue;
                }
                return { 
                    success: false, 
                    message: `Pesan ${messageNumber} gagal dikirim (HTTP ${response.status})` 
                };
            }
        } catch (error) {
            // Handle berbagai jenis error
            let errorMessage = `Pesan ${messageNumber} gagal: `;
            
            if (error.name === 'AbortError') {
                errorMessage += 'Timeout (request terlalu lama)';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Gagal terhubung ke server. Cek koneksi internet.';
            } else if (error.message.includes('NetworkError')) {
                errorMessage += 'Masalah jaringan. Cek koneksi Anda.';
            } else {
                errorMessage += error.message;
            }
            
            // Coba lagi jika belum mencapai maksimal retry
            if (retries < MAX_RETRIES) {
                addLog(`${errorMessage}, mencoba lagi...`, 'warning');
                await delay(1500); // Tunggu lebih lama untuk network error
                retries++;
                continue;
            }
            
            return { success: false, message: errorMessage };
        }
    }
}

// Start sending messages
async function startSending() {
    if (isSending) {
        addLog('Pengiriman sudah berjalan, tunggu hingga selesai', 'error');
        return;
    }
    
    // Validate inputs
    const link = linkInput.value.trim();
    const pesan = pesanInput.value.trim();
    const jumlah = parseInt(jumlahInput.value);
    
    if (!link) {
        addLog('Link NGL tidak boleh kosong', 'error');
        linkInput.focus();
        return;
    }
    
    if (!link.includes('ngl.link')) {
        if (confirm('Link tidak mengandung "ngl.link". Apakah ini link NGL yang valid?')) {
            // Lanjutkan jika user yakin
        } else {
            linkInput.focus();
            return;
        }
    }
    
    if (!pesan) {
        addLog('Pesan tidak boleh kosong', 'error');
        pesanInput.focus();
        return;
    }
    
    if (!jumlah || jumlah < 1) {
        addLog('Jumlah pesan minimal 1', 'error');
        jumlahInput.focus();
        return;
    }
    
    if (jumlah > 100) {
        const confirmed = confirm(`Anda akan mengirim ${jumlah} pesan. Ini mungkin akan memakan waktu lama dan bisa dianggap spam. Lanjutkan?`);
        if (!confirmed) {
            addLog('Pengiriman dibatalkan oleh pengguna', 'info');
            return;
        }
    }
    
    // Prepare sending
    isSending = true;
    sentCount = 0;
    failedCount = 0;
    totalToSend = jumlah;
    currentRetryCount = 0;
    
    // Update UI
    updateStatusIndicator();
    updateProgress(0);
    
    // Show loading modal
    loadingModal.classList.add('active');
    loadingDetail.textContent = `Menyiapkan pengiriman ${jumlah} pesan...`;
    
    // Encode parameters
    const encodedLink = encodeURIComponent(link);
    const encodedPesan = encodeURIComponent(pesan);
    
    // Show warning for large number of messages
    if (jumlah > 50) {
        addLog(`⚠️ PERINGATAN: Mengirim ${jumlah} pesan sekaligus bisa menyebabkan rate limiting`, 'warning');
        await delay(2000);
    }
    
    // Send messages
    for (let i = 0; i < jumlah; i++) {
        if (!isSending) {
            addLog('Pengiriman dihentikan oleh pengguna', 'info');
            break; // Stop if user cancelled
        }
        
        const apiUrl = `https://api-faa.my.id/faa/ngl-spam?link=${encodedLink}&pesan=${encodedPesan}&jumlah=1`;
        
        // Kirim pesan dengan retry logic
        const result = await sendSingleMessage(apiUrl, i + 1, jumlah);
        
        if (result.success) {
            sentCount++;
            addLog(result.message, 'success');
        } else {
            failedCount++;
            addLog(result.message, 'error');
        }
        
        // Update progress
        const completed = sentCount + failedCount;
        const progress = Math.round((completed / jumlah) * 100);
        updateProgress(progress);
        
        // Delay antara pengiriman pesan (kecuali untuk pesan terakhir)
        if (i < jumlah - 1) {
            // Delay dinamis berdasarkan jumlah pesan yang sudah dikirim
            let dynamicDelay = REQUEST_DELAY;
            if (i % 10 === 9) {
                // Setelah setiap 10 pesan, delay lebih lama
                dynamicDelay = 2000;
                addLog('Istirahat sebentar untuk menghindari rate limiting...', 'info');
            } else if (i % 5 === 4) {
                // Setelah setiap 5 pesan, delay sedang
                dynamicDelay = 1000;
            }
            
            await delay(dynamicDelay);
        }
    }
    
    // Sending complete
    isSending = false;
    loadingModal.classList.remove('active');
    
    // Show success/result modal
    if (failedCount === 0) {
        successMessage.innerHTML = `
            <i class="fas fa-check-circle" style="color:#38ef7d;font-size:1.5rem;"></i>
            <br>
            Berhasil mengirim <strong>${sentCount} dari ${totalToSend}</strong> pesan!
            <br>
            <small>Semua pesan berhasil dikirim</small>
        `;
    } else if (sentCount === 0) {
        successMessage.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#ff6b6b;font-size:1.5rem;"></i>
            <br>
            Gagal mengirim semua pesan (${failedCount} gagal)
            <br>
            <small>Cek koneksi internet atau coba lagi nanti</small>
        `;
    } else {
        successMessage.innerHTML = `
            <i class="fas fa-exclamation-circle" style="color:#ffa726;font-size:1.5rem;"></i>
            <br>
            Selesai: <strong>${sentCount} berhasil</strong>, <strong>${failedCount} gagal</strong> dari ${totalToSend} pesan
            <br>
            <small>Beberapa pesan mungkin gagal karena masalah koneksi</small>
        `;
    }
    
    successModal.classList.add('active');
    
    // Update status indicator
    updateStatusIndicator();
    saveLogs();
}

// Update progress bars
function updateProgress(percentage) {
    progressFill.style.width = `${percentage}%`;
    
    const completed = sentCount + failedCount;
    progressText.textContent = `${percentage}% (${completed}/${totalToSend})`;
    
    modalProgressFill.style.width = `${percentage}%`;
    modalProgressText.textContent = `${percentage}%`;
}

// Add log entry
function addLog(message, type = 'info') {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    const dateString = now.toLocaleDateString('id-ID');
    
    const logEntry = {
        message,
        type,
        time: `${timeString}`,
        date: dateString,
        timestamp: now.getTime()
    };
    
    logs.unshift(logEntry); // Add to beginning of array
    
    // Keep only last 100 logs
    if (logs.length > 100) {
        logs = logs.slice(0, 100);
    }
    
    // Update log display
    updateLogDisplay();
}

// Update log display
function updateLogDisplay() {
    // Clear current log display
    logContent.innerHTML = '';
    
    if (logs.length === 0) {
        logContent.innerHTML = `
            <div class="log-empty">
                <i class="fas fa-clipboard-list"></i>
                <p>Log aktivitas akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    // Add log entries
    logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = `log-item ${log.type}`;
        
        // Tambah icon berdasarkan tipe log
        let icon = 'fa-info-circle';
        if (log.type === 'success') icon = 'fa-check-circle';
        if (log.type === 'error') icon = 'fa-times-circle';
        if (log.type === 'warning') icon = 'fa-exclamation-triangle';
        
        logItem.innerHTML = `
            <div>
                <i class="fas ${icon}" style="margin-right: 8px; width: 16px;"></i>
                ${log.message}
            </div>
            <div class="log-time">${log.time}</div>
        `;
        logContent.appendChild(logItem);
    });
}

// Clear logs
function clearLogs() {
    if (logs.length > 0) {
        if (confirm('Apakah Anda yakin ingin menghapus semua log?')) {
            logs = [];
            updateLogDisplay();
            localStorage.removeItem('ngl-spam-logs');
            addLog('Log berhasil dihapus', 'info');
        }
    }
}

// Save logs to localStorage
function saveLogs() {
    try {
        // Simpan hanya 50 log terakhir untuk menghemat space
        const logsToSave = logs.slice(0, 50);
        localStorage.setItem('ngl-spam-logs', JSON.stringify(logsToSave));
    } catch (e) {
        console.error('Gagal menyimpan log:', e);
    }
}

// Load logs from localStorage
function loadLogs() {
    try {
        const savedLogs = localStorage.getItem('ngl-spam-logs');
        if (savedLogs) {
            logs = JSON.parse(savedLogs);
            updateLogDisplay();
        }
    } catch (e) {
        console.error('Gagal memuat log:', e);
    }
}

// Reset form
function resetForm() {
    if (isSending) {
        const confirmStop = confirm('Pengiriman sedang berjalan. Hentikan dan reset form?');
        if (confirmStop) {
            isSending = false;
            addLog('Pengiriman dihentikan oleh pengguna', 'warning');
        } else {
            return;
        }
    }
    
    linkInput.value = 'https://ngl.link/danztsuyou';
    pesanInput.value = 'tes';
    jumlahInput.value = '2';
    jumlahRange.value = '2';
    
    sentCount = 0;
    failedCount = 0;
    totalToSend = 0;
    
    updateProgress(0);
    updateStatusIndicator();
    
    addLog('Form telah direset ke nilai default', 'info');
}

// Tambahkan event listener untuk menghentikan pengiriman dengan ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSending) {
        const confirmStop = confirm('Hentikan pengiriman pesan?');
        if (confirmStop) {
            isSending = false;
            addLog('Pengiriman dihentikan (ESC ditekan)', 'warning');
            loadingModal.classList.remove('active');
            updateStatusIndicator();
        }
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);