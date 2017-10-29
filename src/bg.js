'use strict';

// 2017-10-15 file extension required on import paths

import { get, set, focusWindow, remove, logSuccess } from './util.js';
import { EXPLICIT_GEOMETRY_PROPS } from './common.js';

const _recentWids = [];

migrateSettings();

addListeners();

// ---------------------------------------------------------------------------
// FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Migrate v0.1 settings
 *
 * Converts "win-<geometry-prop>" items (numbers) to a single
 * "default-geometry" item (object)
 */
function migrateSettings() {
    if (localStorage.getItem('default-geometry')) return;

    const defaultGeometry = {};

    EXPLICIT_GEOMETRY_PROPS.forEach(prop => {
        const
            key = 'win-' + prop,
            val = parseInt(localStorage.getItem(key), 10);

        if (val || val === 0) {
            defaultGeometry[prop] = val;
            localStorage.removeItem(key);
        }
    });

    set('default-geometry', defaultGeometry);
}

/**
 * Add relevant browser api listeners
 */
function addListeners() {

    // ASSIGN BROWSER ACTION

    chrome.browserAction.onClicked.addListener(() => chrome.runtime.openOptionsPage());

    // NEW WINDOW SCENARIO 1: HANDLE BROWSER STARTUP

    chrome.runtime.onStartup.addListener(() => chrome.windows.getAll(wins => {
        // seat all windows and focus the last one
        const promises = [];

        wins.forEach(win => promises.push(seatWindowWithRetry(win.id)));

        Promise.all(promises).then(wids => focusWindow(wids[wids.length - 1]));
    }));

    // NEW WINDOW SCENARIO 2: HANDLE NEW WINDOW

    // To filter irrelevant window create events, we listen for subsequent tab create or tab attach event on a window immediately after it gets created and only take action on the former. This is really only a problem for fullscreen seats since that seems to be the only seat that overrides the user tab drag during a detach scenario.

    chrome.windows.onCreated.addListener(win => {
        // console.log('window created', win);
        _recentWids.push(win.id);
    });

    // seat windows that are accompanied by a tab create event

    chrome.tabs.onCreated.addListener(tab => {
        // console.log('tab created', tab);
        if (remove(_recentWids, tab.windowId)) {
            // windowId was found and removed
            seatWindowWithRetry(tab.windowId)
                .then(focusWindow)
                .catch(console.error);
        }
    });

    // ignore window create events that get raised when a tab is detached

    chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
        // console.log('tab attached', tabId, attachInfo);
        remove(_recentWids, attachInfo.newWindowId);
    });
}

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
function seatWindowWithRetry(wid) {
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

        const normalGeometry = Object.assign({}, geometry, { state: 'normal' });

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
