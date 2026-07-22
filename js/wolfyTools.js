export function createWolfyTools(context){return {
 list_files:async()=>Object.keys(context.getFiles()).map(name=>({name,characters:context.getFiles()[name].length})),
 read_file:async({path})=>{const files=context.getFiles();if(!(path in files))throw Error(`Fichier introuvable: ${path}`);return {path,content:files[path]}},
 read_active_file:async()=>{const path=context.getActiveFile();return {path,content:context.getFiles()[path]||''}},
 read_console:async()=>({output:context.getConsole().slice(-6000)}),
 get_current_challenge:async()=>{try{return JSON.parse(localStorage.getItem('codewolf_current_challenge')||'null')}catch{return null}},
 run_tests:async()=>context.runTests()
}}
export function toolInstructions(){return `Tu disposes d'outils locaux. Si une information te manque, réponds UNIQUEMENT avec un ou plusieurs appels au format <tool_call>{"name":"read_file","arguments":{"path":"index.html"}}</tool_call>. Outils: list_files, read_file(path), read_active_file, read_console, get_current_challenge, run_tests. N'invente jamais le résultat d'un outil. Après réception des résultats, réponds normalement en Markdown.`}
export function parseToolCalls(text){const calls=[];for(const match of String(text).matchAll(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi)){try{const call=JSON.parse(match[1]);if(call?.name)calls.push({name:call.name,arguments:call.arguments||{}})}catch{}}return calls}
export async function executeToolCalls(calls,tools){const results=[];for(const call of calls.slice(0,5)){try{if(!tools[call.name])throw Error('Outil non autorisé');results.push({name:call.name,ok:true,result:await tools[call.name](call.arguments)})}catch(e){results.push({name:call.name,ok:false,error:e.message})}}return results}
