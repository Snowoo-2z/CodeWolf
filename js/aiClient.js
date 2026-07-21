// Wolfy fonctionne en mode BYOK (Bring Your Own Key) : chaque utilisateur
// fournit sa propre clé, conservée uniquement dans son navigateur.
const PROVIDERS={
 openrouter:{key:'codewolf_key_openrouter',url:'https://openrouter.ai/api/v1/chat/completions',models:{free:'meta-llama/llama-3.3-70b-instruct:free',paid:'anthropic/claude-3.5-sonnet'},headers:k=>({Authorization:`Bearer ${k}`,'Content-Type':'application/json','HTTP-Referer':location.origin,'X-Title':'CodeWolf'})},
 openai:{key:'codewolf_key_openai',url:'https://api.openai.com/v1/chat/completions',models:{free:'gpt-4o-mini',paid:'gpt-4o'},headers:k=>({Authorization:`Bearer ${k}`,'Content-Type':'application/json'})}
};
export async function callWolfyAgent(history,memory,tier='free',reasoning=5,language='fr'){
 const system=`Tu es Wolfy, mentor expert en HTML, CSS et JavaScript. Réponds en ${language==='fr'?'français':'anglais'} avec bienveillance et précision. Profil: ${JSON.stringify(memory)}. Détail: ${reasoning}/20. Utilise Markdown.`;
 let last='aucune clé API configurée';
 for(const [name,p] of Object.entries(PROVIDERS)){
  const key=localStorage.getItem(p.key);if(!key)continue;
  try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);const res=await fetch(p.url,{method:'POST',signal:controller.signal,headers:p.headers(key),body:JSON.stringify({model:p.models[tier]||p.models.free,messages:[{role:'system',content:system},...history],temperature:.65})});clearTimeout(timer);if(!res.ok){last=`${name}: erreur ${res.status}`;continue}const data=await res.json();const text=data.choices?.[0]?.message?.content;if(text)return text}catch(e){last=e.name==='AbortError'?`${name}: délai dépassé`:e.message}
 }
 return `⚠️ Wolfy est hors ligne (${last}). Ouvre **Clés API** et ajoute ta propre clé OpenRouter ou OpenAI.`;
}