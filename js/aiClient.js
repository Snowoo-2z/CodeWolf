// CodeWolf Bulletproof AI Client with #0001 Automatic Fallback Engine

export async function callWolfyAgent(messagesHistory, studentMemory, modelTier, reasoningPower, userLang) {
  const openrouterKey = localStorage.getItem('codewolf_key_openrouter');
  const openaiKey = localStorage.getItem('codewolf_key_openai');
  const anthropicKey = localStorage.getItem('codewolf_key_anthropic');
  const geminiKey = localStorage.getItem('codewolf_key_gemini');
  const mistralKey = localStorage.getItem('codewolf_key_mistral');

  const priorityOrder = JSON.parse(localStorage.getItem('codewolf_provider_priority') || '["openrouter", "openai", "anthropic", "gemini", "mistral"]');

  const hasAnyKey = openrouterKey || openaiKey || anthropicKey || geminiKey || mistralKey;
  if (!hasAnyKey) {
    return userLang === 'fr' 
      ? "⚠️ **Aucune clé API détectée !** Veuillez cliquer sur **'🔑 API Keys'** en haut pour ajouter au moins une clé API."
      : "⚠️ **No API key detected!** Please click **'🔑 API Keys'** at the top to add at least one API key.";
  }

  const systemPrompt = `You are Wolfy, an elite, highly addictive, and engaging AI HTML, CSS, and JavaScript Teacher & Coding Agent. 
Language: ${userLang === 'fr' ? 'French' : 'English'}.
Current Student Profile & Private Notebook: ${JSON.stringify(studentMemory)}.
Reasoning level: x${reasoningPower} (scale 1 to 20).
Your mission: 
1. Build an interactive, gamified learning path for the student.
2. Assign practical coding projects. When the student submits work, inspect every line of code meticulously, grade it constructively, and update your private notebook.
3. Keep the user hooked with micro-challenges, instant feedback, and clear code examples using Markdown.
Never break character. Always respond in Markdown format.`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messagesHistory
  ];

  // #0001 Automatic Fallback Engine across all providers and models
  for (const provider of priorityOrder) {
    try {
      // 1. OpenRouter with robust model fallback queue
      if (provider === 'openrouter' && openrouterKey) {
        const freeModels = [
          'gpt-oss-20b', 
          'North-mini-code', 
          'Gemma 4 31B', 
          'Laguna M1 free', 
          'mistralai/mistral-7b-instruct:free',
          'google/gemma-2-9b-it:free',
          'deepseek/deepseek-chat:free'
        ];
        const paidModels = [
          'anthropic/claude-3.5-sonnet', 
          'openai/gpt-4o',
          'deepseek/deepseek-chat'
        ];
        const modelList = modelTier === 'free' ? freeModels : paidModels;

        for (const model of modelList) {
          try {
            console.log(`[#0001 Fallback] Trying OpenRouter model: ${model}`);
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openrouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'CodeWolf Wolfy Agent'
              },
              body: JSON.stringify({
                model: model,
                messages: fullMessages,
                temperature: 0.7
              })
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content;
              }
            }
          } catch (modelErr) {
            console.warn(`[#0001 Fallback] OpenRouter model ${model} failed, switching to next model...`, modelErr);
          }
        }
      }

      // 2. OpenAI Provider
      if (provider === 'openai' && openaiKey) {
        try {
          console.log(`[#0001 Fallback] Trying OpenAI...`);
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: fullMessages,
              temperature: 0.7
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.choices && data.choices[0]?.message?.content) {
              return data.choices[0].message.content;
            }
          }
        } catch (openaiErr) {
          console.warn(`[#0001 Fallback] OpenAI failed, switching provider...`, openaiErr);
        }
      }

      // 3. Anthropic Provider
      if (provider === 'anthropic' && anthropicKey) {
        try {
          console.log(`[#0001 Fallback] Trying Anthropic...`);
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
              max_tokens: 1500,
              system: systemPrompt,
              messages: messagesHistory
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.content && data.content[0]?.text) {
              return data.content[0].text;
            }
          }
        } catch (anthropicErr) {
          console.warn(`[#0001 Fallback] Anthropic failed, switching provider...`, anthropicErr);
        }
      }

      // 4. Gemini Provider
      if (provider === 'gemini' && geminiKey) {
        try {
          console.log(`[#0001 Fallback] Trying Google Gemini...`);
          const contents = messagesHistory.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: contents
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
              return data.candidates[0].content.parts[0].text;
            }
          }
        } catch (geminiErr) {
          console.warn(`[#0001 Fallback] Gemini failed, switching provider...`, geminiErr);
        }
      }

      // 5. Mistral Provider
      if (provider === 'mistral' && mistralKey) {
        try {
          console.log(`[#0001 Fallback] Trying Mistral...`);
          const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mistralKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'mistral-small-latest',
              messages: fullMessages
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.choices && data.choices[0]?.message?.content) {
              return data.choices[0].message.content;
            }
          }
        } catch (mistralErr) {
          console.warn(`[#0001 Fallback] Mistral failed...`, mistralErr);
        }
      }

    } catch (err) {
      console.warn(`[#0001 Fallback] Provider loop caught error:`, err);
    }
  }

  // Ultimate graceful fallback if all models/providers failed
  return userLang === 'fr'
    ? "⚠️ **Protocole de secours #0001** : Tous les modèles testés ont rencontré une indisponibilité momentanée. Vérifie ta connexion ou tes clés API."
    : "⚠️ **Fallback Protocol #0001**: All tested models experienced momentary unavailability. Please check your network or API keys.";
}
