// BYOK : chaque clé reste dans le navigateur de son propriétaire.
const PROVIDERS={
 openrouter:{key:'codewolf_key_openrouter',url:'https://openrouter.ai/api/v1/chat/completions',models:{free:'openrouter/free',paid:'anthropic/claude-sonnet-4'},headers:k=>({Authorization:`Bearer ${k}`,'Content-Type':'application/json','HTTP-Referer':location.origin,'X-Title':'CodeWolf'})},
 openai:{key:'codewolf_key_openai',url:'https://api.openai.com/v1/chat/completions',models:{free:'gpt-4o-mini',paid:'gpt-4o'},headers:k=>({Authorization:`Bearer ${k}`,'Content-Type':'application/json'})}
};
export async function callWolfyAgent(history,memory,tier='free',reasoning=5,language='fr',options={}){
 const system=`Tu es Wolfy, mentor expert en HTML, CSS et JavaScript. Réponds en ${language==='fr'?'français':'anglais'} avec bienveillance et précision. Profil: ${JSON.stringify(memory)}. Détail: ${reasoning}/20. ${options.json?'Tu dois produire exclusivement un objet JSON valide, sans Markdown, sans commentaire et sans texte avant ou après.':'Utilise Markdown.'}`;
 let last='aucune clé API configurée';
 for(const [name,p] of Object.entries(PROVIDERS)){const key=localStorage.getItem(p.key);if(!key)continue;try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);const body={model:p.models[tier]||p.models.free,messages:[{role:'system',content:system},...history],temperature:options.json?.15:.65};if(options.json)body.response_format={type:'json_object'};const res=await fetch(p.url,{method:'POST',signal:controller.signal,headers:p.headers(key),body:JSON.stringify(body)});clearTimeout(timer);if(!res.ok){let detail='';try{const err=await res.json();detail=err.error?.message||''}catch{}last=`${name}: erreur ${res.status}${detail?' — '+detail:''}`;continue}const data=await res.json(),text=data.choices?.[0]?.message?.content;if(text)return text;last=`${name}: réponse vide`}catch(e){last=e.name==='AbortError'?`${name}: délai dépassé`:e.message}}
 if(options.json)throw new Error(last);return `⚠️ Wolfy est hors ligne (${last}). Vérifie ta clé dans **Clés API**.`;
}
