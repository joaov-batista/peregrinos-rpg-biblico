// Tela dividida: cada quadro (jogador 2, 3, 4) tem o seu próprio armazenamento, para entrar com a SUA conta
    // e ver os SEUS personagens. O quadro 1 usa o armazenamento normal do aparelho.
    (function () {
      var q = new URLSearchParams(location.search).get('quadro'); if (!q || q === '0') return;
      function caixa(real, pre) {
        var meus = function () { var r = []; for (var i = 0; i < real.length; i++) { var k = real.key(i); if (k.indexOf(pre) === 0) r.push(k); } return r; };
        return { getItem: function (k) { return real.getItem(pre + k); }, setItem: function (k, v) { real.setItem(pre + k, String(v)); }, removeItem: function (k) { real.removeItem(pre + k); },
          clear: function () { meus().forEach(function (k) { real.removeItem(k); }); }, key: function (i) { var k = meus()[i]; return k == null ? null : k.slice(pre.length); }, get length() { return meus().length; } };
      }
      try { var L = caixa(window.localStorage, 'jogador' + q + ':'), S = caixa(window.sessionStorage, 'jogador' + q + ':');
        Object.defineProperty(window, 'localStorage', { value: L, configurable: true }); Object.defineProperty(window, 'sessionStorage', { value: S, configurable: true }); } catch (e) { /* sem isolamento: os quadros dividem a conta */ }
    })();
