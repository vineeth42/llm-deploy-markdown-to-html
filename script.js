/*
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
*/

// A minimal, self-contained Markdown parser that exposes a marked-compatible API.
// It intentionally focuses on common GitHub-flavored Markdown features and is
// sufficient for documentation rendering without external dependencies.
// API: marked.parse(markdownString) -> HTML string
(function(){
  function escapeHtml(str){
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function renderInline(text){
    if(!text) return '';

    // Extract code spans first to protect their content
    const codeSpans = [];
    text = String(text).replace(/`([^`]+)`/g, (_, code) => {
      const id = codeSpans.push(code) - 1;
      return `%%CODESPAN_${id}%%`;
    });

    // Escape leftover HTML
    text = escapeHtml(text);

    // Images ![alt](src "title")
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"([^\"]*)\")?\)/g, (m, alt, src, title) => {
      const t = title ? ` title=\"${escapeHtml(title)}\"` : '';
      return `<img src="${src}" alt="${alt}"${t}>`;
    });

    // Links [label](href "title")
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+\"([^\"]*)\")?\)/g, (m, label, href, title) => {
      const t = title ? ` title=\"${escapeHtml(title)}\"` : '';
      return `<a href="${href}" target="_blank" rel="noopener"${t}>${label}</a>`;
    });

    // Bold strong **text** or __text__
    text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

    // Emphasis *text* or _text_
    text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

    // Strikethrough ~~text~~
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Restore code spans (escaped inside)
    text = text.replace(/%%CODESPAN_(\d+)%%/g, (_, i) => `<code>${escapeHtml(codeSpans[Number(i)])}</code>`);

    return text;
  }

  function parseMarkdown(md){
    if(!md) return '';
    md = md.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').trimEnd();
    const lines = md.split('\n');

    let html = '';
    let i = 0;
    let inCode = false, codeLang = '', codeBuffer = [];
    let inUl = false, inOl = false;

    function closeLists(){
      if(inUl){ html += '</ul>'; inUl = false; }
      if(inOl){ html += '</ol>'; inOl = false; }
    }

    while(i < lines.length){
      let line = lines[i];

      // Fenced code blocks ```lang
      const fence = line.match(/^\s*```(\w+)?\s*$/);
      if(fence){
        if(!inCode){
          closeLists();
          inCode = true; codeLang = fence[1] || ''; codeBuffer = [];
        } else {
          html += `<pre><code${codeLang ? ` class="language-${codeLang}"` : ''}>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
          inCode = false; codeLang = ''; codeBuffer = [];
        }
        i++; continue;
      }

      if(inCode){ codeBuffer.push(line); i++; continue; }

      // Horizontal rule
      if(/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line)){
        closeLists();
        html += '<hr>';
        i++; continue;
      }

      // Headings #..###### text
      const h = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
      if(h){
        closeLists();
        const level = h[1].length;
        const text = h[2].replace(/\s+#+\s*$/, '');
        html += `<h${level}>${renderInline(text)}</h${level}>`;
        i++; continue;
      }

      // Blockquotes
      let bq = line.match(/^\s{0,3}>\s?(.*)$/);
      if(bq){
        closeLists();
        const innerLines = [];
        while(i < lines.length){
          const m = lines[i].match(/^\s{0,3}>\s?(.*)$/);
          if(!m) break;
          innerLines.push(m[1]);
          i++;
        }
        const innerHtml = parseMarkdown(innerLines.join('\n'));
        html += `<blockquote>${innerHtml}</blockquote>`;
        continue;
      }

      // Unordered list
      const ulItem = line.match(/^\s{0,3}[*+-]\s+(.*)$/);
      if(ulItem){
        if(inOl){ html += '</ol>'; inOl = false; }
        if(!inUl){ html += '<ul>'; inUl = true; }
        html += `<li>${renderInline(ulItem[1])}</li>`;
        i++;
        const next = lines[i] || '';
        if(!/^\s{0,3}[*+-]\s+/.test(next)){ html += '</ul>'; inUl = false; }
        continue;
      }

      // Ordered list
      const olItem = line.match(/^\s{0,3}\d+\.\s+(.*)$/);
      if(olItem){
        if(inUl){ html += '</ul>'; inUl = false; }
        if(!inOl){ html += '<ol>'; inOl = true; }
        html += `<li>${renderInline(olItem[1])}</li>`;
        i++;
        const next = lines[i] || '';
        if(!/^\s{0,3}\d+\.\s+/.test(next)){ html += '</ol>'; inOl = false; }
        continue;
      }

      // Blank line -> paragraph break
      if(/^\s*$/.test(line)){ i++; continue; }

      // Paragraph (collect contiguous non-blank, non-block lines)
      closeLists();
      const buf = [line];
      i++;
      while(i < lines.length){
        const l2 = lines[i];
        if(/^\s*$/.test(l2)) break;
        if(/^\s*```/.test(l2)) break;
        if(/^\s{0,3}(#{1,6})\s+/.test(l2)) break;
        if(/^\s{0,3}>\s?/.test(l2)) break;
        if(/^\s{0,3}[*+-]\s+/.test(l2)) break;
        if(/^\s{0,3}\d+\.\s+/.test(l2)) break;
        if(/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(l2)) break;
        buf.push(l2);
        i++;
      }
      const paragraph = renderInline(buf.join(' ').replace(/\s+/g,' ').trim());
      if(paragraph) html += `<p>${paragraph}</p>`;
    }

    if(inUl) html += '</ul>';
    if(inOl) html += '</ol>';

    return html;
  }

  // Expose a marked-compatible API
  window.marked = {
    parse: parseMarkdown
  };
})();

// Embedded fallback content derived from the provided attachment (input.md)
const INLINED_INPUT_MD = `# Tic Tac Toe Web Application

A simple and responsive Tic Tac Toe game for two players, built with pure HTML, CSS (Tailwind CSS), and JavaScript. Play against a friend on the same screen!

## Features

*   **Two-Player Mode:** Play with a friend on the same device.
*   **Turn Indicator:** Clearly shows whose turn it is.
*   **Win/Draw Detection:** Automatically detects when a player wins or the game ends in a draw.
*   **Reset Option:** Easily start a new game at any time.
*   **Responsive Design:** Optimized for a seamless experience on both desktop and mobile devices using Tailwind CSS.

## Technologies Used

*   **HTML5:** For the structure of the web page.
*   **Tailwind CSS:** For modern and responsive styling.
*   **JavaScript (ES6+):** For all game logic and interactivity.

## How to Play

1.  Open \`index.html\` in your web browser.
2.  Player 'X' starts first.
3.  Players take turns clicking on an empty cell to place their 'X' or 'O'.
4.  The first player to get three of their marks in a row (horizontally, vertically, or diagonally) wins.
5.  If all cells are filled and no player has three in a row, the game is a draw.
6.  Click the "Reset Game" button to start a new game.

## Setup and Installation

This is a single-file web application, so no local server or build tools are required.

1.  **Download the files:** Obtain \`index.html\`, \`README.md\`, and \`LICENSE\` files.
2.  **Open \`index.html\`:** Simply open the \`index.html\` file directly in your preferred web browser.

## Project Structure

\`\`\`
.
├── index.html     # The main game application file
├── README.md      # Project documentation
└── LICENSE        # MIT License details
\`\`\`

## Contributing

Feel free to fork this repository, make improvements, and submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`;

// App logic: load input.md if present, otherwise use the embedded content
(function(){
  const rendered = document.getElementById('rendered');
  const source = document.getElementById('source');
  const status = document.getElementById('status');
  const reloadBtn = document.getElementById('reloadBtn');
  const toggleSourceBtn = document.getElementById('toggleSourceBtn');

  function renderMarkdown(md, origin){
    source.textContent = md;
    const html = window.marked.parse(md);
    rendered.innerHTML = html;
    status.textContent = `Showing ${origin === 'remote' ? 'input.md' : 'embedded fallback'} (${md.length} chars)`;
  }

  async function tryLoadInputMd(showMessages = true){
    try{
      if(showMessages) status.textContent = 'Loading input.md...';
      const resp = await fetch('input.md', {cache: 'no-store'});
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      if(!text.trim()) throw new Error('Empty file');
      renderMarkdown(text, 'remote');
    }catch(err){
      renderMarkdown(INLINED_INPUT_MD, 'embedded');
      if(showMessages) status.textContent += ' • input.md not found; loaded embedded content.';
    }
  }

  reloadBtn.addEventListener('click', () => tryLoadInputMd());
  toggleSourceBtn.addEventListener('click', () => {
    const pane = document.querySelector('.pane-source');
    const hidden = pane.style.display === 'none';
    pane.style.display = hidden ? '' : 'none';
    toggleSourceBtn.textContent = hidden ? 'Hide source' : 'Show source';
  });

  // Initial render
  tryLoadInputMd(false);
})();
