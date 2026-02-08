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
let logs = [];

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
    
    if (sentCount > 0 && sentCount === totalToSend) {
        statusIcon.className = 'fas fa-check-circle';
        statusIcon.parentElement.style.color = '#38ef7d';
        statusTitle.textContent = 'Selesai';
        statusDesc.textContent = `Berhasil mengirim ${sentCount} pesan`;
    } else if (isSending) {
        statusIcon.className = 'fas fa-sync-alt fa-spin';
        statusIcon.parentElement.style.color = '#4776E6';
        statusTitle.textContent = 'Mengirim...';
        statusDesc.textContent = `Mengirim pesan (${sentCount}/${totalToSend})`;
    } else {
        statusIcon.className = 'fas fa-clock';
        statusIcon.parentElement.style.color = '#4776E6';
        statusTitle.textContent = 'Menunggu';
        statusDesc.textContent = 'Belum ada pengiriman pesan';
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
    
    if (jumlah > 1000) {
        addLog('Jumlah pesan maksimal 1000', 'error');
        jumlahInput.value = 1000;
        jumlahRange.value = 1000;
        return;
    }
    
    // Prepare sending
    isSending = true;
    sentCount = 0;
    totalToSend = jumlah;
    
    // Update UI
    updateStatusIndicator();
    updateProgress(0);
    
    // Show loading modal
    loadingModal.classList.add('active');
    loadingDetail.textContent = `Mengirim ${jumlah} pesan ke ${link}`;
    
    // Encode parameters
    const encodedLink = encodeURIComponent(link);
    const encodedPesan = encodeURIComponent(pesan);
    
    // Send messages
    for (let i = 0; i < jumlah; i++) {
        if (!isSending) break; // Stop if user cancelled
        
        try {
            // Update loading details
            loadingDetail.textContent = `Mengirim pesan ${i+1} dari ${jumlah}`;
            
            // Call API
            const apiUrl = `https://api-faa.my.id/faa/ngl-spam?link=${encodedLink}&pesan=${encodedPesan}&jumlah=1`;
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                sentCount++;
                addLog(`Pesan ${i+1} berhasil dikirim`, 'success');
            } else {
                addLog(`Pesan ${i+1} gagal dikirim (HTTP ${response.status})`, 'error');
            }
        } catch (error) {
            addLog(`Pesan ${i+1} gagal: ${error.message}`, 'error');
        }
        
        // Update progress
        const progress = Math.round((sentCount / jumlah) * 100);
        updateProgress(progress);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Sending complete
    isSending = false;
    loadingModal.classList.remove('active');
    
    // Show success modal
    successMessage.textContent = `Berhasil mengirim ${sentCount} dari ${totalToSend} pesan`;
    successModal.classList.add('active');
    
    // Update status indicator
    updateStatusIndicator();
    saveLogs();
}

// Update progress bars
function updateProgress(percentage) {
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% (${sentCount}/${totalToSend})`;
    
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
    
    const logEntry = {
        message,
        type,
        time: timeString,
        timestamp: now.getTime()
    };
    
    logs.unshift(logEntry); // Add to beginning of array
    
    // Keep only last 50 logs
    if (logs.length > 50) {
        logs = logs.slice(0, 50);
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
        logItem.innerHTML = `
            <div>${log.message}</div>
            <div class="log-time">${log.time}</div>
        `;
        logContent.appendChild(logItem);
    });
}

// Clear logs
function clearLogs() {
    if (logs.length > 0) {
        logs = [];
        updateLogDisplay();
        localStorage.removeItem('ngl-spam-logs');
        addLog('Log berhasil dihapus', 'info');
    }
}

// Save logs to localStorage
function saveLogs() {
    try {
        localStorage.setItem('ngl-spam-logs', JSON.stringify(logs));
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
        addLog('Tidak bisa reset saat pengiriman berjalan', 'error');
        return;
    }
    
    linkInput.value = 'https://ngl.link/danztsuyou';
    pesanInput.value = 'tes';
    jumlahInput.value = '2';
    jumlahRange.value = '2';
    
    sentCount = 0;
    totalToSend = 0;
    
    updateProgress(0);
    updateStatusIndicator();
    
    addLog('Form telah direset ke nilai default', 'info');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);