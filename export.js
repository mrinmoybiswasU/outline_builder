/* =====================================================================
   EXPORT — print/PDF view + DOCX generator
   ===================================================================== */

function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso+'T00:00:00');
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
}
function joinNonEmpty(arr, sep){ return arr.filter(Boolean).join(sep); }
function semesterLabel(){
  const m = state.meta;
  return joinNonEmpty([m.sessionTerm, m.sessionYear], ' ') || 'Semester not set';
}
function scheduleText(rows){
  const filled = rows.filter(r=>r.day || r.start || r.end);
  if(!filled.length) return 'Not specified';
  return filled.map(r=> `${r.day||'—'} ${r.start||'—'}–${r.end||'—'}`).join('; ');
}
function coAtLabel(co){
  return joinNonEmpty([...co.at.filter(c=>!co.atCustom.includes(c)), ...co.atCustom], ', ') || '—';
}
function coDmaLabel(co){
  return joinNonEmpty([...co.dma.filter(c=>!co.dmaCustom.includes(c)), ...co.dmaCustom], ', ') || '—';
}
function planAssessLabel(row){ return joinNonEmpty(row.assessment, ', ') || '—'; }
function planCoLabel(row){ return joinNonEmpty(row.cos, ', ') || '—'; }

/* ---------- shared document model, used by both PDF view and DOCX ---------- */
function docTitle(){
  const m = state.meta;
  return joinNonEmpty([m.courseCode, m.courseTitle], ': ') || 'Untitled Course Outline';
}
function docSubtitle(){
  const m = state.meta;
  return joinNonEmpty([m.program, m.level, joinNonEmpty([m.sessionTerm, m.sessionYear],' '), m.section?('Section '+m.section):''], ' · ');
}

