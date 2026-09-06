(function (global) {
  global.FPLHUB = {
    api: 'http://localhost/fpl_hub/backend',
    front: 'http://localhost/fpl_hub/frontend',
    url(path) {
      return `${this.api}/${String(path || '').replace(/^\//, '')}`;
    },
    page(path) {
      return `${this.front}/${String(path || '').replace(/^\//, '')}`;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
