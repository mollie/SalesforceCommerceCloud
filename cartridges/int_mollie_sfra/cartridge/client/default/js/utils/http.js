let redirect;

function doRedirect () {
    if (redirect) {
        // Redirect to last responded redirect
        location.href = redirect;
    }
}

function dispatchEvent (event) {
    if (!event || !event.name) {
        return;
    }
    document.body.dispatchEvent(new CustomEvent(event.name, {
        bubbles: true,
        detail: event.detail
    }));
}

function processServerResponse (response) {
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

function handleResponse (response) {
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

function postJson (url, data) {
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
            'Accept': 'application/json'
        },
        body: json
    }).then(handleResponse);
}

function getJson (url) {
    return fetch(url, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    }).then(handleResponse);
}

module.exports = {
    doRedirect,
    dispatchEvent,
    processServerResponse,
    handleResponse,
    postJson,
    getJson
}