/* Classement hebdo / tout temps. */
import {
  requireAuth, user, profile, guardPro, fb, isoWeekId,
  esc, $, $$, tabbar, toast, saveProfile, pushLeaderboard
} from './common.js';

await requireAuth();
if (!guardPro('Classement', 'leaderboard')) throw new Error('locked');

let lbTab = 'weekly';
const app = document.getElementById('app');

function tabCol() {
  const { db, fs } = fb();
  if (!db || !fs) throw new Error('firestore-unavailable');
  try {
    return lbTab === 'weekly'
      ? fs.collection(db, 'lb_weekly', isoWeekId(), 'users')
      : fs.collection(db, 'lb_alltime', 'users');
  } catch (collErr) {
    const dbType = typeof db;
    const dbCtor = (db && db.constructor && db.constructor.name) || 'none';
    throw new Error('collection-failed dbType=' + dbType + ' dbCtor=' + dbCtor + ' orig=' + (collErr && collErr.code));
  }
}

async function renderLb() {
  const list = $('#lbList');
  if (!list) return;
  const { fs } = fb();
  try {
    let snap;
    try {
      snap = await fs.getDocs(fs.query(tabCol(), fs.orderBy('xp', 'desc'), fs.limit(50)));
    } catch (qErr) {
      // Fallback: sans orderBy/limit (tri côté client) si la requête échoue
      console.warn('[classement] ordered query failed, fallback:', qErr);
      snap = await fs.getDocs(tabCol());
    }
    const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 50);
    if (!rows.length) {
      list.innerHTML = `<div class="empty">Personne pour l'instant.<br>Sois le premier à gagner de l'XP ! 🚀</div>`;
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    list.innerHTML = rows.map((r, i) => `
      <div class="lb-row ${r.uid === user.uid ? 'me' : ''}">
        <div class="lb-rank">${medals[i] || (i + 1)}</div>
        <div class="avatar">${r.photoURL ? `<img src="${esc(r.photoURL)}" alt="">` : esc((r.nickname || '?')[0].toUpperCase())}</div>
        <div class="lb-name">${esc(r.nickname || 'Étudiant')}${r.uid === user.uid ? ' (toi)' : ''}</div>
        <div class="lb-xp">${(r.xp || 0).toLocaleString('fr-FR')} XP</div>
      </div>`).join('');
  } catch (e) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const detail = (e && e.code) ? ` (${e.code})` : '';
    const msg = (e && e.message && !e.code) ? `<br><small>${esc(e.message)}</small>` : '';
    list.innerHTML = `<div class="empty">${offline ? 'Classement indisponible hors-ligne.<br>Reconnecte-toi pour le voir. 📶' : 'Impossible de charger le classement' + detail + '.' + msg + '<br>Réessaie dans un moment. 📶'}</div>`;
    console.warn('[classement] load failed:', e);
  }
}

function render() {
  app.innerHTML = `
    <div class="topbar"><h2>🏆 Classement</h2></div>
    ${!profile.nickname ? `
      <div class="demo-note">👋 Choisis ton pseudo pour apparaître dans le classement :
        <div class="code-row"><input class="input" id="nickInput" placeholder="Pseudo" maxlength="30">
        <button class="btn btn-ghost" id="nickBtn" style="width:auto;margin-top:0;flex:none">OK</button></div>
      </div>` : ''}
    <div class="tabs">
      <button data-t="weekly" class="${lbTab === 'weekly' ? 'on' : ''}">Cette semaine</button>
      <button data-t="alltime" class="${lbTab === 'alltime' ? 'on' : ''}">Tout temps</button>
    </div>
    <div id="lbList"><div class="empty">Chargement…</div></div>
    <p class="small" style="text-align:center">Gagne de l'XP : QCM (jusqu'à 20 XP/question parfaite), cartes étudiées (1 XP/carte).</p>`;
  $$('.tabs button').forEach(b => b.onclick = () => { lbTab = b.dataset.t; render(); });
  const nb = $('#nickBtn');
  if (nb) nb.onclick = async () => {
    const v = $('#nickInput').value.trim().slice(0, 30);
    if (!v) return;
    saveProfile({ nickname: v });
    pushLeaderboard(true);
    toast('Pseudo enregistré ✅');
    render();
  };
  renderLb();
}

render();
document.body.insertAdjacentHTML('beforeend', tabbar('leaderboard'));
