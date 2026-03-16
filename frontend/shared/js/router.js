// SahaBul Router - global window.Router
(function () {
  var pageMap = {
    'ana_sayfa': '/ana_sayfa/code.html',
    'saha_listeleme': '/saha_listeleme/code.html',
    'saha_detay': '/saha_detay/code.html',
    'rezervasyon': '/rezervasyon/code.html',
    'kullan_c_paneli': '/kullan_c_paneli/code.html',
    'admin_paneli': '/admin_paneli/code.html'
  };

  window.Router = {
    getParam: function (key) {
      return new URLSearchParams(window.location.search).get(key);
    },
    navigate: function (page, params) {
      var url = pageMap[page] || ('/' + page + '/code.html');
      if (params && Object.keys(params).length > 0) {
        url += '?' + new URLSearchParams(params).toString();
      }
      window.location.href = url;
    }
  };
})();
