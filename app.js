/* =====================================================================
   APP — wiring, event delegation, completion tracking, init
   ===================================================================== */

const PANEL_RENDERERS = {
  info: renderInfoPanel,
  skill: renderSkillPanel,
  teaching: renderTeachingPanel,
  assessment: renderAssessmentPanel,
  references: renderReferencesPanel,
  additional: renderAdditionalPanel,
};

let activeTab = 'info';
let openDD = null; // id of currently open dropdown-checkbox panel, if any

function renderPanel(id){ PANEL_RENDERERS[id](); reopenDD(); autosizeAll(); }
function renderAll(){ Object.keys(PANEL_RENDERERS).forEach(id => PANEL_RENDERERS[id]()); reopenDD(); autosizeAll(); }

/* ---------- floating dropdown-checkbox portal ----------
   A single shared panel is appended to <body> and positioned with
   `position:fixed` coordinates computed from the toggle button's own
   bounding box, so it always floats above the page and is never clipped
   by a scrolling table or card (unlike an inline-positioned panel). */
function openDropdownPortal(ddid){
  const toggle = document.querySelector(`[data-dd-toggle="${ddid}"]`);
  const portal = document.getElementById('ddPortal');
  if(!toggle){ closeDropdownPortal(); return; }

  portal.innerHTML = buildDDPanelHTML(ddid);
  const cfgOpts = (DD_REGISTRY[ddid]||{}).opts || [];
  portal.classList.toggle('wide', !!(cfgOpts[0] && cfgOpts[0].items));
  portal.classList.add('open');
  openDD = ddid;

  // position, then clamp to viewport, flipping above the toggle if there's no room below
  const r = toggle.getBoundingClientRect();
  portal.style.left = '0px'; portal.style.top='0px'; // reset before measuring
  const pw = portal.offsetWidth, ph = portal.offsetHeight;
  let left = r.left;
  let top = r.bottom + 6;
  if(left + pw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - pw - 8);
  if(top + ph > window.innerHeight - 8){
    top = r.top - ph - 6;
    if(top < 8) top = 8; // not enough room either side — just clamp to top
  }
  portal.style.left = left + 'px';
  portal.style.top = top + 'px';
}
function closeDropdownPortal(){
  const portal = document.getElementById('ddPortal');
  portal.classList.remove('open');
  portal.innerHTML = '';
  openDD = null;
}
function reopenDD(){
  if(!openDD) return;
  const id = openDD;
  openDD = null; // avoid stale state if toggle no longer exists
  openDropdownPortal(id);
}

/* ---------- tab list + switching ---------- */
function renderTabsList(){
  const list = document.getElementById('tabsList');
  const completion = computeCompletion();
  list.innerHTML = TABS.map((t,i)=>{
    const p = completion.perTab[t.id];
    const status = p.done ? 'done' : (p.filled>0 ? 'partial' : 'empty');
    const icon = status==='done' ? '✓' : (status==='partial' ? '•' : (i+1));
    return `
    <li class="tab-item ${activeTab===t.id?'active':''} ${status}" data-tab="${t.id}">
      <span class="tab-num">${icon}</span>
      <span class="tab-text">
        <span class="tab-part">${t.part}</span>
        <span class="tab-name">${t.label}</span>
      </span>
    </li>`;
  }).join('');
}

