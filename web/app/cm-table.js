function isTableRow(cm, lineNum) {
  return cm.getLine(lineNum).trim().startsWith('|');
}

function findTableBoundaries(cm, lineNum) {
  let startLine = lineNum, endLine = lineNum;
  while (startLine > 0 && isTableRow(cm, startLine - 1)) startLine--;
  while (endLine < cm.lineCount() - 1 && isTableRow(cm, endLine + 1)) endLine++;
  return { startLine, endLine };
}

function getColumnAlignments(cm, lineNum) {
  return cm.getLine(lineNum).split('|').slice(1, -1).map(col => {
    const trimmedCol = col.trim();
    if (trimmedCol.startsWith(':') && trimmedCol.endsWith(':')) return 'center'
    if (trimmedCol.endsWith(':')) return 'right';
    return 'left';
  });
}

function getColumnPositions(cm, lineNum) {
  const lineText = cm.getLine(lineNum);
  let positions = [];
  let pos = lineText.indexOf('|');
  while (pos !== -1) { positions.push(pos); pos = lineText.indexOf('|', pos + 1); }
  return positions;
}

function getColumnMaxLengths(cm, startLine, endLine, conceal) {
  let maxLengths = [];
  for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
    if (lineNum == startLine + 1) continue;
    const columns = cm.getLine(lineNum).trim().split('|').map(col => col.trim());
    columns.slice(1, -1).forEach((col, index) => {
      const colLength = conceal ? getConcealLength(col) : col.length;
      if (!maxLengths[index] || colLength > maxLengths[index]) {
        maxLengths[index] = colLength;
      }
    });
  }
  return maxLengths;
}

