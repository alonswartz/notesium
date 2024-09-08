export function initCodeMirrorVimEx() {
  CodeMirror.Vim.defineEx('quit', 'q', function(cm, cmd) {
    const confirmIfModified = cmd.argString !== '!';
    if (cm.quit) cm.quit(confirmIfModified);
  });

  CodeMirror.Vim.defineEx('wq', '', function(cm, cmd) {
    if (cm.writequit) cm.writequit();
  });

  CodeMirror.Vim.defineEx('OpenLinkUnderCursor', '', (cm) => {
    if (!cm.openlink) return;
    const cursor = cm.getCursor();
    const lineContent = cm.getLine(cursor.line);
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let link = null;
    while ((match = mdLinkRegex.exec(lineContent)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (cursor.ch >= start && cursor.ch <= end) { link = match[2]; break; }
    }
    if (link) cm.openlink(link);
  });
  CodeMirror.Vim.map('ge', ':OpenLinkUnderCursor', 'normal');
}