function switchTab(id){
  activeTab = id;
  openDD = null;
  document.querySelectorAll('.panel').forEach(p=> p.classList.toggle('active', p.dataset.panel===id));
  renderPanel(id);
  renderTabsList();
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ---------- completion tracking ---------- */
function computeCompletion(){
  const perTab = {};

  // Part A
  const m = state.meta;
  const infoChecks = [
    !!m.program, !!m.courseCode, !!m.courseTitle, !!m.courseCategory, !!m.courseMode,
    !!m.level, !!m.sessionTerm, !!m.sessionYear, !!m.creditValue, !!m.contactHours,
    state.teachers.some(t=>t.name.trim()), !!state.rationale.trim(),
    state.objectives.some(o=>o.trim()),
  ];
  perTab.info = tallyOf(infoChecks);

  // Part B
  const coTextFilled = state.cos.filter(c=>c.text.trim()).length;
  const poMapped = state.poMapping.filter(m=>m.po).length;
  perTab.skill = tallyOf([], state.cos.length*2, coTextFilled + poMapped);

  // Part C
  const planFilled = state.plan.filter(r=>plainText(r.topics).length>0).length;
  perTab.teaching = tallyOf([], state.plan.length, planFilled);

  // Part D
  perTab.assessment = tallyOf([Math.round(computeAssessmentTotal())===100]);

  // Part E
  perTab.references = tallyOf([
    plainText(state.references.recommended).length>0,
    plainText(state.references.textbooks).length>0,
    plainText(state.references.others).length>0,
    plainText(state.references.othersDiscipline).length>0,
  ]);

  // Part F
  const coreAdd = ['programOutcome','obeCurriculum','courseCatalog','facultyInfo'];
  perTab.additional = tallyOf(coreAdd.map(k=>!!state.additional[k].trim()));

  let filled=0, required=0;
  Object.values(perTab).forEach(p=>{ filled+=p.filled; required+=p.required; });
  const percent = required? Math.round((filled/required)*100) : 0;
  return {perTab, percent};
}
function tallyOf(boolArr, requiredOverride, filledOverride){
  const required = requiredOverride !== undefined ? requiredOverride : boolArr.length;
  const filled = filledOverride !== undefined ? filledOverride : boolArr.filter(Boolean).length;
  return {required, filled, done: required>0 && filled===required};
}

function updateProgressUI(){
  const {percent} = computeCompletion();
  document.getElementById('ringPercent').textContent = percent+'%';
  document.getElementById('miniProgressPercent').textContent = percent+'%';
  document.getElementById('miniProgressFill').style.width = percent+'%';
  const tier = percent>=80 ? 'ok' : (percent>=40 ? 'mid' : 'low');
  const tierColor = tier==='ok' ? 'var(--ok)' : (tier==='mid' ? 'var(--gold)' : 'var(--danger)');
  const ring = document.getElementById('ringFill');
  const circumference = 2*Math.PI*27;
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference - (circumference*percent/100);
  ring.style.stroke = tierColor;
  document.getElementById('miniProgressFill').style.background = tierColor;
  const code = state.meta.courseCode ? state.meta.courseCode + (state.meta.courseTitle? ' — '+state.meta.courseTitle:'') : 'Untitled Outline';
  document.getElementById('headerCourseCode').textContent = code;
  renderTabsList();
}

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._tm);
  toast._tm = setTimeout(()=> t.classList.remove('show'), 2600);
}

/* ---------- generic bind handling (input/change events) ---------- */
function autosizeTextarea(el){ el.style.height='auto'; el.style.height = el.scrollHeight+'px'; }
function autosizeAll(){ document.querySelectorAll('textarea.autosize').forEach(autosizeTextarea); }

document.addEventListener('input', (e)=>{
  const t = e.target;
  if(t.matches('textarea.autosize')) autosizeTextarea(t);

  if(t.matches('[data-bind]')){
    const val = t.type==='checkbox' ? t.checked : t.value;
    setPath(state, t.dataset.bind, val);
    updateProgressUI();
    return;
  }
  if(t.matches('[data-bind-row]')){
    const coll = state[t.dataset.collection];
    const row = findById(coll, t.dataset.rowId);
    if(row) row[t.dataset.bindRow] = t.value;
    return;
  }
  if(t.matches('[data-bind-mark]')){
    const key = t.dataset.bindMark;
    if(key==='attendance') state.assessment.attendanceMarks = t.value;
    else state.assessment.rowMarks[key] = t.value;
    updateAssessmentTotalUI();
    updateProgressUI();
    return;
  }
  if(t.matches('[data-bind-pattern]')){
    const code = t.dataset.bindPattern;
    if(!state.patternValues[code]) state.patternValues[code] = newPatternValues();
    state.patternValues[code][t.dataset.bloomrow] = t.value;
    return;
  }
  if(t.matches('[data-rte-bind]')){
    setPath(state, t.dataset.rteBind, t.innerHTML);
    updateProgressUI();
    return;
  }
});

