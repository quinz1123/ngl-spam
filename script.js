// ================= FIREBASE =================

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

// ================= VISITOR COUNTER =================

const VISIT_KEY = "ngl_unique_visit";
const visitDoc = db.collection("stats").doc("visitor");

async function initVisitor() {

  if (!localStorage.getItem(VISIT_KEY)) {

    await visitDoc.set({
      total: firebase.firestore.FieldValue.increment(1)
    }, { merge:true });

    localStorage.setItem(VISIT_KEY, "true");
  }

  visitDoc.onSnapshot(doc=>{
    if(doc.exists){
      document.getElementById("visitCount").innerText = doc.data().total || 0;
    }
  });

}

window.addEventListener("load", initVisitor);

// ================= DOM =================

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const statusPage = document.getElementById("statusPage");
const statPage = document.getElementById("statPage");

menuBtn.onclick = ()=>{
  sidebar.classList.add("active");
  overlay.classList.add("active");
};

overlay.onclick = closeSidebar;

function closeSidebar(){
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

function openStatus(){
  statusPage.classList.add("active");
  closeSidebar();
}

function closeStatus(){
  statusPage.classList.remove("active");
}

function openStatistik(){
  statPage.classList.add("active");
  closeSidebar();
}

function closeStatistik(){
  statPage.classList.remove("active");
}

// ================= SEND FORM =================

const linkInput = document.getElementById("link");
const pesanInput = document.getElementById("pesan");
const kirimBtn = document.getElementById("kirim");
const resetBtn = document.getElementById("reset");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const logContent = document.getElementById("log-content");

let isSending=false;

kirimBtn.onclick = sendMessage;
resetBtn.onclick = ()=>{
  linkInput.value="";
  pesanInput.value="";
};

async function sendMessage(){

 if(isSending) return;

 const link = linkInput.value.trim();
 const pesan = pesanInput.value.trim();

 if(!link || !pesan) return alert("Isi link & pesan");

 isSending=true;
 progressFill.style.width="0%";
 logContent.innerHTML="Mengirim...";

 try{

  const api=`https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(link)}&message=${encodeURIComponent(pesan)}`;

  const res = await fetch(api);
  const data = await res.json();

  progressFill.style.width="100%";

  logContent.innerHTML = `
   ✅ Berhasil: ${data.result.berhasil_dikirim}<br>
   ❌ Gagal: ${data.result.gagal_dikirim}
  `;

 }catch(e){
  logContent.innerHTML="❌ ERROR";
 }

 isSending=false;

}

// ================= INFO =================

function showInfo(){
 alert("NGL Spam Tool\nRealtime Statistik\nBy Danz");
}