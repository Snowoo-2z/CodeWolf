// Wolfy AI Teacher Dashboard Logic

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
});

function answerCall() {
  document.getElementById('callScreen').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('callScreen').style.display = 'none';
    startWolfySession();
  }, 400);
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

  // Show "Wolfy is reflecting..." with reasoning multiplier
  const chatMessages = document.getElementById('chatMessages');
  const thinkingId = 'thinking_' + Date.now();
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = thinkingId;
  thinkingDiv.className = 'thinking-indicator';
  thinkingDiv.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> Wolfy is reflecting (Reasoning x${reasoningPower}, ${modelTier} model)...`;
  chatMessages.appendChild(thinkingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Simulate AI response delay proportional to reasoning power
  const delay = Math.min(800 + (reasoningPower * 100), 4000);
  await new Promise(r => setTimeout(r, delay));

  // Remove thinking indicator
  document.getElementById(thinkingId)?.remove();

  // Generate response
  let response = "";
  if (userLang === 'fr') {
    response = `C'est noté ! En tant que **Wolfy**, j'analyse ton niveau avec une puissance de raisonnement de **x${reasoningPower}**. Ta fiche de mémoire a été mise à jour. Que souhaites-tu aborder maintenant en HTML, CSS ou JavaScript ?`;
  } else {
    response = `Got it! As **Wolfy**, I've processed your message using reasoning power **x${reasoningPower}** (${modelTier} tier). Your student memory has been updated. What topic in HTML, CSS, or JS should we tackle next?`;
  }

  // 3x Self-Check verification simulation (repeated reasoningPower times for rigorous self-check)
  for (let pass = 0; pass < 3; pass++) {
    studentMemory.progress = Math.min(100, studentMemory.progress + (reasoningPower * 2));
  }
  studentMemory.level = text;
  localStorage.setItem('codewolf_student_memory', JSON.stringify(studentMemory));
  updateMemoryUI();

  appendMessage('wolfy', response);
}
