// CodeWolf Studio Dashboard & Multi-File Agent Logic
import { callWolfyAgent } from './aiClient.js';
import { pushToGitHub } from './githubSync.js';
import { syncUserXpToSupabase, fetchGlobalLeaderboard } from './supabaseClient.js';

let studentMemory = {
  level: "Unknown",
  curriculumStep: 1,
  goals: "Master Web Dev",
  progress: 0,
  xp: 120
};

let conversationHistory = [];
let userLang = 'en';

let files = {
  'index.html': `<div class="quest-card">\n  <h2>Wolfy's Quest #1</h2>\n  <p>Create a stunning futuristic badge in HTML!</p>\n</div>`,
  'style.css': `body {\n  font-family: system-ui;\n  background: #0a0f1d;\n  color: #00e7e0;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}\n.quest-card {\n  background: #17213b;\n  padding: 30px;\n  border-radius: 16px;\n  border: 1px solid #00e7e0;\n  box-shadow: 0 0 20px rgba(0,231,224,0.2);\n}`,
  'script.js': `console.log("Multi-file workspace ready!");`
};
let activeFileName = 'index.html';

function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.CodeWolfAuth.getUserSession();
  if (!user) {
    window.location.href = '/signin';
    return;
  }

  const navLang = navigator.language || navigator.userLanguage || 'en';
  userLang = navLang.startsWith('fr') ? 'fr' : 'en';

  const savedMem = localStorage.getItem('codewolf_student_memory');
  if (savedMem) {
    try { studentMemory = JSON.parse(savedMem); } catch(e) {}
  }
  updateMemoryUI();
  updatePopoverBadge();
  checkApiKeysOnStart();
  renderFileExplorer();
  switchFile('index.html');
  updateLivePreview();

  // Initial Supabase XP Sync
  const username = localStorage.getItem('codewolf_username') || user.email?.split('@')[0] || 'Developer';
  syncUserXpToSupabase(username, studentMemory.xp, studentMemory.level);
});

function checkApiKeysOnStart() {
  const keys = ['openrouter', 'openai', 'anthropic', 'gemini', 'mistral'];
  const hasKey = keys.some(k => localStorage.getItem(`codewolf_key_${k}`));
  if (!hasKey) {
    openApiModal();
  }
}

function answerCall() {
  document.getElementById('callScreen').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('callScreen').style.display = 'none';
    startWolfyAgentSession();
  }, 400);
}

function startWolfyAgentSession() {
  let welcomeText = userLang === 'fr' 
    ? "Salut ! Je suis **Wolfy**, ton agent et professeur personnel. Bienvenue dans ton studio multi-fichiers. Tu peux utiliser **✨ Auto-Correction** ou me demander une leçon !"
    : "Hey! I'm **Wolfy**, your personal AI Agent & Teacher. Welcome to your multi-file studio. You can use **✨ Auto-Correction** or ask me for a lesson!";

  appendMessage('wolfy', welcomeText);
  conversationHistory.push({ role: 'assistant', content: welcomeText });
}

function appendMessage(sender, markdownText) {
  const chatMessages = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = `message-row ${sender}`;
  
  if (sender === 'wolfy') {
    const avatar = document.createElement('img');
    avatar.src = '/assets/wolfy.svg';
    avatar.className = 'wolfy-avatar-icon';
    row.appendChild(avatar);
  }

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  
  if (sender === 'wolfy') {
    msgDiv.innerHTML = marked.parse(markdownText);
  } else {
    msgDiv.textContent = markdownText;
  }
  row.appendChild(msgDiv);

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateMemoryUI() {
  document.getElementById('memoryBox').textContent = JSON.stringify(studentMemory, null, 2);
  const xp = studentMemory.xp || 120;
  document.getElementById('userXp').textContent = xp;
  document.getElementById('lbXp').textContent = xp;
  const username = localStorage.getItem('codewolf_username') || 'You';
  document.getElementById('lbUsername').textContent = username;
  
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`curr_${i}`);
    if (el) {
      if (i < studentMemory.curriculumStep) {
        el.className = 'curriculum-item completed';
      } else if (i === studentMemory.curriculumStep) {
        el.className = 'curriculum-item active';
      } else {
        el.className = 'curriculum-item';
      }
    }
  }

  if (studentMemory.curriculumStep >= 2) document.getElementById('badgeCss').style.opacity = '1';
  if (studentMemory.curriculumStep >= 3) document.getElementById('badgeJs').style.opacity = '1';

  // Sync to Supabase in background
  syncUserXpToSupabase(username, xp, studentMemory.level);
}

