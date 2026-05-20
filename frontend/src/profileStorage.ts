import { PlayerProfile } from './types';
import { PLAY_STYLE_TITLES } from './data';

const KEY = 'realm_explorer_profile';

const BLANK: PlayerProfile = {
  playerId:      'explorer_01',
  runsCompleted: 0,
  averageStyle:  '—',
  favoriteClass: 'blade_dancer',
  bestDepth:     0,
  allTimeTitles: [],
};

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...BLANK, ...JSON.parse(raw) };
  } catch { /* ignore corrupt data */ }
  return { ...BLANK };
}

export function saveProfile(p: PlayerProfile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

/** Call after every completed run to update persistent stats. */
export function updateProfileAfterRun(params: {
  currentProfile:  PlayerProfile;
  floorsReached:   number;
  playStyle:       string;
  playerClass:     string;
  earnedTitle:     string;
}): PlayerProfile {
  const { currentProfile, floorsReached, playStyle, playerClass, earnedTitle } = params;

  const titles = currentProfile.allTimeTitles.includes(earnedTitle)
    ? currentProfile.allTimeTitles
    : [...currentProfile.allTimeTitles, earnedTitle].slice(-6); // keep last 6

  const updated: PlayerProfile = {
    ...currentProfile,
    runsCompleted: currentProfile.runsCompleted + 1,
    bestDepth:     Math.max(currentProfile.bestDepth, floorsReached),
    averageStyle:  playStyle.slice(0, 6),   // "aggres", "diplom", etc.
    favoriteClass: playerClass as PlayerProfile['favoriteClass'],
    allTimeTitles: titles,
  };

  saveProfile(updated);
  return updated;
}
