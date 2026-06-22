const SUPPORTED_TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  'application/xml',
  'text/xml',
]);

const extractFromPdf = async buffer => {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  } catch (error) {
    throw new Error(
      'PDF parsing requires the "pdf-parse" package. Install it in learnSphere/backend to enable PDF uploads.'
    );
  }
};

export const extractDocumentText = async file => {
  const mimeType = file.mimetype || 'text/plain';

  if (mimeType === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
    return extractFromPdf(file.buffer);
  }

  if (SUPPORTED_TEXT_TYPES.has(mimeType) || /\.(txt|md|json|csv|xml)$/i.test(file.originalname)) {
    return file.buffer.toString('utf8');
  }

  throw new Error(
    `Unsupported file type "${mimeType}". Upload PDF, TXT, MD, JSON, CSV, or XML documents.`
  );
};