function formatRowSep(cm, lineNum, colMaxLengths, colAlignments) {
  const line = cm.getLine(lineNum);
  let columns = line.split('|');
  columns = columns.map((col, index) => {
    if (index === 0 || index === columns.length - 1) return col;
    switch (colAlignments[index - 1]) {
      case 'center': return ` :${"-".repeat(colMaxLengths[index - 1] - 2)}: `;
      case 'right': return ` ${"-".repeat(colMaxLengths[index - 1] - 1)}: `;
      default: return ` ${"-".repeat(colMaxLengths[index - 1])} `;
    }
  });
  cm.replaceRange(columns.join('|'), {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
}

function formatRow(cm, lineNum, colMaxLengths, colAlignments, conceal) {
  const line = cm.getLine(lineNum);
  let columns = line.split('|');
  columns = columns.map((col, index) => {
    if (index === 0 || index === columns.length - 1) return col;
    const colTrimmed = col.trim();
    const colLength = conceal ? getConcealLength(colTrimmed) : colTrimmed.length;
    const paddingLength = Math.max(0, colMaxLengths[index - 1] - colLength);
    const halfPadding = Math.floor(paddingLength / 2);
    switch (colAlignments[index - 1]) {
      case 'center': return ` ${' '.repeat(halfPadding)}${colTrimmed}${' '.repeat(paddingLength - halfPadding)} `;
      case 'right': return ` ${' '.repeat(paddingLength)}${colTrimmed} `;
      default: return ` ${colTrimmed}${' '.repeat(paddingLength)} `;
    }
  });
  cm.replaceRange(columns.join('|'), {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
}

function formatRows(cm, conceal) {
  const cursorPos = cm.getCursor();
  if (!isTableRow(cm, cursorPos.line)) return;

  const { startLine, endLine } = findTableBoundaries(cm, cursorPos.line);
  const colAlignments = getColumnAlignments(cm, startLine + 1);
  const colMaxLengths = getColumnMaxLengths(cm, startLine, endLine, conceal);

  for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
    if (lineNum == startLine + 1) {
      formatRowSep(cm, lineNum, colMaxLengths, colAlignments);
    } else {
      formatRow(cm, lineNum, colMaxLengths, colAlignments, conceal);
    }
  }
}

function addOrUpdateRowSep(cm) {
  const cursorPos = cm.getCursor();
  const { startLine, endLine } = findTableBoundaries(cm, cursorPos.line);
  if (startLine !== cursorPos.line) return;

  const columnsCount = getColumnPositions(cm, startLine).length;
  if (startLine == endLine) {
    cm.replaceRange("\n" + `${"|".repeat(columnsCount)}`, {line: startLine, ch: cm.getLine(startLine).length});
    return;
  }

  const sepLineNum = startLine + 1;
  const sepLineText = cm.getLine(sepLineNum);
  const columnsCountSep = getColumnPositions(cm, sepLineNum).length;
  if (columnsCount > columnsCountSep) {
    cm.replaceRange(`${"|".repeat(columnsCount - columnsCountSep)}`, {line: sepLineNum, ch: sepLineText.length});
  } else {
    const newSepLineText = sepLineText.split('|').slice(0, columnsCount).join('|') + '|';
    cm.replaceRange(newSepLineText, {line: sepLineNum, ch: 0}, {line: sepLineNum, ch: sepLineText.length});
  }
}

export function isCursorInTable(cm) {
  const cursorPos = cm.getCursor();
  return isTableRow(cm, cursorPos.line);
}

export function formatTableAndAdvance(cm, conceal) {
  const cursorPos = cm.getCursor();
  if (!isTableRow(cm, cursorPos.line)) return;

  const currentPositions = getColumnPositions(cm, cursorPos.line);
  const currentColumn = currentPositions.filter(pos => pos < cursorPos.ch).length;

  if (currentColumn == currentPositions.length) {
    cm.replaceRange('|', {line: cursorPos.line, ch: cm.getLine(cursorPos.line).length});
    addOrUpdateRowSep(cm);
    formatRows(cm, conceal);
    cm.setCursor(cursorPos.line, cm.getLine(cursorPos.line).length);
  } else {
    formatRows(cm, conceal);
    const newPositions = getColumnPositions(cm, cursorPos.line);
    cm.setCursor(cursorPos.line, newPositions[currentColumn] + 2);
  }
}

export function navigateTable(cm, direction) {
  const cursorPos = cm.getCursor();
  if (!isTableRow(cm, cursorPos.line)) return CodeMirror.Pass;

  const currentPositions = getColumnPositions(cm, cursorPos.line);
  const currentColumn = currentPositions.filter(pos => pos < cursorPos.ch).length;

  const moveCursorVertically = (targetLine) => {
    const targetPositions = getColumnPositions(cm, targetLine);
    const targetCh = currentColumn <= targetPositions.length
      ? targetPositions[currentColumn - 1] + 2
      : cm.getLine(targetLine).length;
    cm.setCursor(targetLine, targetCh);
  };

  switch (direction) {
    case 'left':
      if (currentColumn > 1) {
        cm.setCursor(cursorPos.line, currentPositions[currentColumn - 2] + 2);
      }
      break;
    case 'right':
      if (currentColumn < currentPositions.length) {
        cm.setCursor(cursorPos.line, currentPositions[currentColumn] + 2);
      }
      break;
    case 'up':
      const {startLine} = findTableBoundaries(cm, cursorPos.line);
      if (cursorPos.line > startLine) moveCursorVertically(cursorPos.line - 1);
      break;
    case 'down':
      const {endLine} = findTableBoundaries(cm, cursorPos.line);
      if (cursorPos.line < endLine) moveCursorVertically(cursorPos.line + 1);
      break;
  }
}

function getConcealLength(s) {
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
  s = s.replace(/(\*\*\*|___)(.*?)\1/g, '$2'); // Bold + Italic
  s = s.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Bold
  s = s.replace(/(\*|_)(.*?)\1/g, '$2'); // Italic
  s = s.replace(/(~~)(.*?)\1/g, '$2'); // Strikethrough
  s = s.replace(/(`)(.*?)\1/g, '$2'); // Inline code
  return s.length;
}
