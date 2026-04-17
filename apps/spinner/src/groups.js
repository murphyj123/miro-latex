import { getState, generateGroups } from './spinner-core.js';

const grid = document.getElementById('groups-grid');
const btnShuffle = document.getElementById('btn-shuffle');

function render() {
  const state = getState();
  const groups = state.lastGroups || [];
  const teams = state.teams || [];

  grid.innerHTML = '';
  groups.forEach((members, i) => {
    const card = document.createElement('div');
    card.className = 'group-card';

    const color = teams[i]?.color || '#14b8a6';
    const name = teams[i]?.name || `Group ${i + 1}`;

    const header = document.createElement('div');
    header.className = 'group-card-header';
    header.style.background = color;
    header.textContent = name;

    const body = document.createElement('div');
    body.className = 'group-card-body';

    members.forEach((member) => {
      const row = document.createElement('div');
      row.className = 'group-member';
      row.textContent = member;
      body.appendChild(row);
    });

    const count = document.createElement('div');
    count.className = 'group-count';
    count.textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;

    card.append(header, body, count);
    grid.appendChild(card);
  });

  // Auto-size grid columns based on group count
  const cols = groups.length <= 3 ? groups.length : groups.length <= 6 ? 3 : 4;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

btnShuffle.addEventListener('click', () => {
  generateGroups();
  render();
});

window.addEventListener('storage', () => render());

render();
