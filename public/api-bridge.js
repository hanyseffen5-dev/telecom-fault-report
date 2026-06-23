/**
 * جسر API — يستبدل google.script.run عند تشغيل الواجهة خارج Apps Script.
 * داخل Apps Script يبقى google.script.run الأصلي دون تغيير.
 */
(function () {
  function isInsideAppsScript() {
    try {
      return typeof google !== 'undefined' &&
        google.script &&
        google.script.run &&
        typeof google.script.host !== 'undefined';
    } catch (_e) {
      return false;
    }
  }

  if (isInsideAppsScript()) {
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
      var origin = apiBase || (typeof window !== 'undefined' && window.location ? window.location.origin : '');
      url = origin + '/api/' + fnName;
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      };
    }

    var timeoutMs = 60000;
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller) {
      options.signal = controller.signal;
    }

    var fetchPromise = fetch(url, options);
    if (controller) {
      fetchPromise = Promise.race([
        fetchPromise,
        new Promise(function (_, reject) {
          setTimeout(function () {
            controller.abort();
            reject({ message: 'انتهت مهلة الاتصال — حاول مرة أخرى' });
          }, timeoutMs);
        })
      ]);
    }

    return fetchPromise
      .then(function (res) {
        return res.text().then(function (text) {
          var data;
          try {
            data = JSON.parse(text);
          } catch (_err) {
            if (text.indexOf('PayloadTooLargeError') !== -1) {
              throw { message: 'حجم الصورة كبير — اختر صورة أصغر أو أعد تشغيل npm run dev' };
            }
            if (text.indexOf('Cannot POST /api/') !== -1) {
              throw { message: 'المسار غير متاح — أعد تشغيل npm run dev (node dev/server.js)' };
            }
            if (!res.ok) {
              throw {
                message: appsScriptUrl
                  ? 'تعذر الاتصال بـ Apps Script — تحقق من رابط النشر'
                  : 'تعذر الاتصال بالخادم (HTTP ' + res.status + ') — تأكد أن npm run dev يعمل'
              };
            }
            throw {
              message: appsScriptUrl
                ? 'تعذر الاتصال بـ Apps Script — تحقق من رابط النشر'
                : 'تعذر الاتصال بالخادم — تأكد أن npm run dev يعمل'
            };
          }
          if (data && data.error) {
            throw { message: data.error };
          }
          return data;
        });
      })
      .catch(function (err) {
        if (err && err.message) {
          throw err;
        }
        throw {
          message: appsScriptUrl
            ? 'تعذر الاتصال بـ Apps Script — تحقق من الاتصال بالإنترنت'
            : 'تعذر الاتصال بالخادم — تأكد أن npm run dev يعمل'
        };
      });
  }

  function createRunInstance() {
    var state = {
      success: function () {},
      failure: function () {}
    };

    var proxy = new Proxy(state, {
      get: function (target, prop) {
        if (prop === 'withSuccessHandler') {
          return function (fn) {
            target.success = typeof fn === 'function' ? fn : target.success;
            return proxy;
          };
        }
        if (prop === 'withFailureHandler') {
          return function (fn) {
            target.failure = typeof fn === 'function' ? fn : target.failure;
            return proxy;
          };
        }
        return function () {
          var payload = arguments.length >= 1 ? arguments[0] : undefined;
          callApi(String(prop), payload)
            .then(function (data) {
              target.success(data);
            })
            .catch(function (err) {
              target.failure({ message: (err && err.message) || 'حدث خطأ' });
            });
        };
      }
    });

    return proxy;
  }

  window.google = {
    script: {
      get run() {
        return createRunInstance();
      }
    }
  };
})();
