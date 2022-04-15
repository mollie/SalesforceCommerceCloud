let redirect;

/**
 * Trigger Redirect
 */
function doRedirect() {
    if (redirect) {
        // Redirect to last responded redirect
        location.href = redirect;
    }
}

/**
 * Dispatch an apple pay event
 * @param {Object} event - Apple Pay Event
 */
function dispatchEvent(event) {
    if (!event || !event.name) {
        return;
    }
    document.body.dispatchEvent(new CustomEvent(event.name, {
        bubbles: true,
        detail: event.detail
    }));
}

/**
 * Process Server Response
 * @param {Object} response - Response to process after apple pay hook result
 */
function processServerResponse(response) {
    if (!response) {
        return;
    }
    // redirect could be an empty string
    if (typeof response.redirect !== 'undefined') {
        // set redirect URL
        redirect = response.redirect;
    }
    dispatchEvent(response.event);
}

/**
 * Correctly handle response status codes
 * @param {Object} response - HTTP response
 * @returns {PromiseLike<Json> | Promise<Json>} - Response JSON
 */
function handleResponse(response) {
    return response.json()
        .then(function (json) {
            if (response.status >= 200 && response.status < 300) {
                // Return success JSON response
                return json;
            }

            // Throw error with response status
            var err = new Error(json ? json.status : 'Request error');
            err.response = json;
            throw err;
        });
}

/**
 * Post JSON data helper
 * @param {string} url - endpoint
 * @param {Obect} data - data
 * @returns {Promise<any>} - Result
 */
function postJson(url, data) {
    var json = data;
    if (typeof data === 'object') {
        json = JSON.stringify(data);
    } else if (typeof data !== 'string') {
        throw new Error('Data must be an object or a JSON string.');
    }
    return fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: json
    }).then(handleResponse);
}

/**
 * Get JSON data helper
 * @param {string} url - endpoint
 * @returns {Promise<any>} - Result
 */
function getJson(url) {
    return fetch(url, {
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    }).then(handleResponse);
}

module.exports = {
    doRedirect,
    dispatchEvent,
    processServerResponse,
    postJson,
    getJson
};
