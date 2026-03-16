// SahaBul Auth yönetimi - global window.Auth
(function () {
  window.Auth = {
    getToken: function () {
      return localStorage.getItem('sahabul_token');
    },
    getUser: function () {
      var raw = localStorage.getItem('sahabul_user');
      try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    isLoggedIn: function () {
      return !!localStorage.getItem('sahabul_token');
    },
    login: function (token, user) {
      localStorage.setItem('sahabul_token', token);
      localStorage.setItem('sahabul_user', JSON.stringify(user));
    },
    logout: function () {
      localStorage.removeItem('sahabul_token');
      localStorage.removeItem('sahabul_user');
      window.location.href = '/ana_sayfa/code.html';
    }
  };
})();
