(()=>{
const gold='#e2c27d',navy='rgba(5,10,24,.9)'
window.__cap=(t)=>{let d=document.getElementById('__cap');if(!t){d&&d.remove();return 'cleared'}
if(!d){d=document.createElement('div');d.id='__cap';document.body.appendChild(d)}
d.style.cssText=`position:fixed;left:50%;bottom:60px;transform:translateX(-50%);z-index:2147483647;padding:20px 44px;border-radius:999px;background:${navy};border:1px solid rgba(226,194,125,.55);color:${gold};font:600 30px/1.2 Inter,system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 24px 70px rgba(0,0,0,.55);pointer-events:none;white-space:nowrap`
d.textContent=t;return 'cap'}
window.__end=()=>{let d=document.getElementById('__end');if(!d){d=document.createElement('div');d.id='__end';document.body.appendChild(d)}
d.style.cssText='position:fixed;left:0;right:0;bottom:170px;z-index:2147483647;display:flex;flex-direction:column;align-items:center;gap:18px;pointer-events:none;text-align:center'
d.innerHTML=`<div style="color:${gold};font:600 64px/1 Inter,system-ui,sans-serif;letter-spacing:.32em;padding-left:.32em">BOFYT AI</div><div style="color:#d7dbe6;font:400 30px/1.3 Inter,system-ui,sans-serif;letter-spacing:.06em">Turn your goals into progress.</div>`
document.querySelectorAll('p,span,div').forEach(e=>{if(/TAP OR CLICK THE CORE/i.test(e.textContent)&&e.children.length===0)e.style.visibility='hidden'})
return 'end'}
return 'helpers'})()