/* ===================== PRINT / PDF VIEW ===================== */
function buildPrintView(){
  const root = document.getElementById('printRoot');
  const m = state.meta;
  const isTheory = m.courseMode !== 'Lab/Sessional';
  const tools = derivedAssessmentTools();

  const teacherBlocks = state.teachers.map(t=>`
    <div class="kv"><b>${escapeHtml(t.name||'—')}</b> — ${escapeHtml(t.designation||'—')}</div>
    <div class="kv" style="grid-template-columns:1fr;font-size:11px;color:#555;">
      Room ${escapeHtml(t.room||'—')} · ${escapeHtml(t.email||'—')} · ${escapeHtml(t.cell||'—')} · ${escapeHtml(t.specialization||'—')}
    </div>`).join('<br>');

  const coRows = state.cos.map(co=>`
    <tr><td>${co.label}</td><td>${escapeHtml(co.text)}</td><td>${co.bt.join(', ')||'—'}</td>
      <td>${co.cpwp.join(', ')||'—'}</td><td>${co.caea.join(', ')||'—'}</td><td>${co.kpwk.join(', ')||'—'}</td>
      <td>${coAtLabel(co)}</td><td>${coDmaLabel(co)}</td></tr>`).join('');

  const poRows = state.cos.map(co=>{
    const map = state.poMapping.find(p=>p.coId===co.id);
    const cells = PO_VALUES.map(poVal=>{
      return `<td style="text-align:center;">${map && map.po===poVal? '✓':''}</td>`;
    }).join('');
    return `<tr><td>${co.label}</td>${cells}</tr>`;
  }).join('');

  const planRows = state.plan.map(r=>`
    <tr><td>${escapeHtml(r.week)}</td><td>${r.topics||'—'}</td><td>${r.activity||'—'}</td>
      <td>${planAssessLabel(r)}</td><td>${planCoLabel(r)}</td></tr>`).join('');

  let total = parseFloat(state.assessment.attendanceMarks)||0;
  const toolRows = tools.map(t=>{
    const v = state.assessment.rowMarks[t.code]||'';
    total += parseFloat(v)||0;
    return `<tr><td>Continuous Internal Assessment (CIA)</td><td>${escapeHtml(t.label)}</td><td>${escapeHtml(v||'—')}</td></tr>`;
  }).join('');
  if(isTheory) total += parseFloat(state.assessment.feMarks)||0;

  const bloomHeaders = state.bloomCols.map(c=>`<th>${escapeHtml(c.name)}</th>`).join('');
  const bloomRows = BLOOM_ROWS.map(rk=>`<tr><td><b>${rk}</b></td>${state.bloomCols.map(c=>`<td style="text-align:center;">${escapeHtml(c.values[rk]||'')}</td>`).join('')}</tr>`).join('');

  root.innerHTML = `
  <div class="doc-page">
    <h1>${escapeHtml(docTitle())}</h1>
    <div class="doc-sub">University of Information Technology &amp; Sciences (UITS) · Department of Computer Science &amp; Engineering</div>
    <div class="doc-sub">${escapeHtml(docSubtitle())}</div>

    <h2>Part A: Course Information</h2>
    <div class="kv"><span>Course Type</span><b>${escapeHtml(joinNonEmpty([m.courseCategory,m.courseMode],' · ')||'—')}</b></div>
    <div class="kv"><span>Prerequisite(s)</span><b>${escapeHtml(m.prerequisites.join(', ')||'None')}</b></div>
    <div class="kv"><span>Credit Value</span><b>${escapeHtml(m.creditValue||'—')}</b></div>
    <div class="kv"><span>Contact Hours</span><b>${escapeHtml(m.contactHours||'—')} hours/Week</b></div>
    <div class="kv"><span>Class Schedule</span><b>${scheduleText(state.classSchedule)}</b></div>
    <div class="kv"><span>Counseling Schedule</span><b>${scheduleText(state.counselingSchedule)}</b></div>
    <h3>Course Teacher(s)</h3>
    ${teacherBlocks}
    <h3>Rationale of the Course</h3>
    <p>${escapeHtml(state.rationale)||'—'}</p>
    <h3>Course Objectives</h3>
    <ul>${state.objectives.filter(o=>o.trim()).map(o=>`<li>${escapeHtml(o)}</li>`).join('') || '<li>—</li>'}</ul>

    <h2>Part B: Skill Mapping</h2>
    <h3>Course Outcomes (COs)</h3>
    <table><thead><tr><th>No.</th><th>COs</th><th>BT</th><th>CP/WP</th><th>CA/EA</th><th>KP/WK</th><th>AT</th><th>DM&amp;A</th></tr></thead>
    <tbody>${coRows}</tbody></table>
    <div class="doc-footnote">COs– Course Outcome; BT– Bloom's Taxonomy; CP/WP– Complex Engineering Problems; CA/EA– Complex Engineering Activities; AT– Assessment Tools; KP/WK– Knowledge Profile; DM&amp;A– Delivery Methods &amp; Activities.</div>
    <h3>Mapping of COs with Program Outcomes (POs)</h3>
    <table><thead><tr><th>CO</th>${PO_VALUES.map(p=>`<th>${p}</th>`).join('')}</tr></thead>
    <tbody>${poRows}</tbody></table>

    <h2>Part C: Teaching Learning Approach</h2>
    <div class="kv"><span>Commencement of Semester</span><b>${fmtDate(state.semesterStart)}</b></div>
    <div class="kv"><span>Last Class of Semester</span><b>${fmtDate(state.semesterEnd)}</b></div>
    <table><thead><tr><th>Week</th><th>Topics</th><th>Suggested Activity &amp; Teaching Strategy</th><th>Assessment Strategy</th><th>Corresponding COs</th></tr></thead>
    <tbody>${planRows}</tbody></table>

    <h2>Part D: Assessment Approach</h2>
    <table><thead><tr><th>Assessment Components</th><th></th><th>Marks Distribution</th></tr></thead>
    <tbody>
      <tr><td colspan="2">Attendance</td><td>${escapeHtml(state.assessment.attendanceMarks||'—')}</td></tr>
      ${toolRows}
      ${isTheory? `<tr><td colspan="2">Final Exam (FE)</td><td>${escapeHtml(state.assessment.feMarks||'—')}</td></tr>` : ''}
      <tr><td colspan="2"><b>Total</b></td><td><b>${Math.round(total)}%</b></td></tr>
    </tbody></table>

    <h3>Assessment Pattern — Continuous Internal Evaluation (100 Marks)</h3>
    <table><thead><tr><th>Bloom's Category</th>${bloomHeaders}</tr></thead><tbody>${bloomRows}</tbody></table>
    <div class="doc-footnote">*The percentage distribution of Bloom's categories in the assessment tools may vary by ±5%.</div>

    <h3>Grading System</h3>
    <table><thead><tr><th>Numerical Grade</th><th>Letter Grade</th><th>Grade Point</th></tr></thead>
    <tbody>${GRADING_TABLE.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>

    <h2>Part E: References</h2>
    <h3>Recommended Readings</h3>${state.references.recommended}
    <h3>Supplementary Readings — Text Book</h3>${state.references.textbooks}
    <h3>Supplementary Readings — Others</h3>${state.references.others}
    <h3>Others</h3>${state.references.othersDiscipline}

    <h2>Part F: Additional Information</h2>
    ${ADDITIONAL_FIELDS.map(f=>`<div class="kv"><span>${f.label}</span><b>${escapeHtml(state.additional[f.key]||'—')}</b></div>`).join('')}
  </div>
  <div class="doc-footer">
    <span>University of Information Technology &amp; Sciences (UITS), Department of CSE — ${escapeHtml(semesterLabel())}</span>
  </div>`;
}

