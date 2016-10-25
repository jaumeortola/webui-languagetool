/*
 * atd.core.js - A building block to create a front-end for AtD
 * Author      : Raphael Mudge, Automattic; Daniel Naber, LanguageTool.org
 * License     : LGPL
 * Project     : http://www.afterthedeadline.com/developers.slp
 * Contact     : raffi@automattic.com
 *
 * Note: this has been simplified for use with LanguageTool - it now assumes there's no markup 
 * anymore in the text field (not even bold etc)!
 */

/* EXPORTED_SYMBOLS is set so this file can be a JavaScript Module */
var EXPORTED_SYMBOLS = ['AtDCore'];

//
// TODO:
// 1. "ignore" and "ignore this kind of error" only works until the next check
// 2. Ctrl-Z (undo) make the error markers go away
//
// fixed: cursor position gets lost on check
// fixed: "ignore all" doesn't work
// fixed: current cursor position is ignored when incorrect (it has its own node)
// fixed: text with markup (even bold) messes up everything
//

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

function AtDCore() {
    /* Localized strings */
    this.i18n = {};
    /* We have to mis-use an existing valid HTML attribute to get our meta information
     * about errors in the text: */
    this.surrogateAttribute = "onkeypress";
    this.surrogateAttributeDelimiter = "---#---";
};

/*
 * Internationalization Functions
 */

AtDCore.prototype.getLang = function(key, defaultk) {
    if (this.i18n[key] == undefined)
        return defaultk;

    return this.i18n[key];
};

AtDCore.prototype.addI18n = function(localizations) {
    this.i18n = localizations;
};

/*
 * Setters
 */

AtDCore.prototype.processJSON = function(responseJSON) {
    var json = jQuery.parseJSON(responseJSON);
    this.suggestions = [];
    for (var key in json.matches) {
        var match = json.matches[key];
        var suggestion = {};
        // I didn't manage to make the CSS break the text, so we add breaks with Javascript:
        suggestion["description"] = this._wordwrap(match.message, 50, "<br/>");
        suggestion["suggestions"] = [];
        var suggestions = [];
        for (var k = 0; k < match.replacements.length; k++) {
            var repl = match.replacements[k];
            if (repl.value) {
                suggestions.push(repl.value);
            } else {
                suggestions.push(repl);  //TODO: remove this case, it's for an old API version
            }
        }
        suggestion["suggestions"] = suggestions.join("#");
        suggestion["offset"]      = match.offset;
        suggestion["errorlength"] = match.length;
        suggestion["type"]        = match.rule.category.name;
        suggestion["ruleid"]      = match.rule.id;
        suggestion["subid"]       = match.rule.subId || 0;
        suggestion["its20type"]   = match.rule.issueType;
        suggestion["context"]     = match.context.text;
        suggestion["contextoffset"] = match.context.offset;
        var urls = match.rule.urls;
        if (urls && urls.length > 0) {
            if (urls[0].value) {
                suggestion["moreinfo"] = urls[0].value;
            } else {
                suggestion["moreinfo"] = urls[0];  //TODO: remove this case, it's for an old API version
            }
        }
        this.suggestions.push(suggestion);
    }
    return this.suggestions;
};

// Wrapper code by James Padolsey
// Source: http://james.padolsey.com/javascript/wordwrap-for-javascript/
// License: "This is free and unencumbered software released into the public domain.",
// see http://james.padolsey.com/terms-conditions/
AtDCore.prototype._wordwrap = function(str, width, brk, cut) {
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;
    if (!str) { return str; }
    var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
    return str.match( new RegExp(regex, 'g') ).join( brk );
};
// End of wrapper code by James Padolsey

AtDCore.prototype.findSuggestion = function(element) {
    var text = element.innerHTML;
    var metaInfo = element.getAttribute(this.surrogateAttribute);
    var errorDescription = {};
    errorDescription["id"] = this.getSurrogatePart(metaInfo, 'id');
    errorDescription["subid"] = this.getSurrogatePart(metaInfo, 'subid');
    errorDescription["description"] = this.getSurrogatePart(metaInfo, 'description');
    errorDescription["coveredtext"] = this.getSurrogatePart(metaInfo, 'coveredtext');
    errorDescription["context"] = this.getSurrogatePart(metaInfo, 'context');
    errorDescription["contextoffset"] = this.getSurrogatePart(metaInfo, 'contextoffset');
    var suggestions = this.getSurrogatePart(metaInfo, 'suggestions');
    if (suggestions) {
        errorDescription["suggestions"] = suggestions.split("#");
    } else {
        errorDescription["suggestions"] = "";
    }
    var url = this.getSurrogatePart(metaInfo, 'url');
    if (url) {
        errorDescription["moreinfo"] = url;
    }
    return errorDescription;
};

