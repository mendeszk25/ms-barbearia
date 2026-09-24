const services = [
  { name:'Corte', description:'Incluindo sobrancelha', price:20, duration:30, icon:'i-scissors' },
  { name:'Barba', description:'', price:15, duration:30, icon:'i-beard' },
  { name:'Combo', description:'Corte + barba', price:30, duration:30, icon:'i-crown' },
  { name:'Pigmentação', description:'', price:15, duration:30, icon:'i-bottle' },
  { name:'Relaxamento', description:'Dependendo do tamanho', price:10, duration:30, icon:'i-wave' },
  { name:'Pezinho', description:'', price:10, duration:30, icon:'i-razor' },
  { name:'Luzes', description:'', price:60, duration:60, icon:'i-spark' },
  { name:'Nevou', description:'Dependendo do tamanho', price:80, duration:30, icon:'i-snow' }
];
const galleryFiles = [7,1,2,3,12,5,9,10];
const money = n => `R$ ${Number(n).toFixed(0)}`;
const timeSlots=['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
const serviceList = document.querySelector('#serviceList');
serviceList.innerHTML = services.map((s,i)=>`<article class="service-cell editorial-service" tabindex="0" role="button" data-service="${i}" aria-pressed="false" aria-label="Selecionar ${s.name} por ${money(s.price)}"><span class="service-number">${String(i+1).padStart(2,'0')}</span><div class="service-icon"><svg><use href="#${s.icon}"/></svg></div><div class="service-main"><strong>${s.name}</strong>${s.description?`<small>${s.description}</small>`:'<small>MS BARBEARIA</small>'}</div><b class="service-price">${money(s.price)}</b><span class="service-go" aria-hidden="true"><svg><use href="#i-arrow"/></svg></span></article>`).join('');
serviceList.insertAdjacentHTML('afterend',`<div class="service-selection-summary" id="serviceSelectionSummary" hidden aria-live="polite"><div class="service-selection-copy"><span id="serviceSelectionCount">0 SERVIÇOS SELECIONADOS</span><strong id="serviceSelectionNames">Escolha seus serviços</strong></div><div class="service-selection-total"><small>TOTAL</small><b id="serviceSelectionTotal">R$ 0</b></div><button class="button button-primary service-selection-continue" id="serviceSelectionContinue" type="button" disabled>Continuar para agendamento <svg class="arrow"><use href="#i-arrow"/></svg></button></div>`);

const gallery = document.querySelector('#gallery');
gallery.innerHTML = galleryFiles.map((n,i)=>`<button class="cut-thumb portfolio-item item-${i+1}" type="button" data-photo="assets/cut-${n}.jpg" aria-label="Ampliar corte"><img src="assets/cut-${n}.jpg" alt="Corte realizado pela MS Barbearia" loading="lazy" decoding="async"><span>${String(i+1).padStart(2,'0')}</span></button>`).join('');
const prev = document.querySelector('#galleryPrev'), next = document.querySelector('#galleryNext');
function scrollGallery(dir){gallery.scrollBy({left:dir*gallery.clientWidth*.55,behavior:'smooth'})}
prev?.addEventListener('click',()=>scrollGallery(-1)); next?.addEventListener('click',()=>scrollGallery(1));

const lightbox = document.querySelector('#lightbox'), lightboxImage = document.querySelector('#lightboxImage');
document.querySelectorAll('.cut-thumb').forEach(btn=>btn.addEventListener('click',()=>{lightboxImage.src=btn.dataset.photo;lightbox.showModal()}));
document.querySelector('#lightboxClose').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});

const menuToggle=document.querySelector('#mobileMenuToggle'), mobileMenu=document.querySelector('#mobileMenu'), mobileMenuBackdrop=document.querySelector('#mobileMenuBackdrop'), mobileBookIcon=document.querySelector('.mobile-book-icon');
let mobileMenuScrollY=0;
let mobileMenuWasOpen=false;