function renderFileExplorer() {
  const explorer = document.getElementById('fileExplorerList');
  const tabsContainer = document.getElementById('fileTabsContainer');
  explorer.innerHTML = '';
  tabsContainer.innerHTML = '';

  for (const filename of Object.keys(files)) {
    const item = document.createElement('div');
    item.className = `file-tree-item ${filename === activeFileName ? 'active' : ''}`;
    item.innerHTML = `<span>📄 ${filename}</span>`;
    item.onclick = () => switchFile(filename);
    explorer.appendChild(item);

    const tab = document.createElement('div');
    tab.className = `editor-tab ${filename === activeFileName ? 'active' : ''}`;
    tab.textContent = filename;
    tab.onclick = () => switchFile(filename);
    tabsContainer.appendChild(tab);
  }
}

function switchFile(filename) {
  if (!files[filename]) return;
  activeFileName = filename;
  document.getElementById('activeFileTextarea').value = files[filename];
  renderFileExplorer();
}

function updateCurrentFileContent(content) {
  files[activeFileName] = content;
  updateLivePreview();
}

function createNewFileModal() {
  const filename = prompt("Enter new filename (e.g. about.html, style2.css):");
  if (!filename) return;
  if (files[filename]) {
    alert("File already exists!");
    return;
  }
  files[filename] = `// New file ${filename}`;
  switchFile(filename);
  renderFileExplorer();
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });
  input.value = '';

  const reasoningPower = parseInt(document.getElementById('reasoningSlider').value);
  const modelTier = document.getElementById('modelTier').value;

  const chatMessages = document.getElementById('chatMessages');
  const thinkingId = 'thinking_' + Date.now();
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = thinkingId;
  thinkingDiv.className = 'thinking-indicator';
  thinkingDiv.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> Wolfy is crafting response (x${reasoningPower})...`;
  chatMessages.appendChild(thinkingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const aiResponse = await callWolfyAgent(conversationHistory, studentMemory, modelTier, reasoningPower, userLang);

  document.getElementById(thinkingId)?.remove();

  conversationHistory.push({ role: 'assistant', content: aiResponse });
  appendMessage('wolfy', aiResponse);

  studentMemory.xp += 10;
  localStorage.setItem('codewolf_student_memory', JSON.stringify(studentMemory));
  updateMemoryUI();
}

async function requestNewLesson() {
  const promptText = userLang === 'fr' 
    ? "Wolfy, génère-moi une nouvelle leçon interactive et un défi de code pour l'étape actuelle de mon apprentissage !"
    : "Wolfy, generate a brand new interactive lesson and coding challenge for my current learning step!";
  
  document.getElementById('userInput').value = promptText;
  sendMessage();
}

async function requestHint() {
  const promptText = userLang === 'fr' 
    ? "Wolfy, je suis bloqué. Peux-tu me donner un indice sans me donner directement la solution ?"
    : "Wolfy, I'm stuck. Can you give me a hint without giving away the direct solution?";
  
  document.getElementById('userInput').value = promptText;
  sendMessage();
}

async function autoFixCode() {
  const promptText = `[AUTO-FIX REQUEST]\nPlease analyze the current code in ${activeFileName}:\n\`\`\`\n${files[activeFileName]}\n\`\`\`\nProvide the fully corrected and refactored code for this file inside a clean markdown code block so it can be automatically applied.`;

  appendMessage('user', userLang === 'fr' ? "✨ [Demande d'auto-correction à Wolfy...]" : "✨ [Requesting auto-fix from Wolfy...]");
  conversationHistory.push({ role: 'user', content: promptText });

  const reasoningPower = parseInt(document.getElementById('reasoningSlider').value);
  const modelTier = document.getElementById('modelTier').value;

  const chatMessages = document.getElementById('chatMessages');
  const thinkingId = 'thinking_' + Date.now();
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = thinkingId;
  thinkingDiv.className = 'thinking-indicator';
  thinkingDiv.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"></circle></svg> Wolfy is auto-correcting your code...`;
  chatMessages.appendChild(thinkingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const aiResponse = await callWolfyAgent(conversationHistory, studentMemory, modelTier, reasoningPower, userLang);
  document.getElementById(thinkingId)?.remove();

  conversationHistory.push({ role: 'assistant', content: aiResponse });
  appendMessage('wolfy', aiResponse);

  const codeBlockMatch = aiResponse.match(/```[\w]*\n([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const fixedCode = codeBlockMatch[1].trim();
    files[activeFileName] = fixedCode;
    switchFile(activeFileName);
    playSuccessChime();
    alert(userLang === 'fr' ? "✨ Code auto-corrigé et appliqué avec succès !" : "✨ Code auto-corrected and applied successfully!");
  }
}

async function submitWorkToWolfy() {
  const submissionPrompt = `[STUDENT WORK SUBMISSION]\nThe student has submitted their multi-file project for step ${studentMemory.curriculumStep}:\n\n` + 
    Object.entries(files).map(([name, code]) => `--- ${name} ---\n${code}`).join('\n\n') +
    `\nPlease inspect every line of this code meticulously, grade it constructively (0-100), give precise feedback, decide if the student passes to the next curriculum step, and update your private notebook.`;

  appendMessage('user', userLang === 'fr' ? "🚀 [J'ai envoyé mon travail multi-fichiers à Wolfy pour inspection !]" : "🚀 [I have submitted my multi-file work to Wolfy for inspection!]");
  conversationHistory.push({ role: 'user', content: submissionPrompt });

  const reasoningPower = parseInt(document.getElementById('reasoningSlider').value);
  const modelTier = document.getElementById('modelTier').value;

  const chatMessages = document.getElementById('chatMessages');
  const thinkingId = 'thinking_' + Date.now();
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = thinkingId;
  thinkingDiv.className = 'thinking-indicator';
  thinkingDiv.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"></circle></svg> Wolfy is inspecting your multi-file code...`;
  chatMessages.appendChild(thinkingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const aiResponse = await callWolfyAgent(conversationHistory, studentMemory, modelTier, reasoningPower, userLang);
  document.getElementById(thinkingId)?.remove();

  conversationHistory.push({ role: 'assistant', content: aiResponse });
  appendMessage('wolfy', aiResponse);

  playSuccessChime();
  if (window.confetti) {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }

  studentMemory.curriculumStep = Math.min(4, studentMemory.curriculumStep + 1);
  studentMemory.xp += 50;
  localStorage.setItem('codewolf_student_memory', JSON.stringify(studentMemory));
  updateMemoryUI();
}

function updateLivePreview() {
  const html = files['index.html'] || files[Object.keys(files).find(f => f.endsWith('.html'))] || '';
  const css = files['style.css'] || files[Object.keys(files).find(f => f.endsWith('.css'))] || '';
  const js = files['script.js'] || files[Object.keys(files).find(f => f.endsWith('.js'))] || '';

  const preview = document.getElementById('livePreview');

  const fullContent = `
    <!DOCTYPE html>
    <html>
    <head><style>${css}</style></head>
    <body>
      ${html}
      <script>
        const originalLog = console.log;
        console.log = function(...args) {
          originalLog.apply(console, args);
          window.parent.postMessage({ type: 'console', message: args.join(' ') }, '*');
        };
        window.onerror = function(msg) {
          window.parent.postMessage({ type: 'console', message: 'Error: ' + msg }, '*');
        };
      </script>
      <script>${js}</script>
    </body>
    </html>
  `;
  preview.srcdoc = fullContent;
}

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'console') {
    const consolePane = document.getElementById('consolePane');
    if (consolePane) {
      consolePane.innerHTML += `<div>> ${e.data.message}</div>`;
      consolePane.scrollTop = consolePane.scrollHeight;
    }
  }
});

