var SC_COOKIE = 'sc-languagetool';

(function($) {
  $(document).ready(function() {
    $("a.fancyboxImage").fancybox({
      'hideOnContentClick': true,
      'titlePosition': 'inside'
    });

    $("#mesopcions").click(function() {
      $("#mes_opcions").toggle($(this).is(':checked'));
    });

    $('#submit').click(function() {
      doit();
      return false;
    });

    $('#check_formes_generals').click(function() {
      $('#opcions_valencia').hide();
    });

    $('#check_formes_valencianes').click(function() {
      $('#opcions_valencia').show();
    });

    $('#check_formes_balears').click(function() {
      $('#opcions_valencia').hide();
    });

    var clip = new ZeroClipboard($("#copyclip"), {
      moviePath: "js/ZeroClipboard.swf"
    });

    clip.on('mouseover', function(client, args) {
      clip.setText($.trim(tinymce.editors[0].core.getPlainText()));
    });

    read_cookie_status();
  });

  tinyMCE.init({
    mode: "specific_textareas",
    editor_selector: "lt",
    plugins: "AtD,paste",

    //Keeps Paste Text feature active until user deselects the Paste as Text button
    paste_text_sticky: true,
    //select pasteAsPlainText on startup
    setup: function(ed) {
      ed.onInit.add(function(ed) {
        ed.pasteAsPlainText = true;
      });
    },

    /* translations: */
    languagetool_i18n_no_errors: {
       'ca': 'No s\'ha trobat cap error',
       'ca-ES-valencia': 'No s\'ha trobat cap error'
    },
    languagetool_i18n_explain: {
      // "Explain..." - shown if there's an URL with a more detailed description:
      'ca': 'Més informació…',
      'ca-ES-valencia': 'Més informació…'
    },
    languagetool_i18n_ignore_once: {
      'ca': 'Crec que no és un error',
      'ca-ES-valencia': 'Crec que no és un error'
    },
    languagetool_i18n_edit_manually: {
      'ca': 'Edita manualment',
      'ca-ES-valencia': 'Edita manualment'
    },
    languagetool_i18n_ignore_all: {
      'ca': 'Ignora aquesta classe d\'errors',
      'ca-ES-valencia': 'Ignora aquesta classe d\'errors'
    },
    languagetool_i18n_rule_implementation :
    {
      // "Rule implementation":
	'ca': 'Informació sobre la regla...',
	'ca-ES-valencia': 'Informació sobre la regla...',
    },
    languagetool_i18n_suggest_word :
    {
    // "Suggest word for dictionary...": 
    // *** Also set languagetool_i18n_suggest_word_url below if you set this ***
	'ca': 'Suggereix un mot per al diccionari...',
	'ca-ES-valencia': 'Suggereix un mot per al diccionari...'
    },
    languagetool_i18n_suggest_word_url :
    {
    // "Suggest word for dictionary...":
	'ca': 'http://community.languagetool.org/suggestion?word={word}&lang=ca',
	'ca-ES-valencia': 'http://community.languagetool.org/suggestion?word={word}&lang=ca'
     },


    languagetool_i18n_current_lang: function() {
      return document.checkform.lang.value;
    },
    /* the URL of your proxy file: */
    //languagetool_rpc_url : "/languagetool/online-check/tiny_mce/plugins/atd-tinymce/server/proxy.php?url=",
    //languagetool_rpc_url: "/v2/online-check/tiny_mce/plugins/atd-tinymce/server/proxy.php",
    //languagetool_rpc_url: "/languagetool/api/checkDocument",
    languagetool_rpc_url: "/lt-api/check",
    /* edit this file to customize how LanguageTool shows errors: */
    //languagetool_css_url: "/languagetool/online-check/tiny_mce/plugins/atd-tinymce/css/content.css",
    languagetool_css_url: "online-check/tiny_mce/plugins/atd-tinymce/css/content.css",
    /* this stuff is a matter of preference: */
    height: 300,
    theme: "advanced",
    theme_advanced_buttons1: "",
    theme_advanced_buttons2: "",
    theme_advanced_buttons3: "",
    theme_advanced_toolbar_location: "none",
    theme_advanced_toolbar_align: "left",
    theme_advanced_statusbar_location: "bottom", // activated so we have a resize button
    theme_advanced_path: false, // don't display path in status bar
    theme_advanced_resizing: true,
    theme_advanced_resizing_use_cookie: false,
    /* disable the gecko spellcheck since AtD provides one */
    gecko_spellcheck: false
  });

  function doit() {
    var userText = tinyMCE.activeEditor.getContent();
    if (userText.length > 50000) {
      var errorMsg = "Heu superat el l\u00EDmit de 50.000 car\u00E0cters.";
      alert(errorMsg);
    } else {
      var langCode = document.checkform.lang.value;
      //formes: generals/valencianes/balears
      var catOptions = $("input[name=formes]:checked").val();
      //opcions dins formes valencianes
      if (catOptions == "formes_valencianes") {
        langCode = "ca-ES-valencia";
        catOptions = catOptions + "," + $("input[name=accentuacio]:checked")
          .val() + "," + $("input[name=incoatius]:checked").val() + "," + $(
            "input[name=incoatius2]:checked").val() + "," + $(
            "input[name=demostratius]:checked").val();
      }
      // opcions per a les tres variants
      catOptions = catOptions + "," + $("input[name=SE_DAVANT_SC]:checked")
        .val() + "," + $("input[name=CA_UNPAIRED_QUESTION]:checked").val();

      save_cookie_status();

      if (String.prototype.hasOwnProperty('normalize')) {
         var normalizedText = userText.normalize("NFC");
         tinyMCE.activeEditor.setContent(normalizedText);
      }

      tinyMCE.activeEditor.execCommand('mceWritingImprovementTool',
        langCode, catOptions);
    }
  }

  function read_cookie_status() {
    if ($.getCookie('sc-languagetool')) {
      var formes = $.getMetaCookie('formes', SC_COOKIE);

      $('#check_' + formes).attr('checked', 'checked');
      if ($('#check_formes_valencianes').is(':checked')) {
        $('#opcions_valencia').show();
      } else {
        $('#opcions_valencia').hide();
      }

      var mesopcions = $.getMetaCookie('mesopcions', SC_COOKIE);
      if (mesopcions) {
        $('#mesopcions').attr('checked', 'checked');
        $("#mes_opcions").toggle($('#mesopcions').is(':checked'));
      }

      var regles_amb_checkbox = Array('SE_DAVANT_SC',
        'CA_UNPAIRED_QUESTION');

      $.each(regles_amb_checkbox, function(index, nom) {

        var regla = $.getMetaCookie(nom, SC_COOKIE);

        if (regla !== undefined) {
          if (regla > 0) {
            $('input[name=' + nom + ']').attr('checked', 'checked');
          } else {
            $('input[name=' + nom + ']').removeAttr('checked');
          }
        }
      });

      var regles_amb_radio = Array('accentuacio', 'incoatius', 'incoatius2',
        'demostratius');

      $.each(regles_amb_radio, function(index, nom) {

        var valor = $.getMetaCookie(nom, SC_COOKIE);

        if (valor !== undefined) {
          $('[type="radio"][name="' + nom + '"][value="' + valor + '"]')
            .attr('checked', 'checked');
        }
      });
    }
  }

  function save_cookie_status() {
    if (!$.getCookie(SC_COOKIE)) {
      $.setCookie(SC_COOKIE, '');
    }

    var formes = $("input[name=formes]:checked").val();
    var mesopcions = $('#mesopcions').is(':checked');
    var se_davant_sc = $('#SE_DAVANT_SC').is(':checked');


    $.setMetaCookie('formes', SC_COOKIE, formes);
    $.setMetaCookie('mesopcions', SC_COOKIE, mesopcions);

    var regles_amb_checkbox = Array('SE_DAVANT_SC', 'CA_UNPAIRED_QUESTION');

    $.each(regles_amb_checkbox, function(index, nom) {
      var valor = $('input[name=' + nom + ']:checked').val();

      if (valor) {
        $.setMetaCookie(nom, SC_COOKIE, 1);
      } else {
        $.setMetaCookie(nom, SC_COOKIE, -1);
      }
    });

    var regles_amb_radio = Array('accentuacio', 'incoatius', 'incoatius2',
      'demostratius');

    $.each(regles_amb_radio, function(index, nom) {
      var valor = $('[type="radio"][name="' + nom + '"]:checked').val();
      $.setMetaCookie(nom, SC_COOKIE, valor);
    });
  }
}(jQuery));
