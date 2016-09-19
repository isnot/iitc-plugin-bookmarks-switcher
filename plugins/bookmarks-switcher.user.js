// ==UserScript==
// @id             iitc-plugin-bookmarks-switcher@isnot
// @name           IITC plugin: bookmarks switcher
// @category       Controls
// @version        0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @author         isnot
// @updateURL      none
// @downloadURL    none
// @description    [iitc-plugins] bookmarks switcher
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
  // ensure plugin framework is there, even if iitc is not yet loaded
  if (typeof window.plugin !== 'function') window.plugin = function() {};

  // PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.bkmrks_switcher = function() {};
  window.plugin.bkmrks_switcher.BOOKMARK_JSON_VOID = '{"maps":{"idOthers":{"label":"Others","state":1,"bkmrk":{}}},"portals":{"idOthers":{"label":"Others","state":1,"bkmrk":{}}}}';
  window.plugin.bkmrks_switcher.KEYS = {
    'BS0': 'plugin-bkmrks_switcher-slot0',
    'BS1': 'plugin-bkmrks_switcher-slot1',
    'BS2': 'plugin-bkmrks_switcher-slot2',
    'BS3': 'plugin-bkmrks_switcher-slot3',
    'BS4': 'plugin-bkmrks_switcher-slot4'
  };

  window.plugin.bkmrks_switcher.setupUI = function setupUI () {

    var status = '';
    $.each(window.plugin.bkmrks_switcher.KEYS, function(slot, key){
      var json = localStorage.getItem(key) || '';
      json = escapeHtmlSpecialChars(json).replace(/\"/g, '');
      var indicator = json.length ? '<span title="' + json + '">■</span>' : '□';
      status += '[' + slot.replace('BS', 'no.') + '] ' + indicator + " \n";
    });

    // Form
    var html_form = $('<form></form>', {addClass: 'bsUI_form'}).append($('<p></p>').html(status));

    var ui_line = $('<p></p>', {addClass: 'bsUI_line'});

    $('<span></span>', {id: 'bsUI_bk'}).text('[Bookmark] ').appendTo(ui_line);

    // Action
    var options = [];
    $.each({
      '→': 'copy',
      '←': 'restore'
    }, function (text, value) {
      options.push($('<option>', {value: value, text: text}));
    });
    $('<select>', {name: 'action', id: 'bsUI_action'}).append(options).appendTo(ui_line);

    // Slot
    options = [];
    $.each({
      'no.1': 'BS1',
      'no.2': 'BS2',
      'no.3': 'BS3',
      'no.4': 'BS4'
    }, function (text, value) {
      options.push($('<option>', {value: value, text: text}));
    });
    $('<select>', {name: 'slot', id: 'bsUI_slot'}).append(options).appendTo(ui_line);

    ui_line.appendTo(html_form);

    // Submit
    $('<p></p>').append($('<input />', {type: 'button', name: 'bs_submit', value: 'Subscribe', onclick: 'window.plugin.bkmrks_switcher.bsUI_func();'})).appendTo(html_form);

    // Repairing
    $('<p></p>').append($('<input />', {type: 'button', name: 'bs_Repairing', value: 'Repairing', onclick: "window.plugin.bkmrks_switcher.restoreBookmark('BS0');"})).appendTo(html_form);

    var html_div = $('<div></div>').append(html_form);

    dialog({
      title: 'Bookmark Switcher',
      html: html_div.html(),
      modal: true,
      id: 'bs-dialog',
      width: 480,
      position: {my: 'right center', at: 'center-60 center', of: window, collision: 'fit'}
    });

  };

  window.plugin.bkmrks_switcher.bsUI_func = function bsUI_func () {
    var action = $('#bsUI_action').val();
    var slot = $('#bsUI_slot').val();
    console.log('[BS] ', action, slot);

    if (action === 'copy') {
      window.plugin.bkmrks_switcher.backupBookmark(slot);
    }

    if (action === 'restore') {
      window.plugin.bkmrks_switcher.restoreBookmark(slot);
    }
  };

  window.plugin.bkmrks_switcher.backupTmp = function backupTmp () {
    window.plugin.bkmrks_switcher.backupBookmark('BS0');
  };

  window.plugin.bkmrks_switcher.backupBookmark = function backupBookmark (slot) {
    if (!window.plugin.bookmarks) {
      return;
    }
    var key = window.plugin.bkmrks_switcher.KEYS[slot];
    var data = JSON.stringify(window.plugin.bookmarks.bkmrksObj);
    localStorage.setItem(key, data);
  };

  window.plugin.bkmrks_switcher.restoreBookmark = function restoreBookmark (slot) {
    var key = window.plugin.bkmrks_switcher.KEYS[slot];
    var data = localStorage.getItem(key);
    window.plugin.bkmrks_switcher.overwriteBookmark(data);
  };

  window.plugin.bkmrks_switcher.overwriteBookmark = function overwriteBookmark (data) {
    if (!window.plugin.bookmarks) {
      return;
    }
    window.plugin.bkmrks_switcher.backupTmp();
    if (!data) {
      data = window.plugin.bkmrks_switcher.BOOKMARK_JSON_VOID;
    }
    window.plugin.bookmarks.bkmrksObj = JSON.parse(data);
    window.plugin.bookmarks.saveStorage();
    window.plugin.bookmarks.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', {'target': 'all', 'action': 'import'});
  };

  var setup = function() {
    $('#toolbox').append('<a onclick="window.plugin.bkmrks_switcher.setupUI();" title="BS">Switch Bookmarks</a>');
  };

  // PLUGIN END //////////////////////////////////////////////////////////

  setup.info = plugin_info; //add the script info data to the function as a property
  if(!window.bootPlugins) window.bootPlugins = [];
  window.bootPlugins.push(setup);
  // if IITC has already booted, immediately run the 'setup' function
  if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
