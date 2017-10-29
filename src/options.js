'use strict';

// 2017-10-15 file extension required on import paths

import { get, set } from './util.js';
import { EXPLICIT_GEOMETRY_PROPS, WINDOW_STATES } from './common.js';

// ---------------------------------------
// Init UI
// ---------------------------------------

popFormFromStorage();

// ---------------------------------------
// Add listeners 
// ---------------------------------------

document.getElementById('set-from-current-window').addEventListener('click', () => chrome.windows.getCurrent(popFormFromWindow));

document.getElementById('ok').addEventListener('click', () => {
    setStorageFromForm();
    window.close();
});

document.getElementById('cancel').addEventListener('click', () => window.close());

document.body.addEventListener('keydown', e => {
    if (e.keyCode === 27) { // ESC
        window.close();
    }
});

// ---------------------------------------
// Functions
// ---------------------------------------

function popFormFromStorage() {
    var defaultGeometry = get('default-geometry');

    if (defaultGeometry) {
        EXPLICIT_GEOMETRY_PROPS.forEach(prop => {
            if (defaultGeometry.hasOwnProperty(prop)) {
                getPropInputEl(prop).value = defaultGeometry[prop];
            }
        });

        var state = defaultGeometry['state'];

        if (WINDOW_STATES.indexOf(state) > -1) {
            getPropInputEl('state').value = state;
        }
    }
}

function popFormFromWindow(win) {
    var state = getPropInputEl('state').value = win['state'];

    if (state === 'normal') {
        EXPLICIT_GEOMETRY_PROPS.forEach(prop => getPropInputEl(prop).value = win[prop]);
    }
}

function setStorageFromForm(id) {
    var defaultGeometry = {};

    EXPLICIT_GEOMETRY_PROPS.forEach(prop => {
        const val = parseInt(getPropInputEl(prop).value, 10);

        if (val || val === 0) {
            defaultGeometry[prop] = val;
        }
    });

    defaultGeometry['state'] = getPropInputEl('state').value;

    set('default-geometry', defaultGeometry);
}

function getPropInputEl(prop) {
    return document.getElementById('win-' + prop);
}
