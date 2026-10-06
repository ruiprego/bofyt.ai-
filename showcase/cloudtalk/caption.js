(()=>{
const gold='#e2c27d',navy='rgba(5,10,24,.9)',soft='#d7dbe6',font='Inter,system-ui,sans-serif'
window.__cap=(t)=>{let d=document.getElementById('__cap');if(!t){d&&d.remove();return 'cleared'}
if(!d){d=document.createElement('div');d.id='__cap';document.body.appendChild(d)}
d.style.cssText=`position:fixed;left:50%;bottom:60px;transform:translateX(-50%);z-index:2147483647;padding:20px 44px;border-radius:999px;background:${navy};border:1px solid rgba(226,194,125,.55);color:${gold};font:600 30px/1.2 ${font};letter-spacing:.16em;text-transform:uppercase;box-shadow:0 24px 70px rgba(0,0,0,.55);pointer-events:none;white-space:nowrap`
d.textContent=t;return 'cap'}
window.__title=(lines,opts={})=>{let d=document.getElementById('__title');if(!lines){d&&d.remove();return 'cleared'}
if(!d){d=document.createElement('div');d.id='__title';document.body.appendChild(d)}
const pos=opts.center?'top:0;bottom:0;justify-content:center':'bottom:150px'
const bg=opts.dim?'background:rgba(3,6,16,.82);':''
d.style.cssText=`position:fixed;left:0;right:0;${pos};${bg}z-index:2147483647;display:flex;flex-direction:column;align-items:center;gap:20px;pointer-events:none;text-align:center`
d.innerHTML=lines.map(([t,k])=>k==='big'?`<div style="color:${gold};font:600 66px/1.05 ${font};letter-spacing:.3em;padding-left:.3em">${t}</div>`:k==='sub'?`<div style="color:${soft};font:400 30px/1.35 ${font};letter-spacing:.05em">${t}</div>`:k==='small'?`<div style="color:rgba(215,219,230,.7);font:500 22px/1.3 ${font};letter-spacing:.28em;text-transform:uppercase">${t}</div>`:`<div style="color:${gold};font:600 40px/1.15 ${font};letter-spacing:.2em;padding-left:.2em;text-transform:uppercase">${t}</div>`).join('')
document.querySelectorAll('p,span,div').forEach(e=>{if(/TAP OR CLICK THE CORE/i.test(e.textContent)&&e.children.length===0)e.style.visibility='hidden'})
return 'title'}
return 'helpers'})()
