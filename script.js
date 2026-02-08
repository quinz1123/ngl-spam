// ============================================
// DOM ELEMENTS
// ============================================
const linkInput = document.getElementById('link');
const pesanInput = document.getElementById('pesan');
const jumlahInput = document.getElementById('jumlah');
const jumlahRange = document.getElementById('jumlah-range');
const kirimBtn = document.getElementById('kirim');
const stopBtn = document.getElementById('stop');
const resetBtn = document.getElementById('reset');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const logContent = document.getElementById('log-content');
const clearLogBtn = document.getElementById('clear-log');
const statusTitle = document.getElementById('status-title');
const statusSubtitle = document.getElementById('status-subtitle');
const successRateEl = document.getElementById('success-rate');

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const statusPage = document.getElementById("statusPage");

// ============================================
// STATE & CONFIGURATION
// ============================================
let state = {
    isSending: false,
    stopRequested: false,
    sentCount: 0,
    failedCount: 0,
    totalToSend: 0,
    logs: [],
    startTime: null,
    successHistory: []
};

const CONFIG = {
    REQUEST_DELAY_MIN: 3000,
    REQUEST_DELAY_MAX: 8000,
    MAX_RETRIES: 3,
    TIMEOUT: 15000,
    MAX_MESSAGES: 100
};

// ============================================
// SIDEBAR & NAVIGATION
// ============================================
menuBtn.onclick = () => sidebar.classList.toggle("active");

function openStatus() {
    statusPage.classList.add("active");
    sidebar.classList.remove("active");
    updateStatusDisplay();
}

function closeStatus() {
    statusPage.classList.remove("active");
}

// ============================================
// FORM CONTROLS
// ============================================
// Range sync
jumlahRange.oninput = () => {
    jumlahInput.value = jumlahRange.value;
    updateDelayHint();
};

jumlahInput.oninput = () => {
    let value = parseInt(jumlahInput.value);
    if (value > CONFIG.MAX_MESSAGES) value = CONFIG.MAX_MESSAGES;
    if (value < 1) value = 1;
    jumlahInput.value = value;
    jumlahRange.value = value;
    updateDelayHint();
};

// Calculate estimated delay
function updateDelayHint() {
    const jumlah = parseInt(jumlahInput.value);
    const estimatedTime = Math.ceil((jumlah * (CONFIG.REQUEST_DELAY_MIN / 1000)) / 60);
    const hint = document.querySelector('.form-hint');
    if (hint && hint.classList.contains('range-hint')) {
        hint.textContent = `Estimasi waktu: ~${estimatedTime} menit untuk ${jumlah} pesan`;
    }
}

// Button events
kirimBtn.onclick = startSending;
stopBtn.onclick = stopSending;
resetBtn.onclick = resetForm;
clearLogBtn.onclick = clearLogs;

// ============================================
// MAIN SENDING FUNCTION
// ============================================
async function startSending() {
    // Validation
    const link = linkInput.value.trim();
    const pesan = pesanInput.value.trim();
    const jumlah = parseInt(jumlahInput.value);

    if (!link || !pesan || !jumlah) {
        showToast('Form belum lengkap!', 'error');
        return;
    }

    if (!validateNglLink(link)) {
        showToast('Link NGL tidak valid!', 'error');
        return;
    }

    if (jumlah > CONFIG.MAX_MESSAGES) {
        showToast(`Maksimal ${CONFIG.MAX_MESSAGES} pesan`, 'error');
        return;
    }

    // Initialize state
    state.isSending = true;
    state.stopRequested = false;
    state.sentCount = 0;
    state.failedCount = 0;
    state.totalToSend = jumlah;
    state.startTime = Date.now();

    // Reset logs for new session
    state.logs = [];
    updateLogDisplay();

    // Update UI
    kirimBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    statusTitle.textContent = 'Mengirim...';
    statusSubtitle.textContent = 'Memulai pengiriman pesan';
    updateProgress(0);

    addLog(`🚀 Memulai pengiriman ${jumlah} pesan...`, 'info');
    addLog(`📝 Pesan: "${pesan.substring(0, 50)}${pesan.length > 50 ? '...' : ''}"`, 'info');
    addLog(`🔗 Ke: ${link}`, 'info');

    // Send messages
    for (let i = 0; i < jumlah; i++) {
        if (state.stopRequested) {
            addLog('⏹️ Pengiriman dihentikan oleh pengguna', 'warning');
            break;
        }

        const messageNumber = i + 1;
        const result = await sendSingleMessage(link, pesan, messageNumber);

        // Update progress
        const done = state.sentCount + state.failedCount;
        const progress = Math.round((done / jumlah) * 100);
        updateProgress(progress);

        // Delay between messages (except last one)
        if (i < jumlah - 1 && !state.stopRequested) {
            const delayTime = calculateDelay(jumlah, i);
            addLog(`⏱️ Delay ${delayTime/1000} detik sebelum pesan berikutnya...`, 'delay');
            await delay(delayTime);
        }
    }

    // Finished
    finishSending();
}

