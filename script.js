// DOM Elements
const sidebar = document.getElementById('sidebar');
const hamburgerBtn = document.getElementById('hamburger-btn');
const mainContent = document.getElementById('main-content');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const linkInput = document.getElementById('link');
const pesanInput = document.getElementById('pesan');
const jumlahInput = document.getElementById('jumlah');
const jumlahRange = document.getElementById('jumlah-range');
const kirimBtn = document.getElementById('kirim');
const resetBtn = document.getElementById('reset');
const loadingIndicator = document.getElementById('loading-indicator');
const progressMiniFill = document.getElementById('progress-mini-fill');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const logContent = document.getElementById('log-content');
const clearLogBtn = document.getElementById('clear-log');
const refreshStatusBtn = document.getElementById('refresh-status');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const totalSent = document.getElementById('total-sent');
const totalSuccess = document.getElementById('total-success');
const totalFailed = document.getElementById('total-failed');

// State variables
let isSending = false;
let sentCount = 0;
let totalToSend = 0;
let failedCount = 0;
let logs = [];
let currentRetryCount = 0;
const MAX_RETRIES = 2;
const REQUEST_DELAY = 500;

// Initialize
function init() {
    // Sidebar toggle
    hamburgerBtn.addEventListener('click', toggleSidebar);
    
    // Menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            switchPage(page);
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Form inputs sync
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
    refreshStatusBtn.addEventListener('click', refreshStatus);
    
    // Load saved data
    loadLogs();
    loadStats();
    updateStatusIndicator();
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !hamburgerBtn.contains(e.target) &&
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
}

// Toggle sidebar
function toggleSidebar() {
    sidebar.classList.toggle('active');
}

// Switch between pages
function switchPage(pageName) {
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `${pageName}-page`) {
            page.classList.add('active');
        }
    });
}

// Update status indicator
function updateStatusIndicator() {
    if (totalToSend > 0 && (sentCount + failedCount) === totalToSend) {
        statusTitle.textContent = 'Selesai';
        if (failedCount > 0) {
            statusDesc.textContent = `Berhasil: ${sentCount}, Gagal: ${failedCount} dari ${totalToSend} pesan`;
        } else {
            statusDesc.textContent = `Berhasil mengirim ${sentCount} pesan`;
        }
        
        // Update icon
        const statusIcon = document.querySelector('.status-icon i');
        if (failedCount > 0) {
            statusIcon.className = 'fas fa-exclamation-triangle';
        } else {
            statusIcon.className = 'fas fa-check-circle';
        }
    } else if (isSending) {
        statusTitle.textContent = 'Mengirim...';
        statusDesc.textContent = `Progress: ${sentCount + failedCount}/${totalToSend} (${failedCount} gagal)`;
        
        // Update icon
        const statusIcon = document.querySelector('.status-icon i');
        statusIcon.className = 'fas fa-sync-alt fa-spin';
    } else {
        statusTitle.textContent = 'Menunggu';
        statusDesc.textContent = 'Belum ada pengiriman pesan';
        
        // Update icon
        const statusIcon = document.querySelector('.status-icon i');
        statusIcon.className = 'fas fa-clock';
    }
    
    // Update progress bar
    if (totalToSend > 0) {
        const completed = sentCount + failedCount;
        const progress = Math.round((completed / totalToSend) * 100);
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}% (${completed}/${totalToSend})`;
    }
    
    // Update stats
    totalSent.textContent = sentCount + failedCount;
    totalSuccess.textContent = sentCount;
    totalFailed.textContent = failedCount;
}

// Delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Send single message with retry logic
async function sendSingleMessage(apiUrl, messageNumber, totalMessages) {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
        try {
            // Update loading indicator
            progressPercent.textContent = `${Math.round(((sentCount + failedCount) / totalToSend) * 100)}%`;
            progressMiniFill.style.width = `${((sentCount + failedCount) / totalToSend) * 100}%`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return { success: true, message: `Pesan ${messageNumber} berhasil dikirim` };
            } else {
                if (retries < MAX_RETRIES) {
                    await delay(1000);
                    retries++;
                    continue;
                }
                return { 
                    success: false, 
                    message: `Pesan ${messageNumber} gagal (HTTP ${response.status})` 
                };
            }
        } catch (error) {
            let errorMessage = `Pesan ${messageNumber} gagal: `;
            
            if (error.name === 'AbortError') {
                errorMessage += 'Timeout';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Gagal terhubung';
            } else {
                errorMessage += error.message;
            }
            
            if (retries < MAX_RETRIES) {
                await delay(1500);
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
        addLog('Pengiriman sudah berjalan', 'error');
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
    
    if (jumlah > 100) {
        if (!confirm(`Mengirim ${jumlah} pesan sekaligus? Ini mungkin memakan waktu lama.`)) {
            return;
        }
    }
    
    // Prepare sending
    isSending = true;
    sentCount = 0;
    failedCount = 0;
    totalToSend = jumlah;
    
    // Switch to status page
    switchPage('status');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === 'status') {
            item.classList.add('active');
        }
    });
    
    // Show loading indicator
    loadingIndicator.classList.add('active');
    
    // Update UI
    updateStatusIndicator();
    
    // Encode parameters
    const encodedLink = encodeURIComponent(link);
    const encodedPesan = encodeURIComponent(pesan);
    
    // Send messages
    for (let i = 0; i < jumlah; i++) {
        if (!isSending) {
            addLog('Pengiriman dihentikan', 'warning');
            break;
        }
        
        const apiUrl = `https://api-faa.my.id/faa/ngl-spam?link=${encodedLink}&pesan=${encodedPesan}&jumlah=1`;
        
        const result = await sendSingleMessage(apiUrl, i + 1, jumlah);
        
        if (result.success) {
            sentCount++;
            addLog(result.message, 'success');
        } else {
            failedCount++;
            addLog(result.message, 'error');
        }
        
        updateStatusIndicator();
        
        // Delay between messages
        if (i < jumlah - 1) {
            let dynamicDelay = REQUEST_DELAY;
            if (i % 10 === 9) dynamicDelay = 2000;
            else if (i % 5 === 4) dynamicDelay = 1000;
            
            await delay(dynamicDelay);
        }
    }
    
    // Sending complete
    isSending = false;
    loadingIndicator.classList.remove('active');
    
    // Show completion message
    let completionMsg = '';
    if (failedCount === 0) {
        completionMsg = `✅ Berhasil mengirim ${sentCount} pesan!`;
    } else if (sentCount === 0) {
        completionMsg = `❌ Gagal mengirim semua pesan`;
    } else {
        completionMsg = `⚠️ Selesai: ${sentCount} berhasil, ${failedCount} gagal`;
    }
    
    addLog(completionMsg, failedCount === 0 ? 'success' : (sentCount === 0 ? 'error' : 'warning'));
    
    // Save data
    saveLogs();
    saveStats();
    updateStatusIndicator();
}

