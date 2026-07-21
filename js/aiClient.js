// CodeWolf Advanced AI Client with Multi-Provider Priority & Automatic Fallback

export async function callWolfyAI(userMessage, studentMemory, modelTier, reasoningPower, userLang) {
  const openrouterKey = localStorage.getItem('codewolf_key_openrouter');
  const openaiKey = localStorage.getItem('codewolf_key_openai');
  const anthropicKey = localStorage.getItem('codewolf_key_anthropic');
  const geminiKey = localStorage.getItem('codewolf_key_gemini');
  const mistralKey = localStorage.getItem('codewolf_key_mistral');

  const priorityOrder = JSON.parse(localStorage.getItem('codewolf_provider_priority') || '["openrouter", "openai", "anthropic", "gemini", "mistral"]');

  // Check if at least one key exists
  const hasAnyKey = openrouterKey || openaiKey || anthropicKey || geminiKey || mistralKey;
  if (!hasAnyKey) {
    return userLang === 'fr' 
      ? "⚠️ **Aucune clé API détectée !** Veuillez cliquer sur **'🔑 Manage API Keys'** en haut pour ajouter au moins une clé API."
      : "⚠️ **No API key detected!** Please click **'🔑 Manage API Keys'** at the top to add at least one API key.";
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

  // Iterate through providers in user's priority order
  for (const provider of priorityOrder) {
    try {
      if (provider === 'openrouter' && openrouterKey) {
        // Free models requested by user: gpt-oss-20b, North-mini-code, Gemma 4 31B, Laguna M1 free
        // We will try user's selected free model or fallback among openrouter free models
        const freeModels = ['gpt-oss-20b', 'North-mini-code', 'Gemma 4 31B', 'Laguna M1 free', 'mistralai/mistral-7b-instruct:free'];
        const paidModels = ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'];
        const modelList = modelTier === 'free' ? freeModels : paidModels;

        for (const model of modelList) {
          try {
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
          } catch (e) {
            console.warn(`OpenRouter model ${model} failed, trying next...`);
          }
        }
      }

      if (provider === 'openai' && openaiKey) {
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
      }

      if (provider === 'anthropic' && anthropicKey) {
        // Anthropic messages API
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }]
          })
        });
        const data = await res.json();
        if (data.content && data.content[0]) {
          return data.content[0].text;
        }
      }

      if (provider === 'gemini' && geminiKey) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUser: " + userMessage }] }]
          })
        });
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      }

      if (provider === 'mistral' && mistralKey) {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mistralKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: messages
          })
        });
        const data = await res.json();
        if (data.choices && data.choices[0]) {
          return data.choices[0].message.content;
        }
      }

    } catch (err) {
      console.warn(`Provider ${provider} failed, fallback to next...`, err);
    }
  }

  return userLang === 'fr'
    ? "❌ Tous les fournisseurs API configurés ont échoué ou ne répondent pas. Vérifie tes clés."
    : "❌ All configured API providers failed or are unresponsive. Please check your keys.";
}
