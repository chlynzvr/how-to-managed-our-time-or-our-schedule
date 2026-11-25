const DEFAULT_SCHEDULES = [
  { id: 1, title: "Bangun Pagi & Ibadah Subuh", start: "03:30", end: "05:00", category: "Wajib Asrama", xp: 35, done: false },
  { id: 2, title: "Mandi & Cek Seragam", start: "04:00", end: "05:30", category: "Piket", xp: 35, done: false },
  { id: 3, title: "Sarapan", start: "06:15", end: "06:50", category: "Pribadi", xp: 20, done: false },
  { id: 4, title: "KBM di Sekolah", start: "07:00", end: "15:30", category: "Pelajaran Sekolah", xp: 50, done: false },
  { id: 5, title: "Ekskul", start: "16:00", end: "17:00", category: "Ekskul", xp: 35, done: false },
  { id: 6, title: "Study Night & Bimbel", start: "19:30", end: "21:00", category: "Pelajaran Sekolah", xp: 50, done: false },
  { id: 7, title: "Kumpul Hp", start: "21:00", end: "21:30", category: "Wajib Asrama", xp: 35, done: false }
];

const UNIFORM_GUIDE = {
  0: "Hari Minggu • Bebas Rapi / Kaos Asrama (Siapkan seragam untuk besok!)",
  1: "Seragam Hari Senin • Putih Abu-Abu Lengkap + Topi & Dasi",
  2: "Seragam Hari Selasa • Khas + Dasi + Baret",
  3: "Seragam Hari Rabu • Khas + Dasi + Baret",
  4: "Seragam Hari Kamis • Batik / Identitas Asrama",
  5: "Seragam Hari Jumat • Seragam Pramuka Lengkap",
  6: "Seragam Hari Sabtu • Bebas Rapi"
};

const QUEST_MILESTONES = [
  { id: "first_step", title: "Langkah Pertama", desc: "Selesaikan 1 quest hari ini", badge: "Starter", check: (s) => s.some(i => i.done) },
  { id: "clean_room", title: "Penjaga Kebersihan", desc: "Selesaikan quest kategori Piket", badge: "Piket Pro", check: (s) => s.some(i => i.category === "Piket" && i.done) },
  { id: "scholar", title: "Fokus Akademik", desc: "Selesaikan quest Pelajaran Sekolah", badge: "Scholar", check: (s) => s.some(i => i.category === "Pelajaran Sekolah" && i.done) },
  { id: "full_clear", title: "Full Conquest", desc: "Selesaikan semua quest hari ini", badge: "Legend", check: (s) => s.length > 0 && s.every(i => i.done) }
];

let schedules = JSON.parse(localStorage.getItem("conquest_schedules")) || DEFAULT_SCHEDULES;
let facilities = JSON.parse(localStorage.getItem("conquest_facilities")) || [
  { id: 101, name: "Chelin", slot: "04:00 - 05:30 (Kamar Mandi 39)" }
];
let curfewTime = localStorage.getItem("conquest_curfew") || "21:30";
let totalXp = Number(localStorage.getItem("conquest_xp")) || 0;
let streakDays = Number(localStorage.getItem("conquest_streak")) || 1;
let lastActiveDate = localStorage.getItem("conquest_last_date") || new Date().toDateString();

const todayStr = new Date().toDateString();
if (lastActiveDate !== todayStr) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  streakDays = lastActiveDate === yesterday.toDateString() ? streakDays + 1 : 1;
  lastActiveDate = todayStr;
  schedules = schedules.map(s => ({ ...s, done: false }));
  saveData();
}

const scheduleForm = document.getElementById("scheduleForm");
const scheduleList = document.getElementById("scheduleList");
const filterCategory = document.getElementById("filterCategory");
const curfewTimeInput = document.getElementById("curfewTimeInput");
const facilityForm = document.getElementById("facilityForm");
const facilityList = document.getElementById("facilityList");

curfewTimeInput.value = curfewTime;