function mobileMenuFocusable(){
  return [mobileBookIcon,menuToggle,...mobileMenu.querySelectorAll('a[href],button:not([disabled])')].filter(Boolean).filter(el=>el.offsetParent!==null);
}
function lockMobileMenuScroll(){
  mobileMenuScrollY=window.scrollY;
  document.body.style.position='fixed';
  document.body.style.top=`-${mobileMenuScrollY}px`;
  document.body.style.left='0';
  document.body.style.right='0';
  document.body.style.width='100%';
  document.documentElement.classList.add('mobile-menu-open');
}
function unlockMobileMenuScroll(){
  document.body.style.position='';
  document.body.style.top='';
  document.body.style.left='';
  document.body.style.right='';
  document.body.style.width='';
  document.documentElement.classList.remove('mobile-menu-open');
  window.scrollTo(0,mobileMenuScrollY);
}
function setMobileMenu(open,{restoreFocus=false}={}){
  if(open===mobileMenu.classList.contains('open'))return;
  mobileMenu.classList.toggle('open',open);
  mobileMenuBackdrop?.classList.toggle('open',open);
  menuToggle.classList.toggle('is-open',open);
  menuToggle.setAttribute('aria-expanded',String(open));
  menuToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  mobileMenu.setAttribute('aria-hidden',String(!open));
  mobileMenuBackdrop?.setAttribute('aria-hidden',String(!open));
  mobileMenuWasOpen=open;
  if(open){
    lockMobileMenuScroll();
    requestAnimationFrame(()=>mobileMenu.querySelector('.mobile-menu-link')?.focus({preventScroll:true}));
  }else{
    unlockMobileMenuScroll();
    if(restoreFocus)requestAnimationFrame(()=>menuToggle.focus({preventScroll:true}));
  }
}
menuToggle.addEventListener('click',()=>setMobileMenu(!mobileMenu.classList.contains('open'),{restoreFocus:true}));
mobileMenuBackdrop?.addEventListener('click',()=>setMobileMenu(false,{restoreFocus:true}));
mobileMenu.querySelectorAll('a,button').forEach(el=>el.addEventListener('click',()=>setMobileMenu(false)));

document.addEventListener('keydown',e=>{
  if(!mobileMenu.classList.contains('open'))return;
  if(e.key==='Escape'){
    e.preventDefault();
    setMobileMenu(false,{restoreFocus:true});
    return;
  }
  if(e.key!=='Tab')return;
  const focusable=mobileMenuFocusable();
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});

function updateMobileMenuActive(sectionId){
  mobileMenu.querySelectorAll('[data-menu-section]').forEach(link=>{
    const active=link.dataset.menuSection===sectionId;
    link.classList.toggle('is-active',active);
    if(active)link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
}
const mobileSections=[...document.querySelectorAll('#inicio,#servicos,#trabalhos,#localizacao')];
if('IntersectionObserver' in window&&mobileSections.length){
  const mobileNavObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)updateMobileMenuActive(visible.target.id);
  },{rootMargin:'-18% 0px -62% 0px',threshold:[0,.15,.35,.6]});
  mobileSections.forEach(section=>mobileNavObserver.observe(section));
}
window.addEventListener('resize',()=>{if(window.innerWidth>820&&mobileMenu.classList.contains('open'))setMobileMenu(false)});

const bookingModal=document.querySelector('#bookingModal');
document.querySelectorAll('[data-open-booking]').forEach(el=>el.addEventListener('click',()=>{state.step=1;if(!bookingModal.open)bookingModal.showModal();render()}));
document.querySelector('#bookingClose').addEventListener('click',()=>{bookingModal.close();if(state.confirmed){state={step:1,services:[],date:null,time:null,name:'',phone:'',confirmed:false};updateServiceSelectionUI()}});
bookingModal.addEventListener('click',e=>{if(e.target===bookingModal)bookingModal.close()});
document.querySelectorAll('.whatsapp-link').forEach(el=>el.addEventListener('click',()=>alert('O número de WhatsApp ainda não foi configurado no projeto.')));

