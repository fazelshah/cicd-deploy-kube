'use strict';
const fetch = require('node-fetch');
const { HttpError } = require('./errors')
const { baseApiUrl, baseReleasesUrl } = require('./config');

async function createReleaseFile(releaseFileBody, cryptlexRequestHeaders) {
    const response = await fetch(`${baseApiUrl}/v3/release-files`, {
        method: 'POST',
        headers: cryptlexRequestHeaders,
        body: JSON.stringify(releaseFileBody)
    });
    if (response.status != 201) {
        const error = await response.json();
        throw new HttpError(error.message, response.status, response.statusText);
    } else {
        return await response.json();
    }
}

async function responseHandler(request, response, cryptlexRequestHeaders) {
    if (request.method == 'PUT' && response.status == '200') {
        const releaseFileBody = {};
        const contentLengthHeader = request.headers['content-length'];
        if (contentLengthHeader) {
            releaseFileBody.size = parseInt(contentLengthHeader[0].value, 10);
        }
        const etagHeader = response.headers['etag'];
        if (etagHeader) {
            releaseFileBody.checksum = etagHeader[0].value.replace(/"/g, '');
        }
        const releaseId = request.headers['x-release-id'][0].value;
        const tenantId = request.headers['x-tenant-id'][0].value;
        const filename = request.headers['x-filename'][0].value;
        releaseFileBody.url = `${baseReleasesUrl}/${tenantId}/${releaseId}/${filename}`;
        releaseFileBody.name = filename;
        releaseFileBody.secured = true;
        releaseFileBody.external = false;
        releaseFileBody.releaseId = releaseId;
        const releaseFile = await createReleaseFile(releaseFileBody, cryptlexRequestHeaders);
        response.body = JSON.stringify(releaseFile);
    }
    if (request.method == 'GET' || (response.status == '200' || response.status == '206')) {

        response.headers['content-type'] = [{ key: 'Content-Type', value: 'application/octet-stream' }];
    }
    if (request.method == 'GET' && response.status == '404') {

        console.log(JSON.stringify(request), JSON.stringify(response));
    }
    return response;
}

module.exports = { responseHandler };