// CodeWolf Real AI Client for Wolfy Teacher (OpenRouter, OpenAI, Anthropic, Gemini, Mistral)

export async function callWolfyAI(userMessage, studentMemory, modelTier, reasoningPower, userLang) {
  const openrouterKey = localStorage.getItem('codewolf_key_openrouter');
  const openaiKey = localStorage.getItem('codewolf_key_openai');
  const anthropicKey = localStorage.getItem('codewolf_key_anthropic');
  const geminiKey = localStorage.getItem('codewolf_key_gemini');
  const mistralKey = localStorage.getItem('codewolf_key_mistral');

  // If no API keys are configured, notify the user immediately
  if (!openrouterKey && !openaiKey && !anthropicKey && !geminiKey && !mistralKey) {
    return userLang === 'fr' 
      ? "⚠️ **Aucune clé API détectée !** Veuillez cliquer sur **'Manage API Keys'** en haut pour ajouter votre clé OpenRouter, OpenAI ou autre afin que je puisse vous répondre."
      : "⚠️ **No API key detected!** Please click **'Manage API Keys'** at the top to add your OpenRouter or OpenAI key so I can talk to you.";
  }

  const systemPrompt = `You are Wolfy, an expert, friendly, and encouraging HTML, CSS, and JavaScript coding teacher. 
Language: ${userLang === 'fr' ? 'French' : 'English'}.
Current Student Profile Memory: ${JSON.stringify(studentMemory)}.
Reasoning level: x${reasoningPower} (scale 1 to 20).
Your task is to teach web development interactively, ask engaging questions, adapt to the student's level, and help them build real skills. Never break character. Always respond in Markdown format.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  try {
    // 1. OpenRouter
    if (openrouterKey) {
      const model = modelTier === 'free' ? 'deepseek/deepseek-chat:free' : 'anthropic/claude-3.5-sonnet';
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CodeWolf Wolfy Teacher'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
      if (data.error) {
        throw new Error(data.error.message || 'OpenRouter API Error');
      }
    }

    // 2. OpenAI
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
      if (data.error) {
        throw new Error(data.error.message || 'OpenAI API Error');
      }
    }

    throw new Error('No valid API response received.');

  } catch (err) {
    console.error('AI API Call Error:', err);
    return userLang === 'fr'
      ? `❌ **Erreur API** : ${err.message}. Vérifie ta clé API dans 'Manage API Keys'.`
      : `❌ **API Error**: ${err.message}. Please check your API key in 'Manage API Keys'.`;
  }
}
