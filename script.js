/**
 * ฐานข้อมูล Google Apps Script (Web App URL)
 * แทนที่ URL นี้ด้วย Web App URL ของคุณเมื่อ Deploy GAS เสร็จ
 */
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxyYgAriA1OEsOd9jbTW9d6d97O9JlOVVyh6RevME1dqndKJ1MhFvltFTn2W1qM8sQ/exec";

// --- State Management ---
let state = {
    user: null, // { name, class, roll }
    progress: {
        preTest: false,
        lesson1: false,
        lesson2: false,
        lesson3: false,
        postTest: false,
        gamePlayed: false,
        resultsSaved: false
    },
    scores: {
        preTest: 0,
        postTest: 0,
        gameMax: 0
    },
    gameQuotas: 3,
    activeSession: {
        testType: null, // 'preTest' or 'postTest'
        endTime: null,
        answers: [],
        questionOrder: [],
        choicesOrder: []
    }
};

// --- Data Content ---
const lessonsData = {
    lesson1: {
        title: "บทเรียน 1: ระบบเลือด",
        content: `
            <p class="text-sm text-slate-300 mb-3">เลือดประกอบด้วย 2 ส่วนใหญ่ ได้แก่ พลาสมาและส่วนที่เป็นเซลล์</p>
            
            <h4 class="text-rose-400 font-bold mt-2 text-lg drop-shadow">🔶 1. พลาสมา (Plasma) ≈ 55%</h4>
            <p class="text-sm text-slate-300">ของเหลวสีเหลืองใส ทำหน้าที่ลำเลียงสารต่าง ๆ ทั่วร่างกาย</p>
            <ul class="list-disc pl-5 space-y-1 mt-2 text-sm text-slate-200">
                <li><b class="text-blue-300">น้ำ ≈ 90–92%:</b> เป็นตัวกลางลำเลียงสาร ควบคุมอุณหภูมิ และรักษาสมดุล</li>
                <li><b class="text-blue-300">โปรตีนในพลาสมา:</b> 
                    <ul class="list-[circle] pl-5 mt-1 text-slate-300">
                        <li>Albumin → รักษาความดันออสโมติก</li>
                        <li>Globulin → เกี่ยวข้องกับภูมิคุ้มกัน (แอนติบอดี)</li>
                        <li>Fibrinogen → เกี่ยวข้องกับการแข็งตัวของเลือด</li>
                    </ul>
                </li>
                <li><b class="text-blue-300">สารอื่น ๆ:</b> สารอาหาร (กลูโคส กรดอะมิโน), ฮอร์โมน, เกลือแร่, ของเสีย (ยูเรีย, CO₂)</li>
            </ul>

            

            <h4 class="text-rose-400 font-bold mt-6 text-lg drop-shadow">🔶 2. ส่วนที่เป็นเซลล์ ≈ 45%</h4>
            <div class="space-y-3 mt-3 text-sm">
                <div class="bg-slate-800/60 p-3 rounded-xl border border-rose-500/30 shadow-inner">
                    <p class="font-bold text-rose-400 text-base mb-1">🟥 เม็ดเลือดแดง (RBC)</p>
                    <p class="text-slate-300">ไม่มีนิวเคลียส (ในคน) รูปร่างเว้า 2 ด้านเพื่อเพิ่มพื้นที่ผิว และมีฮีโมโกลบิน</p>
                    <p class="mt-1 text-emerald-300"><i class="fa-solid fa-truck-fast"></i> <b>หน้าที่:</b> ลำเลียง O₂ จากปอดสู่เซลล์ และลำเลียง CO₂ กลับสู่ปอด</p>
                </div>
                
                <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-500/30 shadow-inner">
                    <p class="font-bold text-white text-base mb-1">⚪ เม็ดเลือดขาว (WBC)</p>
                    <p class="text-slate-300">มีหลายชนิด เช่น นิวโทรฟิล ลิมโฟไซต์ โมโนไซต์</p>
                    <p class="mt-1 text-emerald-300"><i class="fa-solid fa-shield-halved"></i> <b>หน้าที่:</b> ระบบภูมิคุ้มกัน ทำลายเชื้อโรค กินสิ่งแปลกปลอม (Phagocytosis) และสร้างแอนติบอดี</p>
                </div>

                <div class="bg-slate-800/60 p-3 rounded-xl border border-amber-500/30 shadow-inner">
                    <p class="font-bold text-amber-400 text-base mb-1">🩹 เกล็ดเลือด (Platelets)</p>
                    <p class="text-slate-300">เป็นชิ้นส่วนของเซลล์ ไม่ใช่เซลล์สมบูรณ์</p>
                    <p class="mt-1 text-emerald-300"><i class="fa-solid fa-band-aid"></i> <b>หน้าที่:</b> หยุดเลือดเมื่อเกิดบาดแผล และกระตุ้นกระบวนการแข็งตัวของเลือด</p>
                </div>
            </div>`
    },
    lesson2: {
        title: "บทเรียน 2: กลไกการแข็งตัว",
        content: `
            <p class="text-sm text-slate-300 mb-4">เป็นกระบวนการสำคัญเพื่อป้องกันการเสียเลือดมากเกินไป แบ่งเป็น 4 ขั้นตอนหลัก:</p>
            
            

            <div class="space-y-4 text-sm relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-rose-500 before:via-amber-500 before:to-blue-500">
                
                <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-rose-500 text-white font-bold z-10 shadow">1</div>
                    <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-md ml-4 md:ml-0 md:mr-4">
                        <p class="font-bold text-rose-400 mb-1">หลอดเลือดหดตัว (Vasoconstriction)</p>
                        <p class="text-slate-300">เมื่อหลอดเลือดฉีกขาด จะหดตัวทันทีเพื่อลดการไหลของเลือด</p>
                    </div>
                </div>

                <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-amber-500 text-white font-bold z-10 shadow">2</div>
                    <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-md ml-4 md:ml-4">
                        <p class="font-bold text-amber-400 mb-1">การรวมตัวของเกล็ดเลือด</p>
                        <p class="text-slate-300">เกล็ดเลือดเกาะบริเวณแผล ปล่อยสารเคมีดึงเกล็ดเลือดอื่นมารวม เกิดเป็น <b class="text-white">Platelet plug</b></p>
                    </div>
                </div>

                <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-emerald-500 text-white font-bold z-10 shadow">3</div>
                    <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 p-4 rounded-xl border border-emerald-500/50 shadow-md ml-4 md:ml-0 md:mr-4">
                        <p class="font-bold text-emerald-400 mb-2">สร้างใยไฟบริน (Coagulation)</p>
                        <ol class="list-decimal pl-4 text-slate-300 space-y-1 text-xs">
                            <li>เกล็ดเลือดและเนื้อเยื่อปล่อย <span class="text-amber-200">Thromboplastin</span></li>
                            <li>Thromboplastin + Ca²⁺ เปลี่ยน <br><b class="text-white">Prothrombin → Thrombin</b></li>
                            <li>Thrombin เปลี่ยน <br><b class="text-white">Fibrinogen → Fibrin</b> (ใยไฟบริน)</li>
                        </ol>
                    </div>
                </div>

                <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-blue-500 text-white font-bold z-10 shadow">4</div>
                    <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-md ml-4 md:ml-4">
                        <p class="font-bold text-blue-400 mb-1">เกิดลิ่มเลือด (Clot)</p>
                        <p class="text-slate-300">ใยไฟบรินเป็นตาข่ายดักเม็ดเลือดแดงและเกล็ดเลือด กลายเป็นลิ่มเลือดปิดแผลหยุดเลือดสนิท</p>
                    </div>
                </div>

            </div>`
    },
    lesson3: {
        title: "บทเรียน 3: การให้และรับเลือด",
        content: `
            <h4 class="text-rose-400 font-bold text-lg mb-2 flex items-center gap-2"><i class="fa-solid fa-droplet"></i> 3.1 ระบบหมู่เลือด ABO</h4>
            <p class="text-sm text-slate-300 mb-3">จำแนกตามแอนติเจน (Antigen) บนผิวเม็ดเลือดแดง</p>
            
            

            <div class="overflow-hidden rounded-xl border border-slate-600 mb-4 shadow-lg">
                <table class="w-full text-xs text-left bg-slate-800/80">
                    <thead class="bg-slate-700/80 text-slate-200">
                        <tr>
                            <th class="p-3">หมู่เลือด</th>
                            <th class="p-3">แอนติเจน (บน RBC)</th>
                            <th class="p-3">แอนติบอดี (ในพลาสมา)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-600/50">
                        <tr>
                            <td class="p-3 font-bold text-rose-400 text-base flex items-center justify-center bg-rose-500/10 rounded m-1">A</td>
                            <td class="p-3 text-slate-200">Antigen A</td>
                            <td class="p-3 text-slate-300">Anti-B <br><span class="text-[10px] text-slate-400">(ต่อต้าน B)</span></td>
                        </tr>
                        <tr>
                            <td class="p-3 font-bold text-blue-400 text-base flex items-center justify-center bg-blue-500/10 rounded m-1">B</td>
                            <td class="p-3 text-slate-200">Antigen B</td>
                            <td class="p-3 text-slate-300">Anti-A <br><span class="text-[10px] text-slate-400">(ต่อต้าน A)</span></td>
                        </tr>
                        <tr>
                            <td class="p-3 font-bold text-purple-400 text-base flex items-center justify-center bg-purple-500/10 rounded m-1">AB</td>
                            <td class="p-3 text-slate-200">Antigen A และ B</td>
                            <td class="p-3 font-medium text-emerald-400">ไม่มี<br><span class="text-[10px] text-emerald-500">(รับได้ทุกหมู่ - ผู้รับสากล)</span></td>
                        </tr>
                        <tr>
                            <td class="p-3 font-bold text-amber-400 text-base flex items-center justify-center bg-amber-500/10 rounded m-1">O</td>
                            <td class="p-3 font-medium text-emerald-400">ไม่มี<br><span class="text-[10px] text-emerald-500">(ให้ได้ทุกหมู่ - ผู้ให้สากล)</span></td>
                            <td class="p-3 text-slate-300">Anti-A และ Anti-B</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="bg-rose-900/40 border border-rose-500/50 p-4 rounded-xl mb-6 shadow-lg">
                <p class="font-bold text-rose-400 mb-1"><i class="fa-solid fa-triangle-exclamation"></i> หลักสำคัญในการให้เลือด</p>
                <p class="text-sm text-slate-200">ห้ามให้เลือดที่มี Antigen ไปพบ Antibody ที่จำเพาะกันเด็ดขาด เพราะจะเกิดการจับกลุ่มของเม็ดเลือดแดง (Agglutination) ซึ่งอาจทำให้เสียชีวิตได้</p>
            </div>

            <hr class="border-slate-700 mb-5">

            <h4 class="text-blue-400 font-bold text-lg mb-2 flex items-center gap-2"><i class="fa-solid fa-dna"></i> 3.2 ระบบ Rh</h4>
            <p class="text-sm text-slate-300 mb-3">ขึ้นอยู่กับการมีแอนติเจน D (Antigen D) บนผิวเม็ดเลือดแดง</p>
            
            <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div class="bg-slate-800/60 p-3 rounded-xl border border-emerald-500/30">
                    <p class="font-bold text-emerald-400 text-center text-lg mb-1">Rh+</p>
                    <p class="text-center text-slate-300">มี Antigen D</p>
                    <p class="text-center text-xs text-slate-400 mt-2 border-t border-slate-700 pt-2">รับได้ทั้ง Rh+ และ Rh−</p>
                </div>
                <div class="bg-slate-800/60 p-3 rounded-xl border border-rose-500/30">
                    <p class="font-bold text-rose-400 text-center text-lg mb-1">Rh−</p>
                    <p class="text-center text-slate-300">ไม่มี Antigen D</p>
                    <p class="text-center text-xs text-rose-300 mt-2 border-t border-slate-700 pt-2 font-medium">ไม่ควรรับ Rh+ เด็ดขาด</p>
                </div>
            </div>`
    }
};

