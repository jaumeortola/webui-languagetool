/**
 * jQuery.metacookie plug-in v1.0
 *
 * Copyright 2012 James Gourgoutis
 * Released uner the MIT license
 * https://raw.github.com/Jimgskoop/jquery.metacookie/master/LICENSE.TXT
 */

jQuery.extend(true, ( function () {
    
  var gCookieLife = '1 year', // cookies will expire in 1 year by default
  gMajorDelim = '|', // delimiter for sub-cookies in meta cookies
  gMinorDelim = '=', // delimiter between key-value pairs for sub-cookies w/in meta cookies
  gDomain = window.location.hostname;

  /**
   * Sorts through a given array, splitting up each
   * element by a given delimiter into key/value pairs,
   * then find the value that corresponds to a given key.
   * (used to parse cookies)
   * @method splitFind
   * @private
   * @param {Array} list The array to parse
   * @param {String} key The key to look for
   * @param {String} delim The delimiter to use for key/value pair splitting
   */
  function splitFind(list, key, delim) {
    var i,
    result, 
    fields, 
    tmp, 
    len = list.length;

    for (i=0; i < len; i++) {
      tmp = list[i];
      if (tmp) {  
        fields = tmp.split(delim);
        if (fields[0] === key) {
          result = fields[1];
          break;    
        } 
      }
    }
    return(result);
  }

  /**
   * Sets a cookie
   * @method setCookie
   * @private
   * @param {String} name The name of the cookie
   * @param {String} value The value of the cookie
   * @param {String} expires The duration of the cookie; accepts strings like "2 years", "2 months"; defaults to "1 year"
   * @param {String} path The path for the cookie; defaults to "/"
   * @param {String} domain The domain for the cookie; defaults to the current domain
   * @param {Boolean} secure Toggles the security setting for the cookie
   * @return {Void}
   */
  function setCookie(name, value, expires, path, domain, secure) {
    var cookieUnits = 24 * 60 * 60 * 1000, // default to day units
    permCookie = true,
    expDate = new Date(),
    cookieStr;

    if (!name || !value) {
      if (console) {
        console.log("ERROR: missing name or value for [" + name + "] -- cookie not set!");
      }
      return;
    }
	
    expires = expires || gCookieLife;

    if (expires.match(/year/)) {
      expires	= parseInt(expires, 10) * 365 * cookieUnits;	    
    }
    else if (expires.match(/month/)) {
      expires = parseInt(expires, 10) * 30 * cookieUnits;	    
    }
    else if (expires.match(/kill|remove|delete/)) {
      expires = -1 * 365 * cookieUnits;	    
    }
    else {
      permCookie = false;
      expires = parseInt(expires, 10);
    }
				
    if (permCookie) {
      expDate.setTime(expDate.getTime() + expires);  
    }
		
    cookieStr = name + "=" + encodeURIComponent(value) 
    + ((permCookie) ? "; expires=" + expDate.toGMTString() : "") 
    + "; path=" + ((path) ? path : "/")
    + "; domain=" + ((domain) ? domain : gDomain)
    + ((secure) ? "; secure" : "");
	
    document.cookie = cookieStr;
  }

  /**
   * Retrieves a cookie by name
   * @method getCookie
   * @private
   * @param {String} name The name of the cookie
   * @return {String} The value of the cookie
   */  
  function getCookie(name) {
    var cookieStr = document.cookie,
    cookies = [],
    result;

    if (cookieStr) {
      cookies = cookieStr.split(/;\s*/);
    }

    result = splitFind(cookies, name, '=');

    return(decodeURIComponent(result));
  }

  /**
   * Deletes a cookie by name
   * @method setCookie
   * @private
   * @param {String} name The name of the cookie
   * @return {Void}
   */
  function deleteCookie(name) {
    return setCookie(name, -1, 'kill');
  }

  /**
   * Retrieves the value for a subcookie in a meta cookie.
   * @method getMetaCookie
   * @private
   * @param {String} subName The name of the cookie subfield
   * @param {String} name The name of the cookie
   * @return {String} The value of the cookie subfield
   */  
  function getMetaCookie(subName, name) {
    var cookieStr = getCookie(name);
    return splitFind(cookieStr.split(gMajorDelim), subName, gMinorDelim);
  }

  /**
   * Sets a sub cookie within a meta cookie.
   * @method setMetaCookie
   * @private
   * @param {String} subName The name of the cookie subfield
   * @param {String} name The name of the cookie
   * @param {String} value The value to set
   * @return {Void}
   */  
  function setMetaCookie(subName, name, value) {
    var currentCookieVal = getCookie(name),
    subCookies = [],
    temp = [],
    newCookieVal = '',
    fields,
    x;

    if (currentCookieVal) {
      subCookies = currentCookieVal.split(gMajorDelim);
    }

    // get all existing sub cookies
    for (x in subCookies) {
      if (subCookies.hasOwnProperty(x)) {
        fields = subCookies[x].split(gMinorDelim);
        if (fields[0] && fields[1]) {
          temp[fields[0]] = fields[1]; // build hash  
        }
      }
    }
	  
    // set or reset sub cookie
    if (subName) {
      temp[subName] = value;
    }

	  // rebuild cookie string
    for (x in temp) {
      if (temp.hasOwnProperty(x)) {
        // don't rebuild null values
        if (temp[x]) {
          newCookieVal += gMajorDelim + x + gMinorDelim + temp[x];   
        }
      }
	  }
    return(setCookie(name, newCookieVal));
  }

  /**
   * Deletes a sub cookie within a meta cookie
   * @method deleteMetaCookie
   * @private
   * @param {String} subName The name of the cookie subfield
   * @param {String} name The name of the cookie
   * @return {Void}
   */  
  function deleteMetaCookie(subName, name) {
     // set value to null so its subcookie doesn't get re-added
     return(setMetaCookie(subName, name, null));
  }

  /**
   * Setter for a custom cookie domain
   * @method setDomain
   * @param  {String}  domain The domain to use for the cookie
   */
  function setDomain(domain) {
    gDomain = domain || gDomain;
  }


  return {
    setCookie: setCookie,
    getCookie: getCookie,
    deleteCookie: deleteCookie,
    setMetaCookie: setMetaCookie,
    getMetaCookie: getMetaCookie,
    deleteMetaCookie: deleteMetaCookie,
    setCookieDomain: setDomain
  };

}()) );

