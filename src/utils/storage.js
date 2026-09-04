/**
 * Local storage persistence helper for high scores, favorites, and game settings.
 */

const STORAGE_KEYS = {
  HIGH_SCORES: 'unblocked_high_scores',
  FAVORITES: 'unblocked_favorites',
  RECENT: 'unblocked_recent',
};

export function getHighScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getHighScore(gameId) {
  const scores = getHighScores();
  return scores[gameId] || 0;
}

export function saveHighScore(gameId, score) {
  try {
    const scores = getHighScores();
    const currentHigh = scores[gameId] || 0;
    if (score > currentHigh) {
      scores[gameId] = score;
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
      return true; // new high score
    }
  } catch {}
  return false;
}

export function getFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : ['snake', 'tetris', 'flappy'];
  } catch {
    return ['snake', 'tetris', 'flappy'];
  }
}

export function toggleFavorite(gameId) {
  try {
    const favs = getFavorites();
    const index = favs.indexOf(gameId);
    let updated;
    if (index >= 0) {
      updated = favs.filter((id) => id !== gameId);
    } else {
      updated = [...favs, gameId];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function recordPlay(gameId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
    let list = raw ? JSON.parse(raw) : [];
    list = [gameId, ...list.filter((id) => id !== gameId)].slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(list));
  } catch {}
}
