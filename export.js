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

  const bloomHeaders = state.bloomCols.map(c=>`<th>${escapeHtml(c.name)}</th>`).join('');
  const bloomRows = BLOOM_ROWS.map(rk=>`<tr><td>${rk}</td>${state.bloomCols.map(c=>`<td style="text-align:center;">${escapeHtml(c.values[rk]||'')}</td>`).join('')}</tr>`).join('');

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

  const bloomHeaders = ["Bloom's Category", ...state.bloomCols.map(c=>c.name)];
  const bloomRows = BLOOM_ROWS.map(rk => [rk, ...state.bloomCols.map(c=>c.values[rk]||'')]);

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
  const FOOTER_RESERVE = 30;
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const CONTENT_W = PAGE_W - MARGIN*2;
  let y = MARGIN;

  function ensure(h){
    if(y + h > PAGE_H - MARGIN - FOOTER_RESERVE){
      doc.addPage();
      y = MARGIN;
    }
  }
  function pdfTitle(text){
    doc.setFont(FONT,'bold'); doc.setFontSize(16); doc.setTextColor(17,17,17);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    const lh = 16*1.5;
    ensure(lines.length*lh);
    lines.forEach((line,i)=> doc.text(line, PAGE_W/2, y+i*lh+12, {align:'center'}));
    y += lines.length*lh + 6;
  }
  function pdfSubtitle(text){
    doc.setFont(FONT,'normal'); doc.setFontSize(SIZE); doc.setTextColor(85,85,85);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    ensure(lines.length*LH);
    lines.forEach((line,i)=> doc.text(line, PAGE_W/2, y+i*LH+9, {align:'center'}));
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
    doc.line(MARGIN, y, MARGIN+CONTENT_W, y);
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
  function pdfParagraph(text){
    doc.setFont(FONT,'normal'); doc.setFontSize(SIZE); doc.setTextColor(17,17,17);
    const lines = doc.splitTextToSize(text||'—', CONTENT_W);
    const totalH = lines.length*LH;
    ensure(totalH+6);
    lines.forEach((line,i)=>{
      const isLast = i===lines.length-1;
      doc.text(line, MARGIN, y+i*LH+9, isLast ? {} : {maxWidth:CONTENT_W, align:'justify'});
    });
    y += totalH + 6;
  }
  function pdfBulletList(items){
    doc.setFont(FONT,'normal'); doc.setFontSize(SIZE); doc.setTextColor(17,17,17);
    (items.length?items:['—']).forEach(text=>{
      const lines = doc.splitTextToSize(text, CONTENT_W-14);
      const totalH = lines.length*LH;
      ensure(totalH);
      doc.text('•', MARGIN, y+9);
      lines.forEach((line,i)=> doc.text(line, MARGIN+14, y+i*LH+9));
      y += totalH;
    });
    y += 6;
  }
  function pdfKV(label, value){
    doc.setFont(FONT,'bold'); doc.setFontSize(SIZE); doc.setTextColor(17,17,17);
    const labelText = label+': ';
    const labelW = doc.getTextWidth(labelText);
    doc.setFont(FONT,'normal');
    const lines = doc.splitTextToSize(String(value??'—')||'—', CONTENT_W-labelW);
    const totalH = Math.max(lines.length,1)*LH;
    ensure(totalH);
    doc.setFont(FONT,'bold');
    doc.text(labelText, MARGIN, y+9);
    doc.setFont(FONT,'normal');
    lines.forEach((line,i)=> doc.text(line, MARGIN+labelW, y+i*LH+9));
    y += totalH;
  }
  function pdfTable(head, body, columnStyles){
    ensure(LH*2);
    doc.autoTable({
      head:[head], body, startY:y,
      margin:{left:MARGIN, right:MARGIN, bottom:MARGIN+FOOTER_RESERVE},
      styles:{font:FONT, fontSize:9, cellPadding:3, lineColor:[150,150,150], lineWidth:0.5, valign:'top', textColor:[17,17,17]},
      headStyles:{fillColor:[13,31,54], textColor:255, fontStyle:'bold', fontSize:9},
      alternateRowStyles:{fillColor:[251,252,254]},
      columnStyles: columnStyles||{},
      theme:'grid',
    });
    y = doc.lastAutoTable.finalY + 10;
  }
  function pdfBlocks(html){
    htmlBlocks(html).forEach(b => pdfParagraph((b.bullet||b.ordered?'• ':'')+b.text));
  }

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
    state.cos.map(co=>[co.label, co.text||'—', co.bt.join(', ')||'—', cpwpLabel(co), caeaLabel(co), co.kpwk.join(', ')||'—', coAtLabel(co), coDmaLabel(co)]),
    {0:{cellWidth:26}}
  );
  pdfParagraph("COs– Course Outcome; BT– Learning Domain Level (Cognitive/Affective/Psychomotor); CP/WP– Complex Engineering Problems; CA/EA– Complex Engineering Activities; AT– Assessment Tools; KP/WK– Knowledge Profile; DM&A– Delivery Methods & Activities.");
  const atOptions = currentATOptions();
  const customATs = [...new Set(state.cos.flatMap(co=>co.atCustom))];
  pdfParagraph(`AT (${m.courseMode||'Theory'}): ${atOptions.map(a=>`${a.code}– ${a.label}`).join('; ')}${customATs.length? '; '+customATs.join('; ') : ''}`);

  pdfH3('Mapping of COs with Program Outcomes (POs)');
  pdfTable(
    ['CO', ...PO_VALUES],
    state.cos.map(co=>{
      const map = state.poMapping.find(p=>p.coId===co.id);
      return [co.label, ...PO_VALUES.map(pv => map && map.po===pv ? '✓' : '')];
    })
  );

  pdfH2('Part C: Teaching Learning Approach');
  pdfKV('Commencement of Semester', fmtDate(state.semesterStart));
  pdfKV('Last Class of Semester', fmtDate(state.semesterEnd));
  pdfTable(
    ['Week','Topics','Suggested Activity & Teaching Strategy','Assessment Strategy','Corresponding COs'],
    state.plan.map(r=>[r.week, plainText(r.topics)||'—', plainText(r.activity)||'—', planAssessLabel(r), planCoLabel(r)])
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
  pdfTable(['Assessment Components','','Marks Distribution'], assessBody);

  pdfH3('Assessment Schedule');
  pdfTable(['Assessment Tool','Scheduled For'], tools.map(t=>[`${t.label} (${t.code})`, (state.assessment.schedule[t.code]||[]).join(', ')||'—']));

  pdfH3('Assessment Pattern — Continuous Internal Evaluation (100 Marks)');
  pdfTable(["Bloom's Category", ...state.bloomCols.map(c=>c.name)], BLOOM_ROWS.map(rk=>[rk, ...state.bloomCols.map(c=>c.values[rk]||'')]));
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

  /* ---------- footer on every page: left dept text, right page number ---------- */
  const pageCount = doc.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setDrawColor(170,170,170); doc.setLineWidth(0.5);
    doc.line(MARGIN, PAGE_H-MARGIN+8, PAGE_W-MARGIN, PAGE_H-MARGIN+8);
    doc.setFont(FONT,'normal'); doc.setFontSize(9); doc.setTextColor(85,85,85);
    doc.text('Department of CSE/UITS', MARGIN, PAGE_H-MARGIN+20);
    doc.text(String(i), PAGE_W-MARGIN, PAGE_H-MARGIN+20, {align:'right'});
  }

  const name = (state.meta.courseCode || 'course-outline').replace(/[^a-z0-9]+/gi,'-').toLowerCase();
  doc.save(name+'.pdf');
}
