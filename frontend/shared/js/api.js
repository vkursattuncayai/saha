// SahaBul API wrapper - global window.api
(function () {
  var API_BASE = '/api';

  async function request(method, path, body) {
    var token = localStorage.getItem('sahabul_token');
    var opts = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);

    var res = await fetch(API_BASE + path, opts);
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API hatası oluştu.');
    return data;
  }

  window.api = {
    get: function (path) { return request('GET', path, null); },
    post: function (path, body) { return request('POST', path, body); },
    patch: function (path, body) { return request('PATCH', path, body); },
    put: function (path, body) { return request('PUT', path, body); },
    del: function (path) { return request('DELETE', path, null); }
  };
})();
