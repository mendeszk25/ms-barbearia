const services = [
  { name:'Corte', description:'Incluindo sobrancelha', price:20, icon:'i-scissors' },
  { name:'Barba', description:'', price:15, icon:'i-beard' },
  { name:'Combo', description:'Corte + barba', price:30, icon:'i-crown' },
  { name:'Pigmentação', description:'', price:15, icon:'i-bottle' },
  { name:'Relaxamento', description:'Dependendo do tamanho', price:10, icon:'i-wave' },
  { name:'Pezinho', description:'', price:10, icon:'i-razor' },
  { name:'Luzes', description:'', price:60, icon:'i-spark' },
  { name:'Nevou', description:'Dependendo do tamanho', price:80, icon:'i-snow' }
];
const galleryFiles = [7,1,2,3,12,5,9,10];
const money = n => `R$ ${Number(n).toFixed(0)}`;
const serviceList = document.querySelector('#serviceList');
serviceList.innerHTML = services.map((s,i)=>`<article class="service-cell editorial-service" tabindex="0" role="button" data-service="${i}" aria-label="Agendar ${s.name} por ${money(s.price)}"><span class="service-number">${String(i+1).padStart(2,'0')}</span><div class="service-icon"><svg><use href="#${s.icon}"/></svg></div><div class="service-main"><strong>${s.name}</strong>${s.description?`<small>${s.description}</small>`:'<small>MS BARBEARIA</small>'}</div><b class="service-price">${money(s.price)}</b><span class="service-go"><svg><use href="#i-arrow"/></svg></span></article>`).join('');

const gallery = document.querySelector('#gallery');
gallery.innerHTML = galleryFiles.map((n,i)=>`<button class="cut-thumb portfolio-item item-${i+1}" type="button" data-photo="assets/cut-${n}.jpg" aria-label="Ampliar corte"><img src="assets/cut-${n}.jpg" alt="Corte realizado pela MS Barbearia" loading="lazy" decoding="async"><span>${String(i+1).padStart(2,'0')}</span></button>`).join('');
const prev = document.querySelector('#galleryPrev'), next = document.querySelector('#galleryNext');
function scrollGallery(dir){gallery.scrollBy({left:dir*gallery.clientWidth*.55,behavior:'smooth'})}
prev?.addEventListener('click',()=>scrollGallery(-1)); next?.addEventListener('click',()=>scrollGallery(1));

const lightbox = document.querySelector('#lightbox'), lightboxImage = document.querySelector('#lightboxImage');
document.querySelectorAll('.cut-thumb').forEach(btn=>btn.addEventListener('click',()=>{lightboxImage.src=btn.dataset.photo;lightbox.showModal()}));
document.querySelector('#lightboxClose').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});

const menuToggle=document.querySelector('#mobileMenuToggle'), mobileMenu=document.querySelector('#mobileMenu');
function setMobileMenu(open){
  mobileMenu.classList.toggle('open',open);
  menuToggle.classList.toggle('is-open',open);
  menuToggle.setAttribute('aria-expanded',String(open));
  menuToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
}
menuToggle.setAttribute('aria-expanded','false');
menuToggle.addEventListener('click',()=>setMobileMenu(!mobileMenu.classList.contains('open')));
mobileMenu.querySelectorAll('a,button').forEach(el=>el.addEventListener('click',()=>setMobileMenu(false)));

const bookingModal=document.querySelector('#bookingModal');
document.querySelectorAll('[data-open-booking]').forEach(el=>el.addEventListener('click',()=>{if(!bookingModal.open)bookingModal.showModal();render()}));
document.querySelector('#bookingClose').addEventListener('click',()=>bookingModal.close());
bookingModal.addEventListener('click',e=>{if(e.target===bookingModal)bookingModal.close()});
document.querySelectorAll('.whatsapp-link').forEach(el=>el.addEventListener('click',()=>alert('O número de WhatsApp ainda não foi configurado no projeto.')));

