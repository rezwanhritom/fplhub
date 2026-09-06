const { fetchJson } = require('../lib/helpers');

/** Official API: GET /bootstrap-static/ */
async function fetchBootstrapStatic() {
  return fetchJson('/bootstrap-static/');
}

module.exports = { fetchBootstrapStatic };
