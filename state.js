/* =====================================================================
   STATE, CONSTANTS & UTILITIES
   ===================================================================== */

const TABS = [
  {id:'info',        part:'Part A', label:'Course Information'},
  {id:'skill',       part:'Part B', label:'Skill Mapping'},
  {id:'teaching',    part:'Part C', label:'Teaching Learning Approach'},
  {id:'assessment',  part:'Part D', label:'Assessment Approach'},
  {id:'references',  part:'Part E', label:'References'},
  {id:'additional',  part:'Part F', label:'Additional Information'},
];

const DAYS = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];

const AT_DEFAULTS = [
  {code:'LT', label:'Lab Test'},
  {code:'LF', label:'Lab Final'},
  {code:'Q',  label:'Quiz'},
  {code:'R',  label:'Report'},
  {code:'P',  label:'Presentation'},
  {code:'V',  label:'Viva'},
  {code:'A',  label:'Assignment'},
  {code:'CP', label:'Class Performance'},
];

const DMA_DEFAULTS = [
  'Lecture','Demonstration','Group Work','Problem Solving Session',
  'Lab Practice','Case Study','Flipped Classroom','Peer Instruction',
];

const BLOOM_LEVELS = ['L1 (Remember)','L2 (Understand)','L3 (Apply)','L4 (Analyze)','L5 (Evaluate)','L6 (Create)'];
const BLOOM_ROWS   = ['Remember','Understand','Apply','Analyze','Evaluate','Create'];

/* Full names shown in the UI only — exports (docx/pdf) show just the code (L1, P3, A2, K5...) */
const BT_DEFAULTS = [
  {code:'L1', label:'Remember'},
  {code:'L2', label:'Understand'},
  {code:'L3', label:'Apply'},
  {code:'L4', label:'Analyze'},
  {code:'L5', label:'Evaluate'},
  {code:'L6', label:'Create'},
];
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
    bt:[], cpwp:[], caea:[], kpwk:[],
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
    objectives:[''],

    cos: cos,

    poMapping: cos.map(c => ({coId:c.id, po:'PO(a)'})),

    semesterStart:'2025-07-13',
    semesterEnd:'2025-11-20',
    plan: plan,

    assessment:{
      // marks distribution keyed by AT code / 'attendance' / 'FE' / custom labels
      attendanceMarks:'',
      rowMarks:{},      // { 'LT': '10%', ... } keyed by AT code present in COs
      feMarks:'',
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
