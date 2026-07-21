export function parseAiJson(value){
 if(value&&typeof value==='object')return value;
 let text=String(value||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
 const attempts=[text,extractObject(text)].filter(Boolean);
 for(const candidate of attempts){
  try{return JSON.parse(candidate)}catch{}
  try{return JSON.parse(candidate.replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/,\s*([}\]])/g,'$1').replace(/^\uFEFF/,''))}catch{}
 }
 throw new SyntaxError(`Réponse JSON invalide. Début reçu : ${text.slice(0,140)}`);
}
function extractObject(text){
 let start=-1,depth=0,inString=false,escaped=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(start<0){if(c==='{'||c==='['){start=i;depth=1}continue}
  if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue}
  if(c==='"'){inString=true;continue}
  if(c==='{'||c==='[')depth++;
  else if(c==='}'||c===']'){depth--;if(depth===0)return text.slice(start,i+1)}
 }
 return start>=0?text.slice(start):'';
}
