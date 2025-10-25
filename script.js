import { verbs, GROUP_DESCRIPTIONS } from "./js/array-words.js";
// ===== ГЛОБАЛЬНИЙ СТАН =====
let correctAnswers = 0,
  allSentences = [],
  currentGroupData = [],
  currentTaskIndex = 0,
  currentMode = "home",
  currentGroupIndex = null;
const content = document.getElementById("content"),
  backBtn = document.getElementById("backBtn"),
  mainTitle = document.getElementById("mainTitle");

// ===== ДАНІ =====

// ===== ОЗВУЧЕННЯ =====
let availableVoices = [];
let selectedVoice = null;

// Завантажуємо голоси
function loadVoices() {
  availableVoices = speechSynthesis.getVoices();
  if (availableVoices.length > 0 && !selectedVoice) {
    selectedVoice =
      availableVoices.find((v) => v.lang === "en-US") || availableVoices[0];
  }
}

// Підвантаження голосів у Safari / мобільних
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// ГОЛОВНА ФУНКЦІЯ ОЗВУЧЕННЯ
function speak(text) {
  if (!selectedVoice) loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = selectedVoice?.lang || "en-US";
  u.voice = selectedVoice || null;
  u.rate = 0.9;
  u.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// 🔊 Розблокування озвучення на мобільних
function unlockTTS() {
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    speechSynthesis.speak(u);
    document.removeEventListener("click", unlockTTS);
    document.removeEventListener("touchstart", unlockTTS);
  } catch (e) {}
}

document.addEventListener("click", unlockTTS);
document.addEventListener("touchstart", unlockTTS);

// 🔽 Селектор голосів із можливістю прослухати
function populateVoiceSelector() {
  const container = document.createElement("div");
  container.id = "voiceSelectorContainer";
  container.className = "mb-4 text-center flex flex-col items-center";

  const label = document.createElement("label");
  label.textContent = "🎙 Оберіть голос:";
  label.className = "block text-sm text-gray-600 mb-1";
  container.appendChild(label);

  const row = document.createElement("div");
  row.className = "flex items-center gap-2";

  const select = document.createElement("select");
  select.className = "border rounded p-2 text-sm max-w-xs";
  select.id = "voiceSelect";

  availableVoices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${v.name} (${v.lang})`;
    select.appendChild(opt);
  });

  select.onchange = () => {
    selectedVoice = availableVoices[select.value];
  };

  // Кнопка "Прослухати голос"
  const previewBtn = document.createElement("button");
  previewBtn.textContent = "🎧 Прослухати";
  // ДОДАЄМО ID ДЛЯ ДИНАМІЧНОГО ПРИКРІПЛЕННЯ ОБРОБНИКА ПОДІЙ
  previewBtn.id = "previewVoiceBtn";
  previewBtn.className =
    "py-2 px-4 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition";

  // 🛑 ВИДАЛЕНО: previewBtn.onclick = () => { ... }
  // Це було джерелом ReferenceError, оскільки функція не була глобальною.

  row.appendChild(select);
  row.appendChild(previewBtn);
  container.appendChild(row);

  const app = document.getElementById("app");
  app.prepend(container);

  // 🛑 ВИКЛИКАЄМО ФУНКЦІЮ ДЛЯ ДИНАМІЧНОГО ПРИКРІПЛЕННЯ
  attachPreviewListener();
}

// ===== ПРИВ'ЯЗКА СЛУХАЧА ДЛЯ КНОПКИ ПРОСЛУХОВУВАННЯ =====
function attachPreviewListener() {
  const previewBtn = document.getElementById("previewVoiceBtn");
  const select = document.getElementById("voiceSelect");

  if (previewBtn && select) {
    previewBtn.addEventListener("click", () => {
      const voice = availableVoices[select.value];
      if (voice) {
        const sample = new SpeechSynthesisUtterance("Hello! This is my voice.");
        sample.voice = voice;
        sample.lang = voice.lang;
        speechSynthesis.cancel();
        speechSynthesis.speak(sample);
      }
    });
  }
}

// видалення блоку вибору голосу
function removeVoiceSelector() {
  const selectorElement = document.getElementById("voiceSelectorContainer");

  if (selectorElement) {
    // Викликаємо метод .remove() безпосередньо на елементі
    selectorElement.remove();
  }
}

// Коли голоси доступні — створюємо селектор
// speechSynthesis.onvoiceschanged = () => {
//   loadVoices();
//   populateVoiceSelector();
// };

// ===== КНОПКА НАЗАД =====
function updateBackButton(text, visible) {
  backBtn.textContent = text;
  backBtn.classList.toggle("hidden", !visible);
}
function handleBack() {
  if (["study", "drill", "test"].includes(currentMode))
    selectGroup(currentGroupIndex);
  else if (currentMode === "selectGroup") renderHome();
}

// ===== ГОЛОВНИЙ ЕКРАН =====
function renderHome() {
  currentMode = "home";
  updateBackButton("", false);
  mainTitle.textContent = "Виберіть блок для вивчення";

  populateVoiceSelector();

  let html = "";
  for (let i = 1; i <= 14; i++) {
    const count = verbs.filter((v) => v.group === i).length;

    // Отримуємо повний опис групи. Ми використовуємо i - 1, оскільки масив починається з 0.
    const groupDescription = GROUP_DESCRIPTIONS[i - 1];

    html += `
          <div data-group="${i}" class="block-selector p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-md cursor-pointer hover:bg-indigo-100 transition text-center">
            <h3 class="text-base md:text-lg font-semibold text-indigo-700">${groupDescription}</h3> 
            <p class="text-sm text-gray-600">${count} дієслів</p>
          </div>`;
  }
  content.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">${html}</div>`;

  // Прив'язуємо слухачів до щойно створених кнопок груп
  attachGroupSelectionListeners();
}

