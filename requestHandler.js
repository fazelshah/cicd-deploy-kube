"use strict";
const fetch = require("node-fetch");
const { baseApiUrl } = require("./config");
const {
  HttpError,
  HttpUnauthorizedError,
  HttpForbiddenError,
} = require("./errors");

const jwtRegex = new RegExp(
  /^Bearer [A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
);

async function getRelease(releaseId, cryptlexRequestHeaders) {
  const response = await fetch(`${baseApiUrl}/v3/releases/${releaseId}`, {
    method: "GET",
    headers: cryptlexRequestHeaders,
  });
  if (response.status == 200) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new HttpError(error.message, response.status, response.statusText);
  }
}

async function authorizeRelease(
  releaseId,
  normalizedFileName,
  key,
  tenantId,
  cryptlexRequestHeaders
) {
  const response = await fetch(
    `${baseApiUrl}/v3/releases/${releaseId}/authorize?key=${key}&normalizedFileName=${normalizedFileName}&accountId=${tenantId}`,
    {
      method: "GET",
      headers: cryptlexRequestHeaders,
    }
  );
  if (response.status == 200) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new HttpError(error.message, response.status, response.statusText);
  }
}

async function isSpaceAvailable(contentLength, cryptlexRequestHeaders) {
  const response = await fetch(`${baseApiUrl}/v3/releases/storage`, {
    method: "GET",
    headers: cryptlexRequestHeaders,
  });
  if (response.status == 200) {
    const responseBody = await response.json();
    return responseBody.allowedSpace == 0
      ? true
      : responseBody.allowedSpace - responseBody.usedSpace >=
          parseInt(contentLength);
  } else {
    const error = await response.json();
    throw new HttpError(error.message, response.status, response.statusText);
  }
}

async function requestHandler(request, queryParams, cryptlexRequestHeaders) {
  const urlParts = request.uri.replace("/v3/", "").split("/");
  if (request.method == "PUT") {
    if (urlParts.length != 2) {
      throw new HttpForbiddenError();
    }
    const releaseId = urlParts[0];
    const filename = urlParts[1];
    if (!cryptlexRequestHeaders.Authorization) {
      throw new HttpUnauthorizedError();
    }
    const contentLength = request.headers["content-length"]?.[0];
    if (!contentLength) {
      throw new HttpError(
        "Content-Length header is required",
        400,
        "Bad Request"
      );
    }
    if (
      !(await isSpaceAvailable(contentLength.value, cryptlexRequestHeaders))
    ) {
      throw new HttpError(
        "The release storage space limit has been reached. Please upgrade your plan to add more storage.",
        409,
        "Conflict"
      );
    }
    const release = await getRelease(releaseId, cryptlexRequestHeaders);
    if (release.published) {
      throw new HttpForbiddenError();
    }
    request.uri = `/${release.tenantId}/${release.productId}/${
      release.id
    }/${filename.toLowerCase()}`;
    request.headers["x-release-id"] = [
      { key: "X-Release-Id", value: release.id },
    ];
    request.headers["x-tenant-id"] = [
      { key: "X-Tenant-Id", value: release.tenantId },
    ];
    request.headers["x-filename"] = [{ key: "X-Filename", value: filename }];
  }

  if (request.method == "DELETE") {
    let releaseId = "",
      filename = "";
    if (urlParts.length == 2) {
      releaseId = urlParts[0];
      filename = urlParts[1];
    } else if (urlParts.length == 3) {
      releaseId = urlParts[1];
      filename = urlParts[2];
    } else {
      throw new HttpForbiddenError();
    }
    if (!cryptlexRequestHeaders.Authorization) {
      throw new HttpUnauthorizedError();
    }
    const release = await getRelease(releaseId, cryptlexRequestHeaders);
    request.uri = `/${release.tenantId}/${release.productId}/${
      release.id
    }/${filename.toLowerCase()}`;
  }

  if (request.method == "GET") {
    let tenantId = "",
      releaseId = "",
      filename = "";
    if (urlParts.length == 2) {
      releaseId = urlParts[0];
      filename = urlParts[1];
    } else if (urlParts.length == 3) {
      tenantId = urlParts[0];
      releaseId = urlParts[1];
      filename = urlParts[2];
    } else {
      throw new HttpForbiddenError();
    }
    if (!queryParams.key && !cryptlexRequestHeaders.Authorization) {
      throw new HttpUnauthorizedError();
    }
    const release = await authorizeRelease(
      releaseId,
      filename.toUpperCase(),
      queryParams.key,
      tenantId,
      cryptlexRequestHeaders
    );
    request.uri = `/${release.tenantId}/${release.productId}/${
      release.id
    }/${filename.toLowerCase()}`;
  }
  return request;
}

module.exports = { requestHandler };
