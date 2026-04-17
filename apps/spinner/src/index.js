import { getSafeJSON } from '../../shared/storage-utils.js';

async function init() {
  miro.board.ui.on('icon:click', async () => {
    const selection = await miro.board.getSelection();
    const img = selection.find(
      (item) => item.type === 'image' && item.title?.startsWith('{')
    );

    if (img) {
      try {
        const cfg = JSON.parse(img.title);

        // Spinner wheel image — load names and auto-spin
        if (cfg._spinner && cfg.names?.length) {
          localStorage.setItem(
            'spinner-load',
            JSON.stringify({ names: cfg.names, removeWinner: cfg.removeWinner ?? false, autoSpin: true })
          );
        }

        // Groups image — load names and open groups modal
        if (cfg._spinnerGroups && cfg.names?.length) {
          localStorage.setItem(
            'spinner-load',
            JSON.stringify({ names: cfg.names, mode: 'groups', autoOpen: 'groups' })
          );
        }

        // Dice image — open dice modal with settings
        if (cfg._spinnerDice) {
          localStorage.setItem(
            'spinner-load',
            JSON.stringify({ mode: 'dice', autoOpen: 'dice', diceColor: cfg.color })
          );
        }

        // Coin image — open coin modal with settings
        if (cfg._spinnerCoin) {
          localStorage.setItem(
            'spinner-load',
            JSON.stringify({ mode: 'coin', autoOpen: 'coin', coinColor: cfg.color })
          );
        }
      } catch (_) { /* ignore bad JSON */ }
    }

    await miro.board.ui.openPanel({ url: 'spinner/panel.html' });
  });
}
init();
