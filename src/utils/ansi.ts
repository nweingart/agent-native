export interface AnsiStyle {
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  fg?: string;
  bg?: string;
}

export interface AnsiSpan {
  text: string;
  style: AnsiStyle;
}

const FG_COLORS: Record<number, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'bright-black',
  91: 'bright-red',
  92: 'bright-green',
  93: 'bright-yellow',
  94: 'bright-blue',
  95: 'bright-magenta',
  96: 'bright-cyan',
  97: 'bright-white',
};

const BG_COLORS: Record<number, string> = {
  40: 'black',
  41: 'red',
  42: 'green',
  43: 'yellow',
  44: 'blue',
  45: 'magenta',
  46: 'cyan',
  47: 'white',
  100: 'bright-black',
  101: 'bright-red',
  102: 'bright-green',
  103: 'bright-yellow',
  104: 'bright-blue',
  105: 'bright-magenta',
  106: 'bright-cyan',
  107: 'bright-white',
};

// Matches ESC[ followed by SGR parameters and 'm'
const ANSI_RE = /\x1b\[([0-9;]*)m/g;

/**
 * Parse a string containing ANSI escape codes into styled spans.
 */
export function parseAnsi(text: string): AnsiSpan[] {
  const spans: AnsiSpan[] = [];
  let currentStyle: AnsiStyle = {};
  let lastIndex = 0;

  ANSI_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ANSI_RE.exec(text)) !== null) {
    // Capture text before this escape
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index), style: { ...currentStyle } });
    }

    // Parse SGR codes
    const codes = match[1] ? match[1].split(';').map(Number) : [0];
    for (const code of codes) {
      if (code === 0) {
        currentStyle = {};
      } else if (code === 1) {
        currentStyle.bold = true;
      } else if (code === 2) {
        currentStyle.dim = true;
      } else if (code === 3) {
        currentStyle.italic = true;
      } else if (code === 4) {
        currentStyle.underline = true;
      } else if (FG_COLORS[code]) {
        currentStyle.fg = FG_COLORS[code];
      } else if (BG_COLORS[code]) {
        currentStyle.bg = BG_COLORS[code];
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last escape
  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex), style: { ...currentStyle } });
  }

  // If no escapes were found, return the full text as a single span
  if (spans.length === 0 && text.length > 0) {
    spans.push({ text, style: {} });
  }

  return spans;
}
