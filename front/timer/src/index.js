async function init() {
  miro.board.ui.on('icon:click', async () => {
    await miro.board.ui.openPanel({ url: 'timer/panel.html' });
  });
}
init();
