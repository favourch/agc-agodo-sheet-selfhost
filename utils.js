function getUrlQueryParams(str) {
    let queryString = str.split("?")[1];
    if (!queryString) return null;
    let queryPortions = queryString.split("&");
    let ret = {}

    for (let x of queryPortions) {
        let split = x.split("=");
        ret[split[0]] = split[1];
    }

    return ret;
}

module.exports = {
    getUrlQueryParams
};