/* ===================== DOCX GENERATOR ===================== */
function htmlBlocks(html){
  const d = document.createElement('div');
  d.innerHTML = html || '';
  const blocks = [];
  const walk = (node) => {
    node.childNodes.forEach(ch=>{
      if(ch.nodeType===3){ if(ch.textContent.trim()) blocks.push({text:ch.textContent, bullet:false, ordered:false}); return; }
      if(ch.nodeType!==1) return;
      const tag = ch.tagName.toLowerCase();
      if(tag==='li'){ blocks.push({text:ch.textContent.trim(), bullet: ch.parentElement && ch.parentElement.tagName.toLowerCase()==='ul', ordered: ch.parentElement && ch.parentElement.tagName.toLowerCase()==='ol'}); }
      else if(tag==='ul' || tag==='ol'){ walk(ch); }
      else if(tag==='p' || tag==='div'){ if(ch.textContent.trim()) blocks.push({text:ch.textContent.trim(), bullet:false, ordered:false}); }
      else if(tag==='br'){ /* skip */ }
      else { if(ch.textContent.trim()) blocks.push({text:ch.textContent.trim(), bullet:false, ordered:false}); }
    });
  };
  walk(d);
  if(!blocks.length) blocks.push({text:'—', bullet:false, ordered:false});
  return blocks;
}

