'use strict';

class HttpError extends Error {
    constructor(message, status, statusDescription) {

        // Calling parent constructor of base Error class.
        super(message);
        this.status = status;
        this.statusDescription = statusDescription;
    }
}

class HttpUnauthorizedError extends HttpError {
    constructor(message) {
        super(message, '401', 'Unauthorized');
    }
}

class HttpForbiddenError extends HttpError {
    constructor(message) {
        super(message, '403', 'Forbidden');
    }
}

class HttpNotFoundError extends HttpError {
    constructor(message) {
        super(message, '404', 'Not Found');
    }
}

module.exports = {
    HttpUnauthorizedError,
    HttpForbiddenError,
    HttpNotFoundError,
    HttpError
}
