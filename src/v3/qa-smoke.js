const params=new URLSearchParams(location.search);
if(params.get('qa')==='1'){
  let running=false;
  async function startQa(){
    if(running)return;
    running=true;
    document.querySelector('#qaLauncher')?.setAttribute('disabled','true');
    if(document.querySelector('#qaLauncher'))document.querySelector('#qaLauncher').textContent='QA läuft …';
    const STORAGE_KEYS=['linguaturtle-v3-preview','linguaturtle-v3-mastery','linguaturtle-v3-child-profile'];
    const snapshot=Object.fromEntries(STORAGE_KEYS.map(k=>[k,localStorage.getItem(k)]));
    const results=[];
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const assert=(name,ok,detail='')=>results.push({name,ok:Boolean(ok),detail});
    const click=async selector=>{const el=document.querySelector(selector);if(!el)return false;el.click();await sleep(260);return true};
    const has=text=>document.body.innerText.toLowerCase().includes(String(text).toLowerCase());
    const restore=()=>{for(const [k,v] of Object.entries(snapshot)){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}};
    const panel=()=>{
      const passed=results.filter(x=>x.ok).length;
      const failed=results.length-passed;
      document.querySelector('#qaPanel')?.remove();
      document.body.insertAdjacentHTML('beforeend',`<section id="qaPanel" style="position:fixed;inset:12px;z-index:99999;background:#fff;border:2px solid #073f67;border-radius:24px;padding:18px;overflow:auto;font:14px system-ui;color:#17354a;box-shadow:0 20px 60px rgba(0,0,0,.25)"><h2 style="margin:0 0 6px;color:#073f67">LinguaTurtle QA</h2><p><strong>${passed} bestanden · ${failed} fehlgeschlagen</strong></p>${results.map(r=>`<div style="padding:10px 0;border-top:1px solid #dbe8ef"><b>${r.ok?'✅':'❌'} ${r.name}</b>${r.detail?`<div style="color:#667b88">${r.detail}</div>`:''}</div>`).join('')}<button id="qaClose" style="width:100%;margin-top:14px;padding:14px;border:0;border-radius:16px;background:#073f67;color:#fff;font-weight:800">Test schließen</button></section>`);
      document.querySelector('#qaClose')?.addEventListener('click',()=>{restore();location.href=location.pathname+'?build=v3.0.3-qa';});
      document.querySelector('#qaLauncher')?.remove();
    };
    try{
      document.querySelector('#childProfileModal')?.remove();
      await sleep(300);
      assert('App startet',!has('turtle island wird geladen')&&document.querySelector('#app')?.children.length>0);
      assert('Hauptnavigation vorhanden',document.querySelectorAll('.v3-nav button').length>=5);
      assert('Sprachschalter vorhanden',Boolean(document.querySelector('[data-action="language"]')));
      await click('[data-action="language"]');
      assert('Sprachdialog öffnet',Boolean(document.querySelector('#langModal')));
      await click('[data-lang="es"]');
      assert('Spanisch wird aktiv',has('inicio')||has('isla')||document.querySelector('[data-action="language"]')?.textContent.includes('ES'));
      await click('[data-screen="home"]');
      await click('[data-screen="island"]');
      assert('Inselansicht öffnet',has('lugares')||has('orte')||has('adónde')||has('wohin'));
      await click('[data-screen="home"]');
      const firstPlace=document.querySelector('[data-place]');
      if(firstPlace){firstPlace.click();await sleep(300)}
      assert('Lernwelt öffnet',document.querySelectorAll('[data-mode]').length>=2);
      await click('[data-mode="explore"]');
      assert('Wörter entdecken öffnet',document.querySelectorAll('[data-speak-word]').length>0);
      await click('[data-action="back"]');
      await click('[data-mode="quiz"]');
      assert('Hörquiz öffnet',document.querySelectorAll('[data-answer]').length>=2);
      await click('[data-action="back"]');
      await click('[data-screen="shop"]');
      assert('Shop öffnet',has('boutique')||has('tienda')||document.querySelectorAll('[data-buy]').length>0);
      await click('[data-screen="profile"]');
      assert('Profil öffnet',has('progreso')||has('fortschritt'));
      assert('Keine globale Fehleransicht',!has('tula braucht kurz hilfe'));
    }catch(err){
      assert('QA-Lauf ohne Ausnahme',false,String(err));
    }
    restore();
    panel();
  }
  window.addEventListener('linguaturtle:run-qa',startQa);
}