async function openLeaderboard() {
  document.getElementById('leaderboardModal').style.display = 'flex';
  const leaderboardData = await fetchGlobalLeaderboard();
  
  const tbody = document.getElementById('leaderboardBody');
  tbody.innerHTML = '';

  leaderboardData.forEach((row, index) => {
    const tr = document.createElement('tr');
    if (row.username === (localStorage.getItem('codewolf_username') || 'You')) {
      tr.style.background = 'rgba(99,102,241,0.15)';
    }
    tr.innerHTML = `<td>${index + 1}</td><td>${row.username}</td><td>${row.level || 'Student'}</td><td>${row.xp} XP</td>`;
    tbody.appendChild(tr);
  });
}

function openGitHubModal() {
  document.getElementById('githubModal').style.display = 'flex';
  document.getElementById('githubTokenInput').value = localStorage.getItem('codewolf_github_token') || '';
}

async function saveGitHubSettings() {
  const token = document.getElementById('githubTokenInput').value.trim();
  if (!token) {
    alert("Please enter a valid GitHub Personal Access Token.");
    return;
  }
  localStorage.setItem('codewolf_github_token', token);
  document.getElementById('githubModal').style.display = 'none';
  alert("GitHub Token saved successfully!");
  syncToGitHubRepo();
}

