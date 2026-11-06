/*
 * Form Sender embed script.
 *
 *   <script src="https://YOUR-API/embed.js" data-form="FORM_CODE" async></script>
 *
 * It draws the form right where the tag is, with the fields configured in the dashboard (edit the form there
 * and every page shows the change), sends it without leaving the page and tells the visitor what happened in a
 * notice right under the button.
 *
 * Everything it draws is found by id, and every id starts with the form's code (FORM_CODE-form, FORM_CODE-field-name,
 * FORM_CODE-error-name...), so nothing can be mixed up with the page it is on or with another form.
 *
 * Optional attributes on the tag:
 *   data-target="#selector"       draw the form inside that element instead of next to the tag
 *   data-style="default"          only for the dashboard's own page: the standard style, not the form's
 *   data-theme="dark"             only for the dashboard's own page: its dark look
 *   data-preview                  only for the dashboard: validates but never sends
 *
 * Events on the form's element: "formsender:sent" and "formsender:error" (it also accepts "formsender:style", with
 * CSS as the detail, to try a style without saving it).
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.getAttribute("data-form")) return;

  var code = script.getAttribute("data-form");
  var dark = script.getAttribute("data-theme") === "dark";
  var preview = script.hasAttribute("data-preview");
  var base = new URL(script.src, location.href).origin;

  // An id as a CSS selector (an id that starts with a digit has to be escaped).
  function sel(id) { return "#" + (window.CSS && CSS.escape ? CSS.escape(id) : id); }

  var ROOT = code + "-form";

  // What the form needs to work whatever its style says. The look itself comes from the form (its Design tab).
  var BASE = ":host{display:block;font:inherit;color:inherit}*{box-sizing:border-box}[hidden]{display:none!important}" +
    sel(ROOT) + "{position:relative}" +
    sel(ROOT) + '[data-theme="dark"]{--text:#f4f4fb;--muted:#9a9ab2;--border:#2c2c44;--field:#12121f;--accent:#8b6bff;--danger:#ff6b7a;--ok:#3ddc97}' +
    sel(code + "-extra") + "{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}" +
    sel(code + "-note") + "{margin:0;font-size:16px;opacity:.7}";

  var INPUT_TYPES = { text: "text", email: "email", phone: "tel", number: "number", date: "date" };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (name) {
      if (attrs[name] === false || attrs[name] == null) return;
      node.setAttribute(name, attrs[name] === true ? "" : attrs[name]);
    });
    [].concat(children || []).forEach(function (child) {
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  // Where the form goes: inside the target element, or right after the tag. A script pasted in the <head> (or
  // alone in a file) would put it inside the <head>, which is never drawn: then it goes to the end of the <body>.
  var host = el("div", { "data-formsender": code });

  function mount() {
    var selector = script.getAttribute("data-target");
    var target = selector && document.querySelector(selector);

    if (target) {
      // The same form is never drawn twice in the same place (a page may run the script more than once).
      if (target.querySelector('[data-formsender="' + code + '"]')) return;
      target.appendChild(host);
    } else if (document.body && document.body.contains(script)) {
      script.parentNode.insertBefore(host, script.nextSibling);
    } else {
      document.body.appendChild(host);
    }
  }

  // Too early (the page is still being read and what the form needs is not there yet): wait for it.
  var selector = script.getAttribute("data-target");
  var early = document.readyState === "loading" && (!document.body || (selector && !document.querySelector(selector)));
  if (early) document.addEventListener("DOMContentLoaded", mount);
  else mount();

  var root = host.attachShadow({ mode: "open" });
  root.appendChild(el("style", {}, BASE));
  var style = el("style", {});
  root.appendChild(style);
  var box = el("div", { id: ROOT, "data-theme": dark ? "dark" : false });
  root.appendChild(box);

  // Used by the dashboard to try a style while it is being written: the form follows it without being drawn again.
  var cssOverride = null;
  host.addEventListener("formsender:style", function (event) {
    cssOverride = String(event.detail);
    style.textContent = cssOverride;
  });

  function announce(type, detail) {
    host.dispatchEvent(new CustomEvent("formsender:" + type, { bubbles: true, composed: true, detail: detail }));
  }

  function draw(form) {
    style.textContent = cssOverride !== null ? cssOverride : form.css || "";
    var T = form.strings || {};
    var errors = {};
    var form_el = el("form", { novalidate: true });

    function control(field) {
      var common = { id: code + "-input-" + field.name, name: field.name, required: field.required, "aria-required": field.required ? "true" : false };

      if (field.type === "textarea") return el("textarea", Object.assign({ rows: 4 }, common));

      if (field.type === "select") {
        return el("select", common, [el("option", { value: "" }, T.select)].concat((field.options || []).map(function (option) {
          return el("option", { value: option }, option);
        })));
      }

      if (field.type === "checkbox") return el("input", Object.assign({ type: "checkbox", value: "1" }, common));
      if (field.type === "file") return el("input", Object.assign({ type: "file" }, common));

      return el("input", Object.assign({ type: INPUT_TYPES[field.type] || "text", autocomplete: field.type === "email" ? "email" : field.type === "phone" ? "tel" : "off" }, common, field.type === "number" ? { inputmode: "decimal", step: "any" } : {}));
    }

    form.fields.forEach(function (field) {
      var input = control(field);
      var label = el("label", { for: input.id }, [field.label, field.required ? el("span", { "aria-hidden": "true" }, "*") : ""]);
      var message = el("p", { id: code + "-error-" + field.name, hidden: true });
      input.setAttribute("aria-describedby", message.id);

      var wrapper;
      if (field.type === "checkbox") wrapper = el("div", { id: code + "-field-" + field.name }, [el("div", { id: code + "-check-" + field.name }, [input, label]), message]);
      else wrapper = el("div", { id: code + "-field-" + field.name }, [label, input, message]);

      errors[field.name] = { input: input, message: message, field: field };
      form_el.appendChild(wrapper);
    });

    form_el.appendChild(el("div", { id: code + "-extra", "aria-hidden": "true" }, [el("input", { type: "text", name: "_gotcha", tabindex: "-1", autocomplete: "off" })]));

    var button = el("button", { type: "submit" }, T.send);
    form_el.appendChild(button);

    // What happened after sending, right under the button: it stays until the person goes on (or a few seconds).
    var notice = el("p", { id: code + "-notice-sent", hidden: true, "aria-live": "polite" });
    form_el.appendChild(notice);
    var noticeTimer;
    function notify(message, bad) {
      clearTimeout(noticeTimer);
      notice.id = code + (bad ? "-notice-failed" : "-notice-sent");
      notice.setAttribute("role", bad ? "alert" : "status");
      notice.setAttribute("aria-live", bad ? "assertive" : "polite");
      notice.textContent = message;
      notice.hidden = false;
      if (!bad) noticeTimer = setTimeout(function () { notice.hidden = true; }, 8000);
    }

    function show(name, text) {
      var item = errors[name];
      if (!item) return;
      item.message.textContent = text || "";
      item.message.hidden = !text;
      if (text) item.input.setAttribute("aria-invalid", "true");
      else item.input.removeAttribute("aria-invalid");
    }

    function clear() { Object.keys(errors).forEach(function (name) { show(name, ""); }); }

    // The same checks the server makes, so most mistakes never leave the page.
    function problem(item) {
      var field = item.field;
      var input = item.input;
      var value = field.type === "file" ? (input.files && input.files.length ? "x" : "") : field.type === "checkbox" ? (input.checked ? "x" : "") : input.value.trim();

      if (field.required && !value) return field.type === "file" ? T.required_file : field.type === "checkbox" ? T.required_check : T.required;
      if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return T.invalid_email;
      if (value && field.type === "number" && isNaN(Number(value))) return T.invalid_number;
      return "";
    }

    form_el.addEventListener("input", function (event) { show(event.target.name, ""); });

    form_el.addEventListener("submit", function (event) {
      event.preventDefault();
      clear();

      var first;
      Object.keys(errors).forEach(function (name) {
        var text = problem(errors[name]);
        if (text) { show(name, text); first = first || errors[name].input; }
      });
      if (first) { first.focus(); return; }

      // Only the dashboard asks for this, to show how the form looks: nothing is sent.
      if (preview) return;
      notice.hidden = true;

      var body = new FormData();
      Object.keys(errors).forEach(function (name) {
        var item = errors[name];
        if (item.field.type === "file") { if (item.input.files.length) body.append(name, item.input.files[0]); }
        else if (item.field.type === "checkbox") body.append(name, item.input.checked ? "1" : "0");
        else if (item.input.value !== "") body.append(name, item.input.value);
      });
      body.append("_gotcha", form_el.elements._gotcha.value);

      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = "";
      button.appendChild(el("span", { id: code + "-spinner", "aria-hidden": "true" }));
      button.appendChild(document.createTextNode(T.sending));

      fetch(base + "/api/forms/" + code + "/submit", { method: "POST", headers: { Accept: "application/json" }, body: body })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) { return { response: response, data: data }; });
        })
        .then(function (result) {
          var status = result.response.status;

          if (result.response.ok) {
            form_el.reset();
            notify(T.sent);
            announce("sent", { id: result.data.data && result.data.data.id });
            return;
          }

          if (status === 422 && result.data.errors) {
            var firstInvalid;
            Object.keys(result.data.errors).forEach(function (name) {
              if (errors[name]) { show(name, result.data.errors[name][0]); firstInvalid = firstInvalid || errors[name].input; }
            });
            if (firstInvalid) { firstInvalid.focus(); notify(T.check_fields, true); announce("error", { status: status }); return; }
          }

          notify(result.data.code === "daily_limit" ? T.daily_limit : status === 429 ? T.too_many : status === 403 ? T.forbidden : status === 422 || status === 503 ? T.unavailable : T.failed, true);
          announce("error", { status: status });
        })
        .catch(function () {
          notify(T.offline, true);
          announce("error", { status: 0 });
        })
        .then(function () {
          button.disabled = false;
          button.removeAttribute("aria-busy");
          button.textContent = T.send;
        });
    });

    box.textContent = "";
    box.appendChild(form_el);

    // In the dashboard's preview every state is on show, so each can be styled: a field with a mistake, and both notices.
    if (preview) {
      var sampled = Object.keys(errors).filter(function (name) { return errors[name].field.type !== "checkbox" && errors[name].field.type !== "file"; })[0];
      if (sampled) show(sampled, T.required);
      notice.textContent = T.sent;
      notice.hidden = false;
      form_el.appendChild(el("p", { id: code + "-notice-failed", role: "alert" }, T.failed));
    }
  }

  box.appendChild(el("p", { id: code + "-note", role: "status" }, "Loading the form"));

  // The dashboard's own page for a form always looks the same, so it asks for the standard style.
  var standard = script.getAttribute("data-style") === "default" ? "?style=default" : "";

  fetch(base + "/api/forms/" + code + "/public" + standard, { headers: { Accept: "application/json" } })
    .then(function (response) {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(function (body) { draw(body.data); })
    .catch(function () {
      box.textContent = "";
      box.appendChild(el("p", { id: code + "-note", role: "alert" }, "This form is not available."));
    });
})();
