function isTableRow(cm, lineNum) {
  return cm.getLine(lineNum).trim().startsWith('|');
}

function findTableBoundaries(cm, lineNum) {
  let startLine = lineNum, endLine = lineNum;
  while (startLine > 0 && isTableRow(cm, startLine - 1)) startLine--;
  while (endLine < cm.lineCount() - 1 && isTableRow(cm, endLine + 1)) endLine++;
  return { startLine, endLine };
}

function getColumnMaxLengths(cm, startLine, endLine) {
  let maxLengths = [];
  for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
    if (lineNum == startLine + 1) continue;
    const columns = cm.getLine(lineNum).trim().split('|').map(col => col.trim());
    columns.slice(1, -1).forEach((col, index) => {
      const colLength = col.length;
      if (!maxLengths[index] || colLength > maxLengths[index]) {
        maxLengths[index] = colLength;
      }
    });
  }
  return maxLengths;
}

function formatRowSep(cm, lineNum, colMaxLengths) {
  const line = cm.getLine(lineNum);
  let columns = line.split('|');
  columns = columns.map((col, index) => {
    if (index === 0 || index === columns.length - 1) return col;
    return ` ${"-".repeat(colMaxLengths[index - 1])} `;
  });
  cm.replaceRange(columns.join('|'), {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
}

function formatRow(cm, lineNum, colMaxLengths) {
  const line = cm.getLine(lineNum);
  let columns = line.split('|');
  columns = columns.map((col, index) => {
    if (index === 0 || index === columns.length - 1) return col;
    const colTrimmed = col.trim();
    const paddingLength = Math.max(0, colMaxLengths[index - 1] - colTrimmed.length);
    return ` ${colTrimmed}${' '.repeat(paddingLength)} `;
  });
  cm.replaceRange(columns.join('|'), {line: lineNum, ch: 0}, {line: lineNum, ch: line.length});
}

export function formatTable(cm) {
  const cursorPos = cm.getCursor();
  if (!isTableRow(cm, cursorPos.line)) return;

  const { startLine, endLine } = findTableBoundaries(cm, cursorPos.line);
  const colMaxLengths = getColumnMaxLengths(cm, startLine, endLine);

  for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
    if (lineNum == startLine + 1) {
      formatRowSep(cm, lineNum, colMaxLengths);
    } else {
      formatRow(cm, lineNum, colMaxLengths);
    }
  }
}

