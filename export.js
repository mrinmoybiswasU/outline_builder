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
function cpwpLabel(co){
  if(co.cpwp.includes('NoCEP')) return 'No CP/WP';
  return co.cpwp.join(', ') || '—';
}
function caeaLabel(co){
  if(co.caea.includes('NoCAEA')) return 'No CA/EA';
  return co.caea.join(', ') || '—';
}
function planAssessLabel(row){ return joinNonEmpty(row.assessment, ', ') || '—'; }
function planCoLabel(row){ return joinNonEmpty(row.cos, ', ') || '—'; }

/* Strips ALL character-level formatting (bold/italic/underline/font/color) from a
   rich-text field's HTML, keeping only plain paragraphs/bullet lines — used for the
   PDF/print view so every bit of text renders identically regardless of how the
   person formatted it while typing. (See htmlBlocks() further down for the block
   extraction logic shared with the DOCX exporter.) */
function blocksToPlainHTML(blocks){
  return blocks.map(b => `<p>${(b.bullet||b.ordered) ? '• ' : ''}${escapeHtml(b.text)}</p>`).join('');
}

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
  const tools = derivedAssessmentTools();
  const atOptions = currentATOptions();
  const customATs = [...new Set(state.cos.flatMap(co=>co.atCustom))];

  const teacherBlocks = state.teachers.map(t=>`
    <div class="kv"><b>${escapeHtml(t.name||'—')}</b> — ${escapeHtml(t.designation||'—')}</div>
    <div class="kv" style="grid-template-columns:1fr;font-size:11px;color:#555;">
      Room ${escapeHtml(t.room||'—')} · ${escapeHtml(t.email||'—')} · ${escapeHtml(t.cell||'—')} · ${escapeHtml(t.specialization||'—')}
    </div>`).join('<br>');

  const coRows = state.cos.map(co=>`
    <tr><td>${co.label}</td><td>${escapeHtml(co.text)}</td><td>${co.bt.join(', ')||'—'}</td>
      <td>${cpwpLabel(co)}</td><td>${caeaLabel(co)}</td><td>${co.kpwk.join(', ')||'—'}</td>
      <td>${coAtLabel(co)}</td><td>${coDmaLabel(co)}</td></tr>`).join('');

  const poRows = state.cos.map(co=>{
    const map = state.poMapping.find(p=>p.coId===co.id);
    const cells = PO_VALUES.map(poVal=>{
      return `<td style="text-align:center;">${map && map.po===poVal? '✓':''}</td>`;
    }).join('');
    return `<tr><td>${co.label}</td>${cells}</tr>`;
  }).join('');

  const planRows = state.plan.map(r=>`
    <tr><td>${escapeHtml(r.week)}</td><td>${blocksToPlainHTML(htmlBlocks(r.topics))}</td><td>${blocksToPlainHTML(htmlBlocks(r.activity))}</td>
      <td>${planAssessLabel(r)}</td><td>${planCoLabel(r)}</td></tr>`).join('');

  let total = parseFloat(state.assessment.attendanceMarks)||0;
  const toolRows = tools.map(t=>{
    const v = state.assessment.rowMarks[t.code]||'';
    total += parseFloat(v)||0;
    const isFE = t.code==='F';
    return `<tr><td>${isFE? 'Final Exam (FE)' : 'Continuous Internal Assessment (CIA)'}</td><td>${isFE? '' : `${escapeHtml(t.label)} (${escapeHtml(t.code)})`}</td><td>${escapeHtml(v||'—')}</td></tr>`;
  }).join('');

  const scheduleRows = tools.map(t=>`
    <tr><td>${escapeHtml(t.label)} (${escapeHtml(t.code)})</td><td>${escapeHtml((state.assessment.schedule[t.code]||[]).join(', ')||'—')}</td></tr>`).join('')
    || `<tr><td colspan="2">—</td></tr>`;

  const bloomHeaders = patternColumns().map(c=>`<th>${escapeHtml(c.label)} (${escapeHtml(c.code)})</th>`).join('');
  const bloomRows = BLOOM_ROWS.map(rk=>`<tr><td>${rk}</td>${patternColumns().map(c=>`<td style="text-align:center;">${escapeHtml(((state.patternValues[c.code]||{})[rk])||'')}</td>`).join('')}</tr>`).join('');

  const atLegend = atOptions.map(a=>`${a.code}– ${a.label}`).join('; ') + (customATs.length? '; '+customATs.map(escapeHtml).join('; ') : '');

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
    <div class="doc-footnote">COs– Course Outcome; BT– Learning Domain Level (Cognitive/Affective/Psychomotor); CP/WP– Complex Engineering Problems; CA/EA– Complex Engineering Activities; AT– Assessment Tools; KP/WK– Knowledge Profile; DM&amp;A– Delivery Methods &amp; Activities.</div>
    <div class="doc-footnote">AT (${escapeHtml(m.courseMode||'Theory')}): ${atLegend}</div>
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
      <tr><td colspan="2"><b>Total</b></td><td><b>${Math.round(total)}%</b></td></tr>
    </tbody></table>

    <h3>Assessment Schedule</h3>
    <table><thead><tr><th>Assessment Tool</th><th>Scheduled For</th></tr></thead><tbody>${scheduleRows}</tbody></table>

    <h3>Assessment Pattern — Continuous Internal Evaluation (100 Marks)</h3>
    <table><thead><tr><th>Bloom's Category</th>${bloomHeaders}</tr></thead><tbody>${bloomRows}</tbody></table>
    <div class="doc-footnote">*The percentage distribution of Bloom's categories in the assessment tools may vary by ±5%.</div>

    <h3>Grading System</h3>
    <table><thead><tr><th>Numerical Grade</th><th>Letter Grade</th><th>Grade Point</th></tr></thead>
    <tbody>${GRADING_TABLE.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>

    <h2>Part E: References</h2>
    <h3>Recommended Readings</h3>${blocksToPlainHTML(htmlBlocks(state.references.recommended))}
    <h3>Supplementary Readings — Text Book</h3>${blocksToPlainHTML(htmlBlocks(state.references.textbooks))}
    <h3>Supplementary Readings — Others</h3>${blocksToPlainHTML(htmlBlocks(state.references.others))}
    <h3>Others</h3>${blocksToPlainHTML(htmlBlocks(state.references.othersDiscipline))}

    <h2>Part F: Additional Information</h2>
    ${ADDITIONAL_FIELDS.map(f=>`<div class="kv"><span>${f.label}</span><b>${escapeHtml(state.additional[f.key]||'—')}</b></div>`).join('')}
  </div>`;
}

/* ===================== DOCX GENERATOR ===================== */
function htmlBlocks(html){
  const d = document.createElement('div');
  d.innerHTML = html || '';
  const blocks = [];
  let buffer = '';
  const flush = () => {
    const t = buffer.replace(/\s+/g,' ').trim();
    if(t) blocks.push({text:t, bullet:false, ordered:false});
    buffer = '';
  };
  const walk = (node) => {
    node.childNodes.forEach(ch=>{
      if(ch.nodeType===3){
        const t = ch.textContent;
        if(t.trim()) buffer += (buffer?' ':'')+t;
        return;
      }
      if(ch.nodeType!==1) return;
      const tag = ch.tagName.toLowerCase();
      if(tag==='li'){
        flush();
        blocks.push({text:ch.textContent.trim(), bullet: ch.parentElement && ch.parentElement.tagName.toLowerCase()==='ul', ordered: ch.parentElement && ch.parentElement.tagName.toLowerCase()==='ol'});
      }
      else if(tag==='ul' || tag==='ol'){ flush(); walk(ch); }
      else if(tag==='br'){ buffer += ' '; /* soft break — stays part of the same paragraph */ }
      else if(tag==='p' || tag==='div'){
        const txt = ch.textContent.trim();
        if(!txt) flush(); // an empty line is treated as an intentional paragraph break
        else buffer += (buffer?' ':'')+txt;
      }
      else {
        const txt = ch.textContent.trim();
        if(txt) buffer += (buffer?' ':'')+txt;
      }
    });
  };
  walk(d);
  flush();
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
  const tools = derivedAssessmentTools();
  const atOptions = currentATOptions();
  const customATs = [...new Set(state.cos.flatMap(co=>co.atCustom))];

  // ---- Part A ----
  const teacherParas = state.teachers.flatMap(t => [
    new Paragraph({ children:[ new TextRun({text:(t.name||'—')+' — '+(t.designation||'—'), bold:true}) ], spacing:{after:20} }),
    new Paragraph({ children:[ new TextRun({text:`Room ${t.room||'—'} · ${t.email||'—'} · ${t.cell||'—'} · ${t.specialization||'—'}`, size:19, color:'555555'}) ], spacing:{after:120} }),
  ]);

  // ---- Part B ----
  const coRows = state.cos.map(co => [
    co.label, co.text||'—', co.bt.join(', ')||'—', cpwpLabel(co), caeaLabel(co), co.kpwk.join(', ')||'—', coAtLabel(co), coDmaLabel(co)
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
    const isFE = t.code==='F';
    assessRows.push([isFE? 'Final Exam (FE)' : 'Continuous Internal Assessment (CIA)', isFE? '' : t.label+' ('+t.code+')', v||'—']);
  });
  assessRows.push(['Total','', Math.round(total)+'%']);
  const scheduleRows = tools.map(t=>[t.label+' ('+t.code+')', (state.assessment.schedule[t.code]||[]).join(', ')||'—']);

  const bloomHeaders = ["Bloom's Category", ...patternColumns().map(c=>c.label+' ('+c.code+')')];
  const bloomRows = BLOOM_ROWS.map(rk => [rk, ...patternColumns().map(c=>((state.patternValues[c.code]||{})[rk])||'')]);

  const gradingRows = GRADING_TABLE.map(r=>[r[0],r[1],r[2]]);
  const atLegendText = atOptions.map(a=>`${a.code}– ${a.label}`).join('; ') + (customATs.length? '; '+customATs.join('; ') : '');

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
        h3('Course Contents'),
        ...bullets(htmlBlocks(state.courseContents)),
        h3('Course Objectives'),
        ...bullets(state.objectives.filter(o=>o.trim()).map(o=>({text:o,bullet:true}))),

        h2('Part B: Skill Mapping'),
        h3('Course Outcomes (COs)'),
        simpleTable(['No.','COs','BT','CP/WP','CA/EA','KP/WK','AT','DM&A'], coRows, [600,2400,900,700,700,700,1000,1000]),
        new Paragraph({ children:[ new TextRun({text:"COs– Course Outcome; BT– Learning Domain Level (Cognitive/Affective/Psychomotor); CP/WP– Complex Engineering Problems; CA/EA– Complex Engineering Activities; AT– Assessment Tools; KP/WK– Knowledge Profile; DM&A– Delivery Methods & Activities.", italics:true, size:18, color:'555555', font:FONT}) ], spacing:{before:60,after:60, line:240} }),
        new Paragraph({ children:[ new TextRun({text:`AT (${m.courseMode||'Theory'}): ${atLegendText}`, italics:true, size:18, color:'555555', font:FONT}) ], spacing:{before:0,after:160, line:240} }),
        h3('Mapping of COs with Program Outcomes (POs)'),
        simpleTable(['CO', ...PO_VALUES], poRows),

        h2('Part C: Teaching Learning Approach'),
        kv('Commencement of Semester', fmtDate(state.semesterStart)),
        kv('Last Class of Semester', fmtDate(state.semesterEnd)),
        simpleTable(['Week','Topics','Suggested Activity & Teaching Strategy','Assessment Strategy','Corresponding COs'], planRows, [600,2200,2600,1800,1400]),

        h2('Part D: Assessment Approach'),
        simpleTable(['Assessment Components','','Marks Distribution'], assessRows, [3500,3500,2000]),
        h3('Assessment Schedule'),
        simpleTable(['Assessment Tool','Scheduled For'], scheduleRows, [4500,4500]),
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

/* ===================== TRUE PDF GENERATOR (jsPDF + autoTable) ===================== */
async function exportPdfFile(){
  if(typeof jspdf === 'undefined' || !jspdf.jsPDF){
    throw new Error("The PDF library hasn't loaded — check your internet connection and reload the page, then try again.");
  }
  const { jsPDF } = jspdf;
  const doc = new jsPDF({ unit:'pt', format:'a4' });
  try{ doc.setLineHeightFactor(1.5); }catch(e){ /* older builds may not expose this — spacing is still handled manually below */ }

  const FONT = 'times';
  const SIZE = 12;
  const LH = SIZE*1.5;
  const MARGIN = 72; // 1 inch — "normal" margin
  const FOOTER_RESERVE = 26;
  const pageW = () => doc.internal.pageSize.getWidth();
  const pageH = () => doc.internal.pageSize.getHeight();
  const contentW = () => pageW() - MARGIN*2;
  let y = MARGIN;

  function ensure(h){
    if(y + h > pageH() - MARGIN - FOOTER_RESERVE){
      doc.addPage();
      y = MARGIN;
    }
  }
  function pdfTitle(text){
    doc.setFont(FONT,'bold'); doc.setFontSize(16); doc.setTextColor(17,17,17);
    const lines = doc.splitTextToSize(text, contentW());
    const lh = 16*1.5;
    ensure(lines.length*lh);
    lines.forEach((line,i)=> doc.text(line, pageW()/2, y+i*lh+12, {align:'center'}));
    y += lines.length*lh + 6;
  }
  function pdfSubtitle(text){
    doc.setFont(FONT,'normal'); doc.setFontSize(SIZE); doc.setTextColor(85,85,85);
    const lines = doc.splitTextToSize(text, contentW());
    ensure(lines.length*LH);
    lines.forEach((line,i)=> doc.text(line, pageW()/2, y+i*LH+9, {align:'center'}));
    y += lines.length*LH;
    doc.setTextColor(17,17,17);
  }
  function pdfH2(text){
    y += 6;
    ensure(LH+10);
    doc.setFont(FONT,'bold'); doc.setFontSize(SIZE); doc.setTextColor(13,31,54);
    doc.text(text, MARGIN, y+9);
    y += LH;
    doc.setDrawColor(13,31,54); doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN+contentW(), y);
    y += 8;
    doc.setTextColor(17,17,17);
  }
  function pdfH3(text){
    ensure(LH+6);
    doc.setFont(FONT,'bold'); doc.setFontSize(SIZE); doc.setTextColor(23,56,97);
    doc.text(text, MARGIN, y+9);
    y += LH;
    doc.setTextColor(17,17,17);
  }
  // Renders `text` justified on every line except the last, letting jsPDF do
  // its own wrapping in a single call — this matters: calling doc.text() once
  // PER PRE-SPLIT LINE (the previous approach) makes jsPDF treat every line as
  // its own "last line" of a one-line call, so none of them ever justify.
  // Passing the whole paragraph + maxWidth in one call is what actually works,
  // and it also mirrors exactly what autoTable itself does for halign:'justify'.
  function justifiedBlock(text, x, w, size){
    doc.setFont(FONT,'normal'); doc.setFontSize(size);
    const raw = text || '—';
    const lines = doc.splitTextToSize(raw, w);
    const lh = size*1.5;
    doc.text(raw, x, y+size*0.78, {maxWidth:w, align:'justify'});
    return lines.length*lh;
  }
  // Paragraphs normally fit in a single ensure()+draw. On the rare chance one
  // is taller than a full page, it's chunked across pages instead of letting
  // it run off the bottom — matches the same "never overflow" rule as tables.
  function pdfParagraph(text){
    doc.setFont(FONT,'normal'); doc.setFontSize(SIZE); doc.setTextColor(17,17,17);
    const raw = text || '—';
    const allLines = doc.splitTextToSize(raw, contentW());
    const totalH = allLines.length*LH;
    const fullPageH = pageH() - MARGIN*2 - FOOTER_RESERVE;
    if(totalH <= fullPageH){
      ensure(totalH+6);
      justifiedBlock(raw, MARGIN, contentW(), SIZE);
      y += totalH + 6;
    } else {
      let idx = 0;
      while(idx < allLines.length){
        ensure(LH);
        const availH = pageH()-MARGIN-FOOTER_RESERVE-y;
        const linesThatFit = Math.max(1, Math.floor(availH/LH));
        const chunk = allLines.slice(idx, idx+linesThatFit);
        doc.text(chunk, MARGIN, y+SIZE*0.78, {maxWidth:contentW(), align:'justify'});
        y += chunk.length*LH;
        idx += chunk.length;
        if(idx < allLines.length){ doc.addPage(); y = MARGIN; }
      }
      y += 6;
    }
  }
  function pdfBulletList(items){
    doc.setFont(FONT,'normal'); doc.setFontSize(SIZE); doc.setTextColor(17,17,17);
    (items.length?items:['—']).forEach(text=>{
      const w = contentW()-16;
      const lines = doc.splitTextToSize(text, w);
      const totalH = lines.length*LH;
      ensure(totalH);
      doc.text('•', MARGIN, y+SIZE*0.78);
      justifiedBlock(text, MARGIN+16, w, SIZE);
      y += totalH;
    });
    y += 6;
  }
  // A very long label (e.g. "Details of Bloom Taxonomy, Knowledge Profile,
  // Complex Engineering Problems & Activities:") can't share a line with its
  // value without running out of room — it gets its own line(s) instead, with
  // the value directly beneath, rather than cramming a near-zero-width value
  // into whatever space happens to be left.
  function pdfKV(label, value){
    doc.setFont(FONT,'bold'); doc.setFontSize(SIZE); doc.setTextColor(17,17,17);
    const labelText = label+': ';
    const labelW = doc.getTextWidth(labelText);
    const inline = labelW <= contentW()*0.42;
    if(inline){
      doc.setFont(FONT,'normal');
      const lines = doc.splitTextToSize(String(value??'—')||'—', contentW()-labelW);
      const totalH = Math.max(lines.length,1)*LH;
      ensure(totalH);
      doc.setFont(FONT,'bold');
      doc.text(labelText, MARGIN, y+9);
      doc.setFont(FONT,'normal');
      lines.forEach((line,i)=> doc.text(line, MARGIN+labelW, y+i*LH+9));
      y += totalH;
    } else {
      const labelLines = doc.splitTextToSize(label+':', contentW());
      ensure(labelLines.length*LH);
      labelLines.forEach((line,i)=> doc.text(line, MARGIN, y+i*LH+9));
      y += labelLines.length*LH;
      doc.setFont(FONT,'normal');
      const valueLines = doc.splitTextToSize(String(value??'—')||'—', contentW());
      ensure(valueLines.length*LH);
      valueLines.forEach((line,i)=> doc.text(line, MARGIN, y+i*LH+9));
      y += valueLines.length*LH;
    }
  }
  // Groups consecutive bulleted/numbered blocks into one hanging-indent list
  // render (proper bibliography style — wrapped lines align under the text,
  // not back at the margin), while plain paragraphs render on their own.
  function pdfBlocks(html){
    const blocks = htmlBlocks(html);
    let i = 0;
    while(i < blocks.length){
      if(blocks[i].bullet || blocks[i].ordered){
        const group = [];
        while(i<blocks.length && (blocks[i].bullet||blocks[i].ordered)){ group.push(blocks[i].text); i++; }
        pdfBulletList(group);
      } else {
        pdfParagraph(blocks[i].text);
        i++;
      }
    }
  }

  const TABLE_SIZE = 10;
  // draws a small vector checkmark centered in a cell — the ✓ glyph isn't in
  // the standard PDF Times-Roman character set and renders as a blank box
  function drawCheck(cx, cy){
    doc.setDrawColor(31,138,95); doc.setLineWidth(1.4);
    doc.line(cx-3.6, cy, cx-1.1, cy+2.8);
    doc.line(cx-1.1, cy+2.8, cx+3.8, cy-3.6);
  }
  /* head/body: standard autoTable arrays. opts:
     - columnStyles: per-column autoTable style overrides (cellWidth, halign, …)
     - justifyCols: column indices whose text should be fully justified (for
       genuinely paragraph-length cell content, e.g. CO descriptions). This
       uses autoTable's own built-in halign:'justify' rather than a custom
       redraw, so the exact same text/width autoTable already used to compute
       the row's height is what gets justified — no risk of the two disagreeing
       and text overflowing past the cell/row like a hand-rolled redraw could.
     - checkCols: column indices where the literal string "✓" should be drawn
       as a vector checkmark instead of relying on the font's glyph */
  function pdfTable(head, body, opts){
    opts = opts || {};
    ensure(LH*2);
    const columnStyles = {};
    Object.entries(opts.columnStyles||{}).forEach(([k,v])=>{ columnStyles[k] = {...v}; });
    (opts.justifyCols||[]).forEach(ci=>{
      columnStyles[ci] = {...(columnStyles[ci]||{}), halign:'justify'};
    });
    doc.autoTable({
      head:[head], body, startY:y,
      margin:{left:MARGIN, right:MARGIN, bottom:MARGIN+FOOTER_RESERVE},
      styles:{font:FONT, fontSize:TABLE_SIZE, cellPadding:4, lineColor:[150,150,150], lineWidth:0.5, valign:'top', textColor:[17,17,17], overflow:'linebreak'},
      headStyles:{fillColor:[13,31,54], textColor:255, fontStyle:'bold', fontSize:TABLE_SIZE, halign:'left'},
      alternateRowStyles:{fillColor:[251,252,254]},
      columnStyles,
      theme:'grid',
      willDrawCell:(data)=>{
        if(data.section!=='body') return;
        if(opts.checkCols && opts.checkCols.includes(data.column.index) && data.cell.raw==='✓') data.cell.text = [];
      },
      didDrawCell:(data)=>{
        if(data.section!=='body') return;
        const cell = data.cell;
        if(opts.checkCols && opts.checkCols.includes(data.column.index) && cell.raw==='✓'){
          drawCheck(cell.x+cell.width/2, cell.y+cell.height/2);
        }
      },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  /* PDF-only display helpers: a "no CP/WP"/"no CA/EA" outcome shows as a
     plain dash in the printed table, rather than the descriptive label used
     in the app and the Word export. */
  function cpwpCell(co){ return co.cpwp.includes('NoCEP') ? '-' : (co.cpwp.join(', ')||'-'); }
  function caeaCell(co){ return co.caea.includes('NoCAEA') ? '-' : (co.caea.join(', ')||'-'); }

  /* ---------- content ---------- */
  const m = state.meta;
  pdfTitle(docTitle());
  pdfSubtitle('University of Information Technology & Sciences (UITS) · Department of Computer Science & Engineering');
  pdfSubtitle(docSubtitle());
  y += 4;

  pdfH2('Part A: Course Information');
  pdfKV('Course Type', joinNonEmpty([m.courseCategory,m.courseMode],' · '));
  pdfKV('Prerequisite(s)', m.prerequisites.join(', ')||'None');
  pdfKV('Credit Value', m.creditValue);
  pdfKV('Contact Hours', (m.contactHours||'—')+' hours/Week');
  pdfKV('Class Schedule', scheduleText(state.classSchedule));
  pdfKV('Counseling Schedule', scheduleText(state.counselingSchedule));
  pdfH3('Course Teacher(s)');
  state.teachers.forEach(t=>{
    pdfKV(t.name||'—', t.designation||'—');
    pdfParagraph(`Room ${t.room||'—'} · ${t.email||'—'} · ${t.cell||'—'} · ${t.specialization||'—'}`);
  });
  pdfH3('Rationale of the Course');
  pdfParagraph(state.rationale);
  pdfH3('Course Objectives');
  pdfBulletList(state.objectives.filter(o=>o.trim()));

  pdfH2('Part B: Skill Mapping');
  pdfH3('Course Outcomes (COs)');
  pdfTable(
    ['No.','COs','BT','CP/WP','CA/EA','KP/WK','AT','DM&A'],
    state.cos.map(co=>[co.label, co.text||'—', co.bt.join(', ')||'-', cpwpCell(co), caeaCell(co), co.kpwk.join(', ')||'-', coAtLabel(co), coDmaLabel(co)]),
    { justifyCols:[1,7], columnStyles:{
        0:{cellWidth:24}, 1:{cellWidth:132}, 2:{cellWidth:52}, 3:{cellWidth:44},
        4:{cellWidth:44}, 5:{cellWidth:42}, 6:{cellWidth:48}, 7:{cellWidth:'auto'},
    }}
  );
  pdfParagraph("COs– Course Outcome; BT– Learning Domain Level (Cognitive/Affective/Psychomotor); CP/WP– Complex Engineering Problems; CA/EA– Complex Engineering Activities; AT– Assessment Tools; KP/WK– Knowledge Profile; DM&A– Delivery Methods & Activities.");
  const atOptions = currentATOptions();
  const customATs = [...new Set(state.cos.flatMap(co=>co.atCustom))];
  pdfParagraph(`AT (${m.courseMode||'Theory'}): ${atOptions.map(a=>`${a.code}– ${a.label}`).join('; ')}${customATs.length? '; '+customATs.join('; ') : ''}`);

  pdfH3('Mapping of COs with Program Outcomes (POs)');
  const poColStyles = {0:{cellWidth:56}};
  PO_VALUES.forEach((_,i)=>{ poColStyles[i+1] = {cellWidth:'auto', halign:'center'}; });
  pdfTable(
    ['CO', ...PO_VALUES],
    state.cos.map(co=>{
      const map = state.poMapping.find(p=>p.coId===co.id);
      return [co.label, ...PO_VALUES.map(pv => map && map.po===pv ? '✓' : '')];
    }),
    { checkCols:[1,2,3,4,5,6,7,8,9,10,11,12], columnStyles: poColStyles }
  );

  pdfH2('Part C: Teaching Learning Approach');
  pdfKV('Commencement of Semester', fmtDate(state.semesterStart));
  pdfKV('Last Class of Semester', fmtDate(state.semesterEnd));
  pdfTable(
    ['Week','Topics','Suggested Activity & Teaching Strategy','Assessment Strategy','Corresponding COs'],
    state.plan.map(r=>[r.week, plainText(r.topics)||'—', plainText(r.activity)||'—', planAssessLabel(r), planCoLabel(r)]),
    { justifyCols:[1,2], columnStyles:{0:{cellWidth:32}, 1:{cellWidth:150}, 2:{cellWidth:150}, 3:{cellWidth:60}, 4:{cellWidth:'auto'}} }
  );

  pdfH2('Part D: Assessment Approach');
  const tools = derivedAssessmentTools();
  let totalMarks = parseFloat(state.assessment.attendanceMarks)||0;
  const assessBody = [['Attendance','', state.assessment.attendanceMarks||'—']];
  tools.forEach(t=>{
    const v = state.assessment.rowMarks[t.code]||'';
    totalMarks += parseFloat(v)||0;
    const isFE = t.code==='F';
    assessBody.push([isFE?'Final Exam (FE)':'Continuous Internal Assessment (CIA)', isFE?'':`${t.label} (${t.code})`, v||'—']);
  });
  assessBody.push(['Total','', Math.round(totalMarks)+'%']);
  pdfTable(['Assessment Components','','Marks Distribution'], assessBody, { columnStyles:{0:{cellWidth:180},1:{cellWidth:180},2:{cellWidth:'auto'}} });

  pdfH3('Assessment Schedule');
  pdfTable(['Assessment Tool','Scheduled For'], tools.map(t=>[`${t.label} (${t.code})`, (state.assessment.schedule[t.code]||[]).join(', ')||'—']));

  pdfH3('Assessment Pattern — Continuous Internal Evaluation (100 Marks)');
  pdfTable(["Bloom's Category", ...patternColumns().map(c=>c.label+' ('+c.code+')')], BLOOM_ROWS.map(rk=>[rk, ...patternColumns().map(c=>((state.patternValues[c.code]||{})[rk])||'')]));
  pdfParagraph("*The percentage distribution of Bloom's categories in the assessment tools may vary by ±5%.");

  pdfH3('Grading System');
  pdfTable(['Numerical Grade','Letter Grade','Grade Point'], GRADING_TABLE.map(r=>[r[0],r[1],r[2]]));

  pdfH2('Part E: References');
  pdfH3('Recommended Readings'); pdfBlocks(state.references.recommended);
  pdfH3('Supplementary Readings — Text Book'); pdfBlocks(state.references.textbooks);
  pdfH3('Supplementary Readings — Others'); pdfBlocks(state.references.others);
  pdfH3('Others'); pdfBlocks(state.references.othersDiscipline);

  pdfH2('Part F: Additional Information');
  ADDITIONAL_FIELDS.forEach(f => pdfKV(f.label, state.additional[f.key]));

  /* ---------- footer: page number only, right-aligned ---------- */
  const pageCount = doc.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setFont(FONT,'normal'); doc.setFontSize(9); doc.setTextColor(85,85,85);
    doc.text(String(i), pageW()-MARGIN, pageH()-MARGIN+20, {align:'right'});
  }

  const name = (state.meta.courseCode || 'course-outline').replace(/[^a-z0-9]+/gi,'-').toLowerCase();
  doc.save(name+'.pdf');
}
