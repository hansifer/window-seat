'use strict';

/**
 * Get and JSON parse an item from local storage
 *
 * @param  {string} key The key of the store item to retrieve
 * @return {any}        The JSON-parsed item value. `null` if key has no 
 *                      match or value is malformed.
 */
export function get(key) {
    const item = localStorage.getItem(key);

    if (item) {
        try {
            return JSON.parse(item);
        } catch (ex) {
            // console.error(ex);
        }
    }

    return null;
}

/**
 * JSON stringify and set an item to local storage
 *
 * @param  {string} key The key of the store item to set
 * @param  {any}    val The value to set
 * @return {undefined}
 */
export function set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

/**
 * Focus a browser window via browser API
 *
 * @param  {number} wid The id of the window to focus
 * @return {undefined}
 */
export function focusWindow(wid) {
    chrome.windows.update(wid, {
        focused: true
    });
}

/**
 * Remove the first matching item from an array.
 *
 * @param  {array} arr Array to remove first matching item from if present.
 *                     `arr` is mutated.
 * @param  {any}   val Value of item to remove. Matching by strict equality.
 * @return {boolean|undefined} `true` if an item was removed. `undefined` if 
 *                             `arr` remains unchanged.
 */
export function remove(arr, val) {
    const idx = arr.indexOf(val);

    if (idx > -1) {
        arr.splice(idx, 1);
        return true;
    }
}

/**
 * Log a message to the console with "success" styling
 *
 * @param  {string} msg The text to log
 * @return {undefined}
 */
export function logSuccess(msg) {
    console.log(`%c ${msg} `, 'background-color:#d2ffd2;color:green;'); // space-padding is intentional
}
