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
 *   data-style="default"          only for the dashboard's own page: the standard style, not the form's
 *   data-preview                  only for the dashboard: validates but never sends
 *
 * Events on the form's element: "formsender:sent" and "formsender:error" (it also accepts "formsender:style",
 * with CSS as the detail, to try a style without saving it).
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.getAttribute("data-form")) return;

  var code = script.getAttribute("data-form");
  var theme = script.getAttribute("data-theme") === "dark" ? "dark" : "light";
  var preview = script.hasAttribute("data-preview");
  var base = new URL(script.src, location.href).origin;
  var uid = "fs-" + code + "-";

  // What the form needs to work whatever its style says. The look itself comes from the form (its Design tab).
  var BASE = ":host{display:block;font:inherit;color:inherit}*{box-sizing:border-box}[hidden]{display:none!important}.honeypot{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}.note{margin:0;font-size:16px;opacity:.7}.inspector{position:fixed;z-index:2147483001;pointer-events:none;padding:6px 10px;font:16px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#f4f4fb;background:#14141f;border:1px solid #3a3a5c;border-radius:8px;box-shadow:0 10px 30px -10px rgba(0,0,0,.6);white-space:nowrap}";

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
  var box = el("div", { id: "formsender-form", class: theme === "dark" ? "dark" : "" });
  root.appendChild(box);

  // Used by the dashboard to try a style while it is being written: the form follows it without being drawn again.
  var cssOverride = null;
  host.addEventListener("formsender:style", function (event) {
    cssOverride = String(event.detail);
    style.textContent = cssOverride;
  });

  // Only in the dashboard's preview: pointing at any part of the form tells which CSS selector styles it.
  function inspect() {
    var tip = el("div", { class: "inspector", hidden: true });
    root.appendChild(tip);
    var marked = null;

    // The selector a person would write to change that element, as in the style they are editing.
    function selectorOf(node) {
      var tag = node.tagName.toLowerCase();
      var root_ = "#formsender-form";
      var inCheck = node.closest && node.closest(".check");
      if (node === box) return root_;
      if (tag === "form") return root_ + " form";
      if (tag === "input" && node.type === "checkbox") return root_ + " .check input";
      if (tag === "input" && node.type === "file") return root_ + ' input[type="file"]';
      if (tag === "label") return root_ + (inCheck ? " .check label" : " label");
      if (tag === "i" && node.closest(".toast")) return root_ + " .toast i";
      var known = ["field", "check", "required", "error", "note", "spinner", "toast"];
      for (var i = 0; i < known.length; i++) if (node.classList.contains(known[i])) return root_ + " ." + known[i];
      return root_ + " " + tag;
    }

    function clear() {
      if (marked) { marked.style.outline = ""; marked.style.outlineOffset = ""; marked = null; }
      tip.hidden = true;
    }

    function show(event) {
      var node = event.composedPath()[0];
      if (!node || node.nodeType !== 1 || node === tip || !box.contains(node)) return clear();
      if (marked !== node) {
        if (marked) { marked.style.outline = ""; marked.style.outlineOffset = ""; }
        marked = node;
        node.style.outline = "2px dashed #8b6bff";
        node.style.outlineOffset = "2px";
      }
      tip.textContent = selectorOf(node);
      tip.hidden = false;
      var width = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(event.clientX + 14, window.innerWidth - width - 8)) + "px";
      tip.style.top = Math.min(event.clientY + 18, window.innerHeight - tip.offsetHeight - 8) + "px";
    }

    root.addEventListener("mousemove", show);
    host.addEventListener("mouseleave", clear);
    // A touch screen has no hover: a tap shows it for a moment.
    root.addEventListener("click", function (event) { show(event); setTimeout(clear, 2500); });
  }
  if (preview) inspect();

  var toastTimer;
  function toast(message, bad) {
    var old = box.querySelector(".toast");
    if (old) old.remove();
    clearTimeout(toastTimer);
    var node = el("div", { class: "toast" + (bad ? " bad" : ""), role: bad ? "alert" : "status" }, [el("i", { "aria-hidden": "true" }), el("span", {}, message)]);
    box.appendChild(node);
    toastTimer = setTimeout(function () { node.remove(); }, 6000);
  }

  function announce(type, detail) {
    host.dispatchEvent(new CustomEvent("formsender:" + type, { bubbles: true, composed: true, detail: detail }));
  }

  function draw(form) {
    style.textContent = cssOverride !== null ? cssOverride : form.css || "";
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
      var label = el("label", { for: uid + field.name }, [field.label, field.required ? el("span", { class: "required", "aria-hidden": "true" }, "*") : ""]);
      var message = el("p", { class: "error", id: uid + field.name + "-err", hidden: true });
      input.setAttribute("aria-describedby", message.id);

      var wrapper;
      if (field.type === "checkbox") wrapper = el("div", { class: "field" }, [el("div", { class: "check" }, [input, label]), message]);
      else wrapper = el("div", { class: "field" }, [label, input, message]);

      errors[field.name] = { input: input, message: message, field: field };
      form_el.appendChild(wrapper);
    });

    form_el.appendChild(el("div", { class: "honeypot", "aria-hidden": "true" }, [el("input", { type: "text", name: "_gotcha", tabindex: "-1", autocomplete: "off" })]));

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

      // Only the dashboard asks for this, to show how the form looks: nothing is sent.
      if (preview) { toast("This is a preview: nothing was sent."); return; }

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
      button.appendChild(el("span", { class: "spinner", "aria-hidden": "true" }));
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
      box.appendChild(el("p", { class: "note", role: "alert" }, "This form is not available."));
    });
})();
