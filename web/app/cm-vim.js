export function initCodeMirrorVimEx() {
  CodeMirror.Vim.defineEx('quit', 'q', function(cm, cmd) {
    const confirmIfModified = cmd.argString !== '!';
    if (cm.quit) cm.quit(confirmIfModified);
  });
  CodeMirror.Vim.defineEx('wq', '', function(cm, cmd) {
    if (cm.writequit) cm.writequit();
  });
}
