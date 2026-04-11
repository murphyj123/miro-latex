/**
 * Shared UI helpers — all Miro apps.
 */

/**
 * Wire up a collapsible panel section.
 * Clicking the header element toggles the body and flips the chevron.
 *
 * @param {string} headerId   id of the clickable header element
 * @param {string} chevronId  id of the chevron/arrow element (receives "closed" class)
 * @param {string} bodyId     id of the collapsible body element (receives "hidden" class)
 */
export function makeCollapsible(headerId, chevronId, bodyId) {
  let open = true;
  const header  = document.getElementById(headerId);
  const chevron = document.getElementById(chevronId);
  const body    = document.getElementById(bodyId);
  if (!header || !body) return;
  header.addEventListener('click', () => {
    open = !open;
    body.classList.toggle('hidden', !open);
    if (chevron) chevron.classList.toggle('closed', !open);
  });
}
