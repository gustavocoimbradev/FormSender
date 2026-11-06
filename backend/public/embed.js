/*
 * Form Sender embed script.
 *
 *   <script src="https://YOUR-API/embed.js" data-form="FORM_CODE" async></script>
 *
 * It draws the form right where the tag is, with the fields configured in the dashboard (edit the form there
 * and every page shows the change), sends it without leaving the page and tells the visitor with a small
 * notice at the bottom of the screen.
 *
 * Optional attributes on the tag:
 *   data-theme="light" | "dark"   colors of the form (default: light)
 *   data-target="#selector"       draw the form inside that element instead of next to the tag
 *
 * Events on the form's element: "formsender:sent" and "formsender:error".
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.getAttribute("data-form")) return;

  var code = script.getAttribute("data-form");
  var theme = script.getAttribute("data-theme") === "dark" ? "dark" : "light";
  var base = new URL(script.src, location.href).origin;
  var uid = "fs-" + code + "-";

  var CSS = [
    ":host{display:block;font:inherit;color:inherit}",
    "*{box-sizing:border-box}",
    ".fs{--text:#14141f;--muted:#6b6b80;--border:#d4d4e0;--field:#fff;--accent:#7c5cff;--accent2:#6f8cff;--danger:#d93a4a;--ok:#1f9d63;--toast:#14141f;--toast-text:#fff;font:inherit;color:var(--text);position:relative}",
    ".fs.dark{--text:#f4f4fb;--muted:#9a9ab2;--border:#2c2c44;--field:#12121f;--accent:#8b6bff;--danger:#ff6b7a;--ok:#3ddc97;--toast:#f4f4fb;--toast-text:#14141f}",
    ".fs form{display:grid;gap:16px;margin:0}",
    ".f{display:grid;gap:8px;min-width:0}",
    "label,.l{font-size:16px;font-weight:500;line-height:1.4}",
    ".req{color:var(--accent);margin-left:2px}",
    "input,textarea,select{width:100%;min-height:48px;padding:12px 14px;font:inherit;font-size:16px;color:var(--text);background:var(--field);border:1px solid var(--border);border-radius:12px;transition:border-color .2s ease-out,box-shadow .2s ease-out;appearance:none;-webkit-appearance:none}",
    "textarea{min-height:120px;resize:vertical}",
    "select{background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);background-position:calc(100% - 20px) 50%,calc(100% - 15px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:40px}",
    "input:hover,textarea:hover,select:hover{border-color:var(--muted)}",
    "input:focus,textarea:focus,select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%,transparent)}",
    "[aria-invalid=true]{border-color:var(--danger)}",
    "input[type=file]{padding:8px}",
    "input[type=file]::file-selector-button{font:inherit;font-size:16px;margin-right:12px;min-height:32px;padding:0 14px;color:var(--text);background:transparent;border:1px solid var(--border);border-radius:8px;cursor:pointer}",
    ".c{display:flex;align-items:center;gap:12px;min-height:44px}",
    ".c input{width:24px;min-height:24px;height:24px;padding:0;border-radius:6px;flex:none;cursor:pointer}",
    ".c input:checked{background:var(--accent);border-color:var(--accent);background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5 9-10'/%3E%3C/svg%3E\");background-size:16px;background-position:center;background-repeat:no-repeat}",
    ".c label{cursor:pointer}",
    ".err{margin:0;font-size:16px;line-height:1.4;color:var(--danger)}",
    "button{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;padding:0 24px;font:inherit;font-size:16px;font-weight:600;color:#fff;background:linear-gradient(90deg,var(--accent),var(--accent2));border:0;border-radius:12px;cursor:pointer;transition:filter .2s ease-out,opacity .2s ease-out}",
    "button:hover{filter:brightness(1.08)}",
    "button:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 50%,transparent);outline-offset:2px}",
    "button[disabled]{opacity:.6;cursor:progress}",
    ".spin{width:18px;height:18px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:r .7s linear infinite}",
    ".hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}",
    ".note{margin:0;font-size:16px;color:var(--muted)}",
    ".toast{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;gap:12px;width:max-content;max-width:min(calc(100vw - 32px),28rem);padding:14px 18px;font-size:16px;line-height:1.4;color:var(--toast-text);background:var(--toast);border-radius:14px;box-shadow:0 20px 50px -15px rgba(0,0,0,.5);transform:translate(-50%,0);animation:up .28s ease-out both}",
    ".toast i{flex:none;width:10px;height:10px;border-radius:50%;background:var(--ok)}",
    ".toast.bad i{background:var(--danger)}",
    "@keyframes r{to{transform:rotate(360deg)}}",
    "@keyframes up{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}",
    "@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}"
  ].join("");

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

  // Where the form goes: inside the target element, or right after the tag.
  var host = el("div", { "data-formsender": code });
  var target = script.getAttribute("data-target") && document.querySelector(script.getAttribute("data-target"));
  if (target) {
    // The same form is never drawn twice in the same place (a page may run the script more than once).
    if (target.querySelector('[data-formsender="' + code + '"]')) return;
    target.appendChild(host);
  } else script.parentNode.insertBefore(host, script.nextSibling);

  var root = host.attachShadow({ mode: "open" });
  root.appendChild(el("style", {}, CSS));
  var box = el("div", { class: "fs" + (theme === "dark" ? " dark" : "") });
  root.appendChild(box);

  var toastTimer;
  function toast(message, bad) {
    var old = root.querySelector(".toast");
    if (old) old.remove();
    clearTimeout(toastTimer);
    var node = el("div", { class: "toast" + (bad ? " bad" : ""), role: bad ? "alert" : "status" }, [el("i", { "aria-hidden": "true" }), el("span", {}, message)]);
    root.appendChild(node);
    toastTimer = setTimeout(function () { node.remove(); }, 6000);
  }

  function announce(type, detail) {
    host.dispatchEvent(new CustomEvent("formsender:" + type, { bubbles: true, composed: true, detail: detail }));
  }

  function draw(form) {
    var errors = {};
    var form_el = el("form", { novalidate: true });

    function control(field) {
      var id = uid + field.name;
      var common = { id: id, name: field.name, required: field.required, "aria-required": field.required ? "true" : false };

      if (field.type === "textarea") return el("textarea", Object.assign({ rows: 4 }, common));

      if (field.type === "select") {
        return el("select", common, [el("option", { value: "" }, "Select")].concat((field.options || []).map(function (option) {
          return el("option", { value: option }, option);
        })));
      }

      if (field.type === "checkbox") return el("input", Object.assign({ type: "checkbox", value: "1" }, common));
      if (field.type === "file") return el("input", Object.assign({ type: "file" }, common));

      return el("input", Object.assign({ type: INPUT_TYPES[field.type] || "text", autocomplete: field.type === "email" ? "email" : field.type === "phone" ? "tel" : "off" }, common, field.type === "number" ? { inputmode: "decimal", step: "any" } : {}));
    }

    form.fields.forEach(function (field) {
      var input = control(field);
      var label = el("label", { for: uid + field.name }, [field.label, field.required ? el("span", { class: "req", "aria-hidden": "true" }, "*") : ""]);
      var message = el("p", { class: "err", id: uid + field.name + "-err", hidden: true });
      input.setAttribute("aria-describedby", message.id);

      var wrapper;
      if (field.type === "checkbox") wrapper = el("div", { class: "f" }, [el("div", { class: "c" }, [input, label]), message]);
      else wrapper = el("div", { class: "f" }, [label, input, message]);

      errors[field.name] = { input: input, message: message, field: field };
      form_el.appendChild(wrapper);
    });

    form_el.appendChild(el("div", { class: "hp", "aria-hidden": "true" }, [el("input", { type: "text", name: "_gotcha", tabindex: "-1", autocomplete: "off" })]));

    var button = el("button", { type: "submit" }, "Send");
    form_el.appendChild(button);

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

      if (field.required && !value) return field.type === "file" ? "Choose a file." : field.type === "checkbox" ? "This box must be ticked." : "Fill in this field.";
      if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email.";
      if (value && field.type === "number" && isNaN(Number(value))) return "Enter a number.";
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
      button.appendChild(el("span", { class: "spin", "aria-hidden": "true" }));
      button.appendChild(document.createTextNode("Sending"));

      fetch(base + "/api/forms/" + code + "/submit", { method: "POST", headers: { Accept: "application/json" }, body: body })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) { return { response: response, data: data }; });
        })
        .then(function (result) {
          var status = result.response.status;

          if (result.response.ok) {
            form_el.reset();
            toast("Message sent!");
            announce("sent", { id: result.data.data && result.data.data.id });
            return;
          }

          if (status === 422 && result.data.errors) {
            var firstInvalid;
            Object.keys(result.data.errors).forEach(function (name) {
              if (errors[name]) { show(name, result.data.errors[name][0]); firstInvalid = firstInvalid || errors[name].input; }
            });
            if (firstInvalid) { firstInvalid.focus(); toast("Check the highlighted fields.", true); announce("error", { status: status }); return; }
          }

          toast(status === 429 ? "Too many attempts. Please wait a minute and try again." : status === 403 ? "This form cannot be sent from this site." : status === 422 || status === 503 ? "This form cannot receive messages right now." : "Could not send. Please try again.", true);
          announce("error", { status: status });
        })
        .catch(function () {
          toast("Could not send. Please check your connection and try again.", true);
          announce("error", { status: 0 });
        })
        .then(function () {
          button.disabled = false;
          button.removeAttribute("aria-busy");
          button.textContent = "Send";
        });
    });

    box.textContent = "";
    box.appendChild(form_el);
  }

  box.appendChild(el("p", { class: "note", role: "status" }, "Loading the form"));

  fetch(base + "/api/forms/" + code + "/public", { headers: { Accept: "application/json" } })
    .then(function (response) {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(function (body) { draw(body.data); })
    .catch(function () {
      box.textContent = "";
      box.appendChild(el("p", { class: "note", role: "alert" }, "This form is not available."));
    });
})();
