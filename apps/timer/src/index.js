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
    const seconds = parseInt(appCard.description) || 300;
    localStorage.setItem('timer-card-load', JSON.stringify({ seconds, label: appCard.title }));
    await miro.board.ui.openPanel({ url: 'timer/panel.html' });
  });
}
init();