let state={step:1,services:[],date:null,time:null,name:'',phone:'',confirmed:false};
const wb=document.querySelector('#wizardBody'), nextBtn=document.querySelector('#nextBtn'), backBtn=document.querySelector('#backBtn'), progress=document.querySelector('#bookingProgress'), summary=document.querySelector('#bookingSummary');
const serviceSelectionSummary=document.querySelector('#serviceSelectionSummary'),serviceSelectionContinue=document.querySelector('#serviceSelectionContinue');
const stepNames=['Serviços','Data','Horário','Seus dados','Confirmar'];
function ymdLocal(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function getDates(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+i);return d})}
function blockedSlots(date){return JSON.parse(localStorage.getItem('ms-blocked-slots')||'[]').filter(x=>x.date===date).map(x=>x.time)}
function isBlockedDate(date){return JSON.parse(localStorage.getItem('ms-blocked-dates')||'[]').some(x=>x.date===date)}
function dateLabel(date){return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}
function escapeHTML(str=''){return String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function totalPrice(){return state.services.reduce((sum,i)=>sum+services[i].price,0)}
function totalDuration(){return state.services.reduce((sum,i)=>sum+services[i].duration,0)}
function serviceNames(){return state.services.map(i=>services[i].name)}
function durationLabel(minutes){const h=Math.floor(minutes/60),m=minutes%60;if(h&&m)return `${h}h${String(m).padStart(2,'0')}`;if(h)return `${h}h`;return `${m} min`}
function timeToMinutes(t){const [h,m]=t.split(':').map(Number);return h*60+m}
function minutesToTime(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function rangesOverlap(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&aEnd>bStart}
function bookingServices(b){if(Array.isArray(b.services)&&b.services.length)return b.services;if(Number.isInteger(b.service))return [b.service];return []}
function bookingDuration(b){if(Number(b.totalDurationMinutes)>0)return Number(b.totalDurationMinutes);const indexes=bookingServices(b);return indexes.length?indexes.reduce((sum,i)=>sum+(services[i]?.duration||30),0):30}
function bookingEndTime(b){return minutesToTime(timeToMinutes(b.time)+bookingDuration(b))}
function bookingCollides(date,time,duration=totalDuration()){
  if(!date||!time||!duration)return false;
  if(isBlockedDate(date))return true;
  const start=timeToMinutes(time),end=start+duration;
  const required=[];for(let m=start;m<end;m+=30)required.push(minutesToTime(m));
  if(required.some(t=>!timeSlots.includes(t)))return true;
  const bookings=JSON.parse(localStorage.getItem('ms-bookings')||'[]').filter(x=>x.date===date&&x.status!=='cancelled');
  if(bookings.some(b=>{const bs=timeToMinutes(b.time),be=bs+bookingDuration(b);return rangesOverlap(start,end,bs,be)}))return true;
  if(blockedSlots(date).some(t=>rangesOverlap(start,end,timeToMinutes(t),timeToMinutes(t)+30)))return true;
  return false;
}
function comboConflict(index){
  const combo=2,corte=0,barba=1;
  if(index===combo&&(state.services.includes(corte)||state.services.includes(barba)))return 'O Combo já inclui Corte + Barba. Remova Corte/Barba antes de selecionar o Combo.';
  if((index===corte||index===barba)&&state.services.includes(combo))return 'O Combo já inclui Corte + Barba. Remova o Combo antes de selecionar este serviço.';
  return '';
}
function toggleService(index,{notify=true}={}){
  const pos=state.services.indexOf(index);
  if(pos>=0){state.services.splice(pos,1)}else{
    const conflict=comboConflict(index);if(conflict){if(notify)alert(conflict);return false}
    state.services.push(index);state.services.sort((a,b)=>a-b);
  }
  if(!state.services.length){state.date=null;state.time=null}else if(state.time&&bookingCollides(state.date,state.time)){state.time=null}
  updateServiceSelectionUI();
  return true;
}
function updateServiceSelectionUI(){
  const selected=new Set(state.services);
  document.querySelectorAll('.service-cell').forEach(el=>{
    const i=Number(el.dataset.service),on=selected.has(i);el.classList.toggle('selected',on);el.setAttribute('aria-pressed',String(on));
    el.setAttribute('aria-label',`${on?'Remover':'Selecionar'} ${services[i].name}, ${money(services[i].price)}`);
    const use=el.querySelector('.service-go use');if(use)use.setAttribute('href',on?'#i-check':'#i-arrow');
  });
  const has=state.services.length>0;serviceSelectionSummary.hidden=!has;serviceSelectionContinue.disabled=!has;
  document.querySelector('#serviceSelectionCount').textContent=`${state.services.length} ${state.services.length===1?'SERVIÇO SELECIONADO':'SERVIÇOS SELECIONADOS'}`;
  document.querySelector('#serviceSelectionNames').textContent=has?serviceNames().join(' + '):'Escolha seus serviços';
  document.querySelector('#serviceSelectionTotal').textContent=money(totalPrice());
}
function renderProgress(){progress.innerHTML=stepNames.map((name,i)=>`<div class="progress-item ${i+1<=state.step?'active':''}"><span>0${i+1}</span>${name}</div>`).join('')}
function renderSummary(){
  if(!state.services.length){summary.innerHTML='<span class="eyebrow">SEU AGENDAMENTO</span><p>Suas escolhas aparecem aqui.</p>';return}
  summary.innerHTML=`<span class="eyebrow">SEU AGENDAMENTO</span><div class="summary-service summary-service-multi"><strong>${escapeHTML(serviceNames().join(' + '))}</strong><b>${money(totalPrice())}</b></div><div class="summary-detail"><span>Duração estimada</span><b>${durationLabel(totalDuration())}</b></div>${state.date?`<div class="summary-detail"><span>Dia</span><b>${dateLabel(state.date)}</b></div>`:''}${state.time?`<div class="summary-detail"><span>Horário</span><b>${state.time}–${minutesToTime(timeToMinutes(state.time)+totalDuration())}</b></div>`:''}${state.name?`<div class="summary-detail"><span>Nome</span><b>${escapeHTML(state.name)}</b></div>`:''}<div class="summary-number">0${Math.min(state.step,5)}</div>`;
}
function wizardServiceRow(s,i){const selected=state.services.includes(i),comboSelected=state.services.includes(2),disabled=(comboSelected&&(i===0||i===1))||(i===2&&(state.services.includes(0)||state.services.includes(1)));return `<button class="choice-row ${selected?'selected':''}" aria-pressed="${selected}" data-kind="service" data-value="${i}" ${disabled&&!selected?'disabled':''}><span><strong>${s.name}${selected?' ✓':''}</strong><small>${s.description||'MS BARBEARIA'}</small></span><b>${money(s.price)}</b></button>`}
function render(){
  renderProgress();renderSummary();updateServiceSelectionUI();backBtn.hidden=state.step===1||state.step===6;nextBtn.hidden=state.step===6;nextBtn.disabled=false;nextBtn.innerHTML='Continuar <svg class="arrow"><use href="#i-arrow"/></svg>';
  if(state.step===1){const suggest=state.services.includes(0)&&state.services.includes(1)&&!state.services.includes(2)?'<p class="combo-suggestion">Corte + Barba selecionados. O Combo custa R$ 30; troque manualmente se preferir.</p>':'';wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 01 / 05</span><h3>ESCOLHA SEUS SERVIÇOS</h3><div class="choice-list">${services.map(wizardServiceRow).join('')}</div>${suggest}<div class="wizard-selection-total"><span>${state.services.length} ${state.services.length===1?'serviço':'serviços'}</span><b>${money(totalPrice())}</b></div>`}
  if(state.step===2)wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 02 / 05</span><h3>ESCOLHA O DIA</h3><div class="date-grid">${getDates().map((d,i)=>{const value=ymdLocal(d),blocked=isBlockedDate(value),top=i===0?'Hoje':i===1?'Amanhã':d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');return `<button class="date-option ${state.date===value?'selected':''}" data-kind="date" data-value="${value}" ${blocked?'disabled':''}><small>${top}</small><strong>${String(d.getDate()).padStart(2,'0')}</strong><small>${d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</small></button>`}).join('')}</div>`;
  if(state.step===3){wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 03 / 05</span><h3>QUAL HORÁRIO?</h3><p class="slot-duration-note">Duração estimada: <strong>${durationLabel(totalDuration())}</strong>. Os horários ocupados durante todo o intervalo ficam indisponíveis.</p><div class="time-grid">${timeSlots.map(t=>`<button class="time-option ${state.time===t?'selected':''}" data-kind="time" data-value="${t}" ${bookingCollides(state.date,t)?'disabled':''}>${t}</button>`).join('')}</div>`}
  if(state.step===4)wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 04 / 05</span><h3>SEUS DADOS</h3><div class="form-grid"><label class="field">Nome<input id="customerName" value="${escapeHTML(state.name)}" autocomplete="name" placeholder="Seu nome"></label><label class="field">WhatsApp<input id="customerPhone" value="${escapeHTML(state.phone)}" inputmode="tel" autocomplete="tel" placeholder="(81) 9 0000-0000"></label></div>`;
  if(state.step===5)wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 05 / 05</span><h3>CONFIRME SEU HORÁRIO</h3><div class="confirmation"><div class="confirmation-row"><span>Serviços</span><b>${escapeHTML(serviceNames().join(' + '))}</b></div><div class="confirmation-row"><span>Preço total</span><b>${money(totalPrice())}</b></div><div class="confirmation-row"><span>Duração estimada</span><b>${durationLabel(totalDuration())}</b></div><div class="confirmation-row"><span>Data</span><b>${dateLabel(state.date)}</b></div><div class="confirmation-row"><span>Horário</span><b>${state.time}–${minutesToTime(timeToMinutes(state.time)+totalDuration())}</b></div><div class="confirmation-row"><span>Nome</span><b>${escapeHTML(state.name)}</b></div><div class="confirmation-row"><span>WhatsApp</span><b>${escapeHTML(state.phone)}</b></div></div>`;nextBtn.textContent='Confirmar agendamento';
  if(state.step===6)wb.innerHTML=`<div class="success-mark"><svg><use href="#i-check"/></svg></div><span class="wizard-eyebrow">HORÁRIO REGISTRADO</span><h3>AGENDAMENTO CONFIRMADO</h3><p style="color:#8d969f;max-width:520px;line-height:1.6">${escapeHTML(serviceNames().join(' + '))} · ${dateLabel(state.date)} às ${state.time} · ${money(totalPrice())}.</p><div class="success-actions"><button class="button button-outline" type="button" id="calendarBtn">Adicionar ao calendário</button><a class="button button-primary" href="https://instagram.com/msbarbearia.oficiall" target="_blank" rel="noreferrer">Instagram</a></div>`;
  document.querySelectorAll('[data-kind]').forEach(btn=>btn.addEventListener('click',()=>{const kind=btn.dataset.kind,value=btn.dataset.value;if(kind==='service'){toggleService(Number(value));render();return}if(kind==='date'){state.date=value;state.time=null}if(kind==='time')state.time=value;render()}));
  document.querySelector('#calendarBtn')?.addEventListener('click',downloadCalendar);
}
function goNext(){
  if(state.step===1&&!state.services.length)return alert('Escolha pelo menos um serviço.');
  if(state.step===2&&!state.date)return alert('Escolha um dia.');
  if(state.step===3&&!state.time)return alert('Escolha um horário.');
  if(state.step===4){state.name=document.querySelector('#customerName').value.trim();state.phone=document.querySelector('#customerPhone').value.trim();if(!state.name||!state.phone)return alert('Informe nome e WhatsApp.')}
  if(state.step===5){nextBtn.disabled=true;nextBtn.textContent='Validando horário...';setTimeout(()=>{if(bookingCollides(state.date,state.time,totalDuration())){alert('Esse horário acabou de ser reservado. Escolha outro horário.');state.step=3;state.time=null;render();return}const bookings=JSON.parse(localStorage.getItem('ms-bookings')||'[]');bookings.push({name:state.name,phone:state.phone,date:state.date,time:state.time,services:[...state.services],service:state.services[0],totalPrice:totalPrice(),totalDurationMinutes:totalDuration(),endTime:minutesToTime(timeToMinutes(state.time)+totalDuration()),status:'confirmed',createdAt:new Date().toISOString()});localStorage.setItem('ms-bookings',JSON.stringify(bookings));state.step=6;state.confirmed=true;render()},350);return}
  state.step++;render();
}
nextBtn.addEventListener('click',goNext);backBtn.addEventListener('click',()=>{if(state.step>1){state.step--;render()}});
function handleServiceCell(index){toggleService(index)}
document.querySelectorAll('.service-cell').forEach(el=>{el.addEventListener('click',()=>handleServiceCell(Number(el.dataset.service)));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleServiceCell(Number(el.dataset.service))}})});
serviceSelectionContinue.addEventListener('click',()=>{if(!state.services.length)return;state.step=1;if(!bookingModal.open)bookingModal.showModal();render()});
function downloadCalendar(){const start=`${state.date.replaceAll('-','')}T${state.time.replace(':','')}00`,endDate=new Date(`${state.date}T${state.time}:00`);endDate.setMinutes(endDate.getMinutes()+totalDuration());const end=`${ymdLocal(endDate).replaceAll('-','')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`,ics=`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MS Barbearia//Agendamento//PT-BR\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:MS Barbearia — ${serviceNames().join(' + ')}\nDESCRIPTION:Serviços: ${serviceNames().join(', ')}. Total: ${money(totalPrice())}.\nLOCATION:Gravatá - PE\nEND:VEVENT\nEND:VCALENDAR`;const blob=new Blob([ics],{type:'text/calendar'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ms-barbearia-agendamento.ics';a.click();URL.revokeObjectURL(url)}
updateServiceSelectionUI();render();



/* Motion system: editorial, restrained and performance-first. */
function initMotionSystem(){
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion){
    document.body.classList.add('motion-reduced');
    return;
  }

  document.body.classList.add('motion-ready');
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.add('motion-started')));

  const header=document.querySelector('#siteHeader');
  const syncHeader=()=>header?.classList.toggle('is-scrolled',window.scrollY>18);
  syncHeader();
  window.addEventListener('scroll',syncHeader,{passive:true});

  const motionItems=[];
  const add=(selector,baseDelay=0,step=0)=>{
    document.querySelectorAll(selector).forEach((el,index)=>{
      el.classList.add('motion-reveal');
      el.style.setProperty('--motion-delay',`${baseDelay+index*step}ms`);
      motionItems.push(el);
    });
  };

  add('.services-intro .section-kicker',0);
  add('.services-intro h2',45);
  add('.services-intro p',90);
  add('.services-editorial .service-cell',0,45);
  add('.portfolio-header .section-kicker',0);
  add('.portfolio-header h2',45);
  add('.portfolio-copy',90);
  add('.portfolio-section .cut-thumb',0,45);
  add('.portfolio-foot',110);
  add('.story-v2-copy .section-kicker',0);
  add('.story-v2-copy h2',45);
  add('.story-v2-copy>p',90);
  add('.story-v2-value',0,65);
  add('.story-v2-bottom',120);
  add('.cta-copy .section-kicker',0);
  add('.cta-copy h2',45);
  add('.cta-action',95);
  add('.contact-copy .section-kicker',0);
  add('.contact-copy h2',45);
  add('.contact-copy>p',90);
  add('.contact-location',125);
  add('.contact-actions',165);
  add('.editorial-map',95);
  add('.site-footer>*',0,50);

  const storyVisual=document.querySelector('.story-v2-visual');
  if(storyVisual){
    storyVisual.classList.add('motion-reveal','motion-from-left');
    storyVisual.style.setProperty('--motion-delay','40ms');
    motionItems.push(storyVisual);
  }

  const cta=document.querySelector('.appointment-cta');
  const contact=document.querySelector('.contact-section');
  const portfolio=document.querySelector('.portfolio-section');

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  },{threshold:.12,rootMargin:'0px 0px -7% 0px'});

  motionItems.forEach(el=>observer.observe(el));

  [cta,contact,portfolio].filter(Boolean).forEach(section=>{
    section.classList.add('motion-section');
    observer.observe(section);
  });

  document.querySelectorAll('.section-kicker').forEach(kicker=>{
    const line=kicker.querySelector('i');
    if(line)line.classList.add('motion-line');
  });

  document.querySelectorAll('.button,.contact-action,.portfolio-copy a,.desktop-nav a,.site-footer nav a,.site-footer nav button').forEach(el=>{
    el.classList.add('motion-interactive');
  });
}

initMotionSystem();
