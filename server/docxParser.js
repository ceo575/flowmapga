import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

const QUESTION_START_REGEX = /^\s*Câu\s+\d+\s*[\.:]?\s*/i;
const SOLUTION_START_REGEX = /^\s*Lời giải\s*[\.:]?\s*/i;
const CHOICE_TYPE_1_REGEX = /^\s*([A-D])\.\s*/;
const CHOICE_TYPE_2_REGEX = /^\s*([a-d])\)\s*/;

const decodeXml = (value) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number.parseInt(num, 10)));

function parseRun(runXml) {
  const bold = /<w:b(?:\s|\/|>)/.test(runXml) || /<w:bCs(?:\s|\/|>)/.test(runXml);
  const underline = /<w:u(?:\s|\/|>)/.test(runXml);

  const parts = [];
  const textRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  let textMatch;
  while ((textMatch = textRegex.exec(runXml))) {
    parts.push({ type: 'text', text: decodeXml(textMatch[1]), bold, underline });
  }

  if (/<w:tab(?:\s|\/|>)/.test(runXml)) {
    parts.push({ type: 'text', text: '\t', bold, underline });
  }

  if (/<w:br(?:\s|\/|>)/.test(runXml)) {
    parts.push({ type: 'text', text: '\n', bold, underline });
  }

  return parts;
}

function parseParagraph(paragraphXml) {
  const parts = [];
  const tokenRegex = /<w:hyperlink\b[\s\S]*?<\/w:hyperlink>|<w:r\b[\s\S]*?<\/w:r>|<m:oMathPara\b[\s\S]*?<\/m:oMathPara>|<m:oMath\b[\s\S]*?<\/m:oMath>/g;

  let token;
  while ((token = tokenRegex.exec(paragraphXml))) {
    const xml = token[0];

    if (xml.startsWith('<w:r')) {
      parts.push(...parseRun(xml));
      continue;
    }

    if (xml.startsWith('<w:hyperlink')) {
      const runRegex = /<w:r\b[\s\S]*?<\/w:r>/g;
      let run;
      while ((run = runRegex.exec(xml))) {
        parts.push(...parseRun(run[0]));
      }
      continue;
    }

    parts.push({ type: 'math', text: xml, raw: xml, bold: false, underline: false });
  }

  return {
    text: parts.map((p) => p.text).join(''),
    parts,
  };
}

function extractParagraphs(documentXml) {
  const paragraphs = [];
  const paragraphRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
  let match;

  while ((match = paragraphRegex.exec(documentXml))) {
    paragraphs.push(parseParagraph(match[0]));
  }

  return paragraphs;
}

function detectChoice(paragraph) {
  const trimmed = paragraph.text.trimStart();
  const type1 = trimmed.match(CHOICE_TYPE_1_REGEX);
  const type2 = trimmed.match(CHOICE_TYPE_2_REGEX);
  if (!type1 && !type2) return null;

  const match = type1 ?? type2;
  const prefix = match[0];
  const label = match[1];

  const prefixParts = [];
  let remaining = prefix.length;
  for (const part of paragraph.parts) {
    if (remaining <= 0) break;
    if (!part.text) continue;
    const take = Math.min(remaining, part.text.length);
    prefixParts.push({ ...part, text: part.text.slice(0, take) });
    remaining -= take;
  }

  const hasBoldPrefix = prefixParts.some((part) => part.bold && part.text.trim());
  if (!hasBoldPrefix) return null;

  return {
    label,
    content: trimmed.slice(prefix.length).trim(),
    raw: trimmed,
    isCorrect: paragraph.parts.some((part) => part.underline && part.text.trim()),
    optionType: type1 ? 'single_choice' : 'true_false',
  };
}

function normalizeQuestion(question, index) {
  const correctOption = question.options.find((option) => option.isCorrect);

  return {
    order: index + 1,
    question: question.questionParts.map((p) => p.text).join('\n').trim(),
    questionParts: question.questionParts,
    options: question.options.map((option) => ({
      key: option.label,
      content: option.content,
      raw: option.raw,
      isCorrect: option.isCorrect,
    })),
    correctAnswer: correctOption?.label ?? null,
    questionType: question.options.some((o) => o.optionType === 'true_false') ? 'true_false' : 'single_choice',
    explanation: question.explanationParts.map((p) => p.text).join('\n').trim(),
    explanationParts: question.explanationParts,
  };
}

async function extractDocumentXml(docxBuffer) {
  const tempDir = await mkdtemp(join(tmpdir(), 'docx-parser-'));
  const filePath = join(tempDir, 'upload.docx');

  try {
    await writeFile(filePath, docxBuffer);
    const { stdout } = await execFileAsync('unzip', ['-p', filePath, 'word/document.xml'], { maxBuffer: 20 * 1024 * 1024 });

    if (!stdout) {
      throw new Error('Không đọc được word/document.xml từ file .docx.');
    }

    return stdout;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function parseExamDocx(docxBuffer) {
  const documentXml = await extractDocumentXml(docxBuffer);
  const paragraphs = extractParagraphs(documentXml);

  const questions = [];
  let currentQuestion = null;
  let inExplanation = false;

  for (const paragraph of paragraphs) {
    const text = paragraph.text.trim();
    if (!text) continue;

    if (QUESTION_START_REGEX.test(text)) {
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        questionParts: [{ ...paragraph, text: paragraph.text.replace(QUESTION_START_REGEX, '').trim() }],
        options: [],
        explanationParts: [],
      };
      inExplanation = false;
      continue;
    }

    if (!currentQuestion) continue;

    if (SOLUTION_START_REGEX.test(text)) {
      inExplanation = true;
      currentQuestion.explanationParts.push({ ...paragraph, text: paragraph.text.replace(SOLUTION_START_REGEX, '').trim() });
      continue;
    }

    if (inExplanation) {
      currentQuestion.explanationParts.push(paragraph);
      continue;
    }

    const option = detectChoice(paragraph);
    if (option) {
      currentQuestion.options.push(option);
      continue;
    }

    if (currentQuestion.options.length > 0) {
      const last = currentQuestion.options[currentQuestion.options.length - 1];
      last.content = `${last.content}\n${text}`.trim();
      last.raw = `${last.raw}\n${text}`.trim();
      if (paragraph.parts.some((part) => part.underline && part.text.trim())) {
        last.isCorrect = true;
      }
      continue;
    }

    currentQuestion.questionParts.push(paragraph);
  }

  if (currentQuestion) questions.push(currentQuestion);

  return {
    totalQuestions: questions.length,
    questions: questions.map(normalizeQuestion),
  };
}
