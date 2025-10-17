# Markdown → HTML Viewer (marked)

## Summary
This project is a minimal, self-contained web application that converts a Markdown file (input.md) into HTML and renders it in the browser using a bundled, marked-compatible parser (no network requests or build tools required). If an input.md file is not present next to index.html, the app gracefully falls back to an embedded example (provided via attachments) so you can see the renderer in action immediately.

Key characteristics:
- Self-contained: ships as static assets (HTML, CSS, JS) with no external CDN dependencies.
- Marked-style API: the renderer is exposed via window.marked.parse(md) for familiarity and easy adaptation.
- Progressive loading: attempts to fetch input.md and falls back to embedded content if unavailable.
- Accessible and responsive UI with a source view toggle.

## Setup
No build steps are necessary.

1. Download the repository files (index.html, style.css, script.js, README.md).
2. Optionally place your own input.md file alongside index.html.
3. Open index.html in your web browser.

The app will try to load input.md from the same directory. If that file does not exist, it renders the embedded example content.

## Usage
- Open index.html in any modern browser.
- Click "Reload input.md" to re-fetch the file from disk (useful after edits).
- Click "Toggle source" to show/hide the raw Markdown next to the rendered HTML.
- To render your own Markdown:
  - Add or replace the input.md file in the same directory.
  - Press the Reload button or refresh the page.

Notes:
- Security: The renderer escapes raw HTML by default and supports common Markdown features (headings, lists, emphasis, links, images, code blocks, etc.).
- Offline-friendly: All logic is local; no external network requests are required.

## License
This project is licensed under the MIT License. See the full text below.

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