async function exportDocx(){
  if(typeof docx === 'undefined'){
    throw new Error("The docx library hasn't loaded — check your internet connection and reload the page, then try again.");
  }
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel,
          WidthType, AlignmentType, BorderStyle, ShadingType, Footer, PageNumber,
          TabStopType, TabStopPosition } = docx;

  const NAVY = '14315D';
  const FONT = 'Times New Roman';

  const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing:{after:60} });
  const sub = (text) => new Paragraph({ children:[ new TextRun({text, color:'555555', size:22, font:FONT}) ], alignment: AlignmentType.CENTER, spacing:{after:20} });
  const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing:{before:200, after:80} });
  const h3 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing:{before:120, after:60} });
  const body = (text) => new Paragraph({ children:[ new TextRun({text:text||'—', font:FONT, size:24}) ], spacing:{after:40, line:264} });
  const kv = (label, value) => new Paragraph({
    children:[ new TextRun({text: label+': ', bold:true, font:FONT, size:24}), new TextRun({text:value||'—', font:FONT, size:24}) ],
    spacing:{after:20, line:264},
  });
  const bullets = (blocks) => blocks.map((b,i)=> new Paragraph({
    children:[ new TextRun({text:b.text, font:FONT, size:24}) ],
    bullet: (b.bullet||b.ordered) ? {level:0} : undefined,
    spacing:{after:20, line:264},
  }));

  const cellText = (text, opts={}) => new TableCell({
    width:{size:opts.width||1000, type:WidthType.DXA},
    shading: opts.header ? {type:ShadingType.CLEAR, fill:NAVY} : undefined,
    children:[ new Paragraph({ spacing:{line:240}, children:[ new TextRun({text: String(text??'—'), bold:!!opts.header, color:opts.header?'FFFFFF':undefined, font:FONT, size:opts.header?19:20}) ] }) ],
  });

  function simpleTable(headers, rows, widths){
    const w = widths || headers.map(()=> Math.floor(9000/headers.length));
    return new Table({
      width:{size:9000, type:WidthType.DXA},
      columnWidths:w,
      rows:[
        new TableRow({ children: headers.map((h,i)=> cellText(h, {header:true, width:w[i]})), tableHeader:true }),
        ...rows.map(r => new TableRow({ children: r.map((c,i)=> cellText(c, {width:w[i]})) })),
      ],
    });
  }

  const m = state.meta;
  const isTheory = m.courseMode !== 'Lab/Sessional';
  const tools = derivedAssessmentTools();

  // ---- Part A ----
  const teacherParas = state.teachers.flatMap(t => [
    new Paragraph({ children:[ new TextRun({text:(t.name||'—')+' — '+(t.designation||'—'), bold:true}) ], spacing:{after:20} }),
    new Paragraph({ children:[ new TextRun({text:`Room ${t.room||'—'} · ${t.email||'—'} · ${t.cell||'—'} · ${t.specialization||'—'}`, size:19, color:'555555'}) ], spacing:{after:120} }),
  ]);

  // ---- Part B ----
  const coRows = state.cos.map(co => [
    co.label, co.text||'—', co.bt.join(', ')||'—', co.cpwp.join(', ')||'—', co.caea.join(', ')||'—', co.kpwk.join(', ')||'—', coAtLabel(co), coDmaLabel(co)
  ]);
  const poRows = state.cos.map(co => {
    const map = state.poMapping.find(p=>p.coId===co.id);
    const cells = PO_VALUES.map(poVal => map && map.po===poVal ? '✓' : '');
    return [co.label, ...cells];
  });

  // ---- Part C ----
  const planRows = state.plan.map(r => [r.week, plainText(r.topics)||'—', plainText(r.activity)||'—', planAssessLabel(r), planCoLabel(r)]);

  // ---- Part D ----
  let total = parseFloat(state.assessment.attendanceMarks)||0;
  const assessRows = [['Attendance','', state.assessment.attendanceMarks||'—']];
  tools.forEach(t=>{
    const v = state.assessment.rowMarks[t.code]||'';
    total += parseFloat(v)||0;
    assessRows.push(['Continuous Internal Assessment (CIA)', t.label, v||'—']);
  });
  if(isTheory){ total += parseFloat(state.assessment.feMarks)||0; assessRows.push(['Final Exam (FE)','', state.assessment.feMarks||'—']); }
  assessRows.push(['Total','', Math.round(total)+'%']);

  const bloomHeaders = ["Bloom's Category", ...state.bloomCols.map(c=>c.name)];
  const bloomRows = BLOOM_ROWS.map(rk => [rk, ...state.bloomCols.map(c=>c.values[rk]||'')]);

  const gradingRows = GRADING_TABLE.map(r=>[r[0],r[1],r[2]]);

  const doc = new Document({
    styles:{
      default:{
        document:{ run:{ font:FONT, size:24 }, paragraph:{ spacing:{line:264, after:40} } },
        heading1:{ run:{ font:FONT, size:32, bold:true, color:NAVY } },
        heading2:{ run:{ font:FONT, size:26, bold:true, color:NAVY } },
        heading3:{ run:{ font:FONT, size:24, bold:true, color:NAVY } },
      },
    },
    sections:[{
      properties:{
        page:{
          size:{ width:12240, height:15840 },
          margin:{ top:1080, bottom:1080, left:1080, right:1080 },
        },
      },
      footers:{
        default: new Footer({
          children:[
            new Paragraph({
              tabStops:[{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              border:{ top:{ style: BorderStyle.SINGLE, size:4, color:'AAAAAA', space:4 } },
              children:[
                new TextRun({ text:`University of Information Technology & Sciences (UITS), Department of CSE — ${semesterLabel()}`, size:18, color:'555555', font:FONT }),
                new TextRun({ text:'\t' }),
                new TextRun({ text:'Page ', size:18, color:'555555', font:FONT }),
                new TextRun({ children:[PageNumber.CURRENT], size:18, color:'555555', font:FONT }),
              ],
            }),
          ],
        }),
      },
      children:[
        h1(docTitle()),
        sub('University of Information Technology & Sciences (UITS) · Department of Computer Science & Engineering'),
        sub(docSubtitle()),

        h2('Part A: Course Information'),
        kv('Course Type', joinNonEmpty([m.courseCategory,m.courseMode],' · ')),
        kv('Prerequisite(s)', m.prerequisites.join(', ')||'None'),
        kv('Credit Value', m.creditValue),
        kv('Contact Hours', (m.contactHours||'—')+' hours/Week'),
        kv('Class Schedule', scheduleText(state.classSchedule)),
        kv('Counseling Schedule', scheduleText(state.counselingSchedule)),
        h3('Course Teacher(s)'), ...teacherParas,
        h3('Rationale of the Course'), body(state.rationale),
        h3('Course Objectives'),
        ...bullets(state.objectives.filter(o=>o.trim()).map(o=>({text:o,bullet:true}))),

        h2('Part B: Skill Mapping'),
        h3('Course Outcomes (COs)'),
        simpleTable(['No.','COs','BT','CP/WP','CA/EA','KP/WK','AT','DM&A'], coRows, [600,2400,900,700,700,700,1000,1000]),
        new Paragraph({ children:[ new TextRun({text:"COs– Course Outcome; BT– Bloom's Taxonomy; CP/WP– Complex Engineering Problems; CA/EA– Complex Engineering Activities; AT– Assessment Tools; KP/WK– Knowledge Profile; DM&A– Delivery Methods & Activities.", italics:true, size:18, color:'555555', font:FONT}) ], spacing:{before:60,after:160, line:240} }),
        h3('Mapping of COs with Program Outcomes (POs)'),
        simpleTable(['CO', ...PO_VALUES], poRows),

        h2('Part C: Teaching Learning Approach'),
        kv('Commencement of Semester', fmtDate(state.semesterStart)),
        kv('Last Class of Semester', fmtDate(state.semesterEnd)),
        simpleTable(['Week','Topics','Suggested Activity & Teaching Strategy','Assessment Strategy','Corresponding COs'], planRows, [600,2200,2600,1800,1400]),

        h2('Part D: Assessment Approach'),
        simpleTable(['Assessment Components','','Marks Distribution'], assessRows, [3500,3500,2000]),
        h3('Assessment Pattern — Continuous Internal Evaluation (100 Marks)'),
        simpleTable(bloomHeaders, bloomRows),
        new Paragraph({ children:[ new TextRun({text:'*The percentage distribution of Bloom\u2019s categories in the assessment tools may vary by ±5%.', italics:true, size:18, color:'555555', font:FONT}) ], spacing:{before:60,after:160, line:240} }),
        h3('Grading System'),
        simpleTable(['Numerical Grade','Letter Grade','Grade Point'], gradingRows),

        h2('Part E: References'),
        h3('Recommended Readings'), ...bullets(htmlBlocks(state.references.recommended)),
        h3('Supplementary Readings — Text Book'), ...bullets(htmlBlocks(state.references.textbooks)),
        h3('Supplementary Readings — Others'), ...bullets(htmlBlocks(state.references.others)),
        h3('Others'), ...bullets(htmlBlocks(state.references.othersDiscipline)),

        h2('Part F: Additional Information'),
        ...ADDITIONAL_FIELDS.map(f => kv(f.label, state.additional[f.key])),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = (state.meta.courseCode || 'course-outline').replace(/[^a-z0-9]+/gi,'-').toLowerCase();
  a.href = url; a.download = name+'.docx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}
