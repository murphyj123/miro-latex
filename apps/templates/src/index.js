async function init() {
  miro.board.ui.on('icon:click', async () => {
    await miro.board.ui.openModal({ url: 'templates/app.html', width: 1000, height: 700 });
  });
}
init();
