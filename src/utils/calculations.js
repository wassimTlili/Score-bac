// Track coefficient data
export const trackData = {
  math: {
    name: 'Mathématiques',
    subjects: {
      math: { name: 'Mathématiques', coef: 4 },
      physics: { name: 'Physique', coef: 4 },
      svt: { name: 'SVT', coef: 2 },
      french: { name: 'Français', coef: 1 },
      english: { name: 'Anglais', coef: 1 },
      arabic: { name: 'Arabe', coef: 1 },
      philosophy: { name: 'Philosophie', coef: 1 },
      algo: { name: 'Info/Algo', coef: 1 },
      sport: { name: 'Sport', coef: 1 },
    },
    fsFormula: (grades, mg) =>
      4 * mg +
      1.5 * (grades.math ?? 0) +
      1.5 * (grades.physics ?? 0) +
      1 * (grades.philosophy ?? 0) +
      1 * (grades.french ?? 0) +
      1 * (grades.english ?? 0),
  },
  science: {
    name: 'Sciences Expérimentales',
    subjects: {
      math: { name: 'Mathématiques', coef: 3 },
      physics: { name: 'Physique', coef: 4 },
      svt: { name: 'SVT', coef: 4 },
      french: { name: 'Français', coef: 1 },
      english: { name: 'Anglais', coef: 1 },
      arabic: { name: 'Arabe', coef: 1 },
      philosophy: { name: 'Philosophie', coef: 1 },
      algo: { name: 'Info/Algo', coef: 1 },
      sport: { name: 'Sport', coef: 1 },
    },
    fsFormula: (grades, mg) =>
      4 * mg +
      2 * (grades.math ?? 0) +
      1.5 * (grades.physics ?? 0) +
      0.5 * (grades.svt ?? 0) +
      1 * (grades.philosophy ?? 0) +
      1 * (grades.french ?? 0) +
      1 * (grades.english ?? 0),
  },
  tech: {
    name: 'Sciences Techniques',
    subjects: {
      technique: { name: 'Technique', coef: 4 },
      math: { name: 'Mathématiques', coef: 3 },
      physics: { name: 'Physique', coef: 3 },
      french: { name: 'Français', coef: 1 },
      english: { name: 'Anglais', coef: 1 },
      arabic: { name: 'Arabe', coef: 1 },
      philosophy: { name: 'Philosophie', coef: 1 },
      sport: { name: 'Sport', coef: 1 },
    },
    fsFormula: (grades, mg) =>
      4 * mg +
      1.5 * (grades.technique ?? 0) +
      1.5 * (grades.math ?? 0) +
      1 * (grades.physics ?? 0) +
      1 * (grades.philosophy ?? 0) +
      1 * (grades.french ?? 0) +
      1 * (grades.english ?? 0),
  },
  info: {
    name: 'Science‑Informatique',
    subjects: {
      math: { name: 'Mathématiques', coef: 3 },
      physics: { name: 'Physique', coef: 2 },
      algo: { name: 'Algorithmique', coef: 3 },
      tic: { name: 'TIC', coef: 1.5 },
      bdd: { name: 'Base de Données', coef: 1.5 },
      french: { name: 'Français', coef: 1 },
      english: { name: 'Anglais', coef: 1 },
      arabic: { name: 'Arabe', coef: 1 },
      philosophy: { name: 'Philosophie', coef: 1 },
      sport: { name: 'Sport', coef: 1 },
    },
    fsFormula: (grades, mg) =>
      4 * mg +
      1.5 * (grades.math ?? 0) +
      1.5 * (grades.algo ?? 0) +
      0.5 * (grades.physics ?? 0) +
      0.5 * (grades.tic ?? 0) +
      0.5 * (grades.bdd ?? 0) +
      1 * (grades.philosophy ?? 0) +
      1 * (grades.french ?? 0) +
      1 * (grades.english ?? 0),
  },
  eco: {
    name: 'Économie‑Gestion',
    subjects: {
      eco: { name: 'Économie', coef: 3 },
      gestion: { name: 'Gestion', coef: 3 },
      math: { name: 'Mathématiques', coef: 2 },
      hg: { name: 'Histoire-Géo', coef: 2 },
      french: { name: 'Français', coef: 1 },
      english: { name: 'Anglais', coef: 1 },
      arabic: { name: 'Arabe', coef: 1 },
      philosophy: { name: 'Philosophie', coef: 1 },
      sport: { name: 'Sport', coef: 1 },
    },
    fsFormula: (grades, mg) =>
      4 * mg +
      1.5 * (grades.eco ?? 0) +
      1.5 * (grades.gestion ?? 0) +
      0.5 * (grades.math ?? 0) +
      0.5 * (grades.hg ?? 0) +
      1 * (grades.philosophy ?? 0) +
      1 * (grades.french ?? 0) +
      1 * (grades.english ?? 0),
  },
  lettres: {
    name: 'Lettres',
    subjects: {
      arabic: { name: 'Arabe', coef: 4 },
      philosophy: { name: 'Philosophie', coef: 3 },
      hg: { name: 'Histoire-Géo', coef: 3 },
      french: { name: 'Français', coef: 2 },
      english: { name: 'Anglais', coef: 2 },
      sport: { name: 'Sport', coef: 1 },
    },
    fsFormula: (grades, mg) =>
      4 * mg +
      1.5 * (grades.arabic ?? 0) +
      1.5 * (grades.philosophy ?? 0) +
      1 * (grades.hg ?? 0) +
      1 * (grades.french ?? 0) +
      1 * (grades.english ?? 0),
  },
  sport: {
    name: 'Sport',
    subjects: {
      sportTheory: { name: 'Sport Théorique', coef: 3 },
      sportPractical: { name: 'Sport Pratique', coef: 4 },
      svt: { name: 'SVT', coef: 3 },
      ep: { name: 'Éducation Physique', coef: 2 },
      french: { name: 'Français', coef: 1 },
      english: { name: 'Anglais', coef: 1 },
      arabic: { name: 'Arabe', coef: 1 },
      philosophy: { name: 'Philosophie', coef: 1 },
    },
    fsFormula: (grades, mg) =>
      4 * mg +
      1.5 * (grades.svt ?? 0) +
      1.5 * (grades.sportPractical ?? 0) +
      1.5 * (grades.sportTheory ?? 0) +
      0.5 * (grades.ep ?? 0) +
      0.5 * (grades.philosophy ?? 0) +
      1 * (grades.french ?? 0) +
      1 * (grades.english ?? 0),
  },
};

// Calculate Moyenne Générale
export function calculateMG(grades, track) {
  const subjects = trackData[track.id].subjects;
  let totalWeightedScore = 0;
  let totalCoefficients = 0;
  for (const [subjectId, value] of Object.entries(grades)) {
    if (subjects[subjectId]) {
      totalWeightedScore += value * subjects[subjectId].coef;
      totalCoefficients += subjects[subjectId].coef;
    }
  }
  return totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;
}

// Calculate Formule Spécifique (FG)
export function calculateFS(grades, track, mg) {
  return trackData[track.id].fsFormula(grades, mg);
}

// Calculate FG (returns all details)
export function calculateFG(grades, track) {
  const mg = calculateMG(grades, track);
  const fs = calculateFS(grades, track, mg);
  return {
    mg,
    fs,
    fg: fs,
    trackName: track.name,
  };
}

// Determine score level
export function getScoreLevel(fg) {
  if (fg >= 130)
    return { level: 'high', color: '#10b981', text: 'Excellent' };
  if (fg >= 110)
    return { level: 'medium', color: '#f59e0b', text: 'Bon' };
  return { level: 'low', color: '#ef4444', text: 'À améliorer' };
}