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
    bt:[], cpwp:['NoCEP'], caea:[], kpwk:[],
    at:[], atCustom:[], dma:[], dmaCustom:[],
  };
}
function newPlanRow(week){
  return {id:uid(), week:String(week), topics:'', activity:'', assessment:[], assessmentCustom:[], cos:[]};
}
function newBloomCol(name){
  return {id:uid(), name: name||'', values:{Remember:'',Understand:'',Apply:'',Analyze:'',Evaluate:'',Create:''}};
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
    objectives:[''],

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

    bloomCols: [
      {id:uid(), name:'Attendance & Class Participation (10)', values:{Remember:'',Understand:'',Apply:'',Analyze:'',Evaluate:'',Create:''}},
      {id:uid(), name:'Class Performance (10)', values:{Remember:'',Understand:'5%',Apply:'5%',Analyze:'',Evaluate:'',Create:''}},
      {id:uid(), name:'Lab Test-1 (10)', values:{Remember:'',Understand:'',Apply:'10%',Analyze:'',Evaluate:'',Create:''}},
      {id:uid(), name:'Lab Final (20)', values:{Remember:'',Understand:'',Apply:'10%',Analyze:'10%',Evaluate:'',Create:''}},
      {id:uid(), name:'Quiz (20)', values:{Remember:'3%',Understand:'4%',Apply:'5%',Analyze:'4%',Evaluate:'2%',Create:'2%'}},
      {id:uid(), name:'Lab Report (10)', values:{Remember:'',Understand:'5%',Apply:'',Analyze:'',Evaluate:'5%',Create:''}},
      {id:uid(), name:'Project Presentation (10)', values:{Remember:'',Understand:'',Apply:'',Analyze:'',Evaluate:'5%',Create:'5%'}},
      {id:uid(), name:'Viva (10)', values:{Remember:'5%',Understand:'',Apply:'',Analyze:'',Evaluate:'5%',Create:''}},
    ],

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