function attachGroupSelectionListeners() {
  // Знаходимо всі кнопки з класом 'block-selector'
  const groupButtons = document.querySelectorAll(".block-selector");

  groupButtons.forEach((button) => {
    // Отримуємо ID групи з атрибута data-group
    const groupId = parseInt(button.dataset.group);

    button.addEventListener("click", () => {
      // Викликаємо функцію selectGroup з коректної області видимості модуля
      selectGroup(groupId);
    });
  });
}

// ===== ВИБІР ГРУПИ =====
function selectGroup(groupId) {
  // Масив GROUP_DESCRIPTIONS має бути визначений глобально, як ми домовилися
  // const GROUP_DESCRIPTIONS = [...]

  // 1. Визначаємо повний опис групи
  const groupDescription = GROUP_DESCRIPTIONS[groupId - 1];

  removeVoiceSelector();
  currentGroupIndex = groupId;
  currentGroupData = verbs.filter((v) => v.group === groupId);
  currentMode = "selectGroup";
  updateBackButton("← На головну", true);

  // 2. ОНОВЛЮЄМО ЗАГОЛОВОК НА ПОВНИЙ ОПИС
  mainTitle.textContent = groupDescription;

  content.innerHTML = `
      <div class="space-y-3">
        <button id="studyBtn" class="w-full py-3 bg-emerald-500 text-white font-semibold rounded-lg">1️⃣ Вивчення</button>
        <button id="drillBtn" class="w-full py-3 bg-yellow-500 text-white font-semibold rounded-lg">2️⃣ Заучування</button>
        <button id="testBtn" class="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg">3️⃣ Тестування</button>
      </div>`;

  // Викликаємо функцію для прив'язки обробників
  attachModeListeners();
}
// ===== ПРИВ'ЯЗКА СЛУХАЧІВ ДЛЯ КНОПОК РЕЖИМІВ =====
function attachModeListeners() {
  const studyBtn = document.getElementById("studyBtn");
  const drillBtn = document.getElementById("drillBtn");
  const testBtn = document.getElementById("testBtn");

  studyBtn.addEventListener("click", renderStudyMode);
  drillBtn.addEventListener("click", renderDrillMode);
  testBtn.addEventListener("click", renderTestMode);
}

// ===== ВИВЧЕННЯ =====
function renderStudyMode() {
  currentMode = "study";
  updateBackButton("← До меню", true);
  mainTitle.textContent = `Вивчення блоку ${currentGroupIndex}`;

  const rows = currentGroupData
    .map((v) => {
      // Створюємо рядок слів для озвучення
      const textToSpeak = `${v.base}, ${v.past}, ${v.participle}`;

      return `
                    <tr class="border-b hover:bg-gray-50">
                        <td>${v.translation}</td><td>${v.base}</td><td>${v.past}</td><td>${v.participle}</td>
                        
                        <td>
                            <button class="speak-btn text-indigo-600 text-xl" data-text="${textToSpeak}">🔊</button>
                        </td>
                    </tr>
                `;
    })
    .join("");

  content.innerHTML = `<div class="overflow-x-auto"><table class="text-sm md:text-base border rounded-lg"><thead class="bg-indigo-100"><tr><th>Переклад</th><th>V1</th><th>V2</th><th>V3</th><th>Озвучення</th></tr></thead><tbody>${rows}</tbody></table></div>`;

  // ДОДАЄМО ВИКЛИК ФУНКЦІЇ ДЛЯ ПРИВ'ЯЗКИ СЛУХАЧІВ
  attachSpeakerListeners();
}

