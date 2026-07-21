// CodeWolf Dashboard & AI Coach Logic

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check authentication
  const user = await window.CodeWolfAuth.getUserSession();
  if (!user) {
    window.location.href = '/signin';
    return;
  }

  // 2. Check if username & AI name are chosen
  const username = localStorage.getItem('codewolf_username');
  const aiName = localStorage.getItem('codewolf_ai_name');
  if (!username || !aiName) {
    window.location.href = '/onboarding';
    return;
  }

  document.getElementById('userGreeting').textContent = `Hello, ${username} (AI: ${aiName})`;

  // 3. Check if at least 1 API key is configured
  checkApiKeys();

  // Customize welcome message with AI name
  document.getElementById('welcomeMessage').textContent = `Hello ${username}! I'm ${aiName}, your AI Coach. To start, could you honestly describe your current coding level? (Beginner, Intermediate, Advanced, Expert)`;
});

function checkApiKeys() {
  const keys = ['openrouter', 'openai', 'anthropic', 'gemini', 'mistral'];
  const hasKey = keys.some(k => localStorage.getItem(`codewolf_key_${k}`));

  if (!hasKey) {
    document.getElementById('apiKeyModal').style.display = 'flex';
  } else {
    document.getElementById('apiKeyModal').style.display = 'none';
  }
}

function openApiModal() {
  document.getElementById('apiKeyModal').style.display = 'flex';
}

function saveApiKeys() {
  const openrouter = document.getElementById('keyOpenRouter').value.trim();
  const openai = document.getElementById('keyOpenAI').value.trim();
  const anthropic = document.getElementById('keyAnthropic').value.trim();
  const gemini = document.getElementById('keyGemini').value.trim();
  const mistral = document.getElementById('keyMistral').value.trim();

  if (!openrouter && !openai && !anthropic && !gemini && !mistral) {
    alert('Please provide at least one API key to continue.');
    return;
  }

  if (openrouter) localStorage.setItem('codewolf_key_openrouter', openrouter);
  if (openai) localStorage.setItem('codewolf_key_openai', openai);
  if (anthropic) localStorage.setItem('codewolf_key_anthropic', anthropic);
  if (gemini) localStorage.setItem('codewolf_key_gemini', gemini);
  if (mistral) localStorage.setItem('codewolf_key_mistral', mistral);

  document.getElementById('apiKeyModal').style.display = 'none';
  alert('API keys saved successfully!');
}

async function sendUserMessage() {
  const input = document.getElementById('userInput');
  const chatBox = document.getElementById('chatBox');
  const text = input.value.trim();
  if (!text) return;

  // Append user message
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = text;
  chatBox.appendChild(userBubble);
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  const aiName = localStorage.getItem('codewolf_ai_name') || 'Coach';

  // 3-Step Simulation Request Flow (Thinking -> Preview -> Final Render)
  const aiBubble = document.createElement('div');
  aiBubble.className = 'chat-bubble ai';
  chatBox.appendChild(aiBubble);

  // Step 1: Réfléchir
  aiBubble.innerHTML = `<div class="sim-step">[1/3] ${aiName} is thinking & analyzing your level...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  await new Promise(r => setTimeout(r, 1200));

  // Step 2: Preview dans le ton
  aiBubble.innerHTML += `<div class="sim-step">[2/3] Preparing tailored response in tone...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  await new Promise(r => setTimeout(r, 1200));

  // Step 3: Rendu final
  let responseText = "";
  if (text.toLowerCase().includes('beginner') || text.toLowerCase().includes('débutant')) {
    responseText = `Got it! As a beginner, I'll guide you step-by-step with clear explanations, best practices, and patience. Let's build your first project together!`;
  } else if (text.toLowerCase().includes('intermediate') || text.toLowerCase().includes('intermédiaire')) {
    responseText = `Awesome! At an intermediate level, we can dive straight into architecture patterns, efficient debugging, and scalable code structures.`;
  } else {
    responseText = `Impressive! Advanced/Expert level detected. We will focus on high-performance optimization, system architecture, and advanced AI agent workflows.`;
  }

  aiBubble.innerHTML = `<strong>${aiName}:</strong> ${responseText}`;
  chatBox.scrollTop = chatBox.scrollHeight;
}
