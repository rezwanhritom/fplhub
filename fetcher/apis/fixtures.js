const { fetchJson } = require('../lib/helpers');

/** Official API: GET /fixtures/ */
async function fetchFixtures() {
  return fetchJson('/fixtures/');
}

module.exports = { fetchFixtures };
