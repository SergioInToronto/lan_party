/**
 * Food suggestion + ranked voting logic.
 */
import { api } from './api.mjs';
import { isLoggedIn } from './app.mjs';

let allFoods = [];
let myVotes = [];

async function loadFoods() {
  try {
    allFoods = await api.foods();
  } catch (err) {
    allFoods = [];
  }
}

async function loadMyVotes() {
  if (!isLoggedIn()) { myVotes = []; return; }
  try {
    myVotes = await api.myVotes();
  } catch (err) {
    myVotes = [];
  }
}

function renderFoodList(el) {
  if (allFoods.length === 0) {
    el.innerHTML = '<div class="text-text-muted font-mono">[ NO FOOD SUGGESTIONS YET ]</div>';
    return;
  }

  const sorted = [...allFoods].sort((a, b) => b.score - a.score);

  el.innerHTML = `
    <div class="space-y-2">
      ${sorted.map((food, i) => `
        <div class="flex items-center gap-4 border border-border-c bg-surface p-3 rounded-kit">
          <span class="font-mono text-accent-orange w-8 text-center">#${i + 1}</span>
          <div class="flex-1">
            <span class="font-bold">${food.name}</span>
            <span class="text-text-muted text-sm ml-2">by ${food.suggested_by}</span>
          </div>
          <div class="flex gap-3 font-mono text-xs">
            <span class="text-accent-orange">${food.votes['1st']}×1st</span>
            <span class="text-accent-blue">${food.votes['2nd']}×2nd</span>
            <span class="text-text-muted">${food.votes['3rd']}×3rd</span>
          </div>
          <span class="font-mono font-bold text-accent-green">${food.score}pts</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderVoteForm(el) {
  if (!isLoggedIn()) {
    el.innerHTML = '<div class="text-text-muted font-mono text-sm">[ LOGIN TO VOTE ]</div>';
    return;
  }

  if (allFoods.length === 0) {
    el.innerHTML = '<div class="text-text-muted font-mono text-sm">[ ADD FOOD OPTIONS FIRST ]</div>';
    return;
  }

  const ranks = ['1st', '2nd', '3rd'];

  el.innerHTML = `
    <form id="vote-form" class="space-y-3">
      ${ranks.map((label, i) => {
        const rank = i + 1;
        const currentVote = myVotes.find(v => v.rank === rank);
        return `
          <div class="flex items-center gap-3">
            <label class="font-mono text-sm text-accent-orange w-12">${label}:</label>
            <select name="rank_${rank}" class="flex-1">
              <option value="">-- Select --</option>
              ${allFoods.map(f =>
                `<option value="${f.id}" ${currentVote && currentVote.option_id === f.id ? 'selected' : ''}>${f.name}</option>`
              ).join('')}
            </select>
          </div>
        `;
      }).join('')}
      <button type="submit" class="btn btn-primary text-sm">Submit Votes</button>
      <div id="vote-status" class="text-sm font-mono hidden"></div>
    </form>
  `;

  document.getElementById('vote-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('vote-status');
    const votes = [];

    for (let rank = 1; rank <= 3; rank++) {
      const val = e.target.querySelector(`[name="rank_${rank}"]`).value;
      if (val) votes.push({ option_id: parseInt(val), rank });
    }

    if (votes.length === 0) {
      statusEl.textContent = '[ SELECT AT LEAST ONE ]';
      statusEl.className = 'text-sm font-mono text-accent-orange';
      statusEl.classList.remove('hidden');
      return;
    }

    // Check for duplicates
    const ids = votes.map(v => v.option_id);
    if (new Set(ids).size !== ids.length) {
      statusEl.textContent = '[ NO DUPLICATE PICKS ]';
      statusEl.className = 'text-sm font-mono text-accent-orange';
      statusEl.classList.remove('hidden');
      return;
    }

    try {
      await api.vote(votes);
      statusEl.textContent = '[ VOTES SAVED ]';
      statusEl.className = 'text-sm font-mono text-accent-green';
      statusEl.classList.remove('hidden');
      // Refresh data
      await Promise.all([loadFoods(), loadMyVotes()]);
      renderFoodList(document.getElementById('food-list'));
    } catch (err) {
      statusEl.textContent = '[ ERROR SAVING VOTES ]';
      statusEl.className = 'text-sm font-mono text-accent-orange';
      statusEl.classList.remove('hidden');
    }
  });
}

function renderSuggestForm(el) {
  if (!isLoggedIn()) {
    el.innerHTML = '<div class="text-text-muted font-mono text-sm">[ LOGIN TO SUGGEST ]</div>';
    return;
  }

  el.innerHTML = `
    <form id="suggest-form" class="flex gap-3">
      <input type="text" name="food_name" placeholder="Suggest a food..." required class="flex-1">
      <button type="submit" class="btn btn-primary text-sm">Add</button>
    </form>
    <div id="suggest-status" class="text-sm font-mono mt-2 hidden"></div>
  `;

  document.getElementById('suggest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('[name="food_name"]').value.trim();
    const statusEl = document.getElementById('suggest-status');

    try {
      await api.addFood(name);
      e.target.querySelector('[name="food_name"]').value = '';
      statusEl.textContent = `[ ADDED: ${name} ]`;
      statusEl.className = 'text-sm font-mono mt-2 text-accent-green';
      statusEl.classList.remove('hidden');
      // Refresh
      await loadFoods();
      renderFoodList(document.getElementById('food-list'));
      renderVoteForm(document.getElementById('vote-section'));
    } catch (err) {
      statusEl.textContent = '[ ERROR ADDING FOOD ]';
      statusEl.className = 'text-sm font-mono mt-2 text-accent-orange';
      statusEl.classList.remove('hidden');
    }
  });
}

export async function initFoodPage() {
  await Promise.all([loadFoods(), loadMyVotes()]);

  const listEl = document.getElementById('food-list');
  const voteEl = document.getElementById('vote-section');
  const suggestEl = document.getElementById('suggest-section');

  if (listEl) renderFoodList(listEl);
  if (voteEl) renderVoteForm(voteEl);
  if (suggestEl) renderSuggestForm(suggestEl);
}
