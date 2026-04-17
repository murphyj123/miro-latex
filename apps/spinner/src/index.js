import { getSafeJSON } from '../../shared/storage-utils.js';

async function init() {
  miro.board.ui.on('icon:click', async () => {
    // If a spinner image is selected, load its config
    const selection = await miro.board.getSelection();
    const img = selection.find(
      (item) => item.type === 'image' && item.title?.startsWith('{"_spinner":')
    );
    if (img) {
      try {
        const cfg = JSON.parse(img.title);
        if (cfg._spinner && cfg.names?.length) {
          localStorage.setItem(
            'spinner-load',
            JSON.stringify({ names: cfg.names, removeWinner: cfg.removeWinner ?? false, autoSpin: true })
          );
        }
      } catch (_) { /* ignore bad JSON */ }
    }
    await miro.board.ui.openPanel({ url: 'spinner/panel.html' });
  });
}
init();
