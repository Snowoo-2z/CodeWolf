// Wolfy AI Teacher Dashboard Logic
import { callWolfyAI } from './aiClient.js';

let studentMemory = {
  level: "Unknown",
  strengths: [],
  weaknesses: [],
  goals: "Learn HTML, CSS & JS",
  mood: "Motivated"
};

let userLang = 'en';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.CodeWolfAuth.getUserSession();
  if (!user) {
    window.location.href = '/signin';
    return;
  }

  // Detect browser language
  const navLang = navigator.language || navigator.userLanguage || 'en';
  userLang = navLang.startsWith('fr') ? 'fr' : 'en';
  document.getElementById('detectedLang').textContent = `Lang: ${userLang.toUpperCase()}`;

  // Load saved student memory if exists
  const savedMem = localStorage.getItem('codewolf_student_memory');
  if (savedMem) {
    try { studentMemory = JSON.parse(savedMem); } catch(e) {}
  }
  updateMemoryUI();
  updatePopoverBadge();

  // Check if API keys are configured, if not prompt
  checkApiKeysOnStart();
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
    startWolfySession();
  }, 400);
}

function openApiModal() {
  document.getElementById('apiKeyModal').style.display = 'flex';
  document.getElementById('keyOpenRouter').value = localStorage.getItem('codewolf_key_openrouter') || '';
  document.getElementById('keyOpenAI').value = localStorage.getItem('codewolf_key_openai') || '';
  document.getElementById('keyAnthropic').value = localStorage.getItem('codewolf_key_anthropic') || '';
  document.getElementById('keyGemini').value = localStorage.getItem('codewolf_key_gemini') || '';
  document.getElementById('keyMistral').value = localStorage.getItem('codewolf_key_mistral') || '';
  
  const currentPriority = JSON.parse(localStorage.getItem('codewolf_provider_priority') || '["openrouter"]')[0];
  if (currentPriority) {
    document.getElementById('primaryProvider').value = currentPriority;
  }
}

function closeApiModal() {
  document.getElementById('apiKeyModal').style.display = 'none';
}

function saveApiKeys() {
  const primary = document.getElementById('primaryProvider').value;
  const openrouter = document.getElementById('keyOpenRouter').value.trim();
  const openai = document.getElementById('keyOpenAI').value.trim();
  const anthropic = document.getElementById('keyAnthropic').value.trim();
  const gemini = document.getElementById('keyGemini').value.trim();
  const mistral = document.getElementById('keyMistral').value.trim();

  if (!openrouter && !openai && !anthropic && !gemini && !mistral) {
    alert('Please provide at least one API key.');
    return;
  }

  // Set priority order putting chosen primary first, then others
  const allProviders = ['openrouter', 'openai', 'anthropic', 'gemini', 'mistral'];
  const priority = [primary, ...allProviders.filter(p => p !== primary)];
  localStorage.setItem('codewolf_provider_priority', JSON.stringify(priority));

  if (openrouter) localStorage.setItem('codewolf_key_openrouter', openrouter);
  else localStorage.removeItem('codewolf_key_openrouter');

  if (openai) localStorage.setItem('codewolf_key_openai', openai);
  else localStorage.removeItem('codewolf_key_openai');

  if (anthropic) localStorage.setItem('codewolf_key_anthropic', anthropic);
  else localStorage.removeItem('codewolf_key_anthropic');

  if (gemini) localStorage.setItem('codewolf_key_gemini', gemini);
  else localStorage.removeItem('codewolf_key_gemini');

  if (mistral) localStorage.setItem('codewolf_key_mistral', mistral);
  else localStorage.removeItem('codewolf_key_mistral');

  closeApiModal();
  alert('API settings saved successfully!');
}

function toggleModelPopover() {
  const popover = document.getElementById('modelPopover');
  popover.classList.toggle('active');
}

function updatePopoverBadge() {
  const tier = document.getElementById('modelTier').value;
  const reasoning = document.getElementById('reasoningSlider').value;
  const tierName = tier === 'free' ? 'Free' : 'Paid';
  document.getElementById('popoverBadge').textContent = `${tierName} • Reasoning x${reasoning}`;
}

function startWolfySession() {
  const chatMessages = document.getElementById('chatMessages');
  
  let welcomeText = userLang === 'fr' 
    ? "Salut ! Je suis **Wolfy**, ton professeur d'HTML, CSS et JavaScript. Je vais t'accompagner pas à pas. Pour commencer, dis-moi : quel est ton niveau actuel en programmation web ? (Débutant, Intermédiaire, Avancé...)"
    : "Hey! I'm **Wolfy**, your HTML, CSS, and JavaScript teacher. I'll guide you step by step. To start, tell me: what is your current web development skill level? (Beginner, Intermediate, Advanced...)";

  appendMessage('wolfy', welcomeText);
}

function appendMessage(sender, markdownText) {
  const chatMessages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  
  if (sender === 'wolfy') {
    div.innerHTML = marked.parse(markdownText);
  } else {
    div.textContent = markdownText;
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateMemoryUI() {
  document.getElementById('memoryBox').textContent = JSON.stringify(studentMemory, null, 2);
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  appendMessage('user', text);
  input.value = '';

  const reasoningPower = parseInt(document.getElementById('reasoningSlider').value);
  const modelTier = document.getElementById('modelTier').value;

  const chatMessages = document.getElementById('chatMessages');
  const thinkingId = 'thinking_' + Date.now();
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = thinkingId;
  thinkingDiv.className = 'thinking-indicator';
  thinkingDiv.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> Wolfy is reflecting (Reasoning x${reasoningPower}, ${modelTier} model)...`;
  chatMessages.appendChild(thinkingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Call real AI API with automatic multi-provider fallback
  const aiResponse = await callWolfyAI(text, studentMemory, modelTier, reasoningPower, userLang);

  document.getElementById(thinkingId)?.remove();

  // 3x Self-Check verification simulation
  for (let pass = 0; pass < 3; pass++) {
    studentMemory.progress = Math.min(100, studentMemory.progress + (reasoningPower * 2));
  }
  studentMemory.level = text;
  localStorage.setItem('codewolf_student_memory', JSON.stringify(studentMemory));
  updateMemoryUI();

  appendMessage('wolfy', aiResponse);
}

window.answerCall = answerCall;
window.openApiModal = openApiModal;
window.closeApiModal = closeApiModal;
window.saveApiKeys = saveApiKeys;
window.toggleModelPopover = toggleModelPopover;
window.updatePopoverBadge = updatePopoverBadge;
window.sendMessage = sendMessage;