// คลังข้อสอบ (ใช้ร่วมกันทั้ง Pre/Post แต่สุ่มลำดับและสุ่มช้อยส์)
const questionBank = [
    { 
        q: "ส่วนประกอบใดของเลือดทำหน้าที่ลำเลียงออกซิเจนเป็นหลัก", 
        c: ["พลาสมา", "เม็ดเลือดขาว", "เม็ดเลือดแดง", "เกล็ดเลือด"], 
        a: 2 // เฉลย: เม็ดเลือดแดง
    },
    { 
        q: "โปรตีนในพลาสมาชนิดใดเกี่ยวข้องโดยตรงกับการแข็งตัวของเลือด", 
        c: ["Albumin", "Globulin", "Fibrinogen", "Hemoglobin"], 
        a: 2 // เฉลย: Fibrinogen
    },
    { 
        q: "ผู้ป่วยมีแผลลึก เลือดหยุดไหลช้า แพทย์ตรวจพบว่ามีเกล็ดเลือดต่ำ ข้อใดอธิบายผลที่เกิดขึ้นได้ถูกต้องที่สุด", 
        c: ["ไม่มีเม็ดเลือดแดงไปอุดแผล", "ไม่สามารถสร้างแอนติบอดีได้", "การเกิด platelet plug ลดลง", "การลำเลียงออกซิเจนลดลง"], 
        a: 2 // เฉลย: การเกิด platelet plug ลดลง
    },
    { 
        q: "หากร่างกายขาด Ca²⁺ อย่างรุนแรง กระบวนการใดจะได้รับผลกระทบมากที่สุด", 
        c: ["การสร้างฮีโมโกลบิน", "การเปลี่ยน Prothrombin เป็น Thrombin", "การสร้างเม็ดเลือดขาว", "การสร้างแอนติบอดี"], 
        a: 1 // เฉลย: การเปลี่ยน Prothrombin เป็น Thrombin
    },
    { 
        q: "ชายคนหนึ่งมีหมู่เลือด A หากได้รับเลือดหมู่ B จะเกิดอะไรขึ้น", 
        c: ["เม็ดเลือดแดงของผู้รับถูกทำลาย", "เม็ดเลือดแดงของผู้ให้จับกลุ่ม", "แอนติบอดีของผู้ให้ทำลายเลือดผู้รับ", "ไม่เกิดปฏิกิริยาใด ๆ"], 
        a: 1 // เฉลย: เม็ดเลือดแดงของผู้ให้จับกลุ่ม (Agglutination จาก Anti-B ของผู้รับ ไปจับกับ Antigen B ของผู้ให้)
    },
    { 
        q: "ผู้ที่มีหมู่เลือด AB มีคุณสมบัติเป็นผู้รับสากล เพราะเหตุใด", 
        c: ["ไม่มี Antigen บนเม็ดเลือดแดง", "มี Antibody ทุกชนิด", "ไม่มี Antibody ต่อ A และ B", "มีปริมาณพลาสมามาก"], 
        a: 2 // เฉลย: ไม่มี Antibody ต่อ A และ B
    },
    { 
        q: "บุคคล Rh− ได้รับเลือด Rh+ ครั้งแรก อาจไม่เกิดอาการทันที เพราะ", 
        c: ["ไม่มี Antigen บน RBC", "ไม่มีแอนติบอดีต่อ Rh ในตอนแรก", "Rh+ ไม่กระตุ้นภูมิคุ้มกัน", "Rh− รับ Rh+ ได้เสมอ"], 
        a: 1 // เฉลย: ไม่มีแอนติบอดีต่อ Rh ในตอนแรก (ร่างกายต้องใช้เวลาสร้าง)
    },
    { 
        q: "หากยับยั้งการสร้างไฟบริน จะเกิดผลใดมากที่สุด", 
        c: ["การรวมตัวของเกล็ดเลือดเพิ่มขึ้น", "ลิ่มเลือดไม่แข็งแรง", "เม็ดเลือดแดงแตก", "พลาสมาข้นขึ้น"], 
        a: 1 // เฉลย: ลิ่มเลือดไม่แข็งแรง (ขาดตาข่ายไฟบริน)
    },
    { 
        q: "ผู้ป่วยรายหนึ่งมี เกล็ดเลือดปกติ แต่ Prothrombin ต่ำผิดปกติ คาดว่าจะเกิดความผิดปกติในขั้นใดของการแข็งตัวของเลือดมากที่สุด", 
        c: ["การหดตัวของหลอดเลือด", "การสร้าง platelet plug", "การสร้าง thrombin", "การสร้าง fibrinogen"], 
        a: 2 // เฉลย: การสร้าง thrombin (เพราะ Prothrombin เป็นสารตั้งต้นของ Thrombin)
    },
    { 
        q: "หญิง Rh− ตั้งครรภ์บุตร Rh+ ครั้งที่สองมีความเสี่ยงสูงต่อภาวะเม็ดเลือดแดงของทารกถูกทำลาย เพราะเหตุใด", 
        c: ["ทารกสร้างแอนติบอดีต่อแม่", "เลือดแม่มี Antigen Rh มาก", "แม่สร้างแอนติบอดีต่อ Rh จากการตั้งครรภ์ครั้งแรก", "เลือดแม่และทารกมีหมู่ ABO ต่างกัน"], 
        a: 2 // เฉลย: แม่สร้างแอนติบอดีต่อ Rh จากการตั้งครรภ์ครั้งแรก
    }
];

