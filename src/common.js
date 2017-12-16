'use strict';

import { get, logSuccess } from './util.js';

export const WINDOW_STATES = ['normal', 'maximized', 'minimized', 'fullscreen'];
export const EXPLICIT_GEOMETRY_PROPS = ['left', 'top', 'width', 'height'];

/**
 * Seat a window. Try a second time if first attempt fails.
 *
 * Window position may be off on first try when window is opened from a window
 * on a secondary monitor or when browser starts up after last open window was
 * closed from a secondary monitor.
 * 
 * @param  {number} wid ID of window to seat
 * @return {Promise.<number>} ID of seated window (same as `wid`)
 */
export function seatWindowWithRetry(wid) {
	return new Promise((resolve, reject) => {
		seatWindow(wid).then(seated => {
			if (seated) return resolve(wid);

			console.warn('retrying window seat...');

			seatWindow(wid).then(seated => {
				if (seated) {
					logSuccess('window seat retry worked');
					return resolve(wid);
				}

				reject('window seat failed');
			});
		});
	});
}

/**
 * Seat a window
 *
 * @param  {number} wid ID of window to seat
 * @return {Promise.<boolean>} `true` if final window geometry matches
 *                             default geometry. `false` otherwise.
 */
function seatWindow(wid) {
	return new Promise((resolve, reject) => {
		const geometry = get('default-geometry') || {};

		// as per chrome.windows.update() requirements, 'minimized', 'maximized' and 'fullscreen' states cannot be combined with 'left', 'top', 'width' or 'height', so if we're not targeting any of those states, we're good to go with a single chrome.windows.update() call

		if (!geometry.state || geometry.state === 'normal') {
			return chrome.windows.update(wid, geometry, win => resolve(hasGeometry(win, geometry)));
		}

		// we have a target state and it's not 'normal', so first call chrome.windows.update() with a forced 'normal' state, then call chrome.windows.update() again to update to the target state. this way, if the user later "restores" the window state, it will have the expected explicit geometry.

		const normalGeometry = Object.assign({}, geometry, {
			state: 'normal'
		});

		chrome.windows.update(wid, normalGeometry,
			win => chrome.windows.update(win.id, {
				state: geometry.state
			}, win => resolve(hasGeometry(win, geometry))));
	});
}

/**
 * Check whether a window has specific explicit geometry
 *
 * @param  {object} win      A window object
 * @param  {object} geometry A geometry object
 * @return {boolean} `true` if for every explicit geometry property specified
 *                   by `geometry`, it is strictly equal to the corresponding
 *                   `win` property. `false` otherwise.
 */
function hasGeometry(win, geometry) {
	return EXPLICIT_GEOMETRY_PROPS.every(prop => !geometry.hasOwnProperty(prop) || geometry[prop] === win[prop]);
}