async function syncToGitHubRepo() {
  const token = localStorage.getItem('codewolf_github_token');
  if (!token) {
    openGitHubModal();
    return;
  }

  const repoName = document.getElementById('repoNameInput')?.value || 'codewolf-project';
  try {
    const repoUrl = await pushToGitHub(files, repoName);
    alert(`Successfully pushed to private GitHub repository!\n${repoUrl}`);
  } catch (err) {
    alert(`GitHub Push Error: ${err.message}`);
  }
}

function openApiModal() {
  document.getElementById('apiKeyModal').style.display = 'flex';
  document.getElementById('keyOpenRouter').value = localStorage.getItem('codewolf_key_openrouter') || '';
  document.getElementById('keyOpenAI').value = localStorage.getItem('codewolf_key_openai') || '';
}

function closeApiModal() {
  document.getElementById('apiKeyModal').style.display = 'none';
}

function saveApiKeys() {
  const openrouter = document.getElementById('keyOpenRouter').value.trim();
  const openai = document.getElementById('keyOpenAI').value.trim();

  if (!openrouter && !openai) {
    alert('Please provide at least one API key.');
    return;
  }

  if (openrouter) localStorage.setItem('codewolf_key_openrouter', openrouter);
  if (openai) localStorage.setItem('codewolf_key_openai', openai);

  closeApiModal();
  alert('API keys saved successfully!');
}

function toggleModelPopover() {
  document.getElementById('modelPopover').classList.toggle('active');
}

function updatePopoverBadge() {
  const tier = document.getElementById('modelTier').value;
  const reasoning = document.getElementById('reasoningSlider').value;
  document.getElementById('popoverBadge').textContent = `${tier === 'free' ? 'Free' : 'Paid'} • x${reasoning}`;
}

window.answerCall = answerCall;
window.openApiModal = openApiModal;
window.closeApiModal = closeApiModal;
window.saveApiKeys = saveApiKeys;
window.toggleModelPopover = toggleModelPopover;
window.updatePopoverBadge = updatePopoverBadge;
window.sendMessage = sendMessage;
window.submitWorkToWolfy = submitWorkToWolfy;
window.requestNewLesson = requestNewLesson;
window.requestHint = requestHint;
window.autoFixCode = autoFixCode;
window.openGitHubModal = openGitHubModal;
window.saveGitHubSettings = saveGitHubSettings;
window.syncToGitHubRepo = syncToGitHubRepo;
window.createNewFileModal = createNewFileModal;
window.switchFile = switchFile;
window.updateCurrentFileContent = updateCurrentFileContent;
window.openLeaderboard = openLeaderboard;
