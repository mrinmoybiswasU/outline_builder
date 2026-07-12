/* =====================================================================
   RENDER — builds each tab panel's HTML from `state`
   ===================================================================== */

/* ---------- reusable dropdown-checkbox component ----------
   opts:      [{code,label}] fixed options
   selected:  array of codes currently checked
   customArr: array of custom string entries
   ddid:      unique id for this instance
   action:    action name used for data-action on toggle changes (handled centrally)
   ctx:       JSON-serialisable context object identifying what this controls
   opts2:     {allowCustom=true, customWarning=null}

   NOTE: the checkbox options themselves are NOT rendered inline — they are
   rendered into a single floating portal (#ddPortal, see app.js) positioned
   with fixed coordinates, so the panel is never clipped by a scrolling
   table or card and can float freely above the page.
*/
window.DD_REGISTRY = window.DD_REGISTRY || {};

function ddCheckHTML(ddid, opts, selected, customArr, action, ctx, opts2){
  const {allowCustom=true, customWarning=null} = opts2||{};
  DD_REGISTRY[ddid] = {opts, selected, customArr, action, ctx, allowCustom, customWarning};

  const chips = [
    ...selected.map(c => `<span class="dd-summary-chip">${escapeHtml(c)}</span>`),
    ...customArr.map(c => `<span class="dd-summary-chip">${escapeHtml(c)}</span>`),
  ].join('') || `<span class="hint">None selected</span>`;

  const count = selected.length + customArr.length;

  return `
  <div class="dd-check" data-ddid="${ddid}">
    <button type="button" class="dd-check-toggle ${count?'has-selection':''}" data-dd-toggle="${ddid}">
      <span>${count ? count+' selected' : 'Select…'}</span>
      <svg width="10" height="6" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>
    </button>
    <div class="dd-chips">${chips}</div>
  </div>`;
}

/* Builds the inner HTML of the floating panel for a given ddid, reading
   current data straight out of DD_REGISTRY (kept fresh on every render). */
function buildDDPanelHTML(ddid){
  const cfg = DD_REGISTRY[ddid];
  if(!cfg) return '';
  const {opts, selected, customArr, action, ctx, allowCustom, customWarning} = cfg;

  const optionRows = opts.map(o => `
    <label class="dd-check-option">
      <input type="checkbox" data-dd-action="${action}" data-dd-ctx='${escapeHtml(JSON.stringify(ctx))}' data-dd-value="${escapeHtml(o.code)}"
        ${selected.includes(o.code) ? 'checked':''}>
      <span><strong>${escapeHtml(o.code)}</strong>${o.label? ' — '+escapeHtml(o.label) : ''}</span>
    </label>`).join('') || `<div class="hint" style="padding:6px 4px;">Nothing to choose from yet.</div>`;

  const customRows = customArr.map((c) => `
    <label class="dd-check-option">
      <input type="checkbox" checked data-dd-remove-custom="${action}" data-dd-ctx='${escapeHtml(JSON.stringify(ctx))}' data-dd-value="${escapeHtml(c)}">
      <span><strong>Custom</strong> — ${escapeHtml(c)}</span>
    </label>`).join('');

  const customSection = allowCustom ? `
      ${customWarning ? `<div class="dd-custom-warning">⚠ ${escapeHtml(customWarning)}</div>` : ''}
      <div class="dd-check-custom">
        <input type="text" placeholder="Add custom…" data-dd-custom-input="${ddid}">
        <button type="button" class="btn btn-sm" data-dd-add-custom="${action}" data-dd-ctx='${escapeHtml(JSON.stringify(ctx))}' data-dd-input="${ddid}">Add</button>
      </div>` : '';

  return `${optionRows}${customRows}${customSection}`;
}

