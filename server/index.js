import { createServer } from 'node:http';
import { parseExamDocx } from './docxParser.js';

function parseContentDisposition(value) {
  const result = {};
  for (const piece of value.split(';')) {
    const [key, rawValue] = piece.trim().split('=');
    if (!rawValue) continue;
    result[key] = rawValue.replace(/^"|"$/g, '');
  }
  return result;
}

function parseMultipartFormData(bodyBuffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const endingDelimiter = Buffer.from(`--${boundary}--`);
  const parts = [];

  let start = bodyBuffer.indexOf(delimiter);
  while (start !== -1) {
    start += delimiter.length;
    if (bodyBuffer.slice(start, start + 2).equals(Buffer.from('--'))) break;

    if (bodyBuffer.slice(start, start + 2).equals(Buffer.from('\r\n'))) {
      start += 2;
    }

    let next = bodyBuffer.indexOf(delimiter, start);
    const end = next !== -1 ? next - 2 : bodyBuffer.indexOf(endingDelimiter, start) - 2;
    if (end < start) break;

    const partBuffer = bodyBuffer.slice(start, end);
    const headerEnd = partBuffer.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) break;

    const headerText = partBuffer.slice(0, headerEnd).toString('utf8');
    const content = partBuffer.slice(headerEnd + 4);

    const headers = {};
    for (const line of headerText.split('\r\n')) {
      const idx = line.indexOf(':');
      if (idx > -1) {
        headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
      }
    }

    parts.push({ headers, content });

    start = next;
  }

  return parts;
}

async function handleParseDocx(req, res) {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Content-Type phải là multipart/form-data.' }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const parts = parseMultipartFormData(body, boundaryMatch[1]);

  const filePart = parts.find((part) => {
    const disposition = part.headers['content-disposition'];
    if (!disposition) return false;
    const parsed = parseContentDisposition(disposition);
    return parsed.name === 'file' && parsed.filename;
  });

  if (!filePart) {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Thiếu file upload (field name: file).' }));
    return;
  }

  const disposition = parseContentDisposition(filePart.headers['content-disposition']);
  if (!disposition.filename.toLowerCase().endsWith('.docx')) {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Chỉ chấp nhận file .docx.' }));
    return;
  }

  try {
    const parsed = await parseExamDocx(filePart.content);
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(parsed));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        error: 'Không thể phân tích file .docx.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/exams/parse-docx') {
    await handleParseDocx(req, res);
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

const port = Number(process.env.PORT || 3001);
server.listen(port, () => {
  console.log(`Docx parser API running at http://localhost:${port}`);
});
