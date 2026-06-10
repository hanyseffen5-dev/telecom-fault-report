/**
 * جسر API — يستبدل google.script.run عند تشغيل الواجهة خارج Apps Script.
 * داخل Apps Script يبقى google.script.run الأصلي دون تغيير.
 */
(function () {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return;
  }

  var config = window.APP_CONFIG || {};
  var appsScriptUrl = (config.appsScriptUrl || '').trim();
  var apiBase = (config.apiBase || '').replace(/\/$/, '');

  function callApi(fnName, payload) {
    var url;
    var options;

    if (appsScriptUrl) {
      url = appsScriptUrl;
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn: fnName, payload: payload || {} }),
        redirect: 'follow'
      };
    } else {
      url = apiBase + '/api/' + fnName;
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      };
    }

    return fetch(url, options)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.error) {
          throw { message: data.error };
        }
        return data;
      });
  }

  function createRunner(fnName, args) {
    var payload = args.length === 1 ? args[0] : args[0];
    var runner = {
      _success: function () {},
      _failure: function () {},
      withSuccessHandler: function (fn) {
        this._success = fn;
        return this;
      },
      withFailureHandler: function (fn) {
        this._failure = fn;
        return this;
      }
    };

    callApi(fnName, payload)
      .then(function (data) {
        runner._success(data);
      })
      .catch(function (err) {
        runner._failure({ message: (err && err.message) || 'حدث خطأ' });
      });

    return runner;
  }

  window.google = {
    script: {
      run: new Proxy({}, {
        get: function (_, fnName) {
          return function () {
            return createRunner(fnName, Array.prototype.slice.call(arguments));
          };
        }
      })
    }
  };
})();
