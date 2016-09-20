// ==UserScript==
// @id             iitc-plugin-bookmarks-switcher@isnot
// @name           IITC plugin: bookmarks switcher
// @category       Controls
// @version        0.2
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @author         isnot
// @updateURL      https://github.com/isnot/iitc-plugin-bookmarks-switcher/raw/master/plugins/bookmarks-switcher.user.js
// @downloadURL    https://github.com/isnot/iitc-plugin-bookmarks-switcher/raw/master/plugins/bookmarks-switcher.user.js
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

    var indicator = window.plugin.bkmrks_switcher.createIndicator();

    // Form
    var html_form = $('<form></form>', {addClass: 'bsUI_form'}).append($('<p></p>', {id: 'bsUI_indicator'}).html(indicator));

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

    $('<p></p>', {id: 'bsUI_messages'}).html('&nbsp;').appendTo(html_form);

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
    $('#bsUI_indicator').html(window.plugin.bkmrks_switcher.createIndicator(action, slot));
  };

  window.plugin.bkmrks_switcher.extractLabels = function extractLabels (json) {
    if (!json || json === window.plugin.bkmrks_switcher.BOOKMARK_JSON_VOID) {
      return '(no bookmarks)';
    }
    var obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') {
      return '(something wrong!)';
    }

    var text = '';
    ['maps', 'portals'].forEach(function(type){
      text += ' [' + type + '] ';
      $.each(obj[type], function(folderID, v){
        if (folderID === 'idOthers') {
          $.each(v.bkmrk, function(o, p){
            $.each(p, function(x, y){
              if ((typeof y !== 'object') && (x === 'label')) {
                text += y + ' ';
              }
            });
          });
        } else {
          $.each(v, function(x, y){
            if ((typeof y !== 'object') && (x === 'label')) {
              text += y + ' ';
            }
          });
        }
      });
    });

    return escapeHtmlSpecialChars(text).replace(/[\"\']/g, '');
  };

  window.plugin.bkmrks_switcher.createIndicator = function createIndicator (action, slot) {
    if (action && slot) {
      $('#bsUI_messages').text(action + ' ' + slot.replace(/BS/, 'no.')).fadeOut(
        3000,
        function(){
          $('#bsUI_messages').html('&nbsp;').fadeIn();
        }
      );
    }

    var status = '';
    $.each(window.plugin.bkmrks_switcher.KEYS, function(slot, key){
      var json = localStorage.getItem(key) || '';
      var mark;
      if (json.length) {
        var text = window.plugin.bkmrks_switcher.extractLabels(json);
        var indexColor = json.length % 8;
        var colors = [' bsUI_colorRed', ' bsUI_colorBlue', ' bsUI_colorYellow', ' bsUI_colorPurpule', ' bsUI_colorPink', ' bsUI_colorGreen', ' bsUI_colorBeige', ' bsUI_colorOrange', ''];
        mark = '<span class="bsUI_slotstat' + colors[indexColor] + '" title="' + text + '">■</span>';
      } else {
        mark = '<span class="bsUI_slotstat">□</span>';
      }
      status += '[' + slot.replace('BS', 'no.') + '] ' + mark + " \n";
    });
    return status;
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
    if (slot === 'BS0') {
      $('#bsUI_indicator').html(window.plugin.bkmrks_switcher.createIndicator('Repairing via ', slot));
    }
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

  window.plugin.bkmrks_switcher.setupCSS = function() {
    var css = '#bsUI_messages {font-size: 20px; color: red;} ' +
        '#bsUI_indicator {background: white; color: black; padding: 5px;} ' +
        '.bsUI_slotstat {font-size: 30px; margin-right: 10px; vertical-align: -5px;} ' +
        '.bsUI_colorRed     {color: #ff3300;} ' +
        '.bsUI_colorBlue    {color: #b4ebfa;} ' +
        '.bsUI_colorYellow  {color: #ffff99;} ' +
        '.bsUI_colorPurpule {color: #c7b2de;} ' +
        '.bsUI_colorPink    {color: #ffd1d1;} ' +
        '.bsUI_colorGreen   {color: #87e7b0;} ' +
        '.bsUI_colorBeige   {color: #edc58f;} ' +
        '.bsUI_colorOrange  {color: #ff9900;} ';

    $('<style>')
      .prop('type', 'text/css')
      .html(css)
      .appendTo('head');
  };

  var setup = function() {
    window.plugin.bkmrks_switcher.setupCSS();
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
