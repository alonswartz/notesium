export function initCodeMirrorVimEx() {
  CodeMirror.Vim.defineEx('quit', 'q', function(cm, cmd) {
    if (cm.quit) cm.quit();
  });
}
