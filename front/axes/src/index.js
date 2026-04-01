async function init() {
  miro.board.ui.on('icon:click', async () => {
    await miro.board.ui.openModal({ url: 'axes/app.html', width: 950, height: 650 });
  });
}
init();
