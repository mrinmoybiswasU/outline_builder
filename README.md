# OBE Course Outline Builder — CSE, UITS

A static HTML/CSS/JS tool for building an Outcome-Based Education (OBE) course
outline, matching the structure in *New Lab Course Outline — Database
Management System Lab*.

## How to use it

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox). An internet
   connection is needed the first time, to load the page's fonts and the
   `docx` library used for the Word export.
2. Work through the six tabs on the left — **Course Information, Skill
   Mapping, Teaching Learning Approach, Assessment Approach, References,
   Additional Information** — in any order. The ring at the bottom of the
   sidebar and the bar at the bottom of the screen both track overall
   completion.
3. Use the bar at the bottom of the screen at any time to:
   - **Reset** — clear everything and start over
   - **Load JSON** — reopen a previously saved outline
   - **Save JSON** — download the raw data, so you can continue later or
     share the file with a colleague
   - **Download .docx** — generate a formatted Word document of the full
     outline
   - **Download PDF** — opens the browser's print dialog on a print-ready
     version of the outline; choose "Save as PDF" as the destination
   - **Preview** — see the fully formatted outline inline, without printing

## What's new in this update

- **BT (Bloom's Level)** is now a checkbox-dropdown like the other attributes, and BT / CP-WP / CA-EA / KP-WK all show their full official name in brackets in the app (e.g. "P3 — Depth of analysis required"). Exports (Word/PDF) still show only the short code, per department convention.
- Any cell you've filled in on the Course Outcomes table is now tinted **green**, so you can see progress at a glance.
- **Corresponding COs** and **Assessment Strategy** (Part C) no longer offer "Add custom" — Assessment Strategy only lists tools you've already selected in Part B.
- Adding a **custom Assessment Tool** in Part B now shows a warning that it needs PSAC committee approval, and any custom tool is automatically listed in the legend below the table.
- Program Outcomes are now **PO(a)–PO(l)**, and every CO defaults to PO(a) until you change it.
- Dropdown panels now **float freely** above the page (via a small floating layer) instead of being boxed in by the table — they'll never get clipped again.
- Reference boxes start **empty**; "Supplementary Readings — Others (Sites)" is now just "Supplementary Readings — Others."
- **Fixed the "docx is not defined" error** — the Word-export library now loads from a corrected CDN path.
- Exported Word/PDF documents now use **Times New Roman, 12pt**, tighter line spacing to save pages, and a footer reading "UITS, Department of CSE, <semester>" on the left. The Word file also has a real page number on the right of its footer; for the PDF/print view, tick "Headers and footers" in your browser's print dialog to get automatic page numbers there too (browsers don't allow web pages to draw their own page numbers in print preview).
- The sidebar and progress ring now use color more deliberately: gray = not started, amber = in progress, green = complete, and the ring/bar shift from red → amber → green as the whole outline fills in.

## What's new in this update