async function sendSingleMessage(link, pesan, messageNumber) {
    let success = false;
    let retryCount = 0;
    let lastError = '';

    // Update status
    statusSubtitle.textContent = `Mengirim pesan ${messageNumber}/${state.totalToSend}`;

    while (retryCount < CONFIG.MAX_RETRIES && !success && !state.stopRequested) {
        const attempt = retryCount + 1;
        
        if (retryCount > 0) {
            addLog(`🔄 Pesan ${messageNumber} - Percobaan ${attempt}/${CONFIG.MAX_RETRIES}`, 'retry');
            await delay(1000); // Delay sebelum retry
        } else {
            addLog(`📤 Pesan ${messageNumber} - Mengirim...`, 'sending');
        }

        try {
            const response = await fetchWithTimeout(
                `/api/send?link=${encodeURIComponent(link)}&pesan=${encodeURIComponent(pesan)}&_=${Date.now()}`,
                CONFIG.TIMEOUT
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            
            if (result.status === true) {
                state.sentCount++;
                success = true;
                
                // Log API yang digunakan
                const apiName = getApiName(result.api_used || '');
                addLog(`✅ Pesan ${messageNumber} berhasil (${apiName})`, 'success');
                
                // Update success rate
                updateSuccessRate();
            } else {
                throw new Error(result.error || 'API mengembalikan status false');
            }
        } catch (error) {
            lastError = error.message;
            retryCount++;
            
            if (retryCount >= CONFIG.MAX_RETRIES) {
                state.failedCount++;
                addLog(`❌ Pesan ${messageNumber} gagal: ${lastError}`, 'error');
            }
        }
    }

    return { success, retryCount };
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

function calculateDelay(totalMessages, currentIndex) {
    // Base delay
    let delayTime = CONFIG.REQUEST_DELAY_MIN;
    
    // Increase delay for large batches
    if (totalMessages > 30) {
        delayTime = CONFIG.REQUEST_DELAY_MAX;
    } else if (totalMessages > 10) {
        delayTime = 5000;
    }
    
    // Add random variation (prevents pattern detection)
    const randomVariation = Math.random() * 2000; // 0-2 seconds
    delayTime += randomVariation;
    
    // Increase delay gradually for very large batches
    if (totalMessages > 50 && currentIndex > totalMessages * 0.7) {
        delayTime += 2000;
    }
    
    return Math.floor(delayTime);
}

function validateNglLink(link) {
    const nglRegex = /^https?:\/\/(ngl\.link|ngl\.me)\/[a-zA-Z0-9_-]+$/;
    return nglRegex.test(link);
}

function getApiName(apiUrl) {
    if (apiUrl.includes('api-faa.my.id')) return 'API-1';
    if (apiUrl.includes('api.ngl.su')) return 'API-2';
    if (apiUrl.includes('ngl-api.vercel.app')) return 'API-3';
    return 'API';
}

// ============================================
// UI UPDATES
// ============================================
function updateProgress(percentage) {
    progressFill.style.width = percentage + '%';
    
    // Change color based on percentage
    if (percentage < 30) {
        progressFill.className = 'progress-fill warning';
    } else if (percentage < 70) {
        progressFill.className = 'progress-fill info';
    } else {
        progressFill.className = 'progress-fill success';
    }
    
    const done = state.sentCount + state.failedCount;
    progressText.textContent = `${percentage}% (${done}/${state.totalToSend})`;
}

function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        id: Date.now() + Math.random(),
        time: timestamp,
        message: message,
        type: type
    };
    
    state.logs.unshift(logEntry);
    
    // Keep only last 100 logs
    if (state.logs.length > 100) {
        state.logs = state.logs.slice(0, 100);
    }
    
    updateLogDisplay();
}

