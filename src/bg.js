'use strict';

// 2017-10-15 file extension required on import paths

import { set, focusWindow, remove } from './util.js';
import { EXPLICIT_GEOMETRY_PROPS, seatWindowWithRetry } from './common.js';

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

    // chrome.browserAction.onClicked.addListener(() => chrome.runtime.openOptionsPage());

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

    // ignore window create events that are raised when a tab is detached

    chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
        // console.log('tab attached', tabId, attachInfo);
        remove(_recentWids, attachInfo.newWindowId);
    });
}