document.addEventListener('change', (e)=>{
  const t = e.target;
  if(t.matches('[data-bind]') && (t.tagName==='SELECT')){
    setPath(state, t.dataset.bind, t.value);
    renderPanel(activeTab); // course type / mode changes affect assessment + teaching derived options
    updateProgressUI();
    return;
  }
  if(t.matches('[data-po-select]')){
    const coId = t.dataset.poSelect;
    let m = state.poMapping.find(x=>x.coId===coId);
    if(!m){ m = {coId, po:''}; state.poMapping.push(m); }
    m.po = t.value;
    // BAETE convention: a PO only permits certain Knowledge Profile items —
    // drop any previously-selected KP/WK codes that the new PO no longer allows.
    const co = findById(state.cos, coId);
    if(co){
      const allowed = allowedKPWKFor(m.po);
      co.kpwk = co.kpwk.filter(c=>allowed.includes(c));
    }
    renderPanel(activeTab);
    updateProgressUI();
    return;
  }
  if(t.matches('[data-dd-action]')){
    handleDDToggle(t);
    renderPanel(activeTab);
    updateProgressUI();
    return;
  }
  if(t.matches('[data-dd-remove-custom]')){
    handleDDRemoveCustom(t);
    renderPanel(activeTab);
    updateProgressUI();
    return;
  }
});

function handleDDToggle(t){
  const ctx = JSON.parse(t.dataset.ddCtx);
  const action = t.dataset.ddAction;
  const value = t.dataset.ddValue;
  const checked = t.checked;
  const co = action.startsWith('toggleCo') ? findById(state.cos, ctx.coId) : null;
  const planRow = action==='togglePlanAssessment' || action==='togglePlanCO' ? findById(state.plan, ctx.rowId) : null;

  const toggleArr = (arr) => {
    const i = arr.indexOf(value);
    if(checked && i===-1) arr.push(value);
    if(!checked && i>-1) arr.splice(i,1);
  };

  if(action==='toggleCoArr') toggleArr(co[ctx.field]);
  else if(action==='toggleCoAT') toggleArr(co.at);
  else if(action==='toggleCoDMA') toggleArr(co.dma);
  else if(action==='toggleCoCPWP'){
    if(value==='NoCEP'){
      co.cpwp = checked ? ['NoCEP'] : [];
    } else if(value==='P1'){
      if(checked){
        const arr = co.cpwp.filter(c=>c!=='NoCEP');
        if(!arr.includes('P1')) arr.push('P1');
        // BAETE minimum: P1 plus at least 2 more — pre-fill P2 and P3 by default
        ['P2','P3'].forEach(p=>{ if(!arr.includes(p)) arr.push(p); });
        co.cpwp = arr;
      } else {
        co.cpwp = []; // unchecking P1 requires re-selecting everything (P2–P7 need P1)
      }
    } else {
      const arr = co.cpwp.filter(c=>c!=='NoCEP');
      const i = arr.indexOf(value);
      if(checked){
        if(i===-1) arr.push(value);
        co.cpwp = arr;
      } else if(i>-1){
        // once P1 is active, at least 3 total (P1 + 2 more) must stay selected
        const totalIfRemoved = arr.length - 1;
        if(arr.includes('P1') && totalIfRemoved < 3){
          toast('At least 3 complex problem attributes (including P1) are required while CEP is active.');
        } else {
          arr.splice(i,1);
          co.cpwp = arr;
        }
      }
    }
  }
  else if(action==='toggleCoCAEA'){
    if(value==='NoCAEA'){
      co.caea = checked ? ['NoCAEA'] : [];
    } else if(value==='A1'){
      if(checked){
        const arr = co.caea.filter(c=>c!=='NoCAEA');
        if(!arr.includes('A1')) arr.push('A1');
        // minimum: A1 plus at least 1 more — pre-fill A2 by default
        if(!arr.includes('A2')) arr.push('A2');
        co.caea = arr;
      } else {
        co.caea = []; // unchecking A1 requires re-selecting everything (A2–A5 need A1)
      }
    } else {
      const arr = co.caea.filter(c=>c!=='NoCAEA');
      const i = arr.indexOf(value);
      if(checked){
        if(i===-1) arr.push(value);
        co.caea = arr;
      } else if(i>-1){
        // once A1 is active, at least 2 total (A1 + 1 more) must stay selected
        const totalIfRemoved = arr.length - 1;
        if(arr.includes('A1') && totalIfRemoved < 2){
          toast('At least 2 complex activity attributes (including A1) are required.');
        } else {
          arr.splice(i,1);
          co.caea = arr;
        }
      }
    }
  }
  else if(action==='togglePlanAssessment') toggleArr(planRow.assessment);
  else if(action==='togglePlanCO') toggleArr(planRow.cos);
  else if(action==='toggleSchedule'){
    if(!state.assessment.schedule[ctx.toolCode]) state.assessment.schedule[ctx.toolCode] = [];
    toggleArr(state.assessment.schedule[ctx.toolCode]);
  }
}