/* 
 * code to manage highlighting of errors
 */
AtDCore.prototype.markMyWords = function() {
    var ed = tinyMCE.activeEditor;
    var textWithCursor = this.getPlainTextWithCursorMarker();
    var cursorPos = textWithCursor.indexOf("\ufeff");
    var newText = this.getPlainText();
    
    var previousSpanStart = -1;
    // iterate backwards as we change the text and thus modify positions:
    for (var suggestionIndex = this.suggestions.length-1; suggestionIndex >= 0; suggestionIndex--) {
        var suggestion = this.suggestions[suggestionIndex];
        if (!suggestion.used) {
            var spanStart = suggestion.offset;
            var spanEnd = spanStart + suggestion.errorlength;
            if (previousSpanStart != -1 && spanEnd > previousSpanStart) {
                // overlapping errors - these are not supported by our underline approach,
                // as we would need overlapping <span>s for that, so skip the error:
                continue;
            }
            previousSpanStart = spanStart;
            
            var ruleId = suggestion.ruleid;
            var locqualityissuetype = suggestion.its20type;
            var cssName;
            if (locqualityissuetype == "misspelling") {
                cssName = "hiddenSpellError";
            }
            else if (locqualityissuetype == "style" || locqualityissuetype == "locale-violation") {
                cssName = "hiddenGreenError";
            }
            else {
                cssName = "hiddenGrammarError";
            }
            var delim = this.surrogateAttributeDelimiter;
            var coveredText = newText.substring(spanStart, spanEnd);
            var metaInfo = ruleId + delim + suggestion.subid + delim + suggestion.description + delim 
		+ suggestion.suggestions + delim + coveredText + delim + suggestion.context + delim + suggestion.contextoffset;
	    //var metaInfo = ruleId + delim + suggestion.description + delim + suggestion.suggestions;
            if (suggestion.moreinfo) {
                metaInfo += delim + suggestion.moreinfo;
            }
            metaInfo = metaInfo.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
                    .replace(/</g, "&lt;").replace(/>/g, "&gt;");  // escape HTML
            newText = newText.substring(0, spanStart)
                    + '<span ' + this.surrogateAttribute + '="' + metaInfo + '" class="' + cssName + '">'
                    + newText.substring(spanStart, spanEnd)
                    + '</span>'
                    + newText.substring(spanEnd);
            suggestion.used = true;
        }
    }
    
    // now insert a span into the location of the original cursor position,
    // only considering real text content of course:
    newText = this._insertCursorSpan(newText, cursorPos);
    
    newText = newText.replace(/^\n/, "");
    newText = newText.replace(/^\n/, "");
    newText = newText.replace(/\n/g, "<br/>");
    ed.setContent(newText);
    // now place the cursor where it was:
    ed.selection.select(ed.dom.select('span#caret_pos_holder')[0]);
    ed.dom.remove(ed.dom.select('span#caret_pos_holder')[0]);
};

AtDCore.prototype._insertCursorSpan = function(text, cursorPos) {
    var newTextParts = text.split(/([<>])/);
    var inTag = 0;
    var textPos = 0;
    var stringPos = 0;
    for (var i = 0; i < newTextParts.length; i++) {
        if (newTextParts[i] == "<" || newTextParts[i] == ">") {
            if (newTextParts[i] == "<") {
                inTag++;
            } else {
                inTag--;
            }
        } else if (inTag == 0) {
            var partLength = newTextParts[i].length;
            if (cursorPos >= textPos && cursorPos <= textPos + partLength) {
                var relativePos = cursorPos - textPos;
                text = text.insert(stringPos + relativePos, "<span id='caret_pos_holder'></span>");
                break;
            }
            textPos += partLength;
        }
        stringPos += newTextParts[i].length;
    }
    return text;
};

