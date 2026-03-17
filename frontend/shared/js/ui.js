// SahaBul UI Yardımcıları - Toast, Dark Mode, Auth Modal, Nav
(function () {

  // ─── TOAST ──────────────────────────────────────────────────────────────────
  window.showToast = function (message, type) {
    type = type || 'success';
    var existing = document.getElementById('sahabul-toast');
    if (existing) existing.remove();

    var colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500'
    };

    var toast = document.createElement('div');
    toast.id = 'sahabul-toast';
    toast.className = 'fixed top-5 right-5 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ' + (colors[type] || colors.success);
    toast.innerHTML = '<span class="material-symbols-outlined text-base">' +
      (type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'check_circle') +
      '</span>' + message;
    document.body.appendChild(toast);

    // Hafif kayarak çıkış animasyonu
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.transform = 'translateY(0)';

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
    }, 3000);
  };

  // ─── DARK MODE ──────────────────────────────────────────────────────────────
  window.initDarkMode = function () {
    var saved = localStorage.getItem('sahabul_dark');
    if (saved === 'dark') document.documentElement.classList.add('dark');

    var btn = document.getElementById('dark-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('sahabul_dark', isDark ? 'dark' : 'light');
      var icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    });

    var icon = btn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
    }
  };

  // ─── AUTH MODAL YÜKLEYİCİ (global — her sayfadan çağrılabilir) ──────────────
  // DİKKAT: Bu fonksiyon async'tir ve HTML enjekte edildikten SONRA initAuthModal'ı çağırır.
  // Bu sayede timing sorunu ortadan kalkar.
  window.loadAuthModal = async function () {
    try {
      var res = await fetch('/frontend/shared/components/auth-modal.html');
      var html = await res.text();
      var placeholder = document.getElementById('auth-modal-placeholder');
      if (placeholder) {
        placeholder.innerHTML = html;
        // HTML enjekte edildikten hemen sonra listener'ları bağla
        initAuthModal();
      }
    } catch (e) {
      console.error('Auth modal yüklenemedi:', e);
    }
  };

  // ─── NAV AUTH DURUMU ────────────────────────────────────────────────────────
  window.updateNavForAuthState = function () {
    var loginBtn = document.getElementById('nav-login-btn');
    var registerBtn = document.getElementById('nav-register-btn');
    var userMenu = document.getElementById('nav-user-menu');
    var userName = document.getElementById('nav-user-name');
    var logoutBtn = document.getElementById('nav-logout-btn');
    var panelLink = document.getElementById('nav-panel-link');

    if (Auth.isLoggedIn()) {
      var user = Auth.getUser();
      if (loginBtn) loginBtn.classList.add('hidden');
      if (registerBtn) registerBtn.classList.add('hidden');
      if (userMenu) userMenu.classList.remove('hidden');
      if (userName) userName.textContent = user ? user.name.split(' ')[0] : 'Hesabım';
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (registerBtn) registerBtn.classList.remove('hidden');
      if (userMenu) userMenu.classList.add('hidden');
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        Auth.logout();
      });
    }

    if (panelLink) {
      var user = Auth.getUser();
      if (user && user.is_admin) {
        panelLink.textContent = 'Admin Panel';
        panelLink.onclick = function(e) { e.preventDefault(); Router.navigate('admin_paneli'); };
      } else {
        panelLink.textContent = 'Kullanıcı Paneli';
        panelLink.onclick = function(e) { e.preventDefault(); Router.navigate('kullan_c_paneli'); };
      }
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openAuthModal('login');
      });
    }
    if (registerBtn) {
      registerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openAuthModal('register');
      });
    }
  };

  // ─── AUTH MODAL ─────────────────────────────────────────────────────────────
  window.openAuthModal = function (tab) {
    tab = tab || 'login';
    var modal = document.getElementById('auth-modal');
    if (!modal) {
      // Modal henüz yüklenmemişse bekle ve yeniden dene
      setTimeout(function () { window.openAuthModal(tab); }, 100);
      return;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    switchAuthTab(tab);
  };

  window.closeAuthModal = function () {
    var modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  function switchAuthTab(tab) {
    var loginTab = document.getElementById('auth-tab-login');
    var registerTab = document.getElementById('auth-tab-register');
    var loginForm = document.getElementById('auth-login-form');
    var registerForm = document.getElementById('auth-register-form');

    if (!loginTab) return;

    if (tab === 'login') {
      loginTab.classList.add('border-b-2', 'border-green-500', 'text-green-600');
      registerTab.classList.remove('border-b-2', 'border-green-500', 'text-green-600');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      registerTab.classList.add('border-b-2', 'border-green-500', 'text-green-600');
      loginTab.classList.remove('border-b-2', 'border-green-500', 'text-green-600');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
  }

  // initAuthModal: Auth modal HTML enjekte edildikten sonra çağrılır.
  // window.loadAuthModal tarafından otomatik çağrılır.
  function initAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (!modal) return;

    // Backdrop tıklaması
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeAuthModal();
    });

    // Tab geçişleri
    var loginTab = document.getElementById('auth-tab-login');
    var registerTab = document.getElementById('auth-tab-register');
    if (loginTab) loginTab.addEventListener('click', function () { switchAuthTab('login'); });
    if (registerTab) registerTab.addEventListener('click', function () { switchAuthTab('register'); });

    // Kapat butonu
    var closeBtn = document.getElementById('auth-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);

    // Login formu
    var loginForm = document.getElementById('auth-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;
        var submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Giriş yapılıyor...';

        try {
          var data = await api.post('/auth/login', { email: email, password: password });
          Auth.login(data.token, data.user);
          closeAuthModal();
          showToast('Hoş geldiniz, ' + data.user.name.split(' ')[0] + '!');

          if (data.user.is_admin) {
            window.location.href = '/admin_paneli/code.html';
            return;
          }
          var redirect = sessionStorage.getItem('sahabul_redirect');
          sessionStorage.removeItem('sahabul_redirect');
          window.location.reload();
        } catch (err) {
          showToast(err.message, 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Giriş Yap';
        }
      });
    }

    // Register formu
    var registerForm = document.getElementById('auth-register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var name = document.getElementById('register-name').value.trim();
        var email = document.getElementById('register-email').value.trim();
        var password = document.getElementById('register-password').value;
        var phone = document.getElementById('register-phone').value.trim();
        var submitBtn = registerForm.querySelector('button[type="submit"]');

        if (password.length < 6) {
          showToast('Şifre en az 6 karakter olmalıdır.', 'error');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Kayıt yapılıyor...';

        try {
          var data = await api.post('/auth/register', { name: name, email: email, password: password, phone: phone });
          Auth.login(data.token, data.user);
          closeAuthModal();
          showToast('Hesabınız oluşturuldu! Hoş geldiniz, ' + data.user.name.split(' ')[0] + '!');

          var redirect = sessionStorage.getItem('sahabul_redirect');
          if (redirect) {
            sessionStorage.removeItem('sahabul_redirect');
            window.location.href = redirect;
          } else {
            updateNavForAuthState();
          }
        } catch (err) {
          showToast(err.message, 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Kayıt Ol';
        }
      });
    }
  }

  // ─── YARDIMCI FONKSİYONLAR ──────────────────────────────────────────────────
  window.formatDate = function (dateStr) {
    var months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    var days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    var parts = dateStr.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  };

  window.formatDateShort = function (dateStr) {
    if (!dateStr) return '-';
    var s = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
    var parts = s.split('-');
    if (parts.length !== 3) return dateStr;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  };

  window.starRating = function (rating) {
    var full = Math.floor(rating);
    var half = rating % 1 >= 0.5 ? 1 : 0;
    var empty = 5 - full - half;
    var html = '';
    for (var i = 0; i < full; i++) html += '<span class="material-symbols-outlined text-yellow-400 text-sm" style="font-variation-settings:\'FILL\' 1">star</span>';
    if (half) html += '<span class="material-symbols-outlined text-yellow-400 text-sm" style="font-variation-settings:\'FILL\' 1">star_half</span>';
    for (var j = 0; j < empty; j++) html += '<span class="material-symbols-outlined text-slate-300 text-sm">star</span>';
    return html;
  };

  // ─── MOBİL MENÜ ─────────────────────────────────────────────────────────────
  window.initMobileMenu = function () {
    var btn = document.getElementById('mobile-menu-btn');
    var menu = document.getElementById('mobile-menu');
    var closeBtn = document.getElementById('mobile-menu-close');
    if (!btn || !menu) return;

    btn.addEventListener('click', function () {
      menu.classList.remove('hidden');
      menu.classList.add('flex');
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
      });
    }
    menu.addEventListener('click', function (e) {
      if (e.target === menu) {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
      }
    });
  };

})();
