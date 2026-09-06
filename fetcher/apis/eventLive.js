const { fetchJson } = require('../lib/helpers');

/** Official API: GET /event/{eventId}/live/ */
async function fetchEventLive(eventId) {
  return fetchJson(`/event/${eventId}/live/`);
}

module.exports = { fetchEventLive };