function saveData() {
  localStorage.setItem("conquest_schedules", JSON.stringify(schedules));
  localStorage.setItem("conquest_facilities", JSON.stringify(facilities));
  localStorage.setItem("conquest_curfew", curfewTime);
  localStorage.setItem("conquest_xp", String(totalXp));
  localStorage.setItem("conquest_streak", String(streakDays));
  localStorage.setItem("conquest_last_date", lastActiveDate);
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function detectConflicts(items) {
  const conflictIds = new Set();
  const sorted = [...items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (toMinutes(sorted[i].end) > toMinutes(sorted[i + 1].start)) {
      conflictIds.add(sorted[i].id);
      conflictIds.add(sorted[i + 1].id);
    }
  }
  return conflictIds;
}

function renderQuestHud() {
  const xpPerLevel = 100;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const currentLevelXp = totalXp % xpPerLevel;
  const ranks = ["Cadette", "Scout", "Vanguard", "Strategist", "Grandmaster"];
  const rankName = ranks[Math.min(level - 1, ranks.length - 1)];

  document.getElementById("levelBadge").textContent = `Lv. ${level} • ${rankName}`;
  document.getElementById("xpBarFill").style.width = `${currentLevelXp}%`;
  document.getElementById("xpText").textContent = `${currentLevelXp} / ${xpPerLevel} XP (Total ${totalXp}) • Streak ${streakDays}h`;

  const questList = document.getElementById("questList");
  questList.innerHTML = "";
  QUEST_MILESTONES.forEach(q => {
    const unlocked = q.check(schedules);
    const li = document.createElement("li");
    li.className = `quest-item ${unlocked ? "unlocked" : ""}`;
    li.innerHTML = `
      <div>
        <strong>${unlocked ? "✅" : "🔒"} ${q.title}</strong>
        <div class="task-meta">${q.desc}</div>
      </div>
      <span class="quest-badge-tag">${q.badge}</span>
    `;
    questList.appendChild(li);
  });
}

function renderSchedules() {
  const selectedFilter = filterCategory.value;
  const sorted = [...schedules].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const conflictIds = detectConflicts(sorted);

  const conflictAlert = document.getElementById("conflictAlert");
  conflictIds.size > 0 ? conflictAlert.classList.remove("hidden") : conflictAlert.classList.add("hidden");

  const filtered = selectedFilter === "Semua" ? sorted : sorted.filter(item => item.category === selectedFilter);
  scheduleList.innerHTML = "";

  if (filtered.length === 0) {
    scheduleList.innerHTML = `<p class="hint">Belum ada quest pada kategori ini.</p>`;
  } else {
    const categoryColors = {
      "Pelajaran Sekolah": "#2563eb",
      "Wajib Asrama": "#0d9488",
      "Ekskul": "#ea580c",
      "Piket": "#d97706",
      "Pribadi": "#7c3aed"
    };

    filtered.forEach(item => {
      const isConflict = conflictIds.has(item.id);
      const div = document.createElement("div");
      div.className = `schedule-item ${item.done ? "done" : ""} ${isConflict ? "conflict" : ""}`;
      if (!isConflict && categoryColors[item.category]) {
        div.style.borderLeftColor = categoryColors[item.category];
      }

      div.innerHTML = `
        <div class="schedule-left">
          <input type="checkbox" ${item.done ? "checked" : ""} onchange="toggleDone(${item.id})">
          <div>
            <span class="time-pill">${item.start} - ${item.end}</span>
            <span class="xp-pill">+${item.xp || 35} XP</span>
            <div class="task-title">${item.title}</div>
            <div class="task-meta">
              Kategori: <strong>${item.category}</strong>
              ${isConflict ? '<span class="conflict-tag">• Waktu Bentrok!</span>' : ''}
            </div>
          </div>
        </div>
        <button class="delete-mini" onclick="deleteSchedule(${item.id})" title="Hapus">✕</button>
      `;
      scheduleList.appendChild(div);
    });
  }

  updateProgress();
  renderQuestHud();
}

function updateProgress() {
  const total = schedules.length;
  const completed = schedules.filter(s => s.done).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  document.getElementById("progressText").textContent = `${completed} dari ${total} quest selesai (${percent}%)`;
  document.getElementById("progressBar").style.width = `${percent}%`;
}

scheduleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const category = document.getElementById("category").value;
  const xp = Number(document.getElementById("xpReward").value);

  if (toMinutes(end) <= toMinutes(start)) {
    alert("Waktu selesai harus lebih akhir daripada waktu mulai.");
    return;
  }

  schedules.push({ id: Date.now(), title, start, end, category, xp, done: false });
  saveData();
  renderSchedules();
  scheduleForm.reset();
});