- **Course Contents** — a new formattable text section in Part A, right after the Rationale.
- **BT is now three learning domains** — Cognitive, Affective, and Psychomotor (e.g. "Cog1: Remember", "Aff2: Responding", "Psy3: Precision") — with a divider between each domain in the picker.
- **PO now lives in the Course Outcomes table itself** — a new column right after "COs." The "Mapping of COs with Program Outcomes" table below it is now a read-only summary built from that column.
- **Washington Accord / BAETE convention, hard-enforced**: picking a PO for a CO narrows the CP/WP choices to only the complex-problem attributes that PO permits, and drops any CP/WP the CO had that are no longer allowed. (The exact PO→attribute table lives in `PO_CPWP_MAP` in `state.js` — edit it directly if your department's approved matrix differs.)
- **Assessment Tools now depend on Course Type**: Theory offers Class Test 01/02, Mid Term, Final, Assignment; Lab/Sessional offers Quiz, Report, Presentation, Viva, Lab Performance, Project. The picker shows the full name (e.g. "Q — Quiz"); exports show only the short code, with a legend line spelling them out.
- **New "Assessment Schedule" table** in Part D — pick Week 1–14, Regular from Class, University Scheduled Midterm, or University Scheduled Term Final for each assessment tool you're using.
- **PDF output is now fully uniform** — one font, one size, one line spacing throughout, no matter how anything was formatted while typing. (The Word export keeps its normal heading hierarchy, since that wasn't part of this request.)
- **PDF headers/footers**: removed everything except the page number, which now uses a real page counter built into the page itself (Chromium/Firefox both support this natively today), so it's accurate on every page. Page size is A4 with normal (1 inch / 2.54 cm) margins. Leave "Headers and footers" **unticked** in your browser's print dialog — the page number is already built in, and that checkbox only adds the browser's own extra title/URL/date.

## Latest small fixes

- **Assessment Schedule** is now a checkbox-dropdown (a tool can happen across several weeks — e.g. a Quiz in both Week 4 and Week 9).
- **Course Contents** no longer appears in the generated PDF (it's still in the app and the Word export, since you said it's used elsewhere).
- **Fixed blank pages in the PDF** — the on-screen preview's 900px reading width doesn't fit an A4 page's printable area, which could push out stray extra pages; print now uses the page's full width, headings stay glued to what follows them, table rows never split across a page break, and there's no leftover trailing whitespace after the last section.

## v1.6 — CEP rules, Knowledge Profile restriction, help buttons, credits

- **CEP (Complex Engineering Problem) rule, hard-enforced**: the CP/WP picker now starts with "No CEP" and P1 as the only two enabled choices; checking P1 unlocks P2–P7. A warning appears if a CO has P1 but fewer than 2 of P2–P7 (BAETE's "P1 plus at least two more" rule). Picking "No CEP" clears any P-codes, and picking any P-code clears "No CEP."
- **The PO restriction moved from CP/WP to Knowledge Profile (KP/WK)**, per BAETE's own PO definitions — PO(a)/(b)→K1–K4, PO(c)→K5, PO(d)→K8, PO(e)→K6, PO(f)/(g)/(h)→K7, PO(i)–(l)→not applicable. Edit `PO_KPWK_MAP` in `state.js` if this needs to change. CP/WP is no longer restricted by PO at all.
- **(?) help buttons** above the Course Outcomes and PO Mapping tables open a reference popup with BAETE's official wording for Programme Outcomes, Knowledge Profile, Complex Engineering Problems, and Complex Engineering Activities — no need to keep the BAETE manual open in another tab.
- **Version & credit**: a small "i" icon at the end of the bottom toolbar shows "Version 1.6 — Developed by Mrinmoy Biswas Akash" in a popover.

## v1.5 — schedule multi-select, PDF cleanup

- Assessment Schedule is a checkbox-dropdown (a tool can span several weeks).
- Course Contents no longer appears in the generated PDF (still in the app and the Word export).
- Fixed blank pages in the PDF: print now uses the page's full printable width (the 900px on-screen reading column doesn't fit A4), headings stay glued to what follows them, and table rows never split across a page break.

## Latest small changes

- **CP/WP now defaults to "No CP/WP"** for every new Course Outcome. Checking **P1** automatically adds **P2 and P3** too (BAETE's "P1 plus at least 2 more" minimum) — once a CO has exactly 3 P-attributes selected, none of them can be unchecked below that floor (add a 4th first, then remove one).
- The **(?) help buttons** now sit in the table header next to their actual column (PO, CP/WP, CA/EA, KP/WK) instead of bunched beside "Course Outcomes (COs)."
- **PDF typography updated**: Times New Roman 12pt, 1.5 line spacing, paragraphs justified with 0pt space before / 6pt after, and the document title at 16pt bold (everything else stays consistent body text).

## Latest changes

- **CA/EA now has the same kind of rule as CP/WP**: defaults to "No CA/EA"; checking **A1** auto-adds **A2** (needs A1 + at least 1 more); once at that minimum of 2, neither can be unchecked below it.
- **Final Exam (FE)** always sorts to the last row of the Assessment Components table, and reads simply "Final Exam (FE)" rather than being labelled as Continuous Internal Assessment.
- **Download PDF now produces a real .pdf file directly** — no more print dialog. It's built with jsPDF + AutoTable (Times New Roman, 12pt, 1.5 line spacing, justified paragraphs, A4 with 1-inch margins), and every page gets a footer: **"Department of CSE/UITS"** on the left, **page number** on the right.
- The **Preview** button still shows the in-app formatted view (unchanged) — only the actual PDF download changed.

## Previous update

- BT/CP-WP/CA-EA/KP-WK show full names in-app with codes-only in exports; filled cells turn green; PO is now PO(a)–PO(l); custom Assessment Tools require a PSAC note; dropdowns float freely; references start empty; fixed the Word-export CDN link; Word export uses Times New Roman 12pt with a left institution/semester footer and a right page number.

## Notes on specific sections

- **Class/Counseling Schedule, Section, Prerequisites** — all intentionally
  optional; leave blank for a general (non-section-specific) outline.
- **CP/WP and CA/EA** (Part B) — the tool will flag, but not block, mapping
  the same complex-problem or complex-activity number to more than one CO,
  since department guidance asks for a one-to-one mapping.
- **AT (Assessment Tools) and DM&A (Delivery Methods)** — pick from the
  built-in list or add your own via "Add custom" inside each dropdown. Custom
  tools you add in Part B automatically become available as Assessment
  Strategy choices in the Part C course plan, and as rows in the Part D
  marks-distribution table.
- **PO mapping** (Part B) — selecting a Program Outcome for a CO clears any
  other selection on that row, enforcing the department's one-CO-to-one-PO
  rule.
- **Assessment & Evaluation table** (Part D) — automatically switches
  structure based on the Course Type ("Theory" adds a Final Exam row; "Lab/
  Sessional" does not) and lists exactly the Assessment Tools used in Part B.
- **Grading System** (Part D) — fixed to the department's standard scale.

## Files

- `index.html` — page shell, tabs, and the bottom toolbar
- `style.css` — the full visual design system
- `state.js` — data model, defaults, and constants
- `render.js` — builds each tab's HTML from the current data
- `app.js` — event wiring, completion tracking, JSON load/save
- `export.js` — the print/PDF view and the Word (.docx) generator

Everything runs client-side — there is no server and no data leaves the
browser except when you explicitly download a file.
