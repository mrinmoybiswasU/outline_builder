/* =====================================================================
   STATE, CONSTANTS & UTILITIES
   ===================================================================== */

const APP_VERSION = '1.6';
const APP_DEVELOPER = 'Mrinmoy Biswas Akash';

const TABS = [
  {id:'info',        part:'Part A', label:'Course Information'},
  {id:'skill',       part:'Part B', label:'Skill Mapping'},
  {id:'teaching',    part:'Part C', label:'Teaching Learning Approach'},
  {id:'assessment',  part:'Part D', label:'Assessment Approach'},
  {id:'references',  part:'Part E', label:'References'},
  {id:'additional',  part:'Part F', label:'Additional Information'},
];

const DAYS = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];

/* Assessment Tools now depend on the course's Theory/Lab mode (Part A → Course Type). */
const AT_THEORY = [
  {code:'CT1', label:'Class Test 01'},
  {code:'CT2', label:'Class Test 02'},
  {code:'CT3', label:'Class Test 03'},
  {code:'CT4', label:'Class Test 04'},
  {code:'MT',  label:'Mid Term'},
  {code:'F',   label:'Final'},
  {code:'A',   label:'Assignment'},
];
const AT_LAB = [
  {code:'Q',   label:'Quiz'},
  {code:'R',   label:'Report'},
  {code:'P',   label:'Presentation'},
  {code:'V',   label:'Viva'},
  {code:'LP',  label:'Lab Performance'},
  {code:'PRJ', label:'Project'},
];
const AT_ALL = [...AT_THEORY, ...AT_LAB]; // used for label look-ups regardless of current mode
function currentATOptions(){
  return state.meta.courseMode === 'Lab/Sessional' ? AT_LAB : AT_THEORY;
}