/* ---------- reusable mini rich-text editor ----------
   bindPath: dot-path into state where the HTML content lives
*/
function rteHTML(bindPath, content, placeholder){
  return `
  <div class="rte" data-rte-wrap>
    <div class="rte-toolbar">
      <button type="button" data-rte-cmd="bold" title="Bold"><b>B</b></button>
      <button type="button" data-rte-cmd="italic" title="Italic"><i>I</i></button>
      <button type="button" data-rte-cmd="underline" title="Underline"><u>U</u></button>
      <button type="button" data-rte-cmd="insertUnorderedList" title="Bulleted list">•≡</button>
      <button type="button" data-rte-cmd="insertOrderedList" title="Numbered list">1.≡</button>
      <button type="button" data-rte-cmd="createLink" title="Insert link">🔗</button>
    </div>
    <div class="rte-body" contenteditable="true" data-rte-bind="${bindPath}" data-placeholder="${escapeHtml(placeholder||'')}">${content||''}</div>
  </div>`;
}

/* =====================================================================
   TAB: Course Information  (Part A)
   ===================================================================== */
function renderInfoPanel(){
  const s = state.meta;
  const el = document.getElementById('panel-info');

  const prereqChips = s.prerequisites.map((p,i)=>`
    <span class="chip">${escapeHtml(p)}<button type="button" data-action="removePrereq" data-idx="${i}">×</button></span>`).join('');

  const scheduleRows = (rows) => rows.map((r,i)=>`
    <div class="row-item" data-row-id="${r.id}">
      <div class="row-idx">${i+1}</div>
      <div class="row-fields">
        <select data-bind-row="day" data-collection="__COLLECTION__" data-row-id="${r.id}">
          <option value="">— Day (optional) —</option>
          ${DAYS.map(d=>`<option value="${d}" ${r.day===d?'selected':''}>${d}</option>`).join('')}
        </select>
        <input type="time" value="${r.start}" data-bind-row="start" data-collection="__COLLECTION__" data-row-id="${r.id}" placeholder="Start">
        <input type="time" value="${r.end}" data-bind-row="end" data-collection="__COLLECTION__" data-row-id="${r.id}" placeholder="End">
      </div>
      <button type="button" class="btn btn-ghost btn-sm row-remove" data-action="clearScheduleRow" data-collection="__COLLECTION__" data-row-id="${r.id}" title="Clear this row">Clear</button>
    </div>`).join('');

  const teacherCards = state.teachers.map((t,i)=>`
    <div class="teacher-card" data-row-id="${t.id}">
      <div class="teacher-card-head">
        <span>Teacher ${i+1}</span>
        ${state.teachers.length>1 ? `<button type="button" class="btn btn-ghost btn-sm" data-action="removeTeacher" data-row-id="${t.id}">Remove</button>`:''}
      </div>
      <div class="grid">
        <div class="field col-6"><label>Name</label>
          <input type="text" data-bind="teachers.${i}.name" value="${escapeHtml(t.name)}" placeholder="Dr. Jane Doe"></div>
        <div class="field col-6"><label>Designation</label>
          <input type="text" data-bind="teachers.${i}.designation" value="${escapeHtml(t.designation)}" placeholder="Assistant Professor"></div>
        <div class="field col-4"><label>Office Room</label>
          <input type="text" data-bind="teachers.${i}.room" value="${escapeHtml(t.room)}" placeholder="Room 412"></div>
        <div class="field col-4"><label>Email</label>
          <input type="email" data-bind="teachers.${i}.email" value="${escapeHtml(t.email)}" placeholder="name@uits.edu.bd"></div>
        <div class="field col-4"><label>Cell Phone No.</label>
          <input type="text" data-bind="teachers.${i}.cell" value="${escapeHtml(t.cell)}" placeholder="+880 1XXX-XXXXXX"></div>
        <div class="field col-12"><label>Specialization</label>
          <input type="text" data-bind="teachers.${i}.specialization" value="${escapeHtml(t.specialization)}" placeholder="e.g., Databases, Distributed Systems"></div>
      </div>
    </div>`).join('');

  const objectiveRows = state.objectives.map((o,i)=>`
    <div class="obj-row" data-row-id="${i}">
      <span class="obj-idx">${i+1}.</span>
      <input type="text" style="flex:1" data-bind="objectives.${i}" value="${escapeHtml(o)}" placeholder="Describe a course objective…">
      ${state.objectives.length>1?`<button type="button" class="btn btn-ghost btn-sm" data-action="removeObjective" data-idx="${i}">×</button>`:''}
    </div>`).join('');

  el.innerHTML = `
    <div class="section-head">
      <span class="section-eyebrow">Part A</span>
      <h2 class="section-title">Course Information</h2>
      <p class="section-desc">General identification, scheduling and staffing details for this course outline.</p>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">1–3</span> Identification</div>
      <div class="grid">
        <div class="field col-4"><label>Program <span class="req">*</span></label>
          <select data-bind="meta.program">
            <option value="">Select…</option>
            <option ${s.program==='BSc. in CSE'?'selected':''}>BSc. in CSE</option>
            <option ${s.program==='MSc. in CSE'?'selected':''}>MSc. in CSE</option>
          </select></div>
        <div class="field col-4"><label>Course Code <span class="req">*</span></label>
          <input type="text" data-bind="meta.courseCode" value="${escapeHtml(s.courseCode)}" placeholder="e.g., CSE 316"></div>
        <div class="field col-4"><label>Course Title <span class="req">*</span></label>
          <input type="text" data-bind="meta.courseTitle" value="${escapeHtml(s.courseTitle)}" placeholder="e.g., Database Management System Lab"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">4–6</span> Classification &amp; Timing</div>
      <div class="grid">
        <div class="field col-4"><label>Course Type — Category <span class="req">*</span></label>
          <select data-bind="meta.courseCategory">
            <option value="">Select…</option>
            <option ${s.courseCategory==='GED'?'selected':''}>GED</option>
            <option ${s.courseCategory==='Core Course'?'selected':''}>Core Course</option>
            <option ${s.courseCategory==='Electives'?'selected':''}>Electives</option>
          </select></div>
        <div class="field col-4"><label>Course Type — Mode <span class="req">*</span></label>
          <select data-bind="meta.courseMode">
            <option value="">Select…</option>
            <option ${s.courseMode==='Theory'?'selected':''}>Theory</option>
            <option ${s.courseMode==='Lab/Sessional'?'selected':''}>Lab/Sessional</option>
          </select></div>
        <div class="field col-4"><label>Year/Level/Semester/Term <span class="req">*</span></label>
          <select data-bind="meta.level">
            <option value="">Select…</option>
            ${['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(n=>`<option ${s.level===n+' Semester'?'selected':''}>${n} Semester</option>`).join('')}
          </select></div>

        <div class="field col-4"><label>Academic Session <span class="req">*</span></label>
          <select data-bind="meta.sessionTerm">
            <option value="">Select…</option>
            ${['Autumn','Spring','Fall','Summer'].map(t=>`<option ${s.sessionTerm===t?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div class="field col-4"><label>Session Year <span class="req">*</span></label>
          <input type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" data-bind="meta.sessionYear" value="${escapeHtml(s.sessionYear)}" placeholder="e.g., 2025"></div>
        <div class="field col-4"><label>Section</label>
          <input type="text" data-bind="meta.section" value="${escapeHtml(s.section)}" placeholder="e.g., 5A2">
          <span class="hint">Leave empty if this is a general (section-independent) outline.</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">7–9</span> Prerequisites &amp; Load</div>
      <div class="grid">
        <div class="field col-6"><label>Prerequisite Course(s)</label>
          <div class="tag-input-wrap">
            ${prereqChips}
            <input type="text" id="prereqInput" placeholder="Type a course and press comma or Enter…">
          </div>
          <span class="hint">Only add a prerequisite if this course genuinely requires one — separate multiple courses with a comma. Otherwise, leave this empty.</span></div>
        <div class="field col-3"><label>Credit Value <span class="req">*</span></label>
          <input type="number" step="0.01" min="0" data-bind="meta.creditValue" value="${escapeHtml(s.creditValue)}" placeholder="e.g., 1.50"></div>
        <div class="field col-3"><label>Contact Hours <span class="req">*</span></label>
          <div class="input-suffix">
            <input type="number" step="0.01" min="0" data-bind="meta.contactHours" value="${escapeHtml(s.contactHours)}" placeholder="e.g., 3.00">
            <span>hours/Week</span>
          </div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">11</span> Class Schedule</div>
      <p class="hint" style="margin-bottom:10px;">Add up to 5 slots. Leave every field empty for a general outline — and only fill the slots that actually exist.</p>
      <div class="rows-list" id="classScheduleRows">${scheduleRows(state.classSchedule).replaceAll('__COLLECTION__','classSchedule')}</div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">12</span> Counseling Schedule</div>
      <p class="hint" style="margin-bottom:10px;">Same as above — leave empty for a general outline, and fill only the slots that exist.</p>
      <div class="rows-list" id="counselingScheduleRows">${scheduleRows(state.counselingSchedule).replaceAll('__COLLECTION__','counselingSchedule')}</div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">13</span> Course Teacher(s)</div>
      ${teacherCards}
      <button type="button" class="btn" data-action="addTeacher">+ Add Teacher</button>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">14</span> Rationale of the Course</div>
      <textarea rows="4" data-bind="rationale" placeholder="Why does this course exist — what gap does it fill in the curriculum?">${escapeHtml(state.rationale)}</textarea>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">15</span> Course Objectives</div>
      <div class="rows-list" id="objectivesRows">${objectiveRows}</div>
      <button type="button" class="btn" style="margin-top:10px;" data-action="addObjective">+ Add Objective</button>
    </div>
  `;

  // prerequisite tag input
  const pin = document.getElementById('prereqInput');
  if(pin){
    pin.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===','){
        e.preventDefault();
        const v = pin.value.replace(/,/g,'').trim();
        if(v){ state.meta.prerequisites.push(v); renderAll(); focusLater('prereqInput'); }
        pin.value='';
      }
    });
  }
}

function focusLater(id){ setTimeout(()=>{ const e=document.getElementById(id); if(e) e.focus(); }, 0); }

/* =====================================================================
   TAB: Skill Mapping (Part B) — CO table + PO mapping
   ===================================================================== */
function renderSkillPanel(){
  const el = document.getElementById('panel-skill');

  const fillTd = (hasValue, extra) => `td class="${hasValue?'cell-filled':''}"${extra?(' '+extra):''}`;

  const coRows = state.cos.map((co, idx) => `
    <tr data-row-id="${co.id}">
      <td class="co-label-cell">${co.label}</td>
      <${fillTd(co.text.trim(), 'style="min-width:220px;"')}>
        <textarea data-bind="cos.${idx}.text" placeholder="Describe this course outcome… (use **word** to bold a keyword)">${escapeHtml(co.text)}</textarea>
      </td>
      <${fillTd(co.bt.length, 'style="min-width:160px;"')}>${ddCheckHTML('bt-'+co.id, BT_DEFAULTS, co.bt, [], 'toggleCoArr', {coId:co.id, field:'bt'}, {allowCustom:false})}</td>
      <${fillTd(co.cpwp.length)}>${ddCheckHTML('cpwp-'+co.id, CPWP_DEFAULTS, co.cpwp, [], 'toggleCoArr', {coId:co.id, field:'cpwp'}, {allowCustom:false})}</td>
      <${fillTd(co.caea.length)}>${ddCheckHTML('caea-'+co.id, CAEA_DEFAULTS, co.caea, [], 'toggleCoArr', {coId:co.id, field:'caea'}, {allowCustom:false})}</td>
      <${fillTd(co.kpwk.length)}>${ddCheckHTML('kpwk-'+co.id, KPWK_DEFAULTS, co.kpwk, [], 'toggleCoArr', {coId:co.id, field:'kpwk'}, {allowCustom:false})}</td>
      <${fillTd(co.at.length)}>${ddCheckHTML('at-'+co.id, AT_DEFAULTS.map(a=>({code:a.code,label:a.label})), co.at, co.atCustom, 'toggleCoAT', {coId:co.id}, {allowCustom:true, customWarning:'Adding a custom assessment tool requires prior approval from the PSAC committee.'})}</td>
      <${fillTd(co.dma.length)}>${ddCheckHTML('dma-'+co.id, DMA_DEFAULTS.map(d=>({code:d,label:''})), co.dma, co.dmaCustom, 'toggleCoDMA', {coId:co.id}, {allowCustom:true})}</td>
      <td>${state.cos.length>1?`<button type="button" class="btn btn-ghost btn-sm" data-action="removeCO" data-row-id="${co.id}">Remove</button>`:''}</td>
    </tr>`).join('');

  const cpwpMap = {}, caeaMap = {};
  state.cos.forEach(co=>{
    co.cpwp.forEach(n=>{ (cpwpMap[n] = cpwpMap[n]||[]).push(co.label); });
    co.caea.forEach(n=>{ (caeaMap[n] = caeaMap[n]||[]).push(co.label); });
  });
  const warnings = [];
  Object.entries(cpwpMap).forEach(([n,list])=>{ if(list.length>1) warnings.push(`Complex Problem ${n} is mapped to more than one CO (${list.join(', ')}) — department guideline asks for only one.`); });
  Object.entries(caeaMap).forEach(([n,list])=>{ if(list.length>1) warnings.push(`Complex Activity ${n} is mapped to more than one CO (${list.join(', ')}) — department guideline asks for only one.`); });

  // custom AT tools added anywhere — surfaced in the legend, since they need PSAC approval
  const customATs = [...new Set(state.cos.flatMap(co=>co.atCustom))];

  const poHeaders = PO_VALUES.map(p=>`<th>${p}</th>`).join('');
  const poRows = state.cos.map((co)=>{
    const mapping = state.poMapping.find(m=>m.coId===co.id) || {coId:co.id, po:'PO(a)'};
    const cells = PO_VALUES.map(poVal=>{
      return `<td class="po-cell ${mapping.po===poVal?'po-cell-selected':''}"><input type="radio" class="po-radio" name="po-row-${co.id}" data-action="setPO" data-row-id="${co.id}" value="${poVal}" ${mapping.po===poVal?'checked':''}></td>`;
    }).join('');
    return `<tr><td class="co-label-cell">${co.label}</td>${cells}</tr>`;
  }).join('');

  el.innerHTML = `
    <div class="section-head">
      <span class="section-eyebrow">Part B</span>
      <h2 class="section-title">Skill Mapping</h2>
      <p class="section-desc">Course Outcomes and their mapping to Program Outcomes, Bloom's Taxonomy, Complex Engineering Problems/Activities, Knowledge Profile, Assessment Tools and Delivery Methods.</p>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">16</span> Course Outcomes (COs)</div>
      <div class="notice info">
        <svg width="16" height="16" viewBox="0 0 20 20"><path fill="currentColor" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 12H9v-6h2v6zm0-8H9V4h2v2z"/></svg>
        <div>As per department guideline, map each Complex Problem (CP/WP) and Complex Activity (CA/EA) attribute to <strong>only one CO</strong>. Both may stay empty if this course has no complex problem or complex activity assigned. A filled cell is tinted green so you can see progress at a glance.</div>
      </div>
      <div class="table-scroll">
        <table class="obe-table">
          <thead><tr>
            <th>No.</th><th>COs</th><th>BT (Bloom's Level)</th><th>CP/WP</th><th>CA/EA</th><th>KP/WK</th><th>AT</th><th>DM&amp;A</th><th></th>
          </tr></thead>
          <tbody>${coRows}</tbody>
        </table>
      </div>
      ${warnings.length? `<ul class="validation-list">${warnings.map(w=>`<li>⚠ ${w}</li>`).join('')}</ul>` : ''}
      <button type="button" class="btn" style="margin-top:12px;" data-action="addCO">+ Add New Row</button>

      <div class="legend-box">
        <strong>Legend:</strong> COs– Course Outcome; BT– Bloom's Taxonomy; CP/WP– Complex Engineering Problems; CA/EA– Complex Engineering Activities; AT– Assessment Tools; KP/WK– Knowledge Profile; DM&amp;A– Delivery Methods &amp; Activities; LT– Lab Test, LF– Lab Final, Q– Quiz, R– Report, P– Presentation, V– Viva, A– Assignment, CP– Class Performance.
        ${customATs.length? `<br><strong>Custom Assessment Tool(s) — PSAC approved:</strong> ${customATs.map(escapeHtml).join(', ')}` : ''}
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">17</span> Mapping of COs with Program Outcomes (POs)</div>
      <div class="notice">
        <svg width="16" height="16" viewBox="0 0 20 20"><path fill="currentColor" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 12H9v-6h2v6zm0-8H9V4h2v2z"/></svg>
        <div>As per departmental practice, each CO is mapped to <strong>only one PO</strong> — selecting a PO for a row automatically clears any other selection on that row. Every CO defaults to PO(a) until changed.</div>
      </div>
      <div class="table-scroll">
        <table class="obe-table">
          <thead><tr><th>Course Outcomes (CO)</th>${poHeaders}</tr></thead>
          <tbody>${poRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* =====================================================================
   TAB: Teaching Learning Approach (Part C) — Course Plan
   ===================================================================== */
function renderTeachingPanel(){
  const el = document.getElementById('panel-teaching');
  const availableTools = derivedAssessmentTools();

  const planRows = state.plan.map((row, idx) => `
    <tr data-row-id="${row.id}">
      <td style="min-width:60px;"><input type="text" data-bind="plan.${idx}.week" value="${escapeHtml(row.week)}" style="width:52px;text-align:center;"></td>
      <td style="min-width:220px;">${rteHTML('plan.'+idx+'.topics', row.topics, 'Topics covered this week…')}</td>
      <td style="min-width:220px;">${rteHTML('plan.'+idx+'.activity', row.activity, 'Suggested activity & teaching strategy…')}</td>
      <td style="min-width:170px;">${ddCheckHTML('assess-'+row.id, availableTools, row.assessment, [], 'togglePlanAssessment', {rowId:row.id}, {allowCustom:false})}</td>
      <td style="min-width:150px;">${ddCheckHTML('cos-'+row.id, state.cos.map(c=>({code:c.label,label:''})), row.cos, [], 'togglePlanCO', {rowId:row.id}, {allowCustom:false})}</td>
      <td>${state.plan.length>1?`<button type="button" class="btn btn-ghost btn-sm" data-action="removePlanRow" data-row-id="${row.id}">Remove</button>`:''}</td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="section-head">
      <span class="section-eyebrow">Part C</span>
      <h2 class="section-title">Teaching Learning Approach</h2>
      <p class="section-desc">Weekly course plan specifying contents, Course Outcomes, co-curricular activities, and teaching/learning &amp; assessment strategy.</p>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">18</span> Semester Dates</div>
      <div class="grid">
        <div class="field col-4"><label>Commencement of the Semester</label>
          <input type="date" data-bind="semesterStart" value="${state.semesterStart}"></div>
        <div class="field col-4"><label>Last Class of the Semester</label>
          <input type="date" data-bind="semesterEnd" value="${state.semesterEnd}"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">18</span> Course Plan</div>
      <div class="table-scroll">
        <table class="obe-table">
          <thead><tr><th>Week</th><th>Topics</th><th>Suggested Activity &amp; Teaching Strategy</th><th>Assessment Strategy</th><th>Corresponding COs</th><th></th></tr></thead>
          <tbody>${planRows}</tbody>
        </table>
      </div>
      <button type="button" class="btn" style="margin-top:12px;" data-action="addPlanRow">+ Add New Row</button>
      ${availableTools.length? '' : `<p class="hint" style="margin-top:10px;">No assessment tools are available yet — select some in the Course Outcomes table (Part B) first.</p>`}
      <p class="hint" style="margin-top:10px;">Assessment Strategy only lists tools already selected in the Course Outcomes table (Part B) — add new tools there.</p>
    </div>
  `;
}

/* =====================================================================
   TAB: Assessment Approach (Part D)
   ===================================================================== */
function derivedAssessmentTools(){
  const map = new Map(); // code -> label
  state.cos.forEach(co=>{
    co.at.forEach(code=>{
      if(code.toUpperCase()==='FE') return;
      const def = AT_DEFAULTS.find(a=>a.code===code);
      map.set(code, def? def.label : code);
    });
    co.atCustom.forEach(c=>{
      if(c.toUpperCase()==='FE') return;
      map.set(c, c);
    });
  });
  return [...map.entries()].map(([code,label])=>({code,label}));
}

function renderAssessmentPanel(){
  const el = document.getElementById('panel-assessment');
  const tools = derivedAssessmentTools();
  const isTheory = state.meta.courseMode !== 'Lab/Sessional'; // default to theory-style table unless Lab/Sessional chosen

  const pct = (v) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  };
  let total = pct(state.assessment.attendanceMarks);
  const toolRows = tools.map(t=>{
    const val = state.assessment.rowMarks[t.code] || '';
    total += pct(val);
    return `<tr><td>${isTheory?'Continuous Internal Assessment (CIA)':'Continuous Internal Assessment (CIA) (100%)'}</td><td>${escapeHtml(t.label)} <span class="hint">(${escapeHtml(t.code)})</span></td>
      <td><input type="text" placeholder="e.g., 10% — leave empty if unused" data-bind-mark="${escapeHtml(t.code)}" value="${escapeHtml(val)}" style="width:100%;"></td></tr>`;
  }).join('') || `<tr><td colspan="3" class="hint">No assessment tools have been selected yet in Part B (Course Outcomes) — add some there first.</td></tr>`;

  if(isTheory){ total += pct(state.assessment.feMarks); }
  const totalOk = Math.round(total) === 100;

  el.innerHTML = `
    <div class="section-head">
      <span class="section-eyebrow">Part D</span>
      <h2 class="section-title">Assessment Approach</h2>
      <p class="section-desc">Marks distribution, Bloom's category weighting per assessment tool, and the department's grading scale.</p>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">19</span> Assessment and Evaluation</div>
      <p class="hint" style="margin-bottom:12px;">
        Table shown reflects the Course Type set in Part A (currently: <strong>${escapeHtml(state.meta.courseMode||'not set — defaulting to Theory')}</strong>).
        Rows below Attendance are generated automatically from the Assessment Tools (AT) selected for each Course Outcome in Part B.
      </p>
      <div class="table-scroll">
        <table class="obe-table">
          <thead><tr><th>Assessment Components</th><th></th><th style="width:220px;">Marks Distribution</th></tr></thead>
          <tbody>
            <tr><td colspan="2">Attendance</td><td><input type="text" placeholder="e.g., 10% — leave empty if unused" data-bind-mark="attendance" value="${escapeHtml(state.assessment.attendanceMarks)}" style="width:100%;"></td></tr>
            ${toolRows}
            ${isTheory? `<tr><td colspan="2">Final Exam (FE)</td><td><input type="text" placeholder="e.g., 50%" data-bind-mark="fe" value="${escapeHtml(state.assessment.feMarks)}" style="width:100%;"></td></tr>` : ''}
            <tr class="total-row"><td colspan="2">Total</td><td><span class="total-badge ${totalOk?'ok':'bad'}">${Math.round(total)}%</span> ${!totalOk?'<span class="hint warn"> should equal 100%</span>':''}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">20</span> Assessment Pattern — Continuous Internal Evaluation (100 Marks)</div>
      <p class="hint" style="margin-bottom:12px;">The percentage distribution of Bloom's categories in the assessment tools may vary by ±5%. Leave a cell empty if that evaluation method is not used for this course.</p>
      ${renderBloomTable()}
      <button type="button" class="btn" style="margin-top:12px;" data-action="addBloomCol">+ Add Column</button>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">21</span> Grading System</div>
      <p class="hint" style="margin-bottom:10px;">Standard department grading scale.</p>
      <div class="table-scroll">
        <table class="obe-table">
          <thead><tr><th>Numerical Grade</th><th>Letter Grade</th><th>Grade Point</th></tr></thead>
          <tbody>
            ${GRADING_TABLE.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderBloomTable(){
  const cols = state.bloomCols;
  const headers = cols.map(c=>`<th style="min-width:130px;">
      <input type="text" data-bind-bloomcol="${c.id}" value="${escapeHtml(c.name)}" style="font-size:11px;padding:4px 6px;">
      <button type="button" class="btn btn-ghost btn-sm" style="color:#fff;" data-action="removeBloomCol" data-row-id="${c.id}" title="Remove column">×</button>
    </th>`).join('');
  const rows = BLOOM_ROWS.map(rowKey=>{
    const cells = cols.map(c=>`<td><input type="text" placeholder="—" data-bind-bloomval="${c.id}" data-bloomrow="${rowKey}" value="${escapeHtml(c.values[rowKey]||'')}" style="width:100%;text-align:center;"></td>`).join('');
    return `<tr><td><strong>${rowKey}</strong></td>${cells}</tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="obe-table">
    <thead><tr><th>Bloom's Category</th>${headers}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/* =====================================================================
   TAB: References (Part E)
   ===================================================================== */
function renderReferencesPanel(){
  const el = document.getElementById('panel-references');
  const r = state.references;

  el.innerHTML = `
    <div class="section-head">
      <span class="section-eyebrow">Part E</span>
      <h2 class="section-title">References</h2>
      <p class="section-desc">Learning materials for the course. Each box is a live, formattable text area — what you see is exactly how it will appear in the exported outline.</p>
    </div>

    <div class="card">
      <div class="card-title"><span class="num">22a</span> Recommended Readings</div>
      ${rteHTML('references.recommended', r.recommended, 'Lecture notes, necessary documents, where they are hosted…')}
    </div>

    <div class="card">
      <div class="card-title"><span class="num">22b</span> Supplementary Readings — Text Book</div>
      ${rteHTML('references.textbooks', r.textbooks, 'List textbooks — author, edition, year…')}
    </div>

    <div class="card">
      <div class="card-title"><span class="num">22b</span> Supplementary Readings — Others</div>
      ${rteHTML('references.others', r.others, 'Cite websites, tutorials, and the date accessed…')}
    </div>

    <div class="card">
      <div class="card-title"><span class="num">22c</span> Others (as applicable for the discipline/academic program)</div>
      ${rteHTML('references.othersDiscipline', r.othersDiscipline, 'N/A if not applicable…')}
    </div>
  `;
}

/* =====================================================================
   TAB: Additional Information (Part F)
   ===================================================================== */
const ADDITIONAL_FIELDS = [
  {key:'programOutcome',     label:'Program Outcome'},
  {key:'obeCurriculum',      label:'Outcome Based Curriculum'},
  {key:'courseCatalog',      label:'Course Catalog'},
  {key:'facultyInfo',        label:'Faculty Information'},
  {key:'assessmentRubrics',  label:'Assessments Rubrics'},
  {key:'bloomDetails',       label:"Details of Bloom Taxonomy, Knowledge Profile, Complex Engineering Problems & Activities"},
  {key:'makeupExam',         label:'Make-up Exam Procedure'},
  {key:'attendancePolicy',   label:'Attendance Policy'},
  {key:'academicCalendar',   label:'Academic Calendar'},
  {key:'academicPolicies',   label:'Academic Policies'},
  {key:'proctorialRules',    label:'Proctorial Rules (Code of Conduct)'},
];

function renderAdditionalPanel(){
  const el = document.getElementById('panel-additional');
  const a = state.additional;

  const rows = ADDITIONAL_FIELDS.map(f=>`
    <div class="info-item">
      <label>${f.label}</label>
      <input type="text" data-bind="additional.${f.key}" value="${escapeHtml(a[f.key])}" placeholder="Add a link or short note…">
    </div>`).join('');

  el.innerHTML = `
    <div class="section-head">
      <span class="section-eyebrow">Part F</span>
      <h2 class="section-title">Additional Information</h2>
      <p class="section-desc">Standing department links and policy references. Defaults are pre-filled — edit only if this outline needs a different value.</p>
    </div>
    <div class="card">
      <div class="info-list">${rows}</div>
    </div>
  `;
}
