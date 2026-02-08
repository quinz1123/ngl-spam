// DOM
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
const successModal = document.getElementById('success-modal');
const closeSuccessBtn = document.getElementById('close-success');
const successMessage = document.getElementById('success-message');

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const statusPage = document.getElementById("statusPage");

// STATE
let isSending=false;
let sentCount=0;
let failedCount=0;
let totalToSend=0;
let logs=[];
const REQUEST_DELAY=500;

// SIDEBAR
menuBtn.onclick=()=>sidebar.classList.toggle("active");

function openStatus(){
statusPage.classList.add("active");
sidebar.classList.remove("active");
}

function closeStatus(){
statusPage.classList.remove("active");
}

// RANGE SYNC
jumlahRange.oninput=()=>jumlahInput.value=jumlahRange.value;
jumlahInput.oninput=()=>jumlahRange.value=jumlahInput.value;

// SEND
kirimBtn.onclick=startSending;
resetBtn.onclick=resetForm;
clearLogBtn.onclick=()=>{logs=[];updateLogDisplay()};
closeSuccessBtn.onclick=()=>successModal.classList.remove("active");

// MAIN SEND FUNCTION
async function startSending(){

if(isSending)return;

const link=linkInput.value.trim();
const pesan=pesanInput.value.trim();
const jumlah=parseInt(jumlahInput.value);

if(!link||!pesan||!jumlah)return alert("Form belum lengkap");

isSending=true;
sentCount=0;
failedCount=0;
totalToSend=jumlah;

kirimBtn.innerHTML="⏳ Mengirim...";
kirimBtn.disabled=true;

updateProgress(0);

const encodedLink=encodeURIComponent(link);
const encodedPesan=encodeURIComponent(pesan);

for(let i=0;i<jumlah;i++){

const api=`https://api-faa.my.id/faa/ngl-spam?link=${encodedLink}&pesan=${encodedPesan}&jumlah=1`;

try{
const res=await fetch(api);
if(res.ok){
sentCount++;
addLog(`Pesan ${i+1} berhasil`,"success");
}else{
failedCount++;
addLog(`Pesan ${i+1} gagal`,"error");
}
}catch(e){
failedCount++;
addLog(`Pesan ${i+1} error`,"error");
}

const done=sentCount+failedCount;
updateProgress(Math.round(done/jumlah*100));

if(i<jumlah-1)await delay(REQUEST_DELAY);
}

isSending=false;
kirimBtn.innerHTML="KIRIM PESAN";
kirimBtn.disabled=false;

successMessage.innerHTML=`Berhasil: ${sentCount}<br>Gagal: ${failedCount}`;
successModal.classList.add("active");
}

// HELPERS
function delay(ms){return new Promise(r=>setTimeout(r,ms));}

function updateProgress(p){
progressFill.style.width=p+"%";
progressText.innerHTML=`${p}% (${sentCount+failedCount}/${totalToSend})`;
}

function addLog(msg,type){
logs.unshift({msg,type});
updateLogDisplay();
}

function updateLogDisplay(){
logContent.innerHTML="";
logs.forEach(l=>{
const d=document.createElement("div");
d.className=`log-item ${l.type}`;
d.innerHTML=`<div>${l.msg}</div>`;
logContent.appendChild(d);
});
}

function resetForm(){
linkInput.value="";
pesanInput.value="";
jumlahInput.value=1;
jumlahRange.value=1;
logs=[];
updateLogDisplay();
updateProgress(0);
}