# Executable specific project workshops

Four classes per route, using the existing OOP Colab layout: Theory, editable cells, real execution, tests, evidence and downloadable product.

- `cyber`: Python synthetic request fixtures, rate limit, authorization and input size checks. Exports a real HTTP server bound to `127.0.0.1:8765` and a bounded localhost-only verification script. Browser fixtures are explicitly identified as synthetic.
- `cad`: parameterized L-shaped stand, triangulated closed solid, signed volume checks, ASCII STL and dimensions in millimeters. Physical printing and measurements remain pending; the measurement exercise is labeled as a fixture. The example does not finalize students' pending CAD design decisions.
- `clients`: HTML/CSS/JavaScript registration form with real local IndexedDB, unique normalized email, validation, search, deletion and standalone HTML export.
- `gta`: HTML catalog of fictional GTA V mod records, categories, compatible build and requirements, real local IndexedDB, search/filter and standalone HTML export. It does not run or install mods.

Web editors run in an iframe sandbox without same-origin permission. A source-and-token checked message broker exposes only list/add/delete operations against the route's local database. The exported HTML includes the same database adapter and works offline. It has its own local browser database and does not synchronize with Supabase. Download JSON to preserve records separately.

Existing institutional email access and assignment titles remain unchanged. Supabase continues to identify students and assignments. Guided-definition projects remain pending teacher confirmation; opening a starter workshop is not approval or a submitted grade.

Run `node qa/project-studio.e2e.cjs` against an HTTP server on 4173 with Playwright installed. The browser checks all 16 classes, real Python and JavaScript, IndexedDB transactions, offline export, mobile layout and artifacts. Run the downloaded `laboratorio_web.py` and `prueba_local.py` in separate processes to verify actual localhost HTTP behavior.