// --- Utilities & DOM ---
// เปลี่ยนจาก sessionStorage เป็น localStorage
const saveSession = () => localStorage.setItem('bloodAppSession', JSON.stringify(state));
const loadSession = () => {
    const saved = localStorage.getItem('bloodAppSession');
    if(saved) {
        state = { ...state, ...JSON.parse(saved) };
    }
};

const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Toggle header
    if(pageId === 'loginPage') {
        document.getElementById('mainHeader').classList.add('hidden');
    } else {
        document.getElementById('mainHeader').classList.remove('hidden');
        if(state.user) document.getElementById('displayUserName').innerText = state.user.name;
    }
    
    // Page specific logic
    if(pageId === 'homePage') updateHomeMenu();
    if(pageId === 'resultsPage') renderResults();
};

const showLoader = (text = "กำลังดำเนินการ...") => {
    document.getElementById('loadingText').innerText = text;
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('loadingOverlay').classList.add('flex');
};
const hideLoader = () => {
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('loadingOverlay').classList.remove('flex');
};

const showModal = (title, bodyHtml, buttonsHtml) => {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalActions').innerHTML = buttonsHtml;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.add('flex');
};
const hideModal = () => {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalOverlay').classList.remove('flex');
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSession();
    if (state.user) {
        // Resume session
        if (state.activeSession.testType) {
            resumeTest();
        } else {
            showPage('homePage');
        }
    } else {
        showPage('loginPage');
    }
});

