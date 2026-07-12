# OBE Course Outline Builder — CSE, UITS

A static HTML/CSS/JS tool for building an Outcome-Based Education (OBE) course
outline, matching the structure in *New Lab Course Outline — Database
Management System Lab*.

Access at: https://mrinmoybiswasU.github.io/outline_builder

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