AtDCore.prototype.getSurrogatePart = function(surrogateString, part) {
    var parts = surrogateString.split(this.surrogateAttributeDelimiter);
    if (part == 'id') {
        return parts[0];
    } else if (part == 'subid') {
        return parts[1];
    } else if (part == 'description') {
        return parts[2];
    } else if (part == 'suggestions') {
        return parts[3];
    } else if (part == 'coveredtext') {
        return parts[4];
    } else if (part == 'context') {
        return parts[5];
    } else if (part == 'contextoffset') {
        return parts[6];
    } else if (part == 'url' && parts.length >= 7) {
        return parts[7];
    }
    console.log("No part '" + part + "' found in surrogateString: " + surrogateString);
    return null;
};

AtDCore.prototype.getPlainTextWithCursorMarker = function() {
    return this._getPlainText(false);
};

AtDCore.prototype.getPlainText = function() {
    return this._getPlainText(true);
};

AtDCore.prototype._getPlainText = function(removeCursor) {
    var plainText = tinyMCE.activeEditor.getContent({ format: 'raw' })
            .replace(/<p>/g, "\n\n")
            .replace(/<br>/g, "\n")
            .replace(/<br\s*\/>/g, "\n")
            .replace(/<.*?>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            //.replace(/&gt;/g, ">")  // TODO: using '>' still gets converted to '&gt;' for the user - with this line the HTML gets messed up somtimes
            .replace(/&nbsp;/g, " ");
    if (removeCursor) {
        plainText = plainText.replace(/\ufeff/g, "");  // feff = 65279 = cursor code
    }
    return plainText;
};

AtDCore.prototype.removeWords = function(node, w) {
    var count = 0;
    var parent = this;

    this.map(this.findSpans(node).reverse(), function(n) {
        if (n && (parent.isMarkedNode(n) || parent.hasClass(n, 'mceItemHidden') || parent.isEmptySpan(n)) ) {
            if (n.innerHTML == '&nbsp;') {
                var nnode = document.createTextNode(' '); /* hax0r */
                parent.replaceWith(n, nnode);
            } else if (!w || n.innerHTML == w) {
                parent.removeParent(n);
                count++;
            }
        }
    });

    return count;
};

AtDCore.prototype.removeWordsByRuleId = function(node, ruleId) {
    var count = 0;
    var parent = this;

    this.map(this.findSpans(node).reverse(), function(n) {
        if (n && (parent.isMarkedNode(n) || parent.hasClass(n, 'mceItemHidden') || parent.isEmptySpan(n)) ) {
            if (n.innerHTML == '&nbsp;') {
                var nnode = document.createTextNode(' '); /* hax0r */
                parent.replaceWith(n, nnode);
            } else {
                var surrogate = n.getAttribute(parent.surrogateAttribute);
                if (!ruleId || (surrogate && parent.getSurrogatePart(surrogate, 'id') == ruleId)) {
                    parent.removeParent(n);
                    count++;
                }
            }
        }
    });

    return count;
};

AtDCore.prototype.isEmptySpan = function(node) {
    return (this.getAttrib(node, 'class') == "" && this.getAttrib(node, 'style') == "" && this.getAttrib(node, 'id') == "" && !this.hasClass(node, 'Apple-style-span') && this.getAttrib(node, 'mce_name') == "");
};

AtDCore.prototype.isMarkedNode = function(node) {
    return (this.hasClass(node, 'hiddenGrammarError') || this.hasClass(node, 'hiddenGreenError') || this.hasClass(node, 'hiddenSpellError') || this.hasClass(node, 'hiddenSuggestion'));
};

/*
 * Context Menu Helpers
 */
AtDCore.prototype.applySuggestion = function(element, suggestion) {
    if (suggestion == '(omit)') {
        this.remove(element);
    }
    else {
        var node = this.create(suggestion);
        this.replaceWith(element, node);
        this.removeParent(node);
    }
};

/* 
 * Check for an error
 */
AtDCore.prototype.hasErrorMessage = function(xmlr) {
    return (xmlr != undefined && xmlr.getElementsByTagName('message').item(0) != null);
};

AtDCore.prototype.getErrorMessage = function(xmlr) {
    return xmlr.getElementsByTagName('message').item(0);
};

/* this should always be an error, alas... not practical */
AtDCore.prototype.isIE = function() {
    return navigator.appName == 'Microsoft Internet Explorer';
};
/*
 * TinyMCE Writing Improvement Tool Plugin 
 * Original Author: Raphael Mudge (raffi@automattic.com)
 * Heavily modified by Daniel Naber for LanguageTool (http://www.languagetool.org)
 *
 * http://www.languagetool.org
 * http://www.afterthedeadline.com
 *
 * Distributed under the LGPL
 *
 * Derived from:
 *    $Id: editor_plugin_src.js 425 2007-11-21 15:17:39Z spocke $
 *
 *    @author Moxiecode
 *    @copyright Copyright (C) 2004-2008, Moxiecode Systems AB, All rights reserved.
 *
 *    Moxiecode Spell Checker plugin released under the LGPL with TinyMCE
 */

(function() 
{
   var JSONRequest = tinymce.util.JSONRequest, each = tinymce.each, DOM = tinymce.DOM; 

   tinymce.create('tinymce.plugins.AfterTheDeadlinePlugin', 
   {
      getInfo : function() 
      {
         return 
         ({
            longname :  'After The Deadline / LanguageTool',
            author :    'Raphael Mudge, Daniel Naber',
            authorurl : 'http://blog.afterthedeadline.com',
            infourl :   'http://www.afterthedeadline.com',
            version :   tinymce.majorVersion + "." + tinymce.minorVersion
         });
      },

      /* initializes the functions used by the AtD Core UI Module */
      initAtDCore : function(editor, plugin)
      {
         var core = new AtDCore();

         core.map = each;

         core.getAttrib = function(node, key) 
         { 
            return editor.dom.getAttrib(node, key); 
         };

         core.findSpans = function(parent) 
         {
            if (parent == undefined)
               return editor.dom.select('span');
            else
               return editor.dom.select('span', parent);
         };

         core.hasClass = function(node, className) 
         { 
            return editor.dom.hasClass(node, className); 
         };
         
         core.contents = function(node) 
         { 
            return node.childNodes;  
         };

         core.replaceWith = function(old_node, new_node) 
         { 
            return editor.dom.replace(new_node, old_node); 
         };

         core.create = function(node_html) 
         { 
            return editor.dom.create('span', { 'class': 'mceItemHidden' }, node_html);
         };

         core.removeParent = function(node) 
         {
            editor.dom.remove(node, 1);
            return node;
         };

         core.remove = function(node) 
         { 
            editor.dom.remove(node); 
         };

         core.getLang = function(key, defaultk) 
         { 
             return editor.getLang("AtD." + key, defaultk);
         };

         return core;
      },
 
      /* called when the plugin is initialized */
      init : function(ed, url) 
      {
         var t = this;
         var plugin  = this;
         var editor  = ed;
         var core = this.initAtDCore(editor, plugin);

         this.url    = url;
         this.editor = ed;
         this.menuVisible = false;
         ed.core = core;

         /* add a command to request a document check and process the results. */
         editor.addCommand('mceWritingImprovementTool', function(languageCode, catOptions)
         {
             
            if (plugin.menuVisible) {
              plugin._menu.hideMenu();
            }

            /* checks if a global var for click stats exists and increments it if it does... */
            if (typeof AtD_proofread_click_count != "undefined")
               AtD_proofread_click_count++;

            /* create the nifty spinny thing that says "hizzo, I'm doing something fo realz" */
            plugin.editor.setProgressState(1);

            /* remove the previous errors */
            plugin._removeWords();

            /* send request to our service */
            var textContent = plugin.editor.core.getPlainText();
            plugin.sendRequest('', textContent, languageCode, catOptions, function(data, request, someObject)
            {
               /* turn off the spinning thingie */
               plugin.editor.setProgressState(0);

               /* if the server is not accepting requests, let the user know */
               if (request.responseText.substr(0, 6) == 'Error:')
               {
                  // the simple proxy turns code 500 responses into code 200 responses, but lets handle at least this error case:
                  ed.windowManager.alert(request.responseText);
                  return;
               }

               if (request.status != 200 || request.responseText.substr(1, 4) == 'html' || request.responseText == '')
               {
                  ed.windowManager.alert( plugin.editor.getLang('AtD.message_server_error', 'There was a problem communicating with the service. Try again in one minute.') );
                  return;
               }

               var results = core.processJSON(request.responseText);

               if (results.length == 0) {
                  var lang = plugin.editor.getParam('languagetool_i18n_current_lang')();
                  var noErrorsText = plugin.editor.getParam('languagetool_i18n_no_errors')[lang] || "No errors were found.";
                  ed.windowManager.alert(noErrorsText);
               }
               else {
                  plugin.markMyWords();
                  ed.suggestions = results; 
               }
            });
         });
          
         /* load cascading style sheet for this plugin */
          editor.onInit.add(function() 
         {
            /* loading the content.css file, why? I have no clue */
            if (editor.settings.content_css !== false)
            {
               editor.dom.loadCSS(editor.getParam("languagetool_css_url", url + '/css/content.css'));
            }
         });

         /* again showing a menu, I have no clue what */
         editor.onClick.add(plugin._showMenu, plugin);

         /* comment this in and comment out the line below to get the browser's standard context menu on right click: */
         editor.onContextMenu.add(plugin._showMenu, plugin);
         // without this, the context menu opens but nothing in it can be selected:
         //editor.onContextMenu.add(plugin._doNotShowMenu, plugin);

         /* strip out the markup before the contents is serialized (and do it on a copy of the markup so we don't affect the user experience) */
         editor.onPreProcess.add(function(sender, object) 
         {
            var dom = sender.dom;

            each(dom.select('span', object.node).reverse(), function(n) 
            {
               if (n && (dom.hasClass(n, 'hiddenGrammarError') || dom.hasClass(n, 'hiddenGreenError') || dom.hasClass(n, 'hiddenSpellError') || dom.hasClass(n, 'hiddenSuggestion') || dom.hasClass(n, 'mceItemHidden') || (dom.getAttrib(n, 'class') == "" && dom.getAttrib(n, 'style') == "" && dom.getAttrib(n, 'id') == "" && !dom.hasClass(n, 'Apple-style-span') && dom.getAttrib(n, 'mce_name') == ""))) 
               {
                  dom.remove(n, 1);
               }
            });
         });

         /* cleanup the HTML before executing certain commands */
         editor.onBeforeExecCommand.add(function(editor, command) 
         {
            if (command == 'mceCodeEditor')
            {
               plugin._removeWords();
            }
            else if (command == 'mceFullScreen')
            {
               plugin._done();
            }
         });
      },

      createControl : function(name, controlManager) 
      {
      },

      _serverLog : function(type, errorDescription, suggestion, suggestion_position)
      {
	  var data = {"type": type,
                      "rule_id": errorDescription["id"],
                      "rule_sub_id": errorDescription["subid"],
		      "incorrect_text": errorDescription["coveredtext"],
                      "incorrect_position": errorDescription["contextoffset"],
		      "context": errorDescription["context"],
                      "suggestion": suggestion,
		      "suggestion_position": suggestion_position};
	  jQuery.ajax({
	      url: 'https://www.softcatala.org/languagetool/feedback/log',
	      type: 'POST',
	      data: JSON.stringify(data),
	      contentType: 'application/json; charset=utf-8',
	      dataType: 'json',
	  });
      },

      _removeWords : function(w) 
      {
         var ed = this.editor, dom = ed.dom, se = ed.selection, b = se.getBookmark();

         ed.core.removeWords(undefined, w);

         /* force a rebuild of the DOM... even though the right elements are stripped, the DOM is still organized
            as if the span were there and this breaks my code */

         dom.setHTML(dom.getRoot(), dom.getRoot().innerHTML);

         se.moveToBookmark(b);
      },

      _removeWordsByRuleId : function(ruleId) 
      {
         var ed = this.editor, dom = ed.dom, se = ed.selection, b = se.getBookmark();

         ed.core.removeWordsByRuleId(undefined, ruleId);

         /* force a rebuild of the DOM... even though the right elements are stripped, the DOM is still organized
            as if the span were there and this breaks my code */

         dom.setHTML(dom.getRoot(), dom.getRoot().innerHTML);

         se.moveToBookmark(b);
      },

      markMyWords : function()
      {
         var ed  = this.editor;
         var se = ed.selection, b = se.getBookmark();

         ed.core.markMyWords();

         se.moveToBookmark(b);
      },

      _doNotShowMenu : function(ed, e) 
      {
        return tinymce.dom.Event.cancel(e);
      },
       
      _showMenu : function(ed, e) 
      {
         var t = this, ed = t.editor, m = t._menu, p1, dom = ed.dom, vp = dom.getViewPort(ed.getWin());
         var plugin = this;

         if (!m) 
         {
            p1 = DOM.getPos(ed.getContentAreaContainer());
            //p2 = DOM.getPos(ed.getContainer());

            m = ed.controlManager.createDropMenu('spellcheckermenu', 
            {
               offset_x : p1.x,
               offset_y : p1.y,
               'class' : 'mceNoIcons'
            });

            t._menu = m;
         }
         
         if (this.menuVisible) {
             // second click: close popup again
             m.hideMenu();
             this.menuVisible = false;
             return;
         }

         if (ed.core.isMarkedNode(e.target))
         {
            /* remove these other lame-o elements */
            m.removeAll();

            /* find the correct suggestions object */
            var errorDescription = ed.core.findSuggestion(e.target);

            if (errorDescription == undefined)
            {
               m.add({title : plugin.editor.getLang('AtD.menu_title_no_suggestions', 'No suggestions'), 'class' : 'mceMenuItemTitle'}).setDisabled(1);
            }
            else if (errorDescription["suggestions"].length == 0)
            {
               m.add({title : errorDescription["description"], 'class' : 'mceMenuItemTitle'}).setDisabled(1);
            }
            else
            {
               m.add({ title : errorDescription["description"], 'class' : 'mceMenuItemTitle' }).setDisabled(1);

               for (var i = 0; i < errorDescription["suggestions"].length; i++)
               {
                  if (i >= 10) { //max number of suggestions shown
                      break;
                  }
                  (function(sugg)
                   {
                      var iTmp = i;
                      m.add({
                         title   : sugg, 
                         onclick : function() 
                         {
                            ed.core.applySuggestion(e.target, sugg);
                            t._serverLog('AcceptCorrection', errorDescription, sugg, iTmp);
                            t._checkDone();
                         }
                      });
                   })(errorDescription["suggestions"][i]);
               }

               m.addSeparator();
            }
             
            var lang = plugin.editor.getParam('languagetool_i18n_current_lang')();
            var explainText = plugin.editor.getParam('languagetool_i18n_explain')[lang] || "Explain...";
            var ignoreThisText = plugin.editor.getParam('languagetool_i18n_ignore_once')[lang] || "Ignore this error";
            var editManually = plugin.editor.getParam('languagetool_i18n_edit_manually')[lang] || "Edit manually";
            var ruleImplementation = "Rule implementation";
            if (plugin.editor.getParam('languagetool_i18n_rule_implementation')) {
              ruleImplementation = plugin.editor.getParam('languagetool_i18n_rule_implementation')[lang] || "Rule implementation";
            }
            var suggestWord = "Suggest word for dictionary...";
            if (plugin.editor.getParam('languagetool_i18n_suggest_word')) {
              suggestWord = plugin.editor.getParam('languagetool_i18n_suggest_word')[lang] || "Suggest word for dictionary...";
            }
            var suggestWordUrl;
            if (plugin.editor.getParam('languagetool_i18n_suggest_word_url')) {
              suggestWordUrl = plugin.editor.getParam('languagetool_i18n_suggest_word_url')[lang];
            }
            var ruleId = errorDescription["id"];
            var isSpellingRule = ruleId.indexOf("MORFOLOGIK_RULE") != -1 || ruleId.indexOf("SPELLER_RULE") != -1;
            if (suggestWord && suggestWordUrl && isSpellingRule) {
              var newUrl = suggestWordUrl.replace(/{word}/, encodeURIComponent(errorDescription['coveredtext']));
              (function(url)
              {
                m.add({
                  title : suggestWord,
                  onclick : function() { window.open(newUrl, '_suggestWord'); }
                });
              })(errorDescription[suggestWord]);
              m.addSeparator();
            }

            //var ignoreThisKindOfErrorText = plugin.editor.getParam('languagetool_i18n_ignore_all')[lang] || "Ignore this kind of error";
            
            if (errorDescription != undefined && errorDescription["moreinfo"] != null)
            {
               (function(url)
                {
                   m.add({
                     title : explainText,
                     onclick : function() { window.open(url, '_errorExplain'); }
                  });
               })(errorDescription["moreinfo"]);
               m.addSeparator();
            }

            m.add({
               title : editManually,
               onclick : function() 
               {
                  dom.remove(e.target, 1);
                  t._serverLog('EditManually', errorDescription, '', -1);
                  t._checkDone();
               }
            });

            m.add({
               title : ignoreThisText,
               onclick : function() 
               {
                  dom.remove(e.target, 1);
                  t._serverLog('IgnoreRule', errorDescription, '', -1);
                  t._checkDone();
               }
            });
	         /*
		       var langCode = lang; //$('#lang').val();
            // NOTE: this link won't work (as of March 2014) for false friend rules:
            var ruleUrl = "http://community.languagetool.org/rule/show/" +
              encodeURI(errorDescription["id"]) + "?";
            if (errorDescription["subid"] && errorDescription["subid"] != 'null') {
              ruleUrl += "subId=" + encodeURI(errorDescription["subid"]) + "&";
            }
            ruleUrl += "lang=" + encodeURI(langCode);
            m.add({
               title : ruleImplementation,
               onclick : function() { window.open(ruleUrl, '_blank'); }
	              });
		          */
            /*m.add({
              title : ignoreThisKindOfErrorText,
              onclick : function() 
              {
                 var surrogate = e.target.getAttribute(plugin.editor.core.surrogateAttribute);
                 var ruleId = plugin.editor.core.getSurrogatePart(surrogate, 'id');
                 t._removeWordsByRuleId(ruleId);
                 t._checkDone();
              }
           });*/

           /* show the menu please */
           ed.selection.select(e.target);
           p1 = dom.getPos(e.target);
           var xPos = p1.x;
           m.showMenu(xPos, p1.y + e.target.offsetHeight - vp.y);
           this.menuVisible =  true;
           var menuDiv = jQuery('#menu_checktext_spellcheckermenu_co');
           if (menuDiv) {
               var menuWidth = menuDiv.width();
               var textBoxWidth = jQuery('#checktextpara').width();  // not sure why we cannot directly use the textarea's width
               if (xPos + menuWidth > textBoxWidth) {
                   // menu runs out of screen, move it to the left
                   var diff = xPos + menuWidth - textBoxWidth;
                   menuDiv.css({ left: '-' + diff + 'px' });
               } else {
                   menuDiv.css({ left: '0px' });
               }
           }

           return tinymce.dom.Event.cancel(e);
         } 
         else
         {
            m.hideMenu();
            this.menuVisible = false;
         }
      },

      /* loop through editor DOM, call _done if no mce tags exist. */
      _checkDone : function() 
      {
         var t = this, ed = t.editor, dom = ed.dom, o;

         this.menuVisible = false;
          
         each(dom.select('span'), function(n) 
         {
            if (n && dom.hasClass(n, 'mceItemHidden'))
            {
               o = true;
               return false;
            }
         });

         if (!o)
         {
            t._done();
         }
      },

      /* remove all tags, hide the menu, and fire a dom change event */
      _done : function() 
      {
         var plugin    = this;
         //plugin._removeWords();

         if (plugin._menu)
         {
            plugin._menu.hideMenu();
            this.menuVisible = false;
         }

         plugin.editor.nodeChanged();
      },

      sendRequest : function(file, data, languageCode, catOptions, success)
      {
         var url = this.editor.getParam("languagetool_rpc_url", "{backend}");
         var plugin = this;
				 /*alert(data);*/
         if (url == '{backend}') 
         {
            this.editor.setProgressState(0);
            alert('Please specify: languagetool_rpc_url');
            return;
         }
         
          //Catalan options
          var enable="";
          var disable="";
          if (catOptions.indexOf("formes_generals")>=0)
	  {
	      enable = "EXIGEIX_VERBS_CENTRAL,EXIGEIX_POSSESSIUS_V,EVITA_PRONOMS_VALENCIANS";
	      disable = "EXIGEIX_VERBS_VALENCIANS,EXIGEIX_VERBS_BALEARS";
	  }
	  else if (catOptions.indexOf("formes_balears")>=0)
	  {
	      enable = "EXIGEIX_VERBS_BALEARS,EXIGEIX_POSSESSIUS_V,EVITA_PRONOMS_VALENCIANS";
	      disable = "EXIGEIX_VERBS_CENTRAL,CA_SIMPLE_REPLACE_BALEARIC";
	  }
	  else if (catOptions.indexOf("formes_valencianes")>=0)
	  {
	      enable = "EXIGEIX_VERBS_VALENCIANS,EXIGEIX_POSSESSIUS_U";
	      disable = "EXIGEIX_VERBS_CENTRAL,EVITA_DEMOSTRATIUS_EIXE,EXIGEIX_POSSESSIUS_V";
	      
	      //opcions dins de les formes valencianes
	      if (catOptions.indexOf("accentuacio_general")>=0)
	      {
		  disable = disable + ",EXIGEIX_ACCENTUACIO_VALENCIANA";
		  enable = enable + ",EXIGEIX_ACCENTUACIO_GENERAL";
	      };
	      if (catOptions.indexOf("incoatius_eix")>=0)
	      {
		  enable = enable + ",EXIGEIX_VERBS_EIX";
		  disable = disable + ",EXIGEIX_VERBS_IX";
	      }
	      else
	      {
		  enable = enable + ",EXIGEIX_VERBS_IX";
		  disable = disable + ",EXIGEIX_VERBS_EIX";
	      };
	      if (catOptions.indexOf("incoatius_isc")>=0)
	      {
		  enable = enable + ",EXIGEIX_VERBS_ISC";
		  disable = disable + ",EXIGEIX_VERBS_ESC";
	      } 
	      else
	      {
		  enable = enable + ",EXIGEIX_VERBS_ESC";
		  disable = disable + ",EXIGEIX_VERBS_ISC";
	      };
	      if (catOptions.indexOf("demostratius_aquest")>=0)
	      {
		  enable = enable + ",EVITA_DEMOSTRATIUS_ESTE";
		  disable = disable + ",EVITA_DEMOSTRATIUS_AQUEST";
	      }
	      else
	      {
		  enable = enable + ",EVITA_DEMOSTRATIUS_AQUEST,EVITA_DEMOSTRATIUS_AQUEIX";
		  disable = disable + ",EVITA_DEMOSTRATIUS_ESTE";
	      };
	  }
	  //opcions per a totes les variants territorials
	  if (catOptions.indexOf("SE_DAVANT_SC")>=0)
	  {
	      enable = enable + ",SE_DAVANT_SC";
	  }
	  else
	  {
	      disable = disable + ",SE_DAVANT_SC";
	  };
	  if (catOptions.indexOf("CA_UNPAIRED_QUESTION")>=0)
	  {
	      enable = enable + ",CA_UNPAIRED_QUESTION";
	  }
	  else
	  {
	      disable = disable + ",CA_UNPAIRED_QUESTION";
	  };
	  //End of Catalan options

          var normalizedText;
          if (data.hasOwnProperty('normalize')) {
             normalizedText = data.normalize("NFC");
          } else {
             normalizedText=data;
          }

	  var postData = "text=" + encodeURI(normalizedText).replace(/&/g, '%26').replace(/\+/g, '%2B')
              + "&language=" + encodeURI(languageCode)
              + "&enabledRules=" + enable 
              + "&disabledRules=WHITESPACE_RULE," + disable;
          tinymce.util.XHR.send({
            url          : url, 
            content_type : 'text',
            type         : "POST",
            data         : postData,
            async        : true,
            success      : success,
            error        : function( type, req, o )
            {
               plugin.editor.setProgressState(0);
               alert("Could not send request to\n" + o.url + "\nError: " + type + "\nStatus code: " + req.status + "\nPlease make sure your network connection works."); 
            }
         });
      }
   });

   // Register plugin
   tinymce.PluginManager.add('AtD', tinymce.plugins.AfterTheDeadlinePlugin);
})();
