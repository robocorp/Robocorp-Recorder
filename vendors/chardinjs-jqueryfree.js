/**
  
  jQuery free version of ChardinJs
  leave a feedback or a suggestion to improve the       code in comments :)

  source: https://codepen.io/enricotoniato/pen/MwXWLo?editors=001
  
**/


var chardinJs = (function() {

  function fireEvent(obj, evt) {
    var fireOnThis = obj;
    if (document.createEvent) {
      var evObj = document.createEvent('MouseEvents');
      evObj.initEvent(evt, true, false);
      fireOnThis.dispatchEvent(evObj);
    } else if (document.createEventObject) { //IE
      var evObj = document.createEventObject();
      fireOnThis.fireEvent('on' + evt, evObj);
    }
  }

  function fadeOut(el, callback) {
    el.style.opacity = 1;

    (function fade() {
      if ((el.style.opacity -= .1) < 0) {
        el.style.display = "none";
        if (callback) callback()
      } else {
        requestAnimationFrame(fade);
      }
    })();
  }

  NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for (var i = this.length - 1; i >= 0; i--) {
      if (this[i] && this[i].parentElement) {
        this[i].parentElement.removeChild(this[i]);
      }
    }
  }

  function hasClass(el, name) {
    return new RegExp('(\\s|^)' + name + '(\\s|$)').test(el.className);
  }

  function addClass(el, name) {
    if (!hasClass(el, name)) {
      el.className += (el.className ? ' ' : '') + name;
    }
  }

  function removeClass(el, name) {
    if (hasClass(el, name)) {
      el.className = el.className.replace(new RegExp('(\\s|^)' + name + '(\\s|$)'), ' ').replace(/^\s+|\s+$/g, '');
    }
  }

  function chardinJs(el) {
    var _this = this;

    this.$el = document.querySelectorAll(el)[0];

    this.$el.dataStorage = {}

    window.onresize = function() {
      return _this.refresh();
    };
  }

  chardinJs.prototype.start = function() {
    var el, _i, _len, _ref;

    if (this._overlay_visible()) {
      return false;
    }
    this._add_overlay_layer();
    _ref = this.$el.querySelectorAll('[data-intro]');
    console.log(_ref)
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      this._show_element(el);
    }
    return fireEvent(this.$el, 'chardinJs:start');
  };

  chardinJs.prototype.toggle = function() {
    if (!this._overlay_visible()) {
      return this.start();
    } else {
      return this.stop();
    }
  };

  chardinJs.prototype.refresh = function() {
    var el, _i, _len, _ref, _results;

    if (this._overlay_visible()) {
      _ref = this.$el.querySelectorAll('[data-intro]');
      console.log(_ref)
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        _results.push(this._position_helper_layer(el));
      }
      return _results;
    } else {
      return this;
    }
  };

  chardinJs.prototype.stop = function() {
    fadeOut(document.querySelectorAll(".chardinjs-overlay")[0], function() {

      document.getElementsByClassName("chardinjs-overlay").remove();

    });

    document.getElementsByClassName("chardinjs-helper-layer").remove();

    var search = document.querySelectorAll('.chardinjs-show-element').length
    for (var i = 0; i < search; i++) {
      removeClass(document.querySelectorAll('.chardinjs-show-element')[search - 1 - i], "chardinjs-show-element");
    }

    var search = document.querySelectorAll('.chardinjs-relative-position').length
    for (var i = 0; i < search; i++) {
      removeClass(document.querySelectorAll('.chardinjs-relative-position')[search - 1 - i], "chardinjs-relative-position");
    }

    if (window.removeEventListener) {
      window.removeEventListener("keydown", this._onKeyDown, true);
    } else {
      if (document.detachEvent) {
        document.detachEvent("onkeydown", this._onKeyDown);
      }
    }
    return fireEvent(this.$el, 'chardinJs:stop');
  };

  chardinJs.prototype._overlay_visible = function() {
    console.log(this.$el.querySelectorAll('.chardinjs-overlay').length !== 0)
    return this.$el.querySelectorAll('.chardinjs-overlay').length !== 0;
  };

  chardinJs.prototype._add_overlay_layer = function() {
    var element_position, overlay_layer, styleText,
      _this = this;

    if (this._overlay_visible()) {
      return false;
    }
    overlay_layer = document.createElement("div");
    styleText = "";
    overlay_layer.className = "chardinjs-overlay";
    if (this.$el.tagName === "BODY") {
      styleText += "top: 0;bottom: 0; left: 0;right: 0;position: fixed;";
      overlay_layer.setAttribute("style", styleText);
    } else {
      element_position = this._get_offset(this.$el);
      if (element_position) {
        styleText += "width: " + element_position.width + "px; height:" + element_position.height + "px; top:" + element_position.top + "px;left: " + element_position.left + "px;";
        overlay_layer.setAttribute("style", styleText);
      }
    }
    this.$el.appendChild(overlay_layer);
    overlay_layer.onclick = function() {
      return _this.stop();
    };
    return setTimeout(function() {
      styleText += "opacity: .8;opacity: .8;-ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=80)';filter: alpha(opacity=80);";
      return overlay_layer.setAttribute("style", styleText);
    }, 10);
  };

  chardinJs.prototype._get_position = function(element) {
    return element.getAttribute('data-position') || 'bottom';
  };

  chardinJs.prototype._place_tooltip = function(element) {
    var my_height, my_width, target_element_position, target_height, target_width, tooltip_layer, tooltip_layer_position;

    tooltip_layer = element.dataStorage.tooltip_layer;
    tooltip_layer_position = this._get_offset(tooltip_layer);
    tooltip_layer.style.top = null;
    tooltip_layer.style.right = null;
    tooltip_layer.style.bottom = null;
    tooltip_layer.style.left = null;
    switch (this._get_position(element)) {
      case "top":
      case "bottom":
        target_element_position = this._get_offset(element);
        target_width = target_element_position.width;
        my_width = tooltip_layer.outerWidth;
        tooltip_layer.style.left = "" + ((target_width / 2) - (tooltip_layer_position.width / 2)) + "px";
        break;
      case "left":
      case "right":
        target_element_position = this._get_offset(element);
        target_height = target_element_position.height;
        my_height = tooltip_layer.offsetHeight;
        tooltip_layer.style.top = "" + ((target_height / 2) - (tooltip_layer_position.height / 2)) + "px";
    }
    switch (this._get_position(element)) {
      case "left":
        return tooltip_layer.style.left = "-" + (tooltip_layer_position.width - 34) + "px";
      case "right":
        return tooltip_layer.style.right = "-" + (tooltip_layer_position.width - 34) + "px";
      case "bottom":
        return tooltip_layer.style.bottom = "-" + tooltip_layer_position.height + "px";
      case "top":
        return tooltip_layer.style.top = "-" + tooltip_layer_position.height + "px";
    }
  };

  chardinJs.prototype._position_helper_layer = function(element) {
    var element_position, helper_layer;

    helper_layer = element.dataStorage.helper_layer;
    element_position = this._get_offset(element);
    return helper_layer.setAttribute("style", "width: " + element_position.width + "px; height:" + element_position.height + "px; top:" + element_position.top + "px; left: " + element_position.left + "px;");
  };

  chardinJs.prototype._show_element = function(element) {
    var current_element_position, element_position, helper_layer, tooltip_layer;

    element_position = this._get_offset(element);
    helper_layer = document.createElement("div");
    tooltip_layer = document.createElement("div");
    if (!element.dataStorage) {
      element.dataStorage = {}
    }
    element.dataStorage.helper_layer = helper_layer
    element.dataStorage.tooltip_layer = tooltip_layer;
    if (element.id) {
      helper_layer.setAttribute("data-id", element.id);
    }
    helper_layer.className = "chardinjs-helper-layer chardinjs-" + (this._get_position(element));
    this._position_helper_layer(element);
    this.$el.appendChild(helper_layer);
    tooltip_layer.className = "chardinjs-tooltip chardinjs-" + (this._get_position(element));
    tooltip_layer.innerHTML = "<div class='chardinjs-tooltiptext'>" + (element.getAttribute('data-intro')) + "</div>";
    helper_layer.appendChild(tooltip_layer);
    this._place_tooltip(element);
    element.className += " chardinjs-show-element";
    current_element_position = "";
    if (element.currentStyle) {
      current_element_position = element.currentStyle["position"];
    } else {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        current_element_position = document.defaultView.getComputedStyle(element, null).getPropertyValue("position");
      }
    }
    current_element_position = current_element_position.toLowerCase();
    if (current_element_position !== "absolute" && current_element_position !== "relative") {
      return element.className += " chardinjs-relative-position";
    }
  };

  chardinJs.prototype._get_offset = function(element) {
    var element_position, _x, _y;

    element_position = {
      width: element.offsetWidth,
      height: element.offsetHeight
    };
    _x = 0;
    _y = 0;
    while (element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
      _x += element.offsetLeft;
      _y += element.offsetTop;
      element = element.offsetParent;
    }
    element_position.top = _y;
    element_position.left = _x;
    return element_position;
  };

  return chardinJs;

})();

window.onload = function() {
  var c = new chardinJs("body");
  document.querySelectorAll('#chardinTrigger')[0].onclick = function(e) {
    e.preventDefault();
    c.toggle()

  };
}