// Add log entry
function addLog(message, type = 'info') {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    const logEntry = {
        message,
        type,
        time: timeString,
        timestamp: now.getTime()
    };
    
    logs.unshift(logEntry);
    
    if (logs.length > 100) {
        logs = logs.slice(0, 100);
    }
    
    updateLogDisplay();
}

// Update log display
function updateLogDisplay() {
    logContent.innerHTML = '';
    
    if (logs.length === 0) {
        logContent.innerHTML = `
            <div class="log-empty">
                <i class="fas fa-clipboard-list"></i>
                <p>Belum ada aktivitas pengiriman</p>
            </div>
        `;
        return;
    }
    
    logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = `log-item ${log.type}`;
        
        let icon = 'fa-info-circle';
        if (log.type === 'success') icon = 'fa-check-circle';
        if (log.type === 'error') icon = 'fa-times-circle';
        if (log.type === 'warning') icon = 'fa-exclamation-triangle';
        
        logItem.innerHTML = `
            <div>
                <i class="fas ${icon}"></i>
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
        if (confirm('Hapus semua log?')) {
            logs = [];
            updateLogDisplay();
            localStorage.removeItem('ngl-spam-logs');
            addLog('Log dihapus', 'info');
        }
    }
}

// Refresh status
function refreshStatus() {
    updateStatusIndicator();
    addLog('Status diperbarui', 'info');
}

// Save logs to localStorage
function saveLogs() {
    try {
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

// Save stats to localStorage
function saveStats() {
    try {
        const stats = {
            totalSent: sentCount + failedCount,
            totalSuccess: sentCount,
            totalFailed: failedCount,
            lastUpdated: new Date().getTime()
        };
        localStorage.setItem('ngl-spam-stats', JSON.stringify(stats));
    } catch (e) {
        console.error('Gagal menyimpan stats:', e);
    }
}

// Load stats from localStorage
function loadStats() {
    try {
        const savedStats = localStorage.getItem('ngl-spam-stats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            sentCount = stats.totalSuccess || 0;
            failedCount = stats.totalFailed || 0;
            
            totalSent.textContent = stats.totalSent || 0;
            totalSuccess.textContent = stats.totalSuccess || 0;
            totalFailed.textContent = stats.totalFailed || 0;
        }
    } catch (e) {
        console.error('Gagal memuat stats:', e);
    }
}

// Reset form
function resetForm() {
    if (isSending) {
        if (confirm('Hentikan pengiriman dan reset form?')) {
            isSending = false;
            loadingIndicator.classList.remove('active');
            addLog('Pengiriman dihentikan', 'warning');
        } else {
            return;
        }
    }
    
    linkInput.value = 'https://ngl.link/danztsuyou';
    pesanInput.value = 'tes';
    jumlahInput.value = '2';
    jumlahRange.value = '2';
    
    addLog('Form direset', 'info');
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);