function toggleDone(id) {
  schedules = schedules.map(item => {
    if (item.id === id) {
      const nextDone = !item.done;
      const deltaXp = item.xp || 35;
      totalXp = nextDone ? totalXp + deltaXp : Math.max(0, totalXp - deltaXp);
      return { ...item, done: nextDone };
    }
    return item;
  });
  saveData();
  renderSchedules();
}

function deleteSchedule(id) {
  const target = schedules.find(item => item.id === id);
  if (target && target.done) {
    totalXp = Math.max(0, totalXp - (target.xp || 35));
  }
  schedules = schedules.filter(item => item.id !== id);
  saveData();
  renderSchedules();
}

filterCategory.addEventListener("change", renderSchedules);

document.getElementById("resetTemplateBtn").addEventListener("click", () => {
  if (confirm("Reset quest kembali ke jadwal standar siswa SMA DHARMA WANITA 1 PARE?")) {
    schedules = [...DEFAULT_SCHEDULES];
    saveData();
    renderSchedules();
  }
});

function renderFacilities() {
  facilityList.innerHTML = "";
  facilities.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span><strong>${f.name}</strong> — ${f.slot}</span>
      <button class="delete-mini" onclick="deleteFacility(${f.id})">✕</button>
    `;
    facilityList.appendChild(li);
  });
}

facilityForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("roommateName").value.trim();
  const slot = document.getElementById("facilitySlot").value;
  if (facilities.some(f => f.slot === slot)) {
    alert("Slot ini sudah diambil teman sekamar!");
    return;
  }
  facilities.push({ id: Date.now(), name, slot });
  saveData();
  renderFacilities();
  document.getElementById("roommateName").value = "";
});

function deleteFacility(id) {
  facilities = facilities.filter(f => f.id !== id);
  saveData();
  renderFacilities();
}

curfewTimeInput.addEventListener("change", (e) => {
  curfewTime = e.target.value;
  saveData();
  updateClockAndCurfew();
});

function updateClockAndCurfew() {
  const now = new Date();
  document.getElementById("liveClock").textContent = now.toLocaleTimeString("id-ID", { hour12: false });
  document.getElementById("liveDate").textContent = now.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  document.getElementById("uniformBanner").textContent = UNIFORM_GUIDE[now.getDay()];

  const [ch, cm] = curfewTime.split(":").map(Number);
  const curfewDate = new Date();
  curfewDate.setHours(ch, cm, 0, 0);

  const diffMs = curfewDate - now;
  const countdownEl = document.getElementById("curfewCountdown");
  const statusEl = document.getElementById("curfewStatus");

  if (diffMs > 0) {
    const totalMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    countdownEl.textContent = `${hours} jam ${mins} menit menuju batas malam`;

    if (totalMins <= 30) {
      statusEl.className = "badge badge-warn";
      statusEl.textContent = "Siap-siap • Rapikan buku & kumpulkan HP!";
    } else {
      statusEl.className = "badge badge-safe";
      statusEl.textContent = "Aman • Masih waktu aktivitas/belajar";
    }
  } else {
    countdownEl.textContent = "Waktunya Istirahat / Lights Out";
    statusEl.className = "badge badge-danger";
    statusEl.textContent = "Batas Malam Berlaku • Wajib di kamar";
  }
}

renderSchedules();
renderFacilities();
updateClockAndCurfew();
setInterval(updateClockAndCurfew, 1000);
