let baseApiUrl = "https://api.cryptlex.com";
let baseReleasesUrl = "https://releases.cryptlex.com/v3";

if (process.env.AWS_LAMBDA_FUNCTION_NAME.endsWith("Dev")) {
    baseApiUrl = "https://api.dev.cryptlex.com";
    baseReleasesUrl = "https://releases.dev.cryptlex.com/v3";
}

if (process.env.AWS_LAMBDA_FUNCTION_NAME.endsWith("EU")) {
    baseApiUrl = "https://api.eu.cryptlex.com";
    baseReleasesUrl = "https://releases.eu.cryptlex.com/v3";
}

module.exports = {
    baseApiUrl: baseApiUrl,
    baseReleasesUrl: baseReleasesUrl
}
