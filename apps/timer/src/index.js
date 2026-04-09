async function init() {
  // Toolbar icon → open panel
  miro.board.ui.on('icon:click', async () => {
    await miro.board.ui.openPanel({ url: 'timer/panel.html' });
  });

  // Board card icon clicked → pre-load duration then open panel
  miro.board.ui.on('app_card:open', async ({ appCard }) => {
    const seconds = parseInt(appCard.description) || 300;
    localStorage.setItem('timer-card-load', JSON.stringify({ seconds, label: appCard.title }));
    await miro.board.ui.openPanel({ url: 'timer/panel.html' });
  });

  miro.board.ui.on('app_card:connect', async ({ appCard }) => {
    // Reconnect the card (e.g. after copying) and restore its styling
    const seconds = parseInt(appCard.description) || 300;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const durLabel = secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
    appCard.status = 'connected';
    appCard.fields = [
      { value: 'Tap clock icon to open timer', fillColor: '#f0fdf4', textColor: '#065f46', iconShape: 'round' },
    ];
    appCard.style = { cardTheme: '#10b981' };
    await appCard.sync();
    localStorage.setItem('timer-card-load', JSON.stringify({ seconds, label: appCard.title }));
    await miro.board.ui.openPanel({ url: 'timer/panel.html' });
  });
}
init();
