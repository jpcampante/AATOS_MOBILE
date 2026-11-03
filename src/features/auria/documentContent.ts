/**
 * Reading the structured documents the Auria writes: a spreadsheet
 * (`sheet-json`) and a presentation (`deck-json`). Both are stored as one JSON
 * object; this turns them into what the reader draws, and gives up on anything
 * that does not fit, so the reader can say the document cannot be shown
 * instead of drawing something made up.
 */

export type SheetTab = {
  name: string;
  columns: string[];
  rows: string[][];
  /** A tab the editor hides; other formulas may still use it. */
  hidden: boolean;
};

export type DeckSlide = {
  title: string;
  eyebrow: string;
  lead: string;
  points: { title: string; body: string }[];
  outcome: string;
};

export type DeckDocument = { title: string; slides: DeckSlide[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' ? value : '';
};

const row = (value: unknown): string[] => (Array.isArray(value) ? value.map(cell) : []);

function parseJson(content: string | undefined): Record<string, unknown> | null {
  if (!content?.trim()) return null;
  try {
    const data: unknown = JSON.parse(content);
    return isRecord(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * The tabs of a spreadsheet, the way the server reads them for the model: the
 * editor's own grid (`workbookV2`) when it was the last to save, otherwise the
 * `tableSheets` the Auria wrote. The first row is the header.
 */
export function parseSheetDocument(content: string | undefined): SheetTab[] | null {
  const data = parseJson(content);
  if (!data) return null;
  const workbook = data.workbookV2;
  const savedByEditor = data.formulaRows === 'data' || workbook !== undefined;

  if (savedByEditor && isRecord(workbook) && Array.isArray(workbook.sheets)) {
    return workbook.sheets.filter(isRecord).map((sheet) => {
      const cells = Array.isArray(sheet.cells) ? sheet.cells.map(row) : [];
      while (cells.length > 0 && cells[cells.length - 1].every((c) => !c.trim())) cells.pop();
      return {
        name: cell(sheet.title) || 'Sheet',
        columns: cells[0] ?? [],
        rows: cells.slice(1),
        hidden: sheet.hidden === true,
      };
    });
  }

  if (!Array.isArray(data.tableSheets)) return null;
  return data.tableSheets.filter(isRecord).map((sheet, index) => {
    const sheetData = isRecord(sheet.data) ? sheet.data : {};
    return {
      name: cell(sheet.title) || `Sheet ${index + 1}`,
      columns: row(sheetData.columns),
      rows: Array.isArray(sheetData.rows) ? sheetData.rows.map(row) : [],
      hidden: sheet.hidden === true,
    };
  });
}

/** The slides of a presentation: the text of each, in the deck's order. */
export function parseDeckDocument(content: string | undefined): DeckDocument | null {
  const data = parseJson(content);
  const outline = data && isRecord(data.outline) ? data.outline : null;
  if (!outline || !Array.isArray(outline.slides)) return null;
  return {
    title: cell(outline.title),
    slides: outline.slides.filter(isRecord).map((slide) => ({
      title: cell(slide.title),
      eyebrow: cell(slide.eyebrow),
      lead: cell(slide.lead),
      outcome: cell(slide.outcome),
      points: (Array.isArray(slide.points) ? slide.points : []).filter(isRecord).map((point) => ({
        title: cell(point.title),
        body: cell(point.body) || cell(point.text) || cell(point.description),
      })),
    })),
  };
}