function updateLogDisplay() {
    if (state.logs.length === 0) {
        logContent.innerHTML = `
            <div class="log-empty">
                <i class="fas fa-clipboard-list"></i>
                <p>Log aktivitas akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    logContent.innerHTML = state.logs.map(log => `
        <div class="log-item ${log.type}">
            <div class="log-time">${log.time}</div>
            <div class="log-message">${log.message}</div>
        </div>
    `).join('');
    
    // Auto scroll to top
    logContent.scrollTop = 0;
}

function updateStatusDisplay() {
    if (state.isSending) {
        statusTitle.textContent = 'Mengirim...';
        const done = state.sentCount + state.failedCount;
        statusSubtitle.textContent = `${done}/${state.totalToSend} pesan terkirim`;
    } else {
        if (state.totalToSend > 0) {
            const successRate = state.totalToSend > 0 
                ? Math.round((state.sentCount / state.totalToSend) * 100) 
                : 0;
            statusTitle.textContent = 'Selesai';
            statusSubtitle.textContent = `${state.sentCount} berhasil, ${state.failedCount} gagal (${successRate}%)`;
        } else {
            statusTitle.textContent = 'Menunggu';
            statusSubtitle.textContent = 'Belum ada pengiriman pesan';
        }
    }
}

function updateSuccessRate() {
    if (state.totalToSend === 0) return;
    
    const successRate = Math.round((state.sentCount / state.totalToSend) * 100);
    successRateEl.textContent = successRate;
    
    // Store in history
    state.successHistory.push(successRate);
    if (state.successHistory.length > 10) {
        state.successHistory.shift();
    }
}

// ============================================
// CONTROL FUNCTIONS
// ============================================
function stopSending() {
    state.stopRequested = true;
    addLog('⏹️ Menghentikan pengiriman...', 'warning');
    statusSubtitle.textContent = 'Menghentikan...';
}

function finishSending() {
    state.isSending = false;
    
    // Update UI
    kirimBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    
    // Calculate statistics
    const endTime = Date.now();
    const duration = Math.round((endTime - state.startTime) / 1000);
    const successRate = state.totalToSend > 0 
        ? Math.round((state.sentCount / state.totalToSend) * 100) 
        : 0;
    
    // Update status
    statusTitle.textContent = 'Selesai';
    statusSubtitle.textContent = `Pengiriman selesai dalam ${duration} detik`;
    
    // Show summary
    addLog(`🎉 Selesai! ${state.sentCount} berhasil, ${state.failedCount} gagal (${successRate}%)`, 'success');
    addLog(`⏱️ Durasi: ${duration} detik`, 'info');
    
    // Show summary modal
    showSummaryModal();
}

function resetForm() {
    if (state.isSending) {
        if (!confirm('Pengiriman masih berjalan. Yakin ingin reset?')) return;
        stopSending();
    }
    
    linkInput.value = 'https://ngl.link/danztsuyou';
    pesanInput.value = 'tes';
    jumlahInput.value = 5;
    jumlahRange.value = 5;
    
    state.sentCount = 0;
    state.failedCount = 0;
    state.totalToSend = 0;
    state.logs = [];
    
    updateProgress(0);
    updateLogDisplay();
    updateStatusDisplay();
    
    showToast('Form telah direset', 'success');
}

function clearLogs() {
    if (state.logs.length === 0) return;
    
    if (confirm('Hapus semua log aktivitas?')) {
        state.logs = [];
        updateLogDisplay();
        showToast('Log telah dihapus', 'success');
    }
}

// ============================================
// NOTIFICATION & MODAL
// ============================================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function showSummaryModal() {
    const successRate = state.totalToSend > 0 
        ? Math.round((state.sentCount / state.totalToSend) * 100) 
        : 0;
    
    const modalHTML = `
        <div class="modal active" id="summary-modal">
            <div class="modal-overlay" onclick="closeSummary()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-chart-bar"></i> Laporan Pengiriman</h2>
                    <button class="modal-close" onclick="closeSummary()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="summary-stats">
                        <div class="stat success">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${state.sentCount}</div>
                                <div class="stat-label">Berhasil</div>
                            </div>
                        </div>
                        <div class="stat error">
                            <div class="stat-icon">
                                <i class="fas fa-times-circle"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${state.failedCount}</div>
                                <div class="stat-label">Gagal</div>
                            </div>
                        </div>
                        <div class="stat total">
                            <div class="stat-icon">
                                <i class="fas fa-paper-plane"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${state.totalToSend}</div>
                                <div class="stat-label">Total</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="success-rate">
                        <div class="rate-circle">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="#eee" stroke-width="12"/>
                                <circle cx="60" cy="60" r="54" fill="none" 
                                    stroke="${successRate > 70 ? '#38ef7d' : successRate > 40 ? '#ffa726' : '#ff6b6b'}" 
                                    stroke-width="12" stroke-linecap="round"
                                    stroke-dasharray="${2 * Math.PI * 54}"
                                    stroke-dashoffset="${2 * Math.PI * 54 * (1 - successRate/100)}"
                                    transform="rotate(-90 60 60)"/>
                            </svg>
                            <div class="rate-text">${successRate}%</div>
                        </div>
                        <div class="rate-label">Success Rate</div>
                    </div>
                    
                    <div class="modal-actions">
                        <button onclick="closeSummary()" class="btn-primary">
                            <i class="fas fa-check"></i> Oke
                        </button>
                        <button onclick="resetForm()" class="btn-secondary">
                            <i class="fas fa-redo"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('summary-modal');
    if (existingModal) existingModal.remove();
    
    // Add modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSummary() {
    const modal = document.getElementById('summary-modal');
    if (modal) modal.remove();
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form hints
    updateDelayHint();
    
    // Load saved success rate from localStorage
    const savedRate = localStorage.getItem('ngl_success_rate');
    if (savedRate) {
        successRateEl.textContent = savedRate;
    }
    
    // Add event listener for success rate updates
    const observer = new MutationObserver(() => {
        if (state.totalToSend > 0) {
            const rate = Math.round((state.sentCount / state.totalToSend) * 100);
            localStorage.setItem('ngl_success_rate', rate);
        }
    });
    
    // Show welcome message
    setTimeout(() => {
        showToast('NGL Spam v2 siap digunakan!', 'success');
    }, 1000);
});

// Make functions globally available
window.closeSummary = closeSummary;
window.resetForm = resetForm;