// ===== ПРИВ'ЯЗКА СЛУХАЧІВ ДЛЯ ОЗВУЧЕННЯ (НОВА) =====
function attachSpeakerListeners() {
  // Знаходимо всі кнопки з класом 'speak-btn'
  const speakerButtons = document.querySelectorAll(".speak-btn");

  speakerButtons.forEach((button) => {
    // Отримуємо текст для озвучення з атрибута data-text
    const text = button.dataset.text;

    button.addEventListener("click", () => {
      // Викликаємо функцію speak() з області видимості модуля
      speak(text);
    });
  });
}

// ===== ДРИЛ =====
function renderDrillMode() {
  currentMode = "drill";
  updateBackButton("← До меню", true);
  mainTitle.textContent = `Заучування ${currentGroupIndex}`;
  currentTaskIndex = 0;
  currentGroupData.sort(() => Math.random() - 0.5);
  nextDrillTask();
}
function nextDrillTask() {
  if (currentTaskIndex >= currentGroupData.length)
    return (content.innerHTML = `<div class="p-6 text-center text-green-700 font-bold text-lg">✅ Усі слова пройдено!</div>`);

  const v = currentGroupData[currentTaskIndex];

  content.innerHTML = `
  <div class="text-center">
    <p class="text-xl md:text-2xl font-bold text-yellow-700 mb-2">${v.translation}</p>
    <input id="b" class="border p-3 rounded w-full max-w-xs mb-2 text-center" placeholder="V1">
    <input id="p" class="border p-3 rounded w-full max-w-xs mb-2 text-center" placeholder="V2">
    <input id="pp" class="border p-3 rounded w-full max-w-xs mb-3 text-center" placeholder="V3">
    <div id="feed" class="mt-2 text-lg"></div>
    <button id="chk" class="w-full md:w-auto py-3 px-6 bg-yellow-500 text-white font-semibold rounded-lg">Перевірити</button>
  </div>`;

  const chk = document.getElementById("chk");
  chk.onclick = () => {
    const b = bEl("b"),
      p = bEl("p"),
      pp = bEl("pp");
    const f = document.getElementById("feed"); // ← ось тут зміна

    if (b === v.base && p === v.past && pp === v.participle) {
      f.innerHTML = "✅ Вірно!";
      f.className = "text-green-600";
    } else {
      f.innerHTML = `❌ Правильно: ${v.base} - ${v.past} - ${v.participle}`;
      f.className = "text-red-600";
    }

    chk.textContent = "Наступне слово →";
    chk.onclick = () => {
      currentTaskIndex++;
      nextDrillTask();
    };
  };
}
function bEl(id) {
  return document.getElementById(id).value.trim().toLowerCase();
}

// ===== ТЕСТ =====
function renderTestMode() {
  currentMode = "test";
  updateBackButton("← До меню", true);
  mainTitle.textContent = `Тест ${currentGroupIndex}`;
  initTest();
  nextTest();
}
function initTest() {
  allSentences = [];
  let i = 0;
  currentGroupData.forEach((v) => {
    allSentences.push({ ...v.exampleSentences[i], verbObject: v });
    i = (i + 1) % v.exampleSentences.length;
  });
  for (let i = allSentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allSentences[i], allSentences[j]] = [allSentences[j], allSentences[i]];
  }
  currentTaskIndex = 0;
  correctAnswers = 0;
}
function nextTest() {
  if (currentTaskIndex >= allSentences.length)
    return (content.innerHTML = `<div class="p-6 text-center text-lg md:text-xl text-green-600 font-bold">✅ Тест завершено! ${correctAnswers}/${allSentences.length}</div>`);
  const t = allSentences[currentTaskIndex];
  content.innerHTML = `
  <div class="text-center">
    <p class="italic text-gray-700 mb-2">${t.uk}</p>
    <p class="font-mono text-lg mb-4">${t.en}</p>
    <input id="ans" class="border p-3 rounded w-full max-w-xs mb-2 text-center" placeholder="Введіть слово">
    <div id="fb" class="mt-2 text-lg"></div>
    <button id="chk" class="w-full md:w-auto py-3 px-6 bg-emerald-500 text-white rounded-lg">Перевірити</button>
  </div>`;
  const ans = document.getElementById("ans"),
    chk = document.getElementById("chk"),
    fb = document.getElementById("fb");
  chk.onclick = () => {
    const a = ans.value.trim().toLowerCase(),
      corr = t.missingWord.toLowerCase();
    if (a === corr) {
      fb.textContent = "✅ Правильно!";
      fb.className = "text-green-600";
      correctAnswers++;
    } else {
      fb.textContent = `❌ Неправильно. ${corr}`;
      fb.className = "text-red-600";
    }
    chk.textContent = "Наступне речення →";
    chk.onclick = () => {
      currentTaskIndex++;
      nextTest();
    };
  };
}

// ===== СТАРТ =====
backBtn.onclick = handleBack;
window.onload = renderHome;
