import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { asciidocToHtml, htmlToAsciidoc } from './asciidoc.js';

describe('AsciiDoc <-> HTML (TipTap Word-like AST) Bidirectional Test Suite', () => {
  before(() => {
    // Configurar entorno DOM para Node.js
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    globalThis.DOMParser = dom.window.DOMParser;
    globalThis.Node = dom.window.Node;
    globalThis.document = dom.window.document;
  });

  test('1. Encabezados (H1, H2, H3, H4)', () => {
    const adoc = `= Título Principal\n\n== Sección Secundaria\n\n=== Subsección\n\n==== Detalle`;
    const html = asciidocToHtml(adoc);
    
    assert.match(html, /<h1>Título Principal<\/h1>/);
    assert.match(html, /<h2>Sección Secundaria<\/h2>/);
    assert.match(html, /<h3>Subsección<\/h3>/);
    assert.match(html, /<h4>Detalle<\/h4>/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /= Título Principal/);
    assert.match(backToAdoc, /== Sección Secundaria/);
    assert.match(backToAdoc, /=== Subsección/);
    assert.match(backToAdoc, /==== Detalle/);
  });

  test('2. Formato Inline (Negrita, Cursiva, Subrayado, Tachado, Resaltado, Código)', () => {
    const adoc = `Texto con *negrita*, _cursiva_, [.underline]#subrayado#, [.line-through]#tachado#, [.highlight]#fluorescente# y \`código inline\`.`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /<strong>negrita<\/strong>/);
    assert.match(html, /<em>cursiva<\/em>/);
    assert.match(html, /<u>subrayado<\/u>/);
    assert.match(html, /<s>tachado<\/s>/);
    assert.match(html, /<mark>fluorescente<\/mark>/);
    assert.match(html, /<code>código inline<\/code>/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /\*negrita\*/);
    assert.match(backToAdoc, /_cursiva_/);
    assert.match(backToAdoc, /\[\.underline\]#subrayado#/);
    assert.match(backToAdoc, /\[\.line-through\]#tachado#/);
    assert.match(backToAdoc, /#fluorescente#/);
    assert.match(backToAdoc, /`código inline`/);
  });

  test('3. Bloques Pedagógicos y Admonitions ([TIP], [WARNING], [NOTE], [IMPORTANT], [INSTRUCTOR])', () => {
    const adoc = `[TIP]\n.Consejo Didáctico\n====\nExplicar el concepto con un ejemplo visual.\n====\n\n[WARNING]\n====\nNo tocar los cables bajo tensión.\n====\n\n[INSTRUCTOR]\n====\nTiempo estimado: 15 minutos de práctica.\n====`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /data-admonition="tip"/);
    assert.match(html, /Consejo Didáctico/);
    assert.match(html, /data-admonition="warning"/);
    assert.match(html, /data-admonition="instructor"/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /\[TIP\]/);
    assert.match(backToAdoc, /Explicar el concepto con un ejemplo visual\./);
    assert.match(backToAdoc, /\[WARNING\]/);
    assert.match(backToAdoc, /No tocar los cables bajo tensión\./);
    assert.match(backToAdoc, /\[INSTRUCTOR\]/);
    assert.match(backToAdoc, /Tiempo estimado: 15 minutos de práctica\./);
  });

  test('4. Citas en bloque ([quote])', () => {
    const adoc = `[quote]\n____\nLa simplicidad es el requisito previo para la fiabilidad.\n____`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /<blockquote><p>La simplicidad es el requisito previo para la fiabilidad.<\/p><\/blockquote>/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /\[quote\]/);
    assert.match(backToAdoc, /La simplicidad es el requisito previo para la fiabilidad\./);
  });

  test('5. Listas con Viñetas y Numeradas', () => {
    const adoc = `* Elemento A\n* Elemento B\n\n1. Primer paso\n2. Segundo paso`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /<ul>\s*<li>Elemento A<\/li>\s*<li>Elemento B<\/li>\s*<\/ul>/);
    assert.match(html, /<ol>\s*<li>Primer paso<\/li>\s*<li>Segundo paso<\/li>\s*<\/ol>/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /\* Elemento A/);
    assert.match(backToAdoc, /\* Elemento B/);
    assert.match(backToAdoc, /1\. Primer paso/);
    assert.match(backToAdoc, /2\. Segundo paso/);
  });

  test('6. Listas de Tareas / Checklists (* [ ] / * [x])', () => {
    const adoc = `* [ ] Tarea pendiente de taller\n* [x] Tarea ya realizada`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /data-type="taskList"/);
    assert.match(html, /data-checked="false"/);
    assert.match(html, /data-checked="true"/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /\* \[ \] Tarea pendiente de taller/);
    assert.match(backToAdoc, /\* \[x\] Tarea ya realizada/);
  });

  test('7. Bloques de Código Fuente con Lenguaje ([source,go])', () => {
    const adoc = `[source,go]\n----\npackage main\n\nfunc main() {\n\tprintln("Hola")\n}\n----`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /<pre><code class="language-go">/);
    assert.match(html, /package main/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /\[source,go\]/);
    assert.match(backToAdoc, /func main\(\)/);
  });

  test('8. Tablas AsciiDoc (|===)', () => {
    const adoc = `|===\n| Nombre | Rol | Experiencia\n| Ana | Ingeniera | Senior\n| Carlos | Diseñador | Junior\n|===`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /<table/);
    assert.match(html, /<th[^>]*>Nombre<\/th>/);
    assert.match(html, /<td[^>]*>Ana<\/td>/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /\|===\s*\| Nombre \| Rol \| Experiencia\s*\| Ana \| Ingeniera \| Senior\s*\| Carlos \| Diseñador \| Junior\s*\|===/);
  });

  test('9. Regla Horizontal (\'\'\')', () => {
    const adoc = `Primer bloque\n\n'''\n\nSegundo bloque`;
    const html = asciidocToHtml(adoc);

    assert.match(html, /<hr \/>/);

    const backToAdoc = htmlToAsciidoc(html);
    assert.match(backToAdoc, /'''/);
  });
});
