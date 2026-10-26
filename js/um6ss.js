/* UM6SS Clean Premium — Préparation au concours d'internat (Décembre 2026).
   Admissibilité : 4 épreuves de 100 QCM (Anatomie, Biologie, Pathologie
   médicale, Pathologie chirurgicale), 2 heures chacune — QCM isolés comme
   à l'examen.
   Admission définitive : 4 cas cliniques progressifs (Urgence médicale,
   Urgence chirurgicale, CAT médicale, CAT chirurgicale), 5 à 15 QCM liés
   par cas — session de 2 heures.
   Les quiz sont réservés à la formule Full, comme le mode QCM.
   Effectifs affichés : 8 000 QCM et 200 cas cliniques (chiffres live). */
import {
  requireAuth, esc, tabbar, hasFull, icon,
} from './common.js';

/* L'auth démarre en parallèle : le contenu (en cache) se peint sans attendre. */
requireAuth();

const app = document.getElementById('app');
let tab = 'admissibilite';
let index = { admissibilite: [], admission: [] };

async function load() {
  try { index = await (await fetch('um6ss/index.json')).json(); }
  catch (e) { index = { admissibilite: [], admission: [] }; }
}

const lock = () => (hasFull() ? '' : ' · Pro Full requis');
const INITIAL = { anat: 'A', bio: 'B', med: 'M', chir: 'C' };

function subjectCard(s) {
  return `<a class="case-card" href="um6ss-quiz.html?bank=${s.id}">
    <div class="um-subj">
      <span class="disc-ic">${INITIAL[s.id] || 'Q'}</span>
      <div class="um-body">
        <h3>${esc(s.subject)}${lock()}</h3>
        <p>${esc(s.focus)}</p>
        <div class="meta"><span>100 QCM tirés au hasard</span><span>2 heures</span><span>Coef ${s.coef}</span></div>
      </div>
    </div>
  </a>`;
}

function caseCard(c) {
  return `<a class="case-card" href="um6ss-quiz.html?comp=${c.id}">
    <div class="um-subj">
      <span class="disc-ic">${icon('med')}</span>
      <div class="um-body">
        <h3>${esc(c.title)}${lock()}</h3>
        <p>${esc(c.focus)}</p>
        <div class="meta"><span>Cas cliniques progressifs</span><span>5 à 15 QCM liés par cas</span><span>Coef ${c.coef}</span></div>
      </div>
    </div>
  </a>`;
}

function render() {
  const head = `<div class="um6ss-head">
      <img src="um6ss-logo.png" alt="UM6SS">
      <div><h2 style="margin:0;font-size:1.15rem">Concours Internat/Résidanat — UM6SS</h2>
      <p class="small" style="margin:2px 0 0">8 000 QCM · 200 cas cliniques · Décembre 2026</p></div>
    </div>
    <div class="um6ss-tabs">
      <button id="tabAdmissibilite" class="${tab === 'admissibilite' ? 'on' : ''}">Admissibilité</button>
      <button id="tabAdmission" class="${tab === 'admission' ? 'on' : ''}">Admission</button>
    </div>`;
  let body = '';
  if (tab === 'admissibilite') {
    body = `<p class="small">4 épreuves de <b>100 QCM</b> en 2 heures, comme le jour J — tirage aléatoire de 100 sans répétition. Chaque session apporte des questions inédites.</p>` +
      (index.admissibilite.length ? index.admissibilite.map(subjectCard).join('') : '<div class="empty">Chargement…</div>');
  } else {
    body = `<p class="small"><b>Épreuve d'admission définitive</b> — 2 heures : des cas cliniques progressifs par composante (5 à 15 QCM liés par cas). Un cas est tiré au hasard à chaque session, sans répétition.</p>` +
      (index.admission.length ? index.admission.map(caseCard).join('') : '<div class="empty">Chargement…</div>');
  }
  app.innerHTML = head + body;
  document.getElementById('tabAdmissibilite').onclick = () => { tab = 'admissibilite'; render(); };
  document.getElementById('tabAdmission').onclick = () => { tab = 'admission'; render(); };
}

await load();
render();
document.body.insertAdjacentHTML('beforeend', tabbar('um6ss'));
