<?php
	/* llibreries necessàries */	
	drupal_add_js("languagetool/js/fancybox/jquery.fancybox-1.3.4.pack.js");
	drupal_add_css("languagetool/js/fancybox/jquery.fancybox-1.3.4.css"); 
	drupal_add_js("languagetool/js/split.js"); 
	drupal_add_js("languagetool/online-check/tiny_mce/tiny_mce.js"); 
	drupal_add_js("languagetool/online-check/tiny_mce/plugins/atd-tinymce/editor_plugin.js");
	drupal_add_js("languagetool/js/ZeroClipboard.js");
	drupal_add_js("languagetool/js/jquery.metacookie.js");

	/* codi propi */
	drupal_add_js("languagetool/languagetool.js");
	drupal_add_css("languagetool/languagetool.css");
	
?>


<style type="text/css">
<!--
.textcorrectorgram {
  margin-top:15px;
}
.textcorrectorgram p, .textcorrectorgram form {
    font: 13px/20px Verdana;
    margin: 3px 0px 13px 0px;
}
.textpetit {
   font-size: 10px;
}
.textexplicacions p {
    font: 12px/19px Verdana;
    margin: 3px 0px 13px 0px;
}
td {vertical-align:top;}
td img {vertical-align: top;}
.ngrid690 {
    width: 65% !important;
}

.ngrid260 {
    width: 30% !important;
}

.boxtit {
    width: 290px !important;
}

-->
</style>
<script language="javascript" type="text/javascript">
function insertDemoText()
{
   var myDemoText="Aquests frases servixen per a probar algun de les errades que detecta el corrector gramaticals. Proveu les variants de flexió verbal: penso, pense, pens. L'accentuació valenciana o general: café o cafè. Paraules errònies segons el context: Et menjaràs tots els canalons? Li va infringir un càstig sever. Errors de sintaxi: la persona amb la que vaig parlar. I algunes altres opcions: Quan es celebrarà la festa?";
   tinyMCE.activeEditor.setContent(myDemoText);   
}
</script>
<div id="corrector" class="ngrid690">


<div class="textcorrectorgram">
<p style="font: bold 20px Arial; color:#BA2626">
Nou corrector: proveu-lo i contribuïu a millorar-lo!
</p>

<div style="margin:5px 0px 5px 0px;">

<!-- twitter -->
<iframe allowtransparency="true" frameborder="0" scrolling="no" src="http://platform.twitter.com/widgets/follow_button.html?screen_name=softcatala&lang=en" style="width:180px; height:20px;"></iframe>

<!-- google+ -->
<div class="g-plusone" data-href="http://www.softcatala.org/corrector"></div>

<script type="text/javascript">
  window.___gcfg = {lang: 'ca'};

  (function() {
    var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
    po.src = 'https://apis.google.com/js/plusone.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
  })();
</script>

<!-- facebook -->
<div id="fb-root" style="display:inline;"></div>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/ca_ES/all.js#appId=236603173057400&xfbml=1";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));</script><div class="fb-like" style="display:inline;" data-href="http://www.softcatala.org/traductor" data-send="true" data-layout="button_count" data-width="450" data-show-faces="false"></div></div>

<!-- <p style="font: bold 11px Arial;">ATENCIÓ. Hem tingut problemes amb el servidor de correcció. És possible que en alguns moments no funcioni. Disculpeu les molèsties. Treballem per arreglar-ho. També poseu usar el <a href="http://www.softcatala.org/corrector/ortografic">corrector ortogràfic</a> antic.
<p>-->

<p>
Escriviu o enganxeu un text en el formulari i cliqueu en «Revisa».
</p>
<noscript>Atenció: No teniu activat el Javascript! Activeu-lo si voleu gaudir de totes les funcions del corrector. Si no ho feu, obtindreu els resultats en una pàgina externa a Softcatalà, i aquests resultats poden ser lleugerament diferents.</noscript>
</div>

<!-- comença el formulari -->
<div class="textcorrectorgram">
<form name="checkform" action="http://community.languagetool.org" method="post">
<div style="margin: 10px 0px 10px 10px; display:block; float: left;">
				Formes: 
				<input type="radio" name="formes" value="formes_generals" checked id="check_formes_generals">generals
				<input type="radio" name="formes" value="formes_valencianes" id="check_formes_valencianes">valencianes
				<input type="radio" name="formes" value="formes_balears" id="check_formes_balears">balears
			</div>
		<p id="checktextpara">
			<textarea spellcheck="false" id="checktext" class="lt" name="text" style="width: 100%" rows="6"></textarea>
		</p>
		<textarea id="copytextarea" name="copytextarea" style="width: 100%;display:none" rows="6" readonly="readonly"></textarea>

		<div style="margin-top:2px;position:relative;">
			<input type="hidden" name="lang" value="ca"/>
                        <div style="margin-top:0px; display:block; float: right; text-align:right;">

				<input type="submit" id="submit" name="_action_checkText" value="Revisa">