// --- Login System ---
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('studentName').value;
    const sClass = document.getElementById('studentClass').value;
    const roll = document.getElementById('studentRoll').value;

    // ตรวจสอบแค่ ชื่อ, ห้อง, และเลขที่
    if(!name || !sClass || !roll) return;

    showLoader("กำลังเข้าสู่ระบบ...");
    // Mock API call delay
    setTimeout(() => {
        state.user = { name, class: sClass, roll };
        saveSession(); // บันทึกลง localStorage ตามที่แก้ไว้ล่าสุด
        hideLoader();
        showPage('homePage');
    }, 800);
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    // เคลียร์ข้อมูลออกจาก localStorage เมื่อกดออกจากระบบ
    localStorage.removeItem('bloodAppSession');
    location.reload();
});

// --- Home Menu Logic (Sequential Unlocking) ---
const updateHomeMenu = () => {
    // ฟังก์ชันช่วยปลดล็อก
    const unlock = (id, htmlProps) => {
        const btn = document.querySelector(`button[data-target="${id}"]`);
        if (!btn) return;
        btn.classList.remove('locked');
        btn.classList.add('unlocked', 'border-emerald-500/50');
        
        // แก้บั๊ก: ค้นหาแท็ก i ที่อยู่ใน .rounded-full แทนการหาด้วยคลาส .fa-lock
        const icon = btn.querySelector('.rounded-full i');
        if (icon) icon.className = htmlProps.iconClass;
        
        btn.querySelector('.rounded-full').className = `w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 mr-4 ${htmlProps.bgClass}`;
        btn.querySelector('.flex-grow').classList.remove('opacity-50');
    };

    // ฟังก์ชันช่วยแสดงเครื่องหมายติ๊กถูกเมื่อเรียนจบแล้ว
    const markCompleted = (id, originalText) => {
        const btn = document.querySelector(`button[data-target="${id}"]`);
        if (!btn) return;
        btn.querySelector('h3').innerHTML = `${originalText} <i class="fa-solid fa-check text-emerald-400 ml-1"></i>`;
        btn.classList.add('opacity-80'); 
    };

    // 1. รีเซ็ตปุ่มทั้งหมด (ยกเว้น preTest) ให้เป็นสถานะล็อกก่อน
    document.querySelectorAll('.menu-btn:not([data-target="preTest"])').forEach(btn => {
        btn.classList.add('locked');
        btn.classList.remove('unlocked', 'border-emerald-500/50');
        btn.querySelector('.flex-grow').classList.add('opacity-50');
        
        // รีเซ็ตไอคอนและสีพื้นหลังให้กลับมาเป็นล็อก
        const icon = btn.querySelector('.rounded-full i');
        if (icon) icon.className = 'fa-solid fa-lock';
        btn.querySelector('.rounded-full').className = 'w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-xl shrink-0 mr-4';
    });

    // 2. เช็คเงื่อนไขการปลดล็อกตามลำดับ (Sequential Unlocking)
    if (state.progress.preTest) {
        markCompleted('preTest', 'แบบทดสอบก่อนเรียน');
        unlock('lesson1', { iconClass: 'fa-solid fa-book-open', bgClass: 'bg-blue-500/20 text-blue-400' });
    }
    
    if (state.progress.lesson1) {
        markCompleted('lesson1', 'บทเรียน 1: ระบบเลือด');
        unlock('lesson2', { iconClass: 'fa-solid fa-book-open', bgClass: 'bg-blue-500/20 text-blue-400' });
    }
    
    if (state.progress.lesson2) {
        markCompleted('lesson2', 'บทเรียน 2: กลไกการแข็งตัว');
        unlock('lesson3', { iconClass: 'fa-solid fa-book-open', bgClass: 'bg-blue-500/20 text-blue-400' });
    }
    
    if (state.progress.lesson3) {
        markCompleted('lesson3', 'บทเรียน 3: การให้และรับเลือด');
        unlock('postTest', { iconClass: 'fa-solid fa-file-signature', bgClass: 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' });
    }
    
    if (state.progress.postTest) {
        markCompleted('postTest', 'แบบทดสอบหลังเรียน');
        unlock('gameLab', { iconClass: 'fa-solid fa-flask-vial', bgClass: 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' });
    }
    
    document.getElementById('quotaDisplay').innerText = state.gameQuotas;

    if (state.progress.gamePlayed) {
        markCompleted('gameLab', 'เกมแล็บทดสอบเลือด');
        unlock('results', { iconClass: 'fa-solid fa-chart-simple', bgClass: 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(243,33,110,0.3)]' });
    }

    // 3. ผูก Event Click ให้กับปุ่มเมนูใหม่
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.onclick = () => {
            if(btn.classList.contains('locked')) return;
            const target = btn.dataset.target;
            handleMenuClick(target);
        };
    });
};

const handleMenuClick = (target) => {
    if (target === 'preTest' || target === 'postTest') {
        if (state.progress[target]) {
            showModal("แจ้งเตือน", "คุณทำแบบทดสอบนี้ไปแล้ว ไม่สามารถทำซ้ำได้", `<button class="px-4 py-2 bg-slate-700 rounded-lg" onclick="hideModal()">ตกลง</button>`);
            return;
        }
        showModal(
            `คำแนะนำการทำ ${target === 'preTest' ? 'Pre-test' : 'Post-test'}`, 
            `<ul class="text-left text-sm space-y-2 mb-2">
                <li>1. แบบทดสอบมี 10 ข้อ เวลา 15 นาที</li>
                <li>2. สามารถกดย้อนกลับไปแก้ไขคำตอบได้</li>
                <li>3. เมื่อกดตกลง เริ่มสอบแล้ว จะไม่สามารถยกเลิกได้</li>
                <li>4. หากเวลาหมด ระบบจะส่งคำตอบทันที</li>
            </ul>`,
            `<button class="px-4 py-2 bg-slate-700 rounded-lg text-white" onclick="hideModal()">ยกเลิก</button>
             <button class="px-4 py-2 bg-emerald-600 rounded-lg text-white font-bold" onclick="startTest('${target}')">ตกลง เริ่มสอบ</button>`
        );
    } else if (target.startsWith('lesson')) {
        openLesson(target);
    } else if (target === 'gameLab') {
        if (state.gameQuotas <= 0) {
            showModal("แจ้งเตือน", "โควตาการเล่นเกมของคุณหมดแล้ว (สูงสุด 3 ครั้ง)", `<button class="px-4 py-2 bg-slate-700 rounded-lg" onclick="hideModal()">ตกลง</button>`);
            return;
        }
        showModal(
            `คำแนะนำวิธีเล่น Game Lab`, 
            `<ul class="text-left text-sm space-y-2 mb-2">
                <li>1. เกมมี 10 รอบ (รอบละ 15 วินาที)</li>
                <li>2. <b class="text-amber-400">คลิกที่ขวดน้ำยา</b> Anti-A และ Anti-B เพื่อหยดลงสไลด์ทดสอบ</li>
                <li>3. สังเกตการตกตะกอน แล้วเลือกตอบหมู่เลือด (A, B, AB, O)</li>
                <li>4. ตอบถูกได้ 1 คะแนน/รอบ</li>
            </ul>
            <p class="mt-4 text-xs text-rose-400">โควตาคงเหลือ: ${state.gameQuotas} ครั้ง</p>`,
            `<button class="px-4 py-2 bg-slate-700 rounded-lg text-white" onclick="hideModal()">ยกเลิก</button>
             <button class="px-4 py-2 bg-amber-600 rounded-lg text-white font-bold" onclick="startGame()">ตกลง เริ่มเกม</button>`
        );
    } else if (target === 'results') {
        showPage('resultsPage');
    }
};

// --- Test System (Pre/Post) ---
let testTimerInterval;
let currentQIndex = 0;

const shuffleArray = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const startTest = (type) => {
    hideModal();
    // Initialize Session test
    const qOrder = shuffleArray([...Array(10).keys()]); // Random indices 0-9
    const cOrder = qOrder.map(() => shuffleArray([0,1,2,3])); // Random choices for each Q
    
    state.activeSession = {
        testType: type,
        endTime: Date.now() + (15 * 60 * 1000), // 15 mins
        answers: new Array(10).fill(null),
        questionOrder: qOrder,
        choicesOrder: cOrder
    };
    saveSession();
    resumeTest();
};

const resumeTest = () => {
    showPage('testPage');
    currentQIndex = 0;
    renderQuestion();
    
    clearInterval(testTimerInterval);
    testTimerInterval = setInterval(updateTestTimer, 1000);
    updateTestTimer(); // initial call
};

const updateTestTimer = () => {
    const now = Date.now();
    const remain = Math.max(0, state.activeSession.endTime - now);
    
    const m = Math.floor(remain / 60000).toString().padStart(2, '0');
    const s = Math.floor((remain % 60000) / 1000).toString().padStart(2, '0');
    document.getElementById('testTimer').innerText = `${m}:${s}`;

    if (remain <= 0) {
        clearInterval(testTimerInterval);
        submitTest();
    }
};

const renderQuestion = () => {
    const qState = state.activeSession;
    const realQIndex = qState.questionOrder[currentQIndex];
    const qData = questionBank[realQIndex];
    const cOrder = qState.choicesOrder[currentQIndex];

    document.getElementById('currentQNum').innerText = currentQIndex + 1;
    document.getElementById('questionText').innerText = qData.q;
    
    const container = document.getElementById('choicesContainer');
    container.innerHTML = '';

    cOrder.forEach((realChoiceIndex) => {
        const isSelected = qState.answers[currentQIndex] === realChoiceIndex;
        const btn = document.createElement('button');
        btn.className = `w-full text-left p-4 rounded-xl border-2 transition ${isSelected ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700'}`;
        btn.innerText = qData.c[realChoiceIndex];
        btn.onclick = () => {
            qState.answers[currentQIndex] = realChoiceIndex;
            saveSession();
            renderQuestion(); // Re-render to show selection
        };
        container.appendChild(btn);
    });

    // Navigation buttons
    const btnPrev = document.getElementById('btnPrevQ');
    const btnNext = document.getElementById('btnNextQ');
    
    btnPrev.disabled = currentQIndex === 0;
    btnPrev.onclick = () => {
        if(currentQIndex > 0) { currentQIndex--; renderQuestion(); }
    };

    if (currentQIndex === 9) {
        btnNext.innerText = "ส่งคำตอบ";
        btnNext.className = "px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold transition";
        btnNext.onclick = confirmSubmitTest;
    } else {
        btnNext.innerText = "ถัดไป";
        btnNext.className = "px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold transition";
        btnNext.onclick = () => {
            if(currentQIndex < 9) { currentQIndex++; renderQuestion(); }
        };
    }
};

const confirmSubmitTest = () => {
    const unans = state.activeSession.answers.filter(a => a === null).length;
    if (unans > 0) {
        showModal("ยืนยันส่งคำตอบ", `คุณยังมีข้อที่ไม่ได้ตอบอีก ${unans} ข้อ ต้องการส่งคำตอบหรือไม่?`,
            `<button class="px-4 py-2 bg-slate-700 rounded-lg text-white" onclick="hideModal()">กลับไปทำต่อ</button>
             <button class="px-4 py-2 bg-rose-600 rounded-lg text-white font-bold" onclick="submitTest()">ส่งคำตอบเลย</button>`);
    } else {
        submitTest();
    }
};

const submitTest = () => {
    hideModal();
    clearInterval(testTimerInterval);
    showLoader("กำลังตรวจคำตอบ...");
    
    setTimeout(() => {
        const qState = state.activeSession;
        let score = 0;
        
        qState.questionOrder.forEach((realQIndex, i) => {
            const userAns = qState.answers[i];
            const correctAns = questionBank[realQIndex].a;
            if (userAns === correctAns) score++;
        });

        const testType = qState.testType; // 'preTest' or 'postTest'
        state.scores[testType] = score;
        state.progress[testType] = true;
        
        // Clear session test state
        state.activeSession = { testType: null, endTime: null, answers: [], questionOrder: [], choicesOrder: [] };
        saveSession();
        hideLoader();

        showModal("สรุปผลคะแนน", `<div class="text-4xl font-poppins font-bold text-emerald-400 mt-2">${score}<span class="text-xl">/10</span></div>`,
            `<button class="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold" onclick="hideModal(); showPage('homePage')">กลับหน้าหลัก</button>`);
    }, 1000);
};

// --- Lesson System ---
const openLesson = (lessonId) => {
    const data = lessonsData[lessonId];
    document.getElementById('lessonTitle').innerText = data.title;
    document.getElementById('lessonContent').innerHTML = data.content;
    
    document.getElementById('btnFinishLesson').onclick = () => {
        state.progress[lessonId] = true;
        saveSession();
        showPage('homePage');
    };
    
    showPage('lessonPage');
};

// --- Game Lab System ---
let gameInterval;
let gameTimerInterval;
let gameRound = 1;
let currentBloodType = '';
let gameScore = 0;
let dropState = { antiA: false, antiB: false };

// 1. เพิ่มตัวแปรสำหรับเก็บลำดับโจทย์ที่ถูกสุ่มแล้วในแต่ละรอบการเล่น
let currentGameSequence = [];

const startGame = () => {
    hideModal();
    state.gameQuotas -= 1;
    saveSession();
    
    gameScore = 0;
    gameRound = 1;
    
    // 2. กำหนดชุดโจทย์ 10 ข้อตามที่ต้องการ แล้วสั่งสับเปลี่ยนลำดับ (Shuffle)
    const baseSequence = ['A', 'B', 'AB', 'O', 'A', 'B', 'AB', 'O', 'A', 'B'];
    currentGameSequence = shuffleArray(baseSequence);
    
    showPage('gamePage');
    setupGameRound();
};

document.getElementById('btnCancelGame').onclick = () => {
    showModal("ยืนยันยกเลิก", "การยกเลิกจะทำให้เสียโควตา 1 ครั้งทันที ยืนยันหรือไม่?",
        `<button class="px-4 py-2 bg-slate-700 rounded-lg text-white" onclick="hideModal()">เล่นต่อ</button>
         <button class="px-4 py-2 bg-rose-600 rounded-lg text-white font-bold" onclick="endGameEarly()">ยืนยันยกเลิก</button>`);
};

const endGameEarly = () => {
    hideModal();
    clearInterval(gameTimerInterval);
    showPage('homePage');
};

const setupGameRound = () => {
    document.getElementById('gameRoundDisplay').innerText = `${gameRound}/10`;
    dropState = { antiA: false, antiB: false };
    
    // Reset Drops
    ['bloodDrop1', 'bloodDrop2'].forEach(id => {
        const el = document.getElementById(id);
        el.classList.add('hidden');
        el.classList.remove('blood-agglutinated');
    });

    // Disable Ans buttons
    document.querySelectorAll('.ans-btn').forEach(btn => btn.disabled = true);

    // 3. ดึงหมู่เลือดจาก Array ที่สุ่มไว้แล้ว ตามรอบที่กำลังเล่น (gameRound - 1 เพราะ Array เริ่มที่ 0)
    currentBloodType = currentGameSequence[gameRound - 1];
    
    // Timer 15s
    let timeLeft = 15;
    document.getElementById('gameTimer').innerText = timeLeft;
    clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('gameTimer').innerText = timeLeft;
        if(timeLeft <= 0) {
            clearInterval(gameTimerInterval);
            evaluateGameAnswer(null); // Timeout = wrong
        }
    }, 1000);
};

// Bottle Click Events
document.getElementById('bottleA').onclick = function() {
    if(dropState.antiA) return;
    this.classList.remove('bottle-bounce');
    void this.offsetWidth; // trigger reflow
    this.classList.add('bottle-bounce');
    
    setTimeout(() => {
        dropState.antiA = true;
        const drop = document.getElementById('bloodDrop1');
        drop.classList.remove('hidden');
        // Check reaction
        if(currentBloodType === 'A' || currentBloodType === 'AB') {
            setTimeout(() => drop.classList.add('blood-agglutinated'), 300);
        }
        checkAllowAnswer();
    }, 300);
};

document.getElementById('bottleB').onclick = function() {
    if(dropState.antiB) return;
    this.classList.remove('bottle-bounce');
    void this.offsetWidth;
    this.classList.add('bottle-bounce');
    
    setTimeout(() => {
        dropState.antiB = true;
        const drop = document.getElementById('bloodDrop2');
        drop.classList.remove('hidden');
        // Check reaction
        if(currentBloodType === 'B' || currentBloodType === 'AB') {
            setTimeout(() => drop.classList.add('blood-agglutinated'), 300);
        }
        checkAllowAnswer();
    }, 300);
};

const checkAllowAnswer = () => {
    // ปลดล็อกปุ่มตอบเมื่อหยดน้ำยาอย่างน้อย 1 ชนิด (หรือบังคับ 2 ชนิดก็ได้ ในที่นี้บังคับหยดทั้งคู่เพื่อความสมบูรณ์)
    if(dropState.antiA && dropState.antiB) {
        document.querySelectorAll('.ans-btn').forEach(btn => btn.disabled = false);
    }
};

document.querySelectorAll('.ans-btn').forEach(btn => {
    btn.onclick = (e) => evaluateGameAnswer(e.target.dataset.ans);
});

const evaluateGameAnswer = (ans) => {
    clearInterval(gameTimerInterval);
    if(ans === currentBloodType) gameScore++;

    if(gameRound < 10) {
        gameRound++;
        setupGameRound();
    } else {
        finishGame();
    }
};

const finishGame = () => {
    if (gameScore > state.scores.gameMax) state.scores.gameMax = gameScore;
    state.progress.gamePlayed = true;
    saveSession();
    
    showModal("สรุปคะแนน Game Lab", `<div class="text-4xl font-poppins font-bold text-amber-400 mt-2">${gameScore}<span class="text-xl">/10</span></div>`,
        `<button class="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold" onclick="hideModal(); showPage('homePage')">กลับหน้าหลัก</button>`);
};

// --- Results System ---
const renderResults = () => {
    document.getElementById('resPre').innerHTML = `${state.scores.preTest}<span class="text-lg">/10</span>`;
    document.getElementById('resPost').innerHTML = `${state.scores.postTest}<span class="text-lg">/10</span>`;
    document.getElementById('resGame').innerText = state.scores.gameMax;

    const dev = state.scores.postTest - state.scores.preTest;
    let devText = dev > 0 ? `+${dev} คะแนน (พัฒนาขึ้น)` : dev === 0 ? `คงที่` : `${dev} คะแนน (ควรทบทวน)`;
    document.getElementById('resDev').innerText = devText;
    
    const btnSave = document.getElementById('btnSaveToSheets');
    if(state.progress.resultsSaved) {
        btnSave.disabled = true;
        btnSave.classList.replace('from-blue-600', 'from-slate-600');
        btnSave.classList.replace('to-indigo-600', 'to-slate-700');
        btnSave.innerText = "บันทึกข้อมูลแล้ว";
        document.getElementById('saveStatus').classList.remove('hidden');
    } else {
        btnSave.onclick = saveToGoogleSheets;
    }
};

const saveToGoogleSheets = () => {
    showLoader("กำลังบันทึกข้อมูลลงระบบ...");
    
    // Data payload ข้อมูลที่จะส่งไป Google Sheets
    const payload = {
        name: state.user.name,
        class: state.user.class,
        roll: state.user.roll,
        preTestScore: state.scores.preTest,
        postTestScore: state.scores.postTest,
        gameScore: state.scores.gameMax,
        development: state.scores.postTest - state.scores.preTest
    };

    // ส่ง API ไปยัง Google Apps Script
    fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        // ไม่ต้องใส่ headers: {'Content-Type': 'application/json'} เพื่อเลี่ยงปัญหา CORS
        body: JSON.stringify(payload)
    })
    .then(response => response.text())
    .then(data => {
        hideLoader();
        // อัปเดตสถานะว่าบันทึกสำเร็จแล้ว
        state.progress.resultsSaved = true;
        
        // บันทึกสถานะล่าสุดลง LocalStorage (ผู้เรียนจะกดปุ่มส่งซ้ำไม่ได้แม้จะรีเฟรชหน้า)
        saveSession(); 
        
        // อัปเดตหน้าจอให้ปุ่มเปลี่ยนเป็นสีเทา
        renderResults(); 
    })
    .catch(error => {
        hideLoader();
        console.error('Error saving to sheets:', error);
        showModal(
            "เกิดข้อผิดพลาด", 
            "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง", 
            `<button class="px-4 py-2 bg-slate-700 rounded-lg text-white font-bold" onclick="hideModal()">ตกลง</button>`
        );
    });
};

// คำสั่งปุ่มย้อนกลับจากหน้าผลการเรียน
document.getElementById('btnBackFromResults').addEventListener('click', () => {
    showPage('homePage');
});