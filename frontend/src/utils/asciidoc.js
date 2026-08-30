/**
 * Conversor bidireccional exhaustivo entre AsciiDoc (.adoc) y HTML enriquecido para TipTap Editor (Word-like AST)
 */

/**
 * Convierte texto AsciiDoc en HTML formateado con soporte completo para:
 * Encabezados, Listas, Tareas, Tablas, Citas, Código, Admonitions y formato inline.
 */
export function asciidocToHtml(adocText) {
  if (!adocText) return '';

  const lines = adocText.split('\n');
  const htmlParts = [];
  
  let inList = false;
  let listType = null; // 'ul', 'ol', 'taskList'
  
  let inAdmonition = false;
  let admonitionType = 'note';
  let admonitionTitle = '';
  let admonitionBuffer = [];

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBuffer = [];

  let inTable = false;
  let tableRows = [];

  let inQuote = false;
  let quoteBuffer = [];

  const closeList = () => {
    if (inList) {
      if (listType === 'taskList') {
        htmlParts.push('</ul>');
      } else if (listType === 'ul') {
        htmlParts.push('</ul>');
      } else if (listType === 'ol') {
        htmlParts.push('</ol>');
      }
      inList = false;
      listType = null;
    }
  };

  const closeAdmonition = () => {
    if (inAdmonition) {
      const typeLabels = {
        tip: '💡 CONSEJO PEDAGÓGICO',
        warning: '⚠️ ATENCIÓN / SEGURIDAD',
        important: '❗ IMPORTANTE',
        note: '📌 NOTA',
        caution: '🛑 PRECAUCIÓN',
        instructor: '👨‍🏫 SOLO INSTRUCTOR'
      };

      const title = admonitionTitle || typeLabels[admonitionType] || 'NOTA';
      const content = admonitionBuffer.join(' ').trim() || '...';

      htmlParts.push(
        `<div class="admonition-block admonition-${admonitionType}" data-admonition="${admonitionType}">` +
        `<div class="admonition-header">${title}</div>` +
        `<div class="admonition-body"><p>${inlineFormat(content)}</p></div>` +
        `</div>`
      );

      inAdmonition = false;
      admonitionBuffer = [];
      admonitionTitle = '';
    }
  };

  const closeCodeBlock = () => {
    if (inCodeBlock) {
      const code = escapeHtml(codeBuffer.join('\n'));
      htmlParts.push(`<pre><code class="language-${codeBlockLang || 'text'}">${code}</code></pre>`);
      inCodeBlock = false;
      codeBlockLang = '';
      codeBuffer = [];
    }
  };

  const closeQuote = () => {
    if (inQuote) {
      const content = quoteBuffer.join(' ').trim();
      htmlParts.push(`<blockquote><p>${inlineFormat(content)}</p></blockquote>`);
      inQuote = false;
      quoteBuffer = [];
    }
  };

  const closeTable = () => {
    if (inTable) {
      let tableHtml = '<table class="tiptap-table border-collapse my-4 w-full"><tbody>';
      tableRows.forEach((row, rowIdx) => {
        tableHtml += '<tr>';
        row.forEach(cell => {
          if (rowIdx === 0) {
            tableHtml += `<th class="border border-slate-700 bg-slate-800/80 px-3 py-2 text-left font-bold">${inlineFormat(cell)}</th>`;
          } else {
            tableHtml += `<td class="border border-slate-700 px-3 py-2">${inlineFormat(cell)}</td>`;
          }
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';
      htmlParts.push(tableHtml);
      inTable = false;
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Cabeceras y metadatos de documento (:author:, :doctype:, etc.)
    if (line.startsWith(':') && line.includes(':')) {
      continue;
    }

    // 2. Bloques de código (---- o ```)
    if (line.startsWith('----') || line.startsWith('```')) {
      if (inCodeBlock) {
        closeCodeBlock();
      } else {
        closeList();
        closeAdmonition();
        closeQuote();
        closeTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // 3. Bloques de código con cabecera [source,lang]
    const sourceMatch = line.match(/^\[source(?:,\s*(\w+))?\]$/i);
    if (sourceMatch) {
      codeBlockLang = sourceMatch[1] || '';
      continue;
    }

    // 4. Tablas AsciiDoc (|===)
    if (line === '|===') {
      if (inTable) {
        closeTable();
      } else {
        closeList();
        closeAdmonition();
        closeQuote();
        inTable = true;
        tableRows = [];
      }
      continue;
    }

    if (inTable) {
      if (line.startsWith('|')) {
        // Parsear celdas de la fila separadas por '|'
        const cells = line.split('|').slice(1).map(c => c.trim()).filter(c => c.length > 0);
        if (cells.length > 0) {
          tableRows.push(cells);
        }
      }
      continue;
    }

    // 5. Bloques de citas (____)
    if (line === '____') {
      if (inQuote) {
        closeQuote();
      } else {
        closeList();
        closeAdmonition();
        inQuote = true;
      }
      continue;
    }

    if (inQuote) {
      quoteBuffer.push(line);
      continue;
    }

    // 6. Delimitadores de Admonition (==== o --)
    if (line === '====' || line === '--') {
      if (inAdmonition) {
        closeAdmonition();
      }
      continue;
    }

    // 7. Detección de Admonition ([TIP], [WARNING], [IMPORTANT], [NOTE], [CAUTION], [INSTRUCTOR])
    const admonitionMatch = line.match(/^\[(TIP|WARNING|IMPORTANT|NOTE|CAUTION|INSTRUCTOR)\]$/i);
    if (admonitionMatch) {
      closeList();
      closeAdmonition();
      inAdmonition = true;
      admonitionType = admonitionMatch[1].toLowerCase();
      
      // Comprobar si la línea siguiente tiene título .Título
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith('.')) {
        admonitionTitle = lines[i + 1].trim().substring(1);
        i++;
      }
      continue;
    }

    if (inAdmonition) {
      if (line !== '') {
        admonitionBuffer.push(line);
      }
      continue;
    }

    // Helper para insertar espaciado si venimos de un encabezado o bloque
    const ensureSpacingAfterHeading = () => {
      if (htmlParts.length > 0) {
        const last = htmlParts[htmlParts.length - 1];
        if (
          last.startsWith('<h1') || 
          last.startsWith('<h2') || 
          last.startsWith('<h3') || 
          last.startsWith('<h4') || 
          last.startsWith('<div class="admonition') ||
          last.startsWith('<blockquote')
        ) {
          htmlParts.push('<p></p>');
        }
      }
    };

    // 7.5. Título de figura / imagen (.Título de la Figura)
    if (line.startsWith('.') && !line.startsWith('..') && i + 1 < lines.length && lines[i + 1].trim().startsWith('image::')) {
      const figTitle = line.substring(1).trim();
      const imgLine = lines[i + 1].trim();
      const imgMatch = imgLine.match(/^image::([^\[]+)\[(.*?)\]$/i);
      if (imgMatch) {
        closeList();
        i++; // Avanzar la línea de imagen
        const imgPath = imgMatch[1].trim();
        const attrs = imgMatch[2];
        const widthMatch = attrs.match(/width=(\d+%?)/i) || attrs.match(/,\s*(\d+)/);
        const width = widthMatch ? widthMatch[1] : '';

        htmlParts.push(
          `<div class="figure-center" ${width ? `style="max-width: ${width}px;"` : ''}>` +
          `<img src="${imgPath}" alt="${figTitle}" />` +
          `<div class="figure-caption">${figTitle}</div>` +
          `</div><p></p>`
        );
        continue;
      }
    }

    // 7.6. Imágenes AsciiDoc (image::path[alt, width=..., role=..., title=...])
    const imageMatch = line.match(/^image::([^\[]+)\[(.*?)\]$/i);
    if (imageMatch) {
      closeList();
      const imgPath = imageMatch[1].trim();
      const attrs = imageMatch[2];
      
      let alt = 'Ilustración';
      let width = '';
      let role = '';
      let title = '';

      const widthMatch = attrs.match(/width=(\d+%?)/i) || attrs.match(/,\s*(\d+)/);
      if (widthMatch) width = widthMatch[1];

      const roleMatch = attrs.match(/role="([^"]+)"/i) || attrs.match(/role=([\w-]+)/i);
      if (roleMatch) role = roleMatch[1];

      const titleMatch = attrs.match(/title="([^"]+)"/i);
      if (titleMatch) title = titleMatch[1];

      if (role.includes('left')) {
        htmlParts.push(
          `<div class="float-left-thumb" ${width ? `style="width: ${width}px;"` : ''}>` +
          `<img src="${imgPath}" alt="${alt}" ${title ? `title="${title}"` : ''} />` +
          (title ? `<div class="figure-caption">${title}</div>` : '') +
          `</div>`
        );
      } else if (role.includes('right')) {
        htmlParts.push(
          `<div class="float-right-thumb" ${width ? `style="width: ${width}px;"` : ''}>` +
          `<img src="${imgPath}" alt="${alt}" ${title ? `title="${title}"` : ''} />` +
          (title ? `<div class="figure-caption">${title}</div>` : '') +
          `</div>`
        );
      } else if (role.includes('banner')) {
        htmlParts.push(`<img src="${imgPath}" class="banner-full" alt="${alt}" ${title ? `title="${title}"` : ''} /><p></p>`);
      } else if (attrs.includes('align=center') || title) {
        htmlParts.push(
          `<div class="figure-center" ${width ? `style="max-width: ${width}px;"` : ''}>` +
          `<img src="${imgPath}" alt="${alt}" ${title ? `title="${title}"` : ''} />` +
          (title ? `<div class="figure-caption">${title}</div>` : '') +
          `</div><p></p>`
        );
      } else {
        htmlParts.push(`<p><img src="${imgPath}" alt="${alt}" ${width ? `width="${width}"` : ''} /></p>`);
      }
      continue;
    }

    // 7.7. Macro de Audio AsciiDoc (audio::path[title=..., opts=...])
    const audioMatch = line.match(/^audio::([^\[]+)\[(.*?)\]$/i);
    if (audioMatch) {
      closeList();
      const audioPath = audioMatch[1].trim();
      const attrs = audioMatch[2];
      const titleMatch = attrs.match(/title="([^"]+)"/i) || attrs.match(/title=([^,\]]+)/i);
      const audioTitle = titleMatch ? titleMatch[1] : 'Grabación de audio de la sesión';

      htmlParts.push(
        `<div class="audio-block my-4 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200" data-type="audio" data-title="${audioTitle}">` +
        `<div class="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-2"><span>🎙️ ${audioTitle}</span></div>` +
        `<audio controls class="w-full h-8" src="${audioPath}"></audio>` +
        `</div><p></p>`
      );
      continue;
    }

    // 8. Regla horizontal / Separador (''' o ---)
    if (line === "'''" || line === '---' || line === '***') {
      closeList();
      htmlParts.push('<hr />');
      continue;
    }

    // 9. Encabezados AsciiDoc (=, ==, ===, ====) o Markdown (#, ##, ###)
    if (line.startsWith('=')) {
      closeList();
      ensureSpacingAfterHeading();
      if (line.startsWith('==== ')) {
        htmlParts.push(`<h4>${inlineFormat(line.substring(5))}</h4>`);
      } else if (line.startsWith('=== ')) {
        htmlParts.push(`<h3>${inlineFormat(line.substring(4))}</h3>`);
      } else if (line.startsWith('== ')) {
        htmlParts.push(`<h2>${inlineFormat(line.substring(3))}</h2>`);
      } else if (line.startsWith('= ')) {
        htmlParts.push(`<h1>${inlineFormat(line.substring(2))}</h1>`);
      }
      continue;
    }

    if (line.startsWith('#')) {
      closeList();
      ensureSpacingAfterHeading();
      if (line.startsWith('#### ')) {
        htmlParts.push(`<h4>${inlineFormat(line.substring(5))}</h4>`);
      } else if (line.startsWith('### ')) {
        htmlParts.push(`<h3>${inlineFormat(line.substring(4))}</h3>`);
      } else if (line.startsWith('## ')) {
        htmlParts.push(`<h2>${inlineFormat(line.substring(3))}</h2>`);
      } else if (line.startsWith('# ')) {
        htmlParts.push(`<h1>${inlineFormat(line.substring(2))}</h1>`);
      }
      continue;
    }

    // 10. Checklists / Tareas (* [ ] o * [x] o - [ ])
    const taskMatch = line.match(/^[\*\-]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const isChecked = taskMatch[1].toLowerCase() === 'x';
      const itemText = taskMatch[2];
      if (!inList || listType !== 'taskList') {
        closeList();
        htmlParts.push('<ul data-type="taskList" class="task-list">');
        inList = true;
        listType = 'taskList';
      }
      htmlParts.push(
        `<li data-type="taskItem" data-checked="${isChecked}" class="task-item flex items-center gap-2">` +
        `<label><input type="checkbox" ${isChecked ? 'checked' : ''} disabled /><span></span></label>` +
        `<div><p>${inlineFormat(itemText)}</p></div>` +
        `</li>`
      );
      continue;
    }

    // 11. Listas desordenadas (* o -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const itemContent = line.substring(2);
      if (!inList || listType !== 'ul') {
        closeList();
        htmlParts.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      htmlParts.push(`<li>${inlineFormat(itemContent)}</li>`);
      continue;
    }

    // 12. Listas ordenadas (. o 1.)
    const numMatch = line.match(/^(\d+\.|\.)\s+(.+)$/);
    if (numMatch) {
      const itemContent = numMatch[2];
      if (!inList || listType !== 'ol') {
        closeList();
        htmlParts.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      htmlParts.push(`<li>${inlineFormat(itemContent)}</li>`);
      continue;
    }

    // 13. Citas rápidas (> texto)
    if (line.startsWith('> ')) {
      closeList();
      htmlParts.push(`<blockquote><p>${inlineFormat(line.substring(2))}</p></blockquote>`);
      continue;
    }

    // 14. Párrafo normal o línea en blanco
    if (line === '') {
      closeList();
      // Si hay un salto de línea explícito en un bloque de texto, emitir <p></p>
      if (htmlParts.length > 0 && !htmlParts[htmlParts.length - 1].endsWith('</h1>') && !htmlParts[htmlParts.length - 1].endsWith('</h2>')) {
        // preserve blank line spacing
      }
    } else {
      closeList();
      htmlParts.push(`<p>${inlineFormat(line)}</p>`);
    }
  }

  closeList();
  closeAdmonition();
  closeCodeBlock();
  closeQuote();
  closeTable();

  // Asegurar que si el documento termina en un encabezado, haya un párrafo editable debajo
  if (htmlParts.length > 0) {
    const last = htmlParts[htmlParts.length - 1];
    if (last.startsWith('<h1') || last.startsWith('<h2') || last.startsWith('<h3') || last.startsWith('<h4')) {
      htmlParts.push('<p></p>');
    }
  }

  return htmlParts.join('\n');
}

/**
 * Formateo inline exhaustivo:
 * Negrita (*bold*), Cursiva (_italic_), Subrayado ([.underline]#text# / <u>),
 * Tachado ([.line-through]#text# / <s>), Resaltado (#highlight# / <mark>), Código (`code`)
 */
function inlineFormat(text) {
  if (!text) return '';
  return text
    // Underline: [.underline]#text#
    .replace(/\[\.underline\]#([^#\n]+)#/g, '<u>$1</u>')
    // Strikethrough: [.line-through]#text# o ~text~
    .replace(/\[\.line-through\]#([^#\n]+)#/g, '<s>$1</s>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    // Highlight: #text# o [.highlight]#text#
    .replace(/\[\.highlight\]#([^#\n]+)#/g, '<mark>$1</mark>')
    .replace(/(^|[^\w])#([^#\n]+)#(?=[^\w]|$)/g, '$1<mark>$2</mark>')
    // Bold: *text*
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    // Italic: _text_
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    // Inline code: `text` o +text+
    .replace(/`([^`\n]+)`/g, '<code>$1</code>');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convierte el HTML generado por TipTap (Word-like AST) de vuelta a sintaxis limpia AsciiDoc (.adoc)
 */
export function htmlToAsciidoc(html) {
  if (!html) return '';

  let doc;
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  } else if (typeof globalThis.DOMParser !== 'undefined') {
    const parser = new globalThis.DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  }
  if (!doc || !doc.body) return '';

  const result = [];
  const ELEMENT_NODE = typeof Node !== 'undefined' ? Node.ELEMENT_NODE : 1;
  const TEXT_NODE = typeof Node !== 'undefined' ? Node.TEXT_NODE : 3;

  function processNode(node) {
    if (node.nodeType === TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== ELEMENT_NODE) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();

    // 1. Bloques de Admonition / Callouts
    if (node.classList.contains('admonition-block') || node.hasAttribute('data-admonition')) {
      const type = (node.getAttribute('data-admonition') || 'note').toUpperCase();
      const body = node.querySelector('.admonition-body')?.textContent || node.textContent;
      return `\n[${type}]\n====\n${body.trim()}\n====\n\n`;
    }

    // 1.2. Imágenes con maquetación editorial (Flotante Izquierda / Derecha / Figura Central)
    if (node.classList.contains('float-left-thumb')) {
      const img = node.querySelector('img');
      const src = img ? img.getAttribute('src') : '';
      const caption = node.querySelector('.figure-caption')?.textContent || img?.getAttribute('title') || img?.getAttribute('alt') || '';
      const widthStyle = node.style.width ? parseInt(node.style.width) : '';
      return `\nimage::${src}[${caption || 'Ilustración'}${widthStyle ? `, width=${widthStyle}` : ''}, role="left thumb"${caption ? `, title="${caption}"` : ''}]\n\n`;
    }

    if (node.classList.contains('float-right-thumb')) {
      const img = node.querySelector('img');
      const src = img ? img.getAttribute('src') : '';
      const caption = node.querySelector('.figure-caption')?.textContent || img?.getAttribute('title') || img?.getAttribute('alt') || '';
      const widthStyle = node.style.width ? parseInt(node.style.width) : '';
      return `\nimage::${src}[${caption || 'Ilustración'}${widthStyle ? `, width=${widthStyle}` : ''}, role="right thumb"${caption ? `, title="${caption}"` : ''}]\n\n`;
    }

    if (node.classList.contains('figure-center')) {
      const img = node.querySelector('img');
      const src = img ? img.getAttribute('src') : '';
      const caption = node.querySelector('.figure-caption')?.textContent || img?.getAttribute('title') || img?.getAttribute('alt') || '';
      const widthStyle = node.style.maxWidth ? parseInt(node.style.maxWidth) : '';
      return `\n.${caption || 'Ilustración'}\nimage::${src}[${caption || 'Ilustración'}${widthStyle ? `, width=${widthStyle}` : ''}, align=center, pdfwidth=75%]\n\n`;
    }

    if (tagName === 'img') {
      const src = node.getAttribute('src') || '';
      const caption = node.getAttribute('title') || node.getAttribute('alt') || '';
      if (node.classList.contains('banner-full')) {
        return `\nimage::${src}[${caption}, width=100%, role="banner-full"]\n\n`;
      }
      return `\nimage::${src}[${caption}, align=center]\n\n`;
    }

    // 1.3. Reproductor de Audio
    if (node.classList.contains('audio-block') || node.getAttribute('data-type') === 'audio') {
      const audio = node.querySelector('audio');
      const src = audio ? audio.getAttribute('src') : '';
      const title = node.getAttribute('data-title') || 'Grabación de audio';
      return `\naudio::${src}[title="${title}", opts="controls"]\n\n`;
    }

    if (tagName === 'audio') {
      const src = node.getAttribute('src') || '';
      return `\naudio::${src}[opts="controls"]\n\n`;
    }

    // 2. Tablas
    if (tagName === 'table') {
      let tableOut = '\n|===\n';
      const rows = node.querySelectorAll('tr');
      rows.forEach(tr => {
        const cells = tr.querySelectorAll('th, td');
        if (cells.length > 0) {
          const cellTexts = [];
          cells.forEach(c => {
            cellTexts.push(processInline(c).trim());
          });
          tableOut += `| ${cellTexts.join(' | ')}\n`;
        }
      });
      tableOut += '|===\n\n';
      return tableOut;
    }

    // 3. Bloques de código (<pre><code>)
    if (tagName === 'pre') {
      const codeNode = node.querySelector('code');
      const codeText = codeNode ? codeNode.textContent : node.textContent;
      const langMatch = codeNode?.className?.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : '';
      return `\n[source${lang ? `,${lang}` : ''}]\n----\n${codeText.trim()}\n----\n\n`;
    }

    // 4. Encabezados
    switch (tagName) {
      case 'h1':
        return `= ${processInline(node).trim()}\n\n`;
      case 'h2':
        return `== ${processInline(node).trim()}\n\n`;
      case 'h3':
        return `=== ${processInline(node).trim()}\n\n`;
      case 'h4':
        return `==== ${processInline(node).trim()}\n\n`;
      case 'p':
        const pText = processInline(node).trim();
        return pText ? `${pText}\n\n` : '\n';
      case 'ul':
        // Comprobar si es TaskList
        if (node.getAttribute('data-type') === 'taskList' || node.classList.contains('task-list')) {
          let tasks = '';
          node.querySelectorAll('li').forEach(li => {
            const isChecked = li.getAttribute('data-checked') === 'true' || li.querySelector('input[type="checkbox"]')?.checked;
            tasks += `* [${isChecked ? 'x' : ' '}] ${processInline(li).trim()}\n`;
          });
          return tasks + '\n';
        }
        let ulText = '';
        node.querySelectorAll(':scope > li').forEach(li => {
          ulText += `* ${processInline(li).trim()}\n`;
        });
        return ulText + '\n';
      case 'ol':
        let olText = '';
        node.querySelectorAll(':scope > li').forEach((li, idx) => {
          olText += `${idx + 1}. ${processInline(li).trim()}\n`;
        });
        return olText + '\n';
      case 'blockquote':
        return `\n[quote]\n____\n${processInline(node).trim()}\n____\n\n`;
      case 'hr':
        return `'''\n\n`;
      default:
        let inner = '';
        node.childNodes.forEach(child => {
          inner += processNode(child);
        });
        return inner;
    }
  }

  function processInline(element) {
    let out = '';
    element.childNodes.forEach(child => {
      if (child.nodeType === TEXT_NODE) {
        out += child.textContent;
      } else if (child.nodeType === ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        
        // Ignorar checkbox elements en task lists
        if (tag === 'label' && child.querySelector('input[type="checkbox"]')) {
          return;
        }
        if (tag === 'input' && child.getAttribute('type') === 'checkbox') {
          return;
        }

        if (tag === 'strong' || tag === 'b') {
          out += `*${processInline(child)}*`;
        } else if (tag === 'em' || tag === 'i') {
          out += `_${processInline(child)}_`;
        } else if (tag === 'u') {
          out += `[.underline]#${processInline(child)}#`;
        } else if (tag === 's' || tag === 'del' || tag === 'strike') {
          out += `[.line-through]#${processInline(child)}#`;
        } else if (tag === 'mark') {
          out += `#${processInline(child)}#`;
        } else if (tag === 'code') {
          out += `\`${child.textContent}\``;
        } else {
          out += processInline(child);
        }
      }
    });
    return out;
  }

  doc.body.childNodes.forEach(child => {
    result.push(processNode(child));
  });

  return result.join('').trim() + '\n';
}
