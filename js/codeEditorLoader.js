const loading=document.getElementById('editorLoading');
async function boot(){try{const module=await import('./codeEditor.bundle.js');await module.mountCodeEditor();loading?.remove()}catch(error){console.warn('CodeMirror indisponible, éditeur de secours actif:',error);if(loading){loading.innerHTML='<span class="fallback-dot"></span> Mode éditeur essentiel';setTimeout(()=>loading.remove(),2500)}}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