function handleDDRemoveCustom(t){
  const ctx = JSON.parse(t.dataset.ddCtx);
  const action = t.dataset.ddRemoveCustom;
  const value = t.dataset.ddValue;
  const co = action.startsWith('toggleCo') ? findById(state.cos, ctx.coId) : null;
  const planRow = action==='togglePlanAssessment' ? findById(state.plan, ctx.rowId) : null;

  const removeFrom = (arr) => { const i=arr.indexOf(value); if(i>-1) arr.splice(i,1); };
  if(action==='toggleCoAT'){ removeFrom(co.atCustom); removeFrom(co.at); }
  else if(action==='toggleCoDMA'){ removeFrom(co.dmaCustom); removeFrom(co.dma); }
  else if(action==='togglePlanAssessment'){ removeFrom(planRow.assessmentCustom); removeFrom(planRow.assessment); }
}

/* ---------- click delegation: buttons, tab switching, dd toggles, rte toolbar ---------- */
document.addEventListener('click', (e)=>{
  const tabItem = e.target.closest('.tab-item');
  if(tabItem){ switchTab(tabItem.dataset.tab); return; }

  const helpBtn = e.target.closest('[data-help]');
  if(helpBtn){ openHelpModal(helpBtn.dataset.help); return; }

  const ddToggle = e.target.closest('[data-dd-toggle]');
  if(ddToggle){
    const id = ddToggle.dataset.ddToggle;
    if(openDD === id){ closeDropdownPortal(); }
    else { openDropdownPortal(id); }
    e.stopPropagation();
    return;
  }
  if(!e.target.closest('.dd-check') && !e.target.closest('#ddPortal')){
    closeDropdownPortal();
  }

  const addCustomBtn = e.target.closest('[data-dd-add-custom]');
  if(addCustomBtn){
    const ctx = JSON.parse(addCustomBtn.dataset.ddCtx);
    const action = addCustomBtn.dataset.ddAddCustom;
    const inputEl = document.querySelector(`[data-dd-custom-input="${addCustomBtn.dataset.ddInput}"]`);
    const val = inputEl.value.trim();
    if(val){
      const co = action.startsWith('toggleCo') ? findById(state.cos, ctx.coId) : null;
      const planRow = action==='togglePlanAssessment' ? findById(state.plan, ctx.rowId) : null;
      if(action==='toggleCoAT'){ if(!co.atCustom.includes(val)) co.atCustom.push(val); if(!co.at.includes(val)) co.at.push(val); }
      else if(action==='toggleCoDMA'){ if(!co.dmaCustom.includes(val)) co.dmaCustom.push(val); if(!co.dma.includes(val)) co.dma.push(val); }
      else if(action==='togglePlanAssessment'){ if(!planRow.assessmentCustom.includes(val)) planRow.assessmentCustom.push(val); if(!planRow.assessment.includes(val)) planRow.assessment.push(val); }
      openDD = addCustomBtn.dataset.ddInput;
      renderPanel(activeTab);
      updateProgressUI();
    }
    return;
  }

  const rteBtn = e.target.closest('[data-rte-cmd]');
  if(rteBtn){
    const wrap = rteBtn.closest('[data-rte-wrap]');
    const body = wrap.querySelector('.rte-body');
    body.focus();
    const cmd = rteBtn.dataset.rteCmd;
    if(cmd==='createLink'){
      const url = prompt('Enter URL:', 'https://');
      if(url) document.execCommand(cmd, false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
    setPath(state, body.dataset.rteBind, body.innerHTML);
    return;
  }

  const actionEl = e.target.closest('[data-action]');
  if(actionEl){ handleAction(actionEl); return; }
});

function handleAction(el){
  const action = el.dataset.action;
  switch(action){
    case 'removePrereq':
      state.meta.prerequisites.splice(+el.dataset.idx, 1); break;
    case 'clearScheduleRow': {
      const row = findById(state[el.dataset.collection], el.dataset.rowId);
      if(row){ row.day=''; row.start=''; row.end=''; }
      break;
    }
    case 'addTeacher': state.teachers.push(newTeacher()); break;
    case 'removeTeacher': {
      const i = indexById(state.teachers, el.dataset.rowId);
      if(i>-1) state.teachers.splice(i,1);
      break;
    }
    case 'addObjective': state.objectives.push(''); break;
    case 'removeObjective': state.objectives.splice(+el.dataset.idx, 1); break;

    case 'addCO': state.cos.push(newCO(state.cos.length+1)); relabelCOs(); state.poMapping.push({coId: state.cos[state.cos.length-1].id, po:'PO(a)'}); break;
    case 'removeCO': {
      const i = indexById(state.cos, el.dataset.rowId);
      if(i>-1){
        const removedId = state.cos[i].id;
        state.cos.splice(i,1);
        relabelCOs();
        const pmIdx = state.poMapping.findIndex(m=>m.coId===removedId);
        if(pmIdx>-1) state.poMapping.splice(pmIdx,1);
        state.plan.forEach(row => { row.cos = row.cos.filter(c => state.cos.some(co=>co.label===c)); });
      }
      break;
    }

    case 'addPlanRow': state.plan.push(newPlanRow(state.plan.length+1)); break;
    case 'removePlanRow': {
      const i = indexById(state.plan, el.dataset.rowId);
      if(i>-1) state.plan.splice(i,1);
      break;
    }

    default: return;
  }
  renderPanel(activeTab);
  updateProgressUI();
}

function relabelCOs(){ state.cos.forEach((c,i)=> c.label = 'CO'+(i+1)); }

/* ---------- toolbar actions ---------- */
document.getElementById('btnReset').addEventListener('click', ()=>{
  if(confirm('Clear every field and start a new outline? This cannot be undone.')){
    state = defaultState();
    activeTab = 'info';
    renderAll();
    document.querySelectorAll('.panel').forEach(p=> p.classList.toggle('active', p.dataset.panel===activeTab));
    updateProgressUI();
    toast('Outline reset');
  }
});

document.getElementById('fileLoadJson').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const loaded = JSON.parse(reader.result);
      state = normalizeLoadedState(loaded);
      renderAll();
      document.querySelectorAll('.panel').forEach(p=> p.classList.toggle('active', p.dataset.panel===activeTab));
      updateProgressUI();
      toast('Outline loaded');
    }catch(err){
      alert('This file could not be read as a valid outline JSON.\n'+err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('btnDownloadJson').addEventListener('click', ()=>{
  const name = (state.meta.courseCode || 'course-outline').replace(/[^a-z0-9]+/gi,'-').toLowerCase();
  download(name+'.json', JSON.stringify(state, null, 2), 'application/json');
  toast('JSON downloaded');
});

document.getElementById('btnDownloadDocx').addEventListener('click', async ()=>{
  toast('Building Word document…');
  try{ await exportDocx(); toast('Word document downloaded'); }
  catch(err){ console.error(err); alert('Could not generate the Word document: '+err.message); }
});

document.getElementById('btnDownloadPdf').addEventListener('click', async ()=>{
  toast('Building PDF…');
  try{ await exportPdfFile(); toast('PDF downloaded'); }
  catch(err){ console.error(err); alert('Could not generate the PDF: '+err.message); }
});

document.getElementById('btnPreview').addEventListener('click', ()=>{
  buildPrintView();
  document.getElementById('printRoot').style.cssText = 'display:block;max-width:900px;margin:0 auto;background:#fff;padding:40px;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow-lg);';
  document.querySelector('.app').style.display='none';
  const closeBar = document.createElement('div');
  closeBar.style.cssText='position:fixed;top:16px;right:16px;z-index:200;';
  closeBar.innerHTML = `<button class="btn btn-primary" id="closePreview">Close Preview</button>`;
  document.body.appendChild(closeBar);
  document.getElementById('closePreview').addEventListener('click', ()=>{
    document.getElementById('printRoot').style.cssText='display:none;';
    document.querySelector('.app').style.display='';
    closeBar.remove();
  });
});

window.addEventListener('scroll', ()=>{ if(openDD) closeDropdownPortal(); }, true);
window.addEventListener('resize', ()=>{ if(openDD) closeDropdownPortal(); });

/* ---------- (?) help modal — BAETE reference text ---------- */
function openHelpModal(key){
  const data = HELP_CONTENT[key];
  if(!data) return;
  document.getElementById('helpModalTitle').textContent = data.title;
  document.getElementById('helpModalBody').innerHTML = data.items.map(it => `
    <div class="help-item">
      <div class="help-item-code">${escapeHtml(it.code)}</div>
      <div class="help-item-text">${escapeHtml(it.text)}</div>
    </div>`).join('');
  document.getElementById('helpModal').classList.add('open');
}
function closeHelpModal(){ document.getElementById('helpModal').classList.remove('open'); }
document.getElementById('helpModalClose').addEventListener('click', closeHelpModal);
document.getElementById('helpModal').addEventListener('click', (e)=>{
  if(e.target.id==='helpModal') closeHelpModal();
});

/* ---------- about / version popover ---------- */
document.getElementById('btnAbout').addEventListener('click', (e)=>{
  e.stopPropagation();
  document.getElementById('aboutPopover').classList.toggle('open');
});
document.addEventListener('click', (e)=>{
  const pop = document.getElementById('aboutPopover');
  if(pop.classList.contains('open') && !e.target.closest('#aboutPopover') && !e.target.closest('#btnAbout')){
    pop.classList.remove('open');
  }
});
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    closeHelpModal();
    document.getElementById('aboutPopover').classList.remove('open');
  }
});

/* ---------- init ---------- */
renderAll();
document.querySelectorAll('.panel').forEach(p=> p.classList.toggle('active', p.dataset.panel===activeTab));
updateProgressUI();
document.getElementById('aboutDeveloper').textContent = 'Developed by '+APP_DEVELOPER;
document.getElementById('aboutVersion').textContent = 'Version '+APP_VERSION;