<br/><a class="textpetit" href="javascript:void(0)" onclick="javascript:insertDemoText();">Insereix un text de prova</a>
                        </div> 

                                
			<div style="margin: 3px 0px 10px 10px; display:block; float: left;">
				<input type="checkbox" id="mesopcions" value="mesopcions">Més opcions 
				<div id="mes_opcions" style="margin: 10px 0px 10px 0px; display:none; background-color:#F0F0EE;">
					<input type="checkbox" name="SE_DAVANT_SC" value="SE_DAVANT_SC" checked>Exigeix 'se' (se sap, se celebra)<br/>
					<input type="checkbox" name="CA_UNPAIRED_QUESTION" value="CA_UNPAIRED_QUESTION">Exigeix signe d'interrogació inicial (¿)<br/>

					<div id="opcions_valencia" style="margin-top:0px; display:block; background-color:#F0F0EE; float: left;display:none;" >   	
						<table summary="" border="0">
							<tr>
								<td>Accentuació:</td>
								<td><input type="radio" name="accentuacio" value="accentuacio_general">general (cafè)</td>
								<td><input type="radio" name="accentuacio" value="accentuacio_valenciana" checked>valenciana (café)</td>
							</tr>
							<tr>
								<td>Verbs incoatius:</td>
								<td><input type="radio" name="incoatius" value="incoatius_eix" checked>-eix (serveix)</td>
								<td><input type="radio" name="incoatius" value="incoatius_ix">-ix (servix)</td>
							</tr>
							<tr>
							<td></td>
								<td><input type="radio" name="incoatius2" value="incoatius_esc">-esc (servesc)</td>
								<td><input type="radio" name="incoatius2" value="incoatius_isc" checked>-isc (servisc)</td>
							</tr>
							<tr>
								<td>Demostratius:</td>
								<td><input type="radio" name="demostratius" value="demostratius_aquest" checked>aquest</td>
								<td><input type="radio" name="demostratius" value="demostratius_este">este</td>
						</tr>
						</table>  
					</div>
				</div>
			</div>
			<div style="clear:both"> </div>
		</div>

	</form>
</div>
<!-- acaba el formulari-->
<br/>
<div class="textexplicacions">
<table summary="">
<tr>
<td>
<p>
<strong>Resultats</strong>. Apareixeran subratllats
<span class="hiddenSpellError">errors ortogràfics</span>,
<span class="hiddenGrammarError">errors gramaticals o tipogràfics</span> i
<span class="hiddenGreenError">recomanacions d'estil</span>. 
Fent clic en les paraules assenyalades, obtindreu suggeriments de correcció, si n'hi ha. Els resultats són orientatius i en cap cas poden substituir una revisió experta.
</p>
</td>
<td>
<p>
<strong>Opcions</strong>. Trieu entre formes generals, valencianes i balears. Aquestes opcions afecten principalment la flexió verbal. Podeu configurar altres opcions (més nombroses en el cas valencià) fent clic en «Més opcions». També podeu usar LanguageTool com a complement de <a href="http://www.softcatala.org/wiki/Rebost:Language_tool">LibreOffice</a> o <a href="https://addons.mozilla.org/ca/firefox/addon/languagetoolfx/">Firefox</a>.</p>
</td>
</tr>
<tr>
<td><p><strong>Crèdits</strong>. Aquest servei està basat en el programari lliure <a href="http://languagetool.org/ca/">LanguageTool</a>, i s'ha desenvolupat gràcies a <a href="http://riuraueditors.cat/web/content/12-eines" title="Riurau Editors">Riurau Editors</a> i <a href="http://www.softcatala.org/wiki/Projectes/LanguageTool">Softcatalà</a>.</p></td>
<td><p><strong>Contacte</strong>. Per a qualsevol suggeriment, escriviu-nos a <a href="mailto:corrector@softcatala.org">corrector@softcatala.org</a>. Consulteu també les <a href="http://www.softcatala.org/wiki/Projectes/LanguageTool/PMF" title="PMF Corrector">preguntes més freqüents</a>.</p></td>
</tr>
<tr><td><a href="http://www.languagetool.org/ca" title="LanguageTool"><img alt="LangueageTool" src="http://www.softcatala.org/w/images/f/fa/LanguageToolBig.png" /></a>
<a style="margin-left:30px;" href="http://riuraueditors.cat/web/content/12-eines" title="Riurau Editors"><img alt="Riurau Editors" src="http://www.softcatala.org/w/images/c/c9/Logo_riuraueditors.png" /></a>
</td>
<td>

</td>
</tr>
</table> 
</div>
</div>

<!--I GRID260 -->
<div class="ngrid260">

<div class="boxtit">Publicitat</div>
<script type='text/javascript'><!--//<![CDATA[
   var m3_u = (location.protocol=='https:'?'https://ad.softcatala.org/www/delivery/ajs.php':'http://ad.softcatala.org/www/delivery/ajs.php');
   var m3_r = Math.floor(Math.random()*99999999999);
   if (!document.MAX_used) document.MAX_used = ',';
   document.write ("<scr"+"ipt type='text/javascript' src='"+m3_u);
   document.write ("?zoneid=32");
   document.write ('&amp;cb=' + m3_r);
   if (document.MAX_used != ',') document.write ("&amp;exclude=" + document.MAX_used);
   document.write (document.charset ? '&amp;charset='+document.charset : (document.characterSet ? '&amp;charset='+document.characterSet : ''));
   document.write ("&amp;loc=" + escape(window.location));
   if (document.referrer) document.write ("&amp;referer=" + escape(document.referrer));
   if (document.context) document.write ("&context=" + escape(document.context));
   if (document.mmm_fo) document.write ("&amp;mmm_fo=1");
   document.write ("'><\/scr"+"ipt>");
//]]>--></script><noscript><a href='http://ad.softcatala.org/www/delivery/ck.php?n=a9b44af6&amp;cb=INSERT_RANDOM_NUMBER_HERE' target='_blank'><img src='http://ad.softcatala.org/www/delivery/avw.php?zoneid=32&amp;cb=INSERT_RANDOM_NUMBER_HERE&amp;n=a9b44af6' border='0' alt='' /></a></noscript>
</div>