/* Central option lists (single source of truth for UI + JSON import) */
const COURSE_CATEGORIES = [
  'Basic Science and Mathematics','GED','Core Courses','Elective I','Elective II',
  'Specialization - Intelligent Systems','Specialization - Software Engineering',
  'Specialization - Network & Security','Specialization - Systems and Hardware',
];
const COURSE_MODES = ['Theory','Lab/Sessional'];
const PROGRAMS = ['BSc. in CSE','MSc. in CSE'];
const LEVELS = ['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(n=>n+' Semester');
const SESSION_TERMS = ['Autumn','Spring','Fall','Summer'];

const DMA_DEFAULTS = [
  'Lecture','Demonstration','Group Work','Problem Solving Session',
  'Lab Practice','Case Study','Flipped Classroom','Peer Instruction',
];

const BLOOM_LEVELS = ['L1 (Remember)','L2 (Understand)','L3 (Apply)','L4 (Analyze)','L5 (Evaluate)','L6 (Create)'];
const BLOOM_ROWS   = ['Remember','Understand','Apply','Analyze','Evaluate','Create'];

/* BT is now grouped by learning domain — Cognitive (Bloom's), Affective (Krathwohl's),
   Psychomotor (Dave's) — each with its own short codes, e.g. "Cog1: Remember". */
const BT_GROUPS = [
  { group:'Cognitive Domain', items:[
    {code:'Cog1', label:'Remember'},
    {code:'Cog2', label:'Understand'},
    {code:'Cog3', label:'Apply'},
    {code:'Cog4', label:'Analyze'},
    {code:'Cog5', label:'Evaluate'},
    {code:'Cog6', label:'Create'},
  ]},
  { group:'Affective Domain', items:[
    {code:'Aff1', label:'Receiving'},
    {code:'Aff2', label:'Responding'},
    {code:'Aff3', label:'Valuing'},
    {code:'Aff4', label:'Organizing'},
    {code:'Aff5', label:'Characterizing'},
  ]},
  { group:'Psychomotor Domain', items:[
    {code:'Psy1', label:'Imitation'},
    {code:'Psy2', label:'Manipulation'},
    {code:'Psy3', label:'Precision'},
    {code:'Psy4', label:'Articulation'},
    {code:'Psy5', label:'Naturalization'},
  ]},
];
const BT_ALL = BT_GROUPS.flatMap(g=>g.items); // flat list, used for label look-ups in exports
const CPWP_DEFAULTS = [
  {code:'P1', label:'Depth of knowledge required'},
  {code:'P2', label:'Range of conflicting requirements'},
  {code:'P3', label:'Depth of analysis required'},
  {code:'P4', label:'Familiarity of issues'},
  {code:'P5', label:'Extent of applicable codes'},
  {code:'P6', label:'Extent of stakeholder involvement and conflicting requirements'},
  {code:'P7', label:'Interdependence'},
];
const CAEA_DEFAULTS = [
  {code:'A1', label:'Range of resources'},
  {code:'A2', label:'Level of interaction'},
  {code:'A3', label:'Innovation'},
  {code:'A4', label:'Consequences for society and the environment'},
  {code:'A5', label:'Familiarity'},
];
const KPWK_DEFAULTS = [
  {code:'K1', label:'Natural sciences knowledge'},
  {code:'K2', label:'Mathematics'},
  {code:'K3', label:'Engineering fundamentals'},
  {code:'K4', label:'Specialist engineering knowledge'},
  {code:'K5', label:'Engineering design'},
  {code:'K6', label:'Engineering practice'},
  {code:'K7', label:'Comprehension of societal/environmental impact'},
  {code:'K8', label:'Consequential responsibilities of engineering practice'},
];

const PO_KEYS = ['a','b','c','d','e','f','g','h','i','j','k','l'];
const PO_VALUES = PO_KEYS.map(k=>'PO('+k+')');
/* Standard Washington Accord / IEA graduate attribute names for PO(a)–PO(l) */
const PO_NAMES = {
  a:'Engineering Knowledge', b:'Problem Analysis', c:'Design/Development of Solutions',
  d:'Investigation', e:'Modern Tool Usage', f:'The Engineer and Society',
  g:'Environment and Sustainability', h:'Ethics', i:'Individual and Team Work',
  j:'Communication', k:'Project Management and Finance', l:'Life-long Learning',
};
/* "No CP/WP" is a mutually-exclusive pseudo-option in the CP/WP picker — see
   the CEP-gating logic in app.js (toggleCoCPWP). Selected by default. */
const NO_CEP_OPTION = {code:'NoCEP', label:'No CP/WP'};
/* Same idea as CP/WP: "No CA/EA" is mutually exclusive with A1–A5, selected
   by default. See the CA/EA-gating logic in app.js (toggleCoCAEA). */
const NO_CAEA_OPTION = {code:'NoCAEA', label:'No CA/EA'};

function poKeyFromValue(poValue){
  const m = /^PO\(([a-l])\)$/.exec(poValue||'');
  return m ? m[1] : null;
}
/* Which Knowledge Profile items (K1–K8) a given PO permits, per BAETE's
   Programme Outcome definitions (the "(K1 to K4)" etc. notes after each PO).
   Edit this table directly if your department's approved matrix differs. */
const PO_KPWK_MAP = {
  a:['K1','K2','K3','K4'],
  b:['K1','K2','K3','K4'],
  c:['K5'],
  d:['K8'],
  e:['K6'],
  f:['K7'],
  g:['K7'],
  h:['K7'],
  i:[], j:[], k:[], l:[],
};
function allowedKPWKFor(poValue){
  const key = poKeyFromValue(poValue);
  return key ? (PO_KPWK_MAP[key]||[]) : KPWK_DEFAULTS.map(o=>o.code);
}

/* ---------- BAETE reference text, shown via the (?) help buttons ---------- */
const HELP_CONTENT = {
  po: {
    title: "BAETE Programme Outcomes (PO1–PO12)",
    items: [
      {code:'PO1', text:'Apply knowledge of mathematics, natural science, engineering fundamentals and an engineering specialization as specified in K1 to K4 respectively to the solution of complex engineering problems.'},
      {code:'PO2', text:'Identify, formulate, research literature and analyse complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences and engineering sciences. (K1 to K4)'},
      {code:'PO3', text:'Design solutions for complex engineering problems and design systems, components or processes that meet specified needs with appropriate consideration for public health and safety, cultural, societal, and environmental considerations. (K5)'},
      {code:'PO4', text:'Conduct investigations of complex problems using research-based knowledge (K8) and research methods including design of experiments, analysis and interpretation of data, and synthesis of information to provide valid conclusions.'},
      {code:'PO5', text:'Create, select and apply appropriate techniques, resources, and modern engineering and IT tools, including prediction and modelling, to complex engineering problems, with an understanding of the limitations. (K6)'},
      {code:'PO6', text:'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to professional engineering practice and solutions to complex engineering problems. (K7)'},
      {code:'PO7', text:'Understand and evaluate the sustainability and impact of professional engineering work in the solution of complex engineering problems in societal and environmental contexts. (K7)'},
      {code:'PO8', text:'Apply ethical principles and commit to professional ethics and responsibilities and norms of engineering practice. (K7)'},
      {code:'PO9', text:'Function effectively as an individual, and as a member or leader in diverse teams and in multi-disciplinary settings.'},
      {code:'PO10', text:'Communicate effectively on complex engineering activities with the engineering community and with society at large, such as being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.'},
      {code:'PO11', text:"Demonstrate knowledge and understanding of engineering management principles and economic decision-making and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments."},
      {code:'PO12', text:'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.'},
    ],
  },
  kp: {
    title: 'Table 4.1: Knowledge Profile (K1–K8)',
    items: [
      {code:'K1', text:'A systematic, theory-based understanding of the natural sciences applicable to the discipline.'},
      {code:'K2', text:'Conceptually based mathematics, numerical analysis, statistics and the formal aspects of computer and information science to support analysis and modeling applicable to the discipline.'},
      {code:'K3', text:'A systematic, theory-based formulation of engineering fundamentals required in the engineering discipline.'},
      {code:'K4', text:'Engineering specialist knowledge that provides theoretical frameworks and bodies of knowledge for the accepted practice areas in the engineering discipline; much is at the forefront of the discipline.'},
      {code:'K5', text:'Knowledge that supports engineering design in a practice area.'},
      {code:'K6', text:'Knowledge of engineering practice (technology) in the practice areas in the engineering discipline.'},
      {code:'K7', text:"Comprehension of the role of engineering in society and identified issues in engineering practice in the discipline: ethics and the engineer's professional responsibility to public safety; the impacts of engineering activity; economic, social, cultural, environmental and sustainability."},
      {code:'K8', text:'Engagement with selected knowledge in the research literature of the discipline.'},
    ],
  },
  cp: {
    title: 'Table 4.2: Range of Complex Engineering Problem Solving (P1–P7)',
    items: [
      {code:'P1', text:'Depth of knowledge required — cannot be resolved without in-depth engineering knowledge at the level of one or more of K3, K4, K5, K6 or K8 which allows a fundamentals-based, first principles analytical approach.'},
      {code:'P2', text:'Range of conflicting requirements — involve wide-ranging or conflicting technical, engineering and other issues.'},
      {code:'P3', text:'Depth of analysis required — have no obvious solution and require abstract thinking, originality in analysis to formulate suitable models.'},
      {code:'P4', text:'Familiarity of issues — involve infrequently encountered issues.'},
      {code:'P5', text:'Extent of applicable codes — are outside problems encompassed by standards and codes of practice for professional engineering.'},
      {code:'P6', text:'Extent of stakeholder involvement and conflicting requirements — involve diverse groups of stakeholders with widely varying needs.'},
      {code:'P7', text:'Interdependence — are high-level problems including many component parts or sub-problems.'},
    ],
  },
  ca: {
    title: 'Table 4.3: Range of Complex Engineering Activities (A1–A5)',
    items: [
      {code:'A1', text:'Range of resources — involve the use of diverse resources (people, money, equipment, materials, information and technologies).'},
      {code:'A2', text:'Level of interaction — require resolution of significant problems arising from interactions between wide-ranging or conflicting technical, engineering or other issues.'},
      {code:'A3', text:'Innovation — involve creative use of engineering principles and research-based knowledge in novel ways.'},
      {code:'A4', text:'Consequences for society and the environment — have significant consequences in a range of contexts, characterized by difficulty of prediction and mitigation.'},
      {code:'A5', text:'Familiarity — can extend beyond previous experiences by applying principles-based approaches.'},
    ],
  },
};

const uid = () => Math.random().toString(36).slice(2,9);

function clamp(n,min,max){ return Math.min(max, Math.max(min, isFinite(n)?n:min)); }

function download(filename, content, mime){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}

function escapeHtml(str){
  return (str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function plainText(html){
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent.trim();
}

/* ---------- default factories ---------- */
function newScheduleRow(){ return {id:uid(), day:'', start:'', end:''}; }
function newTeacher(){ return {id:uid(), name:'', designation:'', room:'', email:'', cell:'', specialization:''}; }
function newCO(index){
  return {
    id:uid(), label:'CO'+index, text:'',
    bt:[], cpwp:['NoCEP'], caea:['NoCAEA'], kpwk:[],
    at:[], atCustom:[], dma:[], dmaCustom:[],
  };
}
function newPlanRow(week){
  return {id:uid(), week:String(week), topics:'', activity:'', assessment:[], assessmentCustom:[], cos:[]};
}
function newPatternValues(){
  return {Remember:'',Understand:'',Apply:'',Analyze:'',Evaluate:'',Create:''};
}

function defaultState(){
  const cos = [1,2,3].map(newCO);
  const plan = Array.from({length:14}, (_,i)=>newPlanRow(i+1));
  return {
    meta:{
      program:'', courseCode:'', courseTitle:'',
      courseCategory:'', courseMode:'',
      level:'', sessionTerm:'', sessionYear:'',
      section:'', prerequisites:[],
      creditValue:'', contactHours:'',
    },
    classSchedule:[1,2,3,4,5].map(newScheduleRow),
    counselingSchedule:[1,2,3,4,5].map(newScheduleRow),
    teachers:[newTeacher()],
    rationale:'',
    courseContents:'',
    objectives:['','','','',''],

    cos: cos,

    poMapping: cos.map(c => ({coId:c.id, po:'PO(a)'})),

    semesterStart:'2025-07-13',
    semesterEnd:'2025-11-20',
    plan: plan,

    assessment:{
      // marks distribution keyed by AT code / 'attendance' / custom labels
      attendanceMarks:'',
      rowMarks:{},      // { 'CT1': '10%', ... } keyed by AT code present in COs
      schedule:{},      // { 'CT1': 'Week 4', ... } keyed by AT code present in COs
    },

    // Section 20 values keyed by assessment component code → {Remember:'',...}.
    // The columns themselves are derived (see patternColumns()), never stored.
    patternValues:{},

    references:{
      recommended:'',
      textbooks:'',
      others:'',
      othersDiscipline:'',
    },

    additional:{
      programOutcome:'https://uits.edu.bd/department-of-computer-science-engineering/',
      obeCurriculum:'https://uits.edu.bd/curriculum-of-cse/',
      courseCatalog:'https://uits.edu.bd/course-catalog-of-computer-science-engineering/',
      facultyInfo:'https://uits.edu.bd/faculty-members-of-cse/',
      assessmentRubrics:'',
      bloomDetails:'',
      makeupExam:'',
      attendancePolicy:'',
      academicCalendar:'https://uits.edu.bd/academic-calendar/',
      academicPolicies:'',
      proctorialRules:'https://uits.edu.bd/wp-content/uploads/2024/01/Code-of-Conduct.pdf',
    },
  };
}

const GRADING_TABLE = [
  ['80% and above',            'A + (A plus)',   '4.00'],
  ['75% to less than 80%',     'A (A regular)',  '3.75'],
  ['70% to less than 75%',     'A − (A minus)',  '3.50'],
  ['65% to less than 70%',     'B + (B plus)',   '3.25'],
  ['60% to less than 65%',     'B (B regular)',  '3.00'],
  ['55% to less than 60%',     'B − (B minus)',  '2.75'],
  ['50% to less than 55%',     'C + (C plus)',   '2.50'],
  ['45% to less than 50%',     'C (C regular)',  '2.25'],
  ['40% to less than 45%',     'D',              '2.00'],
  ['Less than 40%',            'F',              '0.00'],
];

let state = defaultState();

function setState(partial){
  state = Object.assign(state, partial);
}

/* ---------- generic path get/set: "meta.courseCode", "teachers.3.name" ---------- */
function getPath(obj, path){
  return path.split('.').reduce((o,k)=> (o==null? undefined : o[k]), obj);
}
function setPath(obj, path, value){
  const parts = path.split('.');
  let cur = obj;
  for(let i=0;i<parts.length-1;i++){
    cur = cur[parts[i]];
  }
  cur[parts[parts.length-1]] = value;
}
function findById(arr, id){ return arr.find(x=>x.id===id); }
function indexById(arr, id){ return arr.findIndex(x=>x.id===id); }


/* ---------- derived assessment data ---------- */
/* All assessment components currently in use, in the app's definition order
   (AT_ALL order, custom tools after, Final last). Sources: Part B → AT per CO. */
function derivedAssessmentTools(){
  const map = new Map();
  state.cos.forEach(co=>{
    co.at.forEach(code=>{
      const def = AT_ALL.find(a=>a.code===code);
      map.set(code, def? def.label : code);
    });
    co.atCustom.forEach(c=>{ map.set(c, c); });
  });
  const rank = (code)=>{ const i = AT_ALL.findIndex(a=>a.code===code); return i<0 ? AT_ALL.length : i; };
  const tools = [...map.entries()].map(([code,label])=>({code,label}))
    .sort((a,b)=> rank(a.code)-rank(b.code));
  const feIdx = tools.findIndex(t=>t.code==='F');
  if(feIdx>-1) tools.push(tools.splice(feIdx,1)[0]);
  return tools;
}

/* Section 20 columns: union of (A) components used in Section 19 (marks entered)
   and (B) AT selected in Part B Section 16, de-duplicated, Attendance excluded. */
function patternColumns(){
  const tools = derivedAssessmentTools();
  const known = new Map(tools.map(t=>[t.code,t]));
  const used = new Set();
  tools.forEach(t=>{ if(String(state.assessment.rowMarks[t.code]||'').trim()) used.add(t.code); }); // Source A
  tools.forEach(t=>used.add(t.code));                                                                // Source B
  return tools.filter(t=> used.has(t.code) && known.has(t.code) && !/^attendance$/i.test(t.code) && !/^attendance$/i.test(t.label));
}

/* Section 19 total — always derived from current state */
function computeAssessmentTotal(){
  const n = (v)=>{ const x = parseFloat(v); return isFinite(x)? x : 0; };
  let total = n(state.assessment.attendanceMarks);
  derivedAssessmentTools().forEach(t=>{ total += n(state.assessment.rowMarks[t.code]); });
  return total;
}

/* ---------- JSON import: current schema is authoritative ---------- */
function normalizeLoadedState(loaded){
  if(!loaded || typeof loaded!=='object' || Array.isArray(loaded)) throw new Error('Not an outline object.');
  const base = defaultState();
  const isObj = (v)=> v && typeof v==='object' && !Array.isArray(v);
  const str = (v, d='')=> typeof v==='string' ? v : (typeof v==='number' ? String(v) : d);
  const strArr = (v)=> Array.isArray(v) ? v.filter(x=>typeof x==='string') : [];
  const inSet = (v, set)=> set.includes(v) ? v : '';
  /* generic: keep only keys present in the template, coerce to template types */
  const pick = (tpl, src)=>{
    if(Array.isArray(tpl)) return Array.isArray(src) ? src : tpl;
    if(isObj(tpl)){
      const out = {};
      Object.keys(tpl).forEach(k=>{ out[k] = pick(tpl[k], isObj(src)? src[k] : undefined); });
      return out;
    }
    if(typeof tpl==='string') return str(src, tpl);
    return typeof src===typeof tpl ? src : tpl;
  };
  const L = isObj(loaded) ? loaded : {};
  const out = pick(
    {rationale:'', courseContents:'', semesterStart:base.semesterStart, semesterEnd:base.semesterEnd,
     references:base.references, additional:base.additional}, L);

  // meta
  const m = pick(base.meta, L.meta);
  m.prerequisites = strArr(isObj(L.meta)? L.meta.prerequisites : []);
  m.courseCategory = inSet(m.courseCategory, COURSE_CATEGORIES);
  m.courseMode = inSet(m.courseMode, COURSE_MODES);
  m.program = inSet(m.program, PROGRAMS);
  m.level = inSet(m.level, LEVELS);
  m.sessionTerm = inSet(m.sessionTerm, SESSION_TERMS);
  out.meta = m;

  const schedule = (arr, dflt)=>{
    const rows = Array.isArray(arr) ? arr.filter(isObj).map(r=>{
      const x = pick(newScheduleRow(), r); x.id = str(r.id) || uid(); x.day = inSet(x.day, DAYS); return x;
    }) : [];
    return rows.length ? rows : dflt;
  };
  out.classSchedule = schedule(L.classSchedule, base.classSchedule);
  out.counselingSchedule = schedule(L.counselingSchedule, base.counselingSchedule);

  const teachers = Array.isArray(L.teachers) ? L.teachers.filter(isObj).map(t=>{
    const x = pick(newTeacher(), t); x.id = str(t.id) || uid(); return x;
  }) : [];
  out.teachers = teachers.length ? teachers : base.teachers;

  const objs = strArr(L.objectives);
  out.objectives = objs.length ? objs : base.objectives;

  // course outcomes
  const cpCodes = [NO_CEP_OPTION.code, ...CPWP_DEFAULTS.map(o=>o.code)];
  const caCodes = [NO_CAEA_OPTION.code, ...CAEA_DEFAULTS.map(o=>o.code)];
  const btCodes = BT_ALL.map(o=>o.code), kpCodes = KPWK_DEFAULTS.map(o=>o.code);
  const atCodes = AT_ALL.map(o=>o.code);
  const cos = Array.isArray(L.cos) ? L.cos.filter(isObj).map((c,i)=>{
    const x = pick(newCO(i+1), c);
    x.id = str(c.id) || uid();
    x.bt = strArr(c.bt).filter(v=>btCodes.includes(v));
    x.cpwp = strArr(c.cpwp).filter(v=>cpCodes.includes(v));
    x.caea = strArr(c.caea).filter(v=>caCodes.includes(v));
    x.kpwk = strArr(c.kpwk).filter(v=>kpCodes.includes(v));
    x.atCustom = strArr(c.atCustom).filter(v=>!atCodes.includes(v));
    x.at = strArr(c.at).filter(v=>atCodes.includes(v) || x.atCustom.includes(v));
    x.dmaCustom = strArr(c.dmaCustom).filter(v=>!DMA_DEFAULTS.includes(v));
    x.dma = strArr(c.dma).filter(v=>DMA_DEFAULTS.includes(v) || x.dmaCustom.includes(v));
    return x;
  }) : [];
  out.cos = cos.length ? cos : base.cos;
  out.cos.forEach((c,i)=> c.label = 'CO'+(i+1));

  const pm = Array.isArray(L.poMapping) ? L.poMapping.filter(isObj) : [];
  out.poMapping = out.cos.map(c=>{
    const f = pm.find(x=>x.coId===c.id);
    return {coId:c.id, po: f && PO_VALUES.includes(f.po) ? f.po : 'PO(a)'};
  });

  const validTools = new Set([...atCodes, ...out.cos.flatMap(c=>c.atCustom)]);
  const usedTools = new Set(out.cos.flatMap(c=>c.at));
  const labels = out.cos.map(c=>c.label);
  const plan = Array.isArray(L.plan) ? L.plan.filter(isObj).map((r,i)=>{
    const x = pick(newPlanRow(i+1), r);
    x.id = str(r.id) || uid();
    x.assessmentCustom = strArr(r.assessmentCustom).filter(v=>out.cos.some(c=>c.atCustom.includes(v)));
    x.assessment = strArr(r.assessment).filter(v=>usedTools.has(v));
    x.cos = strArr(r.cos).filter(v=>labels.includes(v));
    return x;
  }) : [];
  out.plan = plan.length ? plan : base.plan;

  // assessment (marks / schedule only for currently valid components; Attendance stays separate)
  const A = isObj(L.assessment) ? L.assessment : {};
  const rowMarks = {}, schedule2 = {};
  if(isObj(A.rowMarks)) Object.keys(A.rowMarks).forEach(k=>{ if(validTools.has(k)) rowMarks[k] = str(A.rowMarks[k]); });
  if(isObj(A.schedule)) Object.keys(A.schedule).forEach(k=>{
    if(!validTools.has(k)) return;
    const v = Array.isArray(A.schedule[k]) ? A.schedule[k] : [A.schedule[k]];
    schedule2[k] = v.filter(x=>SCHEDULE_OPTIONS.includes(x));
  });
  out.assessment = {attendanceMarks:str(A.attendanceMarks), rowMarks, schedule:schedule2};

  // Section 20 values — only for valid components; columns are re-derived at render time
  const pv = {};
  if(isObj(L.patternValues)) Object.keys(L.patternValues).forEach(k=>{
    if(!validTools.has(k) || !isObj(L.patternValues[k])) return;
    const row = newPatternValues();
    BLOOM_ROWS.forEach(r=>{ row[r] = str(L.patternValues[k][r]); });
    pv[k] = row;
  });
  out.patternValues = pv;

  return Object.assign(base, out);
}
