/**
 * @typedef {'all' | 'arcade' | 'puzzle' | 'classic' | 'action' | '2player' | 'favorites'} GameCategory
 */

/**
 * @typedef {Object} GameMetadata
 * @property {string} id
 * @property {string} title
 * @property {'arcade' | 'puzzle' | 'classic' | 'action' | '2player'} category
 * @property {string} description
 * @property {string[]} controls
 * @property {string[]} tags
 * @property {string} themeColor
 * @property {string} [badge]
 * @property {string} iconName
 */

/**
 * @typedef {Object} GameScore
 * @property {string} gameId
 * @property {number} highScore
 * @property {number} lastPlayed
 */

export const CATEGORIES = ['all', 'arcade', 'puzzle', 'classic', 'action', '2player', 'favorites'];