let state={step:1,service:null,date:null,time:null,name:'',phone:'',confirmed:false};
const wb=document.querySelector('#wizardBody'), nextBtn=document.querySelector('#nextBtn'), backBtn=document.querySelector('#backBtn'), progress=document.querySelector('#bookingProgress'), summary=document.querySelector('#bookingSummary');
const stepNames=['Serviço','Data','Horário','Seus dados','Confirmar'];
function ymdLocal(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function getDates(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+i);return d})}
function bookedSlots(date){return JSON.parse(localStorage.getItem('ms-bookings')||'[]').filter(x=>x.date===date&&x.status!=='cancelled').map(x=>x.time)}
function blockedSlots(date){return JSON.parse(localStorage.getItem('ms-blocked-slots')||'[]').filter(x=>x.date===date).map(x=>x.time)}
function isBlockedDate(date){return JSON.parse(localStorage.getItem('ms-blocked-dates')||'[]').some(x=>x.date===date)}
function dateLabel(date){return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}
function escapeHTML(str=''){return str.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function renderProgress(){progress.innerHTML=stepNames.map((name,i)=>`<div class="progress-item ${i+1<=state.step?'active':''}"><span>0${i+1}</span>${name}</div>`).join('')}
function renderSummary(){
  if(state.service===null){summary.innerHTML='<span class="eyebrow">SEU AGENDAMENTO</span><p>Suas escolhas aparecem aqui.</p>';return}
  const s=services[state.service]; summary.innerHTML=`<span class="eyebrow">SEU AGENDAMENTO</span><div class="summary-service"><strong>${s.name}</strong><b>${money(s.price)}</b></div>${state.date?`<div class="summary-detail"><span>Dia</span><b>${dateLabel(state.date)}</b></div>`:''}${state.time?`<div class="summary-detail"><span>Horário</span><b>${state.time}</b></div>`:''}${state.name?`<div class="summary-detail"><span>Nome</span><b>${escapeHTML(state.name)}</b></div>`:''}<div class="summary-number">0${Math.min(state.step,5)}</div>`;
}
function render(){
  renderProgress();renderSummary();backBtn.hidden=state.step===1||state.step===6;nextBtn.hidden=state.step===6;nextBtn.disabled=false;nextBtn.innerHTML='Continuar <svg class="arrow"><use href="#i-arrow"/></svg>';
  if(state.step===1)wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 01 / 05</span><h3>ESCOLHA SEU SERVIÇO</h3><div class="choice-list">${services.map((s,i)=>`<button class="choice-row ${state.service===i?'selected':''}" data-kind="service" data-value="${i}"><span><strong>${s.name}</strong><small>${s.description}</small></span><b>${money(s.price)}</b></button>`).join('')}</div>`;
  if(state.step===2)wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 02 / 05</span><h3>ESCOLHA O DIA</h3><div class="date-grid">${getDates().map((d,i)=>{const value=ymdLocal(d),blocked=isBlockedDate(value),top=i===0?'Hoje':i===1?'Amanhã':d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');return `<button class="date-option ${state.date===value?'selected':''}" data-kind="date" data-value="${value}" ${blocked?'disabled':''}><small>${top}</small><strong>${String(d.getDate()).padStart(2,'0')}</strong><small>${d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</small></button>`}).join('')}</div>`;
  if(state.step===3){const times=['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'],unavailable=[...bookedSlots(state.date),...blockedSlots(state.date)];wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 03 / 05</span><h3>QUAL HORÁRIO?</h3><div class="time-grid">${times.map(t=>`<button class="time-option ${state.time===t?'selected':''}" data-kind="time" data-value="${t}" ${unavailable.includes(t)?'disabled':''}>${t}</button>`).join('')}</div>`}
  if(state.step===4)wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 04 / 05</span><h3>SEUS DADOS</h3><div class="form-grid"><label class="field">Nome<input id="customerName" value="${escapeHTML(state.name)}" autocomplete="name" placeholder="Seu nome"></label><label class="field">WhatsApp<input id="customerPhone" value="${escapeHTML(state.phone)}" inputmode="tel" autocomplete="tel" placeholder="(81) 9 0000-0000"></label></div>`;
  if(state.step===5){const s=services[state.service];wb.innerHTML=`<span class="wizard-eyebrow">ETAPA 05 / 05</span><h3>CONFIRME SEU HORÁRIO</h3><div class="confirmation"><div class="confirmation-row"><span>Serviço</span><b>${s.name}</b></div><div class="confirmation-row"><span>Preço</span><b>${money(s.price)}</b></div><div class="confirmation-row"><span>Data</span><b>${dateLabel(state.date)}</b></div><div class="confirmation-row"><span>Horário</span><b>${state.time}</b></div><div class="confirmation-row"><span>Nome</span><b>${escapeHTML(state.name)}</b></div><div class="confirmation-row"><span>WhatsApp</span><b>${escapeHTML(state.phone)}</b></div></div>`;nextBtn.textContent='Confirmar agendamento'}
  if(state.step===6)wb.innerHTML=`<div class="success-mark"><svg><use href="#i-check"/></svg></div><span class="wizard-eyebrow">HORÁRIO REGISTRADO</span><h3>AGENDAMENTO CONFIRMADO</h3><p style="color:#8d969f;max-width:480px;line-height:1.6">${services[state.service].name} · ${dateLabel(state.date)} às ${state.time}.</p><div class="success-actions"><button class="button button-outline" type="button" id="calendarBtn">Adicionar ao calendário</button><a class="button button-primary" href="https://instagram.com/msbarbearia.oficiall" target="_blank" rel="noreferrer">Instagram</a></div>`;
  document.querySelectorAll('[data-kind]').forEach(btn=>btn.addEventListener('click',()=>{const kind=btn.dataset.kind,value=btn.dataset.value;if(kind==='service')state.service=Number(value);if(kind==='date'){state.date=value;state.time=null}if(kind==='time')state.time=value;render()}));
  document.querySelector('#calendarBtn')?.addEventListener('click',downloadCalendar);
}
function goNext(){if(state.step===1&&state.service===null)return alert('Escolha um serviço.');if(state.step===2&&!state.date)return alert('Escolha um dia.');if(state.step===3&&!state.time)return alert('Escolha um horário.');if(state.step===4){state.name=document.querySelector('#customerName').value.trim();state.phone=document.querySelector('#customerPhone').value.trim();if(!state.name||!state.phone)return alert('Informe nome e WhatsApp.')}if(state.step===5){nextBtn.disabled=true;nextBtn.textContent='Validando horário...';setTimeout(()=>{const bookings=JSON.parse(localStorage.getItem('ms-bookings')||'[]'),collision=bookings.some(x=>x.date===state.date&&x.time===state.time&&x.status!=='cancelled')||blockedSlots(state.date).includes(state.time)||isBlockedDate(state.date);if(collision){alert('Esse horário acabou de ser reservado. Escolha outro horário.');state.step=3;state.time=null;render();return}bookings.push({...state,status:'confirmed',createdAt:new Date().toISOString()});localStorage.setItem('ms-bookings',JSON.stringify(bookings));state.step=6;state.confirmed=true;render()},350);return}state.step++;render()}
nextBtn.addEventListener('click',goNext);backBtn.addEventListener('click',()=>{if(state.step>1){state.step--;render()}});
function chooseService(index){state.service=index;state.step=2;render();if(!bookingModal.open)bookingModal.showModal()}
document.querySelectorAll('.service-cell').forEach(el=>{el.addEventListener('click',()=>chooseService(Number(el.dataset.service)));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseService(Number(el.dataset.service))}})});
function downloadCalendar(){const s=services[state.service],start=`${state.date.replaceAll('-','')}T${state.time.replace(':','')}00`,endDate=new Date(`${state.date}T${state.time}:00`);endDate.setMinutes(endDate.getMinutes()+30);const end=`${ymdLocal(endDate).replaceAll('-','')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`,ics=`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MS Barbearia//Agendamento//PT-BR\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:MS Barbearia — ${s.name}\nLOCATION:Gravatá - PE\nEND:VEVENT\nEND:VCALENDAR`;const blob=new Blob([ics],{type:'text/calendar'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ms-barbearia-agendamento.ics';a.click();URL.revokeObjectURL(url)}
render();


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
