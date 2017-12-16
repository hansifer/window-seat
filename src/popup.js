'use strict';

import { seatWindowWithRetry } from './common.js';

document.getElementById('config-button').addEventListener('click', () => chrome.runtime.openOptionsPage());

document.getElementById('seat-window-button').addEventListener('click', () => {
    chrome.windows.getCurrent(win => {
        seatWindowWithRetry(win.id);
        window.close();
    });

});

document.getElementById('seat-all-windows-button').addEventListener('click', () => {
    chrome.windows.getAll({ windowTypes: ['normal'] }, wins => {
        for (const win of wins) {
            seatWindowWithRetry(win.id);
        }
        window.close();
    });
});
