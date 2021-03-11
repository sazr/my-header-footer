/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
;(function ( $, window, document, undefined ) {

	$.widget( "vd.vdAnalytics", {

		options: {
			evtStack: [],
			session: null,
			reportInterval: 60000 * 3,
		},

		_create: function () {
			var self = this;

			var url = window.location.host; // window.location.href;
			var utc_timestamp = self.getTimeStamp();
			self.options.session = url + '.' + utc_timestamp;

			// Hook general
			$(document).click(function(evt) {
			  self.record(evt);
			});
			// Hook menu btns
			$('.vd-manager .vd-menu-btn').click(function(evt) {
				var parentMenu = $(evt.target).closest('.vd-main-menu').attr('vd-menu') || $(evt.target).closest('.vd-menu').attr('vd-menu') || 'undefined';
			  self.record(evt, 'menu', parentMenu + '.' + $(evt.target).closest('.vd-menu-btn').attr('vd-name'));
			});
			// Hook widgets
			$('[vd-type]').click(function(evt) {
				var widget = $(evt.target).closest('[vd-type]');
				self.record(evt, 'widget', widget.attr('vd-type') + '#' + widget.attr('id'));
			});

			$(window).bind('beforeunload', function() {
			  self.report();
			});

			setInterval(function() { self.report(); }, self.options.reportInterval);

			setTimeout(function() {
				self.options.evtStack.push({
					'ts': utc_timestamp,
					'type': 'snapshot',
					'etype': 'custom',
					'data': encodeURIComponent("<html>" + $("html").html() + "</html>")
				});
			}, 2000);
		},

		getTimeStamp: function() {
			var now = new Date();
			return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
		},

		record: function(evt, type, identifier) {
			// console.log('evt', evt);
			var self = this;
			var utc_timestamp = self.getTimeStamp();
			var id = identifier || ($(evt.target).attr('id')) || $(evt.target).attr('class');
			var t = type || 'general';
			
			self.options.evtStack.push({
				'ts': utc_timestamp,
				'type': t,
				'etype': evt.type,
				'id': id
			});

			if (this.options.evtStack.length % 30 == 0) {
				// take snapshot evt
				self.options.evtStack.push({
					'ts': utc_timestamp,
					'type': 'snapshot',
					'etype': 'custom',
					'data': encodeURIComponent("<html>" + $("html").html() + "</html>")
				});
			}
		},

		report: function() {
			if (this.options.evtStack.length <= 0)
				return;

			var self = this;
			var session = this.options.session;
			var url = window.location.href;
      var iurl = (window && window.parent && window.parent.document) ? window.parent.document.location.href : 'no iframe';
       jQuery.ajax({
        type: "post",
        dataType: "json",
        url: 'https://www.visualdesigner.io/dist/report.php',
        data : {
          'action': 'report',
          'nonce': 'du3jp1f8s3',
          'platform': window.navigator.platform,
          'os': window.navigator.oscpu,
          'useragent': window.navigator.userAgent,
          'url': url,
          'iurl': iurl,
          'domain': window.location.host,
          'session': session,
          'custom': self.options.evtStack,
        },
        success: function(response) {
            if(response.status == "fail") {
              // $.vdManager('showDialogMsg', {title: 'Out of Date Library', content: '<p>There is a newer version of Visual Designer available.</p>'}); 
            }
        },
        complete: function(response) {
            self.options.evtStack = []; // clear stack
        }
      });
		}
	});

})( jQuery, window, document );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
;(function ( $, window, document, undefined ) {

	$.widget( "vd.styleEditor", {

		options: {
			mediaRules: {
				'desktop': {
					regex: new RegExp('^\\s*\\(max-width\\s*:\\s*8900000px\\s*\\)\\s*$', 'gmi'),
					text: '@media (max-width: 8900000px)',
				},
				'tablet': {
					regex: new RegExp('^\\s*\\(max-width\\s*:\\s*768px\\s*\\)\\s*$', 'gmi'),
					text: '@media (max-width: 768px)',
					emulationPrefix: 'body.vd-response',
				},
				'mobile': {
					regex: new RegExp('^\\s*\\(max-width\\s*:\\s*414px\\s*\\)\\s*$', 'gmi'),
					text: '@media (max-width: 414px)',
					emulationPrefix: 'body.vd-response.vd-rmobile',
				},
			}
		},

		_create: function () {
			var self = this;

			if (!self.options.style || !self.options.style.length)
				if (self.element.prop("tagName").trim().toLowerCase() == 'style')
					self.options.style = self.element;
				else throw 'styleEditor must have a style option pointing to a <style> element';
			if (!self.options.designerId || !self.options.designerId.length)
				throw 'styleEditor must have a designerId option defined';

			self.options.style = $(self.options.style);

			if (!self.options.skipBackwardsCompatAttempt)
				self.backwardCompatAttempt();

			self.assocMediaSheets((self.options.style && self.options.style.length && self.options.style[0].sheet) ? self.options.style[0].sheet : false);
		},

		assocMediaSheets: function(suggestedSheet, forceReassoc) {
			var self = this;
			var sheets = $.map(document.styleSheets, function(val,i) {
				return val;
			});

			if (!document.styleSheets || document.styleSheets.length <= 0) {
				// MUST create a style element
			}

			if (suggestedSheet)
				sheets.unshift(suggestedSheet);

			if (forceReassoc) {
				// Reset all stored sheets
				for (var mr in self.options.mediaRules) {
					self.options.mediaRules[mr].sheet 				= false;
				  self.options.mediaRules[mr].parentSheet 	= false;
				}
			}

			// console.log('No. of sheets to search', sheets.length);

			// Find the sheet that contains the desktop media rule 'sheet' (that must contain the designerId)
			for (var i=0; i<sheets.length; i++) {
			    var sheet = sheets[i];
			    for (var mediaRule in self.options.mediaRules) {
			    	// If we've already found this media sheet: dont do anything
			    	if (self.options.mediaRules[mediaRule].sheet)
			    		continue;

				    var res = self.getSignifierMediaSheet(sheet, self.options.mediaRules[mediaRule].regex);
				    // console.log('getSignifierMediaSheet', res);
				    if (!res || !res.mediaSheet)
				    	continue;

				    // We have found @media (min-width: 769px) AND found #vdid-XX
				    self.options.mediaRules[mediaRule].sheet 				= res.mediaSheet;
				    self.options.mediaRules[mediaRule].parentSheet 	= sheet;
				    // break;
			  	}
			}

			for (var r in self.options.mediaRules) {
				if (!self.options.mediaRules[r].sheet) {
					var designerSheet = this.options.style[0].sheet;
					// Register the media rule
					// console.log('Registering: ', r);
					self.registerElementStyle(designerSheet, self.options.mediaRules[r].text, false, false, false, self.options.designerId + '{box-sizing: border-box}');
					var mRes = self.getSignifierMediaSheet(designerSheet, self.options.mediaRules[r].regex);
					if (!mRes || !mRes.mediaSheet) {
						console.log('Critical error: assocMediaSheets() failed to create a media rule sheet');
				  	continue;
					}

					// Get the media rule sheet
					self.options.mediaRules[r].sheet 				= mRes.mediaSheet; 
					self.options.mediaRules[r].parentSheet 	= designerSheet;
				}
			}
		},

		backwardCompatAttempt: function() {
			var self = this;

			if (!self.options.style || !self.options.style.length || !self.options.style[0].sheet) {
				console.log('backwardCompatAttempt(): no style sheet supplied');
				return;
			}

			var sheet = self.options.style[0].sheet;
			var rules = ('cssRules' in sheet)? sheet.cssRules : sheet.rules;

			// if already has been updated
			var res = self.getSignifierMediaSheet(sheet, self.options.mediaRules.desktop.regex);
	    if (res && res.mediaSheet) {
	    	// console.log('--- Style is already >=1.11');
	    	return;
	    }
	    else if (rules.length <= 0) {
	    	console.log('--- Style is empty no backwards compatibility to perform');
	    	return;
	    }

			// Find main sheet and wrap in desktop media rule AND add designerId to it
			self.registerElementStyle(sheet, self.options.mediaRules.desktop.text, false, false, false, self.options.designerId + '{box-sizing: border-box}');
			var mRes = self.getSignifierMediaSheet(sheet, self.options.mediaRules.desktop.regex);
			if (mRes && mRes.mediaSheet) {
				// Get existing designer style (if exists)
				var dStyle = self.getElementStyle(sheet, self.options.designerId);
				if (dStyle && dStyle.length)
					self.updateElementStyle(mRes.mediaSheet, self.options.designerId, dStyle[0].style);

				for (var i=rules.length-1; i>=0; i--) {
					if (rules[i].media)
						continue;

					self.registerElementStyle(mRes.mediaSheet, rules[i].selectorText, rules[i].style);
					var delRes = self.removeElementStyle(sheet, rules[i].selectorText);
				}
			}
			else console.log('Critical error: backwardCompatAttempt() failed to create a media rule sheet');

			// Find tablet media rule sheet and add designerId to it
			if (self.options.mediaRules.tablet && self.options.mediaRules.tablet.regex) {
				var tSheet = self.getMediaSheet(sheet, self.options.mediaRules.tablet.regex);
				if (tSheet.length)
					$.each(tSheet, function(i,v) {
						var designerStyle = self.getElementStyle(v, self.options.designerId);
						if (designerStyle && designerStyle.length)
							self.updateElementStyle(v, self.options.designerId, designerStyle[0].style);
						else self.registerElementStyle(v, self.options.designerId, {'box-sizing': 'border-box'});
					});
			}
			
			// Find mobile media rule sheet and add designerId to it
			if (self.options.mediaRules.mobile && self.options.mediaRules.mobile.regex) {
				var mSheet = self.getMediaSheet(sheet, self.options.mediaRules.mobile.regex);
				if (mSheet.length)
					$.each(mSheet, function(i,v) {
						var designerStyle = self.getElementStyle(v, self.options.designerId);
						if (designerStyle && designerStyle.length)
							self.updateElementStyle(v, self.options.designerId, designerStyle[0].style);
						else self.registerElementStyle(v, self.options.designerId, {'box-sizing': 'border-box'});
					});
			}
		},

		getMainSheet: function() {
			return this.options.mediaRules.desktop.sheet;
		},

		getMediaSheet: function(sheet, mediaRuleRegex) {
			try {
				var rules = ('cssRules' in sheet)? sheet.cssRules : sheet.rules;
				return $(rules).filter(function(){ 
					if (this.media && this.media.mediaText) {
						return mediaRuleRegex.test(this.media.mediaText); 
					}
				});
			}
			catch (ex) {
				console.log('getMediaSheet()', ex.message);
				console.log('Details:', sheet, mediaRuleRegex);
				return [];
			}
		},

		getSignifierMediaSheet: function(sheet, mediaRuleRegex) {
			var self				= this;
			var mediaSheets = self.getMediaSheet(sheet, mediaRuleRegex);
			for (var i=0; i<mediaSheets.length; i++) {
				var designerStyle = self.getElementStyle(mediaSheets[i], self.options.designerId);
				if (designerStyle && designerStyle.length)
				  return {mediaSheet: mediaSheets[i], designerStyle: designerStyle};
			}

			return {};
		},

		getAllSheets: function() {
			var self = this;
			var sheets = [];
			for (var mediaRule in self.options.mediaRules)
				sheets.push(self.options.mediaRules[mediaRule].sheet);
			return sheets;
		},

		registerElementStyle: function(sheet, selector, styles, index, skipDuplicateCheck, styleTxt) {
			if (!skipDuplicateCheck) {
				var existing = this.getElementStyle(sheet, selector);
				if (existing.length)
					return existing;
			}

			var i = -1;
			var rules = ('cssRules' in sheet) ? sheet.cssRules : sheet.rules;
			index = index || rules.length;
			styles = styles || {};

			if (!styleTxt) {
				styleTxt = '';
				for (var styleKey in styles)
					styleTxt += styleKey + ': ' + styles[styleKey] + '; ';
			}

			if ("insertRule" in sheet) {
				i = sheet.insertRule(selector + ' { ' + styleTxt + ' } ', index);
			}
			else if ("addRule" in sheet)
				i = sheet.addRule(selector, styleTxt, index);

			return sheet.cssRules[i];
		},

		registerElementStyles: function(selector, styles, index) {
			var self = this;
			var mainSheet = self.getMainSheet();
			
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.options.mediaRules[mediaRule].sheet;
				var existingStyle = self.registerElementStyle(sheet, selector, styles, index);

				if (self.options.mediaRules[mediaRule].emulationPrefix) {
					var styleObj = (existingStyle && existingStyle.length) ? existingStyle[0].style : {};
					self.registerElementStyle(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selector, styleObj, index);
				}
			}
		},

		getElementStyle: function(sheet, selector) {
			if (!sheet)
				throw 'getElementStyle() sheet undefined';
			// if (!sheet.cssRules)
			// 	throw 'getElementStyle() sheet.cssRules undefined';

			var rules = ('cssRules' in sheet) ? sheet.cssRules : sheet.rules;
			return $(rules).filter(function(){return this.selectorText==selector;});
		},

		getElementStyles: function(selector, media) {
			var self = this;
			var styles = [];
			var mediaRules = {};
			var mainSheet = self.getMainSheet();

			switch (media.trim().toLowerCase()) 
			{
				case 'all':
				{
					mediaRules = self.options.mediaRules;
				}
				break;
				// case 'desktop':
				// {
				// 	mediaRules = {};
				// 	var dStyle = self.getElementStyle(mainSheet, selector);
				// 	if (dStyle && dStyle.length)
				// 		styles.push(dStyle);
				// }
				// break;
				default:
				{
					mediaRules = {}; //{ media: 0 };
					mediaRules[media] = 0;
				}
				break;
			}
			
			for (var i in mediaRules) {
				var mediaRule = self.options.mediaRules[i];
				var sheet = mediaRule.sheet;
				var mSt = self.getElementStyle(sheet, selector);
				if (mSt && mSt.length)
					styles.push(mSt);

				if (mediaRule.emulationPrefix) {
					var st = self.getElementStyle(mainSheet, mediaRule.emulationPrefix + ' ' + selector);
					if (st && st.length)
						styles.push(st);
				}
			}

			return styles;
		},

		updateElementStyle: function(sheet, selector, styles) {
			var eleStyle = this.getElementStyle(sheet, selector);
			// if (eleStyle && eleStyle.length)
			// 	Object.assign(eleStyle[0].style, styles); // throws error sometimes
			if (eleStyle && eleStyle.length)
				for (var k in styles)
					eleStyle[0].style[k] = styles[k];
		},

		updateElementStyles: function(selector, styles, media) {
			var eleStyles = this.getElementStyles(selector, media);
			if (!eleStyles || !eleStyles.length)
				return;

			for (var i in eleStyles)
				// Object.assign(eleStyles[i][0].style, styles);  // throws error sometimes
				for (var k in styles)
					eleStyles[i][0].style[k] = styles[k];
		},

		clearAllSheets: function() {
			var self = this;
			$.each(self.options.mediaRules, function(i,v) {
				var rules = ('cssRules' in v.sheet)? v.sheet.cssRules : v.sheet.rules;
				// $.each(rules, function(index) { 
	   //    	v.sheet.deleteRule(index);
	   //    });
	      for (var j=rules.length-1; j>=0; j--) {
					if (rules[j].media)
						continue;

					v.sheet.deleteRule(j);
				}
			});
		},

		removeElementStyle: function(sheet, selector) {
			var rules = ('cssRules' in sheet)? sheet.cssRules : sheet.rules;
			$(rules).each(function(index) { 
      	if (this.selectorText==selector) {
      		sheet.deleteRule(index);
      		return false;
      	}
      });
		},

		removeElementStyles: function(selector) {
			var self = this;
			var styles = [];
			var mainSheet = self.getMainSheet();
			// styles.push( self.removeElementStyle(mainSheet, selector) );
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.options.mediaRules[mediaRule].sheet;
				styles.push( self.removeElementStyle(sheet, selector) );

				if (self.options.mediaRules[mediaRule].emulationPrefix)
					styles.push( self.removeElementStyle(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selector) );
			}

			return styles;
		},

		clearElementStyle: function(sheet, selector) {
			var eleStyle = this.getElementStyle(sheet, selector);
			if (eleStyle && eleStyle.length)
				eleStyle[0].style = [];
		},

		clearElementStyles: function(selector) {
			var self = this;
			var styles = [];
			var mainSheet = self.getMainSheet();
			// styles.push( self.clearElementStyle(mainSheet, selector) );
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.options.mediaRules[mediaRule].sheet;
				styles.push( self.clearElementStyle(sheet, selector) );

				if (self.options.mediaRules[mediaRule].emulationPrefix)
					styles.push( self.clearElementStyle(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selector) );
			}

			return styles;
		},

		copyElementStyleTo: function(sheet, selectorFrom, selectorTo) {
			var fromStyle = this.getElementStyle(sheet, selectorFrom);
			var toStyle = this.getElementStyle(sheet, selectorTo);

			if (!fromStyle || !fromStyle.length || !toStyle || !toStyle.length)
				return;

			$.each(fromStyle[0].style, function(index, prop) {
				toStyle[0].style[prop] = fromStyle[0].style[prop];
			});
		},

		copyElementStylesTo: function(selectorFrom, selectorTo) {
			// var sheets = this.getAllSheets();
			// for (var i in sheets)
			// 	this.copyElementStyleTo(sheets[i], selectorFrom, selectorTo);

			var self = this;
			var styles = [];
			var mainSheet = self.getMainSheet();
			// styles.push( self.copyElementStyleTo(mainSheet, selectorFrom, selectorTo) );
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.options.mediaRules[mediaRule].sheet;
				styles.push( self.copyElementStyleTo(sheet, selectorFrom, selectorTo) );

				if (self.options.mediaRules[mediaRule].emulationPrefix)
					styles.push( self.copyElementStyleTo(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selectorFrom, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selectorTo) );
			}

			return styles;
		},

		isSafari: function() {
	    var ua = navigator.userAgent.toLowerCase(); 
	    return (ua.indexOf('safari') != -1 && ua.indexOf('chrome') <= -1);
	  },

		asString: function(elementWrapper, medias, ignoreSelectorsRegex) {
			var self 				= this;
			var defLines 		= []; // string builder
			var mediaLines 	= []; // string builder
			var mediaPrefix = (self.isSafari()) ? '' : '@media';  // SAFARI already has @media no need to add. FFFFFFFFUCK YOU SAFARI!!!!!!
			medias 					= (medias && medias.length) ? medias : ['desktop', 'tablet', 'mobile'];
			elementWrapper 	= elementWrapper || $('html');
			ignoreSelectorsRegex = ignoreSelectorsRegex || /body\.vd-resp.*/gmi;
			var removeRedundantStyles = function(/*sheet,*/ cssRules, lines) {
				for (var i=0; i<cssRules.length; i++) {
					// if media rule: go recursive and grab its css rules
					if (cssRules[i].media && cssRules[i].media.length) {
						mediaLines.push(mediaPrefix + cssRules[i].media[0] + ' {');
						var mRules = ('cssRules' in cssRules[i])? cssRules[i].cssRules : cssRules[i].rules;
						removeRedundantStyles(/*cssRules[i],*/ mRules, mediaLines);
						mediaLines.push('}');
					}
	        else {      
	        	// Check the html element exists (not in trash) and is not editor specific styling
	        	var id = cssRules[i].selectorText.match(/#[a-zA-Z0-9|\-|_|\.]+/gmi);
	        	var ignore = cssRules[i].selectorText.match(ignoreSelectorsRegex); 
	        	var hasStyle = cssRules[i].style.length > 0;
						if ((ignore && ignore.length) || (id && id.length > 0 && $(id[0], elementWrapper).length <= 0) || !hasStyle)
	            continue;
						
						var cTxt = ('cssText' in cssRules[i]) ? cssRules[i].cssText : cssRules[i].style.cssText;
						lines.push(cTxt);
	        }
		    }  
			};

			for (var i in medias) {
				var curSheet = this.options.mediaRules[medias[i]].sheet;
				// MUST HAVE DESIGNER ID SIGNIFIER AND THAT MUST HAVE A STYLE
				var designerStyle = self.getElementStyle(curSheet, self.options.designerId);
				if (!designerStyle || !designerStyle.length) {
					self.registerElementStyle(curSheet, self.options.designerId);
					designerStyle = self.getElementStyle(curSheet, self.options.designerId);
				}
				if (!designerStyle[0].style.length)
					designerStyle[0].style['box-sizing'] = 'border-box';

				// var clone = $.extend(true, { }, curSheet);
				var rules = ('cssRules' in curSheet) ? curSheet.cssRules : curSheet.rules;

				// console.log('options.mediaRules', this.options.mediaRules[medias[i]]);
				// console.log('curSheet', curSheet);
				// if (curSheet.media && curSheet.media.length)
					// defLines.push('@media' + curSheet.media[0] + ' {');
				// Fukin Safari doesn't have the property .conditionText!! 
				if (curSheet.type == CSSRule.MEDIA_RULE) 
					defLines.push(mediaPrefix + (curSheet.conditionText || this.options.mediaRules[medias[i]].text) + ' {');

				removeRedundantStyles(/*curSheet,*/ rules, defLines);

				// if (curSheet.media && curSheet.media.length)
				if (curSheet.type == CSSRule.MEDIA_RULE)
					defLines.push('}');
			}

			// Media rules must occur after def rules
			return defLines.join('') + mediaLines.join('');
		},

		asJSON: function() {
			// TODO
		},
	});

})( jQuery, window, document );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

 (function ($, window, document, undefined) {

 	/* !!! Eventually?Possibly? there will be HTML5 document.undoManager to do this !!! */
 	
  $.widget( "vd.undoWidget", /*$.vdw.baseWidget,*/ {

		options: {  
			classes: "",
			menuBtns: [
				
			]
		},

		_create: function () {

			var self = this;
			this.undoList = [];
			this.undoListIndex = -1;

			this._super();

			$.vdg.undoWidget = function (func, params) { 
				return self.element.undoWidget(func, params);
			};

			$(document).keydown(function(e){
	      if( e.which === 90 && e.ctrlKey && e.shiftKey ){
	      	 e.preventDefault();
	         self.redo();
	      }
	      else if( e.which === 89 && e.ctrlKey ){
	      	 e.preventDefault();
	         self.redo();
	      }
	      else if( e.which === 90 && e.ctrlKey ){
	      	 e.preventDefault();
	         self.undo();
	      }
			}); 
		},

		initialiseUndo: function(params) {
			var op = params; //{ action: params.action, target: params.target };
			var target = $(params.target);
			if (!target || !target.length)
				return op;

			switch (params.action)
			{
				case 'add':
				{
					
				}
				break;
				case 'trash':
				{
					
				}
				break;
				case 'class':
				{
					op.original = params.target.attr("class") || '';
				}
				break;
				case 'style':
				{
					// op.original = params.target.attr("style") || '';
					op.original = params.original || params.target.css( params.attr ) || '';
				}
				break;
				case 'attr':
				{
					// op.attr = params.attr;
					op.original = params.original || params.target.attr( params.attr ) || '';
				}
				break;
				case 'type':
				{
					op.original = params.target.prop("tagName");
				}
				break;
				case 'html':
				{
					op.original = params.target.html();
				}
				break;
				case 'text':
				{
					op.original = params.target.text();
				}
				break;
				default:
				{
					return false;
				}
				break;
			}

			//console.log('op', op);

			return op;
		},

		registerUndo: function(undos) {

			//  [{ action: 'add', target: self.element },  { action: 'style', target: self.element }]

			if (!undos || undos.length)
				return;

			var self = this;

			// TODO on discard delete all contents of trashbin
			console.log("TODO", "on discard delete all contents of trashbin");
			
			// Discard undo future and branch/fork
			this.undoList.length = this.undoListIndex+1;

			undos.reverse();

			undos = this.buildUndos(undos);

			this.undoList.push(undos);
			this.undoListIndex++;
		},

		buildUndos: function(undos) {
			$.each(undos, function(index, params) {
				params.target = $(params.target);

				switch (params.action)
				{
					case 'add':
					{
						params.undoCallback = function() {
							params.target.appendTo(self.element);
						};
					}
					break;
					case 'trash':
					{
						var target = params.target;
						var parent = target.parent();
						var next = target.next();
						var prev = target.prev();
						
						params.undoCallback = function() {

							if (next.length)
								target.insertBefore(next);
							else if (prev.length)
								target.insertAfter(prev);
							else
								target.appendTo(parent); 
						};

						params.redoCallback = function() {
							target.appendTo(self.element);
						};
					}
					break;
					case 'class':
					{
						params.undoCallback = function() {
							//console.log('newclass', params.target.attr("class"));
							params.newClasses = params.target.attr("class");
							params.target.attr("class", params.original);
						};

						params.redoCallback = function() {
							params.target.attr("class", params.newClasses);
						};
					}
					break;
					case 'style':
					{
						params.undoCallback = function() {
							// params.newStyle = params.target.attr("style");
							// params.target.attr("style", params.original);
							params.newAttr = params.target.css(params.attr);
							params.target.css(params.attr, params.original);
						};

						params.redoCallback = function() {
							// params.target.attr("style", params.newStyle);
							params.target.css(params.attr, params.newAttr);
						};
					}
					break;
					case 'attr':
					{
						params.undoCallback = function() {
							params.newAttr = params.target.attr(params.attr);
							params.target.attr(params.attr, params.original);
						};

						params.redoCallback = function() {
							params.target.attr(params.attr, params.newAttr);
						};
					}
					break;
					case 'type':
					{
						params.undoCallback = function() {
							//console.log('curType', params.target.prop("tagName"));
							//console.log('original', params.original);
							params.curType = params.target.prop("tagName");
							params.target = $(params.target).changeElementType(params.original.toLowerCase());
						};

						params.redoCallback = function() {
							params.target = $(params.target).changeElementType(params.curType);
						};
					}
					break;
					case 'html':
					{
						params.undoCallback = function() {
							params.newHtml = params.target.html();
							params.target.html(params.original);
						};

						params.redoCallback = function() {
							params.target.html(params.newHtml);
						};
					}
					break;
					case 'text':
					{
						params.undoCallback = function() {
							params.newText = params.target.text();
							params.target.text(params.original);
						};

						params.redoCallback = function() {
							params.target.text(params.newText);
						};
					}
					break;
					default:
					{

					}
					break;
				}
			});

			return undos;
		},

		addToLastUndo: function(undos) {
			undos = this.buildUndos(undos);
			this.undoList[this.undoList.length-1].concat(undos);
		},

		undo: function() {

			if (this.undoListIndex < 0) {
				console.log("No more to undo");
				return false;
			}

			var undos = this.undoList[this.undoListIndex];

			$.each(undos, function(index, params) {
				switch (params.action)
				{
					case 'add':
					{
						var target = params.target;
						var parent = target.parent();
						var next = []; //target.next();
						var prev = []; //target.prev();
						
						params.redoCallback = function() {

							if (next.length)
								target.insertBefore(next);
							else if (prev.length)
								target.insertAfter(prev);
							else 
								target.appendTo(parent); 
						};
					}
					break;
					default:
					{

					}
					break;
				}

				// console.log('p', params);
				params.undoCallback();
			});

			this.undoListIndex--;
		},

		redo: function() {

			if (this.undoListIndex+1 >= this.undoList.length) {
				console.log("No more to redo");
				return false;
			}

			var undos = this.undoList[++this.undoListIndex];

			$.each(undos, function(index, params) {
				params.redoCallback();
			});
		}
	});


})(jQuery, window, document);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

;(function ( $, window, document, undefined ) {

    // Create vD global object
    $.vdg = $.vdg || {};

	$.fn.changeElementType = function(newType) {
        var newElement;

        this.each(function() {
            var attrs = {};    			

            $.each(this.attributes, function(idx, attr) {
               attrs[attr.nodeName] = attr.nodeValue;
            });
	
            $(this).replaceWith(function() {
                newElement = $("<" + newType + "/>", attrs).append($(this).contents());
                return newElement;
            });
		});

        return newElement;
	};

    $.vdg.vdGetUTMDate = function() {
        var today = new Date();
        var year = today.getUTCFullYear();
        var month = today.getUTCMonth() + 1; // January is 0!
        var day = today.getUTCDate();
        var hour = today.getUTCHours();
        var min = today.getUTCMinutes();

        if (month<10)
            month = '0'+month;
        if (day<10)
            day = '0'+day;
        if (hour<10)
            hour = '0'+hour;
        if (min<10)
            min = '0'+min;
        
        return {
            year: year,
            month: month,
            day: day,
            hour: hour,
            min: min,
        };
    };

    $.vdg.vdGetNStr = function() {
        var date = $.vdg.vdGetUTMDate();
        return date.month + '[' + date.min + '2' + date.day + '4' + date.hour + 'f' + date.year + '7';
    };

    $.vdg.vdToken = function(k) {
        return hex_sha256(k + $.vdg.vdGetNStr());
    };

    $.vdg.vdGetQryParam = function(name, url) {
        if (!url) {
          // var iFrameDetection = (window !== window.parent) ? true : false;
          var iFrameDetection = (window.parent.document && $(window.parent.document.getElementById('vd-platform-view')).length) ? true : false;
          // console.log('IS IN IFRAME', iFrameDetection);
          url = (iFrameDetection)  ?  window.parent.document.location.href : window.location.href;
          // url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    };

    // Medium Editor Specific //
    $.vdg.vdSanitiseMedEle = function(ele) {
        ele.removeAttr('spellcheck');
        ele.removeAttr('data-medium-editor-element');
        ele.removeAttr('data-placeholder');
        ele.removeAttr('data-medium-editor-editor-index');
        ele.removeAttr('aria-multiline');
        ele.removeAttr('medium-editor-index');
        ele.removeClass('medium-editor-element');
    };

    $.event.special.tripleclick = {
        setup: function(data, namespaces) {
            var elem = this, $elem = jQuery(elem);
            $elem.bind('click', jQuery.event.special.tripleclick.handler);
        },

        teardown: function(namespaces) {
            var elem = this, $elem = jQuery(elem);
            $elem.unbind('click', jQuery.event.special.tripleclick.handler);
        },

        handler: function(event) {
            var elem = this, $elem = jQuery(elem), clicks = $elem.data('clicks') || 0, start = $elem.data('startTimeTC') || 0;
            if ((new Date().getTime() - start)>= 1000) {
                clicks = 0;
            }
            clicks += 1;
            if(clicks === 1) {
                start = new Date().getTime();
            }
            
            if ( clicks === 3 ) {
                clicks = 0;

                // set event type to "tripleclick"
                event.type = "tripleclick";
                
                // let jQuery handle the triggering of "tripleclick" event handlers
                jQuery.event.dispatch.apply(this, arguments);
            }
            
            $elem.data('clicks', clicks);
            $elem.data('startTimeTC', start);
        }
    };

})( jQuery, window, document );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

;(function ( $, window, document, undefined ) {
  // Create vD global object
  $.vdg = $.vdg || {};

	$.widget( "vd.base", {
		defaults: {
			widgetClass: '',
			classes: '',
		},

		options: {},

		_create: function () {
			// if (!this.options.widgetName)
			// 	throw "base must have a unique 'widgetName' in options.";
			// MUST SET THIS
			this.element.data('widgetName', this.widgetName);
			this.initOptions();
			this.element.addClass(this.options.widgetClass);
			this.element.addClass(this.options.classes);
			this._super(); 
		},

		getMenu: function(target) {
			target = target || this;
			return $('.vd-manager [data-type="' + target.widgetFullName + '-menu"] .vd-main-menu');
		},

		getSelectedMenu: function(target) {
			target = target || this;
			return $('.vd-manager [data-type="' + target.widgetFullName + '-menu"] .vd-sel-menu');
		},

		getFrameworkName: function() {
			var designer = this.element.closest('[data-type="visual-designer"]');
			if ((!designer || !designer.length) && gSelWidget.element != this.element)
				return gSelWidget.element.vdPolymorphic('getFrameworkName');

			return designer.vdPolymorphic('option', 'framework') || designer.attr('data-framework');
		},

		getFramework: function() {
			var designer = this.element.closest('[data-type="visual-designer"]');
			if ((!designer || !designer.length) && gSelWidget.element != this.element)
				return gSelWidget.element.vdPolymorphic('getFramework');
			var frameworkName = designer.vdPolymorphic('option', 'framework') || designer.attr('data-framework');
			return $('[vd-framework="' + frameworkName + '"]').first();
		},

		framework: function(func, params) {
			var self = this;
			return self.getFramework().vdPolymorphic(func, params);
		},

		getDesigner: function() {
			return this.element.closest('[data-type="visual-designer"]');
		},

		select: function() {
			//return 'Derived to override';
			return null;
		},

		initOptions: function(forceReinit) {
			var self = this;

			if (self.optionsInitialised && !forceReinit)
				return;

			var options = {};
			// $.extend( true, options, self.defaults, self.framework('option', 'baseWidget'), self.framework('option', self.widgetName) || {}, self.options );
			$.extend(true, options, self.defaults || {}, self.options || {});
			self.options = options;
			self.optionsInitialised = true;
		},
	});

})( jQuery, window, document );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

;(function ( $, window, document, undefined ) {

	$.vdg.initFramework = function(frameworkName) {
  	var framework = $('[vd-framework="' + frameworkName + '"]');
  	var res = {
  		framework: null,
  		created: false
  	};
    
    // if already initialised: exit
    if (framework.length) {
      res.framework = framework;
      return res;
    }

    framework = $('<div></div>')
    							[frameworkName]();

    res.framework = framework;
    res.created 	= true;
    return res;
  };

	$.widget( "vd.baseFramework", $.vd.base, {

		options: {

		},

		defaults: {
			simpleMode: false,
			maxColumns: 5,

			menuYOffset: '10px',

			alignments: {
				self: {
					desktop: {
						reset: 	'',
						left: 	'vd-left',
						center: 'vd-center',
						right: 	'vd-right',
						top: 		'vd-top',
						middle: 'vd-middle',
						bottom: 'vd-bottom',
						halign: 'vd-horz',
					},
					tablet: {
						reset: 	'',
						left: 	'vd-sm-left',
						center: 'vd-sm-center',
						right: 	'vd-sm-right',
						top: 		'vd-sm-top',
						middle: 'vd-sm-middle',
						bottom: 'vd-sm-bottom',
						halign: 'vd-sm-horz',
					},
					mobile: {
						reset: 	'',
						left: 	'vd-xs-left',
						center: 'vd-xs-center',
						right: 	'vd-xs-right',
						top: 		'vd-xs-top',
						middle: 'vd-xs-middle',
						bottom: 'vd-xs-bottom',
						halign: 'vd-xs-horz',
					},
				},
				content: {
					desktop: {
						reset: 	'',
						left: 	'vd-c-left',
						center: 'vd-c-center',
						right: 	'vd-c-right',
						top: 		'vd-c-top',
						middle: 'vd-c-middle',
						bottom: 'vd-c-bottom',
						halign: 'vd-horz',
					},
					tablet: {
						reset: 	'',
						left: 	'vd-c-sm-left',
						center: 'vd-c-sm-center',
						right: 	'vd-c-sm-right',
						top: 		'vd-c-sm-top',
						middle: 'vd-c-sm-middle',
						bottom: 'vd-c-sm-bottom',
						halign: 'vd-sm-horz',
					},
					mobile: {
						reset: 	'',
						left: 	'vd-c-xs-left',
						center: 'vd-c-xs-center',
						right: 	'vd-c-xs-right',
						top: 		'vd-c-xs-top',
						middle: 'vd-c-xs-middle',
						bottom: 'vd-c-xs-bottom',
						halign: 'vd-xs-horz',
					},
				}
			},

			visualDesignerManager: {

			},
			baseWidget: {
				widgetTypes: {

				},
			},
			rowWidget: {
				classes: ''
			}, 
			columnWidget: {
				// Column widths
				// 1: { classes: '' },
				// 2: { classes: '' },
				// 3: { classes: '' },
				// 4: { classes: '' },
				// 5: { classes: '' }
			},
			textWidget: {
				classes: '',
			},
			imgWidget: {
				classes: ''
			},
			btnWidget: {
				classes: ''
			},
			videoWidget: {
				classes: ''
			},

			customVDCreate: function() {
				
			}
		},

		_create: function () {
			// Frameworks are singletons
			if ($('[vd-framework="' + this.widgetName + '"]').length)	
				return false;		

			var options = {};
			$.extend( true, options, this.defaults, this.options );
			this.options = options;

			this.element.attr('vd-framework', this.widgetName);
			this.bindTriggers();
			this._super(); 
		},

		bindTriggers: function() {
			this.element.on('vdOnCreateRowWidget', this.vdOnCreateRowWidget.bind(this));
			this.element.on('vdOnCreateColumnWidget', this.vdOnCreateColumnWidget.bind(this));
			this.element.on('vdOnCreateDesigner', this.vdOnCreateDesigner.bind(this));
			this.element.on('vdOnResizeColumnWidget', this.vdOnResizeColumnWidget.bind(this));
			this.element.on('vdOnDesignerExport', this.vdOnDesignerExport.bind(this));
			this.element.on('vdOnManagerExport', this.vdOnManagerExport.bind(this));
			this.element.on('vdOnCreateMenu', this.vdOnCreateMenu.bind(this));
			this.element.on('vdOnPreCreateMenu', this.vdOnPreCreateMenu.bind(this));
			this.element.on('vdOnInitLinkInputMenu', this.vdOnInitLinkInputMenu.bind(this));
			this.element.on('vdOnPreInitialiseManager', this.vdOnPreInitialiseManager.bind(this));
			this.element.on('vdOnInitialiseFramework', this.vdOnInitialiseFramework.bind(this));
			this.element.on('vdOnShowMenu', this.vdOnShowMenu.bind(this));
			this.element.on('vdOnHideMenu', this.vdOnHideMenu.bind(this));
			this.element.on('vdOnSubmitSupportRequest', this.vdOnSubmitSupportRequest.bind(this));
			this.element.on('vdOnCreateTextWidget', this.vdOnCreateTextWidget.bind(this));
			this.element.on('vdOnCreateStructuralWidget', this.vdOnCreateStructuralWidget.bind(this));
			this.element.on('vdOnCreateBtnWidget', this.vdOnCreateBtnWidget.bind(this));

			this.element.on('vdOnCreateMapWidget', this.vdOnCreateMapWidget.bind(this));
			this.element.on('vdOnCreateAudioWidget', this.vdOnCreateAudioWidget.bind(this));
			this.element.on('vdOnCreateSliderWidget', this.vdOnCreateSliderWidget.bind(this));
			this.element.on('vdOnCreateHtmlWidget', this.vdOnCreateHtmlWidget.bind(this));
			this.element.on('vdOnCreateVideoWidget', this.vdOnCreateVideoWidget.bind(this));
			this.element.on('vdOnCreateHrWidget', this.vdOnCreateHrWidget.bind(this));
			this.element.on('vdOnCreateDropdownWidget', this.vdOnCreateDropdownWidget.bind(this));
			this.element.on('vdOnCreateMegaMenuWidget', this.vdOnCreateMegaMenuWidget.bind(this));

			this.element.on('vdOnCloneWidget', this.vdOnCloneWidget.bind(this));
			this.element.on('vdOnUnsetDynamic', this.vdOnUnsetDynamic.bind(this));
			this.element.on('vdOnSelectTemplate', this.vdOnSelectTemplate.bind(this));

			this.element.on('vdOnUpgradeWidget', this.vdOnUpgradeWidget.bind(this));
			this.element.on('vdOnBulkUpgradeWidget', this.vdOnBulkUpgradeWidget.bind(this));
		},

		// vdOnInitialiseManager: function(e, params) {
		// 	var self = this;
		// 	$.each(this.options.baseWidget.widgetTypes, function(cssCls, jsCls) {
		// 		$.vdg.manager('registerWidgetType', cssCls, jsCls);
		// 	});

		// 	$.each($.vdw.baseWidget.prototype.defaults.widgetTypes, function(cssCls, jsCls) {
		// 		if (self.options[jsCls])
		// 			$.vdg.manager('applyWidgetCustomisation', jsCls, self.options[jsCls]);
		// 	});
		// },

		getFrameworkNamespaces: function() {
			return [];
		},

		vdOnInitialiseFramework: function(e, params) {
			// Registering framework custom widgets and customised menus
			var self = this;

			var applyProperties = function(btns) {
				$.each(btns, function(btnName, btn) {
					if (btn.subMenu)
						applyProperties(btn.subMenu);
					else if (btn.input && btn.input.buttons)
						applyProperties(btn.input.buttons);
					btn.isFrameworkCustomised = true;
				});
			};

			$.each($.vdw, function(widgetClass, widgetProto) {
				if (self.options[widgetClass] && self.options[widgetClass].menuBtns) {
					applyProperties(self.options[widgetClass].menuBtns);
					// $.vdg.manager('applyWidgetCustomisation', jsCls, self.options[jsCls]);
				}
			});

			var menuBtns = (this.options.visualDesignerManager && this.options.visualDesignerManager.menuBtns) ? this.options.visualDesignerManager.menuBtns : {};
			$.vdg.manager('customiseMenu', this.element, menuBtns);


			if (self.options.simpleMode)
				$.vdg.manager().element.addClass('vd-simple');
		},

		vdOnCreateRowWidget: function(e, params) {

		},

		vdOnCreateColumnWidget: function(e, params) {

		},

		vdOnCreateDesigner: function(e, params) {

		},

		vdOnCreateTextWidget: function(e, params) { 

		},

		vdOnCreateBtnWidget: function(e, params) { 

		},

		vdOnCreateStructuralWidget: function(e, params) { 

		},

		vdOnCreateMapWidget: function(e, params) { 

		},

		vdOnCreateHtmlWidget: function(e, params) { 

		},

		vdOnCreateAudioWidget: function(e, params) { 

		},

		vdOnCreateSliderWidget: function(e, params) { 

		},

		vdOnCreateVideoWidget: function(e, params) { 

		},

		vdOnCreateHrWidget: function(e, params) { 

		},

		vdOnCreateDropdownWidget: function(e, params) { 

		},

		vdOnCreateMegaMenuWidget: function(e, params) { 

		},

		vdOnResizeColumnWidget: function(e, params) {

		},

		vdOnDesignerExport: function(e, params) {

		},

		vdOnManagerExport: function(e, params) {

		},

		vdOnPreCreateMenu: function(e, params) { 

		},

		vdOnCreateMenu: function(e, params) { 

		},

		vdOnInitLinkInputMenu: function(e, params) { 

		},

		vdOnPreInitialiseManager: function(e, params) {

		},

		vdOnShowMenu: function(e, params) {

		},

		vdOnHideMenu: function(e, params) {

		},

		vdOnCloneWidget: function(e, params) {

		},

		vdOnUnsetDynamic: function(e, params) {

		},

		vdOnSelectTemplate: function(e, params) {

		},

		vdOnSubmitSupportRequest: function(e, params) {

		},

		vdOnUpgradeWidget: function(e, params) {

		},

		vdOnBulkUpgradeWidget: function(e, params) {

		},
	});

})( jQuery, window, document );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.baseMenu", $.vd.base, {

		options: {
			menuName: '',
			menuBtns: {
				// "link": {
				// 	index: 994,
				// 	icon: "&#xE157;",
				// 	popupText: 'Link',
				// 	input: {
				// 		type: 'link-input',
				// 		icon: "&#xE157;",
				// 		placeholder: 'http://',
				// 		popupText: 'Toggle link',
				// 		callback: function(values, target) {

				// 			return this.onAnchorChange(values, target);
				// 		},
				// 		show: function() {
				// 			var ele = (this.selection) ? this.selection() : this.target;
				// 			var link = ele.parent('a[vd-link="true"]');

				// 			if (!link || link.length <= 0)
				// 				return null;

				// 			return {
				// 				href: link.attr('href'),
				// 				target: link.attr('target')
				// 			};
				// 		}
				// 	}
				// },
			}
		},

		backAttribs: {
			index: 1,
			icon: '&#xE5CE;',
			popupText: 'Back',
			classes: 'vd-back-menu-btn'
		},

		_create: function () {
			var self = this;

			if (!this.options.menuName || !this.options.menuName.length)
				throw 'baseMenu must have a menuName option';
			if (!this.options.curFramework || !this.options.curFramework.length)
			 	throw "baseMenu must have a framework instance 'curFramework' in options.";
			self._super();

			// Record framework on menu
			this.element.attr(this.options.curFramework.attr('vd-framework'), true);

			self.element.addClass('vd-menu');
			self.element.attr('vd-menu', this.options.menuName);
		},

		updateMenu: function(frameworkOpts) {
			this.options.curFramework = frameworkOpts.curFramework;
			// Create menu buttons:
			this._buildMenu(frameworkOpts.menuBtns, true);
		},

		framework: function(func, params) {
			return gSelWidget.element.vdPolymorphic('framework', func, params);
		},

		getFramework: function() {
			return gSelWidget.element.vdPolymorphic('getFramework');
		},

		getFrameworkName: function() {
			return gSelWidget.element.vdPolymorphic('getFrameworkName');
		},

		show: function(e, isLocked, btnsToHide) {
			btnsToHide = btnsToHide || [];
			this.element.addClass('vd-sel-menu');
			// var simpleMode = this.framework('option', 'simpleMode');
			var frameworkName = this.getFrameworkName();
			this.element.find('.vd-menu-btn:not([' + frameworkName + '])').hide();
			this.element.find('.vd-menu-btn[' + frameworkName + '], vd-menu-btn.vd-back-menu-btn').show();

			// if (simpleMode) {
			// 	this.element.find('.vd-menu-btn[' + frameworkName + ']:not([vd-simple])').hide();
			// }

			for (var i in btnsToHide)
				this.element.find('.vd-menu-btn[' + frameworkName + '][vd-name="' + btnsToHide[i] + '"]').hide();

			// this.element.show();
			this.element.addClass('vd-menu-show');

			if (this.options.show)
				this.options.show.call(this, e, isLocked, this.getFramework()); //  this.options.show(e, isLocked);

			this.getFramework().trigger('vdOnShowMenu', {menu: self});
		},

		hide: function(e, toMenu, isLocked) {
			this.element.removeClass('vd-sel-menu'); // must have this!
			// this.element.hide();
			this.element.removeClass('vd-menu-show');

			if (this.options.hide)
				this.options.hide.call(this, e, toMenu, isLocked); // this.options.hide(e, toMenu, isLocked);
			
			this.getFramework().trigger('vdOnHideMenu', {menu: self});
		},

		manualShow: function(e) {
			this.show(e);
		},

		// For positioning the menu above the selected widget
		// position: function(widget) {
		// 	var self = this;

		// 	setTimeout(function() {
		// 		var menuCnt = self.element.closest('.vd-menu-container');
		// 		var pos = widget.element.offset();
		// 		// menuCnt.css({
		// 		// 	left: '0px',
		// 		// 	top: '0px'
		// 		// });
		// 		menuCnt.css({
		// 			width: '400px',
		// 			left: pos.left + widget.element.outerWidth(),
		// 			top: pos.top - menuCnt.outerHeight() - 3
		// 		});
		// 	}, 10);
		// },

		_buildMenu: function(btns, updatingMenu) {
			var self = this;
			btns = btns || self.options.menuBtns;

			btns = this._sortBtns(btns);

			// if (self.options.menuName.trim().toLowerCase() == 'style')
			// 	console.log('style btns', btns);
			$.each(btns, function(i, btn) {
				// if (btn.name.trim().toLowerCase() == 'padding') {
				// 	console.log('1 num exist', self.element.children('[vd-name="' + btn.name + '"]').length);
				// }
				var create = true;
				var btnEle = self.element.children('[vd-name="' + btn.name + '"]');
				var existingMenu = self.element.parent().children('[vd-menu="' + btn.name + '"]');
				var btnExists = btnEle.length;

				// Update
				if (btnExists && !btn.isFrameworkCustomised && !btnEle[0].hasAttribute('vd-cust')) {
					create = false;
					existingMenu.attr(self.options.curFramework.attr('vd-framework'), true);
					if (!btn.hidden)
						btnEle.attr(self.options.curFramework.attr('vd-framework'), true);
				}
				// Create
				else {
					btnEle = self._createBtn(self.element, btn);

					if (updatingMenu)
						self._positionBtn(self.element, btnEle, btn.index);
				}

				btn.menuName = btn.name;
				btn.parent = self;
				btn.menuBtn = btnEle;
				btn.menuBtns = btn.subMenu;
				btn.curFramework = self.options.curFramework;

				// if button opens a input
				if (btn.input && !btn.disableDefault) { 
					// btn.menuName = btn.name;
					// btn.parent = self;
					// btn.menuBtn = btnEle;
					// btn.curFramework = self.options.curFramework;
				 	
				 	if (create)
						$('<div></div>').appendTo(self.element.parent())[btn.input.type](btn); //iArgs);
					else existingMenu[btn.input.type]('updateMenu', btn);
				}
				// if button opens a submenu
				else if (btn.subMenu) {
					// btn.menuName = btn.name;
					// btn.parent = self;
					// btn.menuBtn = btnEle;
					// btn.menuBtns = btn.subMenu;
					// btn.curFramework = self.options.curFramework;
					
					if (create)
						$('<div></div>').appendTo(self.element.parent()).subMenu(btn); //args);
					else existingMenu.subMenu('updateMenu', btn);
				}

				// if (btn.name.trim().toLowerCase() == 'padding') {
				// 	console.log('1 num exist', self.element.children('[vd-name="' + btn.name + '"]').length);
				// }
			});
		},

		_createBtn: function(parent, attribs, prepend) {
			var btn = $('<a></a>')
				.attr('href', '#')
				.attr('vd-name', attribs.name)
				//.attr('vd-value', attribs.value)
				.attr('index', attribs.index)
				.attr('vd-type', attribs.type)
				// .attr(this.options.curFramework.attr('vd-framework'), true)
				.addClass('vd-menu-btn')
				.addClass(attribs.classes);

			if (prepend)
				btn.prependTo(parent);
			else btn.appendTo(parent);

			btn.popOverWidget({title: '', content: attribs.popupText});
  				
			var iconEle = $('<i></i>')
				.addClass('vd-icon')
				.attr('aria-hidden', 'true')
				.appendTo(btn);

			if (attribs.faIcon) {
				iconEle.addClass('' + attribs.faIcon);
			}
			else {
				iconEle
					.addClass('material-icons')
					.html(attribs.icon);
			}

			// if (attribs.hidden)
			// 	btn.addClass('vd-menu-hidden'); //  btn.css('display', 'none');
			if (!attribs.hidden)
				btn.attr(this.options.curFramework.attr('vd-framework'), true);
			if (attribs.isLayout)
				btn.attr('vd-layout', 'true');
			if (attribs.isFrameworkCustomised)
				btn.attr('vd-cust', 'true');
			if (attribs.simple)
				btn.attr('vd-simple', 'true');

			var cback = (attribs.defCallback) ? attribs.defCallback : function(e) {
					e.preventDefault();
	 				if (gSelWidget && gSelWidget.isProcessing)
						return false;

					var ele = attribs.element || gSelWidget.element;
					console.log('conditionally call callback on menu or widget based of defCallback presence');
					if (attribs.callback)
						attribs.callback.call(gSelWidget, btn);
					if (attribs.menuCallback)
						attribs.menuCallback.call(this, btn, gSelWidget);
					return false;
				};

			if (attribs.callback)
				btn.on($.vdg.manager('btnBindEvt'), cback);

			return btn;
		},

		_sortBtns: function(btns) {
			var arr = [];
			for (var key in btns) {
				btns[key].name = btns[key].name || key;
				arr.push(btns[key]);
			} 

			arr.sort(function(a, b) {
				return (a.index || 9999) - (b.index || 9999);
			});

			return arr;
		},

		_positionBtn: function(parent, btnEle, index) {
			var insertionIndex = 0;
			var menuBtns = parent.children('.vd-menu-btn');
			var maxIndex = -1;

			// where > 996 AND < 998
			var res = menuBtns.each(function (i, e) {
				maxIndex = parseInt($(this).attr('index'),10);
				if (maxIndex >= index) {
					insertionIndex = i+1;
					btnEle.insertAfter($(this));
					return false;
				}
			});

			if (!insertionIndex && index > maxIndex)
				btnEle.appendTo(parent);
			else if (!insertionIndex && index <= maxIndex)
				btnEle.prependTo(parent);
		},

		_addBackBtn: function(parent) {
			var self = this;
			var backBtn = this._createBtn(self.element, self.backAttribs, true);
			backBtn.on($.vdg.manager('btnBindEvt'), function(e) {
				e.preventDefault();
 				self.hide(e, parent);
 				parent.show(e);
				return false;
			});
		},

		beginSpinBtn: function(btn) {
			var icon = $('.vd-icon', btn);
			icon.attr('vd-icon', icon.html());
			icon.html('&#xE86A;');
			icon.addClass('anim-spin');
		},

		endSpinBtn: function(btn) {
			// console.log('endSpinBtn', btn);
			var icon = $('.vd-icon', btn);
			icon.html(icon.attr('vd-icon'));
			icon.attr('vd-icon', '');
			icon.removeClass('anim-spin');
		}
	});




	$.widget( "vd.mainMenu", $.vd.baseMenu, {

		options: {
			widgetAssoc: null,
		},

		_create: function () {
			this.options.menuName = this.options.widgetAssoc + '-menu';
			var self = this;

			self._super();
			// console.log('mainMenu', this.options.menuName, this.options.menuBtns);
			var framework = this.options.curFramework;

			// Wrap in <div>
			var cnt = $('<div></div>')
				.addClass('vd-menu-container vd-menu-group')
				.attr('data-type', this.options.widgetAssoc + '-menu');

			self.element.wrap(cnt);

			// Add class vd-main-menu
			self.element.addClass('vd-main-menu vd-main-menu');

			framework.trigger('vdOnPreCreateMenu', {menu: self});

			// Create menu buttons:
			self._buildMenu();

			framework.trigger('vdOnCreateMenu', {menu: self});
		},

		addFramework: function(frameworkOpts) {
			this.element.attr(frameworkOpts.curFramework.attr('vd-framework'), true);
			this.updateMenu(frameworkOpts);
		},

		show: function(e, isLocked, btnsToHide) {
			var selSiblingMenu = $('.vd-menu.vd-sel-menu', this.element.closest('.vd-menu-container'));
			if (selSiblingMenu && selSiblingMenu.length)
				selSiblingMenu.vdPolymorphic('hide', e, this, isLocked);

			this._super(e, isLocked, btnsToHide);

			if (isLocked)
				this.lockMenu();
		},

		hide: function(e, isLocked) {
			this._super(e, isLocked );

			var cnt = this.element.closest('.vd-menu-container');
			$('.vd-menu.vd-sel-menu', cnt)
				.vdPolymorphic('hide', e, this, isLocked);
				//.removeClass('vd-sel-menu');

			if (isLocked)
				this.unlockMenu();
		},

		lockMenu: function() {
			// this.element.children('.vd-menu-btn').not('[vd-name="lock"]').addClass('hidden');
			this.element.children('.vd-menu-btn[vd-layout="true"]').addClass('hidden');
			this.element.find('.vd-menu-btn[vd-name="lock"] .vd-icon').html('lock');
		},

		unlockMenu: function() {
			// this.element.children('.vd-menu-btn.hidden').removeClass('hidden');
			this.element.children('.vd-menu-btn[vd-layout="true"]').removeClass('hidden');
			this.element.find('.vd-menu-btn[vd-name="lock"] .vd-icon').html('lock_open');
		},
	});




  $.widget( "vd.subMenu", $.vd.baseMenu, {

		options: {
			
		},

		_create: function () {
			var self = this;
			self._super();
			var framework = this.options.curFramework;

			// if (this.options.menuName.trim().toLowerCase() == 'style')
			// 	console.log('subMenu', this.options.menuName, this.options);

			self.element.addClass('vd-sub-menu');

			// Add back button
			this._addBackBtn(self.options.parent);

			this.options.menuBtn.on($.vdg.manager('btnBindEvt'), function(e) {
				e.preventDefault();
 				self.options.parent.hide(e, self);
 				self.show(e);
				return false;
			});

			framework.trigger('vdOnPreCreateMenu', {menu: self});

			// Create menu buttons:
			self._buildMenu();

			framework.trigger('vdOnCreateMenu', {menu: self});
		},

		manualShow: function(e) {
			this.options.parent.hide(e, this);
 			this.show(e);
		}
	});




  $.widget( "vd.inputMenu", $.vd.baseMenu, {

		options: {
			classes: '',
		},

		_create: function () {
			var self = this;
			self._super();
			var framework = this.options.curFramework;

			// if (this.options.menuName.trim().toLowerCase() == 'padding') {
			// 	console.log('inputMenu', this.options.menuName, this.options);
			// }
			self.element.addClass('vd-input-widget vd-sub-menu vd-btn-group vd-btn-group-lg'); 

			// Add back button
			self._addBackBtn(self.options.parent);

			self._buildInput();

			self.options.menuBtn.on($.vdg.manager('btnBindEvt'), function(e) {
				e.preventDefault();
 				self.options.menuBtn.parent().vdPolymorphic('hide', e, self);
 				self.show();
				return false;
			});

			framework.trigger('vdOnPreCreateMenu', {menu: self});

			// Create menu buttons:
			self._buildMenu(self.options.input.menuBtns);

			framework.trigger('vdOnCreateMenu', {menu: self});
		},

		_buildInput: function() {
			var self = this;
			this._addSubmitBtn(this.options.input);

			this.inputEle = $('<input></input>')
				.attr('vd-name', this.options.menuName)
				.attr('aria-describedby', '')
				.attr('placeholder', this.options.placeholder)
				.attr('title', this.options.tooltip)
				.addClass('vd-form-control vd-input-lg')
				.appendTo(this.element);

			this.inputEle.on('keypress',function(e) {
				// on enter
		    if(e.which == 13) {
		      self.inputCallback(e);
		    }
			});
		},

		updateMenu: function(frameworkOpts) {
			this.options.curFramework = frameworkOpts.curFramework;
			$('.vd-menu-btn', this.element).attr(this.options.curFramework.attr('vd-framework'), true);
		},

		validate: function() {
			console.log('validate');
			var values = {};
			$('[vd-name]', this.element).each(function(i,e) {
				console.log($(this).attr('vd-name'), $(this).attr('vd-value'));
				values[$(this).attr('vd-name')] = $(this).attr('vd-value') || $(this).val();
			});

			if (this.selection)
				values.selection = this.selection;

			return values;
		},

		show: function() {
			this._super();

			var values = this.options.input.show ? this.options.input.show.call(gSelWidget, this) : null;
			if (values)
				this.prepopulate( values );
		},

		prepopulate: function(values) {
			this.inputEle.val( values || '' );
			this.selection = values.selection || false;
		},

		inputCallback: function(e) {
			e.preventDefault();
			e.stopPropagation();

			var values = this.validate(e);
			if (!values)
				return false;

			// this.options.input.callback.call(gSelWidget, values, $(this));
			this.options.input.callback.call(gSelWidget, values, e.target, {}, this);
		},

		_addSubmitBtn: function(attribs) {
			var self = this;
			attribs.defCallback = function(e) {
				self.inputCallback(e);
			};
			var btn = this._createBtn(self.element, attribs, false);

			btn.attr('vd-submit', true);
		},

		beginSpinBtn: function(btn) {
			if (!btn || !btn.length)
				btn = $('[vd-submit]', this.element).first();
			return this._super(btn);
		},

		endSpinBtn: function(btn) {
			if (!btn || !btn.length)
				btn = $('[vd-submit]', this.element).first();
			return this._super(btn);
		}
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdr.baseWidget", {

		name: "base-widget",
		vdType: 'base',

		defaults: {
			
		},

		_create: function () {
			this._super();

			if (this.options.editMode)
				this.renderEdit();
			else this.renderRelease();
		},

		renderEdit: function () {

		},

		renderRelease: function () {

		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
// https://fingerprintjs.com/ 
(function ($) {

 	$.fn.vdPolymorphic = function() {
 		var ele = $(this);
 		if (ele && ele.length && ele.data('widgetName')) {
 			return ele[ele.data('widgetName')].apply(this, arguments);
 		}
 	};



  $.vdg.widget = function(ele, func, ...rest) {
		if (ele && ele.length && ele.data('widgetName')) {
		  return ele[ele.data('widgetName')](func+'', ...rest);
		}
  };



  $.vdg.widgetFactory = function(widgetType, options, parent, root, prepend) {
  	if (!root)
  		root = '<div></div';

		var widget;
		if (prepend)
			widget = $(root).prependTo(parent)[widgetType](options);
		else widget = $(root).appendTo(parent)[widgetType](options);

		widget.vdPolymorphic('select');

		return widget;
  };




  $.widget( "vdw.baseWidget", $.vd.base, {

  	// vdType: 'base',

		options: { },

		defaults: {
			// width: "10%",
			// height: "10%",
			widgetClass: "vd-widget",
			template: "<span>Default content</span>",
			undoCreation: true,
			sortContainer: null,
			layoutPrompt: false,
			widgetTypes: { 
				'text': 			'textWidget', 
				'img': 				'imgWidget', 
				'video': 			'videoWidget', 
				'audio': 			'audioWidget', 
				'btn': 				'btnWidget', 
				'column': 		'columnWidget', 
				'row': 				'rowWidget', 
				'component': 	'componentWidget', 
				'section': 		'sectionWidget',
				'icon': 			'iconWidget',
				'iconTxt': 		'iconTxt',
				'html': 			'htmlWidget',
				'container': 	'containerWidget',
				'hr': 				'hr'
			},
			menuBtns: {
				"link": {
					index: 994,
					icon: "&#xE157;",
					popupText: 'Link',
					input: {
						type: 'linkInput',
						icon: "&#xE157;",
						placeholder: 'http://',
						popupText: 'Toggle link',
						callback: function(values, target) {

							return this.onAnchorChange(values, target);
						},
						show: function() {
							var link = this.element.find('a[vd-type="link"]').first();
							if (!link || link.length <= 0)
								return null;

							return {
								href: link.attr('href'),
								target: link.attr('target')
							};
						}
					}
				},
				"style": {
					index: 995,
					icon: "&#xE40A;", //"&#xE3B7;", alt icon
					popupText: 'Style',
					subMenu: {
						"colour": {
							index: 1,
							icon: "&#xE23C;",
							popupText: 'Foreground colour',
							input: {
								type: 'inputMenu',
								icon: "&#xE23C;",
								placeholder: '#123abc',
								popupText: 'Set foreground colour',
								callback: function(values, target) {

									return this.onForeColourChange(values, target);
								},
								show: function() {
									return this.target.css('color');
								}
							}
						},
						"background-colour": {
							index: 1,
							icon: "&#xE23A;",
							popupText: 'Background colour',
							input: {
								type: 'inputMenu',
								icon: "&#xE23A;",
								placeholder: '#123abc',
								popupText: 'Set background colour',
								callback: function(values, target) {

									return this.onBackColourChange(values, target);
								},
								show: function() {
									return this.target.css('background-color');
								}
							}
						},
						"background-image": {
							index: 2,
							icon: "&#xE3B6;",
							popupText: 'Background image',
							subMenu: {
								'src': {
									icon: '&#xE3B6;',
									popupText: 'Image',
									type: 'vd-colour-picker',
									disableDefault: true,
									callback: function(values, target) {
										this.onBkImgChange({src: ''}, target);
									},
								},
								'left': {
									icon: '&#xE236;',
									popupText: 'Left align image',
									callback: function(values, target) {
										return this.onBkImgChange({position: 'left center'}, target);
									}
								},
								'center': {
									icon: '&#xE234;',
									popupText: 'Center align image',
									callback: function(values, target) {
										return this.onBkImgChange({position: 'center center'}, target);
									}
								},
								'right': {
									icon: '&#xE237;',
									popupText: 'Right align image',
									callback: function(values, target) {
										return this.onBkImgChange({position: 'right center'}, target);
									}
								},
								'cover': {
									icon: '&#xE5D0;',
									popupText: 'Cover background',
									callback: function(values, target) {
										return this.onBkImgChange({size: 'cover'}, target);
									}
								},
								'contain': {
									icon: '&#xE5D1;',
									popupText: 'Contain background',
									callback: function(values, target) {
										return this.onBkImgChange({size: 'contain'}, target);
									}
								},
								'local': {
									icon: '&#xE898;',
									popupText: 'Static background image',
									callback: function(values, target) {
										return this.onBkImgChange({attachment: 'local'}, target);
									}
								},
								'fixed': {
									icon: '&#xE899;',
									popupText: 'Parallax background image',
									callback: function(values, target) {
										return this.onBkImgChange({attachment: 'fixed'}, target);
									}
								},
								'reset': {
									name: 'reset',
									popupText: 'reset',
									faIcon: 'fas fa-eraser',
									callback: function(values, target) {
										return this.onBkImgChange({reset: true}, target);
									}
								},
								// 'overlay': {
								// 	icon: '&#xE3C6;',
								// 	popupText: 'Set overlay',
								// 	type: 'vd-colour-picker',
								// 	disableDefault: true,
								// }
							}
						},
						"margin": {
							index: 3,
							icon: "&#xE915;",
							popupText: 'Margin',
							input: {
								type: 'multiInput',
								icon: "&#xE915;",
								popupText: 'Set margin',
								buttons: {
									'margin-top': {
										name: 'top',
										placeholder: 'top',
										tooltip: 'Margin Top',
										dblClick: '[vd-name="margin-bottom"]',
										trplClick: '[vd-name]',
									},
									'margin-bottom': {
										name: 'bottom',
										placeholder: 'bottom',
										tooltip: 'Margin Bottom',
										dblClick: '[vd-name="margin-top"]',
										trplClick: '[vd-name]',
									},
									'margin-left': {
										name: 'left',
										placeholder: 'left',
										tooltip: 'Margin Left',
										dblClick: '[vd-name="margin-right"]',
										trplClick: '[vd-name]',
									},
									'margin-right': {
										name: 'right',
										placeholder: 'right',
										tooltip: 'Margin Right',
										dblClick: '[vd-name="margin-left"]',
										trplClick: '[vd-name]',
									},
								},
								callback: function(values, target) {
									return this.onMarginChange(values, target);
								},
								show: function() {
									var self = this;
									return {
										'margin-top': 		self.target.css('margin-top'),
										'margin-bottom': 	self.target.css('margin-bottom'),
										'margin-left': 		self.target.css('margin-left'),
										'margin-right': 	self.target.css('margin-right'),
									};
								}
							}
						},
						"padding": {
							index: 4,
							icon: "&#xE8D4;",
							popupText: 'Padding',
							input: {
								type: 'multiInput',
								icon: "&#xE8D4;",
								placeholder: '20px 10px',
								popupText: 'Set padding',
								buttons: {
									'padding-top': {
										placeholder: 'top',
										tooltip: 'Padding Top',
										dblClick: '[vd-name="padding-bottom"]',
										trplClick: '[vd-name]',
									},
									'padding-bottom': {
										placeholder: 'bottom',
										tooltip: 'Padding Bottom',
										dblClick: '[vd-name="padding-top"]',
										trplClick: '[vd-name]',
									},
									'padding-left': {
										placeholder: 'left',
										tooltip: 'Padding Left',
										dblClick: '[vd-name="padding-right"]',
										trplClick: '[vd-name]',
									},
									'padding-right': {
										placeholder: 'right',
										tooltip: 'Padding Right',
										dblClick: '[vd-name="padding-left"]',
										trplClick: '[vd-name]',
									},
								},
								callback: function(values, target) {

									return this.onPaddingChange(values, target);
								},
								show: function() {
									var self = this;
									return {
										'padding-top': 		self.target.css('padding-top'),
										'padding-bottom': self.target.css('padding-bottom'),
										'padding-left': 	self.target.css('padding-left'),
										'padding-right': 	self.target.css('padding-right'),
									};
								}
							}
						},
						"border": {
							index: 5,  
							icon: "&#xE22F;", // border_outer "fa fa-picture-o",
							popupText: 'Border',
							input: {
								type: 'borderInput',
								icon: "&#xE22F;", // border_outer "fa fa-picture-o",
								popupText: 'Set border widths',
								buttons: {
									'border-top-width': {
										placeholder: 'top',
										tooltip: 'Border Width Top',
										dblClick: '[vd-name="border-bottom-width"]',
										trplClick: '[vd-name]',
									},
									'border-bottom-width': {
										placeholder: 'bottom',
										tooltip: 'Border Width Bottom',
										dblClick: '[vd-name="border-top-width"]',
										trplClick: '[vd-name]',
									},
									'border-left-width': {
										placeholder: 'left',
										tooltip: 'Border Width Left',
										dblClick: '[vd-name="border-right-width"]',
										trplClick: '[vd-name]',
									},
									'border-right-width': {
										placeholder: 'right',
										tooltip: 'Border Width Right',
										dblClick: '[vd-name="border-left-width"]',
										trplClick: '[vd-name]',
									},
								},
								callback: function(values, target) {
									return this.onBorderChange(values, target);
								},
								show: function() {
									var self = this;
									return {
										'border-top-width': self.target.css('border-top-width'),
										'border-bottom-width': self.target.css('border-bottom-width'),
										'border-left-width': self.target.css('border-left-width'),
										'border-right-width': self.target.css('border-right-width'),
										'border-style': self.target.css('border-style'),
										'border-color': self.target.css('border-color'),
									};
								}
							}
						},
						"box-shadow": {
							hidden: true,
							index: 6,
							icon: "&#xE883;",
							popupText: 'Shadow',
							input: {
								icon: "&#xE883;",
								type: 'shadowInput',
								popupText: 'Set shadow',
								callback: function(values, target) {
									return this.onShadowChange(values, target);
								},
								show: function() {
									return this.target.css('box-shadow');
								}
							}
						},
						// "border-radius": {
						// 	index: 6,
						// 	icon: "&#xE920;",
						// 	popupText: 'Set border radius',
						// 	input: {
						// 		type: 'sliderInput',
						// 		icon: "&#xE920;",
						// 		popupText: 'Resize column width',
						// 		//value: 1,
						// 		min: 1,
						// 		max: 300,
						// 		step: 1,
						// 		callback: function(value) {
									
						// 			return this.onBorderRadiusChange(value);
						// 		},
						// 	},
						// },
						"set-dimensions": {
							index: 8,
							icon: "&#xE85B;",
							popupText: 'Set dimensions',
							autoPreview: true,
							input: {
								type: 'dimensionsInput',
								icon: "&#xE85B;",
								callback: function(values, target) {
									return this.onSetDimensions(values, target);
								},
								show: function() {
									var self = this;
									return {
										width: self.element.attr('vd-width'),
										height: self.element.attr('vd-height')
									};
								}
							}
						},
						"align-self": {
							index: 7,
							icon: "&#xE234;",
							popupText: 'Align widget',
							input: {
								type: 'radioInput',
								menuBtns: {
									'reset': {
										name: 'reset',
										popupText: 'reset',
										faIcon: 'fas fa-eraser'
									},
									'left': {
										name: 'left',
										popupText: 'Left',
										icon: '&#xE236;'
									},
									'center': {
										name: 'center',
										popupText: 'Center',
										icon: '&#xE234;'
									},
									'right': {
										name: 'right',
										popupText: 'Right',
										icon: '&#xE237;'
									}
								},
								callback: function(values, target) {
									return this.onAlignChange(values, target);
								},
								show: function() {
									return this.target.css('text-align');
								}
							}
						},
						"visibility": {
							index: 9,
							icon: "&#xe327;",
							popupText: 'Hide on devices',
							input: {
                type: 'radioInput',
                menuBtns: {
                  'desktop-view': {
                    name: 'vd-desktop-hidden',
                    popupText: 'Hide on desktop',
                    icon: '&#xE30B;'
                  },
                  'tablet-view': {
                    name: 'vd-tablet-hidden',
                    popupText: 'Hide on tablet',
                    icon: '&#xE331;'
                  },
                  'mobile-view': {
                    name: 'vd-mobile-hidden',
                    popupText: 'Hide on mobile',
                    icon: '&#xE325;'
                  }
                },
                callback: function(values, target) {
                	this.onToggleDisplay(values, target);
                }
              },
							// menuBtns: {
							// 	"reset-visibility": {
							// 		index: 1,
							// 		icon: "restore_page",
							// 		popupText: 'Reset visibility settings',
							// 		callback: function(btn, btnOptions) {
							// 			return this.onResetDisplay(btn, btnOptions);
							// 		}
							// 	},
							// }
						},
						"custom-style": {
							index: 200,
							icon: "&#xE41D;",
							popupText: 'Custom Styling',
							subMenu: {
								"set-style": {
									index: 1,
									icon: "&#xE41D;",
									popupText: 'Style',
									input: {
										type: 'textareaInput',
										icon: "&#xE41D;", 
										placeholder: 'color: #000; font-size: 1rem;',
										popupText: 'Set custom css',
										tooltip: 'Enter CSS here',
										callback: function(values, target) {
											return this.onCustomStyleChange(values, target);
										},
										show: function() {
											return this.target.attr('style');
										}
									}
								},	
							// "set-script": {
							// 	index: 2,
							// 	icon: "fa fa-camera",
							// 	input: {
							// 		type: 'textareaInput',
							// 		icon: "fa fa-font",
							// 		placeholder: 'helvetica',
							// 		callback: function(value) {

							// 			//this.attribute('style', value);
							// 		}
							// 	}
							// },
								"copy-style": {
									index: 2,
									faIcon: "fas fa-copy",
									popupText: 'Copy style',
									callback: function(btn, btnOptions) {
										return this.onCopyStyle(btn, btnOptions);
									}
								},
								"paste-style": {
									index: 2,
									faIcon: "fas fa-paste",
									popupText: 'Paste style',
									callback: function(btn, btnOptions) {
										return this.onPasteStyle(btn, btnOptions);
									}
								},
							}
						},
					}
				},
				"seo": {
					hidden: true,
					index: 995,
					icon: "&#xE894;",
					popupText: 'SEO',
					callback: function(btn, btnOptions) {
						return $.vdg.manager('showDialogMsg', {title: 'Feature incoming...', content: '<p>SEO validation coming soon.</p>'}); 
					}
				},
				"create-component": {
					hidden: true,
					index: 996,
					icon: "&#xE8FC;",
					popupText: 'Turn inner contents into a component',
					callback: function(btn, btnOptions) {
						return this.onCreateComponent(btn, btnOptions);
					}
				},
				"clone": {
					index: 997,
					icon: "&#xE14D;",
					popupText: 'Clone',
					callback: function(btn, btnOptions) {
						return this.onClone(btn, btnOptions);
					}
				},
				"trash": {
					index: 999,
					icon: "&#xE872;",
					popupText: 'Trash',
					callback: function(btn, btnOptions) {
						return this.onTrash(btn, btnOptions);
					}
				}
			},
		},

		target: null,

		isProcessing: false,

		_create: function () {
			this._super();
			var self = this;

			if (self.options.tagName && self.options.tagName.trim().toLowerCase() !== self.defaults.tagName.trim().toLowerCase())
				self.element.attr('vd-tag-name', self.options.tagName);

			// BOTTLENECK biggest bottleneck
			if (this.options.defer && !this.options.tabletIdentifier) {
				setTimeout(function() {
					gManager.visualDesignerManager('initWidgetMenu', self, self.options.menuBtns, self.getFramework());
				}, $.VD_DEFER);
			}
			else {
				gManager.visualDesignerManager('initWidgetMenu', self, self.options.menuBtns, self.getFramework());
			}

			if (!self.vdType)
				throw 'Widget declared without a vdType property. Must have a vdType property';
			self.element.attr('vd-type', self.vdType);

			if (self.element[0].hasAttribute('vd-disabled'))
				return;

			if (!self.element.attr('id') || self.options.applyNewId)
				self.uniqueId();
			if (!self.target)
				self.target = self.element;

			this.options.tagName = this.element.attr('vd-designer-name') || this.element.attr('vd-tag-name') || this.options.tagName || this.widgetName;
			// self.element.data('widgetName', self.widgetName);

			// BOTTLENECK 2nd biggest
			if (!this.options.noRegisterStyle) {
				if (this.options.defer)
					setTimeout(function() {
						self.registerWidgetStyle();
					}, $.VD_DEFER);
				else self.registerWidgetStyle();
			}

			if (!self.options.preserveContent)
				self.addDefaultContent();
			else self.initTargetEle();
			
			self.element.hover(function(e) {
				if (e.target == this)
			    	self.hover(e);
			}, function(e) {
			    
			});

			self.element.on(self.options.selectionEvent || $.vdg.manager('btnBindEvt'), function(e) {
				if ($(e.target).hasClass('vd-ignore'))
					return;
		    e.stopPropagation();
		    e.preventDefault();
		    self.select(e);
			});

			self.initDraggable();

			self.getFramework().trigger('vdOnCreateWidget', {widget: self});

			if (self.options.upgrade) {
				if (this.options.defer)
					setTimeout(function() {
						self._upgrade(self.options.upgrade);
					}, $.VD_DEFER);
				else self._upgrade(self.options.upgrade);
			}

			if (self.options.undoCreation)
				$.vdg.undoWidget('registerUndo', [{ action: 'add', target: self.element }]);
		},

		/* Causes error when changing tag type */
		_destroy: function () {

		},
		
		_update: function() {
			// Shouldn't this be calling super!?
		},

		_setOption: function ( key, value ) {
			// For UI 1.8, _setOption must be manually invoked
			// from the base widget
			// $.Widget.prototype._setOption.apply( this, arguments );
			// For UI 1.9 the _super method can be used instead
			this._super(key, value );
		},

		uniqueId: function() {
			this.element.attr('id', $.vdg.manager('generateId', this.getDesigner().attr('id')));
		},

		initOptions: function(forceReinit) {
			var self = this;

			if (self.optionsInitialised && !forceReinit)
				return;

			var options = {};
			$.extend( true, options, self.defaults || {}, self.framework('option', 'baseWidget') || {}, self.framework('option', self.widgetName) || {}, self.options );
			// $.extend( true, options, self.defaults || {}, self.framework('option', 'baseWidget'), self.options );
			self.options = options;
			self.optionsInitialised = true;
		},

		addDefaultContent: function() {
			var self = this;
			if (this.options.layoutPrompt)
				this.element.layoutPrompt({ layoutOptions: self.options.layoutPrompt});
			else this.element.append(this.options.template);

			self.initTargetEle();
			// self.element.addClass('vd-c-middle');
			// self.target.addClass('vd-c-middle');
		},

		removeDefaultContent: function() {
			this.element.empty();
		},

		initTargetEle: function(targetEle) {
			// targetEle = $(targetEle) || this.element.children('[vd-target]').first();
			targetEle = targetEle || this.element.children('[vd-target]').first();
			if (!targetEle || !targetEle.length) {
				this.target = this.element;
				return;
			}
			if (targetEle.is(this.element))
				return;

			this.target = targetEle;
			if (!this.target.attr('id'))
				this.target.attr("id", $.vdg.manager('generateId', this.getDesigner().attr('id')));

			this.registerWidgetStyle( '#'+this.target.attr("id") );
		},

		getTarget: function() {
			return this.target;
		},

		setTarget: function(target) {
			this.target = target;
		},

		select: function(e) {
			if (this.options.deactivated)
				return;
			if (gManager.vdPolymorphic('getState').isDragging)
				return;

			gSelWidget.element.vdPolymorphic('deselect', e);
		  gSelWidget = this;
			
			$('.vd-widget-selected').removeClass('vd-widget-selected');
			this.element.addClass('vd-widget-selected');
		  $.vdg.manager('getMenu').vdPolymorphic('show', e, this.isLocked());
		  this.getMenu().vdPolymorphic('show', e, this.isLocked(), this.options.hiddenMenuBtns);
			this.showTag();
		  this.element.trigger('vdSelect', {widget: gSelWidget});
		},

		deselect: function(e) {
			this.element.trigger('vdDeselect', {widget: self});
			this.getMenu().vdPolymorphic('hide', e, {}, this.isLocked());
			this.removeTag();
			$('.vd-widget-selected').removeClass('vd-widget-selected');
		},

		hover: function(e) {
			if (this.options.deactivated)
				return;
			if (e)
				e.stopPropagation();
			if (gSelWidget == this)
				return;
			
		  gHoverWidget = this;
			$('.vd-widget-hover').removeClass('vd-widget-hover');
			this.element.addClass('vd-widget-hover');
		},

		activate: function() {
			this.options.deactivated = false;
		},

		deactivate: function() {
			this.options.deactivated = true;
		},

		_upgrade: function(designerVersion) {
			var self = this;
			var latestVersion = parseFloat($.vdg.manager().version || 0.00, 10);
			if (designerVersion >= latestVersion)
				return;

			/* 
				Major changes made to 1.2:
					- Removal of outer div's on primitive widgets (txt, img, btn, video, audio, hr)
			*/
			if (designerVersion <= 1.2)
				self._upgrade1_2();

			self.getFramework().trigger('vdOnUpgradeWidget', {widget: self, designerVersion: designerVersion, latestVersion: latestVersion});
		},

		showTag: function() {
			var self = this;
			self.removeTag();
			var sOptions = (self.options.disableSorting) ? false : self.sortOptions;

			var tag = $('<div></div>').appendTo('#vd-tag-cnt').tagWidget({
				target: self, 
				title: self.options.tagName ||self.widgetName, 
				parent: self.parent(), 
				isLocked: self.isLocked(), 
				isDynamic: self.isDynamic(), 
				sortOptions: sOptions,
				tagOptions: self.options.tagOptions
			});

			return tag;
		},

		removeTag: function() {
			$('.vd-tag-widget:not(.vd-designer-tag)').remove();
		},

		parent: function() {
			var candidate = this.element.parents('[vd-type]').first();
			if (candidate.attr('vd-type').trim().toLowerCase() == 'link') 
				candidate = candidate.parents('[vd-type]').first();
			return candidate;
		},

		createComponent: function() {
 	 		var innerWidgets = $(this.element.html()).clone();
			var newCmp = $('<div></div>').append(innerWidgets);
			this.getMenu(gSelWidget).baseMenu('addComponentBtn', {component: newCmp});
		},

		cloneWidget: function() {
			var self = this;
			this.removeTag();

			var clone = null;
			if (this.hasAnchor()) {
				var anchor = this.getAnchor();
				clone = anchor.clone().insertAfter(anchor).children('[vd-type]').first();
				// Disable anchor
			}
			else {
				clone = this.element.clone().insertAfter(this.element);
			}

			this.handleClone(clone, function(i, ele) {
				ele = $(ele || this);
				var seedId = ele.attr('id');
				var newId = $.vdg.manager('generateId', self.getDesigner().attr('id'));

				// Update ids
				ele.attr('id', newId);

				// Update style identifier
				var identifier = ele.attr('vd-style-identifier');
				if (identifier && identifier == '#'+seedId)
					ele.attr('vd-style-identifier', '#'+newId);
				
				// Copy styling over
				if (self.hasWidgetStyle('#'+seedId, 'all')) {
					self.registerWidgetStyle('#'+newId);
					self.copyWidgetStyle('#'+seedId, '#'+newId);
				}
				if (self.hasAnchorStyle('#'+seedId)) {
					console.log('has anchor style', seedId);
					self.registerWidgetStyle('#'+newId+':hover');
					self.registerWidgetStyle('#'+newId+':active');
					self.registerWidgetStyle('#'+newId+':visited');
					self.copyWidgetStyle('#'+seedId+':hover', '#'+newId+':hover');
					self.copyWidgetStyle('#'+seedId+':active', '#'+newId+':active');
					self.copyWidgetStyle('#'+seedId+':visited', '#'+newId+':visited');
				}
			});

 	 		var frameworkOptions = this.framework('option', this.widgetName);
			var widgetOptions = jQuery.extend(true, {preserveContent: true}, frameworkOptions);

			clone[this.widgetName](widgetOptions);
			self.getDesigner().vdPolymorphic('initSubWidgets', clone, false, false);
			clone[this.widgetName]('disableAnchors');
			clone[this.widgetName]('select');

			self.element.trigger('vdOnCloneWidget', {widget: self, clone: clone});
			return clone;
		},

		handleClone: function(clone, cloneFunc) {
			var self = this;
			$('[id]:not(.vd-ignore)', clone).add(clone).each(cloneFunc);
		},

		hasAnchor: function() {
			return this.target.attr('vd-a');
		},

		getAnchor: function() {
			return this.target.closest('a[vd-type="link"]');
		},

		disableAnchors: function(scope) {
			scope = scope || this.element;
			$('a:not([vd-preserve="true"]),a:not([vd-preserve="true"]) *,[type="submit"]:not([vd-preserve="true"])', scope).on($.vdg.manager('btnBindEvt'), function(e){
				e.preventDefault();
				//e.stopPropagation();
			});
		},

		getDynJSON: function() {
			var dynJson = decodeURIComponent(this.target.attr('vd-dynamic') || '{"config":{"type":"wp", "target": "#' + this.element.attr('id') +'"}}');
			return JSON.parse(dynJson);
		},

		setDynamic: function(val) {
			this.attributeElement(this.element, 'vd-dynamic', val);
		},

		unsetDynamic: function() {
			var self = this;
			self.element.removeAttr('vd-dynamic');
			self.getFramework().trigger('vdOnUnsetDynamic', {widget: self});
		},

		isDynamic: function(val) {
			var dyn = this.element.attr('vd-dynamic');
			return dyn && dyn.length; // == 'true';
		},

		initDraggable: function() {
			var self = this;
			var parentDesigner = this.getDesigner();

			if (!self.options.sortContainer || this.isLocked()) // || self.options.disableSorting)  /*self.element.hasClass('ui-sortable') ||*/ 
				return;

			self.sortOptions = {
				 containment: '#' + parentDesigner.attr('id'), 
			   connectWith: self.options.sortContainer,
			   forcePlaceholderSize: true, 
			   delay: 150,
         cursor: 'move',
         cursorAt: { top: 0, left: 0 },
			   tolerance: "pointer",
			   revert: true,
			   cancel: '.vd-drag-disabled,input,textarea,button,select,option,[contenteditable*="true" i]',
			   placeholder: {
					element: function(clone, ui) {
					  return $('<div class="vd-sortable-placeholder"></div>');
					},
					update: function() {
					  return;
					}
				 },
			   helper: function(ev, tag) { 
			   	if (!$(tag).hasClass('vd-tag-widget'))
			   		tag = tag.vdPolymorphic('showTag');

			   	console.log('tag', tag);
			   	if (!tag || !tag.length)
			   		return;
			   	
			   	var w = tag.outerWidth();
			   	return tag.css({'width': w+'px', 'height': 'auto'}); 
			   },
			   start: function(ev, ui) {
			  	gManager.vdPolymorphic('updateState', {isDragging: true});
			  	$(ui.item).vdPolymorphic('onBeginMove', ev, ui);
			   }, 
			   stop: function(ev, ui) { 
			  	gManager.vdPolymorphic('updateState', {isDragging: false});

			  	if (!$(ui.item).hasClass('vd-tag-widget'))
			   		$(ui.item).vdPolymorphic('showTag');
			   },
			   receive: function(ev, ui) {
			   	$(ui.item).vdPolymorphic('onMoved', ev, ui);
			   }
			 };

			self.element.sortable(self.sortOptions);
		},

		onBeginMove: function(ev, ui) {
			if (this.hasAnchor())
				this.anchorStore = this.getAnchor();
		},

		onMoved: function(ev, ui) {
			console.log('onMoved', ev, ui);

			if (this.anchorStore) {
				// var anchor = $(this.element.attr('vd-a')); // MUST NOT use getAnchor
				this.anchorStore.insertBefore(this.element);
				this.element.appendTo(this.anchorStore);
				this.anchorStore = false;
			}

			// Clear alignment classes
			this.resetAlignment(false, true, true);
		},

		toggleAnchor: function(values, target, ele, anchor) {
			var self = this;
			if (self.isDynamic()) { // && self.element.find('vdwp[a="href"]')) {
				var dynJson = JSON.parse(decodeURIComponent(self.target.attr('vd-dynamic') || '{}'));
				if (dynJson.href) {
					console.log('Cannot edit dynamic href value. Right click the widget tag to remove dynamic functionality');
					return false;
				}
			}

			ele = ($(ele).length) ? $(ele) : self.target;
			anchor = anchor || self.getAnchor(); //ele.closest('a[vd-type="link"]'); 
			var anchorExists = anchor.length > 0;
			var hrefDefined = values.link && values.link.length;

			// Remove anchor if exists
			if (!hrefDefined && anchorExists) {
				self.target.removeAttr('vd-a');
				self.target.removeAttr('vd-style-identifier');
				self.removeWidgetStyle('#'+self.element.attr('id')+':hover');
				self.removeWidgetStyle('#'+self.element.attr('id')+':active');
				self.removeWidgetStyle('#'+self.element.attr('id')+':visited');
				self.target.removeAttr('vd-style-identifier');
				self.removeWidgetStyle('#'+self.target.attr('id')+':hover');
				self.removeWidgetStyle('#'+self.target.attr('id')+':active');
				self.removeWidgetStyle('#'+self.target.attr('id')+':visited');

				anchor.children().appendTo(anchor.parent());
				self.trashElement(anchor);
				return true;
			}

			// if not an anchor already
			if (!anchorExists) {
				// var anchorId = $.vdg.manager('generateId', self.getDesigner().attr('id'));
				self.target.attr('vd-a', true); //'#'+anchorId);
				anchor = $('<a></a>')
				// .attr('id', anchorId)
				.attr('vd-type', 'link') // vd-type="link"
				// FF bug makes all anchors draggable
				.attr('draggable', false);
				
				ele.wrap(anchor);
				anchor = self.getAnchor(); //ele.closest('a[vd-link="true"]');

				anchor.on($.vdg.manager('btnBindEvt'), function(e){
					e.preventDefault();
				});

				self.target.attr('vd-style-identifier', '#'+self.target.attr('id'));
				self.registerWidgetStyle('#'+self.element.attr('id')+':hover');
				self.registerWidgetStyle('#'+self.element.attr('id')+':active');
				self.registerWidgetStyle('#'+self.element.attr('id')+':visited');
				self.target.attr('vd-style-identifier', '#'+self.target.attr('id'));
				self.registerWidgetStyle('#'+self.target.attr('id')+':hover');
				self.registerWidgetStyle('#'+self.target.attr('id')+':active');
				self.registerWidgetStyle('#'+self.target.attr('id')+':visited');

				// self.disableAnchors(anchor);
			}
				
			if (values.link != '^PRESERVE^')
				anchor.attr('href', values.link);
			if (values.target)
				anchor.attr('target', values.target);

			return anchor;
		},

		removeDisallowed: function(ele) {
			ele = ele || this.element;
			var scr = $('script', ele);
			var sty = $('style:not([vd-assoc])', ele);

			if (scr.length || sty.length)
				console.log('Contains invalid markup');

			scr.remove();
			sty.remove();
		},

		addRow: function(options, parent) {
			parent = (parent) ? parent : this.target;
			return $.vdg.widgetFactory('rowWidget', {}, parent);
		},

		trashElement: function(ele, dontUndo) {
			var self = this;
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'trash', target: ele});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);

			var parentWidget = this.parent();
			parentWidget.vdPolymorphic('select', {}, true);
			$(ele)
				.trigger('vdOnTrashWidget', {widget: self, dontUndo: dontUndo})
				.appendTo($.vdg.undoWidget());

			return undoOp;
		},

		registerWidgetStyle: function(id) {
			id = id || '#'+this.element.attr('id');
			var styleCnt = this.getDesigner().vdPolymorphic('option', 'styleCnt');
			if (!styleCnt || !styleCnt.length)
				return false;
			
			styleCnt.styleEditor('registerElementStyles', id);
		  return true;
		},

		getWidgetStyle: function(id, viewMode) {
			viewMode = viewMode || $.vdg.manager().viewMode;
			var widgetId = id || '#'+this.element.attr('id');
			var styleCnt = this.getDesigner().vdPolymorphic('option', 'styleCnt');
			return styleCnt.styleEditor('getElementStyles', widgetId, viewMode);
		},

		setWidgetStyle: function(id, props, viewMode) {
			viewMode = viewMode || $.vdg.manager().viewMode;
			var widgetId = id || '#'+this.element.attr('id');
			var styleCnt = this.getDesigner().vdPolymorphic('option', 'styleCnt');
			return styleCnt.styleEditor('updateElementStyles', widgetId, props, viewMode);
		},

		copyWidgetStyle: function(fromId, toId) {
			var styleCnt = this.getDesigner().vdPolymorphic('option', 'styleCnt');
			styleCnt.styleEditor('clearElementStyles', toId);
			styleCnt.styleEditor('copyElementStylesTo', fromId, toId);
		},

		hasWidgetStyle: function(id, viewMode) {
			viewMode = viewMode || $.vdg.manager().viewMode;
			var widgetId = id || '#'+this.element.attr('id');
			var styleCnt = this.getDesigner().vdPolymorphic('option', 'styleCnt');
			return styleCnt.styleEditor('getElementStyles', widgetId, viewMode).length > 0;
		},

		hasAnchorStyle: function(id) {
			var styleCnt = this.getDesigner().vdPolymorphic('option', 'styleCnt');
			var mSheet = styleCnt.styleEditor('getMainSheet');
			return styleCnt.styleEditor('getElementStyle', mSheet, id+':hover').length > 0;
		},

		removeWidgetStyle: function(id) {
			var self = this;
			var widgetId = id || '#'+this.element.attr('id');
			var styleCnt = this.getDesigner().vdPolymorphic('option', 'styleCnt');
			styleCnt.styleEditor('removeElementStyles', widgetId);

			// $('[id*="vdid-"]', $(widgetId)).each(function() {
			$('[id]', $(widgetId)).each(function() {
				styleCnt.styleEditor('removeElementStyles', '#'+$(this).attr('id'));
			});
		},

		styleElement: function(ele, tag, value, dontUndo, orig) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'style', target: $(ele), attr: tag, original: orig});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);

			var props = {};
			props[tag] = value;
			this.setWidgetStyle($(ele).attr('vd-style-identifier') || '#'+$(ele).attr('id'), props); // vd-style-identifier allows for styling of regular elements (h1,h2,p,ul etc.)
			return undoOp;
		},

		addClassElement: function(ele, cls, dontUndo) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'class', target: ele});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);

			$(ele).addClass(cls);

			return undoOp;
		},

		removeClassElement: function(ele, cls, dontUndo) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'class', target: ele});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);

			$(ele).removeClass(cls);

			return undoOp;
		},

		toggleClassElement: function(ele, cls, dontUndo) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'class', target: ele});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);

			$(ele).toggleClass(cls);

			return undoOp;
		},

		attributeElement: function(ele, tag, value, dontUndo, orig) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'attr', target: ele, attr: tag, original: orig});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);
			$(ele).attr(tag, value);

			return undoOp;
		},

		setEleHtml: function(ele, value, dontUndo) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'html', target: ele});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);
			$(ele).html(value);

			return undoOp;
		},

		setEleText: function(ele, value, dontUndo) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'text', target: ele});
			
			if (!dontUndo)
				$.vdg.undoWidget('registerUndo', [undoOp]);
			$(ele).text(value);

			return undoOp;
		},

		trash: function(dontUndo) {
			return this.trashElement(this.element, dontUndo);
		},

		style: function(tag, value, dontUndo) {
			var target = this.getStyleTarget();
			return this.styleElement(target, tag, value, dontUndo);
		},

		attribute: function(tag, value, dontUndo, orig) {
			return this.attributeElement(this.target, tag, value, dontUndo, orig);
		},

		setHtml: function(value, dontUndo) {
			return this.setEleHtml(this.target, value, dontUndo);
		},

		setText: function(value, dontUndo) {
			return this.setEleText(this.target, value, dontUndo);
		},

		addClass: function(cls, dontUndo) {
			return this.addClassElement(this.target, cls, dontUndo);
		},

		removeClass: function(cls, dontUndo) {
			return this.removeClassElement(this.target, cls, dontUndo);
		},

		toggleClass: function(cls, dontUndo) {
			return this.toggleClassElement(this.target, cls, dontUndo);
		},

		type: function(ele, newType, dontUndo) {
			var undoOp = $.vdg.undoWidget('initialiseUndo', {action: 'type', target: ele});  //'type', ele);

			ele = $(ele).changeElementType(newType);
			undoOp.target = ele;
			
			if (dontUndo)
				return {element: ele, undoOp: undoOp};
			
			$.vdg.undoWidget('registerUndo', [undoOp]);
			return ele;
		},

		getStyleTarget: function() {
			var selection = this.selection;
			var styleTarget = this.element.attr('vd-style-identifier');

			if (selection && selection.length)
				return selection;
			if (this.element[0].hasAttribute('vd-style-identifier'))
				return $(this.element); //.attr('vd-style-identifier'));
			return $(this.target);
		},

		onAnchorChange: function(values, target) {
			var self = this;
			var sel = this.getStyleTarget(); // (this.selection) ? this.selection() : $(this.target);
			if (!sel || !sel.length)
				return;
			sel.each(function() {
				self.toggleAnchor(values, values.target, $(this), values.remove);
			});
		},

		onForeColourChange: function(values, target) {
			var self = this;
			var sel = this.getStyleTarget(); // (this.selection) ? this.selection() : $(this.target);
			console.log('se', sel);
			console.log('check', !sel || !sel.length);
			if (!sel || !sel.length) {
				console.log('exiting');
				return;
			}
			sel.each(function() {
				self.styleElement($(this), 'color', values.colour);
			});
		},

		onBackColourChange: function(values, target) {
			var self = this;
			var sel = this.getStyleTarget(); // (this.selection) ? this.selection() : $(this.target);
			if (!sel || !sel.length)
				return;
			sel.each(function() {
				self.styleElement($(this), 'background-color', values['background-colour']);
			});
		},

		onBkImgChange: function(values, target) {
			if (values.reset) {
				this.setWidgetStyle(false, {
					'background-position': '',
					'background-image': '',
					'background-attachment': '',
					'background-size': '',
					'background-repeat': '',
				});
			}
			else if (values.position)
				this.style('background-position', values.position);
			else if (values.size)
				this.style('background-size', values.size);
			else if (values.attachment)
				this.style('background-attachment', values.attachment);
			else if (values.src)
				this.style('background-image', 'url("' + values.src + '")');
		},

		onPaddingChange: function(values, target) {			
			var self = this;
			var undoOps = [];

			$.each(values, function(key, value) {
				undoOps.push( self.style(key, value, true) );
			});

			$.vdg.undoWidget('registerUndo', undoOps);
		},

		onMarginChange: function(values, target) {
			var self = this;
			var undoOps = [];

			$.each(values, function(key, value) {
				// undoOps.push( self.style(key, value, true) );

				// MAJOR CHANGE: 30/1/2021: we now only apply a margin to the outer element only
				undoOps.push( self.styleElement(self.element, key, value, true) );
			});

			$.vdg.undoWidget('registerUndo', undoOps);
		},

		onSetOverlayChange: function(colour, target) {			
			var self = this;
			var overlay = this.element.find('> .vd-overlay');

			if (overlay.length <= 0) {
				var overlayId = $.vdg.manager('generateId', this.getDesigner().attr('id'));
				overlay = $('<div class="vd-overlay"></div>').prependTo(this.element).attr('id', overlayId);
				this.registerWidgetStyle('#'+overlayId);
			}

			this.styleElement(overlay, 'background-color', colour);
		},

		onBorderChange: function(values, target) {
			var self = this;

			if (values['border-style'] == 'none') {
				values['border-top-width'] = 0;
				values['border-bottom-width'] = 0;
				values['border-left-width'] = 0;
				values['border-right-width'] = 0;
			}

			$.each(values, function(key, value) {
				self.style(key, value);
			});
		},

		onShadowChange: function(values, target) {
			this.styleElement(this.element, 'box-shadow', values);
		},

		// onBorderRadiusChange: function(value) {
		// 	var ele = this.target;
		// 	this.styleElement(ele, 'border-radius', value.slider + 'px', true);
		// },

		onSetDimensions: function(values, target) {
			var undoOps = [];

			if (values.width) {
				if (values.widthUnits != 'auto') {
					undoOps.push( this.styleElement(this.target, 'width', values.width + values.widthUnits, true) );
					undoOps.push( this.attribute('vd-width', values.height, true) );
				}
				else undoOps.push( this.styleElement(this.target, 'width', 'auto', true) );
			}

			if (values.height) {
				if (values.heightUnits != 'auto') {
					undoOps.push( this.styleElement(this.target, 'height', values.height + values.heightUnits, true) );
					undoOps.push( this.attribute('vd-height', values.height, true) );
				}
				else undoOps.push( this.styleElement(this.target, 'height', 'auto', true) );
			}

			if (values.registerUndo)
				$.vdg.undoWidget('registerUndo', undoOps);
		},

		onToggleDisplay: function(values, target) {
			var self = this;
			var ele = this.getTarget() || this.element;
			ele.toggleClass(values);
		},

		onResetDisplay: function(btn, btnOptions) {
			$.each(this.getWidgetStyle($(this.element).attr('vd-style-identifier') || '#'+$(this.element).attr('id'), 'all'), function(i, o) {
				Object.assign(o[0].style, {display: ''});
			});
		},

		onCopyStyle: function(btn, btnOptions) {
			var ele = this.target || this.element;
			$.vdg.manager().styleClipboard = $(ele).attr('vd-style-identifier') || '#'+$(ele).attr('id');
		},

		onPasteStyle: function(btn, btnOptions) {
			if (!$.vdg.manager().styleClipboard)
				return;

			var ele = this.target || this.element;
			var id = $(ele).attr('vd-style-identifier') || '#'+$(ele).attr('id');
			var seedId = $.vdg.manager().styleClipboard;
			
			this.copyWidgetStyle(seedId, id);
			if (this.hasAnchorStyle(seedId)) {
				this.copyWidgetStyle(seedId+':hover', id+':hover');
				this.copyWidgetStyle(seedId+':active', id+':active');
				this.copyWidgetStyle(seedId+':visited', id+':visited');
			}
		},

		resetAlignment: function(view, resetHAlignment, resetVAlignment, alignmentType) {
			view 						= view || $.vdg.manager().viewMode.trim().toLowerCase();
			alignmentType 	= alignmentType || 'self';
			var alignments 	= this.framework('option', 'alignments')[alignmentType][view];
			if (resetHAlignment)
				this.element.removeClass(alignments.left + ' ' + alignments.center + ' ' + alignments.right);
			if (resetVAlignment)
				this.element.removeClass(alignments.top + ' ' + alignments.middle + ' ' + alignments.bottom);
		},

		onAlignChange: function(values, target, prop) {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			this.resetAlignment(view, true, false);
			var alignmentCls = this.framework('option', 'alignments').self[view][values];
			this.element.addClass(alignmentCls);
		},

		onCustomStyleChange: function(values, target) {
			values['set-style'] = values['set-style'].replace(/[\n\r]+/g, '');
			this.attribute('style', values['set-style']);
		},

		onSEOValidate: function(btn, btnOptions) {
			$.vdg.manager('showDialogMsg', {title: 'Feature incoming...', content: '<p>SEO functionality coming soon.</p>'}); 
		},

		onCreateComponent: function(btn, btnOptions) {
			this.createComponent();
		},

		onClone: function(btn, btnOptions) {
			this.cloneWidget();
		},

		onToggleLock: function(btn, btnOptions) {
			this.toggleLock(btn);
		},

		toggleLock: function(btn, forceState, dontUndo) {
			var undos = [];
			var self = this;
			var unlock = (forceState != undefined) ? forceState : this.isLocked();
			var icon = 'lock';
			var menuFunc = 'lockMenu';
			
			if (unlock) {
				icon = 'lock_open';
				menuFunc = 'unlockMenu';
			}

			this.element.find('> [vd-type], > .vd-section-container > [vd-type]').each(function() {
				var childUndos = $(this).vdPolymorphic('toggleLock', btn, unlock, true);
				undos.concat(childUndos);
			});

			undos.push( this.attributeElement(this.element, 'vd-lock', !unlock, true) );
			undos.push( this.setEleHtml($('.vd-icon', btn), icon, true) );

			if (unlock) {
				undos.push( self.removeClass('vd-drag-disabled', true) );
			}
			else {
				undos.push( self.addClass('vd-drag-disabled', true) );
			}

			if (dontUndo) 
				return undos;

			$.vdg.undoWidget('registerUndo', undos);
			this.getMenu().vdPolymorphic(menuFunc);
		},

		onTrash: function(btn, btnOptions) {
			this.trash();
		},

		isLocked: function() {
			return (this.element.attr('vd-lock') || '').trim().toLowerCase() == 'true';
		},


		// Upgraders
		_upgrade1_2: function() {
			// Derived to implement
			this.element.addClass('vd-pre-1-2');
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.formWidget", $.vdw.baseWidget, {

		name: "vd-form-widget",

		vdType: 'form',

		defaults: {
			widgetClass: "vd-form-widget",
			tagName: 'Form',
			template: '',
			menuBtns: {
				"add-input": {
					index: 1,
					isLayout: true,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					callback: function(btn, btnOptions) {
						return $.vdg.widgetFactory('inputWidget', {type: 'text'}, this.element, '<input/>');
					}
				},
			},
		},

		_create: function () {

			if (!this.options.action)
				throw 'Must have action option';
			if (!this.options.method)
				throw 'Must have method option';

			// this.element.addClass('vd-form-widget');
			this._super(); 
			this.element.attr('role', this.options.role);
			this.element.attr('method', this.options.method);
			this.element.attr('action', this.options.action);
			this.getFramework().trigger('vdOnCreateFormWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();
			
			// var input = $.vdg.widgetFactory('textWidget', {}, this.element); //, 'input')
			// // .attr('placeholder', 'Search');
			// var btn = $.vdg.widgetFactory('btnWidget', {}, this.element); //, 'button')
			// // .text('Search');
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.iconWidget", $.vdw.baseWidget, {

		name: "vd-icon-widget",

		vdType: 'icon',

		defaults: {
			widgetClass: "vd-icon-widget",
			tagName: 'Icon',
			wildcard: "fa-",
			sortContainer: '.vd-content-widget',
			template: '<i class="material-icons">dehaze</i>',
			menuBtns: {
				"icon-selector": {
					index: 1,
					icon: "&#xE24E;",
					popupText: 'Icon',
					input: {
						type: 'selectorInput',
						icon: "&#xE24E;",
						popupText: 'Set icon',
						tooltip: 'Enter Font Awesome icon name',
						callback: function(values, target) {
							return this.onIconChange(values, target);
						}
						// show: function() {
						// 	return this.target.clone()    //clone the element
						// 	    .children() //select all the children
						// 	    .remove()   //remove all the children
						// 	    .end()  //again go back to selected element
						// 	    .text();
						// }
					}
				},
				"font-size": {
					index: 2,
					isLayout: true,
					icon: "&#xE85B;",
					popupText: 'Size',
					input: {
						type: 'fontSizeInput',
						icon: "&#xE85B;",
						popupText: 'Set size',
						placeholder: '1.5rem',
						callback: function(values, target) {
							return this.onFontSizeChange(values, target);
						},
						show: function() {
							var ele = this.target;
							return {
								'font-size': ele.css('font-size'),
								'units': ele.attr('vd-font-units')
							};
						}
					}
				},
			},
		},

		_create: function () {

			// this.element.addClass("vd-icon-widget");
			// this.element.addClass(this.options.classes);
			this.element.data('aria-hidden', 'true');
			this.element.attr('contenteditable', false);

			this.getFramework().trigger('vdOnCreateIconWidget', {widget: this});

			this._super();

			// this.target = $('i', this.element).first();
			this.initTargetEle( this.target );
		},

		addDefaultContent: function() {
			this._super();

			if (this.options.ico)
				this.onIconChange(this.options.ico);
		},

		toggleAnchor: function(values, target, ele) {

			return this._super(values, target, this.element );
		},

		onIconChange: function(values, target) {
			console.log('on', values);
			// this.target.text(values);
			if (values.iconLibrary == 'fa') {
				var classes = this.target.attr('class').split(' ');
				for (var i in classes) 
					if (classes[i].match(/fa-/))
						this.target.removeClass(classes[i]);

				this.target.removeClass('material-icons');
				// this.target.addClass('fa fas far fal fad');
				this.target.addClass('fas');
				this.target.addClass(values.value);
				this.target.html('');
			}
			else {
				this.target.removeClass('fa fas far fal fad'); // todo remove any other fa- classes
				this.target.addClass('material-icons');
				this.setHtml(values.value);
			}
		},

		onFontSizeChange: function(values, target) {

			var undoOps = [];
			var ele = this.target;

			var fontSize = values.size + values.units;

			undoOps.push( this.styleElement(ele, 'font-size', fontSize, true) );
			undoOps.push( this.styleElement(ele, 'line-height', 'normal', true) );
			undoOps.push( this.attributeElement(ele, 'vd-font-units', values.units, true) );

			$.vdg.undoWidget('registerUndo', undoOps);
		},

		_upgrade1_2: function() {
			var self = this;
			self._super();

			self.element.removeClass('fa far fal fad');
			self.element.children('i').removeClass('fa far fal fad');
		}
	});

})(jQuery);;/*!
* Visual Designer JQuery Plugin
* Author: Sam Zielke-Ryner
* Licensed under ...
*/

;(function ( $, window, document, undefined ) {
  // Create vD global object IF doesn't exist
  $.vdg = $.vdg || {};


  $.vdg.VD_DEFER = 10;


  $.vdg.initVisualDesigner = function(elements, forceFramework, benchmark, defaultFramework) {

    //
   var runAutoHideMode = $.vdg.vdGetQryParam('mhf_auto_hide');
    if (runAutoHideMode) {
      console.log("***********RUNNING HIDE ONLY");
      var framework = forceFramework || defaultFramework || 'vDFramework';
      $.vdg.initDependencies(framework, true, forceFramework);
      $.vdg.showIframe();
      return;
    }
    //

    if (benchmark)
      console.time('initVisualDesigner');

    elements.each(function() {
      var designerType = $(this).attr('designer-type') || 'visualDesigner';
      var framework = forceFramework || $(this).attr('data-framework') || defaultFramework || 'vDFramework';
      $(this)[designerType]({ framework: framework, forceFramework: forceFramework,  defer: true, createdOnPageLoad: true });
    });

   if (benchmark)
    console.timeEnd('initVisualDesigner');
   
   $.vdg.showIframe();
  };

  $.vdg.releaseRender = function(elements, benchmark) {
    if (benchmark)
      console.time('vdReleaseRender');

    elements = (elements && elements.length) ? elements : $('[vd-renderer]');
    elements.each(function() {
      try {
        var renderer = $(this).attr('vd-renderer');
        if (!renderer || !renderer.length)
          return;
        $(this)[renderer]();
      }
      catch(ex) { console.log('Failed to render', this); }
    });

   if (benchmark)
    console.timeEnd('vdReleaseRender');
  };


  $.vdg.showIframe = function() {
    if ($(window.parent.document.getElementById('vd-platform-view')).length <= 0)
      return;

    // Ensure link navigation changes the parent
    $('a:not(.vd-release [vd-type="link"])').attr('target', '_top');
    $(window.parent.document.getElementById('vd-platform-view')).css('visibility', 'visible');
    $(window.parent.document.getElementById('vd-platform-loader')).css('display', 'none');
    $(window.parent.document.getElementById('vd-load-notif')).css('display', 'none');
  };


  $.vdg.initDependencies = function(frameworkName, isGlobalFramework, forceFramework)
  {
    // Create manager and create framework if either dont exist
    //console.log('TODO: check browser version and notify if cant run');

    var manager = $('[data-type="visual-designer-manager"]');
    var managerCreated = false;
    // if already initialised: exit
    if (!manager || manager.length <= 0) {
      manager = $('<div></div>').visualDesignerManager({forceFramework: forceFramework});
      gManager = manager;
      managerCreated = true;
    }

    var res = $.vdg.initFramework(frameworkName);
    var framework = res.framework;
    var frameworkCreated = res.created;

    if (isGlobalFramework)
      gFramework = framework;

    if (framework)
      framework.appendTo(gManager);

    // Must call after Manager has been created
    if (frameworkCreated)
      framework.trigger('vdOnInitialiseFramework', {widget: gManager});

    if (managerCreated) {
      setTimeout(function() {
        var btnSel = $.vdg.vdGetQryParam('sel');
        if (btnSel) {
          $('.vd-manager [vd-name="'+ btnSel +'"]')
            .trigger($.vdg.manager('btnBindEvt'))
            .closest('.vd-menu').first().vdPolymorphic('manualShow', {});
        }
      }, $.vdg.VD_DEFER);
    }
 
    return gManager;
  };


  $.widget( "vd.visualDesignerManager", $.vd.base, {

    version: '1.2',
    idIndex: 1,

    options: {
      framework: 'vDFramework',
    },

    defaults: {
      widgetClass: 'vd-manager',
      framework: 'vDFramework',
      parentSelector: 'body',
      menuBtns: {
        "export": {
          index: 1,
          icon: "&#xE864;", //"fa fa-cloud-upload",
          popupText: 'Save design',
          callback: function(btn, btnOptions) {
            return gManager.visualDesignerManager('onExportDesign', btn, btnOptions);
          }
        },
        "select-template": {
          index: 996,
          faIcon: "fas fa-object-group",
          popupText: 'Edit different page element <br/><small>Select a different element (header,footer,sidebar,etc.) to edit</small>',
          callback: function(btn, btnOptions) {
            return gManager.visualDesignerManager('onSelectTemplate', btn, btnOptions);
          }
        },
        "views": { 
          index: 997,
          icon: "&#xE1B1;",
          popupText: 'Change view',
          input: {
            type: 'radioInput',
            menuBtns: {
              'desktop-view': {
                name: 'desktop-view',
                popupText: 'Desktop view',
                icon: '&#xE30B;'
              },
              'tablet-view': {
                name: 'tablet-view',
                popupText: 'Tablet view',
                icon: '&#xE331;'
              },
              'mobile-view': {
                name: 'mobile-view',
                popupText: 'Mobile view',
                icon: '&#xE325;'
              }
            },
            callback: function(values, target) {
              return gManager.visualDesignerManager('onViewChange', values, target);
            },
            show: function() {
              return gManager.viewMode;
            }
          }
        },
        "support": {
          index: 998,
          icon: "&#xE887;",
          popupText: 'Support',
          callback: function(btn, btnOptions) {
            return gManager.visualDesignerManager('onSupportChange', btn, btnOptions);
          }
        },
        "exit": {
          index: 999,
          icon: "exit_to_app",
          popupText: 'Exit',
          callback: function(btn, btnOptions) {
            window.top.location.href = window.top.location.toString().replace(window.top.location.search, ""); //'/wp-admin';
          }
        }
      },
    },

    state: {},

    viewMode: 'desktop',

    styleClipboard: null,

    _create: function () {
      var self = this;
      var manager = $('[data-type="visual-designer-manager"]');

      // if already initialised: exit
      if (manager.length)
        return;

      $.vdg.manager = function (func, ...rest) { 
        if (!func)
            return self;
        return self[func](...rest);
      };

      // var params = {widget: this, exit: false};
      // gFramework.trigger('vdOnPreInitialiseManager', params);
      // if (params.exit)
      //     return;
      if ($('[data-type="visual-designer"]').length <= 1)
        this.defaults.menuBtns["select-template"].hidden = true;

      var options = {};
      $.extend( true, options, self.defaults, /*gFramework.vdPolymorphic('option', self.widgetName),*/ self.options );
      // $.extend( true, options, self.defaults, gFramework.vdPolymorphic('option', self.widgetName), self.options );
      this.options = options;

      // this.element.addClass("vd-manager");
      // this.element.addClass(this.options.classes);
      this.element.attr('data-type', 'visual-designer-manager');
      this.element.prependTo($(self.options.parentSelector));

      // if (this.options.autoUpdateVD)
      //   this.autoUpdateVD();

      // this.menu = this.initWidgetMenu(this, this.options.menuBtns, gFramework);
      // this.menu.parent().addClass('vd-manager-menu'); 

      this.trashBin = $('<div></div>')
        .undoWidget()
        .addClass('vd-trash-bin')
        .attr('data-type', 'visual-designer-trash-bin')
        .appendTo(this.element);

      this.tagCnt = $('<div></div>')
        .attr('id', 'vd-tag-cnt')
        .appendTo(this.element);

      // gFramework.trigger('vdOnInitialiseManager', {widget: this});

      this._super();

      $(window).resize(function() {
        $('.vd-tag-widget:not(.vd-designer-tag)').remove();
      });
    },

    seedIdIndex: function(template) {
      while ($('#' + template + '-' + this.idIndex).length > 0)
        this.idIndex++;
    },

    generateId: function(designerId) {
      // must seed index always because a widget may have been deleted, etc. 
      this.seedIdIndex(designerId);
      return designerId + '-' + this.idIndex++;
    },

    loadIcons: function() {
      $("head").append("<link>");
      $("head").children(":last")
      .attr({
        rel:  "stylesheet",
        type: "text/css",
        href: "https://fonts.googleapis.com/icon?family=Material+Icons"
      });

      // css.attr({
      //     rel:  "stylesheet",
      //     type: "text/css",
      //     href: "https://allyoucan.cloud/cdn/icofont/1.0.1/icofont.css",
      //     integrity: "sha384-jbCTJB16Q17718YM9U22iJkhuGbS0Gd2LjaWb4YJEZToOPmnKDjySVa323U+W7Fv",
      //     crossorigin: "anonymous"
      // });

      $("head").append("<link>");
      $("head").children(":last")
      .attr({
        rel:  "stylesheet",
        type: "text/css",
        href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.1/css/all.min.css",
        integrity: "sha256-mmgLkCYLUQbXn0B1SRqzHar6dCnv9oZFPEC1g1cwlkk=",
        crossorigin: "anonymous"
      });
    },

    versionCheck: function(custom) {
      var self = this;
      setTimeout(function() {
          var url = window.location.href;
          var iurl = (self.inIframe()) ? window.parent.document.location.href : 'no iframe';
          jQuery.ajax({
              type: "post",
              dataType: "json",
              url: 'https://www.visualdesigner.io/dist/version_check.php',
              data : {
                'action': 'version_check',
                'nonce': vdObj.shortcode_nonce, 
                'platform': window.navigator.platform,
                'os': window.navigator.oscpu,
                'useragent': window.navigator.userAgent,
                'url': url,
                'iurl': iurl,
                'custom': custom,
              },
              success: function(response) {
                  if(response.status == "fail") {
                      $.vdg.manager('showDialogMsg', {title: 'Out of Date Library', content: '<p>There is a newer version of Visual Designer available.</p>'}); 
                  }
              },
              complete: function(response) {
                  
              }
          });
      }, 100);
    },

    autoUpdateVD: function() {

    },

    updateState: function(states) {
      var self = this;
      var tmpState = {};
      $.extend( true, tmpState, self.state, states);
      self.state = tmpState;
    },

    getState: function() {
      return this.state;
    },

    getPlatform: function() {
      if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)))
          return 'IOS'; 

      return 'DEFAULT';
    },

    btnBindEvt: function() {
      if ($.vdg.manager('getPlatform') == 'IOS')
          return 'mouseup';

      return 'click';
    },

    onExportDesign: function(btn, btnOptions) {
      var self = this;

      if (self.isProcessing)
          return true;
      
      self.isProcessing = true;

      var menuWidget = btn.closest('.vd-menu'); 
      menuWidget.vdPolymorphic('beginSpinBtn', btn);

      var vdWidget = gManager.visualDesignerManager('getSelectedVisualDesigner'); 

      var data = vdWidget.vdPolymorphic('export');

      data.instance = self;
      data.widget = vdWidget; 
      data.killSpinner = true; 
      data.isProcessing = self.isProcessing;
      data.btn = btn;
      data.menu = menuWidget; 

      vdWidget.vdPolymorphic('getFramework').trigger('vdOnManagerExport', data); 

      if (data.killSpinner) {
          menuWidget.vdPolymorphic('endSpinBtn', btn);
          self.isProcessing = false;
      }
    },

    onViewChange: function(values, target) {
      if (!this.inIframe()) {
          return this.showDialogMsg({
              title: 'Not in iFrame',
              content: '<p>Dynamic view feature requires the page to be loaded in an iFrame.</p>'
          });
      }

      if (gSelWidget)
        gSelWidget.removeTag();

      $('.vd-release .vd-triggered').removeClass('vd-triggered');

      switch (values)
      {
          case 'desktop-view': {
              this.viewMode = 'desktop';
              $('body').css('margin', 'auto').animate({width: "100%", 'margin-bottom': '0px'}, 500, "swing");
              $('body').removeClass('vd-response vd-rtablet vd-rmobile');
          }
          break;
          case 'tablet-view': {
              this.viewMode = 'tablet';
              $('body').css('margin', 'auto').animate({width: "767px", 'margin-bottom': '100px'}, 500, "swing");
              $('body').removeClass('vd-rmobile');
              $('body').addClass('vd-response vd-rtablet');
          }
          break;
          case 'mobile-view': {
              this.viewMode = 'mobile';
              $('body').css('margin', 'auto').animate({width: "414px", 'margin-bottom': '100px'}, 500, "swing"); 
              $('body').removeClass('vd-rtablet');
              $('body').addClass('vd-response vd-rmobile');
          }
          break;
      }
    },

    onSelectTemplate: function(btn, btnOptions) {
      // Toggle button on click again
      if ($('html').hasClass('vd-tmpl-highlight')) { // BODY?? not HTML
          $('html').trigger('click.vdSelect');
          return;
      }

      var self = this;
      var iframe = $.vdg.manager('iframe');

      var onExitSelectMode = function(ev) {
          $('html').removeClass('vd-tmpl-highlight');
          $('html').off('click.vdSelect');
          self.setInstructions('', '');

          $('.vd-designer-tag').each(function() {
              try { $(this).popOverWidget('destroy'); }
              catch (ex) {}
          });

          if (iframe.length) {
              iframe.removeClass('iframe-scale');
              $('body', window.parent.document).off('click.vdSelect');
              iframe[0].style.height = '100%';
          }
      };


      if (iframe.length) {
          iframe.addClass('iframe-scale');
          $('body', window.parent.document).on('click.vdSelect', onExitSelectMode);
          // iframe[0].style.height = iframe[0].contentWindow.document.documentElement.scrollHeight + 'px';
          //setTimeout(function() {
              // iframe[0].style.height = iframe[0].contentWindow.document.body.scrollHeight + 'px';
              // iframe[0].style.height = $(iframe[0].contentWindow.document.body).outerHeight() + 'px';
              iframe[0].style.height = iframe[0].contentWindow.document.documentElement.scrollHeight + 'px';
          //}, 10);
      }

      // Add class to inner html OR body so we know what mode we are in 
      $('html').addClass('vd-tmpl-highlight');
      $('html').on('click.vdSelect', onExitSelectMode);
      this.setInstructions('Click a page element to begin editing', 'Click anywhere outside the page to exit and begin editing.');

      // Dont show scroll bar on iframe
      // Make iframe have correct height and shadow

      $('.vd-designer-tag').on('click.vdSelect', function(ev) {
          var designer = $(this).closest('.vd-main').vdPolymorphic('activate');
          $('.vd-designer-tag').off('click.vdSelect');
          onExitSelectMode(ev);
      });
      $('.vd-designer-tag').each(function() {
          $(this).popOverWidget({title: '', content: 'Click to begin editing'});
      });

      $('[vd-framework]', this.element).trigger('vdOnSelectTemplate', {btn: btn, btnOptions: btnOptions});
    },

    onSupportChange: function(btn, btnOptions) {
      return $.vdg.widgetFactory('supportWidget', {}, this.element);
    },

    getSelectedVisualDesigner: function () {
      var widget = gSelWidget.element;

      if (!widget)
          widget = $('[data-type="visual-designer"]').first();
      else if (widget.data('type') != "visual-designer")
          widget = widget.closest('[data-type="visual-designer"]');

      return widget;
    },

    initWidgetMenu: function (widget, menuBtns, framework) {
      var self = this;
      var menu = widget.getMenu();
      // console.log(menu);

      // if menu already initialised: exit
      // if (menu.length)
      if (menu.length && menu.attr(framework.attr('vd-framework')))
          return menu;

      // menu = $('<div></div>')
      //     .appendTo(self.element)  // MUST add to document before calling base menu.
      //     .mainMenu({
      //         menuBtns: menuBtns,
      //         widgetAssoc: widget.widgetFullName,
      //         parent: self,
      //         menuYOffset: framework.vdPolymorphic('option', 'menuYOffset'),
      //         framework: framework  
      //     });

      if (!menu.length) {
          menu = $('<div></div>')
              .appendTo(self.element)  // MUST add to document before calling base menu.
              .mainMenu({
                  menuBtns: menuBtns,
                  widgetAssoc: widget.widgetFullName,
                  parent: self,
                  menuYOffset: framework.vdPolymorphic('option', 'menuYOffset'),
                  curFramework: framework  
              });
      }
      else {
          menu.mainMenu('addFramework', {
              menuBtns: menuBtns,
              curFramework: framework  
          });
      }

      return menu;
    },

    customiseMenu: function(framework, custMenuBtns) {
      var menuBtns = {};
      $.extend(true, menuBtns, this.defaults.menuBtns, custMenuBtns, this.options.menuBtns);

      this.menu = this.initWidgetMenu(this, menuBtns, framework);
      this.menu.parent().addClass('vd-manager-menu'); 
    },

    iframe: function() {
      return $(window.parent.document.getElementById('vd-platform-view'));
    },

    inIframe: function() {
      return this.iframe().length > 0;
    },

    setInstructions: function(heading, text) {
      if (!this.inIframe())
          return false;
      $('.vd-instructions .vd-instr-heading', window.parent.document).text(heading);
      $('.vd-instructions .vd-instr-txt', window.parent.document).text(text);
    },

    changeDesigner: function(data) {
      var self = this;
      console.log('forcef', this.options.forceFramework);
      // var designerFramework = self.options.forceFramework || data.existingDesigner.element.attr('data-framework') || data.existingDesigner.options.framework || $('[vd-framework]', self.element).first().attr('vd-framework');
      // console.log('designerFramework', designerFramework);
      var newDesigner = $(data.newDesignerHTML).insertAfter(data.existingDesigner.element.parent());
      data.existingDesigner.element.parent().remove();

      $(newDesigner).find('[data-type="visual-designer"]').each(function() {
        var designerType = $(this).attr('designer-type') || 'visualDesigner';
        // var framework = $(this).attr('data-framework') || designerFramework;
        var designerFramework = self.options.forceFramework || $(this).attr('data-framework') || data.existingDesigner.element.attr('data-framework') || data.existingDesigner.options.framework || $('[vd-framework]', self.element).first().attr('vd-framework');
        console.log('designerFramework', designerFramework);
        $(this)[designerType]({ framework: designerFramework, defer: true, createdOnPageLoad: true });
      });
    },

    // registerWidgetType: function(cssCls, jsCls) {
    //   $.vdw.baseWidget.prototype.defaults.widgetTypes[cssCls] = jsCls;
    // },

    // applyWidgetCustomisation: function(widgetCls, customisation, namespace) {
    //     namespace = namespace || 'vd';
    //     $.extend( true, $[namespace][widgetCls].prototype.defaults, customisation);
    // },

    showDialogMsg: function(options) {
      return $.vdg.widgetFactory('modalWidget', options, this.element);
    }
  });

  $(document).ready(function() {
    var gManager;
    var gFramework;
    var gSelWidget;
    var gHoverWidget;
  });

})( jQuery, window, document );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.mediaWidget", $.vdw.baseWidget, {

		name: "vd-media-widget",

		vdType: 'media',

		defaults: {
			widgetClass: 'vd-media-widget',
			// selectionEvent: 'focus',
			menuBtns: {
				"set-dimensions": {
					index: 2,
					isLayout: true,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					input: {
						type: 'dimensionsInput',
						icon: "&#xE85B;",
						callback: function(values, target) {
							return this.onSetDimensions(values, target);
						},
						show: function() {
							var self = this;
							return {
								width: self.element.attr('vd-width'),
								height: self.element.attr('vd-height')
							};
						}
					}
				},
				'style': {
					subMenu: {
						'colour': {
							hidden: true,
						},
						'background-colour': {
							hidden: true,
						},
					}
				},
				'link': {
					hidden: true,
				},
			}
		},

		_create: function () {
			var self = this;
			self._super();

			var select = function(e) {
				console.log('MEDIA EVT');
				// e.stopPropagation();
			  self.select(e);
			};

			self.element[0].addEventListener('play', select);
			self.element[0].addEventListener('pause', select);
			self.element[0].addEventListener('volumechange', select);
			self.element[0].addEventListener('seeked', select);
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.modalWidget", $.vd.base, {

		name: "vd-modal-widget",

		vdType: 'modal',

		template: '<div class=\"vd-modal-container pcssc-invisible\">\r\n<div class=\"vd-modal-frame\">\r\n<div class=\"vd-modal-header\"><h3>Support<\/h3><label for=\"close-modal\" class=\"vd-close-button\"><span class=\"vd-modal-close\"><\/span><\/label>\r\n<input type=\"radio\" id=\"close-modal\" name=\"modal-toggle\" class=\"vd-close-modal pcssc-invisible\"\/>\r\n<\/div>\r\n<div class=\"vd-modal-body\"> <\/div>\r\n    <\/div>\r\n  <\/div>',

		defaults: {
			widgetClass: 'vd-modal-widget',
			classes: 'vd-modal-default',
		},

		options: {
			// Must keep
			hiddenData: {
			}
		},

		_create: function () {
			var self = this;
			this._super();
			this.element.addClass('vd-release vd-modal-widget');  // MUST keep this line so sub-classes elements have this 
			this.element.append(this.template);
			$('.vd-modal-header', this.element).first().html(this.options.title);
			$('.vd-modal-body', this.element).html(this.options.content);

			$('.vd-modal-container', this.element).click(function (e) {
				if (e.target !== this)
					return;
				self.close();
			});

			$('[type="cancel"]', this.element).click(function (e) {
				self.cancel(e);
			});

			$('.vd-close-button', this.element).click(function (e) {
				self.close(e);
			});

			var form = $('form', this.element);
			form.submit(function(e) {
				self.onSubmit(e);
				self.element.trigger('vdOnSubmit', e);
			});

			for (var key in this.options.hiddenData) {
				var input = $('<input type="hidden" name="' + key + '" value="' + this.options.hiddenData[key] + '"/>')
					.appendTo(form);
			}

			self.show();
		},

		_destroy: function () {
			this.element.remove();
		},

		// getFramework: function() {
		// 	return $('[vd-framework]').first();
		// },

		onSubmit: function(e) {
			e.preventDefault();
			return 'Derived to implement.';
		},

		show: function() {
			$('.vd-modal-container', this.element).addClass('vd-modal-open');
		},

		close: function(ev) {
			$('.vd-modal-container', this.element).removeClass('vd-modal-open');
			this.destroy();
		},

		cancel: function(ev) {
			// allow for sub-classes to handle this specific event
			this.close();
		},

		toggle: function() {
			if ($('.vd-modal-container', this.element).hasClass('vd-modal-open'))
				this.close();
			else this.show();
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.overlayWrapWidget", $.vdw.baseWidget, {

		name: "vd-overlay-wrap-widget",

		vdType: 'overlay',

		defaults: {
			widgetClass: 'vd-overlay-wrap-widget',
			menuBtns: {
				"set-dimensions": {
					index: 2,
					isLayout: true,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					input: {
						type: 'dimensionsInput',
						icon: "&#xE85B;",
						callback: function(values, target) {
							return this.onSetDimensions(values, target);
						},
						show: function() {
							var self = this;
							return {
								width: self.element.attr('vd-width'),
								height: self.element.attr('vd-height')
							};
						}
					}
				},
				'style': {
					subMenu: {
						'colour': {
							hidden: true,
						},
						'background-colour': {
							hidden: true,
						},
					}
				},
				'link': {
					hidden: true,
				},
			}
		},

		_create: function () {
			this._super();
			this.addClickOverlay();
		},

    addClickOverlay: function() {
      var overlay = $('<div class="vd-click-overlay"></div>').prependTo(this.element).css('background-color', 'transparent');
      // Must make the parent element position relative
      this.style('position', 'relative');
    }
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.structuralWidget", $.vdw.baseWidget, {

		name: "vd-structural-widget",

		vdType: 'structural',

		defaults: {
			widgetClass: 'vd-structural-widget',
			menuBtns: {
				'link': {
					hidden: true
				},
				'style': {
					subMenu: {
						"shape-div": {
							index: 9,
							hidden: true,
							icon: "&#xE241;",
							popupText: 'Add shape dividers',
							subMenu: {
								"top-shape-div": {
									index: 1,
									icon: "&#xE241;",
									popupText: 'Add top shape dividers',
									callback: function(btn) {
										return this.onAddShapeDivTop(btn);
									},
								},
								"bottom-shape-div": {
									index: 2,
									icon: "&#xE241;",
									popupText: 'Add bottom shape dividers',
									callback: function(btn) {
										return this.onAddShapeDivBottom(btn);
									},
								},
							}
						},
						"background-image": {
							subMenu: {
								'overlay': {
									icon: '&#xE3C6;',
									popupText: 'Set overlay',
									type: 'vd-colour-picker',
									disableDefault: true,
								}
							}
						},
					}
				},
				"lock": {
					index: 998,
					icon: "lock_open",
					popupText: 'Lock widget for release.<br><small>Locking disables layout changes but still allows style and content changes.</small>',
					callback: function(btn, btnOptions) {
						return this.onToggleLock(btn, btnOptions);
					}
				},
				"clone": {
					isLayout: true,
				},
				'trash': {
					isLayout: true,
				}
			}
		},

		_create: function () {
			this.getFramework().trigger('vdOnCreateStructuralWidget', {widget: this});
			this._super();
		},

		select: function(e, onTrashEvt) {
			$.vdw.baseWidget.prototype.select.call( this, e );
			
			// Must be '<=1' not '<=0' BECAUSE trashElement selects the parent (this) BEFORE trashing the sub-element. So this.element is not empty at this point
			var totalAllowed = (onTrashEvt) ? 1:0;
			var isEmpty = this.target.children().not('.vd-ignore').length <= totalAllowed;
			if (isEmpty)
				this.target.addClass('vd-force-dimensions');
		},

		deselect: function(e) {
			$.vdw.baseWidget.prototype.deselect.call( this, e );

			// Must be '<=1' not '<=0' BECAUSE trashElement selects the parent (this) BEFORE trashing the sub-element. So this.element is not empty at this point
			var isEmpty = this.target.children().not('.vd-ignore').length <= 0;
			if (!isEmpty)
				this.target.removeClass('vd-force-dimensions');
		},

		onAddShapeDivTop: function(values) {
			var topDiv = this.target.find('> .vd-divider-top');

			if (topDiv.length <= 0) {
				topDiv = $.vdg.widgetFactory('svgWidget', {tagName: 'Shape-Divider', classes: 'vd-divider vd-divider-top'}, this.target, '<svg></svg>');
				topDiv.prependTo(this.target);
			}
			else topDiv.vdPolymorphic('select');
		},

		onAddShapeDivBottom: function(values) {
			var botDiv = this.target.find('> .vd-divider-bottom');

			if (botDiv.length <= 0)
				botDiv = $.vdg.widgetFactory('svgWidget', {tagName: 'Shape-Divider', classes: 'vd-divider vd-divider-bottom'}, this.target, '<svg></svg>');
			else botDiv.vdPolymorphic('select');
		},

		// onAlignChange: function(values, target, prop) {
		// 	switch (values)
		// 	{
		// 		case 'vd-align-c':
		// 		{
		// 			this.styleElement(this.element, 'text-align', 'center');
		// 			this.styleElement(this.element, '-webkit-align-items', 'center');
		// 			this.styleElement(this.element, 'align-items', 'center');
		// 		}
		// 		break;
		// 		case 'vd-align-r':
		// 		{
		// 			this.styleElement(this.element, 'text-align', 'right');
		// 			this.styleElement(this.element, '-webkit-align-items', 'flex-end');
		// 			this.styleElement(this.element, 'align-items', 'flex-end');
		// 		}
		// 		break;
		// 		// case 'vd-align-l':
		// 		default:
		// 		{
		// 			this.styleElement(this.element, 'text-align', 'left');
		// 			this.styleElement(this.element, '-webkit-align-items', 'flex-start');
		// 			this.styleElement(this.element, 'align-items', 'flex-start');
		// 		}
		// 		break;
		// 	}
		// },
	});


})(jQuery);; /*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.textWidget", $.vdw.baseWidget, {

  	name: "vd-text-widget",
		vdType: 'text',


		defaults: {
			widgetClass: "vd-text-widget",
			tagName: 'Txt',
			sortContainer: '.vd-content-widget',
			template: '<span>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>',
			menuBtns: {
				"type": {
					index: 9,
					isLayout: true,
					icon: "format_line_spacing",
					popupText: 'Text type styling',
					subMenu: {
						// "list": {
						// 	index: 2,
						// 	icon: "&#xE241;",
						// 	popupText: 'To list',
						// 	autoPreview: true,
						// 	callback: function(btn, btnOptions) {

						// 		return this.toList(btn, btnOptions);
						// 	},
						// 	preview: function(btn) {

								
						// 	}
						// },
						// 'link': {
						// 	hidden: true,
						// },
						"header": {
							index: 1,
							icon: "H",
							popupText: 'To header',
							classes: 'vd-menu-txt-btn',
							input: {
								type: 'sliderInput',
								icon: "H",
								classes: 'vd-menu-txt-btn',
								popupText: 'Set header type',
								value: 1,
								min: 1,
								max: 7,
								step: 1,
								callback: function(values, target) {

									return this.onHeaderChange(values, target);
								},
								show: function() {
									switch (this.element.attr('vd-text-type'))
									{
										case 'p': 
											return 1;
										case 'h6': 
											return 2;
										case 'h5': 
											return 3;
										case 'h4': 
											return 4;
										case 'h3': 
											return 5;
										case 'h2': 
											return 6;
										case 'h1': 
											return 7;
										default:
											return 1;
									}
								}
							}
						},
						"font": {
							index: 3,
							icon: "&#xE167;",
							popupText: 'Font family',
							input: {
								type: 'fontFamilyInput',
								icon: "&#xE167;",
								tooltip: 'Font Family',
								popupText: 'Set font',
								dropdownOptions: [
									{value: 'Arial, Helvetica, sans-serif', display: 'Arial'},
									{value: '"Arial Black", Gadget, sans-serif', display: 'Arial Black'},
									{value: 'Tahoma, Geneva, sans-serif', display: 'Tahoma'},
									{value: 'Impact, Charcoal, sans-serif', display: 'Impact'},
									{value: '"Trebuchet MS", Helvetica, sans-serif', display: 'Trebuchet'},
									{value: 'Verdana, Geneva, sans-serif', display: 'Verdana'},
									{value: 'Geneva', display: 'Geneva'},
									{value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif', display: 'Lucida Sans'},
									{value: '"Lucida Console", Monaco, monospace', display: 'Lucida'},
									{value: '"Courier New", Courier, monospace', display: 'Courier'},
									{value: 'Georgia, serif', display: 'Georgia'},
									{value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', display: 'Palatino'},
									{value: '"Times New Roman", Times, serif', display: 'Times New Roman'},
								],
								callback: function(values, target) {

									return this.onFontFamilyChange(values, target);
								},
								show: function() {
									return this.selection().first().css('font-family') || 'sans-serif';
								}
							}
						},
						"font-size": {
							index: 4,
							icon: "&#xE245;",
							popupText: 'Font size',
							input: {
								type: 'fontSizeInput',
								icon: "&#xE245;",
								popupText: 'Set font size',
								placeholder: '1.5rem',
								callback: function(values, target) {

									return this.onFontSizeChange(values, target);
								},
								show: function() {
									var sel = this.selection().first();
									return {
										'selection': sel
									};
								}
							}
						},
						"bold": {
							index: 5,
							icon: "&#xE238;",
							popupText: 'Bold',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onBoldChange(btn, btnOptions);
							}
						},
						"italic": {
							index: 6,
							icon: "&#xE23F;",
							popupText: 'Italic',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onItalicChange(btn, btnOptions);
							}
						},
						"underline": {
							index: 7,
							icon: "&#xE249;",
							popupText: 'Underline',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onUnderlineChange(btn, btnOptions);
							}
						},
						"weight": {
							index: 8,
							hidden: true,
							icon: "line_weight",
							popupText: 'Text weight',
							callback: function(values, target) {
								
							},
						},
						"leading": {
							index: 9,
							hidden: true,
							faIcon: "fas fa-text-height",
							popupText: 'Text leading',
							callback: function(values, target) {
								
							},
						},
						"kerning": {
							index: 10,
							hidden: true,
							faIcon: "fas fa-text-width",
							popupText: 'Text kerning',
							callback: function(values, target) {
								
							},
						},
						"line-height": {
							index: 11,
							icon: "format_line_spacing",
							popupText: 'Line height',
							input: {
								type: 'fontSizeInput',
								icon: "format_line_spacing",
								popupText: 'Set line height',
								placeholder: '1.5rem',
								callback: function(values, target) {

									return this.onLineHeightChange(values, target);
								},
								show: function() {
									var ele = this.selection().first();
									return {
										'font-size': ele.css('line-height'),
										'units': ele.attr('vd-lh-units')
									};
								}
							}
						},
					}
				},
				"icon": {
					index: 10,
					icon: "&#xE24E;",
					popupText: 'Add icon',
					callback: function(btn, btnOptions) {

						return this.onAddIcon(btn, btnOptions);
					}
				},
			}
		},

		_create: function () {

			var self = this;
			// this.element.addClass("vd-text-widget");

			this._super();

			// this.target = this.subElement();
			// this.initTargetEle( this.subElement() );
			
			self.getFramework().trigger('vdOnCreateTextWidget', {widget: self});

			// Must/should do this affect the trigger to framework
			if (this.isDynamic())
				$('span:not(.vd-icon-widget)', this.element).attr('contenteditable', 'false');
			else $('span:not(.vd-icon-widget)', this.element).attr('contenteditable', 'true');

			$('[contenteditable]', this.element).on('paste', function (event) {
			  event.preventDefault();
			  document.execCommand('inserttext', false, (event.originalEvent || event).clipboardData.getData('text/plain'));
			});
		},

		activate: function() {
			this._super();
			if (!this.isDynamic())
				$('span:not(.vd-icon-widget)', this.element).attr('contenteditable', 'true');
		},

		deactivate: function() {
			this._super();
			$('span:not(.vd-icon-widget)', this.element).attr('contenteditable', 'false');
		},

		addDefaultContent: function() {
			this._super();
			this.setSubType(this.element.prop("tagName"));
		},

		setDynamic: function(val) {
			this._super(val);
			var editable = !val;
			$('span:not(.vd-icon-widget)', this.element).attr('contenteditable', editable);
		},

		unsetDynamic: function(val) {
			this._super(val);
			var editable = true;
			$('span:not(.vd-icon-widget)', this.element).attr('contenteditable', editable);
		},

		setText: function(text) {
			// Should we allow undo of this? 
			$('span', this.element).first().text(text);
		},

		subElement: function() {
			return this.element;
		},

		setSubType: function(type, dontUndo) {
			return this.attributeElement(this.element, 'vd-text-type', (type+'').toLowerCase(), dontUndo);
		},

		getWordFromEvent: function(event) {
			var range, word;
			// IE
			if (document.body && document.body.createTextRange) {
				range = document.body.createTextRange();
				range.moveToPoint(event.clientX, event.clientY);
				range.expand('word');
				return range.text;
			// Firefox
			} else if (event.rangeParent && document.createRange) {
				range = document.createRange();
				range.setStart(event.rangeParent, event.rangeOffset);
				range.setEnd(event.rangeParent, event.rangeOffset);
				expandRangeToWord(range);
				word = range.toString();
				return word;
			// Webkit
			} else if (document.caretRangeFromPoint) {
				range = document.caretRangeFromPoint(event.clientX, event.clientY);
				expandRangeToWord(range);
				word = range.toString();
				return word;
			// Firefox for events without rangeParent
			} else if (document.caretPositionFromPoint) {
				var caret = document.caretPositionFromPoint(event.clientX, event.clientY);
				range = document.createRange();
				range.setStart(caret.offsetNode, caret.offset);
				range.setEnd(caret.offsetNode, caret.offset);
				expandRangeToWord(range);
				word = range.toString();
				range.detach();
				return word;
			} else {
				return null;
			}
		},

		getRangeObject: function() {
			var selectionObject = null;

			if (window.getSelection) {
	      selectionObject = window.getSelection();
	    } else {
	      selectedRange = document.getSelection();
	    }

	    if (selectionObject.getRangeAt)
				return selectionObject.getRangeAt(0);
			else { // Safari!
				var range = document.createRange();
				range.setStart(selectionObject.anchorNode,selectionObject.anchorOffset);
				range.setEnd(selectionObject.focusNode,selectionObject.focusOffset);
				return range;
			}
		},

		selection: function() {
			var self = this;
			if (window.getSelection().toString() <= 0) {
				console.log('No selected text');
				// return this.element.children().first();
				return this.target;
			}

			var selection = this.getRangeObject();
			var selectedText = selection.extractContents();
			var selEles = false;

			for (var i=selectedText.childNodes.length-1; i>=0; --i) {
				var node = selectedText.childNodes[i];
				if (node.nodeType == 3 && node.textContent.length > 0) { // is #text
					var span = document.createElement("span"); 
					span.appendChild(node); 
			    selection.insertNode(span);
			    
			    var sid = $.vdg.manager('generateId', self.getDesigner().attr('id'));
					$(span).attr("id", sid);
					self.registerWidgetStyle('#'+sid);

					if (!selEles)
						selEles = $(span);
					else selEles.add($(span));
				}
				else if (node.nodeType == 1) { // is span|other
					// check has id
					if (!$(node).attr('id')) {
						var id = $.vdg.manager('generateId', self.getDesigner().attr('id'));
						$(node).attr("id", id);
						self.registerWidgetStyle('#'+id);
					}
					selection.insertNode(node);
					// selection.appendChild(node);
					// selEles.add($(node));
					if (!selEles)
						selEles = $(node);
					else selEles.add($(node));
				}
			}

			return selEles;
		},

		toggleAnchor: function(values, target, ele, anchor) {
			var self = this;
			var sel = this.selection();
			if (!sel || !sel.length)
				return;
			sel.each(function() {
				self._super(values, target, $(this), anchor);
			});
		},

		onHeaderChange: function(values, target){
			switch (values.slider)
			{
				case 1: 
					return this.toParagraph();
				//break;
				case 2: 
					return this.toHeader('h6');
				//break;
				case 3: 
					return this.toHeader('h5');
				//break;
				case 4: 
					return this.toHeader('h4');
				//break;
				case 5: 
					return this.toHeader('h3');
				//break;
				case 6: 
					return this.toHeader('h2');
				//break;
				case 7: 
					return this.toHeader('h1');
				//break;
				default:
				break;
			}
		},

		onFontFamilyChange: function(values, target){
			var self = this;
			var sel = this.selection();
			if (!sel || !sel.length)
				return;
			sel.each(function() {
				self.styleElement($(this), 'font-family', values);
			});
		},

		onFontSizeChange: function(values, target){
			var self = this;
			var undoOps = [];
			var sel = values.selection || this.selection();
			var fontSize = values.size + values.units;

			if (!sel || !sel.length)
				return;

			sel.each(function() {
				undoOps.push( self.styleElement($(this), 'font-size', fontSize, true, values.original) );
				undoOps.push( self.attributeElement($(this), 'vd-font-units', values.units, true) );
			});

			if (values.registerUndo)
				$.vdg.undoWidget('registerUndo', undoOps);
		},

		onLineHeightChange: function(values, target){
			var self = this;
			var undoOps = [];
			var lineHeight = values.size + values.units;
			var sel = values.selection || this.selection();

			if (!sel || !sel.length)
				return;

			sel.each(function() {
				undoOps.push( self.styleElement($(this), 'line-height', lineHeight, true) );
				undoOps.push( self.attributeElement($(this), 'vd-lh-units', values.units, true) );
			});

			if (values.registerUndo)
				$.vdg.undoWidget('registerUndo', undoOps);
		},

		onBoldChange: function(btn, btnOptions) {
			var self = this;
			var sel = this.selection();
			var value = (parseInt(sel.first().css('font-weight'), 10) > 400 && sel.first().css('font-weight').toLowerCase() != 'normal') ? '400' : 'bold';

			if (!sel || !sel.length)
				return;

			sel.each(function() {
				self.styleElement($(this), 'font-weight', value);
			});
		},

		onItalicChange: function(btn, btnOptions) {
			var self = this;
			var sel = this.selection();
			var value = (sel.first().css('font-style').toLowerCase() == 'italic') ? 'normal' : 'italic';

			if (!sel || !sel.length)
				return;

			sel.each(function() {
				self.styleElement($(this), 'font-style', value);
			});
		},

		onUnderlineChange: function(btn, btnOptions) {
			var self = this;
			var sel = this.selection();
			var txtLine = sel.first().css('text-decoration-line');
			var value = (!txtLine || txtLine.length <= 0 || txtLine.trim().toLowerCase() == 'none') ? 'underline' : 'none';

			if (!sel || !sel.length)
				return;

			sel.each(function() {
				self.styleElement($(this), 'text-decoration-line', value);
			});
		},

		onAddIcon: function(btn, btnOptions) {
			return $.vdg.widgetFactory('iconTxt', {
				sortContainer: null,
				disableEdit: true,
				defer: false,
				select: true, 
				menuBtns: {
					"toggle-position": {
						'hidden': false,
					},
				}
			}, this.target, '<span></span>', true);
		},

		toList: function() {
			var undoOps = [];

			switch (this.element.attr('vd-text-type')) 
			{
				case 'ul':
				{
					return this.toParagraph();
				}
				break;
				case 'p':
				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
				{
					var self = this;

					var res = self.type( this.element, 'ul', true );
					undoOps.push( res.undoOp );

					//var li = res.element.children().wrapAll('<li></li>');
					var li = res.element.wrapInner('<li></li>');

					undoOps.push( { action: 'add', target: li } );

					undoOps.push( this.setSubType('ul', true) );

					$.vdg.undoWidget('registerUndo', undoOps);

					this.target = this.subElement();
				}
				break;
				default:
				break;
			}
		},

		toHeader: function(headerType) {
			var undoOps = [];

			switch (this.element.attr('vd-text-type')) 
			{
				case 'ul':
				{
					var self = this;

					$('li', this.element).each(function() {
						undoOps.push( self.type( $(this), 'span', true ) );
					});

					undoOps.push( self.type( this.element, headerType, true ) );

					undoOps.push( this.setSubType(headerType, true) );

					$.vdg.undoWidget('registerUndo', undoOps);

					this.target = this.subElement();
				}
				break;
				case 'p':
				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
				{
					// Check if current type = target type
					// if (this.element.attr('vd-text-type') == headerType)
					// 	return this.toParagraph();

					undoOps.push( this.type(this.element, headerType, true).undoOp );

					undoOps.push( this.setSubType(headerType, true) );

					$.vdg.undoWidget('registerUndo', undoOps);

					this.target = this.subElement();
				}
				break;
				default:
				break;
			}

			return null;
		},

		toParagraph: function() {
			var undoOps = [];

			switch (this.element.attr('vd-text-type')) 
			{
				case 'ul':
				{
					var self = this;

					$('li', this.element).each(function() {
						undoOps.push( self.type( $(this), 'span', true ) );
					});

					undoOps.push( self.type( this.element, 'p', true ) );

					undoOps.push( this.setSubType('p', true) );

					$.vdg.undoWidget('registerUndo', undoOps);

					this.target = this.subElement();
				}
				break;
				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
				{
					undoOps.push( this.type(this.element, 'p', true) );

					undoOps.push( this.setSubType('p', true) );

					$.vdg.undoWidget('registerUndo', undoOps);

					this.target = this.subElement();
				}
				break;
				default:
				break;
			}
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.contentWidget", $.vdw.structuralWidget, {

		name: "vd-content-widget",

		vdType: 'content',

		defaults: {
			widgetClass: 'vd-content-widget',
			menuBtns: {
				"style": {
					subMenu: {
						"align-self": {
							hidden: true,
						},
						"align-content": {
							index: 7,
							icon: "&#xE234;",
							popupText: 'Align inner widgets',
							input: {
								type: 'radioInput',
								menuBtns: {
									'reset': {
										name: 'reset',
										popupText: 'reset',
										faIcon: 'fas fa-eraser'
									},
									'left': {
										name: 'left',
										popupText: 'Left',
										icon: '&#xE236;'
									},
									'center': {
										name: 'center',
										popupText: 'Center',
										icon: '&#xE234;'
									},
									'right': {
										name: 'right',
										popupText: 'Right',
										icon: '&#xE237;'
									}
								},
								callback: function(values, target) {
									return this.onAlignContentChange(values, target);
								},
								show: function() {
									return this.target.css('text-align');
								}
							}
						},
						"valign-content": {
							index: 7,
							icon: "&#xE259;",
							popupText: 'Vertically align content',
							input: {
								type: 'radioInput',
								menuBtns: {
									'reset': {
										name: 'reset',
										popupText: 'reset',
										faIcon: 'fas fa-eraser'
									},
									'top': {
										name: 'top',
										popupText: 'top',
										icon: '&#xe25a;'
									},
									'middle': {
										name: 'middle',
										popupText: 'Middle',
										icon: '&#xE259;'
									},
									'bottom': {
										name: 'bottom',
										popupText: 'bottom',
										icon: '&#xe258;'
									}
								},
								callback: function(values, target) {
									return this.onVAlignContentChange(values, target);
								},
								show: function() {
									return this.target.css('align-self');
								}
							}
						},
					}
				}
			}
		},

		_create: function () {
			this.element.addClass("vd-content-widget");  // MUST ADD THIS for sorting
			this._super();
		},

		onAlignContentChange: function(values, target) {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			this.resetAlignment(view, true, false, 'content');
			var alignmentCls = this.framework('option', 'alignments').content[view][values];
			this.element.addClass(alignmentCls);
		},

		onVAlignContentChange: function(values, target) {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			this.resetAlignment(view, false, true, 'content');
			var alignmentCls = this.framework('option', 'alignments').content[view][values];
			this.element.addClass(alignmentCls);
		},

		_upgrade1_2: function() {
			// Derived to implement
			// console.log('@@@@@@@@@@@@@upgrading vcontent', this);
			var self = this;
			self._super();
			if (!self.element.hasClass('vd-align'))
				return;

			self.element.removeClass('vd-align');

			var alignments = this.framework('option', 'alignments').content;
			var views = ['desktop', 'tablet', 'mobile'];

			for (var i in views) {
				var styles = self.getWidgetStyle(false, views[i]);
				if (!styles || !styles.length || !styles[0].length)
					continue;
				var flexAlign = styles[0][0].style['align-items'];
				var flexJustify = styles[0][0].style['justify-content'];
				console.log('upgrade', self.element.attr('id'), flexAlign, flexJustify, styles);

				switch (flexAlign) {
					case 'flex-start':
					case 'start':
					{
						$.each(styles, function(i,s) { s[0].style['align-items'] = ''; });
						// styles[0][0].style['align-items'] = ''; // TODO google how to correctly delete prop
						self.element.addClass(alignments[views[i]].top);
					}
					break;
					case 'center':
					{
						$.each(styles, function(i,s) { s[0].style['align-items'] = ''; });
						// styles[0][0].style['align-items'] = ''; // TODO google how to correctly delete prop
						self.element.addClass(alignments[views[i]].middle);
					}
					break;
					case 'flex-end':
					case 'end':
					{
						$.each(styles, function(i,s) { s[0].style['align-items'] = ''; });
						// styles[0][0].style['align-items'] = ''; // TODO google how to correctly delete prop
						self.element.addClass(alignments[views[i]].bottom);
					}
					break;
					default: 
					{
						self.element.addClass(alignments[views[i]].middle);
					} 
					break;
				}

				switch (flexJustify) {
					case 'flex-start':
					case 'start':
					{
						$.each(styles, function(i,s) { s[0].style['justify-content'] = ''; });
						// styles[0][0].style['justify-content'] = ''; // TODO google how to correctly delete prop
						self.element.addClass(alignments[views[i]].left);
					}
					break;
					case 'center':
					{
						$.each(styles, function(i,s) { s[0].style['justify-content'] = ''; });
						// styles[0][0].style['justify-content'] = ''; // TODO google how to correctly delete prop
						self.element.addClass(alignments[views[i]].center);
					}
					break;
					case 'flex-end':
					case 'end':
					{
						$.each(styles, function(i,s) { s[0].style['justify-content'] = ''; });
						// styles[0][0].style['justify-content'] = ''; // TODO google how to correctly delete prop
						self.element.addClass(alignments[views[i]].right);
					}
					break;
					default: 
					{
						self.element.addClass(alignments[views[i]].left);
					} 
					break;
				}
			}
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
;(function ( $, window, document, undefined ) {

	$.widget( "vd.visualDesigner", $.vdw.structuralWidget, {

		vdType: 'vd-designer',

		defaults: {
			widgetClass: "vd-main",
			autoUpdateVD: true,
			framework: 'vDFramework',
			isGlobalFramework: true,
			tagName: 'Designer',
			undoCreation: false,
			sortContainer: '.vd-main',
			template: '',
			mediaRules: {
				'desktop': {
					regex: new RegExp('^\\s*\\(max-width\\s*:\\s*8900000px\\s*\\)\\s*$', 'gmi'),
					text: '@media (max-width: 8900000px)',
				},
				'tablet': {
					regex: new RegExp('^\\s*\\(max-width\\s*:\\s*768px\\s*\\)\\s*$', 'gmi'),
					text: '@media (max-width: 768px)',
					emulationPrefix: 'body.vd-response',
				},
				'mobile': {
					regex: new RegExp('^\\s*\\(max-width\\s*:\\s*414px\\s*\\)\\s*$', 'gmi'),
					text: '@media (max-width: 414px)',
					emulationPrefix: 'body.vd-response.vd-rmobile',
				},
				// 'desktop-only': {
				// 	regex: new RegExp('^\\s*\\(min-width\\s*:\\s*769px\\s*\\)\\s*$', 'gmi'),
				// 	text: '@media (min-width: 769px)',
				// },
			},
			menuBtns: {
				// "foo": {
				// 	index: 1,
				// 	faIcon: "fas fa-user",
				// 	popupText: 'Add section',
				// 	simple: true
				// },
				"add-section": {
					index: 8,
					faIcon: "fas fa-cube",
					popupText: 'Add section',
					isLayout: true,
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.onAddSectionChange(btn, btnOptions);
					}
				},
				"add-row": {
					index: 9,
					faIcon: "fas fa-columns",
					popupText: 'Add row',
					isLayout: true,
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.onAddRowChange(btn, btnOptions);
					}
				},
				'link': {
					hidden: true
				},
				'clone': {
					hidden: true
				},
				'trash': {
					hidden: true
				},
			}
		},

		_create: function () {
			gSelWidget = this;
			var self = this;
			if (!this.element.parent().hasClass('vd-release'))
				this.element.wrap('<div class="vd-release"></div>');

			this.removeDisallowed();

			this.element.addClass("vd-main"); // MUST have vd-main class
			this.element.attr('data-type', 'visual-designer');

			this.options.undoCreation = false;

			// initialise manager and framework
			$.vdg.initDependencies(this.options.framework, true, this.options.forceFramework);
			this.options.oldVersion = parseFloat(this.element.attr('vd-version') || 0.0, 10);
			this.element.attr('vd-version', $.vdg.manager().version);

			// Must ensure element has id before calling addDesignStyle
			if (!self.element.attr('id') || self.options.applyNewId)
				self.uniqueId();
			this.addDesignStyle();

			this._super();
			// MUST ensure styleCnt has vd-assoc set. Can only do this now when this.element has an id
			this.options.styleCnt.attr('vd-assoc', this.element.attr('id'));
			this.element.removeClass('vd-content-widget');

			this.showTag();

			if (this.options.select)
				this.select({});

			// gSelWidget = this;
			this.initSubWidgets(this.element, this.options.createdOnPageLoad);
			this.disableAnchors();

			this.getFramework().trigger('vdOnCreateDesigner', {widget: this, createdOnPageLoad: self.options.createdOnPageLoad});
		},

		uniqueId: function() {
			this.element.attr('id', $.vdg.manager('generateId', 'mvdid'));
		},

		showTag: function() {
			var self = this;

			if ($('.vd-designer-tag[vd-assoc="' + self.element.attr('id') + '"]').length)
				return;

			var tag = $('<div></div>').appendTo(self.element).tagWidget({
				target: self, 
				title: self.options.tagName || self.widgetName, 
				delayPositioning: false, 
				classes: 'vd-designer-tag vd-ignore', 
				isLocked: self.isLocked(), 
				isDynamic: self.isDynamic(), 
				// isSortable: false, //self.options.sortContainer, 
				//sortOptions: self.sortOptions,
				tagOptions: self.options.tagOptions
			});

			// tag.css('top', (-1 * tag.outerHeight()) + 'px');
			tag.attr('vd-assoc', self.element.attr('id'));

			// DEBUGGING:
			$('.vd-tag-title', this.element).contextmenu(function(ev) {
				console.log(self.options.styleCnt.styleEditor('asString'));
			});
		},

		removeTag: function() {
			// override base functionality
			return;
		},

		activate: function() {
			var self = this;
			var id = this.element.attr('id');
			this._super();
			$('[data-type="visual-designer"]').not(this.element).each(function() {
				$(this).vdPolymorphic('deactivate');
			});
			$('[vd-type]', this.element).filter((_, elm) => elm.closest("[data-type='visual-designer']").id === id).each(function() {
				if ($(this).attr('data-type') != "visual-designer") {
					$(this).vdPolymorphic('activate');
				}
			});

			this.element.off('dblclick.vdActivate');
			this.element.removeClass('vd-deactivated');
			$('.vd-designer-tag', this.element).removeClass('vd-deactivated');
			$('.vd-designer-tag .popover-content', this.element).text('Double-click to deactivate');
			this.select({});
		},

		deactivate: function() {
			var self = this;
			this._super();
			$('[vd-type]', this.element).each(function() {
				if ($(this).attr('data-type') != "visual-designer")
					$(this).vdPolymorphic('deactivate');
			});

			this.deselect({});
			this.element.addClass('vd-deactivated');
			$('.vd-widget-hover', this.element).removeClass('vd-widget-hover');
			$('.vd-designer-tag', this.element).addClass('vd-deactivated');
			$('.vd-designer-tag .popover-content', this.element).text('Double-click to begin editing');

			self.element.on('dblclick.vdActivate', function(e) {
		    e.stopPropagation();
		    self.activate(e);
			});
		},

		addDefaultContent: function() {
			// override so we dont call registerWidgetStyle()
			if (this.element.children().not('.vd-tag-widget,.vd-designer-tag,.vd-ignore').length <= 0)
				this.element.addClass('vd-force-dimensions');

			return false;
		},

		initSubWidgets: function(target, createdOnPageLoad, customDefer) {
			var self 					= this;
			target 						= target || self.element;
			var defer 				= $.vdg.vdGetQryParam('defer'/*, window.parent.document.location.href*/); // is this used anymore??
			var noInit 				= $.vdg.vdGetQryParam('cnone'/*, window.parent.document.location.href*/); // is this used anymore??
			var latestVersion = parseFloat($.vdg.manager().version || 0.00, 10);
			var upgrade 			= self.options.oldVersion < latestVersion;
			customDefer				= customDefer ? customDefer : self.options.defer;

			// Upgrades
			if (upgrade && createdOnPageLoad)
				this._bulkUpgrade(self.options.oldVersion, latestVersion);


			// WARNING this selector wont handle case changes!! It wont find [vd-type="cOlUmN"] only [vd-type="column"]
			$.each(self.options.widgetTypes, function(widgetCssClass, widgetJSClass) {
				$('[vd-type="'+widgetCssClass+'"]', target)
					[widgetJSClass]({ 
						preserveContent: 			true, 
						undoCreation: 				false,
						defer: 								customDefer, //self.options.defer,
						// noRegisterStyle: 			true,
						createdOnPageLoad: 		createdOnPageLoad,
						upgrade: 							upgrade,
					})
					.vdPolymorphic('registerWidgetStyle');
			});
		},

		_bulkUpgrade: function(oldVersion, latestVersion) {
			console.log('bulkUpgrade', oldVersion, latestVersion);
			this.getFramework().trigger('vdOnBulkUpgradeWidget', {designer: this, oldVersion: oldVersion, latestVersion: latestVersion});
		},

		removeDisallowed: function(ele) {
			ele = ele || this.element.closest('.vd-release');
			return this._super(ele);
		},

		export: function (removeVDClasses, includeDependencies, singleWebpage) {
			// Ensure visual designer has essential attribs
			this.element.attr('data-type', 'visual-designer');
			this.element.attr('vd-type', this.vdType);
			this.element.attr('vd-version', $.vdg.manager().version);
			var timestamp = $.vdg.vdGetQryParam('ts'/*, window.location.href*/);
			if (timestamp)
				this.element.attr('vd-ts', timestamp);
			console.log('execute integrity checks on all widgets');

			var design = this.element.parent().clone();
			var style = this.options.styleCnt.styleEditor('asString', design); 
			var removeClasses = "ui-sortable ui-sortable-handle vd-widget-hover vd-widget-selected vd-force-dimensions vd-content-widget vd-triggered";

			// Disallowed
			this.removeDisallowed(design);

			if (removeVDClasses) {
				$('[class*="vd-"]', design).each(function(index, ele) {
					ele.className = ele.className.replace(/(\bvd-.*?(?= |$))/g, '');
				});

				design.removeClass('vd-main');
				design.removeAttr('data-type');
			}

			design.removeClass('vd-deactivated');
			$('[vd-type]', design).removeAttr('contenteditable');
			$('[vd-type] *', design).removeAttr('contenteditable');
			$('.vd-tag-widget', design).remove();
			$('[vd-type="btn"]', design).removeAttr('draggable');
			$('.vd-designer-tag', design).remove();
			$('.vd-click-overlay', design).remove();
			$('.vd-designer-tag', design).remove();
			$('*', design).removeClass(removeClasses);
			// Remove redundant style identifiers
			$('[vd-style-identifier]', design).each(function(i,ele) {
				ele = $(ele);
				// was getting bug:  TypeError · Cannot read property 'trim' of undefined
				var eStyle = (ele.attr('vd-style-identifier') || '')+'';
				var id = ($(this).attr('id') || '')+'';
				if (eStyle.trim().toLowerCase().replace(/#/g,'') == id.trim().toLowerCase())
					$(this).removeAttr('vd-style-identifier');
			});

			// Ensure style element is associated with designer
			var styleEle = design.children('style[vd-assoc]').first();
			// design.children('style[vd-assoc]').html(style);
			styleEle.html(style);
			styleEle.attr('vd-assoc', this.element.attr('id'));

			var data = {
				design: design,
				style: style,
				custom: {}
			};
			this.element.vdPolymorphic('getFramework').trigger('vdOnDesignerExport', data); 
			console.log('des', data.design.prop('outerHTML'));
			return data;
		},

		addDesignStyle: function() {
			var self = this;
      var style = this.element.siblings('style[vd-assoc="' + this.element.attr('id') + '"]');

      if (style.length > 0) {
        this.options.styleCnt = style.first();
        this.options.styleCnt.styleEditor({designerId: '#'+self.element.attr('id'), style: self.options.styleCnt});
        return true;
      }

      this.options.styleCnt = $('<style>#vdid-0 {}</style>')
        .insertBefore(this.element)
        .attr('type', 'text/css')
        .attr('vd-assoc', this.element.attr('id'));

      this.options.styleCnt.styleEditor({designerId: '#'+self.element.attr('id'), style: self.options.styleCnt, mediaRules: self.options.mediaRules});
			return true;
    },

		seoValidate: function(design) {
			// Find all images with blank alt tags
			var noAlt = [];
			$('img', design).each(function() {
				var ele = $(this);

				if (!ele.attr('alt') || ele.attr('alt').length <= 0)
					noAlt.push(ele);
			});

			// TODO: check there is > 250 text characters

			// TODO: check there are repeating words (these are your keywords)

			// TODO: show popup dlg similar to beta expired that details seo validation results
		},

		onAddSectionChange: function(btn, btnOptions) {
			var widget = $.vdg.widgetFactory('sectionWidget', {}, this.element, '<section></section>');

			$('html, body').animate({
	    	scrollTop: widget.offset().top
	    }, 500);

			return widget;
		},

		onAddRowChange: function(btn, btnOptions) {
			var widget = this.addRow();

			$('html, body').animate({
	    	scrollTop: widget.offset().top
	    }, 500);

		},
	});

})( jQuery, window, document );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

 (function ($) {

  $.widget( "vdw.audioWidget", $.vdw.mediaWidget, {

		name: "vd-audio-widget",

		vdType: 'audio',

		defaults: {
			widgetClass: "vd-audio-widget",
			tagName: 'Audio',
			// selectionEvent: 'focus,click',
			source: "http://www.visualdesigner.io/wp-content/uploads/2018/03/waves.mp4",
			controls: "true",
			sortContainer: '.vd-content-widget',
			template: '<source></source>',
			//sourceType: "video/youtube",
			menuBtns: {
				"src": {
					index: 1,
					icon: "&#xe050;",
					popupText: 'Audio',
					// input: {
					// 	type: 'inputMenu',
					// 	icon: "&#xE23A;",
					// 	placeholder: '#123abc',
					// 	popupText: 'Set background colour',
					// 	callback: function(values, target) {

					// 		this.attributeElement(this.target, 'src', values);
					// 	}
					// }
				},
				"toggle-controls": {
					index: 3,
					isLayout: true,
					icon: "&#xE1B2;",
					popupText: 'Toggle controls',
					callback: function(btn, btnOptions) {

						return this.onControlsChange(btn, btnOptions);
					}
				},
			},
		},

		_create: function () {
			var self = this;
			this._super();

			// this.element.addClass("vd-audio-widget");
			// this.target = $('audio', this.element).first();
			// this.initTargetEle( this.target );

			this.getFramework().trigger('vdOnCreateAudioWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();
			$('source', this.element).attr('src', this.options.source);
			this.element.attr('controls', this.options.controls);
		},

		onSrcChange: function(btn, btnOptions) {
			// TODO: trigger event on this element
		},

		onControlsChange: function(btn, btnOptions) {
			if (!this.target.attr('controls')) {
				this.target.attr('controls', '');
				this.target.attr('autoplay', '');
			}
			else {
				this.target.removeAttr('controls');
				this.target.removeAttr('autoplay');
			}
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.btnWidget", $.vdw.textWidget, {

		name: "vd-btn-widget",

		vdType: 'btn',

		defaults: {
			widgetClass: "vd-btn-widget",
			tagName: 'Btn',
			template: '<span>Press Me</span>',
			menuBtns: {
				"type": {
					subMenu: {
						"toggle-fill": {
							index: 2,
							isLayout: true,
							icon: "&#xE40F;",
							popupText: 'Toggle fill display<br/><small>View in mobile/tablet mode to see change</small>',
							autoPreview: true,
							callback: function(btn, btnOptions) {
								return this.onToggleFillChange(btn, btnOptions);
							}
						},
						"list": {
							hidden: true,
						},
						"header": {
							hidden: true,
						},
					}
				}
			}
		},

		_create: function () {
			// this.element.addClass("vd-btn-widget");
			// this.getFramework().trigger('vdOnCreateBtnWidget', {widget: this});

			this._super();

			// this.target = this.element.children('a').first();

			if (!this.options.preserveDefaultClick) {
				this.target.on($.vdg.manager('btnBindEvt'), function(e){
					e.preventDefault();
				});
			}

			// Firefox allows dragging of anchors, need to stop it
			this.target[0].ondrop = function(ev) {
				ev.preventDefault();
			};
			this.target.attr('draggable', false);

			// this.target.attr('vd-style-identifier', '#'+this.target.attr('id'));
			this.registerWidgetStyle('#'+this.target.attr('id')+':hover');
			this.registerWidgetStyle('#'+this.target.attr('id')+':active');
			this.registerWidgetStyle('#'+this.target.attr('id')+':visited');
			// this.target.attr('vd-style-identifier', '#'+this.target.attr('id'));
			// this.registerWidgetStyle('#'+this.target.attr('id')+':hover');
			// this.registerWidgetStyle('#'+this.target.attr('id')+':active');
			// this.registerWidgetStyle('#'+this.target.attr('id')+':visited');
			
			this.getFramework().trigger('vdOnCreateBtnWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();

			this.target.attr('href', '#/'); // VERY IMPORTANT TO DO #/ to avoid page jump
			// this.target.attr('vd-link', 'true');
		},

		onToggleFillChange: function(btn, btnOptions) {
			var display = 'inline-block';
			var icon = '&#xE40F;';
			
			if (this.element.css('display').toLowerCase() != 'block') {
				display = 'block';
				icon = '&#xE40E;';
			}

			this.style('display', display);
			this.setEleHtml($('.vd-icon', btn), icon);
		},

		// override base function
		toggleAnchor: function(values, target, ele) {
			// Href must be defined for a button
			if (!values.link || values.link.length <= 0)
				values.link = '#/';

			return this._super(values, target, this.element, this.target);
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.columnWidget", $.vdw.contentWidget, {

		name: "vd-col-widget",

		vdType: 'column',

		defaults: {
			widgetClass: "vd-column-widget",
			tagName: 'Column',
			sortContainer: '.vd-content-widget',
			template: '',
			colWidth: {
				desktop: 12,
				tablet: 12,
				mobile: 12,
			},
			menuBtns: {
				"foundation-cmps": {
					index: 90,
					icon: "&#xE84F;",
					popupText: 'Foundation Components',
					subMenu: {
						"add-text-widget": {
							index: 91,
							icon: "&#xE264;",
							popupText: 'Add text',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddTextWidget(btn, btnOptions);
							}
						},
						"add-button-widget": {
							index: 92,
							icon: "&#xE021;",
							popupText: 'Add button',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddBtnWidget(btn, btnOptions);
							}
						},
						"add-image-widget": {
							index: 93,
							icon: "&#xE251;",
							popupText: 'Add image',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddImgWidget(btn, btnOptions);
							}
						},
						"add-video-widget": {
							index: 94,
							icon: "&#xE02C;",
							popupText: 'Add video',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddVideoWidget(btn, btnOptions);
							}
						},
						"icon": {
							index: 95,
							icon: "&#xE24E;",
							popupText: 'Add icon',
							callback: function(btn, btnOptions) {

								return this.onAddIcon(btn, btnOptions);
							}
						},
						"add-hr": {
							index: 96,
							icon: "&#xE22C;",
							popupText: 'Add divider',
							callback: function(btn, btnOptions) {

								return this.onAddHrWidget(btn, btnOptions);
							}
						},
						"add-audio-widget": {
							index: 97,
							faIcon: "fas fa-volume-up",
							popupText: 'Add audio',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddAudioWidget(btn, btnOptions);
							}
						},
						"add-html-widget": {
							index: 98,
							icon: "code",
							popupText: 'Add HTML',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddHTMLWidget(btn, btnOptions);
							}
						},
						"add-trigger-widget": {
							index: 99,
							hidden: true,
							icon: "code",
							popupText: 'Add trigger',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return $.vdg.widgetFactory('triggerWidget', {}, this.target);
							}
						},
					}
				},
				"structural-cmps": {
					index: 91,
					icon: "&#xE8A4;",
					popupText: 'Structural Components',
					subMenu: {
						// "add-form": {
						// 	index: 1,
						// 	icon: "&#xE145;",
						// 	popupText: 'Add form',
						// 	callback: function(btn, btnOptions) {

						// 		return $.vdg.widgetFactory('formWidget', {action: 'foo', method: 'GET'}, this.target);
						// 	}
						// },
						"add-row": {
							index: 98,
							faIcon: "fas fa-columns",
							popupText: 'Add row',
							callback: function(btn, btnOptions) {

								return this.onAddRowWidget(btn, btnOptions);
							}
						},
						"add-container": {
							index: 99,
							icon: "&#xE25E;",
							popupText: 'Add container',
							callback: function(btn, btnOptions) {

								return this.onAddContainerWidget(btn, btnOptions);
							}
						},
					}
				},
				"web-design-cmps": {
					index: 92,
					icon: "&#xE90D;",
					popupText: 'Web Design Components',
					subMenu: {

					}
				},
				"resize-column": {
					index: 93,
					icon: "&#xE3BE;",
					popupText: 'Resize column',
					isLayout: true,
					input: {
						type: 'sliderInput',
						icon: "&#xE3BE;",
						popupText: 'Resize column width',
						value: 1,
						min: 1,
						max: 12,
						step: 1,
						callback: function(values) {
							
							this._setWidth(values);
						},
						show: function() {

							return this.element.attr($.vdg.manager().viewMode+'-width');
						}
					},
				},
				// "repeater": {
				// 	index: 9,
				// 	hidden: true,
				// 	icon: "&#xE8A4;",
				// 	popupText: 'Repeat a template',
				// 	isLayout: true,
				// 	input: {
				// 		type: 'repeaterInput',
				// 		icon: "&#xE3BE;",
				// 		popupText: 'Repeat a template <br/><small>Used to display many posts</small>',
				// 		callback: function(values) {
				// 			this.onSetRepeater(values);
				// 		}
				// 	},
				// },
				"style": {
					subMenu: {
						'margin': {
							hidden: true,
						},
						// "valign": {
						// 	index: 7,
						// 	icon: "&#xE259;",
						// 	popupText: 'Vertically align content',
						// 	input: {
						// 		type: 'radioInput',
						// 		menuBtns: {
						// 			'top': {
						// 				name: 'top',
						// 				popupText: 'top',
						// 				icon: '&#xe25a;'
						// 			},
						// 			'middle': {
						// 				name: 'middle',
						// 				popupText: 'Middle',
						// 				icon: '&#xE259;'
						// 			},
						// 			'bottom': {
						// 				name: 'bottom',
						// 				popupText: 'bottom',
						// 				icon: '&#xe258;'
						// 			}
						// 		},
						// 		callback: function(values, target) {
						// 			return this.onVAlignChange(values, target);
						// 		},
						// 		show: function() {
						// 			return this.target.css('align-self');
						// 		}
						// 	}
						// },
					}
				}
			},
		},

		_create: function () {
			this._super();

			if (this.options.preserveContent) {
				 this.options.colWidth.desktop = this.element.attr('desktop-width') || this.element.attr('data-col-width');
				 this.options.colWidth.tablet = this.element.attr('tablet-width') || this.element.attr('data-col-width');
				 this.options.colWidth.mobile = this.element.attr('mobile-width') || this.element.attr('data-col-width');
			}

			this.getFramework().trigger('vdOnCreateColumnWidget', {widget: this});
		},

		addDefaultContent: function() {
			if (!this.options.colWidth) {
				console.log('Error', 'ColumnWidget options colWidth not defined');
				return;
			}

			var self = this;
			$.each(this.options.colWidth, function(key, val) {
				self._setWidth({
					slider: val,
					original: val,
				}, key);
			});

			// this.element.addClass("vd-column-widget vd-row-container vd-content-widget");
		},

		_setOption: function ( key, value ) {
			var self = this;
			
			switch (key) {
				case "width":
					this.options.width = this._setWidth( { slider: value,  original: self.options.colWidth, registerUndo: true} );
				break;
				default:
					//this.options[ key ] = value;
				break;
			}

			this._super(key, value );
		},

		_setWidth: function(values, viewMode) {
			viewMode = viewMode || $.vdg.manager().viewMode;
			var colWidth = values.slider;
			var origColWidth = values.original;
			var prevWidth = this.options.colWidth[viewMode];

			if (colWidth < 1)
				colWidth = 1;
			// else if (colWidth > 12)
			// 	colWidth = 12;

			this.getFramework().trigger('vdOnResizeColumnWidget', {widget: this, newWidth: colWidth});

			var existingClasses = this.framework('option', 'columnWidget').columnSizing[viewMode][prevWidth].classes;
			this.options.colWidth[viewMode] = colWidth;
			var classes = this.framework('option', 'columnWidget').columnSizing[viewMode][colWidth].classes;

			var undoOp2 = this.removeClass(existingClasses, true);
			var undoOp3 = this.addClass(classes, true);
			var undoOp4 = this.attribute(viewMode+'-width', colWidth, true, origColWidth);

			if (values.registerUndo) {
				var origClasses = this.framework('option', 'columnWidget').columnSizing[viewMode][origColWidth].classes;
				var undoOp1 = this.removeClass(origClasses, true);
				$.vdg.undoWidget('registerUndo', [undoOp1, undoOp2, undoOp3, undoOp4]);
			}

			return this.options.colWidth;
		},

		onAddTextWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('textWidget', {}, this.target, '<p></p>');
		},

		onAddImgWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('imgWidget', {}, this.target, '<img>');
		},

		onAddBtnWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('btnWidget', {}, this.target, '<a></a>');
		},

		onAddHorizListWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('inlineListWidget', {}, this.target);
		},

		onAddRowWidget: function(btn, btnOptions) {
			this.addRow();
		},

		onAddContainerWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('containerWidget', {}, this.target);
		},

		onAddVideoWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('videoWidget', {}, this.target, '<video></video>');
		},

		onAddAudioWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('audioWidget', {}, this.target, '<audio></audio>');
		},

		onAddIcon: function(btn, btnOptions) {
			return $.vdg.widgetFactory('iconWidget', {}, this.target, '<span></span>');
		},

		onAddHrWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('hr', {}, this.target, '<hr/>');
		},

		onAddHTMLWidget: function(btn, btnOptions) {
			return $.vdg.widgetFactory('htmlWidget', {}, this.target);
		},

		_upgrade1_2: function() {
			// console.log('@@@@@@@@@@@@@upgrading COLUMN', this);
			var self = this;
			self._super();
			
			// Convert column classes from pcss to vd
			$.each({'desktop': self.element.attr('desktop-width'), 'tablet': self.element.attr('tablet-width'), 'mobile': self.element.attr('mobile-width')}, function(key, val) {
				self._setWidth({
					slider: val,
					original: val,
				}, key);
			});
		}
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.componentWidget", $.vdw.structuralWidget, {

		name: "vd-component-widget",

		vdType: 'component',

		defaults: {
			widgetClass: "vd-component-widget",
			tagName: 'Component',
			template: '',
			sortContainer: '.vd-content-widget',
		},

		_create: function () {

			// this.element.addClass("vd-component-widget vd-content-widget");

			this.getFramework().trigger('vdOnCreateComponentWidget', {widget: this});

			this._super();
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.containerWidget", $.vdw.columnWidget, {

		name: "vd-container-widget",

		vdType: 'container',

		defaults: {
			widgetClass: "vd-container-widget",
			tagName: 'Container',
			sortContainer: '.vd-content-widget',
			template: '',
			menuBtns: {
				"toggle-direction": {
					index: 94,
					icon: "&#xE40F;",
					popupText: 'Toggle display direction <br/><small>Display content horizontally or vertically</small>',
					autoPreview: true,
					isLayout: true,
					callback: function(btn, btnOptions) {

						return this.onToggleMenuDirChange(btn, btnOptions);
					}
				},
				'resize-column': {
					hidden: true,
				},
				'link': {
					hidden: false,
				},
				"style": {
					subMenu: {
						"set-dimensions": {
							input: {
								width: {
									dropdownOptions: {
										'auto': {value: 'auto', display: 'auto', min: 0,  max: 0, step: 0},
										// 'px': {value: 'px', display: 'px', min: 1,  max: 2000, step: 1},
										// 'rem': {value: 'rem', display: 'rem', min: 0.1,  max: 20, step: 0.1},
										// 'em': {value: 'em', display: 'em', min: 0.1,  max: 20, step: 0.1},
										// '%': {value: '%', display: '%', min: 1,  max: 200, step: 1},
									}
								}
							}
						},
					}
				}
			}
		},

		_create: function () {
			// this.element.addClass("vd-container-widget vd-content-widget vd-row-container");
			this.getFramework().trigger('vdOnCreateContainerWidget', {widget: this});
			// Dont call column constructor but contentWidget constructor
			$.vdw.contentWidget.prototype._create.call( this );
		},

		addDefaultContent: function() {
			// Override column default content
			$.vdw.baseWidget.prototype.addDefaultContent.call( this );
		},

		trash: function(btn, btnOptions) {
			return $.vdw.contentWidget.prototype.trash.call( this, btn, btnOptions );
		},

		onToggleFillChange: function(btn, btnOptions) {
			var h = 'auto';
			var icon = '&#xE40F;';
			
			if (this.target.css('height') != '100%') {
				h = '100%';
				icon = '&#xE40E;';
			}

			var undos = [];
			undos.push( this.style('height', h, true) );
			undos.push( this.setEleHtml($('.vd-icon', btn), icon, true) );
			$.vdg.undoWidget('registerUndo', undos);
		},

		onToggleMenuDirChange: function(btn, btnOptions) {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			var alignmentCls = this.framework('option', 'alignments').self[view].halign;
			this.element.toggleClass(alignmentCls);
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.hr", $.vdw.baseWidget, {

		name: "vd-hr-widget",

		vdType: 'hr',

		defaults: {
			widgetClass: "vd-hr-widget",
			tagName: 'Divider',
			sortContainer: '.vd-content-widget',
			template: '',
			menuBtns: {
				"hr-border": {
					index: 1,  
					icon: "&#xE22F;", 
					popupText: 'Border',
					input: {
						type: 'borderInput',
						icon: "&#xE22F;", 
						popupText: 'Set border widths',
						buttons: {
							'border-top-width': {
								placeholder: 'top',
								tooltip: 'Border Width Top',
								dblClick: '[vd-name="border-bottom-width"]',
								trplClick: '[vd-name]',
							},
							'border-bottom-width': {
								placeholder: 'bottom',
								tooltip: 'Border Width Bottom',
								dblClick: '[vd-name="border-top-width"]',
								trplClick: '[vd-name]',
							},
							'border-left-width': {
								placeholder: 'left',
								tooltip: 'Border Width Left',
								dblClick: '[vd-name="border-right-width"]',
								trplClick: '[vd-name]',
							},
							'border-right-width': {
								placeholder: 'right',
								tooltip: 'Border Width Right',
								dblClick: '[vd-name="border-left-width"]',
								trplClick: '[vd-name]',
							},
						},
						callback: function(values, target) {

							return this.onBorderChange(values, target);
						},
						show: function() {
							var self = this;
							return {
								'border-top-width': self.target.css('border-top-width'),
								'border-bottom-width': self.target.css('border-bottom-width'),
								'border-left-width': self.target.css('border-left-width'),
								'border-right-width': self.target.css('border-right-width'),
								'border-style': self.target.css('border-style'),
								'border-color': self.target.css('border-color'),
							};
						}
					}
				},
				"style": {
					subMenu: {
						"background-colour": {
							hidden: true
						},
						"align": {
							hidden: true
						},
						"border": {
							hidden: true
						},
						"set-dimensions": {
							hidden: true
						}
					}
				},
			},
		},

		_create: function () {
			this._super();
			// this.element.addClass("vd-hr-widget");
			// this.target = $('hr', this.element).first();
			// this.initTargetEle( this.target );
			this.getFramework().trigger('vdOnCreateHrWidget', {widget: this});
		},

		onForeColourChange: function(values, target) {
			var self = this;
			var eles = $(this.element);

			eles.each(function(ele) {
				self.styleElement($(this), 'border-color', values.colour);
			});
		},

		onBackColourChange: function(values, target) {
			this.styleElement(ele, 'background-color', values['background-colour']);
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.htmlWidget", $.vdw.structuralWidget, {

		name: "vd-html-widget",

		vdType: 'html',

		defaults: {
			widgetClass: "vd-html-widget",
			tagName: 'HTML',
			template: '',
			sortContainer: '.vd-content-widget',
			menuBtns: {
				"html": {
					index: 1,
					icon: "&#xE86F;",
					popupText: 'HTML',
					isLayout: true,
					input: {
						type: 'textareaInput',
						placeholder: '<p>foo</p>',
						popupText: 'Apply html',
						tooltip: 'Enter HTML here',
						icon: "&#xE86F;",
						callback: function(values, target) {
							
							return this.onHTMLChange(values, target);
						},
						show: function() {
							return this.html;
						}
					}
				},
				'css': {
					index: 1,
					hidden: true,
					icon: "&#xE40A;",
					popupText: 'CSS',
					isLayout: true,
					input: {
						type: 'textareaInput',
						placeholder: 'color: #000; font-size: 1rem;',
						popupText: 'Apply css',
						tooltip: 'Enter CSS here',
						icon: "&#xE40A;",
						callback: function(values, target) {
							
							return this.onCSSChange(values, target);
						},
						show: function() {
							return this.css;
						}
					},
				},
				"link": {
					hidden: true,
				},
				"style": {
					hidden: true,
				},
			},
		},

		_create: function () {
			// this.element.addClass("vd-html-widget vd-bootstrap");
			this.html = this.element.html();
			this.getFramework().trigger('vdOnCreateHtmlWidget', {widget: this});

			this._super();
		},

		onHTMLChange: function(values, target) {
			this.html = values.html;
			this.setHtml(values.html);
			this.removeDisallowed(this.element);
		},

		onCSSChange: function(values, target) {
			this.css = values.css;
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.iconTxt", $.vdw.iconWidget, {

		name: "vd-icon-widget",

		vdType: 'iconTxt',

		defaults: {
			widgetClass: "vd-icontxt-widget",
			tagName: 'Icon',
			wildcard: "fa-",
			template: '<i class="material-icons">face</i>',
			menuBtns: {
				"toggle-position": {
					index: 3,
					icon: "&#xE8AB;",
					popupText: 'Toggle icon position',
					isLayout: true,
					callback: function(btn, btnOptions) {
						return this.onTogglePosition(btn, btnOptions);
					}
				},
				'link': {
					hidden: true,
				},
				'style': {
					subMenu: {
						"align": {
							hidden: true,
						},
					}
				}
			},
		},

		_create: function () {
			this._super();
			this.element.addClass("vd-drag-disabled");
		},

		onTogglePosition: function(btn, btnOptions) {
			var before = this.element.prev();
			var next = this.element.next();

			if (!before || before.length <= 0)
				this.element.parent().append(this.element);
			else this.element.parent().prepend(this.element);
		},
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.imgWidget", $.vdw.baseWidget, {

		name: "vd-img-widget",

		vdType: 'img',

		defaults: {
			widgetClass: "vd-img-widget",
			tagName: 'Img',
			source: 'https://www.visualdesigner.io/wp-content/uploads/2017/10/cropped-Generic1-2.png',
			sortContainer: '.vd-content-widget',
			template: '',
			menuBtns: {
				"src": {
					index: 1,
					icon: "&#xE251;",
					popupText: 'Image',
				},
				"set-dimensions": {
					index: 2,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					isLayout: true,
					input: {
						type: 'dimensionsInput',
						icon: "&#xE85B;",
						callback: function(values, target) {
							
							return this.onSetDimensions(values, target);
						},
						show: function() {
							var self = this;
							return {
								width: self.element.attr('vd-width'),
								height: self.element.attr('vd-height')
							};
						}
					}
				},
				'style': {
					subMenu: {
						"colour": {
							hidden: true,
						},
					}
				}
			},
		},

		_create: function () {
			this._super();
			// this.element.addClass("vd-img-widget");
			// this.target = $('img', this.element).first();
			// this.initTargetEle( this.target );
			this.getFramework().trigger('vdOnCreateImgWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();
			this.element.attr('src', this.options.source);
		},

		// Upgraders
		_upgrade1_2: function() {
			this._super();

			var styles = this.getWidgetStyle();
			if (!styles || !styles.length || !styles[0].length)
				return;

			console.log('@@@@@@@@@@upgrading', styles);
			var leftMargin = styles[0][0].style['margin-left'];
			var rightMargin = styles[0][0].style['margin-right'];
			if ((!leftMargin || parseInt(leftMargin,10) == 0) && (!rightMargin || parseInt(rightMargin,10) == 0)) {
				this.style('margin-left', 'auto');
				this.style('margin-right', 'auto');
			}
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.inputWidget", $.vdw.containerWidget, {

		name: "vd-input-widget",

		vdType: 'input',

		defaults: {
			widgetClass: "vd-input-widget",
			tagName: 'Input',
			sortContainer: '.vd-content-widget',
			template: '',
			// menuBtns: {
				
			// },
		},

		_create: function () {
			if (!this.options.type && !$('input', this.element).attr('type'))
				throw 'Must have type option';

			// this.element.addClass('vd-input-widget');
			this._super(); 
			this.element.attr('type', this.options.type || $('input', this.element).attr('type'));
			this.getFramework().trigger('vdOnCreateInputWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();
			
			var label = $.vdg.widgetFactory('textWidget', {}, this.element, '<label></label>');
			var input = $.vdg.widgetFactory('btnWidget', {}, this.element, '<input/>')
				.attr('type', 'text');

			label.attr('for', input.attr('id'));
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.layoutPrompt", {

		name: "vd-layout-widget",

		vdType: 'layout',

		defaults: {
			widgetClass: 'vd-layout-widget',
		},

		template: '<div class="vd-container-widget vd-container-horiz"></div>',

		layoutBtnTemplate: '<div class="vd-container-widget vd-content-widget vd-row-container " style="display: inline-block;"><div class=" vd-img-widget"><img alt="" src="http://2.gravatar.com/avatar/efcf667d14c6fea580538c6b92bf645b?s=96&amp;d=mm&amp;r=g"></div><div class="vd-btn-widget vd-text-widget "><a href="#" vd-link="true"><span>Layout 1<br></span></a></div></div>',

		/*
		<div class="vd-container-widget vd-content-widget vd-row-container " style="display: inline-block;">
			<div class=" vd-img-widget">
				<img alt="" src="http://2.gravatar.com/avatar/efcf667d14c6fea580538c6b92bf645b?s=96&amp;d=mm&amp;r=g">
			</div>
			<div class="vd-btn-widget vd-text-widget ">
				<a href="#" vd-link="true"><span>Layout 1<br></span></a>
			</div>
		</div>
		*/

		_create: function () {
			var self = this;
			self._super();
			self.element.addClass(self.options.classes);
			self.element.append(self.template);

			var cnt = $('.vd-container-widget', self.element);
			for (var i in self.options.layoutOptions) {
				$(self.layoutBtnTemplate)
					.appendTo(cnt)
					.popOverWidget({title: '', content: 'Add layout'});
			}
		},

		_destroy: function () {
			// delete this.element??
		},

		addLayout: function (index) {
			var layout = this.options.layoutOptions[index];

		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.popOverWidget", $.vd.base, {

		name: "vd-popover-widget",

		vdType: 'popover',

		mode: 'relative', // 'absolute'

		template: '<div class="vd-popover vd-popover-bottom"><h3 class="vd-popover-title"></h3><div class="vd-popover-content"></div></div>',

		// defaults: {
		// 	mode: 'relative', // 'absolute',
		// 	// classes: "",
		// 	// template: '',
		// 	// sortContainer: '.vd-content-widget',
		// },

		options: {
			leftOffset: 0,
			topOffset: 15,
			widgetClass: 'vd-popover-widget',
		},

		_create: function () {
			var self = this;
			this._super();

			if (this.mode == 'relative') {
				this.element.addClass('vd-relative');
				this.ele = $(this.template).appendTo(this.element);
			}
			else {
				this.ele = $(this.template).appendTo('body');
				this.ele.addClass('vd-absolute');
				this.ele.css({
					left: self.options.left + self.options.leftOffset,
					top: self.options.top + self.options.topOffset,
				});
			}

			$('.vd-popover-title', this.ele).html(this.options.title);
			$('.vd-popover-content', this.ele).html(this.options.content);
		},

		_destroy: function () {
			this.ele.remove();
			if (this.mode == 'relative')
				this.element.removeClass('vd-popover-widget');
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.rowWidget", $.vdw.structuralWidget, {

		name: "vd-row-widget",

		vdType: 'row',

		defaults: {
			widgetClass: "vd-row-widget",
			colWidgetType: 'columnWidget',
			tagName: 'Row',
			sortContainer: '.vd-row-widget',
			template: '',
			menuBtns: {
				// "add-column": {
				// 	index: 1,
				// 	isLayout: true,
				// 	icon: "&#xE5C3;",
				// 	popupText: 'Add columns',
				// 	buttonColumns: 3, 
				// },
				"add-column": {
					index: 2,
					isLayout: true,
					icon: "&#xE5C3;",
					popupText: 'Add columns',
					subMenu: {
						"add-1-column": {
							index: 1,
							popupText: '1 column',
							icon: "&#xE3D0;",	
							callback: function() {
								this.addColumns([12]);
							}
						},
						"add-2-column": {
							index: 2,
							icon: "&#xE3D1;",
							popupText: '2 columns',
							callback: function() {
								this.addColumns([6,6]);
							}
						},
						"add-3-column": {
							index: 3,
							icon: "&#xE3D2;",
							popupText: '3 columns',
							callback: function() {
								this.addColumns([4,4,4]);
							}
						},
						"add-4-column": {
							index: 4,
							icon: "&#xE3D4;",
							popupText: '4 columns',
							callback: function() {
								this.addColumns([3,3,3,3]);
							}
						},
						"add-5-column": {
							index: 5,
							icon: "&#xE3D5;",
							popupText: '5 columns',
							callback: function() {
								this.addColumns([2,2,4,2,2]);
							}
						},
						"add-6-column": {
							index: 6,
							icon: "&#xE3D6;",
							popupText: '6 columns',
							callback: function() {
								this.addColumns([2,2,2,2,2,2]);
							}
						}
					}
				},
				'style': {
					subMenu: {
						"margin": {
							hidden: true,
						},
					}
				}
			}
		},

		_create: function () {
			
			// this.element.addClass('vd-row-widget');

			this.getFramework().trigger('vdOnCreateRowWidget', {widget: this});

			this._super(); 
		},

		addColumns: function (columns, target) {
			var self = this;
			var colWidgets = [];
			var undoList = [];
			var column = null;

			if (!target)
				target = this.target; // this.element;

			$.each(columns, function(index, colWidth) {

				column = $.vdg.widgetFactory(self.options.colWidgetType, 
					{
  					colWidth: {
  						desktop: colWidth,
  						tablet: colWidth,
  						mobile: 12,
  					},
  					undoCreation: false,
  					select: true, 
  				}, 
  				target);

	  		undoList.push( {action: 'add', target: column} );
	  		colWidgets.push(column);
			});

			$.vdg.undoWidget('registerUndo', undoList);

			column.vdPolymorphic('select');

			this.getFramework().trigger('onRowAddColumns', {widget: this});
			return colWidgets;
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.sectionWidget", $.vdw.structuralWidget, {

		name: "vd-section-widget",

		vdType: 'section',

		defaults: {
			widgetClass: "vd-section-widget",
			tagName: 'Section',
			sortContainer: '.vd-section-widget',
			template: '<div class="vd-section-container vd-ignore"></div>', // vd-container-fluid
			menuBtns: {
				"add-row": {
					index: 2,
					faIcon: "fas fa-columns",
					popupText: 'Add row',
					autoPreview: true,
					isLayout: true,
					callback: function(btn, btnOptions) {

						return this.onAddRowChange(btn, btnOptions);
					}
				},
				'style': {
					subMenu: {
						"margin": {
							hidden: true,
						},
						"padding": {
							hidden: true,
						},
					}
				},
				'trash': {
					isLayout: true,
				}
			},
		},

		_create: function () {
			// this.element.addClass('vd-section-widget vd-row-container');
			this._super(); 
			this.getFramework().trigger('vdOnCreateSectionWidget', {widget: this});
		},

		select: function(e, onTrashEvt) {
			$.vdw.baseWidget.prototype.select.call( this, e );

			// Must be '<=1' not '<=0' BECAUSE trashElement selects the parent (this) BEFORE trashing the sub-element. So this.element is not empty at this point
			var totalAllowed = (onTrashEvt) ? 1:0;
			var isEmpty = $('.vd-section-container', this.element).children().not('.vd-ignore').length <= totalAllowed;
			if (isEmpty)
				this.element.addClass('vd-force-dimensions');
		},

		deselect: function(e) {
			$.vdw.baseWidget.prototype.deselect.call( this, e );

			// Must be '<=1' not '<=0' BECAUSE trashElement selects the parent (this) BEFORE trashing the sub-element. So this.element is not empty at this point
			var isEmpty = $('.vd-section-container', this.element).children().not('.vd-ignore').length <= 0;
			if (!isEmpty)
				this.element.removeClass('vd-force-dimensions');
		},

		addDefaultContent: function() {
			this._super();
			var container = $('.vd-section-container', this.element);
			var row = this.addRow({}, container);

			setTimeout(function() {
				row.vdPolymorphic('select');
			}, $.vdg.VD_DEFER);
		},

		onAddRowChange: function(btn, btnOptions) {
			var row = this.addRow({}, $('.vd-section-container', this.element));
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.supportWidget", $.vdw.modalWidget, {

		name: "vd-support-widget",

		vdType: 'support',

		body: '<form class="vd-form vd-lrg">  <fieldset>              <legend></legend>                <div class="vd-row-widget">                <div class="vd-7 vd-column-widget">                  <label for="vd-email">Email</label>                  <input id="vd-email" name="vd-email" class="vd-1" type="email" required="true" placeholder="Enter email">                </div>                  <div class="vd-7 vd-column-widget">                  <label for="vd-name">Name</label>                  <input id="vd-name" name="vd-name" class="vd-1" type="text" required="true" placeholder="Enter name">                </div>                  <div class="vd-11  vd-column-widget vd-c-left vd-c-middle">                  <label class="vd-modal-text" for="vd-support-type">Category</label>                </div>                  <div class="vd-category-container vd-3 ">                <select id="vd-support-type" name="vd-support-type" class="" required="true">                  <option>About my design</option>                  <option>About my license</option>                  <option>Report a bug</option>                  <option>Other</option>                </select>                </div>                  <div class="vd-1 "><textarea id="vd-message" name="vd-message" class="vd-1" required="true" rows="5" placeholder="Your message"></textarea></div>                  <div class="vd-submit-btn vd-7 vd-column-widget vd-center">                  <button type="submit" class="vd-menu-btn vd-center vd-middle"><i class="material-icons">&#xE163;</i> <span>&nbsp;Send</span></button>                </div>                <div class="vd-submit-btn vd-7 vd-column-widget vd-center">                  <button type="cancel" class="vd-menu-btn vd-center vd-middle" data-dismiss="modal"><i class="material-icons">&#xE14C;</i> <span>&nbsp;Cancel</span></button>                </div>    <div class="vd-1 output"><span></span></div>           </div>            </fieldset>          </form>',

    options: {
      widgetClass: 'vd-support',
    },

		_create: function () {
			this.options.content = this.body;
			this._super();
		},

		onSubmit: function(e) {
      e.preventDefault();
      var self = this;

      if (self.isProcessing) {
        console.log('Cant do; is processing');
      	return true;
      }

      self.isProcessing = true;
      var outputEle = $('.output span', self.element);
      var data = $('form', self.element).serializeArray().reduce(function(m,o){ m[o.name] = o.value; return m;}, {}); 
      var params = {
      	data: data,
      	outputEle: outputEle,
      	instance: self,
      	killSpinner: true,
      };

      outputEle.html('');
      outputEle.removeClass('success error');
      this.getFramework().trigger('vdOnSubmitSupportRequest', params); 
      
      if (params.killSpinner) {
        self.isProcessing = false;
      }
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.svgWidget", $.vdw.baseWidget, {

		name: "vd-svg-widget",

		vdType: 'svg',

		defaults: {
			widgetClass: 'vd-svg-widget',
			type: 'clouds',
			menuBtns: {
				
			},
			hiddenMenuBtns: {
				'link': true
			},
			templates: {
				'fan': "",
				'waves': "",
				'spikes': "",
				'clouds': "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 700 55' width='700' height='55'><style>tspan { white-space:pre }.shp0 { fill: #e6e8e7 } </style><path id='Layer' class='shp0' d='M47 25.31C44.23 23.14 40.77 21.85 37 21.85C28.13 21.85 20.9 29.01 20.68 37.93C11.52 41.4 5 50.34 5 60.81C5 73.18 14.09 83.41 25.89 85.02L25.89 85.24L109.49 85.24L109.49 85.2C121.14 84.52 130.38 74.74 130.38 62.79C130.38 51.26 121.79 41.76 110.72 40.48C110.77 39.78 110.79 39.07 110.79 38.36C110.79 20.48 95.88 6 77.49 6C63.88 6 52.17 13.94 47 25.31ZM383 25.31C380.23 23.14 376.77 21.85 373 21.85C364.13 21.85 356.9 29.01 356.68 37.93C347.52 41.4 341 50.34 341 60.81C341 73.18 350.09 83.41 361.89 85.02L361.89 85.24L445.49 85.24L445.49 85.2C457.14 84.52 466.38 74.74 466.38 62.79C466.38 51.26 457.79 41.76 446.72 40.48C446.77 39.78 446.79 39.07 446.79 38.36C446.79 20.48 431.88 6 413.49 6C399.88 6 388.17 13.94 383 25.31ZM612 25.31C609.23 23.14 605.77 21.85 602 21.85C593.13 21.85 585.9 29.01 585.68 37.93C576.52 41.4 570 50.34 570 60.81C570 73.18 579.09 83.41 590.89 85.02L590.89 85.24L674.49 85.24L674.49 85.2C686.14 84.52 695.38 74.74 695.38 62.79C695.38 51.26 686.79 41.76 675.72 40.48C675.77 39.78 675.79 39.07 675.79 38.36C675.79 20.48 660.88 6 642.49 6C628.88 6 617.17 13.94 612 25.31Z' /></svg>",
			}
		},

		_create: function () {
			// this.element.addClass("vd-svg-widget");

			this._super();

			this.getFramework().trigger('vdOnCreateSVGWidget', {widget: this});
		},

		addDefaultContent: function() {
			this.element.attr("vd-type", this.options.type);
			this.options.template = this.options.templates[this.options.type];
			this.element.append($(this.options.template));
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.tagWidget", {

		name: "vd-tag-widget",

		vdType: 'tag',

		template: '<a class="vd-tag-title"></a><div class="vd-t-btns"><a href="#" class="vd-t-btn"><i class="fas fa-copy" aria-hidden="true"></i></a><a href="#" class="vd-t-btn"><i class="fas fa-paste" aria-hidden="true"></i></a></div><a href="#" class="vd-tag-parent-btn"><i class="vd-icon material-icons" aria-hidden="true"></i></a>',

		options: {
			widgetClass: 'vd-tag-widget',
			tagOptions: {
				label: '',
				classes: '',
			}
		},

		_create: function () {
			var self = this;
			self._super();

			if (!self.options.target)
				throw 'tagWidget must have a target option';

			self.parentEle = self.element.parent();
			this.element.data('widgetName', this.widgetName);
			this.element.addClass(this.options.widgetClass);
			self.element.addClass(self.options.classes);
			self.element.addClass(self.options.tagOptions.classes);
			self.element.append(self.template);
			self.element.attr('for', self.options.target.element.attr('id'));
			$('.vd-tag-title', self.element).html(self.options.title);

			this.reposition();

			var parentWidget = self.options.parent; 
			// Bind select parent btn
			if (parentWidget) {
				$('.vd-tag-parent-btn', self.element).on($.vdg.manager('btnBindEvt'), function(ev) {
					ev.preventDefault();
					ev.stopPropagation();
					parentWidget.vdPolymorphic('select');
				})
				.popOverWidget({title: '', content: 'Select parent'});
			}
			else 
				$('.vd-tag-parent-btn', self.element).remove();

			// Bind copy style btn
			$('.vd-t-btn:first', this.element)
				.on($.vdg.manager('btnBindEvt'), function(ev) {
					ev.preventDefault();
					ev.stopPropagation();
					self.options.target.onCopyStyle(this, []);
				})
				.popOverWidget({title: '', content: 'Copy style'});
			
			// Bind paste style btn
			$('.vd-t-btn:last', this.element)
				.on($.vdg.manager('btnBindEvt'), function(ev) {
					ev.preventDefault();
					ev.stopPropagation();
					self.options.target.onPasteStyle(this, []);
				})
				.popOverWidget({title: '', content: 'Paste style'});

			if (self.options.isDynamic) {
				self.element.addClass('vd-dynamic');
				$('.vd-tag-title', self.element)
					.contextmenu(function(ev) {
						ev.preventDefault();
						ev.stopPropagation();
						self.options.target.unsetDynamic(this, []);
					})
					.popOverWidget({title: '', content: 'Uses dynamic data<br><small>Right click to clear dynamic data</small>'});
			}
			else if (self.options.sortOptions) {
				$('.vd-tag-title', self.element)
					.popOverWidget({title: '', content: 'Move widget' + self.options.tagOptions.label})
					.addClass('vd-draggable');
			}

			// https://stackoverflow.com/questions/10268892/outerheighttrue-gives-wrong-value
			if (self.options.delayPositioning)
				setTimeout(function() {
					self.reposition();
				}, 10); // must do minimum of 10 milliseconds because certain browsers/people got the error: 'can't access property "left", offset is undefined'

			try { self.parentEle.sortable("destroy"); }
			catch (ex) { }

			if (self.options.sortOptions) {
				self.options.sortOptions.connectWith = self.options.parent.vdPolymorphic('option', 'sortContainer');
				var baseStart = self.options.sortOptions.start || function() {};
    		var baseStop 	= self.options.sortOptions.stop  || function() {};
    		self.options.sortOptions.start = function(ev, ui) {
    			ui.item = self.options.target.element;
    			baseStart(ev, ui);
			  	self.options.target.element.hide();
			  };
    		self.options.sortOptions.stop = function(ev, ui) {
    			baseStop(ev, ui);
			  	self.options.target.element.show();
			  	self.options.target.showTag();
			  }; 
				self.parentEle.sortable(self.options.sortOptions);
			}
		},

		reposition: function() {
			var self 				= this;
			var tag 				= self.element;
			var offset 			= self.options.target.element.offset();
			var bodyPos 		= $('body').position();
			var htmlPos 	= $('html').position();
			
			// Certain browsers/people got the error: 'can't access property "left", offset is undefined'
			if (!offset || !offset.hasOwnProperty('left') || !offset.hasOwnProperty('top'))
				return;

			var left 	= offset.left + self.options.target.element.outerWidth() - tag.outerWidth() - (bodyPos.left || 0) - (htmlPos.left || 0); // - (bodyPos.left || 0);
			var top 	= offset.top - tag.outerHeight() - (bodyPos.top || 0) - (htmlPos.top || 0);
			left 			= Math.max(left, 0);
			top 			= Math.max(top, 0);
			left 			= Math.min(left, self.browserWidth());
			top 			= Math.min(top, self.browserHeight());

			tag.css({
				left: left,
				top: top
			});
		},

		browserWidth: function() {
		  return Math.max(
		    document.body.scrollWidth,
		    document.documentElement.scrollWidth,
		    document.body.offsetWidth,
		    document.documentElement.offsetWidth,
		    document.documentElement.clientWidth
		  );
		},

		browserHeight: function() {
		  return Math.max(
		    document.body.scrollHeight,
		    document.documentElement.scrollHeight,
		    document.body.offsetHeight,
		    document.documentElement.offsetHeight,
		    document.documentElement.clientHeight
		  );
		},

		onBeginMove: function(ev, ui) {
			var self = this;
			self.options.target.onBeginMove(ev, ui);
		},

		onMoved: function(ev, ui) {
			var self = this;
			self.options.target.element.insertAfter(ui.item);
    	ui.item.appendTo(self.parentEle);
    	self.options.target.onMoved(ev, ui);
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw.triggerWidget", $.vdw.baseWidget, {

		name: "vd-trigger-widget",

		vdType: 'trigger',

		defaults: {
			widgetClass: "vd-trigger-widget",
			tagName: 'Trigger',
			menuBtns: {
				"click-trigger": {
					index: 1,
					isLayout: true,
					icon: "&#xe173;",
					popupText: 'Enter id',
					input: {
						type: 'inputMenu',
						icon: "&#xe173;",
						placeholder: '#xyz',
						popupText: 'Enter id',
						callback: function(values, target) {

							return this.onClickTrigger(values['click-trigger'], target);
						}
					}
				},
			}
		},

		_create: function () {
			this._super();
		},

		addDefaultContent: function() {
			this._super();
			// this.element.attr('onmouseup', '');
		},

		onClickTrigger: function(id) {
			if (!this.element.attr('onmouseup'))
				this.element.attr('onmouseup', '');

			var existing = this.element.attr('onmouseup') + '$(\'#' + id + '\').toggle();';
			this.element.attr('onmouseup', existing);
		},
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

 (function ($) {

  $.widget( "vdw.videoWidget", $.vdw.mediaWidget, {

		name: "vd-video-widget",

		vdType: 'video',

		defaults: {
			widgetClass: "vd-video-widget",
			tagName: 'Video',
			source: "http://www.visualdesigner.io/wp-content/uploads/2018/03/waves.mp4",
			controls: "true",
			sortContainer: '.vd-content-widget',
			template: '<source></source>',
			//sourceType: "video/youtube",
			menuBtns: {
				"src": {
					index: 1,
					icon: "&#xE04B;",
					popupText: 'Video'
				},
				"toggle-controls": {
					index: 3,
					isLayout: true,
					icon: "&#xE1B2;",
					popupText: 'Toggle controls',
					callback: function(btn, btnOptions) {

						return this.onControlsChange(btn, btnOptions);
					}
				},
			}
		},

		_create: function () {
			var self = this;
			this._super();

			// this.element.addClass("vd-video-widget");
			// this.target = $('video', this.element).first();
			// this.initTargetEle( this.target );

			// this.onSetOverlayChange('transparent');

			this.getFramework().trigger('vdOnCreateVideoWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();
			$('source', this.element).attr('src', this.options.source);
			this.element.attr('controls', this.options.controls);
		},

		onSrcChange: function(btn, btnOptions) {
			// TODO: trigger event on this element
		},

		onControlsChange: function(btn, btnOptions) {
			if (!this.target.attr('controls')) {
				this.target.attr('controls', '');
				this.target.attr('autoplay', '');
			}
			else {
				this.target.removeAttr('controls');
				this.target.removeAttr('autoplay');
			}
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.inputWidget", $.vd.baseMenu, {

		options: {
			input: {
				icon: 	'',
				placeholder: '',
				popupText: '',
				selectAll: false,
				callback: function(value) {

				},
			}
		},

		addSubmitBtn: true,

		_create: function () {

      this.options.isSubMenu = true;

      this._super();

			var self = this;

			self.element.addClass('vd-input-widget vd-sub-menu vd-menu vd-btn-group vd-btn-group-lg'); 
			self.element.addClass(self.options.classes);

			// self.container = $('<div></div>')
			// 	.addClass('vd-input-menu vd-input-group')
			// 	.appendTo(self.element);

			if (self.addSubmitBtn) {
				self.subBtn = self._createSubmitBtn()
					.on($.vdg.manager('btnBindEvt'), function(e) {
						e.preventDefault();
						e.stopPropagation();

						var values = self.validate(e);

						if (!values)
							return false;

						self.options.callback.call(gSelWidget, values, $(this));
					});
			}
			
			self.initInput();

			// self.element.on('showInput', function() {
			// 	self.show();
			// });

			// self.element.on('hideInput', function() {
			// 	self.hide();
			// });

			$('.vd-radio-btn', self.element).on($.vdg.manager('btnBindEvt'), function() {

				$(this).siblings('.vd-radio-btn').removeClass('vd-selected');
				$(this).addClass('vd-selected');
			});

			if (this.options.selectAll)
				this.setSelectAllFunctionality();

			this.getFramework().trigger('vdOnInitInput', {widget: self});
		},

		initInput: function() {
			this.inputEle = $('<input></input>')
				.attr('aria-describedby', '')
				.attr('placeholder', this.options.placeholder)
				.attr('title', this.options.tooltip)
				.addClass('vd-form-control vd-input-lg')
				.appendTo(this.element);
		},

		_createBtn: function(parent, icon, attribs, classes) {

			var btn = $('<a></a>')
				.attr('href', '#')
  				.attr('type', 'button')
  				.attr('data-toggle', 'popover')
  				.attr('data-trigger', 'hover')
  				.attr('data-placement', 'bottom')
  				.attr('data-content', attribs.popupText)
  				.addClass('vd-menu-btn')
  				.addClass(classes)
  				.appendTo(parent)
  				.popOverWidget({title: '', content: attribs.popupText || attribs['data-content']});

			var iconEle = $('<i></i>')
				.addClass('vd-icon material-icons')
				.attr('aria-hidden', 'true')
				.html(icon)
				.appendTo(btn);

			$.each(attribs, function(key, value) {
				btn.attr(key, value);
			});

			return btn;
		},

		_createSubmitBtn: function() {

			return this._createBtn(this.element, this.options.icon, {popupText: this.options.popupText}, 'vd-menu-btn vd-input-group-addon');
		},

		_createBackBtn: function() {

			//return this._createBtn(this.element, this.options.icon, {popupText: this.options.popupText}, 'vd-menu-btn vd-input-group-addon');
		},

		show: function(e, isLocked) {
			console.log('inputWidget::show()', this.element);
			this._super(e, isLocked );
			if (this.options.show)
				this.inputEle.val( this.options.show.call(gSelWidget, this) );
		},

		hide: function(e, isLocked) {
			console.log('inputWidget::hide()', this.element);
			this._super(e, isLocked );
		},

		validate: function(e) {

			var value = this.inputEle.val();

			return value;
		},

		setSelectAllFunctionality: function() {

			this.inputEle.on($.vdg.manager('btnBindEvt'), function(ev) {
				this.setSelectionRange(0, this.value.length);
			});
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

 	$.widget( "vd.multiInput", $.vd.inputMenu, {

  	options: {
  		input: {
				buttons: [
					{
						name: '',
						placeholder: ''
					}
				],
			}
		},

		_create: function () {
			var self = this;
			self.options.input.popupText = (self.options.input.popupText) ? self.options.input.popupText+'<br/><small>Dbl-click an input to adjacent copy. Triple-click to copy to all.</small>' : '<small>Dbl-click an input to adjacent copy. Triple-click to copy to all.</small>';
			self._super();
		},

		_buildInput: function() {
			/*
			<div class="vd-input-menu vd-input-group vd-pull-right">
				<a href="#" type="button" class="vd-menu-btn vd-input-group-addon">
					<span class="vd-icon fa fa-picture-o" aria-hidden="true"></span>
				</a>
				<div class="vd-multi-input vd-input-group">
					<input aria-describedby="" placeholder="Left" class="vd-form-control vd-input-lg vd-input-1">
					<input aria-describedby="" placeholder="Right" class="vd-form-control vd-input-lg vd-input-1">
					<input aria-describedby="" placeholder="Top" class="vd-form-control vd-input-lg vd-input-1">
					<input aria-describedby="" placeholder="Bottom" class="vd-form-control vd-input-lg vd-input-1">
				</div>
			</div>
			*/

			var self = this;

			self._addSubmitBtn(self.options.input);
			
			$.each(self.options.input.buttons, function(key, buttonOpts) {

				var input = $('<input></input>')
					.attr('aria-describedby', '')
					.attr('vd-name', key)
					.addClass('vd-multi-input')
					.appendTo(self.element);
					
				if (buttonOpts.placeholder)
					input.attr('placeholder', buttonOpts.placeholder);
				if (buttonOpts.tooltip)
					input.attr('title', buttonOpts.tooltip);
				if (buttonOpts.dblClick)
					input.dblclick(function() {
						$(buttonOpts.dblClick, self.element).val( $(this).val() );
					});
				if (buttonOpts.trplClick)
					input.bind("tripleclick", function() {
						$(buttonOpts.trplClick, self.element).val( $(this).val() );
					});

				input.on('keypress',function(e) {
					// on enter
			    if(e.which == 13) {
			      self.inputCallback(e);
			    }
				});
			});
		},

		prepopulate: function(values) {
			var self = this;
			$.each(values, function(key, value) {
				$('input[vd-name="' + key + '"]', self.element).val( value );
			});
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.radioInput", $.vd.inputMenu, {

  	_create: function () {
			var self = this;
			self._super();

			$('.vd-menu-btn:not(.vd-back-menu-btn)', self.element).on($.vdg.manager('btnBindEvt'), function(e) {
				e.preventDefault();
				$('.vd-menu-btn', self.element).removeClass('vd-selected');
				$(this).addClass('vd-selected');
 				self.options.input.callback.call(gSelWidget, self.validate(e));
				return false;
			});

			$('.vd-menu-btn:not(.vd-back-menu-btn)', self.element).first().addClass('vd-selected');
		},

		_buildInput: function() {
			// override base functionality
			return;
		},

		prepopulate: function(selectedOption) {
			var option = $('a[vd-name="' + selectedOption + '"]', this.element);
			if (option.length > 0) {
				$('.vd-menu-btn', this.element).removeClass('vd-selected');
				option.addClass('vd-selected');
			}
		},

		validate: function(e) {
			return $('.vd-selected', this.element).attr('vd-name');
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.sliderInput", $.vd.inputMenu, {

		options: {
			input: {
				value: 1,
				min: 1,
				max: 6,
				step: 1,
			}
		},
		
		_buildInput: function() {
			var self = this;

			this._addSubmitBtn(this.options.input);

			self.slider = $('<div></div>')
				.addClass('vd-slider vd-input-fill')
				.attr('data-type', 'vd-slider')
				.appendTo(self.element)
				.slider({
					value: self.options.input.value,
					min: self.options.input.min,
					max: self.options.input.max,
					step: self.options.input.step,
					slide: function( e, ui ) {
						self.options.input.callback.call(gSelWidget, {'slider': ui.value}, e.target);
					},
					start: function( e, ui ) {
						self.original = ui.value;
					},
					stop: function( e, ui ) {
						self.options.input.callback.call(gSelWidget, {'slider': ui.value, original: self.original || ui.value, registerUndo: true}, e.target);
					}
			  });
		},

		prepopulate: function(value) {
			this.slider.slider('value', value || 100);
		},

		validate: function() {
			var self = this;
			var sliderVal = self.slider.slider('option','value');
			var values = {'slider': sliderVal, original: self.original || sliderVal, registerUndo: true};
			return values;
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.textareaInput", $.vd.inputMenu, {

		_buildInput: function() {
			var self = this;
			this._addSubmitBtn(this.options.input);

			this.inputEle = $('<textarea></textarea>')
				.attr('vd-name', this.options.menuName)
				.attr('aria-describedby', '')
				.attr('placeholder', this.options.input.placeholder)
				.attr('title', this.options.input.tooltip)
				.addClass('vd-form-control vd-input-lg')
				.appendTo(this.element);

			this.inputEle.on('keypress',function(e) {
				// on enter
		    if(e.which == 13) {
		      self.inputCallback(e);
		    }
			});
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.borderInput", $.vd.multiInput, {

  	options: {
  		input: {
				buttons: [
					{
						name: '',
						placeholder: ''
					}
				],
				dropdownOptions: [
					{value: 'none', display: 'None'},
					{value: 'solid', display: 'Solid'},
					{value: 'dashed', display: 'Dash'},
					{value: 'dotted', display: 'Dotted'},
					{value: 'double', display: 'Double'},
					{value: 'groove', display: 'Groove'},
					{value: 'ridge', display: 'Ridge'},
					{value: 'inset', display: 'Inset'},
					{value: 'outset', display: 'Outset'},
				]
			}
		},

		defShowValues: {
			'border-top-width': '1px',
			'border-bottom-width': '1px',
			'border-left-width': '1px',
			'border-right-width': '1px',
		},

		_buildInput: function() {
			/*
			<div class="vd-input-menu vd-input-group vd-pull-right">
				<a href="#" type="button" class="vd-menu-btn vd-input-group-addon">
					<span class="vd-icon fa fa-picture-o" aria-hidden="true"></span>
				</a>
				<div class="vd-multi-input vd-input-group">
					<input aria-describedby="" placeholder="Left" class="vd-form-control vd-input-lg vd-input-1">
					<input aria-describedby="" placeholder="Right" class="vd-form-control vd-input-lg vd-input-1">
					<input aria-describedby="" placeholder="Top" class="vd-form-control vd-input-lg vd-input-1">
					<input aria-describedby="" placeholder="Bottom" class="vd-form-control vd-input-lg vd-input-1">
				</div>
			</div>
			*/

			var self = this;
			self._super();

			self.dropdown = $('<select></select>')
				.appendTo(self.element)
				.attr('title', 'Border Style')
				.addClass('vd-form-control vd-input-lg')
				.change(function(e){
				  var value = $(this).val(); //find("option:selected").attr("value");

				  self.options.input.callback.call(gSelWidget, {'border-style': value}, e.target);
				});

			$.each(self.options.input.dropdownOptions, function(index, option) {

				$('<option></option>')
					.appendTo(self.dropdown)
					.attr('value', option.value)
					.text(option.display);
			});

			self.colourBtn = self._createBtn(self.element, {icon: '&#xE22B;', type: 'vd-colour-picker', 'popupText': 'Border colour', classes: 'vd-menu-btn vd-input-group-addon'}, false)
				.on($.vdg.manager('btnBindEvt'), function(e) {
					e.preventDefault();
					e.stopPropagation();

					var btn = $(this);

					self.options.input.callback.call(gSelWidget, {colourPicker: true, btn: btn}, btn);
					console.log('btn click');
				});

			self.slider = $('<div></div>')
				.addClass('vd-slider vd-input-fill')
				.attr('data-type', 'vd-slider')
				.attr('vd-value', 0)
				.appendTo(self.element)
				.slider({
					orientation: 'vertical',
					value: 0,
					min: -300,
					max: 0,
					step: 1,
					slide: function( e, ui ) {
						self.slider.attr('vd-value', -1 * ui.value);
						self.options.input.callback.call(gSelWidget, {'border-radius': self.slider.attr('vd-value')+'px'}, e.target);
					},
					start: function( e, ui ) {
						self.original = (-1 * ui.value) +'px';
					},
					stop: function( e, ui ) {
						self.slider.attr('vd-value', -1 * ui.value);
						self.options.input.callback.call(gSelWidget, {'border-radius': self.slider.attr('vd-value')+'px', original: self.original, registerUndo: true}, e.target);
					}
			  });
		},

		prepopulate: function(values) {
			var self = this;

			// Set default values for border thickness:
			$.each(self.defShowValues, function(key, value) {
				$('input[vd-name="' + key + '"]', self.element).val( value );
			});

			$.each(values, function(key, value) {
				$('input[vd-name="' + key + '"]', self.element).val( value );
			});
		},

		
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.dimensionsInput", $.vd.inputMenu, {

		defaults: {
			input: {
				width: {
					value: 100,
					min: 1,
					max: 2000,
					step: 1,

					selUnit: 'px',
					dropdownOptions: {
						'auto': {value: 'auto', display: 'auto', min: 0,  max: 0, step: 0},
						'px': {value: 'px', display: 'px', min: 1,  max: 2000, step: 1},
						'rem': {value: 'rem', display: 'rem', min: 0.1,  max: 20, step: 0.1},
						'em': {value: 'em', display: 'em', min: 0.1,  max: 20, step: 0.1},
						'%': {value: '%', display: '%', min: 1,  max: 200, step: 1},
					}
				},
				height: {
					value: 100,
					min: 1,
					max: 2000,
					step: 1,

					selUnit: 'px',
					dropdownOptions: {
						'auto': {value: 'auto', display: 'auto', min: 0,  max: 0, step: 0},
						'px': {value: 'px', display: 'px', min: 1,  max: 2000, step: 1},
						'rem': {value: 'rem', display: 'rem', min: 0.1,  max: 20, step: 0.1},
						'em': {value: 'em', display: 'em', min: 0.1,  max: 20, step: 0.1},
						'%': {value: '%', display: '%', min: 1,  max: 200, step: 1},
					}
				},

				// selUnit: 'px',
				// dropdownOptions: {
				// 	'auto': {value: 'auto', display: 'auto', min: 0,  max: 0, step: 0},
				// 	'px': {value: 'px', display: 'px', min: 1,  max: 2000, step: 1},
				// 	'rem': {value: 'rem', display: 'rem', min: 0.1,  max: 20, step: 0.1},
				// 	'em': {value: 'em', display: 'em', min: 0.1,  max: 20, step: 0.1},
				// 	'%': {value: '%', display: '%', min: 1,  max: 200, step: 1},
				// }
			}
		},

		_create: function () {
			// console.log('dim', this.options);
			// console.log('dim def', this.defaults);
			this._super();
			// console.log('dim after', this.options);
		},
		
		_buildInput: function() {
			// console.log('******', this.element);
			// console.log('************boptions', this.options);
			var self = this;

			self.cnt = $('<div></div>')
				.addClass('vd-input-cnt')
				.appendTo(self.element);

			self.widthSlider = $('<div></div>')
				.addClass('vd-slider vd-input-fill')
				.attr('data-type', 'vd-slider')
				.attr('vd-value', self.options.input.width.value)
				.appendTo(self.cnt)
				.slider({
					value: self.options.input.width.value,
					min: self.options.input.width.min,
					max: self.options.input.width.max,
					step: self.options.input.width.step,
					slide: function( e, ui ) {
						
						self.widthSlider.attr('vd-value', ui.value);
						var height = self.widthSlider.attr('vd-height');
						
						self.options.input.callback.call(gSelWidget, {'width': ui.value, 'height': height, 'widthUnits': self.widthDropdown.val(), 'heightUnits': self.heightDropdown.val()}, e.target);
					},
					start: function( e, ui ) {
						self.originalW = ui.value;
					},
					stop: function( e, ui ) {

						self.widthSlider.attr('vd-value', ui.value);
						var height = self.heightSlider.attr('vd-height');
						
						self.options.input.callback.call(gSelWidget, {'width': ui.value, 'height': height, 'widthUnits': self.widthDropdown.val(), 'heightUnits': self.heightDropdown.val(), originalW: self.originalW, originalH: self.originalH, registerUndo: true}, e.target);
					}
			  });

			self.widthDropdown = $('<select></select>')
				.appendTo(self.cnt)
				.addClass('vd-form-control vd-input-lg')
				.change(function(e) {
				  
				  var value = $(this).val(); //.find("option:selected").attr("value");
				  console.log(value, self.options.input.width.dropdownOptions[value]);

				  self.widthSlider.slider('option', {
						//value: self.options.input.value,
						min: self.options.input.width.dropdownOptions[value].min,
						max: self.options.input.width.dropdownOptions[value].max,
						step: self.options.input.width.dropdownOptions[value].step,
				  });

				  self.options.input.callback.call(gSelWidget, {'width': self.widthSlider.attr('vd-value'), 'widthUnits': value, registerUndo: true}, e.target);
				});

			$.each(self.options.input.width.dropdownOptions, function(key, option) {
				$('<option></option>')
					.appendTo(self.widthDropdown)
					.attr('value', option.value)
					.text(option.display);
			});

			self.widthDropdown.val(self.options.input.width.selUnit);

			$('<br/>').appendTo(self.cnt);

			self.heightSlider = $('<div></div>')
				.addClass('vd-slider vd-input-fill')
				.attr('data-type', 'vd-slider')
				.attr('vd-value', self.options.input.height.value)
				.appendTo(self.cnt)
				.slider({
					value: self.options.input.height.value,
					min: self.options.input.height.min,
					max: self.options.input.height.max,
					step: self.options.input.height.step,
					slide: function( e, ui ) {
						
						self.heightSlider.attr('vd-value', ui.value);
						var width = self.widthSlider.attr('vd-value');
						
						self.options.input.callback.call(gSelWidget, {'width': width, 'height': ui.value, 'widthUnits': self.widthDropdown.val(), 'heightUnits': self.heightDropdown.val()}, e.target);
					},
					start: function( e, ui ) {
						self.originalH = ui.value;
					},
					stop: function( e, ui ) {

						self.heightSlider.attr('vd-value', ui.value);
						var width = self.widthSlider.attr('vd-value');
						
						self.options.input.callback.call(gSelWidget, {'width': width, 'height': ui.value, 'widthUnits': self.widthDropdown.val(), 'heightUnits': self.heightDropdown.val(), originalW: self.originalW, originalH: self.originalH, registerUndo: true}, e.target);
					}
			  });

			self.heightDropdown = $('<select></select>')
				.appendTo(self.cnt)
				.addClass('vd-form-control vd-input-lg')
				.change(function(e) {
				  
				  var value = $(this).val(); //.find("option:selected").attr("value");
				  console.log(value, self.options.input.height.dropdownOptions[value]);

				  self.heightSlider.slider('option', {
						//value: self.options.input.value,
						min: self.options.input.height.dropdownOptions[value].min,
						max: self.options.input.height.dropdownOptions[value].max,
						step: self.options.input.height.dropdownOptions[value].step,
				  });

				  self.options.input.callback.call(gSelWidget, {'height': self.heightSlider.attr('vd-value'), 'heightUnits': value, registerUndo: true}, e.target);
				});

			$.each(self.options.input.height.dropdownOptions, function(key, option) {
				$('<option></option>')
					.appendTo(self.heightDropdown)
					.attr('value', option.value)
					.text(option.display);
			});

			self.heightDropdown.val('auto');
		},

		prepopulate: function(values) {
			if (!values || !values.width || !values.height)
				return;

			this.widthSlider.slider('value', values.width);
			this.heightSlider.slider('value', values.height);
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.dropdownInput", $.vd.inputMenu, {

		options: {
			input: {
				dropdownOptions: [
					{value: 'foo', display: 'Foo'}
				]
			}
		},
		
		_buildInput: function() {
			var self = this;

			self._addSubmitBtn(self.options.input);

			self.inputEle = $('<select></select>')
				.appendTo(self.element)
				.attr('placeholder', this.options.input.placeholder)
				.attr('title', this.options.input.tooltip)
				.addClass('vd-form-control vd-input-lg')
				.change(function(e){
				  var value = $(this).val();
				  var options = self.options.input.dropdownOptions[this.selectedIndex];
				  var data = options.data || {};
				  self.options.input.callback.call(gSelWidget, value, e.target, data, self);
				});

			this.setDropdownOptions();
		},

		prepopulate: function(value) {
			this.inputEle.val(value);
		},

		setDropdownOptions: function(dropdownOptions) {
			var self = this;

			if (dropdownOptions)
				this.options.input.dropdownOptions = dropdownOptions;

			$('option', self.inputEle).remove();

			$.each(self.options.input.dropdownOptions, function(index, option) {
				$('<option></option>')
					.appendTo(self.inputEle)
					.attr('value', option.value)
					.attr('template', option.template)
					.text(option.display);
			});
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.fontFamilyInput", $.vd.dropdownInput, {
		
		_buildInput: function() {
			this._super();

			$('option', this.inputEle).each(function() {
				var font = $(this).attr('value');
				$(this).css('font-family', font);
			});
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.fontSizeInput", $.vd.inputMenu, {

		options: {
			input: {
				selUnit: 'px',
				dropdownOptions: {
					'px': {value: 'px', display: 'px', min: 1,  max: 150, step: 1},
					'rem': {value: 'rem', display: 'rem', min: 0.1,  max: 20, step: 0.1},
					'em': {value: 'em', display: 'em', min: 0.1,  max: 20, step: 0.1},
					'%': {value: '%', display: '%', min: 1,  max: 200, step: 1},
				}
			}
		},
		
		_buildInput: function() {
			var self = this;

			self.slider = $('<div></div>')
				.addClass('vd-slider vd-input-fill')
				.attr('data-type', 'vd-slider')
				.attr('vd-value', self.options.value)
				.appendTo(self.element)
				.slider({
					value: self.options.input.dropdownOptions[self.options.input.selUnit].min,
					min: self.options.input.dropdownOptions[self.options.input.selUnit].min,
					max: self.options.input.dropdownOptions[self.options.input.selUnit].max,
					step: self.options.input.dropdownOptions[self.options.input.selUnit].step,
					slide: function( e, ui ) {
						
						self.slider.attr('vd-value', ui.value);
						var value = self.dropdown.val(); //.find("option:selected").attr("value");
						
						self.options.input.callback.call(gSelWidget, {'size': self.slider.attr('vd-value'), 'units': value, 'selection': self.selection}, e.target);
					},
					start: function( e, ui ) {
						self.original = ui.value + self.dropdown.val();  //.find("option:selected").attr("value");
					},
					stop: function( e, ui ) {
						
						self.slider.attr('vd-value', ui.value);
						var value = self.dropdown.val();  //.find("option:selected").attr("value");
						
						self.options.input.callback.call(gSelWidget, {'size': self.slider.attr('vd-value'), 'units': value, original: self.original, 'selection': self.selection, registerUndo: true}, e.target);
					}
			  });

			// var innerContainer = $('<div></div>')
			// 	.appendTo(self.container)
			// 	.addClass('vd-form-group');

			self.dropdown = $('<select></select>')
				.appendTo(self.element)
				.addClass('vd-form-control vd-input-lg')
				.change(function(e) {
				  
				  var value = $(this).val(); //.find("option:selected").attr("value");
				  console.log(value, self.options.input.dropdownOptions[value]);

				  self.slider.slider('option', {
						//value: self.options.value,
						min: self.options.input.dropdownOptions[value].min,
						max: self.options.input.dropdownOptions[value].max,
						step: self.options.input.dropdownOptions[value].step,
				  });

				  self.options.input.callback.call(gSelWidget, {'size': self.slider.attr('vd-value'), 'units': value, registerUndo: true}, e.target);
				});

			$.each(self.options.input.dropdownOptions, function(key, option) {
				$('<option></option>')
					.appendTo(self.dropdown)
					.attr('value', option.value)
					.text(option.display);
			});

			self.dropdown.val(self.options.input.selUnit);
		},

		prepopulate: function(values) {
			this.selection = values.selection || false;

			if (!values || !values.units || values.units.length <=  0)
				return;

			this.dropdown.val(values.units);
		},

		validate: function(e) {
			return {};
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.gradientInput", $.vd.inputMenu, {
		
		initInput: function() {

			this._super();

			// ...
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.linkInput", $.vd.inputMenu, {

		options: {
			show: function() {
				if (gSelWidget.isDynamic() && gSelWidget.element.find('vdwp[a="href"]'))
					this.inputEle.val('DYNAMIC').attr('disabled', '');
			},
			hide: function() {
				this.inputEle.val('').removeAttr('disabled');
			},
			menuBtns: {
				'_self': {
					index: 1,
					icon: '&#xE89D;',
					popupText: 'Open link in same page',
					callback: function(values, target) {
						if (gSelWidget)
							gSelWidget.onAnchorChange({target: '_self', link: '^PRESERVE^'}, target);
					},
				},
				'_blank': {
					index: 2,
					icon: '&#xE89E;',
					popupText: 'Open link in new page',
					callback: function(values, target) {
						if (gSelWidget)
							gSelWidget.onAnchorChange({target: '_blank', link: '^PRESERVE^'}, target);
					},
				},
				"hoverStyle": {
					index: 3,
					icon: "hdr_strong", 
					popupText: 'Hover Styling',
					show: function() {
						console.log('t', this.element.vdPolymorphic('option', 'parent'));
						this.element.vdPolymorphic('option', 'parent').onShowStyleMenu(':hover');
					},
					hide: function(ev, toMenu) {
						if (toMenu.element.attr('vd-menu') == 'link')
							this.element.vdPolymorphic('option', 'parent').resetStyleIdentifier();
					},
				},
				"visitedStyle": {
					index: 4,
					icon: "hdr_weak",
					popupText: 'Visited Styling',
					show: function() {
						this.element.vdPolymorphic('option', 'parent').onShowStyleMenu(':visited');
					},
					hide: function(ev, toMenu) {
						if (toMenu.element.attr('vd-menu') == 'link')
							this.element.vdPolymorphic('option', 'parent').resetStyleIdentifier();
					},
				},
				"activeStyle": {
					index: 5,
					icon: "filter_tilt_shift",
					popupText: 'Active Styling',
					show: function() {
						this.element.vdPolymorphic('option', 'parent').onShowStyleMenu(':active');
					},
					hide: function(ev, toMenu) {
						if (toMenu.element.attr('vd-menu') == 'link')
							this.element.vdPolymorphic('option', 'parent').resetStyleIdentifier();
					},
				},
			}
		},

		// targetEle: null,

		_create: function () {
			if (!$.vd.linkInput.prototype.classInitialised) {
				var self = this;
				var frameworkBaseCustomisations = this.getFramework().vdPolymorphic('option', 'baseWidget');
				var frameworkBaseStyle = (frameworkBaseCustomisations && frameworkBaseCustomisations.menuBtns && frameworkBaseCustomisations.menuBtns.style) ? frameworkBaseCustomisations.menuBtns.style : {};
				$.vd.linkInput.prototype.options.menuBtns.hoverStyle = $.extend(true, {}, $.vdw.baseWidget.prototype.defaults.menuBtns.style, frameworkBaseStyle, this.options.menuBtns.hoverStyle);
				$.vd.linkInput.prototype.options.menuBtns.visitedStyle = $.extend(true, {}, $.vdw.baseWidget.prototype.defaults.menuBtns.style, frameworkBaseStyle, this.options.menuBtns.visitedStyle);
				$.vd.linkInput.prototype.options.menuBtns.activeStyle = $.extend(true, {}, $.vdw.baseWidget.prototype.defaults.menuBtns.style, frameworkBaseStyle, this.options.menuBtns.activeStyle);
				$.vd.linkInput.prototype.classInitialised = true;

				this.getFramework().trigger('vdOnInitLinkInputMenu', {menu: self});
			}

			this._super();
		},

		prepopulate: function(values) {
			this._super(values);
			// this.selection = values.selection || false;
			this.inputEle.val(values.href);

			$('.vd-menu-btn', this.element).removeClass('vd-selected');
			$('.vd-menu-btn[vd-name="' + values.target + '"]', this.element).addClass('vd-selected');
		},

		onShowStyleMenu: function(attrib) {
			var self = this;
			// var eleId = gSelWidget.element.attr('vd-style-identifier') || '#'+gSelWidget.element.attr('id');
			var targetId = (gSelWidget.target) ? gSelWidget.target.attr('vd-style-identifier') || '#'+gSelWidget.target.attr('id') : null;

			// if (eleId.indexOf(attrib) === -1) {
			// 	// self.targetEle = ele;
			// 	self.element.attr('vd-w-eid', eleId);
			// 	gSelWidget.element.attr('vd-style-identifier', eleId+attrib);
			// }
			if (targetId && targetId.indexOf(attrib) === -1) {
				self.element.attr('vd-w-tid', targetId);
				gSelWidget.target.attr('vd-style-identifier', targetId+attrib);
			}

			gSelWidget.element.on('vdDeselect', function(ev) {
				self.resetStyleIdentifier();
			});
		},

		resetStyleIdentifier: function() {
			// gSelWidget.element.attr('vd-style-identifier', this.element.attr('vd-w-eid'));

			if (gSelWidget.target)
				gSelWidget.target.attr('vd-style-identifier', this.element.attr('vd-w-tid'));
		}

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vd.repeaterInput", $.vd.dropdownInput, {

  	options: {
  		input: {
				// buttons: [
				// 	{
				// 		name: '',
				// 		placeholder: ''
				// 	}
				// ],
				dropdownOptions: [
					{value: '', display: 'None', template: 'vd-template'},
					{value: '11', display: 'Post Exerpt Template', template: 'vd-template'},
				]
			}
		},

		// defShowValues: {
		// 	'border-top-width': '1px',
		// 	'border-bottom-width': '1px',
		// 	'border-left-width': '1px',
		// 	'border-right-width': '1px',
		// },

		_buildInput: function() {
			var self = this;
			self._super();

			self.slider = $('<div></div>')
				.addClass('vd-slider vd-input-fill')
				.attr('data-type', 'vd-slider')
				.attr('vd-value', 0)
				.appendTo(self.element)
				.slider({
					orientation: 'vertical',
					value: 0,
					min: -50,
					max: 0,
					step: 1,
					slide: function( e, ui ) {
						self.slider.attr('vd-value', -1 * ui.value);
						self.options.input.callback.call(gSelWidget, {'repeat': self.slider.attr('vd-value')}, e.target);
					},
					start: function( e, ui ) {
						self.original = (-1 * ui.value);
					},
					stop: function( e, ui ) {
						self.slider.attr('vd-value', -1 * ui.value);
						self.options.input.callback.call(gSelWidget, {'repeat': self.slider.attr('vd-value'), original: self.original, registerUndo: true}, e.target);
					}
			  });
		},

		// prepopulate: function(values) {
			// var self = this;

			// // Set default values for border thickness:
			// $.each(self.defShowValues, function(key, value) {
			// 	$('input[vd-name="' + key + '"]', self.element).val( value );
			// });

			// $.each(values, function(key, value) {
			// 	$('input[vd-name="' + key + '"]', self.element).val( value );
			// });
		// },
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.selectorInput", $.vd.inputMenu, {

  	options: {
  		input: {
  			icons: [
					"57934;","57934","&#xE24E;","&#xE24E;","&#xE24E;","&#xE24E;","&#xE24E;","&#xE24E;","&#xE24E;","&#xE24E;"
				],
				// Material icons
				// iconLibrary: 'material',
				// ignoreList: [],
		  	// buildData: function(ignoreList) {
				// 	// var values = Array.from({length: 58200-57300},(v,k)=>57300+k);
				// 	return Array.from({ length: 0xE358 - 0xDFD4 }, (v, k) => 0xDFD4 + k);
				// },
				// buildIconCallback: function(value) {
				// 	var iconId = '&#x' + value.toString(16) + ';';
				// 	return {
				// 		icon: $('<a href=""><i class="vd-icon material-icons" aria-hidden="true">'+ iconId +'</i></a>')
				// 		.attr('value', iconId),
				// 		value: iconId
				// 	};
				// }

				// Font awesome icons
				iconLibrary: 'fa',
				ignoreList: [ ] ,
				proIcons: {
					
				},
		  	buildData: function(ignoreList) {
					var classes = ["fa-bars", "fa-circle", "fa-sign-in-alt", "fa-sign-out-alt", "fa-search", "fa-search-dollar", "fa-search-location", "fa-search-minus", "fa-search-plus", "fa-align-center", "fa-align-justify", "fa-align-left", "fa-align-right", "fa-angle-double-down", "fa-angle-double-left", "fa-angle-double-right", "fa-angle-double-up", "fa-angle-down", "fa-angle-left", "fa-angle-right", "fa-angle-up", "fa-registered", "fa-arrow-alt-circle-down", "fa-arrow-alt-circle-left", "fa-arrow-alt-circle-right", "fa-arrow-alt-circle-up", "fa-arrow-circle-down", "fa-arrow-circle-left", "fa-arrow-circle-right", "fa-arrow-circle-up", "fa-arrow-down", "fa-arrow-left", "fa-arrow-right", "fa-arrow-up", "fa-arrows-alt", "fa-arrows-alt-h", "fa-arrows-alt-v", "fa-cart-arrow-down", "fa-long-arrow-alt-down", "fa-long-arrow-alt-left", "fa-long-arrow-alt-right", "fa-long-arrow-alt-up", "fa-caret-down", "fa-caret-left", "fa-caret-right", "fa-caret-square-down", "fa-caret-square-left", "fa-caret-square-right", "fa-caret-square-up", "fa-caret-up", "fa-chevron-circle-down", "fa-chevron-circle-left", "fa-chevron-circle-right", "fa-chevron-circle-up", "fa-chevron-down", "fa-chevron-left", "fa-chevron-right", "fa-chevron-up", "fa-paste", "fa-copy", "fa-copyright", "fa-user", "fa-user-alt", "fa-user-alt-slash", "fa-user-astronaut", "fa-user-check", "fa-user-circle", "fa-user-clock", "fa-user-cog", "fa-user-edit", "fa-user-friends", "fa-user-graduate", "fa-user-injured", "fa-user-lock", "fa-user-md", "fa-user-minus", "fa-user-ninja", "fa-user-nurse", "fa-user-plus", "fa-user-secret", "fa-user-shield", "fa-user-slash", "fa-user-tag", "fa-user-tie", "fa-user-times", "fa-users", "fa-users-cog", "fa-ad", "fa-address-book", "fa-address-card", "fa-adjust", "fa-air-freshener", "fa-allergies", "fa-ambulance", "fa-american-sign-language-interpreting", "fa-anchor", "fa-angry", "fa-ankh", "fa-apple-alt", "fa-archive", "fa-archway", "fa-assistive-listening-systems", "fa-asterisk", "fa-at", "fa-atlas", "fa-atom", "fa-audio-description", "fa-award", "fa-baby", "fa-baby-carriage", "fa-backspace", "fa-backward", "fa-bacon", "fa-bahai", "fa-balance-scale", "fa-balance-scale-left", "fa-balance-scale-right", "fa-ban", "fa-band-aid", "fa-barcode", "fa-baseball-ball", "fa-basketball-ball", "fa-bath", "fa-battery-empty", "fa-battery-full", "fa-battery-half", "fa-battery-quarter", "fa-battery-three-quarters", "fa-bed", "fa-beer", "fa-bell", "fa-bell-slash", "fa-bezier-curve", "fa-bible", "fa-bicycle", "fa-biking", "fa-binoculars", "fa-biohazard", "fa-birthday-cake", "fa-blender", "fa-blender-phone", "fa-blind", "fa-blog", "fa-bold", "fa-bolt", "fa-bomb", "fa-bone", "fa-bong", "fa-book", "fa-book-dead", "fa-book-medical", "fa-book-open", "fa-book-reader", "fa-bookmark", "fa-border-all", "fa-border-none", "fa-border-style", "fa-bowling-ball", "fa-box", "fa-box-open", "fa-boxes", "fa-braille", "fa-brain", "fa-bread-slice", "fa-briefcase", "fa-briefcase-medical", "fa-broadcast-tower", "fa-broom", "fa-brush", "fa-bug", "fa-building", "fa-bullhorn", "fa-bullseye", "fa-burn", "fa-bus", "fa-bus-alt", "fa-business-time", "fa-calculator", "fa-calendar", "fa-calendar-alt", "fa-calendar-check", "fa-calendar-day", "fa-calendar-minus", "fa-calendar-plus", "fa-calendar-times", "fa-calendar-week", "fa-camera", "fa-camera-retro", "fa-campground", "fa-candy-cane", "fa-cannabis", "fa-capsules", "fa-car", "fa-car-alt", "fa-car-battery", "fa-car-crash", "fa-car-side", "fa-caravan", "fa-carrot", "fa-cart-plus", "fa-cash-register", "fa-cat", "fa-certificate", "fa-chair", "fa-chalkboard", "fa-chalkboard-teacher", "fa-charging-station", "fa-chart-area", "fa-chart-bar", "fa-chart-line", "fa-chart-pie", "fa-check", "fa-check-circle", "fa-check-double", "fa-check-square", "fa-cheese", "fa-chess", "fa-chess-bishop", "fa-chess-board", "fa-chess-king", "fa-chess-knight", "fa-chess-pawn",  "fa-hamburger", "fa-chess-queen", "fa-chess-rook", "fa-sign", "fa-child", "fa-church", "fa-circle-notch", "fa-city", "fa-clinic-medical", "fa-clipboard", "fa-clipboard-check", "fa-clipboard-list", "fa-clock", "fa-clone", "fa-closed-captioning", "fa-cloud", "fa-cloud-download-alt", "fa-cloud-meatball", "fa-cloud-moon", "fa-cloud-moon-rain", "fa-cloud-rain", "fa-cloud-showers-heavy", "fa-cloud-sun", "fa-cloud-sun-rain", "fa-cloud-upload-alt", "fa-cocktail", "fa-code", "fa-code-branch", "fa-coffee", "fa-cog", "fa-cogs", "fa-coins", "fa-columns", "fa-comment", "fa-comment-alt", "fa-comment-dollar", "fa-comment-dots", "fa-comment-medical", "fa-comment-slash", "fa-comments", "fa-comments-dollar", "fa-compact-disc", "fa-compass", "fa-compress", "fa-compress-alt", "fa-compress-arrows-alt", "fa-concierge-bell", "fa-cookie", "fa-cookie-bite", "fa-couch", "fa-credit-card", "fa-crop", "fa-crop-alt", "fa-cross", "fa-crosshairs", "fa-crow", "fa-crown", "fa-crutch", "fa-cube", "fa-cubes", "fa-cut", "fa-dailymotion", "fa-database", "fa-deaf", "fa-democrat", "fa-desktop", "fa-dharmachakra", "fa-diagnoses", "fa-dice", "fa-dice-d20", "fa-dice-d6", "fa-dice-five", "fa-dice-four", "fa-dice-one", "fa-dice-six", "fa-dice-three", "fa-dice-two", "fa-digital-tachograph", "fa-directions", "fa-divide", "fa-dizzy", "fa-dna", "fa-dog", "fa-dollar-sign", "fa-dolly", "fa-dolly-flatbed", "fa-donate", "fa-door-closed", "fa-door-open", "fa-dot-circle", "fa-dove", "fa-download", "fa-drafting-compass", "fa-dragon", "fa-draw-polygon", "fa-drum", "fa-drum-steelpan", "fa-drumstick-bite", "fa-dumbbell", "fa-dumpster", "fa-dumpster-fire", "fa-dungeon", "fa-edit", "fa-egg", "fa-eject", "fa-ellipsis-h", "fa-ellipsis-v", "fa-envelope", "fa-envelope-open", "fa-envelope-open-text", "fa-envelope-square", "fa-equals", "fa-eraser", "fa-ethernet", "fa-euro-sign", "fa-exchange-alt", "fa-exclamation", "fa-exclamation-circle", "fa-exclamation-triangle", "fa-expand", "fa-expand-alt", "fa-expand-arrows-alt", "fa-external-link-alt", "fa-external-link-square-alt", "fa-eye", "fa-eye-dropper", "fa-eye-slash", "fa-fan", "fa-fast-backward", "fa-fast-forward", "fa-fax", "fa-feather", "fa-feather-alt", "fa-female", "fa-fighter-jet", "fa-file", "fa-file-alt", "fa-file-archive", "fa-file-audio", "fa-file-code", "fa-file-contract", "fa-file-csv", "fa-file-download", "fa-file-excel", "fa-file-export", "fa-file-image", "fa-file-import", "fa-file-invoice", "fa-file-invoice-dollar", "fa-file-medical", "fa-file-medical-alt", "fa-file-pdf", "fa-file-powerpoint", "fa-file-prescription", "fa-file-signature", "fa-file-upload", "fa-file-video", "fa-file-word", "fa-fill", "fa-fill-drip", "fa-film", "fa-filter", "fa-fingerprint", "fa-fire", "fa-fire-alt", "fa-fire-extinguisher", "fa-firefox-browser", "fa-first-aid", "fa-fish", "fa-fist-raised", "fa-flag", "fa-flag-checkered", "fa-flag-usa", "fa-flask", "fa-flushed", "fa-folder", "fa-folder-minus", "fa-folder-open", "fa-folder-plus", "fa-font", "fa-football-ball", "fa-forward", "fa-frog", "fa-frown", "fa-frown-open", "fa-funnel-dollar", "fa-futbol", "fa-gamepad", "fa-gas-pump", "fa-gavel", "fa-gem", "fa-genderless", "fa-ghost", "fa-gift", "fa-gifts", "fa-glass-cheers", "fa-glass-martini", "fa-glass-martini-alt", "fa-glass-whiskey", "fa-glasses", "fa-globe", "fa-globe-africa", "fa-globe-americas", "fa-globe-asia", "fa-globe-europe", "fa-golf-ball", "fa-gopuram", "fa-graduation-cap", "fa-greater-than", "fa-greater-than-equal", "fa-grimace", "fa-grin", "fa-grin-alt", "fa-grin-beam", "fa-grin-beam-sweat", "fa-grin-hearts", "fa-grin-squint", "fa-grin-squint-tears", "fa-grin-stars", "fa-grin-tears", "fa-grin-tongue", "fa-grin-tongue-squint", "fa-grin-tongue-wink", "fa-grin-wink", "fa-grip-horizontal", "fa-grip-lines", "fa-grip-lines-vertical", "fa-grip-vertical", "fa-guitar", "fa-h-square", "fa-hammer", "fa-hamsa", "fa-hand-holding", "fa-hand-holding-heart", "fa-hand-holding-usd", "fa-hand-lizard", "fa-hand-middle-finger", "fa-hand-paper", "fa-hand-peace", "fa-hand-point-down", "fa-hand-point-left", "fa-hand-point-right", "fa-hand-point-up", "fa-hand-pointer", "fa-hand-rock", "fa-hand-scissors", "fa-hand-spock", "fa-hands", "fa-hands-helping", "fa-handshake", "fa-hanukiah", "fa-hard-hat", "fa-hashtag", "fa-hat-cowboy", "fa-hat-cowboy-side", "fa-hat-wizard", "fa-hdd", "fa-heading", "fa-headphones", "fa-headphones-alt", "fa-headset", "fa-heart", "fa-heart-broken", "fa-heartbeat", "fa-helicopter", "fa-highlighter", "fa-hiking", "fa-hippo", "fa-history", "fa-hockey-puck", "fa-holly-berry", "fa-home", "fa-horse", "fa-horse-head", "fa-hospital", "fa-hospital-alt", "fa-hospital-symbol", "fa-hot-tub", "fa-hotdog", "fa-hotel", "fa-hourglass", "fa-hourglass-end", "fa-hourglass-half", "fa-hourglass-start", "fa-house-damage", "fa-hryvnia", "fa-i-cursor", "fa-ice-cream", "fa-icicles", "fa-icons", "fa-id-badge", "fa-id-card", "fa-id-card-alt", "fa-ideal", "fa-igloo", "fa-image", "fa-images", "fa-inbox", "fa-indent", "fa-industry", "fa-infinity", "fa-info", "fa-info-circle", "fa-instagram-square", "fa-italic", "fa-jedi", "fa-joint", "fa-kaaba", "fa-key", "fa-keyboard", "fa-khanda", "fa-kiss", "fa-kiss-beam", "fa-kiss-wink-heart", "fa-kiwi-bird", "fa-landmark", "fa-language", "fa-laptop", "fa-laptop-code", "fa-laptop-medical", "fa-laugh", "fa-laugh-beam", "fa-laugh-squint", "fa-laugh-wink", "fa-layer-group", "fa-leaf", "fa-lemon", "fa-less-than", "fa-less-than-equal", "fa-level-down-alt", "fa-level-up-alt", "fa-life-ring", "fa-lightbulb", "fa-link", "fa-lira-sign", "fa-list", "fa-list-alt", "fa-list-ol", "fa-list-ul", "fa-location-arrow", "fa-lock", "fa-lock-open", "fa-low-vision", "fa-luggage-cart", "fa-magic", "fa-magnet", "fa-mail-bulk", "fa-male", "fa-map", "fa-map-marked", "fa-map-marked-alt", "fa-map-marker", "fa-map-marker-alt", "fa-map-pin", "fa-map-signs", "fa-marker", "fa-mars", "fa-mars-double", "fa-mars-stroke", "fa-mars-stroke-h", "fa-mars-stroke-v", "fa-mask", "fa-medal", "fa-medkit", "fa-meh", "fa-meh-blank", "fa-meh-rolling-eyes", "fa-memory", "fa-menorah", "fa-mercury", "fa-meteor", "fa-microblog", "fa-microchip", "fa-microphone", "fa-microphone-alt", "fa-microphone-alt-slash", "fa-microphone-slash", "fa-microscope", "fa-minus", "fa-minus-circle", "fa-minus-square", "fa-mitten", "fa-mixer", "fa-mobile", "fa-mobile-alt", "fa-money-bill", "fa-money-bill-alt", "fa-money-bill-wave", "fa-money-bill-wave-alt", "fa-money-check", "fa-money-check-alt", "fa-monument", "fa-moon", "fa-mortar-pestle", "fa-mosque", "fa-motorcycle", "fa-mountain", "fa-mouse", "fa-mouse-pointer", "fa-mug-hot", "fa-music", "fa-network-wired", "fa-neuter", "fa-newspaper", "fa-not-equal", "fa-notes-medical", "fa-object-group", "fa-object-ungroup", "fa-oil-can", "fa-om", "fa-otter", "fa-outdent", "fa-pager", "fa-paint-brush", "fa-paint-roller", "fa-palette", "fa-pallet", "fa-paper-plane", "fa-paperclip", "fa-parachute-box", "fa-paragraph", "fa-parking", "fa-passport", "fa-pastafarianism", "fa-pause", "fa-pause-circle", "fa-paw", "fa-peace", "fa-pen", "fa-pen-alt", "fa-pen-fancy", "fa-pen-nib", "fa-pen-square", "fa-pencil-alt", "fa-pencil-ruler", "fa-people-carry", "fa-pepper-hot", "fa-percent", "fa-percentage", "fa-person-booth", "fa-phone", "fa-phone-alt", "fa-phone-slash", "fa-phone-square", "fa-phone-square-alt", "fa-phone-volume", "fa-photo-video", "fa-pied-piper-square", "fa-piggy-bank", "fa-pills", "fa-pizza-slice", "fa-place-of-worship", "fa-plane", "fa-plane-arrival", "fa-plane-departure", "fa-play", "fa-play-circle", "fa-plug", "fa-plus", "fa-plus-circle", "fa-plus-square", "fa-podcast", "fa-poll", "fa-poll-h", "fa-poo", "fa-poo-storm", "fa-poop", "fa-portrait", "fa-pound-sign", "fa-power-off", "fa-pray", "fa-praying-hands", "fa-prescription", "fa-prescription-bottle", "fa-prescription-bottle-alt", "fa-print", "fa-procedures", "fa-project-diagram", "fa-puzzle-piece", "fa-qrcode", "fa-question", "fa-question-circle", "fa-quidditch", "fa-quote-left", "fa-quote-right", "fa-quran", "fa-radiation", "fa-radiation-alt", "fa-rainbow", "fa-random", "fa-receipt", "fa-record-vinyl", "fa-recycle", "fa-redo", "fa-redo-alt", "fa-remove-format", "fa-reply", "fa-reply-all", "fa-republican", "fa-restroom", "fa-retweet", "fa-ribbon", "fa-ring", "fa-road", "fa-robot", "fa-rocket", "fa-route", "fa-rss", "fa-rss-square", "fa-ruble-sign", "fa-ruler", "fa-ruler-combined", "fa-ruler-horizontal", "fa-ruler-vertical", "fa-running", "fa-rupee-sign", "fa-sad-cry", "fa-sad-tear", "fa-satellite", "fa-satellite-dish", "fa-save", "fa-school", "fa-screwdriver", "fa-scroll", "fa-sd-card", "fa-seedling", "fa-server", "fa-shapes", "fa-share", "fa-share-alt", "fa-share-alt-square", "fa-share-square", "fa-shekel-sign", "fa-shield-alt", "fa-ship", "fa-shipping-fast", "fa-shoe-prints", "fa-shopify", "fa-shopping-bag", "fa-shopping-basket", "fa-shopping-cart", "fa-shower", "fa-shuttle-van", "fa-sign-language", "fa-signal", "fa-signature", "fa-sim-card", "fa-sitemap", "fa-skating", "fa-skiing", "fa-skiing-nordic", "fa-skull", "fa-skull-crossbones", "fa-slash", "fa-sleigh", "fa-sliders-h", "fa-smile", "fa-smile-beam", "fa-smile-wink", "fa-smog", "fa-smoking", "fa-smoking-ban", "fa-sms", "fa-snowboarding", "fa-snowflake", "fa-snowman", "fa-snowplow", "fa-socks", "fa-solar-panel", "fa-sort", "fa-sort-alpha-down", "fa-sort-alpha-down-alt", "fa-sort-alpha-up", "fa-sort-alpha-up-alt", "fa-sort-amount-down", "fa-sort-amount-down-alt", "fa-sort-amount-up", "fa-sort-amount-up-alt", "fa-sort-down", "fa-sort-numeric-down", "fa-sort-numeric-down-alt", "fa-sort-numeric-up", "fa-sort-numeric-up-alt", "fa-sort-up", "fa-spa", "fa-space-shuttle", "fa-spell-check", "fa-spider", "fa-spinner", "fa-splotch", "fa-spray-can", "fa-square", "fa-square-full", "fa-square-root-alt", "fa-stamp", "fa-star", "fa-star-and-crescent", "fa-star-half", "fa-star-half-alt", "fa-star-of-david", "fa-star-of-life", "fa-step-backward", "fa-step-forward", "fa-stethoscope", "fa-sticky-note", "fa-stop", "fa-stop-circle", "fa-stopwatch", "fa-store", "fa-store-alt", "fa-stream", "fa-street-view", "fa-strikethrough", "fa-stroopwafel", "fa-subscript", "fa-subway", "fa-suitcase", "fa-suitcase-rolling", "fa-sun", "fa-superscript", "fa-surprise", "fa-swatchbook", "fa-swimmer", "fa-swimming-pool", "fa-synagogue", "fa-sync", "fa-sync-alt", "fa-syringe", "fa-table", "fa-table-tennis", "fa-tablet", "fa-tablet-alt", "fa-tablets", "fa-tachometer-alt", "fa-tag", "fa-tags", "fa-tape", "fa-tasks", "fa-taxi", "fa-teeth", "fa-teeth-open", "fa-temperature-high", "fa-temperature-low", "fa-tenge", "fa-terminal", "fa-text-height", "fa-text-width", "fa-th", "fa-th-large", "fa-th-list", "fa-theater-masks", "fa-thermometer", "fa-thermometer-empty", "fa-thermometer-full", "fa-thermometer-half", "fa-thermometer-quarter", "fa-thermometer-three-quarters", "fa-thumbs-down", "fa-thumbs-up", "fa-thumbtack", "fa-ticket-alt", "fa-times", "fa-times-circle", "fa-tint", "fa-tint-slash", "fa-tired", "fa-toggle-off", "fa-toggle-on", "fa-toilet", "fa-toilet-paper", "fa-toolbox", "fa-tools", "fa-tooth", "fa-torah", "fa-torii-gate", "fa-tractor", "fa-trademark", "fa-traffic-light", "fa-trailer", "fa-train", "fa-tram", "fa-transgender", "fa-transgender-alt", "fa-trash", "fa-trash-alt", "fa-trash-restore", "fa-trash-restore-alt", "fa-tree", "fa-trophy", "fa-truck", "fa-truck-loading", "fa-truck-monster", "fa-truck-moving", "fa-truck-pickup", "fa-tshirt", "fa-tty", "fa-tv", "fa-umbrella", "fa-umbrella-beach", "fa-underline", "fa-undo", "fa-undo-alt", "fa-unity", "fa-universal-access", "fa-university", "fa-unlink", "fa-unlock", "fa-unlock-alt", "fa-upload", "fa-utensil-spoon", "fa-utensils", "fa-vector-square", "fa-venus", "fa-venus-double", "fa-venus-mars", "fa-vial", "fa-vials", "fa-video", "fa-video-slash", "fa-vihara", "fa-voicemail", "fa-volleyball-ball", "fa-volume-down", "fa-volume-mute", "fa-volume-off", "fa-volume-up", "fa-vote-yea", "fa-vr-cardboard", "fa-walking", "fa-wallet", "fa-warehouse", "fa-water", "fa-wave-square", "fa-weight", "fa-weight-hanging", "fa-wheelchair", "fa-wifi", "fa-wind", "fa-window-close", "fa-window-maximize", "fa-window-minimize", "fa-window-restore", "fa-wine-bottle", "fa-wine-glass", "fa-wine-glass-alt", "fa-won-sign", "fa-wrench", "fa-x-ray", "fa-yen-sign", "fa-yin-yang"];
					return $(classes).filter(function(i,v) {return ignoreList.indexOf(v) == -1;});
				},
				buildIconCallback: function(value, widget) {
					return {
						icon: $('<a href=""><i class="vd-icon fas ' + value + '" aria-hidden="true"></i></a>'),
						value: value
					};
				}
			}
		},
		
		_create: function () {
			this._super();
			this.element.addClass('vd-selector-menu');
		},

		_buildInput: function() {
			var self = this;
			// console.log('self.options.input.proIcons', self.options.input.proIcons);

			self.selectorList = $('<div></div>')
				.addClass('vd-selector')
				.appendTo(self.element);
					
			var values = self.options.input.buildData(self.options.input.ignoreList);
			$.each(values, function(i, value) {
				var data = self.options.input.buildIconCallback(value, self);
				data.icon
					.addClass('vd-selector-item')
					.appendTo(self.selectorList);
					// .contextmenu(function() {
					// 	console.log(self.options.input.ignoreList);
					// })
					
				// Check if its a pro icon
				if (self.options.input.proIcons[value]) {
					data.icon
						.addClass('vd-pro')
						.on($.vdg.manager('btnBindEvt'), function(e) {
							e.preventDefault();
							e.stopPropagation();
						});
				}
				else {
					data.icon.on($.vdg.manager('btnBindEvt'), function(e) {
						e.preventDefault();
						e.stopPropagation();

						self.options.input.ignoreList.push ( data.value );

						self.options.input.callback.call(gSelWidget, {iconLibrary: self.options.input.iconLibrary, value: data.value}, $(this));
					});
				}
				// if (buttonOpts.placeholder)
				// 	input.attr('placeholder', buttonOpts.placeholder);
				// if (buttonOpts.tooltip)
				// 	input.attr('title', buttonOpts.tooltip);
				// if (buttonOpts.dblClick)
				// 	input.dblclick(function() {
				// 		$(buttonOpts.dblClick, self.element).val( $(this).val() );
			});
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
(function ($) {

  $.widget( "vd.shadowInput", $.vd.inputMenu, {
		
		initInput: function() {

			this._super();

			// ...
			// 3 sliders for horz-shadow-dir, vert-shadow-dir, blur
			// colour picker for shadow colour
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

//;(function ( $, window, document, undefined ) {
 (function ($) {

	$.widget( "vd.bootstrapTwitterFramework", $.vd.baseFramework, {

		options: {
			maxColumns: 12,

			widgetTypes: {
				'vd-card-widget': 'cardWidget',
				'vd-ghost-btn-widget': 'ghostBtnWidget',
				'vd-headline-widget': 'headlineWidget',
				'vd-hero-img-widget': 'heroImgWidget',
				'vd-list-widget': 'inlineListWidget',
				'vd-map-widget': 'mapWidget',
				'vd-masonry-widget': 'masonryWidget',
				'vd-slider-widget': 'sliderWidget',
				'vd-tabs-widget': 'tabsWidget',
				'vd-accordion-widget': 'accordionWidget'
			},

			baseWidget: {
			},

			visualDesigner: {
				menuBtns: {
					"web-design-cmps": {
						index: 1,
						icon: "&#xE90D;",
						popupText: 'Web Design Components',
						subMenu: {
							"add-hero-img-widget": {
								index: 3,
								icon: "&#xE40B;",
								popupText: 'Add hero image',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var heroImg = $('<section></section>')
										.appendTo(this.element)
										.heroImgWidget();
									
									this.getFramework().trigger('onAddHeroImgWidget', {column: this, widget: heroImg});

									heroImg.vdPolymorphic('select');

									$('html, body').animate({
								        scrollTop: heroImg.offset().top
								    }, 500);
									
									return heroImg;
								}
							},
						}
					}
				}
			},

			rowWidget: {
				classes: 'vd-row',
				menuBtns: {
					"add-column": {
						index: 1,
						icon: "&#xE5C3;",
						popupText: 'Add columns',
						buttonColumns: 3, 
						subMenu: {
							"add-1-column": {
								index: 1,
								popupText: '1 column',
								icon: "&#xE3D0;",	
								callback: function() {
									this.addColumns([12]);
								}
							},
							"add-2-column": {
								index: 2,
								icon: "&#xE3D1;",
								popupText: '2 columns',
								callback: function() {
									this.addColumns([6,6]);
								}
							},
							"add-3-column": {
								index: 3,
								icon: "&#xE3D2;",
								popupText: '3 columns',
								callback: function() {
									this.addColumns([4,4,4]);
								}
							},
							"add-4-column": {
								index: 4,
								icon: "&#xE3D4;",
								popupText: '4 columns',
								callback: function() {
									this.addColumns([3,3,3,3]);
								}
							},
							"add-5-column": {
								index: 5,
								icon: "&#xE3D5;",
								popupText: '5 columns',
								callback: function() {
									this.addColumns([2,2,4,2,2]);
								}
							},
							"add-6-column": {
								index: 6,
								icon: "&#xE3D6;",
								popupText: '6 columns',
								callback: function() {
									this.addColumns([2,2,2,2,2,2]);
								}
							}
						}
					}
				},
				widgetTypes: {
					'vd-tabs-widget': 'tabsWidget'
				},
			}, 

			columnWidget: {
				// 1:  { classes: 'vd-col-md-1 vd-col-sm-4' },
				// 2:  { classes: 'vd-col-md-2 vd-col-sm-4' },
				// 3:  { classes: 'vd-col-md-3 vd-col-sm-6 vd-col-xs-12' },
				// 4:  { classes: 'vd-col-md-4 vd-col-sm-12' },
				// 5:  { classes: 'vd-col-md-5 vd-col-sm-5' },
				// 6:  { classes: 'vd-col-md-6 vd-col-sm-12' },
				// 7:  { classes: 'vd-col-md-7 vd-col-sm-7' },
				// 8:  { classes: 'vd-col-md-8 vd-col-sm-8' },
				// 9:  { classes: 'vd-col-md-9 vd-col-sm-9' 	},
				// 10: { classes: 'vd-col-md-10 vd-col-sm-10' },
				// 11: { classes: 'vd-col-md-11 vd-col-sm-11' },
				// 12: { classes: 'vd-col-md-12 vd-col-sm-12' },

				1:  { classes: 'vd-col-xs-1' },
				2:  { classes: 'vd-col-xs-2' },
				3:  { classes: 'vd-col-xs-3' },
				4:  { classes: 'vd-col-xs-4' },
				5:  { classes: 'vd-col-xs-5' },
				6:  { classes: 'vd-col-xs-6' },
				7:  { classes: 'vd-col-xs-7' },
				8:  { classes: 'vd-col-xs-8' },
				9:  { classes: 'vd-col-xs-9' },
				10: { classes: 'vd-col-xs-10' },
				11: { classes: 'vd-col-xs-11' },
				12: { classes: 'vd-col-xs-12' },

				menuBtns: {
					"web-design-cmps": {
						subMenu: {
							"add-tabs-widget": {
								index: 1,
								icon: "&#xE8D8;",
								popupText: 'Add tabs',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var tabs = $('<div></div>')
										.appendTo(this.element)
										.tabsWidget();
									
									this.getFramework().trigger('onColumnAddTabsWidget', {column: this, widget: tabs});

									tabs.vdPolymorphic('select');
									
									return tabs;
								}
							},
							"add-slider-widget": {
								index: 2,
								icon: "&#xE8EB;",
								popupText: 'Add slider',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var slider = $('<div></div>')
										.appendTo(this.element)
										.sliderWidget();
									
									this.getFramework().trigger('onColumnAddSliderWidget', {column: this, widget: slider});

									slider.vdPolymorphic('select');
									
									return slider;
								}
							},
							"add-card-widget": {
								index: 3,
								icon: "&#xE870;", 
								popupText: 'Add card',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var card = $('<div></div>')
										.appendTo(this.element)
										.cardWidget();
									
									this.getFramework().trigger('onColumnAddCardWidget', {column: this, widget: card});

									card.vdPolymorphic('select');
									
									return card;
								}
							},
							"add-ghost-btn-widget": {
								index: 3,
								icon: "&#xE40D;",
								popupText: 'Add ghost button',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var gBtn = $('<div></div>')
										.appendTo(this.element)
										.ghostBtnWidget();
									
									this.getFramework().trigger('onColumnAddGhostBtnWidget', {column: this, widget: gBtn});

									gBtn.vdPolymorphic('select');
									
									return gBtn; 
								}
							},
							"add-headline-widget": {
								index: 3,
								icon: "&#xE8EE;",
								popupText: 'Add headline',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var headline = $('<div></div>')
										.appendTo(this.element)
										.headlineWidget();
									
									this.getFramework().trigger('onColumnAddHeadlineWidget', {column: this, widget: headline});

									headline.vdPolymorphic('select');
									
									return headline;
								}
							},
							"add-map-widget": {
								index: 3,
								icon: "&#xE55B;",
								popupText: 'Add map image',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var map = $('<div></div>')
										.appendTo(this.element)
										.mapWidget();
									
									this.getFramework().trigger('onColumnAddMapWidget', {column: this, widget: map});

									map.vdPolymorphic('select');
									
									return map;
								}
							},
							"add-masonry-widget": {
								index: 3,
								icon: "&#xE871;",
								popupText: 'Add masonry',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var masonry = $('<div></div>')
										.appendTo(this.element)
										.masonryWidget();
									
									this.getFramework().trigger('onColumnAddMasonryWidget', {column: this, widget: masonry});

									masonry.vdPolymorphic('select');
									
									return masonry;
								}
							},
							"add-thumbnail-widget": {
								index: 3,
								icon: "&#xE638;",
								popupText: 'Add card component',
								autoPreview: true,
								callback: function() {

									var thumbnailWidget = $('' +
		'<div class="vd-bootstrap">' +
		'<div class="vd-thumbnail">' + 
		'      <div class="vd-img-widget vd-widget" style="text-align: center;"><img src="http://www.visualdesigner.io/wp-content/uploads/2017/10/cropped-Generic1-2.png" alt=""></div>' + 
		'      <div class="vd-caption">' + 
		'        <div class="vd-text-widget vd-widget"><h3>Thumbnail label</h3></div>' + 
		'        <div class="vd-text-widget vd-widget"><p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p></div>' + 
		'        <div class="vd-btn-widget vd-text-widget vd-widget"><a href="#" class="vd-btn vd-btn-primary" role="button"><span>Button</span></a></div>' + 
		'</div>' +
		'</div>')
										.appendTo(this.element)
										.componentWidget();

									this.getFramework().trigger('onColumnAddComponentWidget', {column: this, widget: thumbnailWidget});

									return thumbnailWidget;
								},
							},
							"add-chart": {
								index: 4,
								icon: "&#xE6C4;",
								popupText: 'Add chart',
								autoPreview: true,
								callback: function() {

									var mediaWidget = $('' +
		'<div class="vd-bootstrap">' +
		'<div class="progress yellow">' +
		'    <span class="progress-left">' +
		'        <span class="progress-bar"></span>' +
		'    </span>' +
		'    <span class="progress-right">' +
		'        <span class="progress-bar"></span>' +
		'    </span>' +
		'    <div class="progress-value">75%</div>' +
		'</div>' +
		'</div>')
										.appendTo(this.element)
										.componentWidget({
											menuBtns: {
												"set-progress": {
													index: 1,
													icon: "fa fa-link",
													callback: function() {
														//this.element
														alert("Change progress value coming soon");
													}
												}
											},

											style: {id: 'bs-chart',
													content: '' +
		'.progress{' +
		'    width: 150px;' +
		'    height: 150px;' +
		'    line-height: 150px;' +
		'    background: none;' +
		'    margin: 0 auto;' +
		'    box-shadow: none;' +
		'    position: relative;' +
		'}' +
		'.progress:after{' +
		'    content: "";' +
		'    width: 100%;' +
		'    height: 100%;' +
		'    border-radius: 50%;' +
		'    border: 12px solid #fff;' +
		'    position: absolute;' +
		'    top: 0;' +
		'    left: 0;' +
		'}' +
		'.progress > span{' +
		'    width: 50%;' +
		'    height: 100%;' +
		'    overflow: hidden;' +
		'    position: absolute;' +
		'    top: 0;' +
		'    z-index: 1;' +
		'}' +
		'.progress .progress-left{' +
		'    left: 0;' +
		'}' +
		'.progress .progress-bar{' +
		'    width: 100%;' +
		'    height: 100%;' +
		'    background: none;' +
		'    border-width: 12px;' +
		'    border-style: solid;' +
		'    position: absolute;' +
		'    top: 0;' +
		'}' +
		'.progress .progress-left .progress-bar{' +
		'    left: 100%;' +
		'    border-top-right-radius: 80px;' +
		'    border-bottom-right-radius: 80px;' +
		'    border-left: 0;' +
		'    -webkit-transform-origin: center left;' +
		'    transform-origin: center left;' +
		'}' +
		'.progress .progress-right{' +
		'    right: 0;' +
		'}' +
		'.progress .progress-right .progress-bar{' +
		'    left: -100%;' +
		'    border-top-left-radius: 80px;' +
		'    border-bottom-left-radius: 80px;' +
		'    border-right: 0;' +
		'    -webkit-transform-origin: center right;' +
		'    transform-origin: center right;' +
		'    animation: loading-1 1.8s linear forwards;' +
		'}' +
		'.progress .progress-value{' +
		'    width: 90%;' +
		'    height: 90%;' +
		'    border-radius: 50%;' +
		'    background: #44484b;' +
		'    font-size: 24px;' +
		'    color: #fff;' +
		'    line-height: 135px;' +
		'    text-align: center;' +
		'    position: absolute;' +
		'    top: 5%;' +
		'    left: 5%;' +
		'}' +
		'.progress.blue .progress-bar{' +
		'    border-color: #049dff;' +
		'}' +
		'.progress.blue .progress-left .progress-bar{' +
		'    animation: loading-2 1.5s linear forwards 1.8s;' +
		'}' +
		'.progress.yellow .progress-bar{' +
		'    border-color: #fdba04;' +
		'}' +
		'.progress.yellow .progress-left .progress-bar{' +
		'    animation: loading-3 1s linear forwards 1.8s;' +
		'}' +
		'.progress.pink .progress-bar{' +
		'    border-color: #ed687c;' +
		'}' +
		'.progress.pink .progress-left .progress-bar{' +
		'    animation: loading-4 0.4s linear forwards 1.8s;' +
		'}' +
		'.progress.green .progress-bar{' +
		'    border-color: #1abc9c;' +
		'}' +
		'.progress.green .progress-left .progress-bar{' +
		'    animation: loading-5 1.2s linear forwards 1.8s;' +
		'}' +
		'@keyframes loading-1{' +
		'    0%{' +
		'        -webkit-transform: rotate(0deg);' +
		'        transform: rotate(0deg);' +
		'    }' +
		'    100%{' +
		'        -webkit-transform: rotate(180deg);' +
		'        transform: rotate(180deg);' +
		'    }' +
		'}' +
		'@keyframes loading-2{' +
		'    0%{' +
		'        -webkit-transform: rotate(0deg);' +
		'        transform: rotate(0deg);' +
		'    }' +
		'    100%{' +
		'        -webkit-transform: rotate(144deg);' +
		'        transform: rotate(144deg);' +
		'    }' +
		'}' +
		'@keyframes loading-3{' +
		'    0%{' +
		'        -webkit-transform: rotate(0deg);' +
		'        transform: rotate(0deg);' +
		'    }' +
		'    100%{' +
		'        -webkit-transform: rotate(90deg);' +
		'        transform: rotate(90deg);' +
		'    }' +
		'}' +
		'@keyframes loading-4{' +
		'    0%{' +
		'        -webkit-transform: rotate(0deg);' +
		'        transform: rotate(0deg);' +
		'    }' +
		'    100%{' +
		'        -webkit-transform: rotate(36deg);' +
		'        transform: rotate(36deg);' +
		'    }' +
		'}' +
		'@keyframes loading-5{' +
		'    0%{' +
		'        -webkit-transform: rotate(0deg);' +
		'        transform: rotate(0deg);' +
		'    }' +
		'    100%{' +
		'        -webkit-transform: rotate(126deg);' +
		'        transform: rotate(126deg);' +
		'    }' +
		'}' +
		'@media only screen and (max-width: 990px){' +
		'    .progress{ margin-bottom: 20px; }' +
		'}'
		}
										});

									this.getFramework().trigger('onColumnAddComponentWidget', {column: this, widget: mediaWidget});

									return mediaWidget;
								}
							},
							"parallax-header-section": {
								index: 7,
								icon: "&#xE40D;",
								popupText: 'Add parallax header section',
								autoPreview: true,
								callback: function() {

									var mediaWidget = $('<div><div class=\"vd-row-widget vd-widget vd-row\" style=\"background-position: center center; background-size: cover; background-attachment: fixed; background-image: url(&quot;http:\/\/www.visualdesigner.io\/wp-content\/uploads\/2017\/10\/pexels-photo-220072.jpeg&quot;); padding: 150px 48px;\">\r\n   <div class=\"vd-column-widget vd-col-xs-12 vd-widget\" data-col-width=\"12\" style=\"text-align: center; color: rgb(255, 255, 255);\">\r\n      <div class=\"vd-text-widget vd-widget \" vd-text-type=\"h1\">\r\n         <h1><span>Visual Designer<\/span><\/h1>\r\n      <\/div>\r\n      <div class=\"vd-text-widget vd-widget \" vd-text-type=\"p\">\r\n         <p>Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque\r\n            ante sollicitudin commodo. Cras purus odio, vestibulum in vulputate at,\r\n            tempus viverra turpis. Fusce condimentum nunc ac nisi vulputate \r\n            fringilla. Donec lacinia congue felis in faucibus.\r\n         <\/p>\r\n      <\/div>\r\n      <div class=\"vd-btn-widget vd-text-widget vd-widget \" vd-text-type=\"a\"><a href=\"\"><span>Press Me<\/span><\/a><\/div>\r\n   <\/div>\r\n<\/div><\/div>')
										.appendTo(this.element)
										.componentWidget({
											style: {
												id: 'bs-paralax-header-section',
												content: ''
											}
										});

									this.getFramework().trigger('onColumnAddComponentWidget', {column: this, widget: mediaWidget});

									return mediaWidget;
								}
							},
							"more-components": {
								index: 7,
								icon: "&#xE5D3;",
								popupText: '...More components coming soon'
							}
						}
					},
					"structural-cmps": {
						subMenu: {
							"add-horiz-list": {
								index: 3,
								icon: "&#xE260;",
								popupText: 'Add horizontal list',
								callback: function(btn, btnOptions) {

									var hList = $('<div></div>')
										.appendTo(this.element)
										.inlineListWidget();
									
									this.getFramework().trigger('onColumnAddHListWidget', {column: this, widget: hList});

									hList.vdPolymorphic('select');
									
									return hList;
								}
							},
						}
					},
					"resize-column": {
						index: 8,
						icon: "&#xE3BE;",
						popupText: 'Resize column',

						input: {
							type: 'slider',
							icon: "&#xE3BE;",
							popupText: 'Resize column width',
							value: 1,
							min: 1,
							max: 12,
							step: 1,
							callback: function(value) {
								
								switch (value.slider)
								{
									case 1: 
										this._setWidth(1);
									break;
									case 2: 
										this._setWidth(2);
									break;
									case 3: 
										this._setWidth(3);
									break;
									case 4: 
										this._setWidth(4);
									break;
									case 5: 
										this._setWidth(5);
									break;
									case 6: 
										this._setWidth(6);
									break;
									case 7: 
										this._setWidth(7);
									break;
									case 8: 
										this._setWidth(8);
									break;
									case 9: 
										this._setWidth(9);
									break;
									case 10: 
										this._setWidth(10);
									break;
									case 11: 
										this._setWidth(11);
									break;
									case 12: 
										this._setWidth(12);
									break;
									default:
									break;
								}
							},
							show: function() {

								return this.element.attr('data-col-width');
							}
						},
					}
				}
			},
			textWidget: {
				classes: ''
			},
			imgWidget: {
				classes: ''
			},
			btnWidget: {
				classes: ''
			},
			videoWidget: {
				classes: ''
			},
		},

		_create: function () {

			var containerOptions = {};
			$.extend( true, containerOptions, this.options.columnWidget, this.options.containerWidget );
			this.options.containerWidget = containerOptions;
			
			this._super( "_create" );
		},

		getFrameworkNamespaces: function() {
			var namespaces = this._super();
			namespaces.push('vdw_bs');
			return namespaces;
		},

		vdOnResizeColumnWidget: function(e, params) {

			var widget = params.widget;
			
			widget.element.removeClass(function (index, css) {
				return (css.match (/(vd-col-.*?(1|2|3|4|5|6|7|8|9|0)+)/gi) || []).join(' ');
			});
		}
	});

//})( jQuery, window, document );
})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs4.bs4CardWidget", $.vdw.containerWidget, {

		name: "vd-card-widget",

		vdType: 'card',

		defaults: {
			widgetClass: "vd-card-widget",
			tagName: 'Card',
			template: '<div class="card-body"></div>',
			menuBtns: {
			},
		},

		_create: function () {
			this._super();
			this.element.addClass('card');
		},

		addDefaultContent: function() {
			this._super();
			var cardBody = $('.card-body', this.element);
			$.vdg.widgetFactory('imgWidget', {classes: 'card-img-top'}, this.element, '<img/>');
			$.vdg.widgetFactory('textWidget', {classes: 'card-title', defText: 'Title'}, cardBody, '<h4></h4>');
			$.vdg.widgetFactory('textWidget', {classes: 'card-text', defText: 'Content'}, cardBody, '<p></p>');
			$.vdg.widgetFactory('btnWidget', {defText: 'Submit'}, cardBody, '<a></a>');
		},

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs4.bs4CarouselWidget", $.vdw.rowWidget, {

		name: "vd-carousel-widget",

		vdType: 'carousel',

		defaults: {
			widgetClass: "vd-carousel-widget",
			tagName: 'Carousel',
			template: '',
			menuBtns: {
			},
		},

		_create: function () {
			this._super();
			this.element.addClass('carousel');
		},

		// addDefaultContent: function() {
		// 	this._super();
		// },

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs4.bs4CollapseWidget", $.vdw.containerWidget, {

		name: "vd-collapse-widget",

		vdType: 'collapse',

		defaults: {
			widgetClass: "vd-collapse-widget",
			tagName: 'Collapse',
			template: '',
			menuBtns: {
			},
		},

		_create: function () {
			this._super();
			this.element.addClass('collapse');
		},

		// addDefaultContent: function() {
		// 	this._super();
		// },

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs4.bs4JumbotronWidget", $.vdw.containerWidget, {

		name: "vd-jumbotron-widget",

		vdType: 'jumbotron',

		defaults: {
			widgetClass: "vd-jumbotron-widget",
			tagName: 'Jumbotron',
			template: '',
			menuBtns: {
			},
		},

		_create: function () {
			this._super();
			this.element.addClass('jumbotron jumbotron-fluid');
		},

		addDefaultContent: function() {
			this._super();

			var heading = $.vdg.widgetFactory('textWidget', {
				classes: 'display-4',
				template: '<span>Hello, world!</span>',
			}, this.element, '<h1></h1>');
			var p1 = $.vdg.widgetFactory('textWidget', {
				classes: 'lead',
				template: '<span>This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</span>',
			}, this.element, '<p></p>');
			var hr = $.vdg.widgetFactory('hr', {
				classes: 'my-4',
			}, this.element, '<hr/>');
			var p2 = $.vdg.widgetFactory('textWidget', {
				classes: '',
				template: '<span>It uses utility classes for typography and spacing to space content out within the larger container.</span>',
			}, this.element, '<p></p>');
			var btn = $.vdg.widgetFactory('btnWidget', {
				classes: 'btn btn-primary btn-lg',
				template: '<span>Learn more</span>',
			}, this.element, '<a></a>');
		},

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs4.bs4NavWidget", $.vdw.rowWidget, {

		name: "vd-nav-widget",

		vdType: 'nav',

		defaults: {
			widgetClass: "vd-nav-widget",
			tagName: 'Nav',
			template: '',
			menuBtns: {
			},
		},

		_create: function () {
			this._super();
			this.element.addClass('nav');
		},

		// addDefaultContent: function() {
		// 	this._super();
		// },

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs4.bs4ToastWidget", $.vdw.containerWidget, {

		name: "vd-toast-widget",

		vdType: 'toast',

		defaults: {
			widgetClass: "vd-toast-widget",
			tagName: 'Toast',
			template: '',
			menuBtns: {
			},
		},

		_create: function () {
			this._super();
			this.element.addClass('toast');
		},

		// addDefaultContent: function() {
		// 	this._super();
		// },

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.cardWidget", $.vdw.containerWidget, {

		name: "vd-card-widget",

		defaults: {
			classes: "",
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this.element.addClass('vd-card-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();
		},

		addDefaultContent: function() {

			
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.ghostBtnWidget", $.vdw.btnWidget, {

		name: "vd-ghost-btn-widget",

		defaults: {
			classes: "",
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this.element.addClass('vd-ghost-btn-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();
		},

		addDefaultContent: function() {

			
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.headlineWidget", $.vdw.textWidget, {

		name: "vd-headline-widget",

		defaults: {
			classes: "",
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this.element.addClass('vd-headline-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();
		},

		addDefaultContent: function() {

			
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.heroImgWidget", $.vdw.sectionWidget, {

		name: "vd-hero-img-widget",

		defaults: { 
			classes: "",
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				'set-hero-img': {
					index: 1,
					popupText: 'Set image properties'
				}
			},
			hiddenMenuBtns: {
				'padding': false
			}
		},

		_create: function () {

			this.element.addClass('vd-hero-img-widget vd-bootstrap');

			var temp = {};
			$.extend( true, temp, $.vdw.baseWidget.prototype.defaults.menuBtns.style.subMenu["background-image"], $.vdw.wordpressFramework.prototype.options.baseWidget.menuBtns.style.subMenu["background-image"], this.defaults.menuBtns['set-hero-img']);
			this.defaults.menuBtns['set-hero-img'] = temp;

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();
		},

		addDefaultContent: function() {

			this.onSetOverlayChange('rgba(222, 27, 27, 0.36)', null);

			var col = $('<div></div>')
  				.appendTo(this.element.find('.vd-row-widget'))
  				.columnWidget({
  					colWidth: [12],
  					hideOnCreate: true
  				})
  				.css('color', '#fff');

  			var h1 = $('<div><h1><span></span></h1></div>')
  				.appendTo(col)
  				.textWidget()
				.textWidget('setText', 'MY ATTENTION GRABBING HEADLINE')
				.find('> h1').attr('style', 'margin-bottom: 3rem; font-weight: 900;');

  			var h4 = $('<div><h4><span></span></h4></div>')
  				.appendTo(col)
  				.textWidget()
  				.textWidget('setText', 'Some text that will give the user that last push to click the call to action button below.')
				.find('> h4').attr('style', 'margin-bottom: 3rem;');

  			var catBtn = $('<div><a href=""><span></span></a></div>')
  				.appendTo(col)
				.btnWidget()
				.btnWidget('setText', 'CALL TO ACTION')
				.find('> a').attr('style', 'padding: 20px; background-color: rgb(255, 255, 255); color: rgb(247, 17, 98); font-weight: bold;');
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.inlineListWidget", $.vdw.baseWidget, {

		name: "vd-list-widget",

		defaults: {
			classes: "",
			sortContainer: '.vd-content-widget',
			template: '',
			menuBtns: {
				"add-item": {
					index: 1,
					icon: "&#xE8D8;",
					popupText: 'Add item',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.addItem();
					}
				},
				"toogle-item-justification": {
					index: 2,
					icon: "&#xE235;",
					popupText: 'Toogle item justification',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.toggleItemJustification(btn, btnOptions);
					}
				}
			},
			hiddenMenuBtns: {
				"link": true
			},
		},

		_create: function () {

			this.element.addClass('vd-list-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();

			this.list = $('.vd-list-inline', this.element).first();

			this.list.sortable({
			   // connectWith: self.options.sortContainer,
			   // //containment: self.sortContainer,
			   handle: '.vd-widget-tag',
			   placeholder: "vd-sortable-placeholder",
			   forcePlaceholderSize: true,
			   helper: "clone",
			   forceHelperSize: true,
			   tolerance: "pointer",
			   revert: true
			});
		},

		addDefaultContent: function() {

			// vd-nav-justified
			this.list = $('<ul class="vd-list-inline vd-list-justified"></ul>').appendTo(this.element);
			this.addItem();
			this.addItem();
			this.addItem();
		},

		addItem: function() {

			// var item = $('<li class="vd-item"></li>')
			// 	.appendTo(this.list);

			// var container = $('<div></div>')
			// 	.appendTo(item)
			// 	.containerWidget();

			// $.vdg.widget(container, 'select');


			var item = $('<li class="vd-item"></li>')
				.appendTo(this.list)
				.containerWidget();

			$.vdg.widget(item, 'select');
		},

		toggleItemJustification: function(btn, btnOptions) {

			this.list.toggleClass('vd-list-justified');
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.mapWidget", $.vdw.baseWidget, {

		name: "vd-map-widget",

		defaults: {
			classes: "",
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				"set-location": {
					index: 1,
					icon: "&#xE55B;",
					popupText: 'Set location',
					autoPreview: true,
					input: {
						type: 'inputMenu',
						popupText: '',
						tooltip: '',
						selectAll: true,
						icon: "&#xE55B;",
						callback: function(value, target) {
							
							return this.onSetLocation(value, target);
						},
						show: function() {
							return $('iframe', this.element).attr('src');
						}
					}
				},
				"set-dimensions": {
					index: 2,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					input: {
						type: 'dimensions-input',
						//popupText: '',
						//tooltip: '',
						icon: "&#xE85B;",
						callback: function(values, target) {
							
							return this.onSetDimensions(values, target);
						},
						show: function() {
							var self = this;
							return {
								width: self.attr('vd-width'),
								height: self.attr('vd-height')
							};
						}
					}
				},
				"toggle-fullscreen": {
					index: 3,
					icon: "&#xE5D0;",
					popupText: 'Toggle fullscreen ability',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.onToggleFullscreen(btn, btnOptions);
					}
				}
			},
			hiddenMenuBtns: {
				"link": true,
				"create-component": true
			},
		},

		_create: function () {

			this.element.addClass('vd-map-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();
		},

		addDefaultContent: function() {

			$('<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6119750.542705149!2d-99.68090200000005!3d41.50081945000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87938dc8b50cfced%3A0xa127900c0ff30ac4!2sNebraska!5e0!3m2!1sen!2sus!4v1520024924806" width="100%" height="450px" frameborder="0" style="border:0" allowfullscreen></iframe>')
				.appendTo(this.element);
		},

		onSetLocation: function(value, target) {
			
			try {
				var regex = /src=("|')(.*)("|')/gi;
				var src = regex.exec(value)[2];
				$('iframe', this.element).attr('src', src);
			}
			catch (ex) {
				console.log(ex.message);
			}
		},

		onSetDimensions: function(values, target) {

			if (values.width) {
				$('iframe', this.element).attr('width', values.width + '%');
				this.element.attr('vd-width', values.width);
			}

			if (values.height) {
				$('iframe', this.element).attr('height', values.height + 'px');
				this.element.attr('vd-height', values.height);
			}
		},

		onToggleFullscreen: function(btn, btnOptions) {
			var allowFullscreen = $('iframe', this.element).attr('allowfullscreen').toLowerCase() == 'true';
			$('iframe', this.element).attr('allowfullscreen', !allowFullscreen);
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.masonryWidget", $.vdw.baseWidget, {

		name: "vd-masonry-widget",

		defaults: {
			classes: "",
			gutter: '1',
			sortContainer: '.vd-masonry-widget',
			menuBtns: {
				"add-brick": {
					index: 1,
					icon: "&#xE148;",
					popupText: 'Add brick',
					callback: function(btn, btnOptions) {

						return this.addBrick();
					}
				},
				"set-columns": {
					index: 2,
					icon: "&#xE8EC;",
					popupText: 'Set columns',
					input: {
						type: 'slider',
						popupText: '',
						tooltip: '',
						icon: "&#xE8EC;",
						value: 4,
						min: 1,
						max: 20,
						step: 1,
						callback: function(values, target) {
							
							if (!values.slider)
								return false;

							this.style('column-count', values.slider);
						},
						show: function() {
							return this.element.css('column-count');
						}
					}
				},
				"set-gutter": {
					index: 3,
					icon: "&#xE256;",
					popupText: 'Set gutter',
					input: {
						type: 'slider',
						popupText: '',
						tooltip: '',
						icon: "&#xE256;",
						//value: 1,
						min: 0.00,
						max: 20.00,
						step: 0.25,
						callback: function(values, target) {
							
							if (!values.slider)
								return false;

							this.style('column-gap', values.slider + 'rem');

							$('.vd-masonry-brick', this.element).css('margin-bottom', values.slider + 'rem');

							this.element.attr('vd-gutter', values.slider);
						},
						show: function() {
							return this.element.attr('vd-gutter');
						}
					}
				},
			},
			hiddenMenuBtns: {
				"link": true
			},
		},

		_create: function () {

			this.element.addClass('vd-masonry-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();
		},

		addDefaultContent: function() {

			this.element.attr('vd-gutter', this.options.gutter);

			this.addBrick();
			this.addBrick();
			this.addBrick();
			this.addBrick();
			this.addBrick();
			this.addBrick();
			this.addBrick();
			this.addBrick();
		},

		addBrick: function() {

			var brick = $('<div></div>')
				.appendTo(this.element)
				.addClass('vd-masonry-brick')
				.css('margin-bottom', this.element.attr('vd-gutter') + 'rem')
				.containerWidget({
					sortContainer: null
				});
			brick.attr('id', $.vdg.manager('generateId', this.getDesigner().attr('id')));
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.sliderWidget", $.vdw.baseWidget, {

		name: "vd-slider-widget",

		defaults: {
			interval: null, //10000,
			classes: "",
			sortContainer: '.vd-content-widget',
			menuBtns: {
				"add-tab": {
					index: 1,
					icon: "&#xE8D8;",
					popupText: 'Add slide',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.addSlide();
					}
				},
				'aspect': {
					index: 2,
					icon: "&#xE85B;",
					popupText: 'Aspect',
					input: {
						type: 'slider',
						icon: "&#xE85B;",
						popupText: 'Set aspect',
						//value: 1,
						min: 1,
						max: 1000,
						step: 1,
						callback: function(values, target) {
							
							return this.onAspectChange(values, target);
						},
						show: function() {
							return this.element.attr('vd-height');
						}
					},
				},
				"toggle-shadows": {
					index: 3,
					icon: "&#xE1B2;",
					popupText: 'Toggle shadows',
					callback: function(btn, btnOptions) {

						return this.onToggleShadows(btn, btnOptions);
					}
				},
				"toggle-indicators": {
					index: 4,
					icon: "&#xE1B2;",
					popupText: 'Toggle indicators',
					callback: function(btn, btnOptions) {

						return this.onToggleIndicators(btn, btnOptions);
					}
				},
			},
			// style: {
			// 	id: 'bs-slider', //.vd-carousel-inner > .vd-item { min-height: 300px; } 
			// 	content: ' .vd-carousel-inner > .vd-item.vd-container-widget{ min-height : 300px; max-height : 300px; width : 100%; }'
			// }
		},

		sliderNum: -1,

		_create: function () {

			var self = this;
			this.element.addClass('vd-slider-widget vd-carousel slide vd-bootstrap');
			//this.element.attr('data-ride', 'carousel');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();
			
			this.element.carousel({
				interval: self.options.interval
			});

			this.sliderIndicators = $('.vd-carousel-indicators', this.element).first();

			this.sliderInner = $('.vd-carousel-inner', this.element).first();

			this.prevBtn = $('[data-slide="prev"]', this.element).first();

			this.nextBtn = $('[data-slide="next"]', this.element).first();
		},

		addDefaultContent: function() {

			this.sliderIndicators = $('<ol class="vd-carousel-indicators"></div>').appendTo(this.element);
			this.sliderIndicators.attr('id', $.vdg.manager('generateId'));

			this.sliderInner = $('<div class="vd-carousel-inner"></div>')
				.appendTo(this.element)
				.attr('role', 'listbox');
			this.sliderInner.attr('id', $.vdg.manager('generateId'));

			this.prevBtn = $('<a class="vd-carousel-control vd-left" href="#' + this.element.attr('id') + '" data-slide="prev"></a>').appendTo(this.element);

			this.nextBtn = $('<a class="vd-carousel-control vd-right" href="#' + this.element.attr('id') + '" data-slide="next"></a>').appendTo(this.element);

			var prevIcon = $('<span><i></i></span>')
				.appendTo(this.prevBtn)
				.iconWidget({
					sortContainer: null
				});

			var nextIcon = $('<span><i></i></span>')
				.appendTo(this.nextBtn)
				.iconWidget({
					sortContainer: null
				});

			this.addSlide();
			this.addSlide();
			this.addSlide();
		},

		addSlide: function() {

			this.sliderNum++;

			$('*', this.element).removeClass('vd-active');

			var indicator = $('<li class="vd-active"></li>').appendTo(this.sliderIndicators)
				.attr('data-target', '#' + this.element.attr('id'))
				.attr('data-slide-to', this.sliderNum);

			var sliderContent = $('<div class="vd-item vd-active"></div>').appendTo(this.sliderInner)
				.containerWidget({
					sortContainer: null
				});
				//.addClass('vd-carousel-caption');

			// var item = $('<div class="vd-item vd-active"></div>').appendTo(this.sliderInner);

			// var sliderContent = $('<div></div>')
			// 	.appendTo(item)
			// 	.addClass('vd-carousel-caption')
			// 	.containerWidget({
			// 		sortContainer: null
			// 	});

			// $('<div><p><span>foo</span></p></div>')
			// 	.appendTo(sliderContent)
			// 	//.textWidget()
			// 	.addClass('vd-carousel-caption');

			//this.element.carousel();
			//this.element.carousel(this.sliderNum);
		},

		onAspectChange: function(values, target) {

			this.styleElement(this.target, 'height', values.slider + 'px');
							
			this.attributeElement(this.element, 'vd-height', values.slider);
		},

		onToggleShadows: function(btn, btnOptions) {

			var shadowsDisabled = this.nextBtn.attr('vd-shadow') && this.nextBtn.attr('vd-shadow').length > 0;

			if (shadowsDisabled) {
				this.prevBtn.css('background-image', this.prevBtn.attr('vd-shadow'));
				this.nextBtn.css('background-image', this.nextBtn.attr('vd-shadow'));
				this.prevBtn.attr('vd-shadow', '');
				this.nextBtn.attr('vd-shadow', '');
			}
			else {
				this.prevBtn.attr('vd-shadow', this.prevBtn.css('background-image'));
				this.nextBtn.attr('vd-shadow', this.nextBtn.css('background-image'));
				this.prevBtn.css('background-image', 'none');
				this.nextBtn.css('background-image', 'none');
			}

			return true;
		},

		onToggleIndicators: function(btn, btnOptions) {
			var display = 'none';
			var isHidden = this.element.find('.vd-carousel-indicators').css('display').toLowerCase() == 'none';

			if (isHidden)
				display = 'inline-block';

			this.element.find('.vd-carousel-indicators').css('display', display);
			return true;
		},


	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.tabContentWidget", $.vdw.containerWidget, {

		name: "vd-tab-content-widget",

		defaults: {
			classes: "",
			hiddenMenuBtns: {
				"trash": true,
				"clone": true
			},
		},

		_create: function () {

			this.element.addClass('vd-tab-content-widget vd-tab-pane vd-bootstrap');

			this._super( "_create" );
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.tabPillWidget", $.vdw.btnWidget, {

		name: "vd-tab-pill-widget",

		defaults: {
			classes: "",
			hiddenMenuBtns: {

			},
		},

		_create: function () {

			this.element.addClass('vd-tab-pill-widget');

			this._super( "_create" );
		},

		trash: function(btn, btnOptions) {

			var siblings = this.element.siblings();
			
			if (!siblings.length)
				return false;
			
			var tabContentId = this.element.children('a').first().attr('href');
			var tabContent = this.parent().find(tabContentId);

			siblings.first().children('a').first().tab('show');

			$.vdg.widget(tabContent, 'trash', btn, btnOptions);

			return this._super( "trash" );
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.tabsWidget", $.vdw.baseWidget, {

		name: "vd-tabs-widget",

		defaults: {
			classes: "",
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				"add-tab": {
					index: 1,
					icon: "&#xE8D8;",
					popupText: 'Add tab',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.addTab();
					}
				},
				"toogle-tab-justification": {
					index: 2,
					icon: "&#xE235;",
					popupText: 'Toogle tab justification',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.toggleTabJustification(btn, btnOptions);
					}
				}
			},
			hiddenMenuBtns: {
				"link": true
			},
		},

		_create: function () {

			this.element.addClass('vd-tabs-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();

			this.tabHeader = $('.vd-tabs-header', this.element).first();
			this.tabContainer = $('.vd-tab-content', this.element).first();

			$('a[data-toggle="vd-tab"]', this.tabHeader).on($.vdg.manager('btnBindEvt'), function(e) {
			    $(this).tab('show');
			});

			this.tabHeader.sortable({
			   // connectWith: self.options.sortContainer,
			   // //containment: self.sortContainer,
			   handle: '.vd-widget-tag',
			   placeholder: "vd-sortable-placeholder",
			   forcePlaceholderSize: true,
			   helper: "clone",
			   forceHelperSize: true,
			   tolerance: "pointer",
			   revert: true
			});
		},

		addDefaultContent: function() {

			// vd-nav-justified
			this.tabHeader = $('<ul class="vd-tabs-header vd-nav vd-nav-tabs"></ul>').appendTo(this.element);
			this.tabHeader.attr('id', $.vdg.manager('generateId'));
			this.tabContainer = $('<div class="vd-tab-content"></div>').appendTo(this.element);
			this.tabContainer.attr('id', $.vdg.manager('generateId'));
			this.addTab();
		},

		addTab: function() {

			var self = this;

			// var tabContent = $('<div class="vd-tab-pane"></div>').appendTo(this.tabContainer)
			// 	.containerWidget({
			// 		sortContainer: null
			// 	});
			// tabContent.attr('id', $.vdg.manager('generateId'));

			var tabContent = $('<div></div>').appendTo(this.tabContainer)
				.tabContentWidget({
					sortContainer: null
				});
			
			// var tab = $('<li role="presentation" class=""><a data-toggle="vd-tab" href="#' + tabContent.attr('id') + '"><span></span></a></li>')
			// 	.appendTo(this.tabHeader)
			// 	.btnWidget({
			// 		sortContainer: self.tabHeader.attr('id')
			// 	})
			// 	.btnWidget('setText', 'Visual Designer');

			var tab = $('<li role="presentation" class=""><a data-toggle="vd-tab" href="#' + tabContent.attr('id') + '"><span></span></a></li>')
				.appendTo(this.tabHeader)
				.tabPillWidget({
					sortContainer: self.tabHeader.attr('id')
				})
				.tabPillWidget('setText', 'Visual Designer');

			$('a[data-toggle="vd-tab"]', tab).on($.vdg.manager('btnBindEvt'), function(e) {
			    $(this).tab('show');
			});

			$('a[data-toggle="vd-tab"]', tab).tab('show');

			// var tabContainer = $('<div></div>')
			// 	.appendTo(tabContent)
			// 	.containerWidget();
		},

		toggleTabJustification: function(btn, btnOptions) {

			this.tabHeader.toggleClass('vd-nav-justified');
		},


	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_bs.accordionWidget", $.vdw.baseWidget, {

		name: "vd-accordion-widget",

		defaults: {
			classes: "",
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				"add-segment": {
					index: 1,
					icon: "&#xE251;",
					popupText: 'Add segment',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.addSegment();
					}
				}
			},
		},

		_create: function () {

			this.element.addClass('vd-accordion-widget vd-bootstrap');

			this._super( "_create" );

			if (!this.options.preserveContent)
				 this.addDefaultContent();

			this.accordionGrp = $('.vd-panel-group', this.element).first();

			this.accordionGrp.sortable({
			   // connectWith: self.options.sortContainer,
			   // //containment: self.sortContainer,
			   handle: '.vd-widget-tag',
			   placeholder: "vd-sortable-placeholder",
			   forcePlaceholderSize: true,
			   helper: "clone",
			   forceHelperSize: true,
			   tolerance: "pointer",
			   revert: true
			});
		},

		addDefaultContent: function() {

			this.accordionGrp = $('<div class="vd-panel-group" role="tablist" aria-multiselectable="true"></div>').appendTo(this.element);
			this.accordionGrp.attr('id', $.vdg.manager('generateId'));
			
			this.addSegment();
		},

		addSegment: function() {

			var self = this;

			var segment = $('<div class="vd-panel"></div>').appendTo(this.tabContainer);
			// tabContent.attr('id', $.vdg.manager('generateId'));
			
			// var tab = $('<li role="presentation" class=""><a data-toggle="vd-tab" href="#' + tabContent.attr('id') + '"><span></span></a></li>')
			// 	.appendTo(this.tabHeader)
			// 	.btnWidget({
			// 		sortContainer: self.tabHeader.attr('id')
			// 	})
			// 	.btnWidget('setText', 'Visual Designer');

			// $('a[data-toggle="vd-tab"]', tab).on($.vdg.manager('btnBindEvt'), function(e) {
			//     $(this).tab('show');
			// });

			// $('a[data-toggle="vd-tab"]', tab).tab('show');

			// var tabContainer = $('<div></div>')
			// 	.appendTo(tabContent)
			// 	.containerWidget();
		},


	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

//;(function ( $, window, document, undefined ) {
(function ($) {

	$.widget( "vd.debugFramework", $.vd.baseFramework, {

		options: {
			loadIcons: true,
			maxColumns: 12,
			menuYOffset: '10px',

			visualDesignerManager: {
				menuBtns: {
					"foo": {
            index: 1,
            icon: "&#xE864;",
            popupText: 'foo',
            hidden: true,
            callback: function(btn, btnOptions) {

            	return $.vdg.widgetFactory('baseWidget', {vdType: 'foo'}, this.element);
            }
          },
				},
			},
		},


		vdOnInitialiseFramework: function(e, params) {
			this._super(e, params);
			
			if (this.options.loadIcons)
				$.vdg.manager('loadIcons');
		},
	});

})( jQuery );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

//;(function ( $, window, document, undefined ) {
(function ($) {

	$.widget( "vd.vDFramework", $.vd.baseFramework, {

		options: {
			// simpleMode: true,
			loadIcons: true,
			maxColumns: 12,

			menuYOffset: '10px',

			alignments: {
				self: {
					desktop: {
						reset: 	'',
						left: 	'vd-left',
						center: 'vd-center',
						right: 	'vd-right',
						top: 		'vd-top',
						middle: 'vd-middle',
						bottom: 'vd-bottom',
						halign: 'vd-horz',
						valign: 'vd-vert',
					},
					tablet: {
						reset: 	'',
						left: 	'vd-sm-left',
						center: 'vd-sm-center',
						right: 	'vd-sm-right',
						top: 		'vd-sm-top',
						middle: 'vd-sm-middle',
						bottom: 'vd-sm-bottom',
						halign: 'vd-sm-horz',
						valign: 'vd-sm-vert',
					},
					mobile: {
						reset: 	'',
						left: 	'vd-xs-left',
						center: 'vd-xs-center',
						right: 	'vd-xs-right',
						top: 		'vd-xs-top',
						middle: 'vd-xs-middle',
						bottom: 'vd-xs-bottom',
						halign: 'vd-xs-horz',
						valign: 'vd-xs-vert',
					},
				},
				content: {
					desktop: {
						reset: 	'',
						left: 	'vd-c-left',
						center: 'vd-c-center',
						right: 	'vd-c-right',
						top: 		'vd-c-top',
						middle: 'vd-c-middle',
						bottom: 'vd-c-bottom',
						halign: 'vd-horz',
					},
					tablet: {
						reset: 	'',
						left: 	'vd-c-sm-left',
						center: 'vd-c-sm-center',
						right: 	'vd-c-sm-right',
						top: 		'vd-c-sm-top',
						middle: 'vd-c-sm-middle',
						bottom: 'vd-c-sm-bottom',
						halign: 'vd-sm-horz',
					},
					mobile: {
						reset: 	'',
						left: 	'vd-c-xs-left',
						center: 'vd-c-xs-center',
						right: 	'vd-c-xs-right',
						top: 		'vd-c-xs-top',
						middle: 'vd-c-xs-middle',
						bottom: 'vd-c-xs-bottom',
						halign: 'vd-xs-horz',
					},
				},
				absolute: {
					desktop: {
						reset: 	'',
						left: 	'vd-abs-left',
						center: 'vd-abs-center',
						right: 	'vd-abs-right',
						top: 		'vd-abs-top',
						middle: 'vd-abs-middle',
						bottom: 'vd-abs-bottom',
					},
					tablet: {
						reset: 	'',
						left: 	'vd-abs-sm-left',
						center: 'vd-abs-sm-center',
						right: 	'vd-abs-sm-right',
						top: 		'vd-abs-sm-top',
						middle: 'vd-abs-sm-middle',
						bottom: 'vd-abs-sm-bottom',
					},
					mobile: {
						reset: 	'',
						left: 	'vd-abs-xs-left',
						center: 'vd-abs-xs-center',
						right: 	'vd-abs-xs-right',
						top: 		'vd-abs-xs-top',
						middle: 'vd-abs-xs-middle',
						bottom: 'vd-abs-xs-bottom',
					},
				},
			},

			visualDesignerManager: {

			},
			baseWidget: {
				widgetTypes: { 
					'map': 'mapWidget', 
					'card': 'cardWidget',  
					'nav': 'navWidget',  
					'slider': 'sliderWidget',
					'slide': 'slideWidget',
					'nav-cnt': 'navCntWidget',
					'nav-hamburger': 'navHamburgerWidget',
					'bullet-cnt': 'bulletsCntWidget',
					'dropdown': 'dropdownWidget',
					'dd-cnt': 'dropdownCntWidget',
					'wizard': 'wizardWidget',
					'megamenu': 'megaMenuWidget',
					'mm-row': 'megaMenuRowWidget',
					'accordion': 'accordionWidget'
				},
			},
			rowWidget: {
				classes: '',
				menuBtns: {
					"add-column": {
						index: 2,
						isLayout: true,
						icon: "&#xE5C3;",
						popupText: 'Add columns',
						buttonColumns: 3, 
						subMenu: {
							"add-1-column": {
								index: 1,
								popupText: '1 column',
								icon: "&#xE3D0;",	
								callback: function() {
									this.addColumns([12]);
								}
							},
							"add-2-column": {
								index: 2,
								icon: "&#xE3D1;",
								popupText: '2 columns',
								callback: function() {
									this.addColumns([6,6]);
								}
							},
							"add-3-column": {
								index: 3,
								icon: "&#xE3D2;",
								popupText: '3 columns',
								callback: function() {
									this.addColumns([4,4,4]);
								}
							},
							"add-4-column": {
								index: 4,
								icon: "&#xE3D4;",
								popupText: '4 columns',
								callback: function() {
									this.addColumns([3,3,3,3]);
								}
							},
							"add-5-column": {
								index: 5,
								icon: "&#xE3D5;",
								popupText: '5 columns',
								callback: function() {
									this.addColumns([2,2,4,2,2]);
								}
							},
							"add-6-column": {
								index: 6,
								icon: "&#xE3D6;",
								popupText: '6 columns',
								callback: function() {
									this.addColumns([2,2,2,2,2,2]);
								}
							}
						}
					}
				},
			}, 
			columnWidget: {
				columnSizing: {
					desktop: {
						1:  { classes: 'vd-12' },
						2:  { classes: 'vd-11' },
						3:  { classes: 'vd-10' },
						4:  { classes: 'vd-9' },
						5:  { classes: 'vd-8' },
						6:  { classes: 'vd-7' },
						7:  { classes: 'vd-6' },
						8:  { classes: 'vd-5' },
						9:  { classes: 'vd-4' },
						10:  { classes: 'vd-3' },
						11:  { classes: 'vd-2' },
						12:  { classes: 'vd-1' },
					},
					tablet: {
						1:  { classes: 'vd-sm-12' },
						2:  { classes: 'vd-sm-11' },
						3:  { classes: 'vd-sm-10' },
						4:  { classes: 'vd-sm-9' },
						5:  { classes: 'vd-sm-8' },
						6:  { classes: 'vd-sm-7' },
						7:  { classes: 'vd-sm-6' },
						8:  { classes: 'vd-sm-5' },
						9:  { classes: 'vd-sm-4' },
						10:  { classes: 'vd-sm-3' },
						11:  { classes: 'vd-sm-2' },
						12:  { classes: 'vd-sm-1' },
					},
					mobile: {
						1:  { classes: 'vd-xs-12' },
						2:  { classes: 'vd-xs-11' },
						3:  { classes: 'vd-xs-10' },
						4:  { classes: 'vd-xs-9' },
						5:  { classes: 'vd-xs-8' },
						6:  { classes: 'vd-xs-7' },
						7:  { classes: 'vd-xs-6' },
						8:  { classes: 'vd-xs-5' },
						9:  { classes: 'vd-xs-4' },
						10:  { classes: 'vd-xs-3' },
						11:  { classes: 'vd-xs-2' },
						12:  { classes: 'vd-xs-1' },
					},
				},

				menuBtns: {
					"web-design-cmps": {
						// index: 3,
						icon: "&#xE90D;",
						popupText: 'Web Design Components',
						subMenu: {
							"nav": {
								index: 1,
								icon: "&#xE232;",
								popupText: 'Add Navigation Menu',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('navWidget', {}, this.target);
								}
							},
							"map": {
								index: 4,
								faIcon: "fas fa-map-marked",
								popupText: 'Add Map',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('mapWidget', {}, this.target);
								}
							},
							"slider": {
								index: 5,
								hidden: false,
								icon: "view_carousel",
								popupText: 'Add Slider/Carousel',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('sliderWidget', {}, this.target);
								}
							},
							"wizard": {
								index: 6,
								hidden: false,
								icon: "view_carousel",
								popupText: 'Add Wizard',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('wizardWidget', {}, this.target);
								}
							},
							"accordion": {
								index: 7,
								hidden: false,
								icon: "view_carousel",
								popupText: 'Add Accordion',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('accordionWidget', {}, this.target);
								}
							},
						}
					},
				}
			},
			textWidget: {
				classes: '',
			},
			imgWidget: {
				classes: ''
			},
			btnWidget: {
				classes: ''
			},
			videoWidget: {
				classes: ''
			},
			containerWidget: {
				classes: '',
				// Must keep this attribute for use in _create()
				menuBtns: {

				}
			},
			slideWidget: {
				classes: ''
			},
			navWidget: {
				classes: '',
				// Must keep this attribute for use in _create()
				menuBtns: {
				}
			},
			navCntWidget: {
				classes: '',
				// Must keep this attribute for use in _create()
				menuBtns: {
				}
			},
			dropdownCntWidget: {
				classes: ''
			},
			iconWidget: {
			}
		},

		_create: function () {
			$.extend( true, this.options.containerWidget.menuBtns, this.options.columnWidget.menuBtns);
			$.extend( true, this.options.navWidget.menuBtns, this.options.rowWidget.menuBtns);
			$.extend( true, this.options.navCntWidget.menuBtns, this.options.containerWidget.menuBtns);
			$.extend( true, this.options.dropdownCntWidget.menuBtns, this.options.containerWidget.menuBtns);
			$.extend( true, this.options.slideWidget.menuBtns, this.options.slideWidget.menuBtns);

			this._super(); 
		},

		getFrameworkNamespaces: function() {
			var namespaces = this._super();
			namespaces.push('vdw_pc');
			return namespaces;
		},

		vdOnInitialiseFramework: function(e, params) {
			this._super(e, params);
			
			if (this.options.loadIcons)
				$.vdg.manager('loadIcons');
		},

		vdOnResizeColumnWidget: function(e, params) {
			
		}
	});

})( jQuery );;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.accordionWidget", $.vdw.containerWidget, {

		name: "vd-accordion-widget",

		vdType: 'accordion',

		defaults: {
			widgetClass: "vd-accordion-widget",
			tagName: "Accordion",
			sortContainer: '.vd-content-widget',
			template: '',
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {
			var self = this;
			self._super();
			self.getFramework().trigger('vdOnCreateAccordionWidget', {widget: self});
		},

		addDefaultContent: function() {
			this.header = $.vdg.widgetFactory('textWidget', {template: '<span>Acordion Header</span>'}, this.element, '<h3></h3>');
			this.header.attr('onmouseup', 'jQuery(this).siblings(".vd-acc-cnt").toggleClass("vd-triggered");');

			this.cnt = $.vdg.widgetFactory('containerWidget', {classes: 'vd-collapsible vd-acc-cnt vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden'}, this.element);
		}

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.cardWidget", $.vdw.containerWidget, {

		name: "vd-card-widget",

		vdType: 'card',

		defaults: {
			widgetClass: "vd-card-widget",
			template: '',
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this._super();
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.dropdownCntWidget", $.vdw.containerWidget, {

		name: "vd-dd-cnt-widget",

		vdType: 'dd-cnt',

		defaults: {
			widgetClass: "vd-dd-cnt-widget",
			tagName: 'Dropdown-Container',
			template: '',
			sortContainer: '.vd-content-widget', //.vd-dd-cnt-widget ',
			// tagOptions: {
			// 	label: '', //<small></small>',
			// },
			menuBtns: {
				"set-dimensions": {
					index: 94,
					isLayout: true,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					input: {
						type: 'dimensionsInput',
						icon: "&#xE85B;",
						callback: function(values, target) {
							return this.onSetDimensions(values, target);
						},
						show: function() {
							var self = this;
							return {
								width: self.element.attr('vd-width'),
								height: self.element.attr('vd-height')
							};
						}
					}
				},
				'clone': {
					hidden: true,
				},
				"style": {
					subMenu: {
						"align": {
							hidden: true,
						},
					}
				},
				'web-design-cmps': {
					hidden: true,
				},
				'link': {
					hidden: true,
				},
				'trash': {
					hidden: true,
				},
			}
		},

		_create: function () {
			// this.options.tagName = 'Dropdown-Container';
			this.options.disableSorting = true;
			this._super();
		},

		// showTag: function() {
		// 	this.options.tagOptions.label = (this.element.hasClass('vd-collapsable')) ? '<br/><small>Collapses on mobile and tablet</small>' : '';
		// 	this.options.tagOptions.classes = (this.element.hasClass('vd-collapsable')) ? 'vd-dynamic' : '';
		// 	return this._super();
		// },
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.dropdownWidget", $.vdw.btnWidget, { //, $.vdw.containerWidget, { //

		name: "vd-dropdown-widget",

		vdType: 'dropdown',

		defaults: {
			widgetClass: "vd-dropdown-widget",
			tagName: 'Dropdown',
			sortContainer: '.vd-content-widget',
			template: '<a href="#" class="vd-btn-widget" vd-target><span>Dropdown Btn</span></a>',
			menuBtns: {
				"dd-controls": {
					index: -1,
					isLayout: true,
					faIcon: "fas fa-caret-down",
					popupText: 'Dropdown controls',
					subMenu: {
						"hover-show": {
							index: 1,
							faIcon: "fas fa-mouse-pointer",
							popupText: 'Toogle hover show<br/><small>Make dropdown show on mouse hover</small>',
							callback: function(btn, btnOptions) {
								this.toggleHoverShow();
							}
						}
					}
				},
			}
		},

		_create: function () {
			var self = this;
			// self.target = self.element.children('label').first;
			self._super();

			// self.target = self.element.children('a').first();

			self.getFramework().trigger('vdOnCreateDropdownWidget', {widget: self});
		},

		addDefaultContent: function() {
			this._super();

			this.element.addClass('vd-dropdown-hover');

			// $.vdg.widgetFactory('btnWidget', {sortContainer: null, /*classes: 'vd-right vd-desktop-hidden', template: '<span>MENU</span>'*/}, this.element, '<a></a>').attr('onmouseup', 'jQuery(this).siblings(".vd-collapsable").toggleClass("vd-triggered");').btnWidget('onAddIcon', {}, {});

			this.target.attr('onmouseup', 'jQuery("[vd-type=\'dropdown\'],[vd-type=\'megamenu\']").not(jQuery(this).parent()).children(".vd-triggered").toggleClass("vd-triggered");jQuery(this).siblings(".vd-collapsable").toggleClass("vd-triggered");');

			$.vdg.widgetFactory('iconTxt', {
				sortContainer: null,
				disableEdit: true,
				defer: false,
				select: false, 
				template: '', // must be empty to override default template
				classes: 'fas fa-angle-down',
				menuBtns: {
					"toggle-position": {
						'hidden': false,
					},
				}
			}, this.target, '<span></span>', false);

			this.ddCnt = this.addDefaultDDCntContent(); 

			// this.addDefaultDDCntContent();

			// $.vdg.widgetFactory('btnWidget', {template: '<span>Service 1</span>',}, ddCnt, '<a></a>');
			// $.vdg.widgetFactory('btnWidget', {template: '<span>Service 2</span>',}, ddCnt, '<a></a>');
			// $.vdg.widgetFactory('btnWidget', {template: '<span>Service 3</span>',}, ddCnt, '<a></a>');

			// var chkId = $.vdg.manager('generateId', this.getDesigner().attr('id'));
			// var chkBx = $('.vd-dd-toggle', this.element);
			// // var lbl = $.vdg.widgetFactory('textWidget', {
			// // 		classes: 'vd-dropdown-label',
			// // 		template: '<span>Dropdown label</span>'
			// // 	}, this.element); 
			// var menu = $.vdg.widgetFactory('containerWidget', { 
			// 		classes: 'vd-dropdown-menu'
			// 	}, this.element); 

			// chkBx.attr('id', chkId);
			// this.target.attr('for', chkId);
			// lbl.vdPolymorphic('getTarget').attr('for', chkId);
			// lbl.vdPolymorphic('type', lbl.vdPolymorphic('subElement'), 'label', true );
			// lbl.vdPolymorphic('setSubType', 'label', true);
		},

		addDefaultDDCntContent: function() {
			this.ddCnt = $.vdg.widgetFactory('dropdownCntWidget', {sortContainer: '.vd-dd-cnt-widget', classes: 'vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden vd-collapsable', /*template: '<span>MENU</span>'*/}, this.element, '<div></div>');
			$.vdg.widgetFactory('btnWidget', {template: '<span>Service 1</span>',}, this.ddCnt, '<a></a>');
			$.vdg.widgetFactory('btnWidget', {template: '<span>Service 2</span>',}, this.ddCnt, '<a></a>');
			$.vdg.widgetFactory('btnWidget', {template: '<span>Service 3</span>',}, this.ddCnt, '<a></a>');
			return this.ddCnt;
		},

		onAlignChange: function(values, target) {
			return $.vdw.contentWidget.prototype.onAlignContentChange.call( this, values, target );
		},

		toggleHoverShow: function() {
			this.element.toggleClass('vd-dropdown-hover');
		},

		// onMarginChange: function(values, target) {
		// 	// Need to style outer div NOT target div
		// 	var self = this;
		// 	var undoOps = [];

		// 	$.each(values, function(key, value) {
		// 		undoOps.push( self.styleElement(self.element, key, value, true) );
		// 	});

		// 	$.vdg.undoWidget('registerUndo', undoOps);
		// },
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.headlineWidget", $.vdw.containerWidget, {

		name: "vd-headline-widget",

		vdType: 'headline',

		defaults: {
			widgetClass: "vd-headline-widget",
			template: '',
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this._super();
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.heroImgWidget", $.vdw.containerWidget, {

		name: "vd-hero-img-widget",

		vdType: 'hero',

		defaults: {
			widgetClass: "vd-hero-img-widget",
			template: '',
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this._super();
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.mapWidget", $.vdw.overlayWrapWidget, {

		name: "vd-map-widget",

		vdType: 'map',

		defaults: {
			widgetClass: "vd-map-widget",
			tagName: 'Map',
			template: '<div></div>',
			sortContainer: '.vd-content-widget',
			menuBtns: {
				"set-location": {
					index: 1,
					isLayout: true,
					icon: "&#xE55B;",
					popupText: 'Set location',
					autoPreview: true,
					input: {
						type: 'inputMenu',
						popupText: 'Set location <br><small>Paste your google embed (IFRAME) code directly here to set the location</small>',
						tooltip: '',
						selectAll: true,
						icon: "&#xE55B;",
						callback: function(value, target) {
							
							return this.onSetLocation(value, target);
						},
						show: function() {
							return $('iframe', this.element).attr('src');
						}
					}
				},
				"set-dimensions": {
					index: 2,
					isLayout: true,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					input: {
						type: 'dimensionsInput',
						popupText: 'Resize map',
						icon: "&#xE85B;",
						callback: function(values, target) {
							
							return this.onSetDimensions(values, target);
						},
						show: function() {
							var self = this;
							return {
								width: self.attr('vd-width'),
								height: self.attr('vd-height')
							};
						}
					}
				},
				"toggle-fullscreen": {
					index: 3,
					isLayout: true,
					icon: "&#xE5D0;",
					popupText: 'Toggle fullscreen ability',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.onToggleFullscreen(btn, btnOptions);
					}
				},
				'link': {
					hidden: true
				}
			}
		},

		_create: function () {
			this._super();
			// this.element.addClass('vd-map-widget');

			// this.element.children('iframe').first().on($.vdg.manager('btnBindEvt'), function(e) {
			//     e.stopPropagation();
			//     self.select(e);
			// });

			this.getFramework().trigger('vdOnCreateMapWidget', {widget: this});
		},

		addDefaultContent: function() {

			var iframe = $('<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d848295.9883997418!2d150.37147459388663!3d-33.84697571100512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b129838f39a743f%3A0x3017d681632a850!2sSydney%20NSW!5e0!3m2!1sen!2sau!4v1581116263287!5m2!1sen!2sau" frameborder="0" style="border:0" allowfullscreen></iframe>')
				.appendTo(this.element);
		},

		onSetLocation: function(values, target) {
			try {
				var regex = /src=("|')(.*)("|')/gi;
				var src = regex.exec(values['set-location'])[2];
				$('iframe', this.element).attr('src', src);
			}
			catch (ex) {
				console.log(ex.message);
			}
		},

		onToggleFullscreen: function(btn, btnOptions) {
			var allowFullscreen = $('iframe', this.element).attr('allowfullscreen').toLowerCase() == 'true';
			$('iframe', this.element).attr('allowfullscreen', !allowFullscreen);
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.megaMenuWidget", $.vdw_pc.dropdownWidget, {

		name: "vd-megamenu-widget",

		vdType: 'megamenu',

		defaults: {
			widgetClass: "vd-megamenu-widget",
			tagName: 'Mega-Menu',
			sortContainer: '.vd-content-widget',
			template: '<a href="#" class="vd-btn-widget" vd-target><span>Mega Menu</span></a>',
			menuBtns: {
				
			}
		},

		_create: function () {
			var self = this;
			self._super();
			self.element.removeClass('vd-dropdown-hover');
			self.getFramework().trigger('vdOnCreateMegaMenuWidget', {widget: self});
		},

		// addDefaultContent: function() {
		// 	this._super();
		// },

		addDefaultDDCntContent: function() {
			this.ddCnt = $.vdg.widgetFactory('megaMenuRowWidget', {}, this.element, '<div></div>');
			var row = this.ddCnt.vdPolymorphic('getTarget');

			var cols = 4;
			var btns = 3;
			for (var i=0; i<cols; i++) {
				var col = $.vdg.widgetFactory('columnWidget', {
					colWidth: {
						desktop: 3,
						tablet: 3,
						mobile: 6,
					},
				}, row);
				$.vdg.widgetFactory('textWidget', {classes: 'vd-header', template: '<span>Heading</span>'}, col, '<p></p>');
				for (var j=0; j<btns; j++) {
					$.vdg.widgetFactory('btnWidget', {}, col, '<a></a>');
				}
			}

			return this.ddCnt;
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.megaMenuRowWidget", $.vdw.rowWidget, {

		name: "vd-mm-row-widget",

		vdType: 'mm-row',

		defaults: {
			widgetClass: "vd-mm-row-widget",
			tagName: 'Mega-Container',
			template: '<div class="vd-section-container vd-ignore"><div class="vd-row-widget vd-c-left" vd-target="true"></div></div>',
			sortContainer: '.vd-content-widget',
			menuBtns: {
				'clone': {
					hidden: true,
				},
				"style": {
					subMenu: {
						"align": {
							hidden: true,
						},
					}
				},
				'web-design-cmps': {
					hidden: true,
				},
				'link': {
					hidden: true,
				},
				'trash': {
					hidden: true,
				},
			}
		},

		_create: function () {
			this.options.disableSorting = true;
			this.element.addClass('vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden vd-collapsable');
			this._super();

			this.target = this.element.find('.vd-section-container > .vd-row-widget').first();
			this.element.attr('vd-style-identifier', '#' + this.element.attr('id'));
		},
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.navCntWidget", $.vdw.columnWidget, {

		name: "vd-nav-cnt-widget",

		vdType: 'nav-cnt',

		defaults: {
			widgetClass: "vd-nav-cnt-widget",
			tagName: 'Nav-Container',
			template: '<span>hggj</span>',
			sortContainer: '.vd-content-widget', //.vd-nav-cnt-widget ',
			tagOptions: {
				label: '', //<small></small>',
			},
			menuBtns: {
				"nav-controls": {
					index: -1,
					isLayout: true,
					icon: "&#xE232;",
					popupText: 'Navigation controls',
					subMenu: {
						"collapsable": {
							index: 1,
							icon: "unfold_less",
							popupText: 'Toogle collapsable<br/><small>Make container collapse on mobile and tablet</small>',
							callback: function(btn, btnOptions) {
								this.toggleCollapsable();
							}
						},
						"hamburger-root": {
							index: 2,
							icon: "menu_open",
							popupText: 'Move hamburger menu here<br/><small>Make hamburger menu display in this container on mobile and tablet</small>',
							callback: function(btn, btnOptions) {
								this.makeHamburgerRoot();
							}
						},
						"stretch": {
							index: 3,
							icon: "unfold_less",
							popupText: 'Toggle stretch inner widgets',
							callback: function(btn, btnOptions) {
								this.element.toggleClass('vd-c-stretch');
							}
						},
						"toggle-direction": {
							index: 4,
							icon: "&#xE40F;",
							popupText: 'Toggle display direction <br/><small>Display content horizontally or vertically</small>',
							autoPreview: true,
							isLayout: true,
							callback: function(btn, btnOptions) {

								return this.onToggleContentDirChange(btn, btnOptions);
							}
						},
					}
				},
				"dynamic": {
					hidden: true,
				},
				"foundation-cmps": {
					subMenu: {	
						"add-dropdown": {
							index: 1,
							// hidden: true,
							faIcon: "fas fa-caret-down",
							popupText: 'Add Dropdown menu',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddDropdown(btn, btnOptions);
							}
						},
						"add-megamenu": {
							index: 2,
							// hidden: true,
							faIcon: "fas fa-caret-square-down",
							popupText: 'Add Mega Menu',
							autoPreview: true,
							callback: function(btn, btnOptions) {

								return this.onAddMegaMenu(btn, btnOptions);
							}
						},
					}
				},
				"web-design-cmps": {
					hidden: true,
				},
				"wp-cmps": {
					// index: 3,
					faIcon: "fa-wordpress",
					popupText: 'Wordpress Components',
					subMenu: {
					}
				},
				"toggle-fill": {
					index: 2,
					hidden: true,
					icon: "&#xE40F;",
					popupText: 'Toggle fill display',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.onToggleFillChange(btn, btnOptions);
					}
				},
				"link": {
					hidden: true,
				},
				'clone': {
					hidden: true,
				},
			}
		},

		_create: function () {
			this.options.tagName = 'Nav-Container';
			this.element.addClass('vd-horz vd-c-stretch');
			this._super();
		},

		onTrash: function(btn, btnOptions) {
			var self = this;
			var containsHamburger = this.element.find('a > [vd-type="nav-hamburger"]').length > 0;
			console.log('containsHamburger', containsHamburger);
			if (containsHamburger) {
				return $.vdg.widgetFactory('modalWidget', {
              title: "",
              content: '<br/><h3>Unable to delete Nav Container</h3><p>Because this Nav Container contains the hamburger menu toggle.</p><br/><br/>'
          }, self.getDesigner());
			}

			this.trash();
		},

		onAddDropdown: function(btn, btnOptions) {
			return $.vdg.widgetFactory('dropdownWidget', {}, this.element); //, '<a></a>');
		},

		onAddMegaMenu: function(btn, btnOptions) {
			return $.vdg.widgetFactory('megaMenuWidget', {}, this.element); //, '<a></a>');
		},

		showTag: function() {
			this.options.tagOptions.label = (this.element.hasClass('vd-collapsable')) ? '<br/><small>Collapses on mobile and tablet</small>' : '';
			this.options.tagOptions.classes = (this.element.hasClass('vd-collapsable')) ? 'vd-dynamic' : '';
			return this._super();
		},

		toggleCollapsable: function(btn, btnOptions) {
			var self = this;
			var nNavCnts = this.element.siblings('.vd-nav-cnt-widget').length;
			var nCollapsable = this.element.siblings('.vd-nav-cnt-widget.vd-collapsable').length;
			var containsHamburger = this.element.find('[vd-type="nav-hamburger"]').length > 0;
			console.log('containsHamburger', containsHamburger);

			if (nCollapsable >= nNavCnts && !this.element.hasClass('vd-collapsable')) {
				return $.vdg.widgetFactory('modalWidget', {
              title: "",
              content: '<br/><h3>Unable to make collapsable</h3><p>You cannot make all Nav Containers collapsable. You need atleast one Nav Container visible to display the hamburger menu toggle.</p><br/><br/>'
          }, self.getDesigner());
			}
			if (containsHamburger) {
				// Find next available navcnt and move into that
				var adjNavCnts = this.element.siblings('.vd-nav-cnt-widget:not(.vd-collapsable)');
				if (adjNavCnts.length) {
					console.log('Moving hamburger to next available navcnt');
					adjNavCnts.first().vdPolymorphic('makeHamburgerRoot', {}, {});
				}
				else {
					return $.vdg.widgetFactory('modalWidget', {
              title: "",
              content: '<br/><h3>Unable to make collapsable</h3><p>Because this Nav Container contains the hamburger menu toggle.</p><br/><br/>'
          }, self.getDesigner());
				}
			}
			
			if (this.element.hasClass('vd-collapsable')) {
				this.element.removeClass('vd-collapsable vd-slide-v-d vd-desktop-no-anim vd-tablet-hidden vd-mobile-hidden');
				this.element.addClass('vd-horz vd-sm-horz vd-xs-horz');
			}
			else {
				this.element.addClass('vd-collapsable vd-slide-v-d vd-desktop-no-anim vd-tablet-hidden vd-mobile-hidden');
				this.element.removeClass('vd-sm-horz vd-xs-horz');
			}

			this.showTag();
		},

		makeHamburgerRoot: function(btn, btnOptions) {
			var self = this;
			if (this.element.hasClass('vd-collapsable')) {
				return $.vdg.widgetFactory('modalWidget', {
              title: "",
              content: '<br/><h3>Unable to move hamburger menu toggle here</h3><p>A hamburger menu toggle cannot be placed inside a collapsable Nav Container.</p><br/><br/>'
          }, self.getDesigner());
			}

			// Find hamburger in adjacent navCnt widgets and move here
			var hamburgerWidget = this.element.siblings('.vd-nav-cnt-widget').find('[vd-type="nav-hamburger"]').first();
			// var hamburgerCnt = hamburgerWidget;
			hamburgerWidget.appendTo(this.element);
		},

		onAlignContentChange: function(values, target, prop) {
			this._super(values, target, prop);
			var hamburger = this.element.find('[vd-type="nav-hamburger"]');

			if (!hamburger || !hamburger.length)
				return;

			// this.element.removeClass('vd-abs-left vd-abs-right');
			values = values ? values.trim().toLowerCase() : '';

			switch (values)
			{
				case 'left': 
				{ 
					hamburger.removeClass('vd-abs-left vd-abs-right');
					hamburger.addClass('vd-abs-right');
				} 
				break;
				case 'right': 
				{ 
					hamburger.removeClass('vd-abs-left vd-abs-right');
					hamburger.addClass('vd-abs-left');
				} 
				break;
				default: 
				{
					
				} 
				break;
			}
		},

		onToggleContentDirChange: function(btn, btnOptions) {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			var alignmentCls = this.framework('option', 'alignments').self[view].halign;
			this.element.toggleClass(alignmentCls);
		},
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.navHamburgerWidget", $.vdw.btnWidget, {

		name: "vd-nav-hamb-widget",

		vdType: 'nav-hamburger',

		defaults: {
			widgetClass: "vd-nav-hamb-widget",
			classes: 'vd-right',
			tagName: 'Nav-Hamburger',
			// template: '<i class="material-icons">dehaze</i>',
			sortContainer: '.vd-nav-cnt-widget',
			menuBtns: {
				// "toggle-menu-btn": {
				// 	index: 2,
				// 	isLayout: true,
				// 	icon: "swap_horiz",
				// 	popupText: 'Toggle menu button position (left or right) <br/><small>Change view mode to Tablet or Mobile to see the menu button position change</small>',
				// 	callback: function(btn, btnOptions) {

				// 		return this.onToggleMenuBtnPosition(btn, btnOptions);
				// 	}
				// },
				"align-self": {
					index: 2,
					icon: "&#xE234;",
					popupText: 'Align hamburger btn',
					input: {
						type: 'radioInput',
						menuBtns: {
							'reset': {
								name: 'reset',
								popupText: 'reset',
								faIcon: 'fas fa-eraser'
							},
							'left': {
								name: 'left',
								popupText: 'Left',
								icon: '&#xE236;'
							},
							// 'center': {
							// 	name: 'center',
							// 	popupText: 'Center',
							// 	icon: '&#xE234;'
							// },
							'right': {
								name: 'right',
								popupText: 'Right',
								icon: '&#xE237;'
							}
						},
						callback: function(values, target) {
							return this.onAlignChange(values, target);
						},
						show: function() {
							return this.target.css('text-align');
						}
					}
				},
				'clone': {
					hidden: true,
				},
				"style": {
					subMenu: {
						"align": {
							hidden: true,
						},
					}
				},
				'trash': {
					hidden: true,
				},
			}
		},

		_create: function () {
			// this.options.tagName = 'Nav-Hamburger';
			this._super();
		},

		addDefaultContent: function() {
			this._super();
			// this.toggleAnchor({link: '#'});
			// this.element.parent('a[vd-link="true"]').first()
			// 	.addClass('vd-ignore')
			// 	.attr('vd-preserve' , true);

			// this.element.addClass('vd-right');

			$.vdg.widgetFactory('iconTxt', {
				sortContainer: null,
				disableEdit: true,
				defer: false,
				select: false, 
				template: '', // must be empty to override default template
				classes: 'fas fa-bars',
				menuBtns: {
					"toggle-position": {
						'hidden': false,
					},
				}
			}, this.target, '<span></span>', true);
		},

		onToggleMenuBtnPosition: function(btn, btnOptions) {
			if (this.element.hasClass('vd-left')) {
				this.element.appendTo(this.element.parent());
			}
			else {
				this.element.prependTo(this.element.parent());
			}

			this.element.toggleClass('vd-right vd-left');
		},

		onAlignChange: function(values, target, prop) {
			this.element.removeClass('vd-abs-left vd-abs-right');
			values = values ? values.trim().toLowerCase() : '';

			switch (values)
			{
				case 'left': 
				{ 
					this.element.addClass('vd-abs-left');
					this.parent().vdPolymorphic('onAlignContentChange', 'right', target);
				} 
				break;
				case 'right': 
				{ 
					this.element.addClass('vd-abs-right'); 
					this.parent().vdPolymorphic('onAlignContentChange', 'left', target);
				} 
				break;
				default: 
				{
					this.parent().vdPolymorphic('onAlignContentChange', 'center', target);
				} 
				break;
			}
		},
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.navWidget", $.vdw.rowWidget, {

		name: "vd-nav-widget",

		vdType: 'nav',

		// .pure-menu-fixed

		defaults: {
			widgetClass: "vd-nav-widget",
			colWidgetType: 'navCntWidget',
			tagName: 'Nav',
			template: '',
			sortContainer: '.vd-nav-widget',
			// sortContainer: '.vd-content-widget',
			menuBtns: {
				"toggle-menu-fixed": {
					index: 1,
					isLayout: true,
					icon: "vertical_align_top",
					popupText: 'Toggle nav fixed or static',
					callback: function(btn, btnOptions) {

						return this.onToggleSticky(btn, btnOptions);
					}
				},
				// "toggle-menu-dir": {
				// 	index: 1,
				// 	isLayout: true,
				// 	icon: "swap_vert",
				// 	popupText: 'Toggle menu slide direction',
				// 	callback: function(btn, btnOptions) {

				// 		return this.onToggleMenuDir(btn, btnOptions);
				// 	}
				// },
				// "toggle-menu-dir-horz": {
				// 	index: 1,
				// 	icon: "&#xe1b0;",
				// 	popupText: 'Toggle menu slide from left or right',
				// 	callback: function(btn, btnOptions) {

				// 		return this.onToggleHDir(btn, btnOptions);
				// 	}
				// },
				// "show-menu-on-desktop": {
				// 	index: 1,
				// 	icon: "&#xe1b0;",
				// 	popupText: 'Toggle display menu toggle on desktop',
				// 	callback: function(btn, btnOptions) {

				// 		return this.onToggleDesktopMenu(btn, btnOptions);
				// 	}
				// },
				// "style": {
				// 	subMenu: {
				// 		"padding": {
				// 			hidden: true,
				// 		}
				// 	}
				// }
			},
		},

		_create: function () {
			this._super();
			// this.element.addClass('vd-nav-vert');

			// this.element.attr('onresize', 'alert("foo");jQuery(this).find(".vd-collapsable.vd-triggered").removeClass("vd-triggered");');
		},

		addColumns: function (columns, target) {
			var self = this;
			var nNavCnts = this.element.children('.vd-nav-cnt-widget').length;
			var triggered = this.element.children('.vd-collapsable.vd-triggered').length > 0;
			// var nCollapsable = this.element.children('.vd-nav-cnt-widget.vd-collapsable').length;

			var colWidgets = this._super(columns, target);
			$.each(colWidgets, function(i, ele) {
				// There the nav was empty; we don't want to make the first nav collapsable
				if (i == 0 && nNavCnts <= 0) {
					// Add hamburger
					self.addNavHamburger($(this));
					return;
				}

				$(this).addClass('vd-collapsable vd-desktop-no-anim vd-tablet-hidden vd-mobile-hidden vd-c-center vd-c-middle vd-c-sm-left'); // vd-slide-v-d vd-desktop-no-anim ');

				if (triggered)
					$(this).addClass('vd-triggered');
			});
		},

		addDefaultContent: function() {
			this._super();

			var left = $.vdg.widgetFactory('navCntWidget', {
					classes: 'vd-c-left vd-c-middle vd-sm-horz vd-xs-horz',
					colWidth: {
						desktop: 3,
						tablet: 12,
						mobile: 12,
					},
				}, this.element); 
			var right = $.vdg.widgetFactory('navCntWidget', {
					// classes: 'vd-collapsable vd-c-right vd-c-middle vd-tablet-hidden vd-mobile-hidden',
					classes: 'vd-collapsable vd-c-right vd-c-middle vd-c-sm-left vd-slide-v-d vd-desktop-no-anim vd-tablet-hidden vd-mobile-hidden',
					colWidth: {
						desktop: 9,
						tablet: 12,
						mobile: 12,
					},
				}, this.element); 

			$.vdg.widgetFactory('imgWidget', {}, left, '<img/>');
			this.addNavHamburger(left);
			$.vdg.widgetFactory('btnWidget', {template: '<span>About</span>',}, right, '<a></a>');
			$.vdg.widgetFactory('btnWidget', {template: '<span>Contact</span>',}, right, '<a></a>');
			left.removeClass('vd-force-dimensions');
			right.removeClass('vd-force-dimensions');
		},

		addNavHamburger: function(parent) {
			var hamb = $.vdg.widgetFactory('navHamburgerWidget', {classes: 'vd-desktop-hidden vd-abs-right', template: '<span>MENU</span>'}, parent, '<a></a>').attr('onmouseup', 'jQuery(this).closest("[vd-type=\'nav-cnt\']").siblings(".vd-collapsable").toggleClass("vd-triggered").find(".vd-triggered").removeClass("vd-triggered");'); // animate__slideInLeft animate__slideOutLeft
			
			// console.log('res', $('[vd-type="iconTxt"]', hamb));
			// $('[vd-type="iconTxt"]', hamb).attr('onmouseup', 'jQuery(this).closest("[vd-type=\'nav-cnt\']").siblings(".vd-collapsable").toggleClass("vd-triggered");');
		},

		onToggleSticky: function(btn, btnOptions) {
			// WONT WORK BECAUSE PARENTS have position: relative!!!!
			// $('.vd-nav-menu-2', this.element).toggleClass('vd-nav-fixed-top');

			// Easy way of making nav sticky
			this.element.closest('.vd-release').toggleClass('vd-nav-sticky');
		},

		// onToggleDesktopMenu: function(btn, btnOptions) {
		// 	this.element.toggleClass('vd-nav-responsive-style');
		// },

		onToggleMenuDir: function(btn, btnOptions) {
			// var menu = $('.vd-nav-menu-2', this.element);
			// menu.toggleClass('vd-nav-menu-horz');
			// menu.toggleClass('vd-nav-menu-vert');

			// if (menu.hasClass('vd-nav-menu-vert')) {
			// 	menu.removeClass('vd-nav-menu-horz-left vd-nav-menu-horz-right');
			// }
			// else {
			// 	menu.addClass('vd-nav-menu-horz-left');
			// }

			var menuBtn = $('.vd-nav-cnt2', this.element);
			menuBtn.toggleClass('vd-nav-vert vd-nav-horz');
		},

		onToggleHDir: function(btn, btnOptions) {
			var menu = $('.vd-nav-menu-2', this.element);

			if (!menu.hasClass('vd-nav-menu-horz'))
				return false;

			menu.toggleClass('vd-nav-menu-horz-left');
			menu.toggleClass('vd-nav-menu-horz-right');
		},

		_upgrade1_2: function() {
			// console.log('^^^^^^^^^^^^^^^^^^^^upgrading NAV', this);
			var self = this;
			self._super();

			this.element.removeClass('vd-row-widget vd-nav-vert');

			// Remove not needed <input checkbox>
			this.element.children('.vd-menu-toggle').remove();

			// Update collapsable classes
			this.element.children('.vd-collapsable').addClass('vd-tablet-hidden vd-mobile-hidden vd-desktop-no-anim vd-pre-1-2').removeClass('vd-column-widget');

			// Add hamburger to 
			var existingHamb = this.element.children('[vd-type="nav-cnt"]').find('[vd-type="nav-hamburger"]').first();
			var existingHambCnt = existingHamb.parent();
			var existingHambIcon = existingHamb.children('i').first();

			var hamb = $.vdg.widgetFactory('navHamburgerWidget', {classes: 'vd-desktop-hidden vd-abs-right', template: ''}, existingHambCnt.closest('[vd-type="nav-cnt"]').first(), '<a></a>').attr('onmouseup', 'jQuery(this).closest("[vd-type=\'nav-cnt\']").siblings(".vd-collapsable").toggleClass("vd-triggered");');

			hamb.children('[vd-type="iconTxt"]').first().attr('id', existingHambIcon.attr('id'));

			if (existingHambCnt.is('a[vd-type="link"]'))
				existingHambCnt.remove();
		}
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.slideWidget", $.vdw.columnWidget, {

		name: "vd-slide-widget",

		vdType: 'slide',

		defaults: {
			interval: null, //10000,
			tagName: 'Slide',
			widgetClass: "vd-slide",
			sortContainer: false,
			template: '',
			menuBtns: {
				"web-design-cmps": {
					hidden: true,
				},
				// "clone": {
				// 	hidden: true,
				// },
			},
			'toggle-direction': {
				hidden: true
			},
		},

		sliderNum: -1,

		_create: function () {
			this.options.sortContainer = false; // disallow sorting
			// this.element.addClass('vd-slide-widget');
			this._super();
		},

		trash: function(dontUndo) {
			this.element.closest('.vd-slider-widget').vdPolymorphic('onTrashSlide', this, dontUndo);
			this._super(dontUndo);
		},

		cloneWidget: function() {
			var clone = this._super();
			this.element.closest('.vd-slider-widget').vdPolymorphic('onCloneSlide', this);
			clone.addClass("vd-triggered")[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
			setTimeout(function() {
				clone.vdPolymorphic('select');
			}, 10);
		}

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.bulletsCntWidget", $.vdw.containerWidget, {

		name: "vd-bullet-cnt-widget",

		vdType: 'bullet-cnt',

		defaults: {
			tagName: 'Bullets Cnt',
			widgetClass: "vd-bullet-cnt-widget",
			sortContainer: false,
			// template: '',
			menuBtns: {
				"foundation-cmps": {
					hidden: true,
				},
				"structural-cmps": {
					hidden: true,
				},
				"web-design-cmps": {
					hidden: true,
				},
				"wp-cmps": {
					hidden: true,
				},
				"clone": {
					hidden: true,
				},
				"lock": {
					hidden: true,
				},
				"link": {
					hidden: true,
				},
				"trash": {
					hidden: true,
				},

				"align-self": {
					index: 1,
					icon: "&#xE234;",
					popupText: 'Align self',
					input: {
						type: 'radioInput',
						menuBtns: {
							'reset': {
								name: 'reset',
								popupText: 'reset',
								faIcon: 'fas fa-eraser'
							},
							'left': {
								name: 'left',
								popupText: 'Left',
								icon: '&#xE236;'
							},
							'right': {
								name: 'right',
								popupText: 'Right',
								icon: '&#xE237;'
							},
							'top': {
								name: 'top',
								popupText: 'top',
								icon: '&#xe25a;'
							},
							'bottom': {
								name: 'bottom',
								popupText: 'bottom',
								icon: '&#xe258;'
							}
						},
						callback: function(values, target) {
							return this.onAlignChange(values, target);
						},
						show: function() {
							return this.target.css('text-align');
						}
					}
				},
				"style": {
					subMenu: {
						"align-self": {
							index: 7,
							icon: "&#xE234;",
							popupText: 'Align self',
							input: {
								type: 'radioInput',
								menuBtns: {
									'reset': {
										name: 'reset',
										popupText: 'reset',
										faIcon: 'fas fa-eraser'
									},
									'left': {
										name: 'left',
										popupText: 'Left',
										icon: '&#xE236;'
									},
									'right': {
										name: 'right',
										popupText: 'Right',
										icon: '&#xE237;'
									},
									'top': {
										name: 'top',
										popupText: 'top',
										icon: '&#xe25a;'
									},
									'bottom': {
										name: 'bottom',
										popupText: 'bottom',
										icon: '&#xe258;'
									}
								},
								callback: function(values, target) {
									return this.onAlignChange(values, target);
								},
								show: function() {
									return this.target.css('text-align');
								}
							}
						},
					}
				}
			},
		},


		_create: function () {
			this.options.sortContainer = false; // disallow sorting
			this.element.addClass('vd-slider-bullets');
			this._super();
		},

		onAlignChange: function(values, target, prop) {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			this.resetAlignment(view, true, true, 'absolute');
			var alignmentCls = this.framework('option', 'alignments').absolute[view][values];
			this.element.addClass(alignmentCls);

			switch (values.trim().toLowerCase())
			{
				case 'left':
				case 'right':
				{
					this.element.removeClass('vd-horz');
					this.parent().vdPolymorphic('alignArrowsVertical');
				}
				break;
				case 'top':
				case 'bottom':
				{
					this.element.addClass('vd-horz');
					this.parent().vdPolymorphic('alignArrowsHorizontal');
				}
				break;
				default: {} break;
			}
		},
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.sliderWidget", $.vdw.rowWidget, {

		name: "vd-slider-widget",

		vdType: 'slider',

		defaults: {
			interval: null, //10000,
			widgetClass: "vd-slider-widget",
			sortContainer: '.vd-slider-widget',
			tagName: 'Slider',
			template: '<div class="vd-row-widget" vd-target></div><div class="vd-overlay"></div>', //<div class="vd-slider-cnt"></div><div class="vd-arrows"></div><div class="vd-bullets"></div>',
			menuBtns: {
				"add-slide": {
					index: 1,
					icon: "&#xE8D8;",
					popupText: 'Add slide',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.addSlide();
					}
				},
				"slider-controls": {
					index: 2,
					isLayout: true,
					icon: "&#xE232;",
					popupText: 'Navigation controls',
					subMenu: {
						"toggle-direction": {
							index: 2,
							icon: "&#xE40F;",
							popupText: 'Toggle horizontal or vertical slider',
							autoPreview: true,
							isLayout: true,
							callback: function(btn, btnOptions) {
								return this.onToggleSliderDirection(btn, btnOptions);
							}
						},
						"toggle-bullets": {
							index: 3,
							isLayout: true,
							faIcon: "far fa-dot-circle",
							popupText: 'Toggle bullets',
							callback: function(btn, btnOptions) {

								return this.onToggleBullets(btn, btnOptions);
							}
						},
						"toggle-indicators": {
							index: 4,
							isLayout: true,
							faIcon: "fas fa-chevron-up",
							popupText: 'Toggle indicators',
							callback: function(btn, btnOptions) {

								return this.onToggleIndicators(btn, btnOptions);
							}
						},
						"toggle-fullpage": {
							index: 5,
							isLayout: true,
							faIcon: "fas fa-chevron-up",
							popupText: 'Toggle full page',
							callback: function(btn, btnOptions) {

								return this.onToggleFullPage(btn, btnOptions);
							}
						},
						"toggle-drag": {
							index: 7,
							isLayout: true,
							faIcon: "fas fa-chevron-up",
							popupText: 'Toggle slide on mouse drag',
							callback: function(btn, btnOptions) {
								return this.onToggleDrag(btn, btnOptions);
							}
						},
						"slider-interval": {
							index: 8,
							icon: "&#xE3BE;",
							popupText: 'Set automatic slide interval',
							isLayout: true,
							input: {
								type: 'sliderInput',
								icon: "&#xE3BE;",
								popupText: 'Set automatic slide interval',
								value: 0,
								min: 0,
								max: 15,
								step: 1,
								callback: function(values) {
									this.setInterval(values);
								},
								// show: function() {
								// 	return this.element.attr($.vdg.manager().viewMode+'-width');
								// }
							},
						},
					}
				},
				"set-dimensions": {
					index: 3,
					isLayout: true,
					icon: "&#xE85B;",
					popupText: 'Set dimensions',
					autoPreview: true,
					input: {
						type: 'dimensionsInput',
						icon: "&#xE85B;",
						callback: function(values, target) {
							return this.onSetDimensions(values, target);
						},
						show: function() {
							var self = this;
							return {
								width: self.element.attr('vd-width'),
								height: self.element.attr('vd-height')
							};
						}
					}
				},
				"add-column": {
					hidden: true
				},
				'link': {
					hidden: true,
				}
			}
		},

		sliderNum: -1,

		_create: function () {
			this.options.sortContainer = false; // disallow sorting



			this.element.addClass('vd-slider vd-c-middle');
			this.element.attr('vd-renderer', 'sliderWidgetRelease');
			this.element.sliderWidgetRelease({editMode: true});
			this._super();

			this.setupStyleIdentifiers();
			
			this.getFramework().trigger('vdOnCreateSliderWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();

			var overlay = this.element.children('.vd-overlay').first();
			var elements = this.addDefaultSliderContent(overlay);

			this.element.attr('vd-drag', 'true');
			// this.element.attr('vd-interval', 6000);
			elements.bulletsCnt.removeClass('vd-force-dimensions');

			this.addSlide().css('background-color', 'red');
			this.addSlide().css('background-color', 'blue');
			this.addSlide().css('background-color', 'green');
		},

		addDefaultSliderContent: function(overlay) {
			var elements = {};
			var arrowSelector = this.getArrowsSelector(); 

			elements.arrowL = $.vdg.widgetFactory('iconWidget', {
				tagName: 'Arrow',
				sortContainer: null,
				disableEdit: true,
				defer: false,
				select: false, 
				template: '', // must be empty to override default template
				classes: 'fas fa-angle-left vd-abs-left vd-abs-middle vd-slider-ar vd-slider-l-ar',
				hiddenMenuBtns: [ 'trash', 'clone', 'link' ]
			}, overlay, '<span></span>', false)
			.attr('vd-style-identifier', arrowSelector);

			elements.bulletsCnt = $.vdg.widgetFactory('bulletsCntWidget', {
					classes: 'vd-horz vd-sm-horz vd-xs-horz vd-c-center vd-c-middle vd-abs-bottom vd-abs-center vd-slider-bullets'
				}, overlay); 

			elements.arrowR = $.vdg.widgetFactory('iconWidget', {
				tagName: 'Arrow',
				sortContainer: null,
				disableEdit: true,
				defer: false,
				select: false, 
				template: '', // must be empty to override default template
				classes: 'fas fa-angle-right vd-abs-right vd-abs-middle vd-slider-ar vd-slider-r-ar',
				hiddenMenuBtns: [ 'trash', 'clone', 'link' ]
			}, overlay, '<span></span>', false)
			.attr('vd-style-identifier', arrowSelector);

			return elements;
		},

		addSlide: function() {
			var self = this;
			var slides = this.target.children('.vd-slide');
			if (slides.length >= 15) {
				$.vdg.manager('showDialogMsg', {title: 'Notification', content: '<p>Maximum number of slides reached. Limit of 20 sliders per slider. No more slides can be added.</p>'});
			}

			var bullet = this.addBullet();

			var slide = $.vdg.widgetFactory('slideWidget', {
					classes: 'vd-slide vd-c-center vd-c-middle',
					colWidth: {
						desktop: 12,
						tablet: 12,
						mobile: 12,
					},
				}, this.target); 

			this.element.sliderWidgetRelease('renderEdit');
			bullet.trigger('mouseup');
			return slide;
		},

		addBullet: function() {
			var bulletsCnt 	= this.element.children('.vd-overlay').children('.vd-slider-bullets');
			var bullet = $.vdg.widgetFactory('iconWidget', {
				tagName: 'Bullet',
				sortContainer: null,
				disableEdit: true,
				defer: false,
				select: false, 
				template: '', // must be empty to override default template
				classes: 'fas fa-circle vd-bullet',
				hiddenMenuBtns: [ 'trash', 'clone', 'link' ]
			}, bulletsCnt, '<span></span>', false);
			bullet.attr('vd-style-identifier', this.getBulletsSelector());
			return bullet;
		},

		setupStyleIdentifiers: function() {
			var self = this;
			var slides = this.target.children('.vd-slide');
			var overlay = this.element.children('.vd-overlay');
			var lArrow = this.element.children('.vd-overlay').children('.vd-slider-l-ar');
			var rArrow = this.element.children('.vd-overlay').children('.vd-slider-r-ar');
			var bullets = this.element.children('.vd-overlay').children('.vd-slider-bullets').children('.vd-bullet');
			var arrowSelector = this.getArrowsSelector();
			var bulletSelector = this.getBulletsSelector();
			var overlaySelector = overlay.attr('id');

			if (!overlaySelector || !overlaySelector.length) {
				overlaySelector = $.vdg.manager('generateId', this.getDesigner().attr('id'));
				overlay.attr('id', overlaySelector);
			}

			// Register styles
			this.registerWidgetStyle(arrowSelector);
			this.registerWidgetStyle(bulletSelector);
			this.registerWidgetStyle('#'+overlaySelector);

			lArrow.attr('vd-style-identifier', arrowSelector);
			rArrow.attr('vd-style-identifier', arrowSelector);
			bullets.attr('vd-style-identifier', bulletSelector);
		},

		onCloneSlide: function(slide, dontUndo) {
			this.addBullet();
			this.element.sliderWidgetRelease('renderEdit');
		},

		onTrashSlide: function(slide, dontUndo) {
			var bullets = this.element.children('.vd-overlay').children('.vd-slider-bullets').children('.vd-bullet');
			if (!bullets || !bullets.length)
				return;
			bullets.last().remove();
		},

		onToggleBullets: function(btn, btnOptions) {
			var viewMode = $.vdg.manager().viewMode || 'desktop';
			var cls = 'vd-' + viewMode + '-hidden';
			this.element.children('.vd-overlay').children('.vd-slider-bullets').toggleClass(cls);
		},

		onToggleIndicators: function(btn, btnOptions) {
			var viewMode = $.vdg.manager().viewMode || 'desktop';
			var cls = 'vd-' + viewMode + '-hidden';
			this.element.children('.vd-overlay').children('.vd-slider-ar').toggleClass(cls);
		},

		onToggleFullPage: function(btn, btnOptions) {
			this.element.toggleClass('vd-fullpage');
		},

		onToggleDrag: function(btn, btnOptions) {
			if (this.element[0].hasAttribute('vd-drag'))
				this.element.removeAttr('vd-drag');
			else this.element.attr('vd-drag', 'true');

			this.element.sliderWidgetRelease('renderEdit');
		},

		getArrowsSelector: function() {
			return '#' + this.element.attr('id') + ' .vd-slider-ar'; 
		},

		getBulletsSelector: function() {
			return '#' + this.element.attr('id') + ' .vd-bullet'; 
		},

		onToggleSliderDirection: function(btn, btnOptions) {
			var self = this;
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			var alignmentCls = this.framework('option', 'alignments').self[view].valign;
			// var wasVertical = this.target.hasClass(alignmentCls);
			this.target.toggleClass(alignmentCls);

			var bulletsCnt = this.element.children('.vd-overlay').children('.vd-slider-bullets');
			var arrowL = this.element.children('.vd-overlay').children('.vd-slider-l-ar');
			var arrowR = this.element.children('.vd-overlay').children('.vd-slider-r-ar');
			if (this.target.hasClass('vd-vert') || this.target.hasClass('vd-sm-vert') || this.target.hasClass('vd-xs-vert')) {
				bulletsCnt.vdPolymorphic('onAlignChange', 'right');
				arrowL.vdPolymorphic('onIconChange', {iconLibrary: 'fa', value: 'fa-angle-up'});
				arrowR.vdPolymorphic('onIconChange', {iconLibrary: 'fa', value: 'fa-angle-down'});
			}
			else {
				bulletsCnt.vdPolymorphic('onAlignChange', 'bottom');
				arrowL.vdPolymorphic('onIconChange', {iconLibrary: 'fa', value: 'fa-angle-left'});
				arrowR.vdPolymorphic('onIconChange', {iconLibrary: 'fa', value: 'fa-angle-right'});
			}
		},

		setInterval: function(values) {
			if (!values.registerUndo)
				return;

			var interval = values.slider;
			if (!interval || interval <= 0) 
				this.element.removeAttr('vd-interval');
			else this.element.attr('vd-interval', interval*1000);

			this.element.sliderWidgetRelease('renderEdit');
		},

		alignArrowsVertical: function() {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			var arrowL = this.element.children('.vd-overlay').children('.vd-slider-l-ar');
			var arrowR = this.element.children('.vd-overlay').children('.vd-slider-r-ar');

			arrowL.vdPolymorphic('resetAlignment', view, true, true, 'absolute');
			arrowR.vdPolymorphic('resetAlignment', view, true, true, 'absolute');

			var absCenter = this.framework('option', 'alignments').absolute[view].center;
			var absTop = this.framework('option', 'alignments').absolute[view].top;
			var absBottom = this.framework('option', 'alignments').absolute[view].bottom;

			arrowL.addClass(absCenter + ' ' + absTop);
			arrowR.addClass(absCenter + ' ' + absBottom);
		},

		alignArrowsHorizontal: function() {
			var view = $.vdg.manager().viewMode.trim().toLowerCase();
			var arrowL = this.element.children('.vd-overlay').children('.vd-slider-l-ar');
			var arrowR = this.element.children('.vd-overlay').children('.vd-slider-r-ar');

			arrowL.vdPolymorphic('resetAlignment', view, true, true, 'absolute');
			arrowR.vdPolymorphic('resetAlignment', view, true, true, 'absolute');

			var absMiddle = this.framework('option', 'alignments').absolute[view].middle;
			var absLeft = this.framework('option', 'alignments').absolute[view].left;
			var absRight = this.framework('option', 'alignments').absolute[view].right;

			arrowL.addClass(absMiddle + ' ' + absLeft);
			arrowR.addClass(absMiddle + ' ' + absRight);
		},

		// onSetDimensions: function(values, target) {
		// 	// if is vertical slider
		// 	if (!this.target.hasClass('vd-vert') && !this.target.hasClass('vd-sm-vert') && !this.target.hasClass('vd-xs-vert'))	
		// 		return this._super(values, target);

		// 	var self = this;
		// 	var eles = self.target.children('.vd-slide').add(self.target);

		// 	if (values.width) {
		// 		if (values.widthUnits != 'auto') {
		// 			self.styleElement(self.target, 'width', values.width + values.widthUnits, true);
		// 			self.attributeElement(self.target,'vd-width', values.height, true);
		// 		}
		// 		else self.styleElement(self.target, 'width', 'auto', true);
		// 	}

		// 	eles.each(function(i, ele) {
		// 		if (values.height) {
		// 			if (values.heightUnits != 'auto') {
		// 				self.styleElement(ele, 'height', values.height + values.heightUnits, true);
		// 				self.styleElement(ele, 'min-height', values.height + values.heightUnits, true);
		// 				// self.attributeElement(ele, 'vd-height', values.height, true);
		// 			}
		// 			else self.styleElement(ele, 'height', 'auto', true);
		// 		}
		// 	});
		// },
	});


	$.widget( "vdr.sliderWidgetRelease", $.vdr.baseWidget, {

		name: "vd-slider-widget",
		vdType: 'slider',
		intervalRegistered: false,
		// dragSlideRegistered: false,
		scrollData: {
			clicked: false, 
			origX: 0, 
			origY: 0,
		},

		defaults: {
			
		},

		renderEdit: function() {
			this.renderRelease();
		},

		renderRelease: function() {
			// TODO: add drag handling
			var self = this;
			var row = self.element.find("> .vd-row-widget").first();
			
			// Setup js functionality for arrows and bullets
			var onLeftArrowClick = function(ev) {
				if (self.element.find("> .vd-row-widget > .vd-slide").length <= 0)
					return;
				
				var curSlide = self.element.find("> .vd-row-widget > .vd-slide.vd-triggered");
				if (!curSlide || !curSlide.length) 
					curSlide = self.element.find("> .vd-row-widget > .vd-slide").first();
				var nextSlide = curSlide.prev(".vd-slide");
				if (!nextSlide || !nextSlide.length)
					nextSlide = self.element.find("> .vd-row-widget > .vd-slide").last();

				curSlide.removeClass("vd-triggered");
				nextSlide.addClass("vd-triggered")[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
			};
			var onRightArrowClick = function(ev) {
				if (self.element.find("> .vd-row-widget > .vd-slide").length <= 0)
					return;
				
				var curSlide = self.element.find("> .vd-row-widget > .vd-slide.vd-triggered");
				if (!curSlide || !curSlide.length) 
					curSlide = self.element.find("> .vd-row-widget > .vd-slide").first();
				var nextSlide = curSlide.next(".vd-slide");
				if (!nextSlide || !nextSlide.length)
					nextSlide = self.element.find("> .vd-row-widget > .vd-slide").first();

				curSlide.removeClass("vd-triggered");
				nextSlide.addClass("vd-triggered")[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
			};

			var onBulletClick = function(ev) {
				if (self.element.find("> .vd-row-widget > .vd-slide").length <= 0)
					return;

				var curSlide = self.element.find("> .vd-row-widget > .vd-slide.vd-triggered");
				if (curSlide && curSlide.length) 
					curSlide.removeClass("vd-triggered");
				var selSlide = self.element.find("> .vd-row-widget > .vd-slide").eq($(this).index());
				if (!selSlide || !selSlide.length)
					selSlide = self.element.find("> .vd-row-widget > .vd-slide:first()");
				
				selSlide.addClass("vd-triggered")[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
			};

			var lArrow = self.element.children('.vd-overlay').children('.vd-slider-l-ar');
			var rArrow = self.element.children('.vd-overlay').children('.vd-slider-r-ar');
			var bullets = self.element.children('.vd-overlay').children('.vd-slider-bullets').children('.vd-bullet');

			if (lArrow && lArrow.length)
				lArrow.off('mouseup.vdr_slider').on('mouseup.vdr_slider', onLeftArrowClick); // call .off first so the evt callback is not assigned more than once (which causes it to execute N times)
			if (rArrow && rArrow.length)
				rArrow.off('mouseup.vdr_slider').on('mouseup.vdr_slider', onRightArrowClick);
			if (bullets && bullets.length)
				bullets.off('mouseup.vdr_slider').on('mouseup.vdr_slider', onBulletClick);

			// Make slider slide every X seconds
			var slideInterval = (self.element.attr('vd-interval') && self.element.attr('vd-interval').length) ? self.element.attr('vd-interval') : false;
			if (self.intervalRegistered) {
				clearInterval(self.intervalRegistered);
				self.intervalRegistered = false;
			}
			if (slideInterval) {
				self.intervalRegistered = setInterval(function() {
					if (!self.scrollData.clicked)
						self.element.children('.vd-overlay').children('.vd-slider-r-ar').trigger('mouseup');
				}, slideInterval);

				self.element.on('vdOnTrashWidget', function(data) {
					clearInterval(self.intervalRegistered);
				});
			}

			// Make slider slide on mouse drag
			var slideOnDrag = (self.element.attr('vd-drag')) ? self.element.attr('vd-drag') : false;
			row.off('mousemove.vdr_slider')
				.off('mousedown.vdr_slider')
				.off('mouseup.vdr_slider')
				.off('mouseenter.vdr_slider');
			if (slideOnDrag) {
				row.on({
			    'mousemove.vdr_slider': function(e) {
			       if (!self.scrollData.clicked)
			       	return;

			       var isVert = (self.element.css('flex-direction') && self.element.css('flex-direction').length && self.element.css('flex-direction').trim().toLowerCase() == 'column');

			      // if (isVert) {
			      // 	console.log('IS VERT');
			      //  	row.scrollTop(row.scrollTop() + ((self.scrollData.origY - e.clientY)*10));
			      // }
			      // else row.scrollLeft(row.scrollLeft() + ((self.scrollData.origX - e.clientX)*10));

			      var data = {behavior: 'smooth'};
			      if (isVert)
			      	data.top = (self.scrollData.origY - e.clientY); //*10;
			      else data.left = (self.scrollData.origX - e.clientX); //*10;

			      row[0].scrollBy(data);
			    },
			    'mousedown.vdr_slider': function(e) {
		        self.scrollData.clicked = true;
		        self.scrollData.origX = e.clientX;
		        self.scrollData.origY = e.clientY;
			    },
			    'mouseup.vdr_slider': function(e) {
		        self.scrollData.clicked = false;
			    },
			    // 'mouseleave': function(e) {
			    // 	self.scrollData.clicked = false;
			    // },
			    'mouseenter.vdr_slider': function(e) {
			    	self.scrollData.clicked = false;
			    },
				});
			}
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.tabWidget", $.vdw.containerWidget, {

		name: "vd-tab-widget",

		vdType: 'tab',

		defaults: {
			widgetClass: "vd-tab-widget",
			sortContainer: '.vd-tab-widget',
			tagName: 'Tabs',
			template: '',
			menuBtns: {
				"add-tab": {
					index: 1,
					icon: "&#xE8D8;",
					popupText: 'Add tab',
					autoPreview: true,
					callback: function(btn, btnOptions) {

						return this.addTab();
					}
				},
				'link': {
					hidden: true,
				}
			}
		},

		tabsNum: -1,

		_create: function () {
			// this.options.sortContainer = false; // disallow sorting
			this.element.addClass('vd-c-middle');
			this._super();

			this.getFramework().trigger('vdOnCreateTabWidget', {widget: this});
		},

		addDefaultContent: function() {
			this._super();

			this.tabCnt = $.vdg.widgetFactory('containerWidget', {
				tagName: 'Tabs Btns',
				sortContainer: null,
				defer: false,
				select: false, 
				template: '', // must be empty to override default template
				classes: 'vd-horz vd-c-bottom vd-c-left vd-tabs-cnt'
			}, this.target);

			this.addTab();
			this.addTab();
			this.addTab();
		},

		addDefaultTabContent: function() {

		},

		addTab: function() {
			var tabs = this.target.children('.vd-tab');
			if (tabs.length >= 15) {
				$.vdg.manager('showDialogMsg', {title: 'Notification', content: '<p>Maximum number of tabs reached. Limit of 20 tabs per tab. No more tabs can be added.</p>'});
			}

			var tabBtnCnt 	= this.element.children('.vd-tabs-cnt').first();
			var tabBtn = $.vdg.widgetFactory('btnWidget', {
				tagName: 'Tab Btn',
				sortContainer: null,
				defer: false,
				select: false, 
				template: '<span>Tab Button</span>', 
				classes: 'vd-tab-btn'
			}, tabBtnCnt, '<a></a>');
			tabBtn.attr('onmouseup', 'jQuery(this).closest("[vd-type=\'tab\']").find(".vd-tab.vd-triggered").removeClass("vd-triggered");jQuery(this).addClass("vd-triggered").siblings(".vd-tab-btn").removeClass("vd-triggered");jQuery(this).closest("[vd-type=\'tab\']").find(".vd-tab").eq(jQuery(this).index()).addClass("vd-triggered");');

			$.vdg.widgetFactory('containerWidget', {
					tagName: 'Tab',
					classes: 'vd-tab vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden vd-collapsable'
				}, this.target); 

			tabBtn.trigger('onmouseup');
		},

		onTrashTab: function(slide, dontUndo) {
			console.log('on delete slide');

			var tabBtns = this.element.children('.vd-tabs-cnt').first().children('.vd-tab-btn');
			if (!tabBtns || !tabBtns.length)
				return;

			tabBtns.last().remove();
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.tableWidget", $.vdw.containerWidget, {

		name: "vd-table-widget",

		vdType: 'table',

		defaults: {
			widgetClass: "vd-table-widget",
			template: '',
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this._super();
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.tabsWidget", $.vdw.containerWidget, {

		name: "vd-tabs-widget",

		vdType: 'tabs',

		defaults: {
			widgetClass: "vd-tabs-widget",
			template: '',
			//sortContainer: '.vd-content-widget',
			menuBtns: {
				
			},
		},

		_create: function () {

			this._super();
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_pc.wizardWidget", $.vdw_pc.sliderWidget, {

		name: "vd-wizard-widget",

		vdType: 'wizard',

		defaults: {
			interval: null, //10000,
			widgetClass: "vd-wizard-widget",
			sortContainer: '.vd-wizard-widget',
			tagName: 'Wizard',
			//template: '<div class="vd-row-widget" vd-target></div><div class="vd-overlay"></div>', //<div class="vd-slider-cnt"></div><div class="vd-arrows"></div><div class="vd-bullets"></div>',
			menuBtns: {
				
			}
		},

		_create: function () {
			this._super();

			this.getFramework().trigger('vdOnCreateWizardWidget', {widget: this});
		},

		// addDefaultContent: function() {
		// 	this._super();
		// },

		addDefaultSliderContent: function(overlay) {
			var elements = {};

			elements.bulletsCnt = $.vdg.widgetFactory('containerWidget', {
					classes: 'vd-horz vd-sm-horz vd-xs-horz vd-c-center vd-c-middle vd-abs-bottom vd-abs-center vd-slider-bullets', 
					tagName: 'Steps',
				}, overlay); 

			elements.arrowL = $.vdg.widgetFactory('textWidget', {
				tagName: 'Step Back',
				sortContainer: null,
				// disableEdit: true,
				defer: false,
				select: false, 
				template: '<span>Prev</span>', 
				classes: 'vd-abs-left vd-abs-bottom',
			}, overlay);

			elements.arrowR = $.vdg.widgetFactory('textWidget', {
				tagName: 'Step Forward',
				sortContainer: null,
				// disableEdit: true,
				defer: false,
				select: false, 
				template: '<span>Next</span>', 
				classes: 'vd-abs-right vd-abs-bottom',
			}, overlay);

			return elements;
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.mySliderDesigner", $.vd.visualDesigner, {

		name: "vd-ms-designer",

		vdType: 'ms-designer',

		defaults: {
			widgetClass: "vd-ms-designer",
			template: '',
			menuBtns: {
				"add-section": {
					hidden: true,
				},
				"add-row": {
					hidden: true,
				},
				"style": {
					hidden: true,
				},
				"lock": {
					hidden: true,
				},
			},
		},

		_create: function () {
			var self = this;
			this.element.attr('designer-type', 'mySliderDesigner');
			this._super();
		},

		uniqueId: function() {
			this.element.attr('id', 'msid-'+this.element.attr('vd-post-id'));
		},

		showTag: function() {
			return;
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.mySlider", $.vdw_pc.sliderWidget, {

		name: "vd-my-slider",

		vdType: 'ms-slider',

		defaults: {
			menuBtns: {
				"get-shortcode": {
					index: 1,
					icon: "&#xE8D8;",
					popupText: 'Get shortcode',
					autoPreview: true,
					callback: function(btn, btnOptions) {
						return this.getShortcode();
					}
				},
				"trash": {
					hidden: true
				},
			}
		},

		_create: function () {
			this._super();
			this.showTag();
		},

		showTag: function() {
			var self = this;

			if ($('.vd-designer-tag[vd-assoc="' + self.element.attr('id') + '"]').length)
				return;

			var tag = $('<div></div>').appendTo(self.getDesigner()).tagWidget({
				target: self, 
				title: self.options.tagName || self.widgetName, 
				delayPositioning: false, 
				classes: 'vd-designer-tag vd-ignore', 
				isLocked: self.isLocked(), 
				isDynamic: self.isDynamic(), 
				tagOptions: self.options.tagOptions
			});

			tag.attr('vd-assoc', self.element.attr('id'));

			tag.on(self.options.selectionEvent || $.vdg.manager('btnBindEvt'), function(e) {
				if ($(e.target).hasClass('vd-ignore'))
					return;
		    e.stopPropagation();
		    e.preventDefault();
		    self.select(e);
			});
		},

		removeTag: function() {
			// override base functionality
			return;
		},

		getShortcode: function() {
			var designer = this.getDesigner();
			if (!designer || !designer.length) {
				console.log('Error retrieving designer');
				$.vdg.widgetFactory('modalWidget', {
					title: 'Error retrieving designer'
				}, $('body'));
				return;
			}
			var postId = designer.attr('vd-post-id');
			if (!postId || !postId.length) {
				console.log('Error retrieving post id');
				$.vdg.widgetFactory('modalWidget', {
					title: 'Error retrieving post id'
				}, $('body'));
				return;
			}

			console.log("TODO: add in style and script");
			var shortcode = "[atomic_slider id='" + postId + "']";
			var modal = $.vdg.widgetFactory('modalWidget', {
				title: '<h2 style="font-size: 30px; margin: 0px;">Shortcode</h2>',
		    content: '<div class="vd-container-widget vd-horz vd-c-middle vd-c-center" vd-type="container"><input id="vdms-shortcode" class="vd-text-widget" vd-type="text" vd-text-type="p" style="text-align: center; width: 70%; color: #777; background-color: rgb(238, 238, 238); border: 1px solid #777; padding: 15px; border-radius: 3px; font-size: 16px;" readonly="true" value="' + shortcode + '"><a id="vdms-cpy-sh" title="Click to copy shortcode to clipboard" vd-type="link" draggable="false" href="#/" style="font-size: 20px; color: #40a798 !important;"><span class="vd-icon-widget fas fa-copy" vd-type="icon" vd-a="true"></span></a></div><p id="vdms-sh-msg" style="color: green; display: none;">Copied to clipboard</p>',
		     classes: 'vd-modal-sml'
		    }, $('body'));

			$('#vdms-cpy-sh', modal).on('mouseup', this.copyToClipboard);
		},

		copyToClipboard: function(ev) {
	    var copyText = document.getElementById('vdms-shortcode');
	    copyText.select();
	    copyText.setSelectionRange(0, 99999);
	    document.execCommand("copy");

	    var msg = $('#vdms-sh-msg');
	    msg.css('display', 'block');
	    setTimeout(function() {
	      msg.css('display', 'none');
	    }, 1000);
	  }
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

//;(function ( $, window, document, undefined ) {
 (function ($) {

	$.widget( "vd.wordpressFramework", $.vd.vDFramework, {

		options: {
			menuYOffset: '5px',
			loadIcons: false,

			visualDesignerManager: {
				menuBtns: {
					"save-tmp-changes": {
            index: 1,
            icon: "&#xE864;", //"fa fa-cloud-upload",
            popupText: 'Save template changes',
            hidden: true,
            callback: function(btn, btnOptions) {

                return this.framework('onSaveTemplateChanges', btn, btnOptions);
            }
          },
				},
				runningTargets: {

				},
			},
			runningDesigner: {

			},
			visualDesigner: {
				select: false,
			},
			baseWidget: {
				model: 'page',
				menuBtns: {
					"style": {
						index: 997,
						subMenu: {
							"colour": {
								type: 'vd-colour-picker',
								disableDefault: true,
								callback: function(btn) {

									var self = this;

									$('[vd-type="vd-colour-picker"]').colourPicker('hide');

									btn.colourPicker({
										color: self.element.css('color'),
										change: function(event, ui) {

											var rgba = ui.color.toCSS('rgb');
											// self.style('color', rgba);

											self.onForeColourChange({colour: rgba}, {});
									  }
									});

									$('.iris-picker', btn).toggle();
								}
							},
							"background-colour": {
								type: 'vd-colour-picker',
								disableDefault: true,
								callback: function(btn) {

									var self = this;

									$('[vd-type="vd-colour-picker"]').colourPicker('hide');

									var args = {
										change: function(event, ui) {
							        var rgba = ui.color.toCSS('rgb');
											// self.style('background-color', rgba);

											self.onBackColourChange({'background-colour': rgba}, {});
									  }
									};

									if (self.element.css('background-color') != 'rgba(0, 0, 0, 0)') 
										args.color = self.element.css('background-color');

									btn.colourPicker(args);

									$('.iris-picker', btn).toggle();
								}
							},
							"background-image": {
								subMenu: {
									'src': {
										callback: function(btn) {
											var self = this;
											$.vdImgSrcPicker.off('select');

											$.vdImgSrcPicker.on('select', function() {
												var imgSrc = $.vdImgSrcPicker.state().get('selection').first().toJSON();

												var undoOps = [];
												undoOps.push( self.style('background-image', 'url("' + imgSrc.url + '")', true) );
												undoOps.push( self.style('background-repeat', 'no-repeat', true) );

												// Check for background-size: cover, background-position: center center
												var style = self.getWidgetStyle(false, $.vdg.manager().viewMode.trim().toLowerCase());
												if (style && style.length && style[0].length) {
													var bkSize 	= style[0][0].style['background-size'];
													var bkPos 	= style[0][0].style['background-position'];
													if (!bkSize || !bkSize.length)
														undoOps.push( self.style('background-size', 'cover', true) );
													if (!bkPos || !bkPos.length)
														undoOps.push( self.style('background-position', 'center center', true) );
												}
												
												$.vdg.undoWidget('registerUndo', undoOps);
											
												$.vdImgSrcPicker.off('select');
											});

											$.vdImgSrcPicker.open();
										}
									},
									'overlay': {
										type: 'vd-colour-picker',
										callback: function(btn) {
											var self = this;
											btn.colourPicker({
												color: self.element.find('> .vd-overlay').css('background-color'),
												change: function(event, ui) {

													var rgba = ui.color.toCSS('rgb');
													self.onSetOverlayChange(rgba);
											  }
											});

											$('.iris-picker', btn).toggle();
										}
									}
								}
							},
							"border": {
								index: 5,
								icon: "&#xE22F;", // border_outer "fa fa-picture-o",
								popupText: 'Border',
								input: {
									type: 'borderInput',
									icon: "&#xE22F;", // border_outer "fa fa-picture-o",
									popupText: 'Set border widths',
									buttons: {
										'border-top-width': {
											placeholder: 'top',
											tooltip: 'Border Width Top',
											dblClick: '[name="border-bottom-width"]',
										},
										'border-bottom-width': {
											placeholder: 'bottom',
											tooltip: 'Border Width Bottom',
											dblClick: '[name="border-top-width"]',
										},
										'border-left-width': {
											placeholder: 'left',
											tooltip: 'Border Width Left',
											dblClick: '[name="border-right-width"]',
										},
										'border-right-width': {
											placeholder: 'right',
											tooltip: 'Border Width Right',
											dblClick: '[name="border-left-width"]',
										},
									},
									callback: function(values) {
										var self = this;

										if (values.colourPicker) {
											$('[vd-type="vd-colour-picker"]').colourPicker('hide');

											values.btn.colourPicker({
												color: self.element.css('border-color'),
												change: function(event, ui) {
											        var rgba = ui.color.toCSS('rgb');
											        self.style('border-color', rgba);
											        //self.target.css('border-color', rgba);
											    }
											});

											$('.iris-picker', values.btn).toggle();
										}
										else {
											$.each(values, function(key, value) {
												self.style(key, value);
											});
										}
									},
									show: function() {
										var self = this;
										return {
											'border-top-width': self.target.css('border-top-width'),
											'border-bottom-width': self.target.css('border-bottom-width'),
											'border-left-width': self.target.css('border-left-width'),
											'border-right-width': self.target.css('border-right-width'),
											'border-style': self.target.css('border-style'),
											'border-color': self.target.css('border-color'),
										};
									}
								}
							},
						}
					}
				},
				widgetTypes: {
					'shortcode': 'shortcodeWidget',
					'wp-tmpl': 'wpTemplateWidget',
					'wp-repeater': 'wpRepeaterWidget',
					'running-designer': 'runningDesigner',
					'wp-menu': 'wpMenuWidget'
				},
			},
			columnWidget: {
				menuBtns: {
					"wp-cmps": {
						index: 92,
						faIcon: "fab fa-wordpress",
						popupText: 'Wordpress Components',
						subMenu: {
							"add-content": {
								index: 990,
								faIcon: "fas fa-paint-roller",
								popupText: 'Add a page/post',
								callback: function() {
									$.vdg.widgetFactory('wpPostWidget', {}, this.target);
								}
							},
							"add-menu": {
								index: 991,
								faIcon: "fas fa-caret-up",
								popupText: 'Add WordPress Menu',
								callback: function() {
									$.vdg.widgetFactory('wpMenuWidget', {}, this.target);
								}
							},
							"add-many": {
								index: 991,
								faIcon: "fas fa-paint-roller",
								popupText: 'Add many pages/posts',
								callback: function() {
									$.vdg.widgetFactory('wpRepeaterWidget', {}, this.target);
								}
							},
							"add-sidebar": {
								index: 992,
								faIcon: "fab fa-firstdraft",
								popupText: 'Add sidebar',
								callback: function() {
									var sWidget = $.vdg.widgetFactory('containerWidget', {tagName: 'Sidebar'}, this.target);
									this.getFramework().vdPolymorphic('setDynamicContent', 'S_B', sWidget);
								}
							},
							"add-search-results": {
								index: 993,
								faIcon: "fas fa-paint-roller",
								popupText: 'Add search results display',
								callback: function() {
									$.vdg.widgetFactory('wpSearchResultsWidget', {}, this.target);
								}
							},
							"add-site-logo": {
								index: 5,
								icon: "perm_media",
								popupText: 'Add site logo',
								callback: function() {
									var slWidget = $.vdg.widgetFactory('imgWidget', {tagName: 'Site Logo'}, this.target, '<img/>');					
									slWidget.vdPolymorphic('toggleAnchor', {link: '#'});
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'S_L',attr:'src'}, slWidget);
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'S_U',attr:'href'}, slWidget);
								}
							},
							"add-site-title": {
								index: 6,
								icon: "web_asset",
								popupText: 'Add site title',
								callback: function() {
									var stWidget = $.vdg.widgetFactory('btnWidget', {tagName: 'Site Title', template: '<span>Site title</span>'}, this.target, '<a></a>');
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'S_T',attr:'txt'}, stWidget);
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'S_U',attr:'href'}, stWidget);
								}
							},
							"add-site-tagline": {
								index: 7,
								icon: "more",
								popupText: 'Add site tagline',
								callback: function() {
									var stlWidget = $.vdg.widgetFactory('textWidget', {tagName: 'Site Tagline', template: '<span>Site tagline</span>'}, this.target, '<p></p>');
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'S_T_L',attr:'txt'}, stlWidget);
								}
							},
							"add-search-form": {
								index: 8,
								icon: "search",
								popupText: 'Add search form',
								callback: function() {
									var sfWidget = $.vdg.widgetFactory('shortcodeWidget', {tagName: 'Search Form'}, this.target);
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'S_F',attr:'txt'}, sfWidget);
								}
							},
							"add-login-btn": {
								index: 9,
								faIcon: "fas fa-sign-in-alt",
								popupText: 'Add login/register button',
								callback: function() {
									var lbWidget = $.vdg.widgetFactory('btnWidget', {tagName: 'Login Btn', template: '<span>Login</span>'}, this.target, '<a></a>');
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'L_U',attr:'href'}, lbWidget);
								}
							},
							"add-page-title": {
								index: 10,
								icon: "title",
								popupText: 'Add page title',
								callback: function() {
									var ptWidget = $.vdg.widgetFactory('textWidget', {tagName: 'Page Title', template: '<span>Page title</span>'}, this.target, '<p></p>');
									this.getFramework().vdPolymorphic('setDynamicContent', {c:'T_T',attr:'txt'}, ptWidget);
								}
							},
							// "add-cart-btn": {
							// 	index: 6,
							// 	faIcon: "fas fa-paint-roller",
							// 	popupText: 'Add cart button',
							// 	callback: function() {
							// 		var stWidget = $.vdg.widgetFactory('btnWidget', {tagName: 'Site URL', template: '<a href="#"><span>Press Me</span></a>'}, this.target);
							// 	}
							// },
							"add-copyright": {
								index: 11,
								icon: "copyright",
								popupText: 'Add copyright',
								callback: function() {
									var cpWidget = $.vdg.widgetFactory('textWidget', {tagName: 'Copyright', template: '<span>Copyright © My Business. All rights reserved.</span>'}, this.target, '<p></p>');
								}
							},
							"add-shortcode": {
								index: 999,
								icon: "&#xE8C0;",
								popupText: 'Add shortcode',
								callback: function() {
									var scWidget = $('<div></div>')
										.appendTo(this.target)
										.shortcodeWidget(this.framework('option', 'shortcodeWidget'));
								
									this.getFramework().trigger('onColumnAddShortcodeWidget', {column: this, widget: scWidget});

									scWidget.vdPolymorphic('select');
									
									return scWidget;
								}
							},
						}
					},
					"web-design-cmps": {
						// index: 3,
						subMenu: {
							
						}
					}
				},
			},
			textWidget: {
				menuBtns: {
					"dynamic": {
						index: 994,
						icon: "&#xE8C0;",
						popupText: 'Use dynamic content',
						input: {
							type: 'dropdownInput',
							icon: "&#xE8C0;",
							popupText: 'Select dynamic content',
							dropdownOptions: [
								{value: '', display: '', data: {}},
								{value: 'T_T,', display: 'Page/Post Title', data: {c:'T_T',attr:'txt'}},
								{value: 'S_T,', display: 'Site Title', data: {c:'S_T',attr:'txt'}},
								{value: 'S_T_L,', display: 'Site Tagline', data: {c:'S_T_L',attr:'txt'}},
								{value: 'T_A,', display: 'Author', data: {c:'T_A',attr:'txt'}},
								{value: 'P_L', display: 'Permalink', data: {c:'P_L',attr:'href'}},
								{value: 'S_U', display: 'Site URL', data: {c:'S_U',attr:'href'}},
							],
							callback: function(value, btn, data) {
								this.getFramework().vdPolymorphic('setDynamicContent', data, this.element);
							}
						}
					},
					"type": {
						subMenu: {
							"header": {
								hidden: true
							}
						}
					}
				}
			},
			imgWidget: {
				menuBtns: {
					'src': {
						callback: function(btn) {

							var self = this;

							$.vdImgSrcPicker.off('select');

							$.vdImgSrcPicker.on('select', function() {
								var imgSrc = $.vdImgSrcPicker.state().get('selection').first().toJSON();

								self.attribute('src', imgSrc.url);
							
								$.vdImgSrcPicker.off('select');
							});

							$.vdImgSrcPicker.open();
						}
					},
					"dynamic": {
						index: 994,
						icon: "&#xE8C0;",
						popupText: 'Use dynamic content',
						input: {
							type: 'dropdownInput',
							icon: "&#xE8C0;",
							popupText: 'Select dynamic content',
							dropdownOptions: [
								{value: '', display: '', data: {}},
								{value: 'T_P_T', display: 'Featured Image', data: {c:'T_P_T',attr:'src'}},
								{value: 'T_A_A', display: 'Author Avatar', data: {c:'T_A_A',attr:'src'}},
							],
							callback: function(value, btn, data) {
								this.getFramework().vdPolymorphic('setDynamicContent', data, this.element);
							}
						}
					},
				}
			},
			btnWidget: {

			},
			videoWidget: {
				menuBtns: {
					'src': {
						callback: function(btn) {
							var self = this;

							$.vdVideoSrcPicker.off('select');

							$.vdVideoSrcPicker.on('select', function() {
								var src = $.vdVideoSrcPicker.state().get('selection').first().toJSON();

								self.attributeElement($('source', self.element), 'src', src.url);

								$.vdVideoSrcPicker.off('select');
							});

							$.vdVideoSrcPicker.open();
						}
					},
				}
			},
			audioWidget: {
				menuBtns: {
					'src': {
						callback: function(btn) {
							var self = this;

							$.vdAudioSrcPicker.off('select');

							$.vdAudioSrcPicker.on('select', function() {
								var src = $.vdAudioSrcPicker.state().get('selection').first().toJSON();

								self.attributeElement($('source', self.element), 'src', src.url);

								$.vdAudioSrcPicker.off('select');
							});

							$.vdAudioSrcPicker.open();
						}
					},
				}
			},
			containerWidget: { 
				menuBtns: {
					"dynamic": {
						index: 994,
						icon: "&#xE8C0;",
						popupText: 'Use dynamic content',
						input: {
							type: 'dropdownInput',
							icon: "&#xE8C0;",
							popupText: 'Select dynamic content',
							dropdownOptions: [
								{value: '', display: ''},
								{value: 'T_C,', display: 'Page/Post Content', data: {c:'T_C',attr:'txt'}},
							],
							callback: function(value, btn, data) {
								this.getFramework().vdPolymorphic('setDynamicContent', data, this.element);
							}
						}
					},
				}
			},
			hrWidget: {
				menuBtns: {
					"hr-border": {
						input: {
							callback: function(values) {
								var self = this;

								if (values.colourPicker) {
									$('[vd-type="vd-colour-picker"]').colourPicker('hide');

									values.btn.colourPicker({
										color: self.element.css('border-color'),
										change: function(event, ui) {
									        var rgba = ui.color.toCSS('rgb');
									        self.style('border-color', rgba);
									        //self.target.css('border-color', rgba);
									    }
									});

									$('.iris-picker', values.btn).toggle();
								}
								else {
									$.each(values, function(key, value) {
										self.style(key, value);
									});
								}
							},
						}
					},
				}
			}
		},

		_create: function () {
			this._super();
		},

		getMainPostId: function() {
			if (!$.vdg.manager(''))
				return 'undefined'; // fallback on body class?

			return $(window.parent.document.getElementById('vd-platform-view')).attr('pid');
		},

		vdOnCreateDesigner: function(e, params) {
			var selectSpecificDesigner = $.vdg.vdGetQryParam('id'/*, window.parent.document.location.href*/);
			var selectSpecificTemplate = $.vdg.vdGetQryParam('tmpl'/*, window.parent.document.location.href*/);
			if (selectSpecificDesigner && selectSpecificDesigner == params.widget.element.attr('vd-post-id') ||
				selectSpecificTemplate && selectSpecificTemplate == params.widget.element.attr('vd-tmpl')) {
				setTimeout(function() {
					params.widget.activate();
					// var y = (params.widget.element.offset().top - 110) || 0;
					// setTimeout(function() {
					// 	$("html, body").animate({
					// 		scrollTop: y
					// 	}, 1000);
					// }, 1);
				}, $.VD_DEFER);

				// Scroll to selected designer
				var y = (params.widget.element.offset().top - 110) || 0;
				$("html, body").animate({
					scrollTop: y
				}, 1000);
			}
			else if (params.widget.element.vdPolymorphic('option', 'select') || params.widget.element.attr('vd-focus') || $('[data-type="visual-designer"]').length <= 1) {
				setTimeout(function() {
					params.widget.activate();
				}, $.VD_DEFER);
			}
			else if (params.createdOnPageLoad) {
				setTimeout(function() {
					params.widget.deactivate();
				}, $.VD_DEFER);
			}
		},

		vdOnDesignerExport: function(e, params) {
			var self = this;
			$('.vd-wp-input', params.design).remove();
			$('.vd-shortcode-widget', params.design).each(function(ele) {
				$(this).text( $(this).attr('vd-shortcode') );
			});
			// Remove medium editor data attribs
			// $('[medium-editor-index]', params.design).each(function() {
			// 	var self = $(this);
		 //  	if (self.attr('role') == 'textbox')
		 //  		self.removeAttr('role');
		 //  	$.vdSanitiseMedEle(self);
			// });
			params.design = this.convertDynamicWidgets(params.design);
			
			var content = '<!-- VisualDesigner BEGIN -->' + params.design.prop('outerHTML') + '<!-- VisualDesigner END -->';

      params.content = content;

      var mainPostId = this.getMainPostId();
      if (mainPostId)
      	params.custom.main_post_id = mainPostId;
      if ($('[data-type="visual-designer"]', params.design).attr('vd-tmpl'))
      	params.custom.vd_tmpl = $('[data-type="visual-designer"]', params.design).attr('vd-tmpl');
      if ($('[data-type="visual-designer"]', params.design).attr('vd-gtmpl'))
      	params.custom.vd_gtmpl = $('[data-type="visual-designer"]', params.design).attr('vd-gtmpl');

      this.vdOnWPExportDesign(params);
		},

		vdOnManagerExport: function(e, params) {
			if (params.intance && params.instance.isProcessing) {
				console.log('Cant do; is processing');
				return true;
			}
			
			var self = this;
			params.killSpinner = false;
			// var widget = params.widget;
			var postId = params.widget.attr('vd-post-id') || this.getPostId();
			var nonce = this.getUploadNonce();

			params.data = params.data || {};
			params.data.action = 'update_visual_design';
      params.data.post_id = postId; 
      params.data.nonce = nonce; 
      params.data.content = params.content;
      params.data.custom = params.custom;
      params.data.custom.post_status = 'publish';
			
			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : params.data,
				success: function(response) {
					$.vdg.manager('showDialogMsg', {title: 'Design Saved :D', classes: 'vd-modal-sml'});
				},
				error: function(response) {
					console.log('Error: ', response);
					$.vdg.manager('showDialogMsg', {title: 'Error', content: '<p>Sorry about this an error occurred.</p>'}); 
				},
				complete: function(response) {
					params.instance.isProcessing = false;
					params.menu.vdPolymorphic('endSpinBtn', params.btn);
				}
			}); 
		},

		vdOnCreateMenu: function(e, params) {
			setTimeout(function() {
				$('[vd-type="vd-colour-picker"]', params.menu.element)
				.attr('data-alpha', true)
				.colourPicker({
					mode: 'rgb'
				});
			}, $.VD_DEFER);

			// Non administrators cannot toggle the lock btn
			if (!vdObj.can_lock || vdObj.can_lock.trim().toLowerCase() == 'false') {
				params.menu.element.find('.vd-menu-btn[vd-name="lock"]').remove();
			}
		},

		// vdOnInitialiseManager: function(e, params) {
		vdOnInitialiseFramework: function(e, params) {
			this._super(e, params);

			// Must move to avoid loosing this html when changing templates
			$('.vd-wp-attribs').appendTo($('.vd-manager').first());

			$(window).bind('beforeunload.vd', function(){
			  return 'Are you sure you want to leave? Don\'t forget to save your design.';
			});

			// Define image_frame as wp.media object
			$.vdImgSrcPicker = wp.media({
			   title: 'Select Media',
			   multiple : false,
			   library : {
			        type : 'image',
			    }
			});

			$.vdVideoSrcPicker = wp.media({
			   title: 'Select Video Media',
			   multiple : false,
			   library : {
			        type : 'video',
			    }
			});

			$.vdAudioSrcPicker = wp.media({
			   title: 'Select Audio Media',
			   multiple : false,
			   library : {
			        type : 'audio',
			    }
			});

			$.vdg.manager('versionCheck');

			// $('html')[0].style['margin-top'] = '0px !important';
			var html = $('html');
    	html.attr("style", html.attr("style") + ";margin-top:0px!important");

			// if (!this.options.noMediumEditor) {
			// 	$.mediumEditor = new MediumEditor('.vd-text-widget:not([vd-disabled]):not([vd-dynamic]) > :not(.vd-icon-widget)', {
			// 		toolbar: { buttons: ['bold', 'italic', 'underline', 'anchor'], },
			// 	});

			// 	//$('.vd-text-widget .vd-icon-widget').attr('contenteditable', false);

			// 	// Stop medium editor on a deactivated widget
			// 	$.mediumEditor.subscribe('focus', function(ev, ele) {
			// 		if ($(ele).closest('[vd-type]').vdPolymorphic('option', 'deactivated') || $(ele).closest('[vd-type]').vdPolymorphic('isDynamic'))
			// 			return false;
			// 	});
			// 	// $.mediumEditor.subscribe('editableMouseover', function(ev, ele) {
			// 	// 	console.log('editableMouseover', ev, ele);
			// 	// 	if ($(ele).closest('[vd-type]').vdPolymorphic('option', 'deactivated') || $(ele).closest('[vd-type]').vdPolymorphic('isDynamic')) {
			// 	// 		ev.preventDefault();
			// 	// 		ev.stopPropagation();
			// 	// 		return false;
			// 	// 	}
			// 	// });
			// }
		},

		vdOnCreateTextWidget: function(e, params) {
			// if (!this.options.noMediumEditor && !params.widget.element[0].hasAttribute('vd-disabled') && !params.widget.options.noMediumEditor) {
			// 	// Sanitise
			// 	// $.vdSanitiseMedEle(params.widget.element);
			// 	// $.mediumEditor.addElements(params.widget.element);

			// 	params.widget.element.children().not('.vd-icon-widget').each(function() {
			// 		var ele = $(this);
			// 		$.vdSanitiseMedEle(ele);
			// 		$.mediumEditor.addElements(ele);
			// 	});
			// }
		},

		// vdOnCloneWidget: function(e, params) {
		// 	if (params.widget.vdType != 'text')
		// 		return;
		// },

		vdOnShowMenu: function(e, params) {
			
		},

		vdOnHideMenu: function(e, params) {
			try {
				$('[vd-type="vd-colour-picker"]', params.menu.element).colourPicker('hide');
			}
			catch (ex) {}
		},

		vdOnSubmitSupportRequest: function(e, params) {
			// params.qryStr += '&vd-theme-name=' + $('#vd-theme-name').attr('value') + '&vd-theme-url=' + encodeURI($('#vd-theme-url').attr('value'));
			// return params;

			// if (params.instance.isProcessing) {
			// 	console.log('Cant do; is processing');
			// 	return true;
			// }

			params.instance.isProcessing = true;
			params.killSpinner = false;
			
			var self = this;
      var nonce = vdObj.shortcode_nonce;
      params.data.action 			= 'vd_support_request';
      params.data.nonce 			= nonce;
      params.data.platform 		= window.navigator.platform;
      params.data.os 					= window.navigator.oscpu;
      params.data.useragent 	= window.navigator.userAgent;
      
      jQuery.ajax({
        type : "post",
        dataType : "json",
        url : vdObj.ajax,
        data : params.data,
        success: function(response) {
          params.outputEle.addClass('success');
          params.outputEle.html(response.message);
          console.log('success', response.message);
        },
        error: function() {
         	params.outputEle.addClass('error');
          params.outputEle.html('An error occurred please try again later');
        },
        complete: function() {
        	params.instance.isProcessing = false;
        }
      });
		},

		getPostId: function() {
			return vdObj.post_id;
		},

		getUploadNonce: function() {
			return vdObj.upload_nonce;
		},

		vdOnWPExportDesign: function(params) {
			
		},

		setDynamicContent: function(dynamicData, widget) {
			var self = this;
			if (!dynamicData || dynamicData.length <= 0)
				return;
			// if (self.isProcessing) {
			// 	console.log('Cant do; is processing');
			// 	return true;
			// }

			self.isProcessing = true;
			// widget.vdPolymorphic('setDynamic', true);
			var designer = widget.vdPolymorphic('getDesigner');
			// var dynCnt = this.getDynamicContainer(designer);
			var target = $(widget.vdPolymorphic('getTarget'));
			var widgetId = widget.attr('id');
			var dynJson = widget.vdPolymorphic('getDynJSON');
			var attr = dynamicData.attr.trim().toLowerCase();
			var code = dynamicData.c.trim().toUpperCase();
			var shortcode = '';

			for (var key in dynamicData)
				shortcode += key + '="' + dynamicData[key] + '" ';

			if (code == 'T_C')
				shortcode += 'c_caller="' + designer.attr('vd-post-id') + '" id=' + $.vdg.vdGetQryParam('id') + ' ';

			var nonce = vdObj.shortcode_nonce;
			var data = {
        'action': 'vd_do_shortcode',
        'nonce': nonce,
        'shortcode': '[vd_convert ' + shortcode + ']'
      };

			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : data,
				success: function(response) {
					if (response.type != "success") {
            return $.vdg.widgetFactory('modalWidget', {
                title: response.type,
                content: '<p>' + response.message + '</p>'
            }, self.element);
					}

					var content = response.data.replace(/\\"/g, '"');
					// var target = widget.vdPolymorphic('getTarget');

					// try {
						switch (attr)
						{
							case 'href': 	
							{ 
								var anchor = target.closest('a');
								if (anchor.length)
									widget.vdPolymorphic('attributeElement', anchor, attr, content); 
							} 
							break;
							case 'txt': 	
							{ 
								if (!content || !content.length)
									content = "No page title set";
								widget.vdPolymorphic('removeTag'); 
								widget.vdPolymorphic('setHtml', content); 
								widget.vdPolymorphic('disableAnchors');
							} 
							break;
							case 'bksrc': 		
							{ 	
								// console.log('background-image', content);	
								widget.css('background-image', 'url("' + content + '")');	
								widget.css('background-repeat', 'no-repeat');	 	
							} 	
							break;
							default: 			{ widget.vdPolymorphic('attribute', attr, content); } break;
						}

						var curJson = widget.vdPolymorphic('getDynJSON');
						// console.log('curJson before', curJson);
						if (!curJson[attr] || !curJson[attr].length)
							curJson[attr] = {code: ''};

						// console.log('attr', attr);
						// console.log('curJson after', curJson);
						curJson[attr].code = shortcode;
						target.attr('vd-dynamic', encodeURIComponent( JSON.stringify(curJson) ));

						// Get or create hidden input
						// var input = dynCnt.children('vdwp.wp-code[a="' + attr + '"][for="' + widgetId + '"]');
						// if (input.length <= 0)
						// 	input = $("<vdwp class='wp-code' a='" + attr + "' for='" + widgetId + "' type='hidden' style='display: none !important; font-size: 0 !important; color: transparent !important;'></vdwp>").appendTo(dynCnt); 
						// else input = input.first();

						// input.attr('a', attr).text(shortcode);
						// input.attr('for', widgetId);
					// }
					// catch (ex) {
					// 	console.log('Failed to load shortcode via Ajax', ex.message);
					// }
				},
				complete: function() {
					self.isProcessing = false;
				}
			});
		},

		convertDynamicWidgets: function(designer) {
			// console.log('designer', designer);
			// var dynCnt = this.getDynamicContainer(designer);
			// console.log('dynCnt', dynCnt);

			// $('vdwp.wp-code', dynCnt).each(function(ele) {
			// $('[vd-type][vd-dynamic]', designer).each(function(ele) {
			$('[vd-dynamic]', designer).each(function(ele) {

				var exportWidget = $(this);
				var widget 				= $('#' + exportWidget.attr('id')); //, designer);
				if (!widget.vdPolymorphic())
					return true; // continue
				var widgetId 			= widget.attr('id');
				var targetId 			= widget.vdPolymorphic('getTarget').attr('id');
				var exportTarget 	= $('#'+targetId, designer);
				// var dynJson 			= exportWidget.attr('vd-dynamic');
				// dynJson 					= JSON.parse((dynJson && dynJson.length) ? decodeURIComponent(dynJson) : '{}');
				var dynJson 			= widget.vdPolymorphic('getDynJSON');
				// console.log('dynJson', dynJson);

				for (var key in dynJson) {
					// console.log('key', key);
					if (!dynJson[key].code || !dynJson[key].code.length)
						continue;


					var code = '[vd_convert ' + dynJson[key].code + ']';

					switch (key.trim().toLowerCase())
					{
						case 'config': {} break;
						case 'href': 
						{
							var anchor = exportTarget.closest('a');
							if (anchor.length)
								anchor.attr(key, code); 
						} 
						break;
						case 'txt': 
						{
							// Remove all text
							exportTarget.contents().filter(function(){
								return (this.nodeType == 3);
							}).remove();
							exportTarget.children('*').remove();
							exportTarget.append(document.createTextNode(code)); 
						} 
						break;
						case 'bksrc': 
						{
							// MAJOR ISSUE!!! JQuery::css() will NOT apply the background-image/background if has spaces or not wrapped in "". AND WordPress doesn't like quotation marks. Its a fukin paradox!!!!!!!!
				    
					    // console.log('before', exportTarget.attr('style'));
					    var formattedCode = code.replace(/\"/g, '');
							var inlineStyle = exportTarget.attr('style') || '';
					    inlineStyle = inlineStyle.replace(/background-image\s*:\s*url\s*\(.*?\)/gmi, 'background-image: url(' + formattedCode + ')');
					    exportTarget.attr('style', inlineStyle);
					    // console.log('after', exportTarget.attr('style'));
						} 
						break;
						default: 
						{ 
							exportTarget.attr(key, code);
						} 
						break;
					}
				}
			});

			return designer;

			// 	var attr = dynEle.attr('a');
			// 	// var code = '[vd_convert ' + dynEle.text() + ']';

			// 	switch (attr)
			// 	{
			// 		case 'text': 	
			// 		{ 
			// 			// Remove all text
			// 			target.contents().filter(function(){
			// 				return (this.nodeType == 3);
			// 			}).remove();
			// 			target.children('*').remove();
			// 			target.append(document.createTextNode(code)); 
			// 		} 
			// 		break;
			// 		case 'href': 	
			// 		{ 
			// 			var anchor = target.closest('a');
			// 			if (anchor.length)
			// 				anchor.attr(attr, code); 
			// 		}
			// 		break;
			// 		case 'bk-src': 
			// 		{ 
			// 			// MAJOR ISSUE!!! JQuery::css() will NOT apply the background-image/background if has spaces or not wrapped in "". AND WordPress doesn't like quotation marks. Its a fukin paradox!!!!!!!!
				    
			// 	    console.log('before', target.attr('style'));
			// 	    var formattedCode = code.replace(/\"/g, '');
			// 			var inlineStyle = target.attr('style') || '';
			// 	    inlineStyle = inlineStyle.replace(/background-image\s*:\s*url\s*\(.*?\)/gmi, 'background-image: url(' + formattedCode + ')');
			// 	    target.attr('style', inlineStyle);
			// 	    console.log('after', target.attr('style'));
			// 		} 
			// 		break;
			// 		default: 
			// 		{ 
			// 			target.attr(attr, code);
			// 		} 
			// 		break;
			// 	}
			// });

			// return designer;
		},

		vdOnUnsetDynamic: function(e, params) {
			// var widget = params.widget;
			// var widgetId = widget.attr('id');
			// var designer = widget.vdPolymorphic('getDesigner');
			// // var dynCnt = this.getDynamicContainer(designer);
			// // $('vdwp[for="' + widgetId + '" i]', dynCnt).remove();
			// widget.removeAttr('vd-dynamic');
			// widget.vdPolymorphic('setDynamic', true);
		},

		showCustomFields: function(menu, widget) {
			if (!widget.model)
				return;

			// var customFields = this.customFields[widget.model];
			$('option', menu.inputEle).each(function() {
				if ($(this).attr('template') == widget.model)
					$(this).show();
				else $(this).hide();
			});
		},

		getCustomFields: function() {
			// Get all custom fields for all posts, pages, custom posts, etc
			// Each widget needs to react to the show() of their 'dynamic' menu 
			// and only show relevant custom fields based off their model and their
			// widget type
			var self = this;
			if (self.isProcessing) {
				console.log('Cant do; is processing');
				return true;
			}
			self.isProcessing = true;

			var data = {
	      'action': 'vd_get_custom_fields',
	      'nonce': vdObj.shortcode_nonce, //$('[data-type="vd-shortcode-nonce"]').attr('vd-nonce'),
      };

			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : data,
				success: function(response) {
					if(response.type == "success") {
						self.options.customFields = response.customFields;
					}
					else {
					   console.log('vdposts error', response.message );
					}
				},
				complete: function() {
					self.isProcessing = false;
				}
			});
		},

		vdOnBulkUpgradeWidget: function(e, params) {
			var toRemove = [];
			var self = this;
			if (params.oldVersion <= 1.2) {
				console.log('*********upgrading to 1.2');
				params.designer.element.addClass('vd-pre-1-2');
				// Upgrade dynamic WP elements
				// <vdwp class="wp-code" a="text" type="hidden" style="font-size: 0px !important; color: transparent !important;">c="S_T" attr="text" </vdwp>
				$('[vd-dynamic]', params.designer.element).each(function() {
					// var target = getPrimitiveTarget($(this), $(this).attr('vd-type'));
					var dynJSON = JSON.parse('{"config":{"type":"wp", "target": "#' + $(this).attr('id') +'"}}');

					$('vdwp', $(this)).each(function() {
						var vdwp = $(this);
						dynJSON[vdwp.attr('a')] = {code: vdwp.html()};
					});

					$(this).attr('vd-dynamic', encodeURIComponent( JSON.stringify(dynJSON) ));
				});

				// Remove outer div's on primitives
				var getPrimitiveTarget = function(ele, type) {
					switch (type.trim().toLowerCase())
					{
						case 'img': 	{ return $('img', ele).first(); 														} break;
						case 'text': 	{ return $(ele).children('p,h1,h2,h3,h4,h5,h6,a').first(); 	} break;
						case 'btn': 	{ return $(ele).children('a').first(); 											} break;
						case 'video': { return $('video', ele).first(); 													} break;
						case 'audio': { return $('audio', ele).first(); 													} break;
						case 'hr': 		{ return $('hr', ele).first(); 															} break;
						default: 			{ return ele; 																							} break;
					}
				};
				$('[vd-type="img"], [vd-type="text"], [vd-type="btn"], [vd-type="video"], [vd-type="audio"], [vd-type="hr"]', params.designer.element).each(function() {
					// TODO: check if has alignment
					var target = getPrimitiveTarget($(this), $(this).attr('vd-type'));
					// Copy over vd-xxxxx-hidden and etc.
					var desktopHidden = target.hasClass('vd-desktop-hidden'); 
					var tabletHidden = target.hasClass('vd-tablet-hidden'); 
					var mobileHidden = target.hasClass('vd-mobile-hidden');
					$.each(this.attributes, function() {
				    if (this.specified && this.name.trim().toLowerCase() != 'id')
				      target.attr(this.name, this.value);
				  });
				  target.removeAttr('vd-style-identifier');
				  self.upgradePrimitiveAlignment(params.designer, $(this), target);

				  if (desktopHidden)
				  	target.addClass('vd-desktop-hidden');
				  if (tabletHidden)
				  	target.addClass('vd-tablet-hidden');
				  if (mobileHidden)
				  	target.addClass('vd-mobile-hidden');
					
				  if (target.parent().is("a"))
				  	target.parent().insertAfter($(this));
				  else target.insertAfter($(this));
				  
				  $(this).remove();
				  // toRemove.push($(this));
				});

				// Remove pure css classes
				$('[vd-type="column"],[vd-type="nav-cnt"]', params.designer.element).each(function() {
					$(this).removeClass(function (index, className) {
					    return (className.match (/(^|\s)pure-\S+/g) || []).join(' ');
					});
				});

				// Replace horz cnt classes
				$('.vd-container-horiz', params.designer.element).removeClass('vd-container-horiz').addClass('vd-horz');

				$('.vd-btn-widget.vd-text-widget', params.designer.element).removeClass('vd-text-widget');

				$('[vd-link]:not(.vd-btn-widget)', params.designer.element).removeAttr('vd-link').attr('vd-type', 'link');

				// Remove deprecated classes
				$('*', params.designer.element).removeClass('vd-container-fluid vd-row-container vd-content-widget vd-structural-widget vd-nav-cnt vd-widget');

				// TODO: handle widgets with vd-align class (need to decide if to add vd-c-center, etc)

				// $(toRemove).remove();
			}
		},

		upgradePrimitiveAlignment: function(designer, outer, inner, prefix) {
			var self = this;
			prefix = prefix || '-';
			var outerId = outer.attr('id');
			if (!outerId || !outerId.length)
				return;

			// var styles = designer.getWidgetStyle('#' + outerId);
			// if (!styles || !styles.length || !styles[0].length)
			// 	return;

			var views = ['desktop', 'tablet', 'mobile'];
			for (var i in views) {
				var styles = designer.getWidgetStyle('#' + outerId, views[i]);
				if (!styles || !styles.length || !styles[0].length)
					continue;
				console.log('upgrade', outerId, styles);
				// styles[i][0].style[k] = styles[k];
				var flexAlign = styles[0][0].style['align-self'];
				var flexJustify = styles[0][0].style['justify-self'];
				var textAlign = styles[0][0].style['text-align'];

				switch (flexAlign) {
					case 'flex-start':
					case 'start':
					{
						$.each(styles, function(i,s) { s[0].style['align-self'] = ''; s[0].style['text-align'] = ''; });
						inner.addClass(this.options.alignments.self[views[i]].top);
					}
					break;
					case 'center':
					{
						$.each(styles, function(i,s) { s[0].style['align-self'] = ''; s[0].style['text-align'] = ''; });
						inner.addClass(this.options.alignments.self[views[i]].middle);
					}
					break;
					case 'flex-end':
					case 'end':
					{
						$.each(styles, function(i,s) { s[0].style['align-self'] = ''; s[0].style['text-align'] = ''; });
						inner.addClass(this.options.alignments.self[views[i]].bottom);
					}
					break;
					default: {} break;
				}

				switch (textAlign) {
					case 'left':
					{
						$.each(styles, function(i,s) { s[0].style['justify-self'] = ''; s[0].style['text-align'] = ''; });
						inner.addClass(this.options.alignments.self[views[i]].left);
					}
					break;
					case 'center':
					{
						$.each(styles, function(i,s) { s[0].style['justify-self'] = ''; s[0].style['text-align'] = ''; });
						inner.addClass(this.options.alignments.self[views[i]].center);
					}
					break;
					case 'right':
					{
						$.each(styles, function(i,s) { s[0].style['justify-self'] = ''; s[0].style['text-align'] = ''; });
						inner.addClass(this.options.alignments.self[views[i]].right);
					}
					break;
					default: {} break;
				}
			}
		},
	});

//})( jQuery, window, document );
})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  // Dont namespace as vdw_wp
  $.widget( "vd.feedbackWidget", $.vdw.modalWidget, {

    name: "vd-feedback-widget",

    vdType: 'feedback',

    a_body: '<form class=\"vd-form\"><fieldset><legend><\/legend><div class=\"vd-row-widget\" style="padding: 0 !important;"><div class=\"vd-1 vd-column-widget\" style=\"text-align: left !important; font-size: 15px !important; padding: 0 !important;\"><p style=\"font-size: 15px !important;\"><strong>If you have a moment, please share why you are deactivating this plugin:<\/strong><\/p><label style=\"\" class=\"pure-radio\" for=\"vd-temp-deact\"><input type=\"radio\" id=\"vd-temp-deact\" name=\"vd-feedback\" value=\"vd-temp-deact\"> It&#x27;s a temporary deactivation <\/label><label style=\"\" class=\"pure-radio\" for=\"vd-not-working\"><input type=\"radio\" id=\"vd-not-working\" name=\"vd-feedback\" value=\"vd-not-working\"> I experienced issues using the plugin<textarea class=\"vd-1\" name=\"vd-issues-detail\" rows=\"2\" placeholder=\"ANY feedback about what went wrong is extremely helpful and allows me to identify and fix bugs :)\"><\/textarea><!-- <input class=\"vd-1 vd-column-widget\" type=\"email\" name=\"vd-issues-email\" placeholder=\"Please share the reason\"> --><\/label><label style=\"\" class=\"pure-radio\" for=\"vd-not-needed\"><input type=\"radio\" id=\"vd-not-needed\" name=\"vd-feedback\" value=\"vd-not-needed\"> I no longer need the plugin <\/label><label style=\"\" class=\"pure-radio\" for=\"vd-found-better\"><input type=\"radio\" id=\"vd-found-better\" name=\"vd-feedback\" value=\"vd-found-better\"> I have found a better alternative plugin <\/label><label style=\"\" class=\"pure-radio\" for=\"vd-other\"><input type=\"radio\" id=\"vd-other\" name=\"vd-feedback\" value=\"vd-other\"> Other<br><input class=\"vd-1\" type=\"text\" name=\"vd-other-feedback\" placeholder=\"Please share the reason\"> <\/label><br\/> <\/div><div class=\"vd-submit-btn vd-center vd-midd vd-1 vd-column-widget vd-center\"><button type=\"submit\" class=\"vd-menu-btn vd-center vd-middle\" style=\"margin-top: 20px;\"><i class=\"material-icons\">&#xE163;<\/i> <span>Submit &amp; Deactivate<\/span><\/button><\/div><div class=\"vd-submit-btn vd-column-widget vd-7\" style=\"display: none;\"><button type=\"cancel\" class=\"vd-menu-btn\" data-dismiss=\"modal\"><i class=\"material-icons\">&#xE14C;<\/i> <span>Skip &amp; Deactivate<\/span><\/ vd-center vd-middlebutton><\/div><div class=\"vd-column-widget vd-1 output\"><span><\/span><\/div><\/div><\/fieldset><input id="vd-feedback-type" type="hidden" name="vd-feedback-type" value="A"/><\/form>',

    b_body: '<form class="vd-form"><fieldset><div class="vd-row-widget" style="padding: 20px 0px !important;"><div class="vd-1 vd-column-widget" style="text-align: left !important; font-size: 15px !important; padding: 0 !important;"><style type="text/css">.vdf-lbl{color:#aaa;margin:10px;margin-top:0px}.vdf-lbl .vd-icon-widget{padding:2px}.vdf-lbl:hover{color:#ff0072;transition:0.3s bezier}.vdf-lbl.vd-selected{color:#e41b51}.vdf-lbl.vd-selected .vd-icon-widget{border:solid 2px #e41b51;border-radius:50%}</style><h3 class="vd-text-widget vd-center" vd-type="text" id="mvdid-1-6" vd-text-type="p" style=""><span class="">Overall how would you rate your experience with My Header Footer?</span></h3><div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-5" style="width: 90%; border-radius: 3px;"><div class="vd-container-widget vd-horz vd-sm-horz vd-xs-horz vd-c-center" vd-type="container" id="mvdid-1-7" style="padding: 0px;"> <label style="" class="pure-radio vdf-lbl" for="vd-angry" style="margin: 10px;"><span class="vd-icon-widget fas fa-angry" style="font-size: 46px; line-height: 46px;" vd-type="icon" id="mvdid-1-8" vd-font-units="px"> </span> <input type="radio" id="vd-angry" name="vd-feedback" value="vd-terrible" style="display: none;"> </label> <label style="" class="pure-radio vdf-lbl" for="vd-sad" style="margin: 10px;"><span class="vd-icon-widget fas fa-frown" style="font-size: 46px; line-height: 46px;" vd-type="icon" id="mvdid-1-9" vd-font-units="px"> </span> <input type="radio" id="vd-sad" name="vd-feedback" value="vd-unhappy" style="display: none;"> </label> <label style="" class="pure-radio vdf-lbl" for="vd-meh" style="margin: 10px;"><span class="vd-icon-widget fas fa-meh" style="font-size: 46px; line-height: 46px;" vd-type="icon" id="mvdid-1-10" vd-font-units="px"> </span> <input type="radio" id="vd-meh" name="vd-feedback" value="vd-ok" style="display: none;"> </label> <label style="" class="pure-radio vdf-lbl" for="vd-smile" style="margin: 10px;"><span class="vd-icon-widget fas fa-smile" style="font-size: 46px; line-height: 46px;" vd-type="icon" id="mvdid-1-11" vd-font-units="px"> </span> <input type="radio" id="vd-smile" name="vd-feedback" value="vd-happy" style="display: none;"> </label> <label style="" class="pure-radio vdf-lbl" for="vd-happy" style="margin: 10px;"><span class="vd-icon-widget fas fa-laugh" style="font-size: 46px; line-height: 46px;" vd-type="icon" id="mvdid-1-12" vd-font-units="px"> </span> <input type="radio" id="vd-happy" name="vd-feedback" value="vd-ecstatic" style="display: none;"> </label></div><p class="vd-left" style="font-size: 15px !important; margin: 8px 5px 3px 5px;"><span>Why do you feel that way?</span></p><textarea class="vd-1" name="vd-issues-detail" rows="2" placeholder=""></textarea><!--<input style="margin-top: 10px; margin-bottom: 10px;" class="vd-1" type="email" name="vd-issues-email" placeholder="Your email (optional)">--><a href="https://www.visualdesigner.io/feedback?de" target="_blank" style="color: #e41b51; margin: 10px 0px;">Want to make US$50? Provide more feedback here</a></div> <br/></div><div class="vd-submit-btn vd-center vd-midd vd-1 vd-column-widget vd-center"> <button type="submit" class="vd-menu-btn vd-center vd-middle"><i class="material-icons">&#xE163;</i> <span>Submit &amp; Deactivate</span></button></div><div class="vd-submit-btn vd-column-widget vd-7" style="display: none;"> <button type="cancel" class="vd-menu-btn" data-dismiss="modal"><i class="material-icons">&#xE14C;</i> <span>Skip &amp; Deactivate</span></button></div><div class="vd-column-widget vd-1 output"><span></span></div></div></fieldset><input id="vd-feedback-type" type="hidden" name="vd-feedback-type" value="B"/></form>',

    defaults: {
      widgetClass: "vd-support",
      // template: '',
      // sortContainer: '.vd-content-widget',
    },

    options: {
      title: '<h3 style="font-size: 24px !important;">Feedback</h3>',
    },

    _create: function () {
      var self = this;
      var b_test = this.options.activationDuration && this.options.activationDuration < 500.00 && this.options.runs && this.options.runs >= 1;

      // Have they used the editor atleast once AND has had the plugin installed less than 500 mins
      if (b_test)
       this.options.content = this.b_body;
      else this.options.content = this.a_body;

      // this.element.addClass('vd-support');
      this._super();

      if (b_test) {
        $('[name="vd-feedback"]', self.element).on("change", function() {
          $('.vdf-lbl.vd-selected').removeClass('vd-selected');
          $(this).closest('.vdf-lbl').addClass('vd-selected');
        });
      }
      else {
        $('[name="vd-issues-detail"]', self.element).css('display', 'none');

        $('[name="vd-feedback"]', self.element).on("change", function() {
          var selected = $(this).val();
          var state = (selected == 'vd-not-working') ? true : false;
          if (state)
            $('[name="vd-issues-detail"]', self.element).slideDown(50, 'swing');
          else $('[name="vd-issues-detail"]', self.element).slideUp(50, 'swing');
        });
      }
    },

    onSubmit: function(e) {
      e.preventDefault();
      var self = this;

      if (self.isProcessing) {
        console.log('Cant do; is processing');
        window.location.href = this.options.deactivateUrl;
        return true;
      }


      self.isProcessing = true;
      var outputEle = $('.output span', self.element);
      var data = $('form', self.element).serializeArray().reduce(function(m,o){ m[o.name] = o.value; return m;}, {}); 
      var params = {
        data: data,
        outputEle: outputEle,
        instance: self,
        killSpinner: true,
      };

      outputEle.html('');
      outputEle.removeClass('success error');
      this.submit(params);
      
      if (params.killSpinner) {
          // menuWidget.vdPolymorphic('endSpinBtn', btn);
          self.isProcessing = false;
      }
    },

    submit: function(params) {
      var self = this;
      params.instance.isProcessing = true;
      params.killSpinner = false;
      $('button[type="submit"]', self.element).css('opacity', '0.5');
      
      // var nonce = vdObj.shortcode_nonce; 
      params.data.action      = 'vd_feedback_request';
      // params.data.nonce       = nonce;
      params.data.platform    = window.navigator.platform;
      params.data.os          = window.navigator.oscpu;
      params.data.useragent   = window.navigator.userAgent;

      params.outputEle.html('Deactivating...');
      
      jQuery.ajax({
        type : "post",
        dataType : "json",
        url : vdObj.ajax,
        data : params.data,
        success: function(response) {
          params.outputEle.addClass('success');
          params.outputEle.html(response.message);
          console.log('success', response.message);
        },
        error: function() {
          params.outputEle.addClass('error');
          params.outputEle.html('An error occurred please try again later');
        },
        complete: function() {
          params.instance.isProcessing = false;
          window.location.href = self.options.deactivateUrl;
          $('button[type="submit"]', self.element).css('opacity', '');
        }
      });
    },

    cancel: function(ev) {
      this._super(ev);
      window.location.href = this.options.deactivateUrl;
    },
  });


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.postWidget", $.vdw.baseWidget, {

		name: "vd-post-widget",

		vdType: 'wp-post',

		defaults: {
			classes: "",
			menuBtns: {
				"add-shortcode": {
				index: 1,
				icon: "&#xE8C0;",
				popupText: 'Shortcode',
				input: {
					type: 'textareaInput',
					icon: "&#xE8C0;",
					placeholder: 'id',
					popupText: 'Load Post',
					callback: function(value, btn) {
						var self = this;

						self.isProcessing = true;

						var menu = $(btn.closest('.vd-menu')).first();
						menu.vdPolymorphic('beginSpinBtn', $(btn));

						self.element.attr('vd-post', value);
						var nonce = $('[data-type="vd-post-nonce"]').attr('vd-nonce');

						var data = {
				            'action': 'vd_do_post',
				            'nonce': nonce,
				            'post': value
				        };

						jQuery.ajax({
							type : "post",
							dataType : "json",
							url : vdObj.ajax,
							data : data,
							success: function(response) {
								
								if(response.type == "success") {

									self.removePlaceholder();

									var content = response.content.replace(/\\"/g, '"');
									self.element.html( content );

									$.vdg.manager('showDialogMsg', {title: "Success", content: '<br/><h3>Helpful tip</h3><p>If your post is not rendering correctly please save your design and refresh the page.</p><br/><br/>'}); 
								}
								else {
								   	$.vdg.manager('showDialogMsg', {title: response.type, content: '<p>' + response.message + '</p>'}); 
								}
							},
							complete: function(response) {
								menu.vdPolymorphic('endSpinBtn', $(btn));
								self.isProcessing = false;
							}
						});
					},
					show: function() {
						return this.element.attr('vd-post');
					}
				}
			}
			},
			hiddenMenuBtns: {
				"create-component": true,
			},
		},

		placeholder: null,

		_create: function () {

			this.element.addClass("vd-post-widget");

			if (!this.options.preserveContent)
				this.addPlaceholder();

			this.getFramework().trigger('vdOnCreatepostWidget', {widget: this});

			this._super();
		},

		addPlaceholder: function() {

			var self = this;

			var existingPost = self.element.attr('vd-post');
			
			if (!existingPost || existingPost.length <= 0)
				self.placeholder = $('<p vd-placeholder>insert post id</p>').appendTo(self.element);
		},

		removePlaceholder: function() {

			var self = this;

			if (self.placeholder) {
				self.placeholder.remove();
				self.placeholder = null;
			}
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.runningDesigner", $.vd.visualDesigner, {

		name: "vd-running-designer",

		vdType: 'running-designer',

		defaults: {
			widgetClass: "vd-running-designer",
			template: '',
			menuBtns: {
				"set-runner": {
					index: 1,
					isLayout: true,
					icon: "&#xE8C0;",
					popupText: 'Select a template<br/>(header, footer, etc.)',
					input: {
						type: 'dropdownInput',
						icon: "&#xE8C0;",
						tooltip: 'Select an existing web element',
						popupText: 'Select an existing web element',
						dropdownOptions: [
							{value: '109', display: 'Main Header'},
							{value: '110', display: 'Main Footer'},
						],
						callback: function(value, btn, data, menu) {
							this.onSelectPost(value, btn, data, menu);
						},
						show: function(menu) {
							return this.showTemplatePosts(menu);
						}
					}
				},
				"new-runner": {
					index: 2,
					isLayout: true,
					icon: "&#xe173;",
					popupText: 'Create new template<br/>(header, footer, etc.)',
					input: {
						type: 'inputMenu',
						icon: "&#xe173;",
						placeholder: 'Web element name',
						popupText: 'Create new web element (header, footer, etc.)',
						callback: function(values, target, data, menu) {

							return this.onNew(values['new-runner'], target, false, menu);
						}
					}
				},
				"save-as-runner": {
					index: 2,
					isLayout: true,
					icon: "&#xe168;",
					popupText: 'Save as <br/>Copy and save existing template',
					input: {
						type: 'inputMenu',
						icon: "&#xe168;",
						placeholder: 'Web element name',
						popupText: 'Save as - Copy and save existing web element',
						callback: function(values, target, data, menu) {

							return this.onSaveAs(values['save-as-runner'], target, data, menu);
						},
					}
				},
				"assign-runner": {
					index: 4,
					isLayout: true,
					faIcon: "fab fa-buffer",
					popupText: 'Assign template',
					input: {
						type: 'dropdownInput',
						icon: "&#xE8C0;",
						tooltip: 'Assign this template to all posts of this type',
						popupText: 'Assign this template to all posts of this type',
						dropdownOptions: [
							{value: '109', display: 'Main Header'},
							{value: '110', display: 'Main Footer'},
						],
						callback: function(value, target, data, menu) {
							console.log('value', value);
							this.onAssignTemplate(value, target, data, menu);
						},
						// show: function(menu) {
						// 	return this.showCustomPostTypes(menu);
						// }
					}
				},
			},
		},

		_create: function () {
			var self = this;
			this.element.attr('designer-type', 'runningDesigner');
			this._super();
		},

		_destroy: function () {

		},

		uniqueId: function() {
			this.element.attr('id', 'rvdid-'+this.element.attr('vd-post-id'));
		},

		// setVDPostsMeta: function(meta) {
		// 	this.options.menuBtns['set-runner'].input.dropdownOptions = meta;
		// 	$('[vd-menu="set-runner"]').vdPolymorphic('setDropdownOptions', meta);
		// },

		setVDPostsMeta: function(meta) {
			if (meta.customPosts && meta.customPosts.length) {
				this.options.menuBtns['assign-runner'].input.dropdownOptions = meta.customPosts;
				$('[vd-menu="assign-runner"]').vdPolymorphic('setDropdownOptions', meta.customPosts);
			}
			if (meta.webElePosts && meta.webElePosts.length) {
				this.options.menuBtns['set-runner'].input.dropdownOptions = meta.webElePosts;
				$('[vd-menu="set-runner"]').vdPolymorphic('setDropdownOptions', meta.webElePosts);
			}
		},

		showTemplatePosts: function(menu) {
			var tmpl = this.getDesigner().attr('vd-tmpl').trim().toLowerCase();
			$('option', menu.inputEle).each(function() {
				if ($(this).attr('template') == tmpl)
					$(this).show();
				else $(this).hide();
			});

			return this.element.attr('vd-post-id');
		},

		updateTarget: function(postId) {
			var targetProp = this.element.parent().prevAll('[vd-target]');

			if (!targetProp.length)
				return;

			var option = targetProp.attr('vd-target');
			$.vdg.manager('option', 'runningTargets')[option] = parseInt(postId, 10);
		},

		onSelectPost: function(postId, btn, fData, menu) {
			console.log('onSelectPost', postId, btn);
			var self = this;
			if (self.isProcessing)
  			return;

			self.isProcessing = true;
			// var menu = $(btn.closest('.vd-menu')).first();
			menu.beginSpinBtn();

			var data = {
	      'action': 'vd_do_shortcode',
	      'nonce': vdObj.shortcode_nonce, //$('[data-type="vd-shortcode-nonce"]').attr('vd-nonce'),
	      'shortcode': "[vd_get_post id=" + postId + "]"
      };

			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : data,
				success: function(response) {
					if(response.type == "success") {
						// self.updateTarget(postId);
						// var content = decodeURIComponent(response.data); // response.data.replace(/\\"/g, '"');
						var content = response.data.replace(/\\"/g, '"');
						$.vdg.manager('changeDesigner', {
							existingDesigner: self, 
							newDesignerHTML: content
						});

						// TODO: show manager menu button 'Save Template changes'
					}
					else {
					   	$.vdg.manager('showDialogMsg', {title: response.type, content: '<p>' + response.message + '</p>'}); 
					}
				},
				complete: function(response) {
					menu.endSpinBtn();
					self.isProcessing = false;
				}
			});
		},

		onNew: function(postName, btn, postContent, menu) {
			// Send Ajax request to server to create new vd element
			var self = this;
			if (self.isProcessing)
  			return;
  		if (!postName || postName.length <= 0)
  			return;
  		if (postContent)
  			postContent = encodeURIComponent(postContent);

  		var nonce = vdObj.shortcode_nonce; //$('[data-type="vd-shortcode-nonce"]').attr('vd-nonce');
  		var shortcode = 'vd_create_post name="' + postName + '" nonce="' + nonce + '" ';
  		if (postContent)
  			shortcode += ' content="' + postContent + '" ';
  		if (this.getDesigner().attr('vd-tmpl'))
      	shortcode += ' vd_tmpl="' + this.getDesigner().attr('vd-tmpl') + '" ';
  		if (this.getDesigner().attr('vd-gtmpl'))
      	shortcode += ' vd_gtmpl="' + this.getDesigner().attr('vd-gtmpl') + '" ';

			self.isProcessing = true;
			// var menu = $(btn.closest('.vd-menu')).first();
			menu.beginSpinBtn();
			var data = {
	      'action': 'vd_do_shortcode',
	      'json_response_data': true,
	      'nonce': nonce,
	      'shortcode': '[' + shortcode + ']'
      };

			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : data,
				success: function(response) {
					if(response.type === "success" && response.data.type === "success") {
						// self.updateTarget(response.data.postId);
						// var content = decodeURIComponent(response.data.post_content); //response.data.post_content.replace(/\\"/g, '"'); //.replace(/&quot;/g, '"');   //.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
						var content = response.data.post_content.replace(/\\"/g, '"'); 
						
						$.vdg.manager('changeDesigner', {
							existingDesigner: self, 
							newDesignerHTML: content
						});

						// var content = response.data.replace(/\\"/g, '"');
						// $.vdg.manager('changeDesigner', {
						// 	existingDesigner: self, 
						// 	newDesignerHTML: content
						// });

						self.framework('getRunningPostNames');
					}
					else {
						$.vdg.manager('showDialogMsg', {title: response.type, content: '<p>' + response.message + '</p>'}); 
					}
				},
				complete: function(response) {
					menu.endSpinBtn();
					self.isProcessing = false;
				}
			});
		},

		onSaveAs: function(postName, btn, data, menu) {
			var vdWidget = $.vdg.manager('getSelectedVisualDesigner'); 
      var designData = vdWidget.vdPolymorphic('export');
			this.onNew(postName, btn, designData.content, menu);
		},

		onAssignTemplate: function(postType, btn, m_data, menu) {
			console.log('onAssignTemplate', postType, btn);
			var self = this;
			if (self.isProcessing)
  			return;

			self.isProcessing = true;
			menu.beginSpinBtn();

			var data = {
	      'action': 'vd_assign_template',
	      'nonce': vdObj.shortcode_nonce,
	      'custom_post_type': postType,
	      // 'tmpl_tag': 'undefined'
	      // 'tmpl_id': 'undefined'
      };

      if (this.getDesigner().attr('vd-tmpl'))
      	data.tmpl_tag = this.getDesigner().attr('vd-tmpl');
  		else if (this.getDesigner().attr('vd-gtmpl'))
      	data.tmpl_tag = this.getDesigner().attr('vd-gtmpl');

      if (this.getDesigner().attr('vd-post-id'))
      	data.tmpl_id = this.getDesigner().attr('vd-post-id');

			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : data,
				success: function(response) {
					if(response.type == "success")
						$.vdg.manager('showDialogMsg', {title: 'Success', content: '<p></p>'}); 
					else
						$.vdg.manager('showDialogMsg', {title: response.type, content: '<p>' + response.message + '</p>'}); 
				},
				complete: function(response) {
					menu.endSpinBtn();
					self.isProcessing = false;
				}
			});
		},

	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.shortcodeWidget", $.vdw.baseWidget, {

		name: "vd-shortcode-widget",

		vdType: 'shortcode',

		defaults: {
			widgetClass: "vd-shortcode-widget",
			tagName: 'Shortcode',
			template: '<p>insert shortcodes</p>',
			menuBtns: {
				"add-shortcode": {
				index: 1,
				icon: "&#xE8C0;",
				popupText: 'Shortcode',
				input: {
					type: 'textareaInput',
					icon: "&#xE8C0;",
					placeholder: '[shortcode id="1" foo="bar"]',
					popupText: 'Apply shortcode',
					callback: function(value, btn) {
						this.setShortcode(value, btn);
					},
					show: function() {
						return this.element.attr('vd-shortcode') || ' ';
					}
				}
			}
			}
		},

		_create: function () {
			// this.element.addClass("vd-shortcode-widget");

			this.getFramework().trigger('vdOnCreateshortcodeWidget', {widget: this});

			this._super();
		},

		handleClone: function(clone, cloneFunc) {
			cloneFunc(0, this.element);
		},

		setShortcode: function(value, btn) {
			var self = this;
			if (self.isProcessing)
				return true;

			self.isProcessing = true;
			var menu = $(btn.closest('.vd-menu')).first();
			menu.vdPolymorphic('beginSpinBtn', $(btn));
			self.element.attr('vd-shortcode', value['add-shortcode']);
			var nonce = vdObj.shortcode_nonce; //$('[data-type="vd-shortcode-nonce"]').attr('vd-nonce');
			var data = {
        'action': 'vd_do_shortcode',
        'nonce': nonce,
        'shortcode': value['add-shortcode'] // encodeURIComponent(value)
      };

			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : data,
				success: function(response) {
					
					if (response.type != "success") {
            return $.vdg.widgetFactory('modalWidget', {
                title: response.type,
                content: '<p>' + response.message + '</p>'
            }, self.element);
					}

					self.removeDefaultContent();
					// var content = decodeURIComponent(response.data); //.data.replace(/\\"/g, '"');
					var content = response.data.replace(/\\"/g, '"');

					try {
						self.removeTag();
						self.element.html( content );
						self.disableAnchors();
					}
					catch (ex) {
						console.log('Failed to load shortcode via Ajax', ex.message);
					}

					$.vdg.widgetFactory('modalWidget', {
              title: "Success",
              content: '<br/><h3>Helpful tip</h3><p>If your shortcode is not rendering correctly please save your design and refresh the page.</p><br/><br/>'
          }, self.element);
				},
				complete: function(response) {
					menu.vdPolymorphic('endSpinBtn', $(btn));
					self.isProcessing = false;
				}
			});
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpAuthorWidget", $.vdw.textWidget, {

		name: "vd-wp-author",

		vdType: 'wp-author',

		defaults: {
			classes: "",
			tagName: 'Author'
		},

		addDefaultContent: function() {
			this.wpType = 'T_A';
			this.wpCode = '[vd_convert c="T_A"]';
		},

		onExport: function() {
			var clone = this.element.clone();
			clone.children().first().text( this.wpCode );
			return clone;
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpContentWidget", $.vdw.baseWidget, {

		name: "vd-wp-content",

		vdType: 'wp-content',

		defaults: {
			classes: "",
			tagName: 'Content'
		},

		addDefaultContent: function() {
			this.wpType = 'T_C';
			this.wpCode = '[vd_convert c="T_C"]';
		},

		onExport: function() {
			var clone = this.element.clone();
			clone.children().first().text( this.wpCode );
			return clone;
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpMenuWidget", $.vdw.containerWidget, {

		name: "vd-wp-menu",

		vdType: 'wp-menu',

		defaults: {
			widgetClass: "vd-wp-menu",
			tagName: 'WP Menu',
			postType: 'menu',
			repeat: 3,
			menuBtns: {
				"menu": {
					index: 1,
					icon: "&#xE8C0;",
					popupText: 'Select which menu to show',
					input: {
						type: 'dropdownInput',
						icon: "&#xE8C0;",
						popupText: 'Select which menu to show',
						dropdownOptions: [
							{value: '', display: ''},
							{value: 't', display: 't'},
							{value: 'Foo', display: 'Foo'},
						],
						callback: function(value, btn) {
							this.options.menuId = value;
							this.updateRepeater();
						}
					}
				},
				// "repeat": {
				// 	index: 2,
				// 	icon: "H",
				// 	popupText: 'Number of posts',
				// 	input: {
				// 		type: 'sliderInput',
				// 		icon: "H",
				// 		popupText: 'Number of posts',
				// 		value: 8,
				// 		min: 1,
				// 		max: 20,
				// 		step: 1,
				// 		callback: function(values, target) {
				// 			this.options.repeat = values.slider;

				// 			if (values.registerUndo)
				// 				this.updateRepeater();
				// 		},
				// 		show: function() {
				// 			return this.options.repeat;
				// 		}
				// 	}
				// },
				// "filter": {
				// 	index: 3,
				// 	icon: "&#xE8C0;",
				// 	popupText: 'Filters',
				// 	input: {
				// 		type: 'dropdownInput',
				// 		icon: "&#xE8C0;",
				// 		popupText: 'Filters',
				// 		dropdownOptions: [
				// 			{value: '', display: ''},
				// 			// {value: 'post,', display: 'Post'},
				// 			// {value: 'page,', display: 'Page'},
				// 		],
				// 		// callback: function(value, btn) {
				// 		// 	this.options.postType = value;
				// 		// }
				// 	}
				// },
				// "sort": {
				// 	index: 3,
				// 	icon: "&#xE8C0;",
				// 	popupText: 'Sort by',
				// 	input: {
				// 		type: 'dropdownInput',
				// 		icon: "&#xE8C0;",
				// 		popupText: 'Sort by',
				// 		dropdownOptions: [
				// 			{value: '', display: ''},
				// 			// {value: 'post,', display: 'Post'},
				// 			// {value: 'page,', display: 'Page'},
				// 		],
				// 		// callback: function(value, btn) {
				// 		// 	this.options.postType = value;
				// 		// }
				// 	}
				// },
			}
		},

		_create: function() {
			this.element.addClass('vd-horz');
			this._super();

			// Register btns style
			this.registerWidgetStyle(this.getBtnSelector());
		},

		addDefaultContent: function() {
			this.options.menuId = 3;
			this.updateRepeater();
		},

		getBtnSelector: function() {
			return '#' + this.element.attr('id') + ' .vd-btn-widget'; 
		},

		updateRepeater: function() {
			var self = this;
			var selector = self.getBtnSelector();
			var tmpl = '<a class="vd-btn-widget" vd-type="btn" vd-text-type="a" href="VDC_HREF"vd-dynamic="true" vd-style-identifier="' + selector + '"><span>VDC_TITLE</span></a>';

			this.getFramework().vdPolymorphic('setDynamicContent', {
				c: 'M_I',
				attr: 'txt',
				mid: self.options.menuId,
				tmpl: encodeURIComponent(tmpl)
			}, this.element);
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpPostWidget", $.vdw.containerWidget, {

		name: "vd-wp-post",

		vdType: 'wp-post',

		defaults: {
			classes: "",
			tagName: 'Post',
			menuBtns: {
				"dynamic": {
					index: 1,
					icon: "&#xE8C0;",
					popupText: 'Select a post/page/custom post',
					input: {
						type: 'dropdownInput',
						icon: "&#xE8C0;",
						popupText: 'Select a post/page/custom post',
						dropdownOptions: [
							{value: '', display: ''},
							{value: 'T_C,', display: 'The Content'},
						],
						callback: function(value, btn) {
							// this.getFramework().vdPolymorphic('setDynamicContent', value, this.element);
						}
					}
				},
			}
		},

		addDefaultContent: function() {
			this.getFramework().vdPolymorphic('setDynamicContent', 'T_C', this);
		},

		// onExport: function() {
		// 	var clone = this.element.clone();
		// 	clone.children().first().text( this.wpCode );
		// 	return clone;
		// }
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpRepeaterWidget", $.vdw.rowWidget, {

		name: "vd-wp-repeater",

		vdType: 'wp-repeater',

		defaults: {
			widgetClass: "vd-wp-repeater",
			tagName: 'Repeater',
			postType: 'post',
			repeat: 3,
			menuBtns: {
				"post-type": {
					index: 1,
					icon: "&#xE8C0;",
					popupText: 'Specify which post type to show',
					input: {
						type: 'dropdownInput',
						icon: "&#xE8C0;",
						popupText: 'Specify which post type to show',
						dropdownOptions: [
							{value: '', display: ''},
							{value: 'post', display: 'Post'},
							{value: 'page', display: 'Page'},
						],
						callback: function(value, btn) {
							this.options.postType = value;
							this.updateRepeater();
						}
					}
				},
				"repeat": {
					index: 2,
					icon: "H",
					popupText: 'Number of posts',
					input: {
						type: 'sliderInput',
						icon: "H",
						popupText: 'Number of posts',
						value: 1,
						min: 1,
						max: 20,
						step: 1,
						callback: function(values, target) {
							this.options.repeat = values.slider;

							if (values.registerUndo)
								this.updateRepeater();
						},
						show: function() {
							return this.options.repeat;
						}
					}
				},
				"filter": {
					index: 3,
					icon: "&#xE8C0;",
					popupText: 'Filters',
					input: {
						type: 'dropdownInput',
						icon: "&#xE8C0;",
						popupText: 'Filters',
						dropdownOptions: [
							{value: '', display: ''},
							// {value: 'post,', display: 'Post'},
							// {value: 'page,', display: 'Page'},
						],
						// callback: function(value, btn) {
						// 	this.options.postType = value;
						// }
					}
				},
				"sort": {
					index: 3,
					icon: "&#xE8C0;",
					popupText: 'Sort by',
					input: {
						type: 'dropdownInput',
						icon: "&#xE8C0;",
						popupText: 'Sort by',
						dropdownOptions: [
							{value: '', display: ''},
							// {value: 'post,', display: 'Post'},
							// {value: 'page,', display: 'Page'},
						],
						// callback: function(value, btn) {
						// 	this.options.postType = value;
						// }
					}
				},
			}
		},

		addDefaultContent: function() {
			this.updateRepeater();
		},

		updateRepeater: function() {
			var self = this;
			var tmpl = '<div class="vd-content-widget vd-column-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="column" desktop-width="12" tablet-width="12" mobile-width="12">[vd_convert c="T_T"] <br/>[vd_convert c="S_T_L"]</div>';
			
			this.getFramework().vdPolymorphic('setDynamicContent', {
				c: 'R_P2',
				attr: 'txt',
				// tid: templateId,
				ptype: self.options.postType,
				repeat: self.options.repeat,
				tmpl: encodeURIComponent(tmpl),
			}, this.element);
		},

		// updateRepeater: function() {
		// 	var self = this;
		// 	// var templateId = $(this.getDesigner().vdPolymorphic('option', 'vdPosts')).filter(function(i,ele){ return this.template.match(/vd_tmpl_post_smry/i); })[0].value;
		// 	console.log('vdPosts', $(this.getDesigner().vdPolymorphic('option', 'vdPosts')));
		// 	var templateId = 74;
		// 	var strt = '<div class="vd-9 vd-sm-9 vd-xs-1 vd-column-widget" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">';
		// 	var end = '</div>';
		// 	var firstCol = this.element.children('[vd-type="column"]').first();
		// 	if (firstCol.length) {
		// 		strt = firstCol[0].innerHTML ? firstCol[0].outerHTML.slice(0,firstCol[0].outerHTML.indexOf(firstCol[0].innerHTML)) : firstCol[0].outerHTML;
		// 		end = "</" + firstCol[0].tagName + ">";
		// 	}

		// 	this.getFramework().vdPolymorphic('setDynamicContent', {
		// 		c: 'R_P',
		// 		attr: 'txt',
		// 		tid: templateId,
		// 		ptype: self.options.postType,
		// 		repeat: self.options.repeat,
		// 		strt: encodeURIComponent(strt),
		// 		end: encodeURIComponent(end)
		// 	}, this.element);
		// },

		// onExport: function() {
		// 	var clone = this.element.clone();
		// 	clone.children().first().text( this.wpCode );
		// 	return clone;
		// }
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpSearchResultsWidget", $.vdw_wp.wpRepeaterWidget, {

		name: "vd-wp-search-results",

		vdType: 'wp-search-results',

		defaults: {
			classes: "",
			tagName: 'Search Results',
			postType: 'post',
			menuBtns: {
				"repeat": {
					hidden: true,
				},
			}
		},

		updateRepeater: function() {
			var self = this;
			var strt = '<div class="pure-u-lg-1-3 pure-u-md-1-3 pure-u-24-24 vd-column-widget" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">';
			var end = '</div>';
			var firstCol = this.element.children('[vd-type="column"]').first();
			if (firstCol.length) {
				strt = firstCol[0].innerHTML ? firstCol[0].outerHTML.slice(0,firstCol[0].outerHTML.indexOf(firstCol[0].innerHTML)) : firstCol[0].outerHTML;
				end = "</" + firstCol[0].tagName + ">";
			}
			console.log('strt', strt);
			console.log('end', end);

			this.getFramework().vdPolymorphic('setDynamicContent', {
				c: 'S_R',
				attr: 'txt',
				tid: 218,
				ptype: self.options.postType,
				repeat: self.options.repeat,
				strt: encodeURIComponent(strt),
				end: encodeURIComponent(end)
			}, this.element);
		},
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpSearchWidget", $.vdw.formWidget, {

		name: "vd-wp-search",

		vdType: 'wp-search',

		defaults: {
			classes: "",
			tagName: 'Search Form'
		},

		addDefaultContent: function() {
			this.wpType = 'S_F';
			this.wpCode = '[vd_convert c="S_F"]';
		},

		onExport: function() {
			var clone = this.element.clone();
			clone.children().first().text( this.wpCode );
			return clone;
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpSideBarWidget", $.vd.visualDesigner, {

		name: "vd-wp-sidebar",

		vdType: 'wp-sidebar',

		defaults: {
			classes: "",
			tagName: 'Sidebar'
		},

		addDefaultContent: function() {
			this.wpType = 'S_B';
			this.wpCode = '[vd_convert c="S_B"]';
		},

		onExport: function() {
			var clone = this.element.clone();
			clone.children().first().text( this.wpCode );
			return clone;
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpTemplateWidget", $.vdw_wp.shortcodeWidget, {

		name: "vd-wp-tmpl",

		vdType: 'wp-tmpl',

		wpType: null,

		wpCode: null,

		defaults: {
			classes: "",
			tagName: 'Template',
			menuBtns: {
				"add-shortcode": {
					hidden: true
				}
			}
		},

		_create: function () {
			if (!this.options.wpType || !this.options.wpType.length)
				throw 'wpTemplateWidget must have a wpType option';
			if (!this.options.wpCode || !this.options.wpCode.length)
				throw 'wpTemplateWidget must have a wpCode option';

			this.element.addClass("vd-wp-tmpl-widget");

			this._super();

			this.wpType = this.options.wpType;
			this.wpCode = this.options.wpCode;
		},

		onExport: function() {
			var clone = this.element.clone();
			clone.text( this.wpCode );
			return clone;
		},

		setShortcode: function(value, btn) {
			this._super(this.wpCode, {} );
			self.element.removeAttr('vd-shortcode');
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
 (function ($) {

  $.widget( "vdw_wp.wpTitleWidget", $.vdw.textWidget, {

		name: "vd-wp-title",

		vdType: 'wp-title',

		defaults: {
			classes: "",
			tagName: 'Title'
		},

		addDefaultContent: function() {
			this.wpType = 'T_T';
			this.wpCode = '[vd_convert c="T_T"]';
		},

		onExport: function() {
			var clone = this.element.clone();
			clone.children().first().text( this.wpCode );
			return clone;
		}
	});


})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

//;(function ( $, window, document, undefined ) {
 (function ($) {

	$.widget( "vd.wpbetaFramework", $.vd.wordpressFramework, {

		options: {
			menuYOffset: '40px', 

			baseWidget: {
				hiddenMenuBtns: {
					"box-shadow": true,
					"border-radius": true,
					"seo": true,
				}
			},

			visualDesigner: {
				hiddenMenuBtns: {
					//"web-design-cmps": true,
				}
			},

			// // visualDesigner: {
			// // 	hiddenMenuBtns: [
			// // 		"link"
			// // 	]
			// // },

			// sectionWidget: {
			// 	hiddenMenuBtns: [
			// 		"link"
			// 	]
			// },

			// rowWidget: {
			// 	hiddenMenuBtns: [
			// 		"link"
			// 	]
			// },

			columnWidget: {
				hiddenMenuBtns: {
					'add-slider-widget': true,
					'add-hero-img-widget': true,
					'add-card-widget': true,
					'add-ghost-btn-widget': true,
					'add-headline-widget': true,
					"add-hr": true
				},
			},

			btnWidget: {
				hiddenMenuBtns: {
					"icon": true,
				}
			},
		},

		vdOnPreInitialiseManager: function(e, params) {

			var exp = new Date('2018-12-15');
			var now = new Date();
			
			if (exp < now) {
				params.exit = true;
				this.expDialog();
				return;
			}
		},

		expDialog: function() {

			// vD Manager does not exist yet
			// $.vdg.manager('showDialogMsg', 'Beta Version Expired', '<h3>Thank you for beta testing vD.</h3>' +
			//   '<br/>' +
			//   '<p>Please visit the <a href="http://www.visualdesigner.io/" target="_blank">Visual Designer</a> website for more information.</p>');

			var popupTemplate =
			  '<div class="vd-modal vd-fade vd-msg-modal">' +
			  '  <div class="vd-modal-dialog">' +
			  '    <div class="vd-modal-content">' +
			  '      <div class="vd-modal-header">' +
			  '        <!--<button type="button" class="vd-close" data-dismiss="modal">&times;</button>-->' +
			  '        <h1 class="vd-modal-title">Beta Version Expired</h1>' +
			  '      </div>' +
			  '      <div class="vd-modal-body vd-text-center">' +
			  '		 	<h3>Thank you for beta testing vD.</h3>' +
			  '		 	<br/>' +
			  '		 	<p>Please visit the <a href="http://www.visualdesigner.io/" target="_blank">Visual Designer</a> website for more information.</p>' +
			  '      </div>' +
			  '      <div class="vd-modal-footer">' +
			  '        <!--<button type="button" class="vd-menu-btn vd-btn-block" data-dismiss="modal">Save</button>' +
			  '        <button type="button" class="vd-menu-btn vd-btn-block" data-dismiss="modal">Cancel</button>-->' +
			  '      </div>' +
			  '    </div>' +
			  '  </div>' +
			  '</div>';

			var dlg = $(popupTemplate).appendTo('body');
			dlg.wrap('<div class="vd-bootstrap"></div>');
			dlg.modal();
		}
	});

//})( jQuery, window, document );
})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

//;(function ( $, window, document, undefined ) {
 (function ($) {

	$.widget( "vd.bootstrap4Framework", $.vd.baseFramework, {

		options: {
			loadIcons: true,
			maxColumns: 12,
			menuYOffset: '10px',

			visualDesignerManager: {
				menuBtns: {
					"exit": {
            hidden: true,
          },

        }
      },

			visualDesigner: {
				classes: 'vd-bs4',
				menuBtns: {
					"web-design-cmps": {
						index: 3,
						icon: "&#xE90D;",
						popupText: 'Add Bootstrap Component',
						subMenu: {
							"nav": {
								index: 1,
								icon: "&#xE232;",
								popupText: 'Add Navigation',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var row = $.vdg.widgetFactory('rowWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, row);
									return $.vdg.widgetFactory('bs4NavWidget', {}, col);
								}
							},
							"jumbotron": {
								index: 2,
								icon: "&#xE232;",
								popupText: 'Add Jumbotron',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, $('[vd-type="row"]', section).first());
									return $.vdg.widgetFactory('bs4JumbotronWidget', {}, col);
								}
							},
							"card": {
								index: 3,
								icon: "&#xE232;",
								popupText: 'Add Card',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var cols = $('[vd-type="row"]', section).first().vdPolymorphic('addColumns', [4,4,4]);
									$.each(cols, function(i,v) {
										$.vdg.widgetFactory('bs4CardWidget', {}, v);
									});
									return;
								}
							},
							"carousel": {
								index: 4,
								icon: "&#xE232;",
								popupText: 'Add Carousel',
								autoPreview: true,
								callback: function(btn, btnOptions) {
									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, $('[vd-type="row"]', section).first());
									return $.vdg.widgetFactory('bs4CarouselWidget', {}, col);
								}
							},
							"accordion": {
								index: 5,
								icon: "&#xE232;",
								popupText: 'Add Accordion',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, $('[vd-type="row"]', section).first());
									return $.vdg.widgetFactory('bs4CollapseWidget', {}, col);
								}
							}
						}
					}
				}
			},

			baseWidget: {
				widgetTypes: { 
					// 'map': 'mapWidget', 
					// 'card': 'cardWidget',  
					// 'nav': 'navWidget',  
					// 'slider': 'sliderWidget',
					// 'nav-cnt': 'navCntWidget',
					// 'nav-hamburger': 'navHamburgerWidget',
					// 'slide': 'slideWidget'
				},
				menuBtns: {
					style: {
						"align": {
							input: {
								menuBtns: {
									'align-left': {
										name: 'text-left',
									},
									'align-center': {
										name: 'text-center',
									},
									'align-right': {
										name: 'text-right',
									}
								},
								callback: function(values, target) {

									return this.onAlignChange(values, target);
								},
								show: function() {
									return this.target.css('text-align');
								}
							}
						},
					}
				}
			},

			rowWidget: {
				classess: 'row',
				menuBtns: {
					// "add-column": {
					// 	subMenu: {
					// 		"add-1-column": {
					// 			index: 1,
					// 			popupText: '1 column',
					// 			icon: "&#xE3D0;",	
					// 			callback: function() {
					// 				this.addColumns([12]);
					// 			}
					// 		},
					// 		"add-2-column": {
					// 			index: 2,
					// 			icon: "&#xE3D1;",
					// 			popupText: '2 columns',
					// 			callback: function() {
					// 				this.addColumns([6,6]);
					// 			}
					// 		},
					// 		"add-3-column": {
					// 			index: 3,
					// 			icon: "&#xE3D2;",
					// 			popupText: '3 columns',
					// 			callback: function() {
					// 				this.addColumns([4,4,4]);
					// 			}
					// 		},
					// 		"add-4-column": {
					// 			index: 4,
					// 			icon: "&#xE3D4;",
					// 			popupText: '4 columns',
					// 			callback: function() {
					// 				this.addColumns([3,3,3,3]);
					// 			}
					// 		},
					// 		"add-5-column": {
					// 			index: 5,
					// 			icon: "&#xE3D5;",
					// 			popupText: '5 columns',
					// 			callback: function() {
					// 				this.addColumns([2,2,4,2,2]);
					// 			}
					// 		},
					// 		"add-6-column": {
					// 			index: 6,
					// 			icon: "&#xE3D6;",
					// 			popupText: '6 columns',
					// 			callback: function() {
					// 				this.addColumns([2,2,2,2,2,2]);
					// 			}
					// 		}
					// 	}
					// }
				},
			}, 
			columnWidget: {
				columnSizing: {
					desktop: {
						identifier: 'lg',
						1:  { classes: 'col-lg-1' },
						2:  { classes: 'col-lg-2' },
						3:  { classes: 'col-lg-3' },
						4:  { classes: 'col-lg-4' },
						5:  { classes: 'col-lg-5' },
						6:  { classes: 'col-lg-6' },
						7:  { classes: 'col-lg-7' },
						8:  { classes: 'col-lg-8' },
						9:  { classes: 'col-lg-9' },
						10: { classes: 'col-lg-10' },
						11: { classes: 'col-lg-11' },
						12: { classes: 'col-lg-12' },
					},
					tablet: {
						identifier: 'md',
						1:  { classes: 'col-md-1' },
						2:  { classes: 'col-md-2' },
						3:  { classes: 'col-md-3' },
						4:  { classes: 'col-md-4' },
						5:  { classes: 'col-md-5' },
						6:  { classes: 'col-md-6' },
						7:  { classes: 'col-md-7' },
						8:  { classes: 'col-md-8' },
						9:  { classes: 'col-md-9' },
						10: { classes: 'col-md-10' },
						11: { classes: 'col-md-11' },
						12: { classes: 'col-md-12' },
					},
					mobile: {
						identifier: '',
						1:  { classes: 'col-1' },
						2:  { classes: 'col-2' },
						3:  { classes: 'col-3' },
						4:  { classes: 'col-4' },
						5:  { classes: 'col-5' },
						6:  { classes: 'col-6' },
						7:  { classes: 'col-7' },
						8:  { classes: 'col-8' },
						9:  { classes: 'col-9' },
						10: { classes: 'col-10' },
						11: { classes: 'col-11' },
						12: { classes: 'col-12' },
					},
				},
				menuBtns: {
					"web-design-cmps": {
						subMenu: {
							"nav": {
								index: 1,
								icon: "&#xE232;",
								popupText: 'Add Navigation',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('bs4NavWidget', {}, this.element);
								}
							},
							"jumbotron": {
								index: 2,
								icon: "&#xE232;",
								popupText: 'Add Jumbotron',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('bs4JumbotronWidget', {}, this.element);
								}
							},
							"card": {
								index: 3,
								icon: "&#xE232;",
								popupText: 'Add Card',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('bs4CardWidget', {}, this.element);
								}
							},
							"carousel": {
								index: 4,
								icon: "&#xE232;",
								popupText: 'Add Carousel',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('bs4CarouselWidget', {}, this.element);
								}
							},
							"accordion": {
								index: 5,
								icon: "&#xE232;",
								popupText: 'Add Accordion',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('bs4CollapseWidget', {}, this.element);
								}
							},
							"toast": {
								index: 6,
								icon: "&#xE232;",
								popupText: 'Add Toast',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									return $.vdg.widgetFactory('bs4ToastWidget', {}, this.element);
								}
							},
						}
					}
				}
			},
			btnWidget: {
				// classess: 'btn btn-primary',
			},

			containerWidget: {
				menuBtns: {
					"web-design-cmps": {
						index: 3,
						icon: "&#xE90D;",
						popupText: 'Add Bootstrap Component',
						subMenu: {
							"nav": {
								index: 1,
								icon: "&#xE232;",
								popupText: 'Add Navigation',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var row = $.vdg.widgetFactory('rowWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, row);
									return $.vdg.widgetFactory('bs4NavWidget', {}, col);
								}
							},
							"jumbotron": {
								index: 2,
								icon: "&#xE232;",
								popupText: 'Add Jumbotron',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, $('[vd-type="row"]', section).first());
									return $.vdg.widgetFactory('bs4JumbotronWidget', {}, col);
								}
							},
							"card": {
								index: 3,
								icon: "&#xE232;",
								popupText: 'Add Card',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var cols = $('[vd-type="row"]', section).first().vdPolymorphic('addColumns', [4,4,4]);
									$.each(cols, function(i,v) {
										$.vdg.widgetFactory('bs4CardWidget', {}, v);
									});
									return;
								}
							},
							"carousel": {
								index: 4,
								icon: "&#xE232;",
								popupText: 'Add Carousel',
								autoPreview: true,
								callback: function(btn, btnOptions) {
									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, $('[vd-type="row"]', section).first());
									return $.vdg.widgetFactory('bs4CarouselWidget', {}, col);
								}
							},
							"accordion": {
								index: 5,
								icon: "&#xE232;",
								popupText: 'Add Accordion',
								autoPreview: true,
								callback: function(btn, btnOptions) {

									var section = $.vdg.widgetFactory('sectionWidget', {}, this.element);
									var col = $.vdg.widgetFactory('columnWidget', {
										colWidth: {
				  						desktop: 12,
				  						tablet: 12,
				  						mobile: 12,
				  					}
				  				}, $('[vd-type="row"]', section).first());
									return $.vdg.widgetFactory('bs4CollapseWidget', {}, col);
								}
							}
						}
					}
				}
			}
		},

		_create: function () {
			// $.extend( true, this.options.containerWidget.menuBtns, this.options.columnWidget.menuBtns);
			// $.extend( true, this.options.navCntWidget.menuBtns, this.options.containerWidget.menuBtns);
			// $.extend( true, this.options.slideWidget.menuBtns, this.options.slideWidget.menuBtns);

			this._super(); 
		},

		vdOnInitialiseFramework: function(e, params) {
			this._super(e, params);
			
			if (this.options.loadIcons)
				$.vdg.manager('loadIcons');

			$.vdg.widgetFactory('modalWidget', {title: '', content: "<h3>Quick Start</h3><div class='vd-row-widget'><div class='col-lg-4 col-md-4 col-12 vd-column-widget'><img src='foo.svg' alt=''></div><div class='col-lg-4 col-md-4 col-12 vd-column-widget'><img src='foo.svg' alt=''></div><div class='col-lg-4 col-md-4 col-12 vd-column-widget'><img src='foo.svg' alt=''></div></div>"}, this.element);
		},

		vdOnResizeColumnWidget: function(e, params) {
			this._super(e, params);
			// var widget = params.widget;
			
			// widget.element.removeClass(function (index, css) {
			// 	return (css.match (/(col-.*?(1|2|3|4|5|6|7|8|9|0)+)/gi) || []).join(' ');
			// });
		},
		
		vdOnCreateBtnWidget: function(e, params) { 
			this._super(e, params);
			params.widget.target.addClass('btn btn-primary');
		},

		vdOnManagerExport: function(e, params) {
			this._super(e, params);
			var escaped = $('<div>').text(params.design.prop('outerHTML')).html();
    	var modal = $.vdg.widgetFactory('modalWidget', {title: 'Output', content: "<pre id='vd-bs4-output'><code class='html'>" + escaped + "</code></pre>"}, this.element);
    	hljs.highlightBlock($('#vd-bs4-output')[0]);
		}
	});

//})( jQuery, window, document );
})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

 (function ($) {

	$.widget( "vd.wpDemoFramework", $.vd.bootstrap4Framework, {

		options: {
			visualDesignerManager: {
				menuBtns: {
					"support": {
						hidden: true,
					},
					"exit": {
						hidden: true,
					},
				}
			},
			baseWidget: {
				menuBtns: {
					"dynamic": {
						hidden: true,
					},
					"lock": {
						hidden: true,
					},
					"style": {
						subMenu: {
							"background-image": {
								subMenu: {
									'src': {
										callback: function(btn) {
											var self = this;
											$('#vd-fi').on('vdMediaSelected', function(e,params) {
												var undoOps = [];
												undoOps.push( self.style('background-image', 'url(' + params.media + ')', true) );
												undoOps.push( self.style('background-repeat', 'no-repeat', true) );
												$(this).off('vdMediaSelected');
											})
											.trigger('click');
										}
									},
								}
							}
						}
					}
				}
			},
			columnWidget: {
				menuBtns: {
					"wp-cmps": {
						hidden: true,
					},
					"web-design-cmps": {
						subMenu: {
							"add-shortcode": {
								hidden: true,
							}
						}
					}
				}
			},
			imgWidget: {
				menuBtns: {
					'src': {
						callback: function(btn) {
							var self = this;
							$('#vd-fi').on('vdMediaSelected', function(e,params) {
								self.attribute('src', params.media);
								$(this).off('vdMediaSelected');
							})
							.trigger('click');
						}
					},
					"dynamic": {
						hidden: true
					},
				}
			},
			btnWidget: {

			},
			videoWidget: {
				menuBtns: {
					'src': {
						callback: function(btn) {
							var self = this;
							$('#vd-fi').on('vdMediaSelected', function(e,params) {
								self.attributeElement($('source', self.element), 'src', params.media);
								$(this).off('vdMediaSelected');
							})
							.trigger('click');
						}
					},
				}
			},
			audioWidget: {
				menuBtns: {
					'src': {
						callback: function(btn) {
							var self = this;
							$('#vd-fi').on('vdMediaSelected', function(e,params) {
								self.attributeElement($('source', self.element), 'src', params.media);
								$(this).off('vdMediaSelected');
							})
							.trigger('click');
						}
					},
				}
			},
		},

		vdOnInitialiseFramework: function(e, params) {
			// hljs.configure({useBR: true});
			
			var self = this;
			self._super(e, params);

			var fileInput = $('<input id="vd-fi" type="file" name="name" style="display: none;" />').on('change', function (input) {
				input = input.target;
			  if (!input.files || !input.files.length)
			  	return;

		    var reader = new FileReader();
		    reader.onload = function(e) {
		    	$(input).trigger('vdMediaSelected', {media: e.target.result});
		    };
		    reader.readAsDataURL(input.files[0]);
			});

			params.widget.element.append(fileInput);
		},

		vdOnManagerExport: function(e, params) {
			$.vdg.widgetFactory('modalWidget', {
				title: 'Source Code',
				content: '<pre><xmp id="vd-export-src" class="html">' + params.content + '</xmp></pre>'
			}, this.element);

			// hljs.highlightBlock($('#vd-export-src'));

			console.log('HTML', params.content);
			return false;
		},

	});
})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */


(function ($) {

	$.widget( "vd.wpGlobalStyleFramework", $.vd.wordpressFramework, {

		options: {
			noMediumEditor: true,

			visualDesigner: {
				menuBtns: {
					"add-section": {
						hidden: true,
					},
					"add-row": {
						hidden: true,
					},
				},
			},

			runningDesigner: {
				menuBtns: {
					"add-section": {
						hidden: true,
					},
					"add-row": {
						hidden: true,
					},
				},
			},

			baseWidget: {
				menuBtns: {
					"add-section": {
						hidden: true,
					},
					"add-row": {
						hidden: true,
					},
					'box-shadow': {
						hidden: true,
					},
					'clone': {
						hidden: true,
					},
					'seo': {
						hidden: true,
					},
					'lock': {
						hidden: true,
					},
					'link': {
						hidden: true,
					},
					'trash': {
						hidden: true,
					},
					"create-component": {
						hidden: true,
					},
					"dynamic": {
						hidden: true,
					},

					"resize-column": {
						hidden: true,
					},
					"wp-cmps": {
						hidden: true,
					},
					"toggle-direction": {
						hidden: true,
					},
				},
			}, 

			rowWidget: {
				menuBtns: {
					"add-column": {
						hidden: true,
					},
				},
			},

			columnWidget: {
				menuBtns: {
					"web-design-cmps": {
						hidden: true,
					},
					"structural-cmps": {
						hidden: true,
					},
					"foundation-cmps": {
						hidden: true,
					},
				},
			},

			containerWidget: {
				menuBtns: {
					"link": {
						hidden: true,
					},
				},
			},

			textWidget: {
				menuBtns: {
					'list': {
						hidden: true,
					},
					'header': {
						hidden: true,
					},
					'icon': {
						hidden: true,
					},
				},
			},

			btnWidget: {
				menuBtns: {
					'list': {
						hidden: true,
					},
					'header': {
						hidden: true,
					},
					'icon': {
						hidden: true,
					},
				},
			},

			imgWidget: {
				menuBtns: {
					'src': {
						hidden: true,
					},
				},
			},

			videoWidget: {
				menuBtns: {
					'src': {
						hidden: true,
					},
				},
			},

			iconWidget: {
				menuBtns: {
					'icon-selector': {
						hidden: true,
					},
				},
			},
		},

		vdOnWPExportDesign: function(params) {
			// Todo: remove all style rules that begin with #glbst-
			params.custom.global_style = '<!-- VisualDesigner BEGIN --><style>' + params.style + '</style><!-- VisualDesigner END -->';
			return true;
		},

		vdOnCreateTextWidget: function(e, params) {
			setTimeout(function() {
				params.widget.element.attr('contenteditable', 'false');
			}, 100);
		},

	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

 (function ($) {

	$.widget( "vd.wpmenuFramework", $.vd.wordpressFramework, {

		options: {
			visualDesigner: {
				classes: 'vd-wpmenu-framework'
			}
		},

		_create: function () {
			this._super();
			// Get list of vd running posts
			this.getRunningPostNames();
		},

		getRunningPostNames: function() {
			var self = this;
			if (self.isProcessing)
				return true;

			self.isProcessing = true;
			var data = {
	      'action': 'vd_get_vd_posts',
	      'nonce': vdObj.shortcode_nonce,
      };

			jQuery.ajax({
				type : "post",
				dataType : "json",
				url : vdObj.ajax,
				data : data,
				success: function(response) {
					if(response.type == "success") {
						if (response.webElePosts && response.webElePosts.length)
							self.options.vdPosts = response.webElePosts;
						if (response.customPosts && response.customPosts.length)
							self.options.customPosts = response.customPosts;

						$('[designer-type="runningDesigner"]').first().vdPolymorphic('setVDPostsMeta', response);
					}
					else {
					   console.log('vdposts error', response.message );
					}
				},
				complete: function(response) {
					self.isProcessing = false;
				}
			});
		}
	});
})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */


(function ($) {

	$.widget( "vd.wpMhfFramework", $.vd.wpmenuFramework, {

		// Pro widgets: slider, map, html
		// Pro styling: custom css, Dimensions
		// Pro: dynamic
		// Pro: max 2 rows and 2 sections per designer
		// Pro: limit of 1 header template post and 1 footer template post

		options: {
			mhfStyleIdentifier: 'style[vd-designer-name="MHF Styling Private"],style[vd-tag-name="MHF Styling Private"]',

			visualDesignerManager: {
				menuBtns: {
					"select-template": {
            popupText: 'Select a different element<br/><small>After zooming out select either the header or footer to begin editing</small>',
          },
					"hide-eles": {
						index: 3,
						faIcon: "fas fa-eye-slash",
						popupText: 'Hide your theme\'s header &/or footer<br/><small>Use this to hide your theme\'s default header or footer</small>',
            callback: false,
            subMenu: {
            	"hide-content": {
								index: 1,
								faIcon: "fas fa-object-group",
								popupText: 'Click to hide theme header &/or footer<br><small>After zooming out click the elements you wish to hide</small>',
								callback: function(btn, btnOptions) {
		              return this.framework('onHideHeaderFooterMode', btn, btnOptions);
		            }
							},
       //      	"hide-default-eles": {
							// 	index: 2,
							// 	faIcon: "fas fa-border-style",
							// 	popupText: 'Hide all &lt;header&gt;, &lt;footer&gt;, &lt;nav&gt; elements <br><small>May not work with all themes - use Hide theme elements button in that case</small>',
							// 	callback: function(btn, btnOptions) {
		     //          return this.framework('onHideDefaultElements', btn, btnOptions);
		     //        }
							// },
							"reset-visibility": {
								index: 3,
								icon: "restore_page",
								popupText: 'Restore your default theme header and footer',
								callback: function(btn, btnOptions) {
									return this.framework('onResetHideThemeElements', btn, btnOptions);
								}
							},
            }
          },
				}
			},

			visualDesigner: {
				menuBtns: {
					
				},
			},

			runningDesigner: {
				menuBtns: {
					
				},
			},

			baseWidget: {
				menuBtns: {
					'box-shadow': {
						hidden: true,
					},
					// 'style': {
					// 	subMenu: {
					// 		"background-image": {
					// 			subMenu: {
					// 				'src': {
					// 					type: null,
					// 					disableDefault: false,
					// 					callback: null,
					// 					subMenu: {
					// 						'src': {
					// 							index: 1,
					// 							icon: '&#xE3B6;',
					// 							popupText: 'Image',
					// 							type: 'vd-colour-picker',
					// 							disableDefault: true,
					// 							callback: function(btn) {
					// 								var self = this;
					// 								$.vdImgSrcPicker.off('select');

					// 								$.vdImgSrcPicker.on('select', function() {
					// 									var imgSrc = $.vdImgSrcPicker.state().get('selection').first().toJSON();

					// 									var undoOps = [];
					// 									undoOps.push( self.style('background-image', 'url("' + imgSrc.url + '")', true) );
					// 									undoOps.push( self.style('background-repeat', 'no-repeat', true) );
														
					// 									$.undoWidget('registerUndo', undoOps);
													
					// 									$.vdImgSrcPicker.off('select');
					// 								});

					// 								$.vdImgSrcPicker.open();
					// 							}
					// 						},
					// 						'dyn-src': {
					// 							index: 2,
					// 							icon: "&#xE8C0;",
					// 							popupText: 'Use dynamic content',
					// 							input: {
					// 								type: 'dropdownInput',
					// 								icon: "&#xE8C0;",
					// 								popupText: 'Select dynamic content',
					// 								dropdownOptions: [
					// 									{value: '', display: '', data: {}},
					// 									{value: 'T_P_T', display: 'Post Thumbnail', data: {c:'T_P_T',attr:'bk-src'}},
					// 									{value: 'T_A_A', display: 'Author Avatar', data: {c:'T_A_A',attr:'bk-src'}},
					// 								],
					// 								callback: function(value, btn, data) {
					// 									this.getFramework().vdPolymorphic('setDynamicContent', data, this.element);
					// 								}
					// 							}
					// 						},
					// 					}
					// 				},
					// 			}
					// 		}
					// 	}
					// }
				},
			}, 

			sectionWidget: {
				menuBtns: {
					
				},
			},

			rowWidget: {
				menuBtns: {
					
				},
			},

			columnWidget: {
				menuBtns: {
					"web-design-cmps": {
						subMenu: {
							"slider": {
								hidden: true
							},
							"wizard": {
								hidden: true
							},
							"accordion": {
								hidden: true
							}
						}
					},
					"wp-cmps": {
						subMenu: {
							"add-content": {
								hidden: true,
							},
							"add-many": {
								hidden: true,
							},
							"add-menu": {
								hidden: true,
							},
							"add-sidebar": {
								hidden: true,
							},
							"add-search-results": {
								hidden: true,
							},
						}
					},
					"foundation-cmps": {
						subMenu: {
						}
					},
				},
			},

			containerWidget: {
				menuBtns: {
					"dynamic": {
						hidden: true,
					},
				},
			},

			navCntWidget: {
				menuBtns: {
					"web-design-cmps": {
						subMenu: {
							"nav": {
								hidden: true,
							},
							"map": {
								hidden: true,
							},
							"slider": {
								hidden: true,
							},
						}
					},
					"wp-cmps": {
						subMenu: {
						}
					},
					"foundation-cmps": {
						subMenu: {
							"add-hr": {
								hidden: true
							}
						}
					},
				},
			},

			textWidget: {
				menuBtns: {
					
				}
			},

			btnWidget: {
				menuBtns: {
					
				},
			},

			imgWidget: {
				menuBtns: {
					
				},
			},

			videoWidget: {
				menuBtns: {
					'src': {
						
					},
				},
			},

			iconWidget: {
				menuBtns: {
					'icon-selector': {
						
					},
				},
			},

			navWidget: {
				menuBtns: {
					"toggle-menu-fixed": {
						index: 1,
						hidden: true,
						isLayout: true,
						icon: "vertical_align_top",
						popupText: 'Toggle nav fixed or static',
						callback: function(btn, btnOptions) {

							return this.onToggleSticky(btn, btnOptions);
						}
					},
				}
			},
		},

		vdOnInitialiseFramework: function(e, params) {
			var self = this;
			self._super(e, params);

			if (!self.options.mhfStyleIdentifier || !self.options.mhfStyleIdentifier.length)
				throw 'wpMhfFramework must have a mhfStyleIdentifier option';

      self.mhfStyle = $(self.options.mhfStyleIdentifier).first();

      if (!self.mhfStyle || !self.mhfStyle.length) {
      	self.mhfStyle = $('<style>.vd-foo{}</style>')
	        .appendTo($('head'))
	        .attr('type', 'text/css')
	        .attr('vd-designer-name', 'MHF Styling Private')
	        .attr('id', 'mhf-priv'); // MUST HAVE this id!
      }

      self.mhfStyle.styleEditor({
				designerId: '#mhf-priv', 
				style: self.mhfStyle,
				mediaRules: {
					'desktop': {
						regex: new RegExp('^\\s*\\(max-width\\s*:\\s*8900000px\\s*\\)\\s*$', 'gmi'),
						text: '@media (max-width: 8900000px)',
					},
				}
			});

			this.analytics = $('<div></div>')
        .vdAnalytics()
        .addClass('vd-a')
        .appendTo($.vdg.manager().element);

			var runAutoHideMode = $.vdg.vdGetQryParam('mhf_auto_hide'/*, window.parent.document.location.href*/);
			if (runAutoHideMode) {
				$(window).off('beforeunload.vd');
				setTimeout(function() {
					self.onAutoHideHeaderFooterMode();
				}, $.VD_DEFER);
			}
			// Add hotjar
			// (function(h,o,t,j,a,r){
   //      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments);};
   //      h._hjSettings={hjid:2166765,hjsv:6};
   //      a=o.getElementsByTagName('head')[0];
   //      r=o.createElement('script');r.async=1;
   //      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
   //      a.appendChild(r);
   //  	})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
		},

    vdOnSelectTemplate: function(e, params) {
    	this._super();
      var self = this;

    	if ($(params.btn).attr('vd-name') != 'hide-content') {
    		$.vdg.manager('setInstructions', 'Click your header or footer to begin editing.', 'Click anywhere outside the page to exit \'selection mode\'');
				return true;
    	}
    },

    onHideHeaderFooterMode: function(btn, btnOptions) {
    	// Toggle button on click again
	    if ($('html').hasClass('vd-hide-tmpl')) { // BODY?? not HTML
        $('html').trigger('click.vdSelect');
        return;
	    }

	    var self = this;
	    var iframe = $.vdg.manager('iframe');
	    var overlay = $('<div class="vd-highlight-overlay"></div>').appendTo($('body'));
	    var popup = $('<div class="vd-popover-widget vd-absolute"><div class="vd-popover"><h3 class="vd-popover-title" style="display: block;">Click to hide this element</h3><div class="vd-popover-content">When hidden this element will not display site-wide on your website.</small></div></div></div>').appendTo('body');

	    var onExitSelectMode = function(ev) {
	    	$('html').removeClass('vd-tmpl-highlight vd-hide-tmpl');
        $('.vd-reset-pos').removeClass('vd-reset-pos');
        $('html').off('click.vdSelect');
        $.vdg.manager('setInstructions', '', '');
        $('html').off('click.vdSelect');
        $('body').off('mouseover.vdHover');
        $('body').off('click.vdHide');
        $('a:not([vd-preserve="true"]),a:not([vd-preserve="true"]) *,[type="submit"]:not([vd-preserve="true"])', $('body')).off($.vdg.manager('btnBindEvt')+'.cancelAnchors');
        overlay.remove();
        popup.remove();

        $('[vd-menu="hide-eles"]').vdPolymorphic('hide', {});
        $('[vd-menu="vd-visualDesignerManager-menu"]').vdPolymorphic('show', {});

        if (iframe.length) {
          iframe.removeClass('iframe-scale');
          $('body', window.parent.document).off('click.vdSelect');
          iframe[0].style.height = '100%';
        }
	    };

	    if (iframe.length) {
	    	console.log('12/10');
        iframe.addClass('iframe-scale');
        $('body', window.parent.document).on('click.vdSelect', onExitSelectMode);
        iframe[0].style.height = iframe[0].contentWindow.document.documentElement.scrollHeight + 'px';
        $(iframe[0].contentWindow).on('resize', function(ev) {
			    console.log('doc height is ' + $(document).height(), ev);
			  });
	    }

			// Add class to inner html OR body so we know what mode we are in 
	    $('html').addClass('vd-tmpl-highlight vd-hide-tmpl');
	    $('html').on('click.vdSelect', function(ev) {
      	if (!$(ev.target).is('html')) 
      		return ev.stopPropagation();
      	onExitSelectMode(ev);
      });
	    $.vdg.manager('setInstructions', 'Hide your default theme header or footer by selecting it.', 'Click anywhere outside the page to begin building your new header or footer.');
			
	    $('body')
	    // On hover: hightlight element to be hidden if meets criteria
        .on('mouseover.vdHover', function(ev) {
        var ele = $(document.elementFromPoint(ev.clientX, ev.clientY));
        var sig = self.getElementSignifiers(ele);
        if (!sig || !sig.length)
            return true;

        popup.css({
        	display: 'block',
        	left: (ev.clientX + popup.outerWidth() > $(document).width()) ? $(document).width() - popup.outerWidth() : ev.clientX,
          top: (ev.clientY + 10 + popup.outerHeight() > $(document).height()) ? $(document).height() - popup.outerHeight() : ev.clientY + 10, 
        });

        // if ($(sig).hasClass('vd-ele-highlighted'))
        //     return true;

        $('.vd-ele-highlighted').removeClass('vd-ele-highlighted');
        $(sig).addClass('vd-ele-highlighted');

        var height;
        if ($(sig).outerHeight() != 0)
        	height = $(sig).outerHeight();
        else if ($(sig).height() != 0)
        	height = $(sig).height();
        else if ($(sig).innerHeight() != 0)
        	height = $(sig).innerHeight();
        else if ($(sig).css('height') == true)
        	height = $(sig).css('height');

        overlay.css({
          left: $(sig).offset().left,
          top: $(sig).offset().top,
          right: $(sig).offset().left + $(sig).outerWidth(),
          bottom: $(sig).offset().top + height,
          width: $(sig).outerWidth(),
          height: height
        });
      })
      // On click: hide element if meets criteria
  		.on('click.vdHide', function(ev) {
  			overlay.css({width: 0, height: 0});
      	popup.css({ display: 'none',});

      	var ele 				= $(document.elementFromPoint(ev.clientX, ev.clientY));
      	var highlighted = ele.closest('.vd-ele-highlighted');
        var sig 				= self.getElementSignifiers(highlighted);
        if (!sig || !sig.length)
        	return true;

      	var mainSheet = self.mhfStyle.styleEditor('getMainSheet');
      	if (!self.mhfStyle.styleEditor('getElementStyle', mainSheet, sig).length)
      		self.mhfStyle.styleEditor('registerElementStyle', mainSheet, sig);

      	self.mhfStyle.styleEditor('updateElementStyle', mainSheet, sig, {display: 'none'});
      	$('.vd-ele-highlighted').removeClass('vd-ele-highlighted');
      	iframe[0].style.height = iframe[0].contentWindow.document.documentElement.scrollHeight + 'px';
      });

			$('a:not([vd-preserve="true"]),a:not([vd-preserve="true"]) *,[type="submit"]:not([vd-preserve="true"])', $('body')).on($.vdg.manager('btnBindEvt')+'.cancelAnchors', function(e){
				e.preventDefault();
				//e.stopPropagation();
			});
    },

    onAutoHideHeaderFooterMode: function(btn, btnOptions) {
    	// Toggle button on click again
	    if ($('html').hasClass('vd-hide-tmpl')) { // BODY?? not HTML
        $('html').trigger('click.vdSelect');
        return;
	    }

	    var self = this;
	    var iframe = $.vdg.manager('iframe');
	    var overlay = $('<div class="vd-highlight-overlay"></div>').appendTo($('body'));
	    // var popup = $('<div class="vd-popover-widget vd-absolute"><div class="vd-popover"><h3 class="vd-popover-title" style="display: block;">Click to hide this element</h3><div class="vd-popover-content">When hidden this element will not display site-wide on your website.</small></div></div></div>').appendTo('body');

	    self.toHide = [];
	    self.hideMode = ''; //'hide_both';
	    self.onResetHideThemeElements(); // reset mhf priv style

	    setTimeout(function() {
	    	// self.findHeaderFooterCandidates();
	    	self.generateMHFCSS();
	    }, 1);


	    // Handle messages from outer frames
	    var handleIframeMsg = function(evt) {
				if (evt.data && evt.data.action == 'mhf_hide_decision') {
					if (self.hideMode == evt.data.value)
						return;

					self.hideMode = evt.data.value;
		    	self.toHide = [];
		    	$('.vd-tmp-highlight').removeClass('vd-tmp-highlight');
		    	$('.vd-auto-overlay').remove();
		    	self.findHeaderFooterCandidates();
		    	self.generateMHFCSS();
				}
			};
			// For standards-compliant web browsers
			if (window.addEventListener)
				window.addEventListener("message", handleIframeMsg, false);
			else window.attachEvent("onmessage", handleIframeMsg);


			// Add class to inner html OR body so we know what mode we are in 
	    $('html').addClass('vd-tmpl-highlight vd-hide-tmpl vd-auto-hide');
	   
	   	$('body')
	    // On hover: hightlight element to be hidden if meets criteria
        .on('mouseover.vdHover', function(ev) {
        var ele = $(document.elementFromPoint(ev.clientX, ev.clientY));
        var sig = self.getElementSignifiers(ele);
        if (!sig || !sig.length)
            return true;

        // popup.css({
        // 	display: 'block',
        // 	left: (ev.clientX + popup.outerWidth() > $(document).width()) ? $(document).width() - popup.outerWidth() : ev.clientX,
        //   top: (ev.clientY /*+ 10*/ + popup.outerHeight() > $(document).height()) ? $(document).height() - popup.outerHeight() : ev.clientY /*+ 10*/, 
        // });

        $('.vd-ele-highlighted').removeClass('vd-ele-highlighted');
        $(sig).addClass('vd-ele-highlighted');

        var height;
        if ($(sig).outerHeight() != 0)
        	height = $(sig).outerHeight();
        else if ($(sig).height() != 0)
        	height = $(sig).height();
        else if ($(sig).innerHeight() != 0)
        	height = $(sig).innerHeight();
        else if ($(sig).css('height') == true)
        	height = $(sig).css('height');

        overlay.css({
          left: $(sig).offset().left,
          top: $(sig).offset().top,
          right: $(sig).offset().left + $(sig).outerWidth(),
          bottom: $(sig).offset().top + height,
          width: $(sig).outerWidth(),
          height: height
        });
        
        // Don't show overlay when mouse leaves sig element
        $(sig).on('mouseleave.vdLeave', function(ev) {
        	$('.vd-ele-highlighted').removeClass('vd-ele-highlighted');
      		overlay.css({width: 0, height: 0});
      	});
      })
      // On click: hide element if meets criteria
  		.on('click.vdHide', function(ev) {
  			overlay.css({width: 0, height: 0});
      	// popup.css({ display: 'none',});

      	var ele 				= $(document.elementFromPoint(ev.clientX, ev.clientY));
      	var highlighted = ele.closest('.vd-ele-highlighted');
        var sig 				= self.getElementSignifiers(highlighted);
        if (!sig || !sig.length)
        	return true;

        var keep = $(sig).hasClass('vd-tmp-highlight');
        $(sig).toggleClass('vd-tmp-highlight');
        self.toHide[sig] = !keep;
        self.generateMHFCSS();
        self.toggleOverlay(sig);
      });

			$('a:not([vd-preserve="true"]),a:not([vd-preserve="true"]) *,[type="submit"]:not([vd-preserve="true"])', $('body')).on($.vdg.manager('btnBindEvt')+'.cancelAnchors', function(e){
				e.preventDefault();
			});
    },

    toggleOverlay: function(sig, forceAdd) {
    	var overlay = $('.vd-highlight-overlay[vd-sig="' + sig + '"]');

    	if (overlay && overlay.length) {
    		if (!forceAdd)
    			overlay.remove();
    		return;
    	}

    	overlay = $('<div class="vd-highlight-overlay vd-auto-overlay"></div>').appendTo($('body')).attr('vd-sig', sig);
    	var height;
      if ($(sig).outerHeight() != 0)
      	height = $(sig).outerHeight();
      else if ($(sig).height() != 0)
      	height = $(sig).height();
      else if ($(sig).innerHeight() != 0)
      	height = $(sig).innerHeight();
      else if ($(sig).css('height') == true)
      	height = $(sig).css('height');

      overlay.css({
        left: $(sig).offset().left,
        top: $(sig).offset().top,
        right: $(sig).offset().left + $(sig).outerWidth(),
        bottom: $(sig).offset().top + height,
        width: $(sig).outerWidth(),
        height: height
      });
    },

    findHeaderFooterCandidates: function() {
	    var self = this;
	    var clientH = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
	    var pageW = $(document).width();
	    // var pageH = $(document).height();
	    var pageH = $('body').height();
	    var candidates = {headers: [], footers: []};
	    var y, ele, sig;
			
			if (self.hideMode == 'hide_both' || self.hideMode == 'hide_header') {
				// elementFromPoint uses client window coords not page coords! So
				// need to scroll the client window to top
				window.scrollTo(0,0);
				for (y=1; y<650; y+=15) {
			  	ele = $(document.elementFromPoint(10, y));
		      sig = self.getElementSignifiers(ele);
		      if (sig && sig.length) {
		      	$(sig).addClass('vd-tmp-highlight');
		      	candidates.headers.push(sig);
		      	self.toHide[sig] = true;
		      	self.toggleOverlay(sig, true);
		      }

		      // Sometimes there popups/overlays obscuring parts of screen
			    ele = $(document.elementFromPoint(pageW-20, y));
		      sig = self.getElementSignifiers(ele);
		      if (sig && sig.length) {
		      	$(sig).addClass('vd-tmp-highlight');
		      	candidates.headers.push(sig);
		      	self.toHide[sig] = true;
		      	self.toggleOverlay(sig, true);
		      }
		      ele = $(document.elementFromPoint(pageW/2, y));
		      sig = self.getElementSignifiers(ele);
		      if (sig && sig.length) {
		      	$(sig).addClass('vd-tmp-highlight');
		      	candidates.headers.push(sig);
		      	self.toHide[sig] = true;
		      	self.toggleOverlay(sig, true);
		      }
		    }
		  }
				
			if (self.hideMode == 'hide_both' || self.hideMode == 'hide_footer') {
				// elementFromPoint uses client window coords not page coords! So
				// need to scroll the client window to bottom
				window.scrollTo(0, (pageH-clientH) || 0);
				// window.scrollTo({
				//   left: 0,
				//   top: (pageH-clientH) || 0,
				//   behavior: 'auto'
				// });
				// $('body').scrollTop( (pageH-clientH) || 0 );
				// $('html, body').animate({scrollTop: (pageH-clientH) || 0}, 0);
				setTimeout(function() {
					for (y=pageH; y>clientH-650; y-=15) {
				  	ele = $(document.elementFromPoint(20, y));
			      sig = self.getElementSignifiers(ele);
			      if (sig && sig.length) {
			      	$(sig).addClass('vd-tmp-highlight');
			      	candidates.footers.push(sig);
			      	self.toHide[sig] = true;
			      	self.toggleOverlay(sig, true);
			      }

			      // Sometimes there popups/overlays obscuring parts of screen
			      ele = $(document.elementFromPoint(pageW-20, y));
			      sig = self.getElementSignifiers(ele);
			      if (sig && sig.length) {
			      	$(sig).addClass('vd-tmp-highlight');
			      	candidates.footers.push(sig);
			      	self.toHide[sig] = true;
			      	self.toggleOverlay(sig, true);
			      }
			      ele = $(document.elementFromPoint(pageW/2, y));
			      sig = self.getElementSignifiers(ele);
			      if (sig && sig.length) {
			      	$(sig).addClass('vd-tmp-highlight');
			      	candidates.footers.push(sig);
			      	self.toHide[sig] = true;
			      	self.toggleOverlay(sig, true);
			      }

			      // Must call this now!
			      self.generateMHFCSS();
			    }
				}, 500);
		  }

	    return candidates;
    },

    vdOnWPExportDesign: function(params) {
    	this._super(params);
    	var openTag = this.mhfStyle[0].outerHTML.split('>',1)[0];
			params.custom.mhf_style = '<!-- VisualDesigner BEGIN -->' + openTag + '>' + this.mhfStyle.styleEditor('asString') + '</style><!-- VisualDesigner END -->';
			return true;
		},

		generateMHFCSS: function() {
			var self = this;
			self.mhfStyle.styleEditor('clearAllSheets');

			var mainSheet = self.mhfStyle.styleEditor('getMainSheet');
	   	for (var sig in self.toHide) {
	   		var add = self.toHide[sig];
	   		if (!add)
	   			continue;

	    	if (!self.mhfStyle.styleEditor('getElementStyle', mainSheet, sig).length)
	    		self.mhfStyle.styleEditor('registerElementStyle', mainSheet, sig);
	    	self.mhfStyle.styleEditor('updateElementStyle', mainSheet, sig, {display: 'none'});
	    }

	    var openTag = self.mhfStyle[0].outerHTML.split('>',1)[0];
			var mhfStyle = '<!-- VisualDesigner BEGIN -->' + openTag + '>' + self.mhfStyle.styleEditor('asString') + '</style><!-- VisualDesigner END -->';
			var mhfCnt = $('#vd-mhf-pre');
			if (!mhfCnt.length)
				mhfCnt = $('<pre id="vd-mhf-pre" style="display: none;"></pre>').appendTo('body');

			mhfCnt.text(mhfStyle);

			// MUST reset/remove style
			self.mhfStyle.styleEditor('clearAllSheets');
		},

    onResetHideThemeElements: function(btn, btnOptions) {
    	this.mhfStyle.styleEditor('clearAllSheets');

      var iframe = $.vdg.manager('iframe');
      if (iframe.length && iframe.hasClass('iframe-scale')) {
        iframe[0].style.height = iframe[0].contentWindow.document.documentElement.scrollHeight + 'px';
	    }
    },

    onHideDefaultElements: function(btn, btnOptions) {
    	var self = this;
    	var targetNodes = ['header', 'nav', 'footer']; 
    	for (var i in targetNodes) {
				if ($(targetNodes[i]).length) {
					var sig = targetNodes[i];
					var mainSheet = self.mhfStyle.styleEditor('getMainSheet');
	      	if (!self.mhfStyle.styleEditor('getElementStyle', mainSheet, sig).length)
	      		self.mhfStyle.styleEditor('registerElementStyle', mainSheet, sig);

	      	self.mhfStyle.styleEditor('updateElementStyle', mainSheet, sig, {display: 'none'});
				}
			}
    },

		getElementSignifiers: function(ele, recurs) {
			if (!ele.length)
				return true;
			
			recurs 									= recurs || 1;
			var signifiers 					= [];
			var targetClasses 			= ['header', 'footer', 'nav', 'navbar', 'navigation'];
			var targetClassesRegex 	= [/header/gmi, /footer/gmi, /nav/gmi, /navbar/gmi, /navigation/gmi];
			var targetNodesRegex 		= [/header/gmi, /nav/gmi, /footer/gmi];
			var targetNodes 				= ['header', 'nav', 'footer']; 
			var isTargetNode 				= false;
			
			// eg header, nav, footer
			for (var i in targetNodes) {
				var targetNodeType = ele.closest(targetNodes[i]);
				if (targetNodeType.length) {
					ele = targetNodeType;
					isTargetNode = true;
				}
			}

			// Find a parent element whose id/class contains a target work (header, footer, etc.)
			if (!isTargetNode) {
				for (var cl in targetClasses) {
					var closestId 	= ele.closest('[id*="' + targetClasses[cl]  + '"]');
					var closestCls 	= ele.closest('[class*="' + targetClasses[cl]  + '"]');

					// TODO: if we have both closestId AND closestCls: find the one closest to body!!!!!!!
					// console.log('if we have both closestId AND closestCls: find the one closest to body');

					if (closestId.length) {
						ele = closestId;
						break;
					}
					else if (closestCls.length) {
						ele = closestCls;
						break;
					}
				}
			}

			// if (!isTargetNode &&  (ele.has('body,html,main,.main,[role="main"]').length || ele.is('body,html,main,aside,article,.main,[role="main"],p') || ele.closest('[data-type="visual-designer-manager"]').length || ele.closest('[data-type="visual-designer"]').length || ele.closest('main,aside,article,.main,[role="main"]').length))
	  	//		return true;
	  	if (!isTargetNode &&  (ele.has('body,html,main,.main,[role="main"]').length || ele.is('body,html,main,aside,article,.main,[role="main"],p'))) {
	    	return true;
	  	}
	  	if (!isTargetNode &&  (ele.closest('[data-type="visual-designer-manager"]').length)) {
	    	return true;
	  	}
	  	if (!isTargetNode &&  (ele.closest('[data-type="visual-designer"]').length)) {
	    	return true;
	  	}
	  	if (!isTargetNode &&  (ele.closest('main,aside,article,.main,[role="main"]').length)) {
	    	return true;
	  	}

			var height = ele.outerHeight();
      var width = ele.outerWidth();
      // console.log('Width comparison', width, $(document).width(), width / $(document).width());
      if (/*!isTargetNode &&*/ ((height / $(document).height()) > 0.5 || (width / $(document).width()) < 0.7)) {
      	// console.log('too tall or not wide enough', width, height);
      	return true;
      }

			var classes = (ele.attr('class') || '').split(' ');
			var nodeName = ele.prop("tagName").toLowerCase();

			// #masthead, #site-footer, #colo??
			// eg #xyz
			if (ele.attr('id') && ele.attr('id').length && $('#'+ele.attr('id')).length == 1)
				signifiers.push( '#'+ele.attr('id') );
			// eg div.site-header
			for (var j in classes) {
				for (var k in targetClassesRegex) {
					var id = ele.attr('id');
					if (classes[j].match(targetClassesRegex[k]) && $(nodeName+'.'+classes[j]).length > 0)
						signifiers.push( nodeName+'.'+classes[j] );
					else if (id && id.length && id.match(targetClassesRegex[k]))
						signifiers.push( nodeName+'.'+classes[j] );
				}
			}
			// eg nav, header, footer
			for (var l in targetNodesRegex) {
				if (nodeName.match(targetNodesRegex[l]) && $(nodeName).length > 0) {
					if (classes.length && classes[0].trim().length)
						signifiers.push(nodeName+'.'+classes[0]);
					else signifiers.push(nodeName);
				}
			}

			// if (!signifiers.length && recurs < 2) {
			// 	parentSig = this.getElementSignifiers(ele.parent(), recurs+1);
			// 	if (parentSig)
			// 		signifiers.push(parentSig);
			// }

			// console.log('signifiers', signifiers);
			return (signifiers.length) ? signifiers[0] : null; // return best selector
		}
	});

})(jQuery);
;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */


(function ($) {

	$.widget( "vd.wpMhfFFramework", $.vd.wpMhfFramework, {

		options: {
			visualDesignerManager: {
				menuBtns: {
					
				}
			},

			visualDesigner: {
				menuBtns: {
					// "add-section": {
					// 	callback: function(btn, btnOptions) {
					// 		if (this.framework('validateWidgetCreation', this))
					// 			return this.onAddSectionChange(btn, btnOptions);
					// 	}
					// },
					// "add-row": {
					// 	callback: function(btn, btnOptions) {
					// 		if (this.framework('validateWidgetCreation', this))
					// 			return this.onAddRowChange(btn, btnOptions);
					// 	}
					// },
				},
			},

			runningDesigner: {
				menuBtns: {
					"set-runner": {
						hidden: true,
					},
					"new-runner": {
						hidden: true,
					},
					"save-as-runner": {
						hidden: true,
					},
					"assign-runner": {
						hidden: true,
					},
				},
			},

			baseWidget: {
				menuBtns: {
					"style": {
						subMenu: {
							"set-dimensions": {
								classes: 'vd-pro',
								input: 0,
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
							"custom-style": {
								subMenu: {
									"set-style": {
										classes: 'vd-pro',
										input: 0,
										callback: function() {
											this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
										}
									},	
								}
							},
						}
					},
				},
			}, 

			structuralWidget: {
				menuBtns: {
					"lock": {
						classes: 'vd-pro',
						callback: function(btn, btnOptions) {
							this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
						}
					},
				},
			},

			sectionWidget: {
				menuBtns: {
					
				},
			},

			rowWidget: {
				menuBtns: {
					"add-column": {
						
					},
				},
			},

			columnWidget: {
				menuBtns: {
					"web-design-cmps": {
						subMenu: {
							"map": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
							"slider": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
						}
					},
					"wp-cmps": {
						subMenu: {
							"add-content": {
								hidden: true,
							},
							"add-many": {
								hidden: true,
							},
							"add-sidebar": {
								hidden: true,
							},
							"add-search-results": {
								hidden: true,
							},
							"add-search-form": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
						}
					},
					"foundation-cmps": {
						subMenu: {
							"add-video-widget": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
							"add-hr": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
							"add-audio-widget": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
							"add-html-widget": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
						}
					},
				},
			},

			textWidget: {
				menuBtns: {
					"dynamic": {
						index: 994,
						icon: "&#xE8C0;",
						popupText: 'Use dynamic content',
						classes: 'vd-pro',
						input: {
							callback: function(value, btn, data) {
								this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
							}
						}
					},
				}
			},

			btnWidget: {
				menuBtns: {
					
				},
			},

			imgWidget: {
				menuBtns: {
					"dynamic": {
						index: 994,
						icon: "&#xE8C0;",
						popupText: 'Use dynamic content',
						classes: 'vd-pro',
						input: {
							callback: function(value, btn, data) {
								this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
							}
						}
					},
				},
			},

			videoWidget: {
				menuBtns: {
					'src': {
						
					},
				},
			},

			iconWidget: {
				menuBtns: {
					'icon-selector': {
						input: {
							proIcons: {
								"fa-user-shield": true,"fa-user-slash": true,"fa-user-tag": true,"fa-user-tie": true,"fa-user-times": true,"fa-users": true,"fa-users-cog": true,"fa-ad": true,"fa-address-book": true,"fa-address-card": true,"fa-adjust": true,"fa-air-freshener": true,"fa-allergies": true,"fa-ambulance": true,"fa-american-sign-language-interpreting": true,"fa-anchor": true,"fa-angry": true,"fa-ankh": true,"fa-apple-alt": true,"fa-archive": true,"fa-archway": true,"fa-assistive-listening-systems": true,"fa-asterisk": true,"fa-at": true,"fa-atlas": true,"fa-atom": true,"fa-audio-description": true,"fa-award": true,"fa-baby": true,"fa-baby-carriage": true,"fa-backspace": true,"fa-backward": true,"fa-bacon": true,"fa-bahai": true,"fa-balance-scale": true,"fa-balance-scale-left": true,"fa-balance-scale-right": true,"fa-ban": true,"fa-band-aid": true,"fa-barcode": true,"fa-baseball-ball": true,"fa-basketball-ball": true,"fa-bath": true,"fa-battery-empty": true,"fa-battery-full": true,"fa-battery-half": true,"fa-battery-quarter": true,"fa-battery-three-quarters": true,"fa-bed": true,"fa-beer": true,"fa-bell": true,"fa-bell-slash": true,"fa-bezier-curve": true,"fa-bible": true,"fa-bicycle": true,"fa-biking": true,"fa-binoculars": true,"fa-biohazard": true,"fa-birthday-cake": true,"fa-blender": true,"fa-blender-phone": true,"fa-blind": true,"fa-blog": true,"fa-bold": true,"fa-bolt": true,"fa-bomb": true,"fa-bone": true,"fa-bong": true,"fa-book": true,"fa-book-dead": true,"fa-book-medical": true,"fa-book-open": true,"fa-book-reader": true,"fa-bookmark": true,"fa-border-all": true,"fa-border-none": true,"fa-border-style": true,"fa-bowling-ball": true,"fa-box": true,"fa-box-open": true,"fa-boxes": true,"fa-braille": true,"fa-brain": true,"fa-bread-slice": true,"fa-briefcase": true,"fa-briefcase-medical": true,"fa-broadcast-tower": true,"fa-broom": true,"fa-brush": true,"fa-bug": true,"fa-building": true,"fa-bullhorn": true,"fa-bullseye": true,"fa-burn": true,"fa-bus": true,"fa-bus-alt": true,"fa-business-time": true,"fa-calculator": true,"fa-calendar": true,"fa-calendar-alt": true,"fa-calendar-check": true,"fa-calendar-day": true,"fa-calendar-minus": true,"fa-calendar-plus": true,"fa-calendar-times": true,"fa-calendar-week": true,"fa-camera": true,"fa-camera-retro": true,"fa-campground": true,"fa-candy-cane": true,"fa-cannabis": true,"fa-capsules": true,"fa-car": true,"fa-car-alt": true,"fa-car-battery": true,"fa-car-crash": true,"fa-car-side": true,"fa-caravan": true,"fa-carrot": true,"fa-cart-plus": true,"fa-cash-register": true,"fa-cat": true,"fa-certificate": true,"fa-chair": true,"fa-chalkboard": true,"fa-chalkboard-teacher": true,"fa-charging-station": true,"fa-chart-area": true,"fa-chart-bar": true,"fa-chart-line": true,"fa-chart-pie": true,"fa-check": true,"fa-check-circle": true,"fa-check-double": true,"fa-check-square": true,"fa-cheese": true,"fa-chess": true,"fa-chess-bishop": true,"fa-chess-board": true,"fa-chess-king": true,"fa-chess-knight": true,"fa-chess-pawn": true, "fa-hamburger": true,"fa-chess-queen": true,"fa-chess-rook": true,"fa-sign": true,"fa-child": true,"fa-church": true,"fa-circle-notch": true,"fa-city": true,"fa-clinic-medical": true,"fa-clipboard": true,"fa-clipboard-check": true,"fa-clipboard-list": true,"fa-clock": true,"fa-clone": true,"fa-closed-captioning": true,"fa-cloud": true,"fa-cloud-download-alt": true,"fa-cloud-meatball": true,"fa-cloud-moon": true,"fa-cloud-moon-rain": true,"fa-cloud-rain": true,"fa-cloud-showers-heavy": true,"fa-cloud-sun": true,"fa-cloud-sun-rain": true,"fa-cloud-upload-alt": true,"fa-cocktail": true,"fa-code": true,"fa-code-branch": true,"fa-coffee": true,"fa-cog": true,"fa-cogs": true,"fa-coins": true,"fa-columns": true,"fa-comment": true,"fa-comment-alt": true,"fa-comment-dollar": true,"fa-comment-dots": true,"fa-comment-medical": true,"fa-comment-slash": true,"fa-comments": true,"fa-comments-dollar": true,"fa-compact-disc": true,"fa-compass": true,"fa-compress": true,"fa-compress-alt": true,"fa-compress-arrows-alt": true,"fa-concierge-bell": true,"fa-cookie": true,"fa-cookie-bite": true,"fa-couch": true,"fa-credit-card": true,"fa-crop": true,"fa-crop-alt": true,"fa-cross": true,"fa-crosshairs": true,"fa-crow": true,"fa-crown": true,"fa-crutch": true,"fa-cube": true,"fa-cubes": true,"fa-cut": true,"fa-dailymotion": true,"fa-database": true,"fa-deaf": true,"fa-democrat": true,"fa-desktop": true,"fa-dharmachakra": true,"fa-diagnoses": true,"fa-dice": true,"fa-dice-d20": true,"fa-dice-d6": true,"fa-dice-five": true,"fa-dice-four": true,"fa-dice-one": true,"fa-dice-six": true,"fa-dice-three": true,"fa-dice-two": true,"fa-digital-tachograph": true,"fa-directions": true,"fa-divide": true,"fa-dizzy": true,"fa-dna": true,"fa-dog": true,"fa-dollar-sign": true,"fa-dolly": true,"fa-dolly-flatbed": true,"fa-donate": true,"fa-door-closed": true,"fa-door-open": true,"fa-dot-circle": true,"fa-dove": true,"fa-download": true,"fa-drafting-compass": true,"fa-dragon": true,"fa-draw-polygon": true,"fa-drum": true,"fa-drum-steelpan": true,"fa-drumstick-bite": true,"fa-dumbbell": true,"fa-dumpster": true,"fa-dumpster-fire": true,"fa-dungeon": true,"fa-edit": true,"fa-egg": true,"fa-eject": true,"fa-ellipsis-h": true,"fa-ellipsis-v": true,"fa-envelope": true,"fa-envelope-open": true,"fa-envelope-open-text": true,"fa-envelope-square": true,"fa-equals": true,"fa-eraser": true,"fa-ethernet": true,"fa-euro-sign": true,"fa-exchange-alt": true,"fa-exclamation": true,"fa-exclamation-circle": true,"fa-exclamation-triangle": true,"fa-expand": true,"fa-expand-alt": true,"fa-expand-arrows-alt": true,"fa-external-link-alt": true,"fa-external-link-square-alt": true,"fa-eye": true,"fa-eye-dropper": true,"fa-eye-slash": true,"fa-fan": true,"fa-fast-backward": true,"fa-fast-forward": true,"fa-fax": true,"fa-feather": true,"fa-feather-alt": true,"fa-female": true,"fa-fighter-jet": true,"fa-file": true,"fa-file-alt": true,"fa-file-archive": true,"fa-file-audio": true,"fa-file-code": true,"fa-file-contract": true,"fa-file-csv": true,"fa-file-download": true,"fa-file-excel": true,"fa-file-export": true,"fa-file-image": true,"fa-file-import": true,"fa-file-invoice": true,"fa-file-invoice-dollar": true,"fa-file-medical": true,"fa-file-medical-alt": true,"fa-file-pdf": true,"fa-file-powerpoint": true,"fa-file-prescription": true,"fa-file-signature": true,"fa-file-upload": true,"fa-file-video": true,"fa-file-word": true,"fa-fill": true,"fa-fill-drip": true,"fa-film": true,"fa-filter": true,"fa-fingerprint": true,"fa-fire": true,"fa-fire-alt": true,"fa-fire-extinguisher": true,"fa-firefox-browser": true,"fa-first-aid": true,"fa-fish": true,"fa-fist-raised": true,"fa-flag": true,"fa-flag-checkered": true,"fa-flag-usa": true,"fa-flask": true,"fa-flushed": true,"fa-folder": true,"fa-folder-minus": true,"fa-folder-open": true,"fa-folder-plus": true,"fa-font": true,"fa-football-ball": true,"fa-forward": true,"fa-frog": true,"fa-frown": true,"fa-frown-open": true,"fa-funnel-dollar": true,"fa-futbol": true,"fa-gamepad": true,"fa-gas-pump": true,"fa-gavel": true,"fa-gem": true,"fa-genderless": true,"fa-ghost": true,"fa-gift": true,"fa-gifts": true,"fa-glass-cheers": true,"fa-glass-martini": true,"fa-glass-martini-alt": true,"fa-glass-whiskey": true,"fa-glasses": true,"fa-globe": true,"fa-globe-africa": true,"fa-globe-americas": true,"fa-globe-asia": true,"fa-globe-europe": true,"fa-golf-ball": true,"fa-gopuram": true,"fa-graduation-cap": true,"fa-greater-than": true,"fa-greater-than-equal": true,"fa-grimace": true,"fa-grin": true,"fa-grin-alt": true,"fa-grin-beam": true,"fa-grin-beam-sweat": true,"fa-grin-hearts": true,"fa-grin-squint": true,"fa-grin-squint-tears": true,"fa-grin-stars": true,"fa-grin-tears": true,"fa-grin-tongue": true,"fa-grin-tongue-squint": true,"fa-grin-tongue-wink": true,"fa-grin-wink": true,"fa-grip-horizontal": true,"fa-grip-lines": true,"fa-grip-lines-vertical": true,"fa-grip-vertical": true,"fa-guitar": true,"fa-h-square": true,"fa-hammer": true,"fa-hamsa": true,"fa-hand-holding": true,"fa-hand-holding-heart": true,"fa-hand-holding-usd": true,"fa-hand-lizard": true,"fa-hand-middle-finger": true,"fa-hand-paper": true,"fa-hand-peace": true,"fa-hand-point-down": true,"fa-hand-point-left": true,"fa-hand-point-right": true,"fa-hand-point-up": true,"fa-hand-pointer": true,"fa-hand-rock": true,"fa-hand-scissors": true,"fa-hand-spock": true,"fa-hands": true,"fa-hands-helping": true,"fa-handshake": true,"fa-hanukiah": true,"fa-hard-hat": true,"fa-hashtag": true,"fa-hat-cowboy": true,"fa-hat-cowboy-side": true,"fa-hat-wizard": true,"fa-hdd": true,"fa-heading": true,"fa-headphones": true,"fa-headphones-alt": true,"fa-headset": true,"fa-heart": true,"fa-heart-broken": true,"fa-heartbeat": true,"fa-helicopter": true,"fa-highlighter": true,"fa-hiking": true,"fa-hippo": true,"fa-history": true,"fa-hockey-puck": true,"fa-holly-berry": true,"fa-home": true,"fa-horse": true,"fa-horse-head": true,"fa-hospital": true,"fa-hospital-alt": true,"fa-hospital-symbol": true,"fa-hot-tub": true,"fa-hotdog": true,"fa-hotel": true,"fa-hourglass": true,"fa-hourglass-end": true,"fa-hourglass-half": true,"fa-hourglass-start": true,"fa-house-damage": true,"fa-hryvnia": true,"fa-i-cursor": true,"fa-ice-cream": true,"fa-icicles": true,"fa-icons": true,"fa-id-badge": true,"fa-id-card": true,"fa-id-card-alt": true,"fa-ideal": true,"fa-igloo": true,"fa-image": true,"fa-images": true,"fa-inbox": true,"fa-indent": true,"fa-industry": true,"fa-infinity": true,"fa-info": true,"fa-info-circle": true,"fa-instagram-square": true,"fa-italic": true,"fa-jedi": true,"fa-joint": true,"fa-kaaba": true,"fa-key": true,"fa-keyboard": true,"fa-khanda": true,"fa-kiss": true,"fa-kiss-beam": true,"fa-kiss-wink-heart": true,"fa-kiwi-bird": true,"fa-landmark": true,"fa-language": true,"fa-laptop": true,"fa-laptop-code": true,"fa-laptop-medical": true,"fa-laugh": true,"fa-laugh-beam": true,"fa-laugh-squint": true,"fa-laugh-wink": true,"fa-layer-group": true,"fa-leaf": true,"fa-lemon": true,"fa-less-than": true,"fa-less-than-equal": true,"fa-level-down-alt": true,"fa-level-up-alt": true,"fa-life-ring": true,"fa-lightbulb": true,"fa-link": true,"fa-lira-sign": true,"fa-list": true,"fa-list-alt": true,"fa-list-ol": true,"fa-list-ul": true,"fa-location-arrow": true,"fa-lock": true,"fa-lock-open": true,"fa-low-vision": true,"fa-luggage-cart": true,"fa-magic": true,"fa-magnet": true,"fa-mail-bulk": true,"fa-male": true,"fa-map": true,"fa-map-marked": true,"fa-map-marked-alt": true,"fa-map-marker": true,"fa-map-marker-alt": true,"fa-map-pin": true,"fa-map-signs": true,"fa-marker": true,"fa-mars": true,"fa-mars-double": true,"fa-mars-stroke": true,"fa-mars-stroke-h": true,"fa-mars-stroke-v": true,"fa-mask": true,"fa-medal": true,"fa-medkit": true,"fa-meh": true,"fa-meh-blank": true,"fa-meh-rolling-eyes": true,"fa-memory": true,"fa-menorah": true,"fa-mercury": true,"fa-meteor": true,"fa-microblog": true,"fa-microchip": true,"fa-microphone": true,"fa-microphone-alt": true,"fa-microphone-alt-slash": true,"fa-microphone-slash": true,"fa-microscope": true,"fa-minus": true,"fa-minus-circle": true,"fa-minus-square": true,"fa-mitten": true,"fa-mixer": true,"fa-mobile": true,"fa-mobile-alt": true,"fa-money-bill": true,"fa-money-bill-alt": true,"fa-money-bill-wave": true,"fa-money-bill-wave-alt": true,"fa-money-check": true,"fa-money-check-alt": true,"fa-monument": true,"fa-moon": true,"fa-mortar-pestle": true,"fa-mosque": true,"fa-motorcycle": true,"fa-mountain": true,"fa-mouse": true,"fa-mouse-pointer": true,"fa-mug-hot": true,"fa-music": true,"fa-network-wired": true,"fa-neuter": true,"fa-newspaper": true,"fa-not-equal": true,"fa-notes-medical": true,"fa-object-group": true,"fa-object-ungroup": true,"fa-oil-can": true,"fa-om": true,"fa-otter": true,"fa-outdent": true,"fa-pager": true,"fa-paint-brush": true,"fa-paint-roller": true,"fa-palette": true,"fa-pallet": true,"fa-paper-plane": true,"fa-paperclip": true,"fa-parachute-box": true,"fa-paragraph": true,"fa-parking": true,"fa-passport": true,"fa-pastafarianism": true,"fa-pause": true,"fa-pause-circle": true,"fa-paw": true,"fa-peace": true,"fa-pen": true,"fa-pen-alt": true,"fa-pen-fancy": true,"fa-pen-nib": true,"fa-pen-square": true,"fa-pencil-alt": true,"fa-pencil-ruler": true,"fa-people-carry": true,"fa-pepper-hot": true,"fa-percent": true,"fa-percentage": true,"fa-person-booth": true,"fa-phone": true,"fa-phone-alt": true,"fa-phone-slash": true,"fa-phone-square": true,"fa-phone-square-alt": true,"fa-phone-volume": true,"fa-photo-video": true,"fa-pied-piper-square": true,"fa-piggy-bank": true,"fa-pills": true,"fa-pizza-slice": true,"fa-place-of-worship": true,"fa-plane": true,"fa-plane-arrival": true,"fa-plane-departure": true,"fa-play": true,"fa-play-circle": true,"fa-plug": true,"fa-plus": true,"fa-plus-circle": true,"fa-plus-square": true,"fa-podcast": true,"fa-poll": true,"fa-poll-h": true,"fa-poo": true,"fa-poo-storm": true,"fa-poop": true,"fa-portrait": true,"fa-pound-sign": true,"fa-power-off": true,"fa-pray": true,"fa-praying-hands": true,"fa-prescription": true,"fa-prescription-bottle": true,"fa-prescription-bottle-alt": true,"fa-print": true,"fa-procedures": true,"fa-project-diagram": true,"fa-puzzle-piece": true,"fa-qrcode": true,"fa-question": true,"fa-question-circle": true,"fa-quidditch": true,"fa-quote-left": true,"fa-quote-right": true,"fa-quran": true,"fa-radiation": true,"fa-radiation-alt": true,"fa-rainbow": true,"fa-random": true,"fa-receipt": true,"fa-record-vinyl": true,"fa-recycle": true,"fa-redo": true,"fa-redo-alt": true,"fa-remove-format": true,"fa-reply": true,"fa-reply-all": true,"fa-republican": true,"fa-restroom": true,"fa-retweet": true,"fa-ribbon": true,"fa-ring": true,"fa-road": true,"fa-robot": true,"fa-rocket": true,"fa-route": true,"fa-rss": true,"fa-rss-square": true,"fa-ruble-sign": true,"fa-ruler": true,"fa-ruler-combined": true,"fa-ruler-horizontal": true,"fa-ruler-vertical": true,"fa-running": true,"fa-rupee-sign": true,"fa-sad-cry": true,"fa-sad-tear": true,"fa-satellite": true,"fa-satellite-dish": true,"fa-save": true,"fa-school": true,"fa-screwdriver": true,"fa-scroll": true,"fa-sd-card": true,"fa-seedling": true,"fa-server": true,"fa-shapes": true,"fa-share": true,"fa-share-alt": true,"fa-share-alt-square": true,"fa-share-square": true,"fa-shekel-sign": true,"fa-shield-alt": true,"fa-ship": true,"fa-shipping-fast": true,"fa-shoe-prints": true,"fa-shopify": true,"fa-shopping-bag": true,"fa-shopping-basket": true,"fa-shopping-cart": true,"fa-shower": true,"fa-shuttle-van": true,"fa-sign-language": true,"fa-signal": true,"fa-signature": true,"fa-sim-card": true,"fa-sitemap": true,"fa-skating": true,"fa-skiing": true,"fa-skiing-nordic": true,"fa-skull": true,"fa-skull-crossbones": true,"fa-slash": true,"fa-sleigh": true,"fa-sliders-h": true,"fa-smile": true,"fa-smile-beam": true,"fa-smile-wink": true,"fa-smog": true,"fa-smoking": true,"fa-smoking-ban": true,"fa-sms": true,"fa-snowboarding": true,"fa-snowflake": true,"fa-snowman": true,"fa-snowplow": true,"fa-socks": true,"fa-solar-panel": true,"fa-sort": true,"fa-sort-alpha-down": true,"fa-sort-alpha-down-alt": true,"fa-sort-alpha-up": true,"fa-sort-alpha-up-alt": true,"fa-sort-amount-down": true,"fa-sort-amount-down-alt": true,"fa-sort-amount-up": true,"fa-sort-amount-up-alt": true,"fa-sort-down": true,"fa-sort-numeric-down": true,"fa-sort-numeric-down-alt": true,"fa-sort-numeric-up": true,"fa-sort-numeric-up-alt": true,"fa-sort-up": true,"fa-spa": true,"fa-space-shuttle": true,"fa-spell-check": true,"fa-spider": true,"fa-spinner": true,"fa-splotch": true,"fa-spray-can": true,"fa-square": true,"fa-square-full": true,"fa-square-root-alt": true,"fa-stamp": true,"fa-star": true,"fa-star-and-crescent": true,"fa-star-half": true,"fa-star-half-alt": true,"fa-star-of-david": true,"fa-star-of-life": true,"fa-step-backward": true,"fa-step-forward": true,"fa-stethoscope": true,"fa-sticky-note": true,"fa-stop": true,"fa-stop-circle": true,"fa-stopwatch": true,"fa-store": true,"fa-store-alt": true,"fa-stream": true,"fa-street-view": true,"fa-strikethrough": true,"fa-stroopwafel": true,"fa-subscript": true,"fa-subway": true,"fa-suitcase": true,"fa-suitcase-rolling": true,"fa-sun": true,"fa-superscript": true,"fa-surprise": true,"fa-swatchbook": true,"fa-swimmer": true,"fa-swimming-pool": true,"fa-synagogue": true,"fa-sync": true,"fa-sync-alt": true,"fa-syringe": true,"fa-table": true,"fa-table-tennis": true,"fa-tablet": true,"fa-tablet-alt": true,"fa-tablets": true,"fa-tachometer-alt": true,"fa-tag": true,"fa-tags": true,"fa-tape": true,"fa-tasks": true,"fa-taxi": true,"fa-teeth": true,"fa-teeth-open": true,"fa-temperature-high": true,"fa-temperature-low": true,"fa-tenge": true,"fa-terminal": true,"fa-text-height": true,"fa-text-width": true,"fa-th": true,"fa-th-large": true,"fa-th-list": true,"fa-theater-masks": true,"fa-thermometer": true,"fa-thermometer-empty": true,"fa-thermometer-full": true,"fa-thermometer-half": true,"fa-thermometer-quarter": true,"fa-thermometer-three-quarters": true,"fa-thumbs-down": true,"fa-thumbs-up": true,"fa-thumbtack": true,"fa-ticket-alt": true,"fa-times": true,"fa-times-circle": true,"fa-tint": true,"fa-tint-slash": true,"fa-tired": true,"fa-toggle-off": true,"fa-toggle-on": true,"fa-toilet": true,"fa-toilet-paper": true,"fa-toolbox": true,"fa-tools": true,"fa-tooth": true,"fa-torah": true,"fa-torii-gate": true,"fa-tractor": true,"fa-trademark": true,"fa-traffic-light": true,"fa-trailer": true,"fa-train": true,"fa-tram": true,"fa-transgender": true,"fa-transgender-alt": true,"fa-trash": true,"fa-trash-alt": true,"fa-trash-restore": true,"fa-trash-restore-alt": true,"fa-tree": true,"fa-trophy": true,"fa-truck": true,"fa-truck-loading": true,"fa-truck-monster": true,"fa-truck-moving": true,"fa-truck-pickup": true,"fa-tshirt": true,"fa-tty": true,"fa-tv": true,"fa-umbrella": true,"fa-umbrella-beach": true,"fa-underline": true,"fa-undo": true,"fa-undo-alt": true,"fa-unity": true,"fa-universal-access": true,"fa-university": true,"fa-unlink": true,"fa-unlock": true,"fa-unlock-alt": true,"fa-upload": true,"fa-utensil-spoon": true,"fa-utensils": true,"fa-vector-square": true,"fa-venus": true,"fa-venus-double": true,"fa-venus-mars": true,"fa-vial": true,"fa-vials": true,"fa-video": true,"fa-video-slash": true,"fa-vihara": true,"fa-voicemail": true,"fa-volleyball-ball": true,"fa-volume-down": true,"fa-volume-mute": true,"fa-volume-off": true,"fa-volume-up": true,"fa-vote-yea": true,"fa-vr-cardboard": true,"fa-walking": true,"fa-wallet": true,"fa-warehouse": true,"fa-water": true,"fa-wave-square": true,"fa-weight": true,"fa-weight-hanging": true,"fa-wheelchair": true,"fa-wifi": true,"fa-wind": true,"fa-window-close": true,"fa-window-maximize": true,"fa-window-minimize": true,"fa-window-restore": true,"fa-wine-bottle": true,"fa-wine-glass": true,"fa-wine-glass-alt": true,"fa-won-sign": true,"fa-wrench": true,"fa-x-ray": true,"fa-yen-sign": true,"fa-yin-yang": true,
							}
						}
					},
				},
			},

			iconTxtWidget: {
				menuBtns: {
					"style": {
						classes: 'vd-pro',
						callback: function(btn, btnOptions) {
							this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
						}
					},
					"clone": {
						classes: 'vd-pro',
						callback: function(btn, btnOptions) {
							this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
						}
					},
					'icon-selector': {
						input: {
							proIcons: {
								"fa-user-shield": true,"fa-user-slash": true,"fa-user-tag": true,"fa-user-tie": true,"fa-user-times": true,"fa-users": true,"fa-users-cog": true,"fa-ad": true,"fa-address-book": true,"fa-address-card": true,"fa-adjust": true,"fa-air-freshener": true,"fa-allergies": true,"fa-ambulance": true,"fa-american-sign-language-interpreting": true,"fa-anchor": true,"fa-angry": true,"fa-ankh": true,"fa-apple-alt": true,"fa-archive": true,"fa-archway": true,"fa-assistive-listening-systems": true,"fa-asterisk": true,"fa-at": true,"fa-atlas": true,"fa-atom": true,"fa-audio-description": true,"fa-award": true,"fa-baby": true,"fa-baby-carriage": true,"fa-backspace": true,"fa-backward": true,"fa-bacon": true,"fa-bahai": true,"fa-balance-scale": true,"fa-balance-scale-left": true,"fa-balance-scale-right": true,"fa-ban": true,"fa-band-aid": true,"fa-barcode": true,"fa-baseball-ball": true,"fa-basketball-ball": true,"fa-bath": true,"fa-battery-empty": true,"fa-battery-full": true,"fa-battery-half": true,"fa-battery-quarter": true,"fa-battery-three-quarters": true,"fa-bed": true,"fa-beer": true,"fa-bell": true,"fa-bell-slash": true,"fa-bezier-curve": true,"fa-bible": true,"fa-bicycle": true,"fa-biking": true,"fa-binoculars": true,"fa-biohazard": true,"fa-birthday-cake": true,"fa-blender": true,"fa-blender-phone": true,"fa-blind": true,"fa-blog": true,"fa-bold": true,"fa-bolt": true,"fa-bomb": true,"fa-bone": true,"fa-bong": true,"fa-book": true,"fa-book-dead": true,"fa-book-medical": true,"fa-book-open": true,"fa-book-reader": true,"fa-bookmark": true,"fa-border-all": true,"fa-border-none": true,"fa-border-style": true,"fa-bowling-ball": true,"fa-box": true,"fa-box-open": true,"fa-boxes": true,"fa-braille": true,"fa-brain": true,"fa-bread-slice": true,"fa-briefcase": true,"fa-briefcase-medical": true,"fa-broadcast-tower": true,"fa-broom": true,"fa-brush": true,"fa-bug": true,"fa-building": true,"fa-bullhorn": true,"fa-bullseye": true,"fa-burn": true,"fa-bus": true,"fa-bus-alt": true,"fa-business-time": true,"fa-calculator": true,"fa-calendar": true,"fa-calendar-alt": true,"fa-calendar-check": true,"fa-calendar-day": true,"fa-calendar-minus": true,"fa-calendar-plus": true,"fa-calendar-times": true,"fa-calendar-week": true,"fa-camera": true,"fa-camera-retro": true,"fa-campground": true,"fa-candy-cane": true,"fa-cannabis": true,"fa-capsules": true,"fa-car": true,"fa-car-alt": true,"fa-car-battery": true,"fa-car-crash": true,"fa-car-side": true,"fa-caravan": true,"fa-carrot": true,"fa-cart-plus": true,"fa-cash-register": true,"fa-cat": true,"fa-certificate": true,"fa-chair": true,"fa-chalkboard": true,"fa-chalkboard-teacher": true,"fa-charging-station": true,"fa-chart-area": true,"fa-chart-bar": true,"fa-chart-line": true,"fa-chart-pie": true,"fa-check": true,"fa-check-circle": true,"fa-check-double": true,"fa-check-square": true,"fa-cheese": true,"fa-chess": true,"fa-chess-bishop": true,"fa-chess-board": true,"fa-chess-king": true,"fa-chess-knight": true,"fa-chess-pawn": true, "fa-hamburger": true,"fa-chess-queen": true,"fa-chess-rook": true,"fa-sign": true,"fa-child": true,"fa-church": true,"fa-circle-notch": true,"fa-city": true,"fa-clinic-medical": true,"fa-clipboard": true,"fa-clipboard-check": true,"fa-clipboard-list": true,"fa-clock": true,"fa-clone": true,"fa-closed-captioning": true,"fa-cloud": true,"fa-cloud-download-alt": true,"fa-cloud-meatball": true,"fa-cloud-moon": true,"fa-cloud-moon-rain": true,"fa-cloud-rain": true,"fa-cloud-showers-heavy": true,"fa-cloud-sun": true,"fa-cloud-sun-rain": true,"fa-cloud-upload-alt": true,"fa-cocktail": true,"fa-code": true,"fa-code-branch": true,"fa-coffee": true,"fa-cog": true,"fa-cogs": true,"fa-coins": true,"fa-columns": true,"fa-comment": true,"fa-comment-alt": true,"fa-comment-dollar": true,"fa-comment-dots": true,"fa-comment-medical": true,"fa-comment-slash": true,"fa-comments": true,"fa-comments-dollar": true,"fa-compact-disc": true,"fa-compass": true,"fa-compress": true,"fa-compress-alt": true,"fa-compress-arrows-alt": true,"fa-concierge-bell": true,"fa-cookie": true,"fa-cookie-bite": true,"fa-couch": true,"fa-credit-card": true,"fa-crop": true,"fa-crop-alt": true,"fa-cross": true,"fa-crosshairs": true,"fa-crow": true,"fa-crown": true,"fa-crutch": true,"fa-cube": true,"fa-cubes": true,"fa-cut": true,"fa-dailymotion": true,"fa-database": true,"fa-deaf": true,"fa-democrat": true,"fa-desktop": true,"fa-dharmachakra": true,"fa-diagnoses": true,"fa-dice": true,"fa-dice-d20": true,"fa-dice-d6": true,"fa-dice-five": true,"fa-dice-four": true,"fa-dice-one": true,"fa-dice-six": true,"fa-dice-three": true,"fa-dice-two": true,"fa-digital-tachograph": true,"fa-directions": true,"fa-divide": true,"fa-dizzy": true,"fa-dna": true,"fa-dog": true,"fa-dollar-sign": true,"fa-dolly": true,"fa-dolly-flatbed": true,"fa-donate": true,"fa-door-closed": true,"fa-door-open": true,"fa-dot-circle": true,"fa-dove": true,"fa-download": true,"fa-drafting-compass": true,"fa-dragon": true,"fa-draw-polygon": true,"fa-drum": true,"fa-drum-steelpan": true,"fa-drumstick-bite": true,"fa-dumbbell": true,"fa-dumpster": true,"fa-dumpster-fire": true,"fa-dungeon": true,"fa-edit": true,"fa-egg": true,"fa-eject": true,"fa-ellipsis-h": true,"fa-ellipsis-v": true,"fa-envelope": true,"fa-envelope-open": true,"fa-envelope-open-text": true,"fa-envelope-square": true,"fa-equals": true,"fa-eraser": true,"fa-ethernet": true,"fa-euro-sign": true,"fa-exchange-alt": true,"fa-exclamation": true,"fa-exclamation-circle": true,"fa-exclamation-triangle": true,"fa-expand": true,"fa-expand-alt": true,"fa-expand-arrows-alt": true,"fa-external-link-alt": true,"fa-external-link-square-alt": true,"fa-eye": true,"fa-eye-dropper": true,"fa-eye-slash": true,"fa-fan": true,"fa-fast-backward": true,"fa-fast-forward": true,"fa-fax": true,"fa-feather": true,"fa-feather-alt": true,"fa-female": true,"fa-fighter-jet": true,"fa-file": true,"fa-file-alt": true,"fa-file-archive": true,"fa-file-audio": true,"fa-file-code": true,"fa-file-contract": true,"fa-file-csv": true,"fa-file-download": true,"fa-file-excel": true,"fa-file-export": true,"fa-file-image": true,"fa-file-import": true,"fa-file-invoice": true,"fa-file-invoice-dollar": true,"fa-file-medical": true,"fa-file-medical-alt": true,"fa-file-pdf": true,"fa-file-powerpoint": true,"fa-file-prescription": true,"fa-file-signature": true,"fa-file-upload": true,"fa-file-video": true,"fa-file-word": true,"fa-fill": true,"fa-fill-drip": true,"fa-film": true,"fa-filter": true,"fa-fingerprint": true,"fa-fire": true,"fa-fire-alt": true,"fa-fire-extinguisher": true,"fa-firefox-browser": true,"fa-first-aid": true,"fa-fish": true,"fa-fist-raised": true,"fa-flag": true,"fa-flag-checkered": true,"fa-flag-usa": true,"fa-flask": true,"fa-flushed": true,"fa-folder": true,"fa-folder-minus": true,"fa-folder-open": true,"fa-folder-plus": true,"fa-font": true,"fa-football-ball": true,"fa-forward": true,"fa-frog": true,"fa-frown": true,"fa-frown-open": true,"fa-funnel-dollar": true,"fa-futbol": true,"fa-gamepad": true,"fa-gas-pump": true,"fa-gavel": true,"fa-gem": true,"fa-genderless": true,"fa-ghost": true,"fa-gift": true,"fa-gifts": true,"fa-glass-cheers": true,"fa-glass-martini": true,"fa-glass-martini-alt": true,"fa-glass-whiskey": true,"fa-glasses": true,"fa-globe": true,"fa-globe-africa": true,"fa-globe-americas": true,"fa-globe-asia": true,"fa-globe-europe": true,"fa-golf-ball": true,"fa-gopuram": true,"fa-graduation-cap": true,"fa-greater-than": true,"fa-greater-than-equal": true,"fa-grimace": true,"fa-grin": true,"fa-grin-alt": true,"fa-grin-beam": true,"fa-grin-beam-sweat": true,"fa-grin-hearts": true,"fa-grin-squint": true,"fa-grin-squint-tears": true,"fa-grin-stars": true,"fa-grin-tears": true,"fa-grin-tongue": true,"fa-grin-tongue-squint": true,"fa-grin-tongue-wink": true,"fa-grin-wink": true,"fa-grip-horizontal": true,"fa-grip-lines": true,"fa-grip-lines-vertical": true,"fa-grip-vertical": true,"fa-guitar": true,"fa-h-square": true,"fa-hammer": true,"fa-hamsa": true,"fa-hand-holding": true,"fa-hand-holding-heart": true,"fa-hand-holding-usd": true,"fa-hand-lizard": true,"fa-hand-middle-finger": true,"fa-hand-paper": true,"fa-hand-peace": true,"fa-hand-point-down": true,"fa-hand-point-left": true,"fa-hand-point-right": true,"fa-hand-point-up": true,"fa-hand-pointer": true,"fa-hand-rock": true,"fa-hand-scissors": true,"fa-hand-spock": true,"fa-hands": true,"fa-hands-helping": true,"fa-handshake": true,"fa-hanukiah": true,"fa-hard-hat": true,"fa-hashtag": true,"fa-hat-cowboy": true,"fa-hat-cowboy-side": true,"fa-hat-wizard": true,"fa-hdd": true,"fa-heading": true,"fa-headphones": true,"fa-headphones-alt": true,"fa-headset": true,"fa-heart": true,"fa-heart-broken": true,"fa-heartbeat": true,"fa-helicopter": true,"fa-highlighter": true,"fa-hiking": true,"fa-hippo": true,"fa-history": true,"fa-hockey-puck": true,"fa-holly-berry": true,"fa-home": true,"fa-horse": true,"fa-horse-head": true,"fa-hospital": true,"fa-hospital-alt": true,"fa-hospital-symbol": true,"fa-hot-tub": true,"fa-hotdog": true,"fa-hotel": true,"fa-hourglass": true,"fa-hourglass-end": true,"fa-hourglass-half": true,"fa-hourglass-start": true,"fa-house-damage": true,"fa-hryvnia": true,"fa-i-cursor": true,"fa-ice-cream": true,"fa-icicles": true,"fa-icons": true,"fa-id-badge": true,"fa-id-card": true,"fa-id-card-alt": true,"fa-ideal": true,"fa-igloo": true,"fa-image": true,"fa-images": true,"fa-inbox": true,"fa-indent": true,"fa-industry": true,"fa-infinity": true,"fa-info": true,"fa-info-circle": true,"fa-instagram-square": true,"fa-italic": true,"fa-jedi": true,"fa-joint": true,"fa-kaaba": true,"fa-key": true,"fa-keyboard": true,"fa-khanda": true,"fa-kiss": true,"fa-kiss-beam": true,"fa-kiss-wink-heart": true,"fa-kiwi-bird": true,"fa-landmark": true,"fa-language": true,"fa-laptop": true,"fa-laptop-code": true,"fa-laptop-medical": true,"fa-laugh": true,"fa-laugh-beam": true,"fa-laugh-squint": true,"fa-laugh-wink": true,"fa-layer-group": true,"fa-leaf": true,"fa-lemon": true,"fa-less-than": true,"fa-less-than-equal": true,"fa-level-down-alt": true,"fa-level-up-alt": true,"fa-life-ring": true,"fa-lightbulb": true,"fa-link": true,"fa-lira-sign": true,"fa-list": true,"fa-list-alt": true,"fa-list-ol": true,"fa-list-ul": true,"fa-location-arrow": true,"fa-lock": true,"fa-lock-open": true,"fa-low-vision": true,"fa-luggage-cart": true,"fa-magic": true,"fa-magnet": true,"fa-mail-bulk": true,"fa-male": true,"fa-map": true,"fa-map-marked": true,"fa-map-marked-alt": true,"fa-map-marker": true,"fa-map-marker-alt": true,"fa-map-pin": true,"fa-map-signs": true,"fa-marker": true,"fa-mars": true,"fa-mars-double": true,"fa-mars-stroke": true,"fa-mars-stroke-h": true,"fa-mars-stroke-v": true,"fa-mask": true,"fa-medal": true,"fa-medkit": true,"fa-meh": true,"fa-meh-blank": true,"fa-meh-rolling-eyes": true,"fa-memory": true,"fa-menorah": true,"fa-mercury": true,"fa-meteor": true,"fa-microblog": true,"fa-microchip": true,"fa-microphone": true,"fa-microphone-alt": true,"fa-microphone-alt-slash": true,"fa-microphone-slash": true,"fa-microscope": true,"fa-minus": true,"fa-minus-circle": true,"fa-minus-square": true,"fa-mitten": true,"fa-mixer": true,"fa-mobile": true,"fa-mobile-alt": true,"fa-money-bill": true,"fa-money-bill-alt": true,"fa-money-bill-wave": true,"fa-money-bill-wave-alt": true,"fa-money-check": true,"fa-money-check-alt": true,"fa-monument": true,"fa-moon": true,"fa-mortar-pestle": true,"fa-mosque": true,"fa-motorcycle": true,"fa-mountain": true,"fa-mouse": true,"fa-mouse-pointer": true,"fa-mug-hot": true,"fa-music": true,"fa-network-wired": true,"fa-neuter": true,"fa-newspaper": true,"fa-not-equal": true,"fa-notes-medical": true,"fa-object-group": true,"fa-object-ungroup": true,"fa-oil-can": true,"fa-om": true,"fa-otter": true,"fa-outdent": true,"fa-pager": true,"fa-paint-brush": true,"fa-paint-roller": true,"fa-palette": true,"fa-pallet": true,"fa-paper-plane": true,"fa-paperclip": true,"fa-parachute-box": true,"fa-paragraph": true,"fa-parking": true,"fa-passport": true,"fa-pastafarianism": true,"fa-pause": true,"fa-pause-circle": true,"fa-paw": true,"fa-peace": true,"fa-pen": true,"fa-pen-alt": true,"fa-pen-fancy": true,"fa-pen-nib": true,"fa-pen-square": true,"fa-pencil-alt": true,"fa-pencil-ruler": true,"fa-people-carry": true,"fa-pepper-hot": true,"fa-percent": true,"fa-percentage": true,"fa-person-booth": true,"fa-phone": true,"fa-phone-alt": true,"fa-phone-slash": true,"fa-phone-square": true,"fa-phone-square-alt": true,"fa-phone-volume": true,"fa-photo-video": true,"fa-pied-piper-square": true,"fa-piggy-bank": true,"fa-pills": true,"fa-pizza-slice": true,"fa-place-of-worship": true,"fa-plane": true,"fa-plane-arrival": true,"fa-plane-departure": true,"fa-play": true,"fa-play-circle": true,"fa-plug": true,"fa-plus": true,"fa-plus-circle": true,"fa-plus-square": true,"fa-podcast": true,"fa-poll": true,"fa-poll-h": true,"fa-poo": true,"fa-poo-storm": true,"fa-poop": true,"fa-portrait": true,"fa-pound-sign": true,"fa-power-off": true,"fa-pray": true,"fa-praying-hands": true,"fa-prescription": true,"fa-prescription-bottle": true,"fa-prescription-bottle-alt": true,"fa-print": true,"fa-procedures": true,"fa-project-diagram": true,"fa-puzzle-piece": true,"fa-qrcode": true,"fa-question": true,"fa-question-circle": true,"fa-quidditch": true,"fa-quote-left": true,"fa-quote-right": true,"fa-quran": true,"fa-radiation": true,"fa-radiation-alt": true,"fa-rainbow": true,"fa-random": true,"fa-receipt": true,"fa-record-vinyl": true,"fa-recycle": true,"fa-redo": true,"fa-redo-alt": true,"fa-remove-format": true,"fa-reply": true,"fa-reply-all": true,"fa-republican": true,"fa-restroom": true,"fa-retweet": true,"fa-ribbon": true,"fa-ring": true,"fa-road": true,"fa-robot": true,"fa-rocket": true,"fa-route": true,"fa-rss": true,"fa-rss-square": true,"fa-ruble-sign": true,"fa-ruler": true,"fa-ruler-combined": true,"fa-ruler-horizontal": true,"fa-ruler-vertical": true,"fa-running": true,"fa-rupee-sign": true,"fa-sad-cry": true,"fa-sad-tear": true,"fa-satellite": true,"fa-satellite-dish": true,"fa-save": true,"fa-school": true,"fa-screwdriver": true,"fa-scroll": true,"fa-sd-card": true,"fa-seedling": true,"fa-server": true,"fa-shapes": true,"fa-share": true,"fa-share-alt": true,"fa-share-alt-square": true,"fa-share-square": true,"fa-shekel-sign": true,"fa-shield-alt": true,"fa-ship": true,"fa-shipping-fast": true,"fa-shoe-prints": true,"fa-shopify": true,"fa-shopping-bag": true,"fa-shopping-basket": true,"fa-shopping-cart": true,"fa-shower": true,"fa-shuttle-van": true,"fa-sign-language": true,"fa-signal": true,"fa-signature": true,"fa-sim-card": true,"fa-sitemap": true,"fa-skating": true,"fa-skiing": true,"fa-skiing-nordic": true,"fa-skull": true,"fa-skull-crossbones": true,"fa-slash": true,"fa-sleigh": true,"fa-sliders-h": true,"fa-smile": true,"fa-smile-beam": true,"fa-smile-wink": true,"fa-smog": true,"fa-smoking": true,"fa-smoking-ban": true,"fa-sms": true,"fa-snowboarding": true,"fa-snowflake": true,"fa-snowman": true,"fa-snowplow": true,"fa-socks": true,"fa-solar-panel": true,"fa-sort": true,"fa-sort-alpha-down": true,"fa-sort-alpha-down-alt": true,"fa-sort-alpha-up": true,"fa-sort-alpha-up-alt": true,"fa-sort-amount-down": true,"fa-sort-amount-down-alt": true,"fa-sort-amount-up": true,"fa-sort-amount-up-alt": true,"fa-sort-down": true,"fa-sort-numeric-down": true,"fa-sort-numeric-down-alt": true,"fa-sort-numeric-up": true,"fa-sort-numeric-up-alt": true,"fa-sort-up": true,"fa-spa": true,"fa-space-shuttle": true,"fa-spell-check": true,"fa-spider": true,"fa-spinner": true,"fa-splotch": true,"fa-spray-can": true,"fa-square": true,"fa-square-full": true,"fa-square-root-alt": true,"fa-stamp": true,"fa-star": true,"fa-star-and-crescent": true,"fa-star-half": true,"fa-star-half-alt": true,"fa-star-of-david": true,"fa-star-of-life": true,"fa-step-backward": true,"fa-step-forward": true,"fa-stethoscope": true,"fa-sticky-note": true,"fa-stop": true,"fa-stop-circle": true,"fa-stopwatch": true,"fa-store": true,"fa-store-alt": true,"fa-stream": true,"fa-street-view": true,"fa-strikethrough": true,"fa-stroopwafel": true,"fa-subscript": true,"fa-subway": true,"fa-suitcase": true,"fa-suitcase-rolling": true,"fa-sun": true,"fa-superscript": true,"fa-surprise": true,"fa-swatchbook": true,"fa-swimmer": true,"fa-swimming-pool": true,"fa-synagogue": true,"fa-sync": true,"fa-sync-alt": true,"fa-syringe": true,"fa-table": true,"fa-table-tennis": true,"fa-tablet": true,"fa-tablet-alt": true,"fa-tablets": true,"fa-tachometer-alt": true,"fa-tag": true,"fa-tags": true,"fa-tape": true,"fa-tasks": true,"fa-taxi": true,"fa-teeth": true,"fa-teeth-open": true,"fa-temperature-high": true,"fa-temperature-low": true,"fa-tenge": true,"fa-terminal": true,"fa-text-height": true,"fa-text-width": true,"fa-th": true,"fa-th-large": true,"fa-th-list": true,"fa-theater-masks": true,"fa-thermometer": true,"fa-thermometer-empty": true,"fa-thermometer-full": true,"fa-thermometer-half": true,"fa-thermometer-quarter": true,"fa-thermometer-three-quarters": true,"fa-thumbs-down": true,"fa-thumbs-up": true,"fa-thumbtack": true,"fa-ticket-alt": true,"fa-times": true,"fa-times-circle": true,"fa-tint": true,"fa-tint-slash": true,"fa-tired": true,"fa-toggle-off": true,"fa-toggle-on": true,"fa-toilet": true,"fa-toilet-paper": true,"fa-toolbox": true,"fa-tools": true,"fa-tooth": true,"fa-torah": true,"fa-torii-gate": true,"fa-tractor": true,"fa-trademark": true,"fa-traffic-light": true,"fa-trailer": true,"fa-train": true,"fa-tram": true,"fa-transgender": true,"fa-transgender-alt": true,"fa-trash": true,"fa-trash-alt": true,"fa-trash-restore": true,"fa-trash-restore-alt": true,"fa-tree": true,"fa-trophy": true,"fa-truck": true,"fa-truck-loading": true,"fa-truck-monster": true,"fa-truck-moving": true,"fa-truck-pickup": true,"fa-tshirt": true,"fa-tty": true,"fa-tv": true,"fa-umbrella": true,"fa-umbrella-beach": true,"fa-underline": true,"fa-undo": true,"fa-undo-alt": true,"fa-unity": true,"fa-universal-access": true,"fa-university": true,"fa-unlink": true,"fa-unlock": true,"fa-unlock-alt": true,"fa-upload": true,"fa-utensil-spoon": true,"fa-utensils": true,"fa-vector-square": true,"fa-venus": true,"fa-venus-double": true,"fa-venus-mars": true,"fa-vial": true,"fa-vials": true,"fa-video": true,"fa-video-slash": true,"fa-vihara": true,"fa-voicemail": true,"fa-volleyball-ball": true,"fa-volume-down": true,"fa-volume-mute": true,"fa-volume-off": true,"fa-volume-up": true,"fa-vote-yea": true,"fa-vr-cardboard": true,"fa-walking": true,"fa-wallet": true,"fa-warehouse": true,"fa-water": true,"fa-wave-square": true,"fa-weight": true,"fa-weight-hanging": true,"fa-wheelchair": true,"fa-wifi": true,"fa-wind": true,"fa-window-close": true,"fa-window-maximize": true,"fa-window-minimize": true,"fa-window-restore": true,"fa-wine-bottle": true,"fa-wine-glass": true,"fa-wine-glass-alt": true,"fa-won-sign": true,"fa-wrench": true,"fa-x-ray": true,"fa-yen-sign": true,"fa-yin-yang": true,
							}
						}
					},
				}
			},

			dropdownCntWidget: {
				menuBtns: {
					"foundation-cmps": {
						subMenu: {
							"add-image-widget": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							}
						}
					},
					"structural-cmps": {
						subMenu: {
							"add-row": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
							"add-container": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Header Footer Pro to use this feature.', this);
								}
							},
						}
					},
					"wp-cmps": {
						hidden: true,
					}
				},
			},

			navCntWidget: {
				menuBtns: {
					"foundation-cmps": {
						subMenu: {	
							"add-dropdown": {
								callback: function(btn, btnOptions) {
									var designer = this.getDesigner();
									if ($('[vd-type="dropdown"]', designer).length >= 2)
										return this.framework('goProDialog', 'Limit of 2 Dropdown Widgets. With My Header Footer Pro you can create unlimited Dropdown Widgets.', designer);
									
									return this.onAddDropdown(btn, btnOptions);
								}
							},
							"add-megamenu": {
								callback: function(btn, btnOptions) {
									var designer = this.getDesigner();
									if ($('[vd-type="megamenu"]', designer).length >= 2)
										return this.framework('goProDialog', 'Limit of 2 Mega Menu Widgets. With My Header Footer Pro you can create unlimited Mega Menu Widgets.', designer);
									
									return this.onAddMegaMenu(btn, btnOptions);
								}
							},
						}
					},
				},
			},
		},

		MAX_SECTIONS: 2,

		MAX_ROWS: 2,

		MAX_NAVS: 1,

		vdOnInitialiseFramework: function(e, params) {
			var self = this;
			self._super(e, params);

			var runAutoHideMode = $.vdg.vdGetQryParam('mhf_auto_hide'/*, window.parent.document.location.href*/);
			if (!runAutoHideMode) {
				setTimeout(function() {
	        var showUpgradeModal = $.vdg.vdGetQryParam('upgrade_modal_mhf'/*, window.location.href*/);
	        if (showUpgradeModal)
	          self.mnthFreeTrialDialog();
	      }, $.VD_DEFER);

	      setTimeout(function() {
	        self.feedbackPopup();
	      }, 5000);

	      setInterval(function() {
	      	self.feedbackPopup();
	      }, 600000);
	    }
		},

		vdOnCreateStructuralWidget: function(e, params) { 
			this._super(e, params);
			switch (params.widget.vdType)
			{
				case 'row':
				case 'section':
				case 'nav':
				{
					this.validateWidgetCreation(params.widget);
				}
				break;
				default: 
				break;
			}
		},

		vdOnPreCreateMenu: function(e, params) {
			if (params.menu.options.menuName == 'vd-iconTxtWidget-menu') {
				delete params.menu.options.menuBtns.style.subMenu;
			}
		},

		vdOnInitLinkInputMenu: function(e, params) {
			if (params.menu.widgetFullName != 'vd-linkInput')
				return;
			
			var hoverIgnore = ["colour","background-colour","border"];
			var btnOpts = {
				classes: 'vd-pro',
				input: false,
				subMenu: false,
				callback: function() {
					this.getFramework().vdPolymorphic('goProDialog', '', this);
				}
			};

			for (var hBtnName in $.vd.linkInput.prototype.options.menuBtns.hoverStyle.subMenu) {
				if (hoverIgnore.indexOf(hBtnName) > -1)
					continue;
				$.extend( true, $.vd.linkInput.prototype.options.menuBtns.hoverStyle.subMenu[hBtnName], btnOpts);
			}
			for (var aBtnName in $.vd.linkInput.prototype.options.menuBtns.activeStyle.subMenu) {
				$.extend( true, $.vd.linkInput.prototype.options.menuBtns.activeStyle.subMenu[aBtnName], btnOpts);
			}
			for (var vBtnName in $.vd.linkInput.prototype.options.menuBtns.visitedStyle.subMenu) {
				$.extend( true, $.vd.linkInput.prototype.options.menuBtns.visitedStyle.subMenu[vBtnName], btnOpts);
			}

			$.vd.linkInput.prototype.options.menuBtns.activeStyle.classes = 'vd-pro';
			$.vd.linkInput.prototype.options.menuBtns.visitedStyle.classes = 'vd-pro';
		},

		removeOrDisable: function(widget, createdOnPageLoad, msg) {
			var self = this;
			this.goProDialog(msg, widget);

			if (!createdOnPageLoad) {
				var parent = widget.parent();
				// widget.trash();

				setTimeout(function() {
					widget.trash();
					parent.vdPolymorphic('select');
				}, $.VD_DEFER);
			}
			else {
				widget.destroy();
			}
		},

		vdOnCreateMapWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Header Footer Pro to use Map Widgets.');
		},

		vdOnCreateHtmlWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Header Footer Pro to use HTML Widgets.');
		},

		vdOnCreateAudioWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Header Footer Pro to use Audio Widgets.');
		},

		vdOnCreateSliderWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Header Footer Pro to use Slider Widgets.');
		},

		vdOnCreateVideoWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Header Footer Pro to use Video Widgets.');
		},

		vdOnCreateHrWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Header Footer Pro to use Divider Widgets.');
		},

		vdOnCreateDropdownWidget: function(e, params) { 
			this._super(e, params);

			if ($('[vd-type="dropdown"]', params.widget.getDesigner()).length > 2)
				this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'Limit of 2 Dropdown Widgets. With My Header Footer Pro you can create unlimited Dropdown Widgets.');
		},

		vdOnCreateMegaMenuWidget: function(e, params) { 
			this._super(e, params);

			if ($('[vd-type="megamenu"]', params.widget.getDesigner()).length > 2)
				this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'Limit of 2 Mega Menu Widgets. With My Header Footer Pro you can create unlimited Mega Menu Widgets.');
		},

		validateWidgetCreation: function(widget) {
			var self = this;
			var validationTypes = ['row', 'section', 'nav'];
			if (widget.options.defer || widget.options.createdOnPageLoad || !validationTypes.includes(widget.vdType))
				return true;

			setTimeout(function() {
				var designer = gManager.visualDesignerManager('getSelectedVisualDesigner'); // widget.getDesigner();
				var nSections = designer.find('[vd-type="section"]').length;
				var nRows = designer.find('[vd-type="row"]').length;
				var nNavs = designer.find('[vd-type="nav"]').length;
				var isValid = false;
				var msg = '';

				if (widget.vdType == 'section' && nSections > self.MAX_SECTIONS || widget.vdType == 'section' && nRows > self.MAX_ROWS) {
					msg = 'Limit of 2 Section Widgets. With My Header Footer Pro you can create unlimited Section Widgets.';
				}
				else if (widget.vdType == 'row' && nRows > self.MAX_ROWS) {
					msg = 'Limit of 2 Row Widgets. With My Header Footer Pro you can create unlimited Row Widgets.';
				}
				else if (widget.vdType == 'nav' && nNavs > self.MAX_NAVS) {
					msg = 'Limit of 1 Nav Widget. With My Header Footer Pro you can create unlimited Nav Widgets.';
				}
				else isValid = true;

				if (!isValid) {
					self.removeOrDisable(widget, widget.options.createdOnPageLoad, msg);
				}

				return isValid;
			}, $.VD_DEFER);
		},

		goProDialog: function(msg, widget) {
			var self = this;
			var htmlMsg = (msg) ? '<div class="vd-text-widget " id="mhfp-1-20"><p id="mhfp-1-21" vd-font-units="px"><span>' + msg+ '</span></p></div>' : '';
			var html = '<div style="text-align: center;"><style type="text/css">#mhfp-1-44{text-align:left; padding: 0;}#mhfp-1-42{text-align:left; padding: 0;}#mhfp-1-40{text-align:left; padding: 0;}#mhfp-1-25{text-align:left; padding: 0;}#mhfp-1-24{font-size:18px;margin:15px 0px 0px}#mhfp-1-35{padding:0px; padding-bottom: 10px;}#mhfp-1-23{text-align:left}#mhfp-1-21{font-size:18px}#mhfp-1-20{text-align:left}#mhfp-1-19{display: inline-block; background-color:rgb(233, 1, 70);color:rgb(255, 255, 255);padding:20px;font-size:23px;margin:20px 0px;}#mhfp-1-13{font-size:30px;margin:15px 0px}</style><div class="vd-text-widget " id="mhfp-1-12"><p id="mhfp-1-13"><span><b>Pro Feature</b><br></span></p></div>' + htmlMsg  + '<div class="vd-btn-widget vd-text-widget " id="mhfp-1-14" vd-style-identifier="#mhfp-1-14"><a href="https://www.visualdesigner.io/my-header-footer#pricing" vd-link="true" id="mhfp-1-19" vd-style-identifier="#mhfp-1-19" vd-font-units="px" target="_blank"><span><b>Go PRO</b><br></span></a></div><div class="vd-text-widget " id="mhfp-1-20"><p id="mhfp-1-21" vd-font-units="px"><span>Get the Pro version of My Header Footer and get <b>24+ more features and benefits.</b></span></p></div><div class="vd-text-widget " id="mhfp-1-23"><p id="mhfp-1-24" vd-font-units="px"><span><b>Some of the features and benefits:<br></b></span></p></div><div class="vd-row-widget" id="mhfp-1-35"><div class="vd-7 vd-column-widget" id="mhfp-1-36"><div class="vd-text-widget" id="mhfp-1-25"><p id="mhfp-1-26" style="margin-bottom: 2px;font-size: 15px;"><span>- Use a different header or footer design on a specific page<br></span></p></div></div><div class="vd-7 vd-column-widget" id="mhfp-1-39"><div class="vd-text-widget" id="mhfp-1-42"><p id="mhfp-1-43" style="margin-bottom: 2px;font-size: 15px;"><span>- Get new widgets such as; Maps, Sliders, HTML widgets and much more!<br></span></p></div></div><div class="vd-7 vd-column-widget" id="mhfp-1-39"><div class="vd-text-widget " id="mhfp-1-40"><p id="mhfp-1-41" style="margin-bottom: 2px;font-size: 15px;"><span>- Use dynamic data such as; post titles, author name and much more!<br></span></p></div></div><div class="vd-7 vd-column-widget" id="mhfp-1-39"><div class="vd-text-widget " id="mhfp-1-44"><p id="mhfp-1-45" style="margin-bottom: 2px;font-size: 15px;"><span>- More styling options such as; custom CSS, dimension settings and much more!<br></span></p></div></div></div></div>';
			$.vdg.widgetFactory('modalWidget', {
          title: '',
          content: html
      }, self.element);
		},

		mnthFreeTrialDialog: function(msg, widget) {
			var self = this;
			var html = '<div style="text-align: center;"><style type="text/css"> #mhfp-1-12 {padding-top: 25px;}       #mhfp-1-44 {            text-align: left;        }        #mhfp-1-42 {            text-align: left;        }        #mhfp-1-40 {            text-align: left;        }        #mhfp-1-25 {            text-align: left;        }        #mhfp-1-24 {            font-size: 21px;            margin: 15px 0px 0px;        }        #mhfp-1-35 {            padding: 0px;        }        #mhfp-1-23 {            text-align: left;        }        #mhfp-1-21 {            font-size: 18px;            text-align: center;        }        #mhfp-1-20 {            text-align: left;        }        #mhfp-1-19 {            background-color: rgb(233, 1, 70);            color: rgb(255, 255, 255);            padding: 20px;            font-size: 23px;            margin: 20px 0px;            margin-top: 35px;        }        #mhfp-1-13 {            font-size: 30px; }    </style><div class="vd-text-widget " id="mhfp-1-12"><p id="mhfp-1-13" style="margin-bottom: 10px;"><span><b>1 Month Free</b></span></p></div><div class="vd-text-widget " id="mhfp-1-20"><p style="margin-bottom: 10px;" id="mhfp-1-21" vd-font-units="px"><span>Try My Header Footer Pro with 1 month free on us. Build your header and footer exactly how you want. </span></p></div><small>Just use the promo code <strong>WP2020</strong> at checkout.</small><div class="vd-btn-widget vd-text-widget " id="mhfp-1-14" vd-style-identifier="#mhfp-1-14"><a style="display: block; margin-top: 10px; text-decoration: none;" href="https://www.visualdesigner.io/my-header-footer#pricing" vd-link="true" id="mhfp-1-19" vd-style-identifier="#mhfp-1-19" vd-font-units="px" target="_blank"><span><b>1 MONTH FREE</b><br /></span></a></div></div>';
			$.vdg.widgetFactory('modalWidget', {
          title: '',
          content: html
      }, self.element);
		},

		feedbackPopup: function() {
			if ($('.vd-feedback-btn').length)
				return;
			
			var btn = $('<a href="https://www.visualdesigner.io/feedback?ed" target="_blank" class="vd-btn-widget vd-feedback-btn vd-editor-nag"><span>Provide feedback and get US$50! <span style="text-decoration: underline; margin-left: 5px;">Click here for details</span></span><span class="vd-editor-nag-close fas fa-times" onmouseup="jQuery(this).parent().remove();"></span></a>').appendTo('body');

			btn.click(function() {
				$(this).remove();
			});
		},
	});

})(jQuery);
;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */


(function ($) {

	$.widget( "vd.wpMSFramework", $.vd.wordpressFramework, {

		options: {

			visualDesignerManager: {
				menuBtns: {
					
				}
			},

			visualDesigner: {
				menuBtns: {
					
				},
			},

			runningDesigner: {
				menuBtns: {
					"add-section": {
						hidden: true,
					},
					"add-row": {
						hidden: true,
					},
					"style": {
						hidden: true,
					},
					"lock": {
						hidden: true,
					},
				},
			},

			baseWidget: {
				widgetTypes: { 
					'ms-designer': 'mySliderDesigner', 
					'ms-slider': 'mySlider',  
				},
				menuBtns: {
					'box-shadow': {
						hidden: true,
					},
				},
			}, 

			sectionWidget: {
				menuBtns: {
					
				},
			},

			rowWidget: {
				menuBtns: {
					
				},
			},

			columnWidget: {
				menuBtns: {
					"web-design-cmps": {
						index: 91, // important to keep for correct btn ordering
					},
					"foundation-cmps": {
						
					},
				},
			},

			containerWidget: {
				menuBtns: {
					"dynamic": {
						hidden: true,
					},
				},
			},

			textWidget: {
				menuBtns: {
					
				}
			},

			btnWidget: {
				menuBtns: {
					
				},
			},

			imgWidget: {
				menuBtns: {
					
				},
			},

			videoWidget: {
				menuBtns: {
					'src': {
						
					},
				},
			},

			iconWidget: {
				menuBtns: {
					'icon-selector': {
						
					},
				},
			},

			sliderWidget: {
				menuBtns: {
					'trash': {
						hidden: true,
					},
				},
			}, 
		},

		vdOnCreateDesigner: function(e, params) {
			this._super(e, params);
			// params.widget.element.on('vdSelect', function(data) {
			// 	$(this).children('.vd-slider-widget').vdPolymorphic('select', {});
			// });
		},
	});

})(jQuery);;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */


(function ($) {

	$.widget( "vd.wpMSFFramework", $.vd.wpMSFramework, {

		options: {
			visualDesignerManager: {
				menuBtns: {
					
				}
			},

			visualDesigner: {
				menuBtns: {
				},
			},

			runningDesigner: {
				menuBtns: {
					"set-runner": {
						hidden: true,
					},
					"new-runner": {
						hidden: true,
					},
					"save-as-runner": {
						hidden: true,
					},
				},
			},

			baseWidget: {
				menuBtns: {
					"style": {
						subMenu: {
							"set-dimensions": {
								classes: 'vd-pro',
								input: 0,
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"custom-style": {
								subMenu: {
									"set-style": {
										classes: 'vd-pro',
										input: 0,
										callback: function() {
											this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
										}
									},	
								}
							},
						}
					},
				},
			}, 

			structuralWidget: {
				menuBtns: {
					"lock": {
						classes: 'vd-pro',
						callback: function(btn, btnOptions) {
							this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
						}
					},
				},
			},

			sectionWidget: {
				menuBtns: {
					
				},
			},

			rowWidget: {
				menuBtns: {
					"add-column": {
						
					},
				},
			},

			columnWidget: {
				menuBtns: {
					"web-design-cmps": {
						subMenu: {
							"map": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"slider": {
								hidden: true,
							},
						}
					},
					"wp-cmps": {
						subMenu: {
							"add-site-logo": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-site-title": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-site-tagline": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-login-btn": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-page-title": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-copyright": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-shortcode": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-content": {
								hidden: true,
							},
							"add-many": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-sidebar": {
								hidden: true,
							},
							"add-search-results": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
						}
					},
					"foundation-cmps": {
						subMenu: {
							"add-video-widget": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-hr": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-audio-widget": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
							"add-html-widget": {
								classes: 'vd-pro',
								callback: function() {
									this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
								}
							},
						}
					},
				},
			},

			textWidget: {
				menuBtns: {
					"dynamic": {
						index: 994,
						icon: "&#xE8C0;",
						popupText: 'Use dynamic content',
						classes: 'vd-pro',
						input: {
							callback: function(value, btn, data) {
								this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
							}
						}
					},
				}
			},

			btnWidget: {
				menuBtns: {
					
				},
			},

			imgWidget: {
				menuBtns: {
					"dynamic": {
						index: 994,
						icon: "&#xE8C0;",
						popupText: 'Use dynamic content',
						classes: 'vd-pro',
						input: {
							callback: function(value, btn, data) {
								this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
							}
						}
					},
				},
			},

			videoWidget: {
				menuBtns: {
					'src': {
						
					},
				},
			},

			iconWidget: {
				menuBtns: {
					'icon-selector': {
						input: {
							proIcons: {
								"fa-user-shield": true,"fa-user-slash": true,"fa-user-tag": true,"fa-user-tie": true,"fa-user-times": true,"fa-users": true,"fa-users-cog": true,"fa-ad": true,"fa-address-book": true,"fa-address-card": true,"fa-adjust": true,"fa-air-freshener": true,"fa-allergies": true,"fa-ambulance": true,"fa-american-sign-language-interpreting": true,"fa-anchor": true,"fa-angry": true,"fa-ankh": true,"fa-apple-alt": true,"fa-archive": true,"fa-archway": true,"fa-assistive-listening-systems": true,"fa-asterisk": true,"fa-at": true,"fa-atlas": true,"fa-atom": true,"fa-audio-description": true,"fa-award": true,"fa-baby": true,"fa-baby-carriage": true,"fa-backspace": true,"fa-backward": true,"fa-bacon": true,"fa-bahai": true,"fa-balance-scale": true,"fa-balance-scale-left": true,"fa-balance-scale-right": true,"fa-ban": true,"fa-band-aid": true,"fa-barcode": true,"fa-baseball-ball": true,"fa-basketball-ball": true,"fa-bath": true,"fa-battery-empty": true,"fa-battery-full": true,"fa-battery-half": true,"fa-battery-quarter": true,"fa-battery-three-quarters": true,"fa-bed": true,"fa-beer": true,"fa-bell": true,"fa-bell-slash": true,"fa-bezier-curve": true,"fa-bible": true,"fa-bicycle": true,"fa-biking": true,"fa-binoculars": true,"fa-biohazard": true,"fa-birthday-cake": true,"fa-blender": true,"fa-blender-phone": true,"fa-blind": true,"fa-blog": true,"fa-bold": true,"fa-bolt": true,"fa-bomb": true,"fa-bone": true,"fa-bong": true,"fa-book": true,"fa-book-dead": true,"fa-book-medical": true,"fa-book-open": true,"fa-book-reader": true,"fa-bookmark": true,"fa-border-all": true,"fa-border-none": true,"fa-border-style": true,"fa-bowling-ball": true,"fa-box": true,"fa-box-open": true,"fa-boxes": true,"fa-braille": true,"fa-brain": true,"fa-bread-slice": true,"fa-briefcase": true,"fa-briefcase-medical": true,"fa-broadcast-tower": true,"fa-broom": true,"fa-brush": true,"fa-bug": true,"fa-building": true,"fa-bullhorn": true,"fa-bullseye": true,"fa-burn": true,"fa-bus": true,"fa-bus-alt": true,"fa-business-time": true,"fa-calculator": true,"fa-calendar": true,"fa-calendar-alt": true,"fa-calendar-check": true,"fa-calendar-day": true,"fa-calendar-minus": true,"fa-calendar-plus": true,"fa-calendar-times": true,"fa-calendar-week": true,"fa-camera": true,"fa-camera-retro": true,"fa-campground": true,"fa-candy-cane": true,"fa-cannabis": true,"fa-capsules": true,"fa-car": true,"fa-car-alt": true,"fa-car-battery": true,"fa-car-crash": true,"fa-car-side": true,"fa-caravan": true,"fa-carrot": true,"fa-cart-plus": true,"fa-cash-register": true,"fa-cat": true,"fa-certificate": true,"fa-chair": true,"fa-chalkboard": true,"fa-chalkboard-teacher": true,"fa-charging-station": true,"fa-chart-area": true,"fa-chart-bar": true,"fa-chart-line": true,"fa-chart-pie": true,"fa-check": true,"fa-check-circle": true,"fa-check-double": true,"fa-check-square": true,"fa-cheese": true,"fa-chess": true,"fa-chess-bishop": true,"fa-chess-board": true,"fa-chess-king": true,"fa-chess-knight": true,"fa-chess-pawn": true, "fa-hamburger": true,"fa-chess-queen": true,"fa-chess-rook": true,"fa-sign": true,"fa-child": true,"fa-church": true,"fa-circle-notch": true,"fa-city": true,"fa-clinic-medical": true,"fa-clipboard": true,"fa-clipboard-check": true,"fa-clipboard-list": true,"fa-clock": true,"fa-clone": true,"fa-closed-captioning": true,"fa-cloud": true,"fa-cloud-download-alt": true,"fa-cloud-meatball": true,"fa-cloud-moon": true,"fa-cloud-moon-rain": true,"fa-cloud-rain": true,"fa-cloud-showers-heavy": true,"fa-cloud-sun": true,"fa-cloud-sun-rain": true,"fa-cloud-upload-alt": true,"fa-cocktail": true,"fa-code": true,"fa-code-branch": true,"fa-coffee": true,"fa-cog": true,"fa-cogs": true,"fa-coins": true,"fa-columns": true,"fa-comment": true,"fa-comment-alt": true,"fa-comment-dollar": true,"fa-comment-dots": true,"fa-comment-medical": true,"fa-comment-slash": true,"fa-comments": true,"fa-comments-dollar": true,"fa-compact-disc": true,"fa-compass": true,"fa-compress": true,"fa-compress-alt": true,"fa-compress-arrows-alt": true,"fa-concierge-bell": true,"fa-cookie": true,"fa-cookie-bite": true,"fa-couch": true,"fa-credit-card": true,"fa-crop": true,"fa-crop-alt": true,"fa-cross": true,"fa-crosshairs": true,"fa-crow": true,"fa-crown": true,"fa-crutch": true,"fa-cube": true,"fa-cubes": true,"fa-cut": true,"fa-dailymotion": true,"fa-database": true,"fa-deaf": true,"fa-democrat": true,"fa-desktop": true,"fa-dharmachakra": true,"fa-diagnoses": true,"fa-dice": true,"fa-dice-d20": true,"fa-dice-d6": true,"fa-dice-five": true,"fa-dice-four": true,"fa-dice-one": true,"fa-dice-six": true,"fa-dice-three": true,"fa-dice-two": true,"fa-digital-tachograph": true,"fa-directions": true,"fa-divide": true,"fa-dizzy": true,"fa-dna": true,"fa-dog": true,"fa-dollar-sign": true,"fa-dolly": true,"fa-dolly-flatbed": true,"fa-donate": true,"fa-door-closed": true,"fa-door-open": true,"fa-dot-circle": true,"fa-dove": true,"fa-download": true,"fa-drafting-compass": true,"fa-dragon": true,"fa-draw-polygon": true,"fa-drum": true,"fa-drum-steelpan": true,"fa-drumstick-bite": true,"fa-dumbbell": true,"fa-dumpster": true,"fa-dumpster-fire": true,"fa-dungeon": true,"fa-edit": true,"fa-egg": true,"fa-eject": true,"fa-ellipsis-h": true,"fa-ellipsis-v": true,"fa-envelope": true,"fa-envelope-open": true,"fa-envelope-open-text": true,"fa-envelope-square": true,"fa-equals": true,"fa-eraser": true,"fa-ethernet": true,"fa-euro-sign": true,"fa-exchange-alt": true,"fa-exclamation": true,"fa-exclamation-circle": true,"fa-exclamation-triangle": true,"fa-expand": true,"fa-expand-alt": true,"fa-expand-arrows-alt": true,"fa-external-link-alt": true,"fa-external-link-square-alt": true,"fa-eye": true,"fa-eye-dropper": true,"fa-eye-slash": true,"fa-fan": true,"fa-fast-backward": true,"fa-fast-forward": true,"fa-fax": true,"fa-feather": true,"fa-feather-alt": true,"fa-female": true,"fa-fighter-jet": true,"fa-file": true,"fa-file-alt": true,"fa-file-archive": true,"fa-file-audio": true,"fa-file-code": true,"fa-file-contract": true,"fa-file-csv": true,"fa-file-download": true,"fa-file-excel": true,"fa-file-export": true,"fa-file-image": true,"fa-file-import": true,"fa-file-invoice": true,"fa-file-invoice-dollar": true,"fa-file-medical": true,"fa-file-medical-alt": true,"fa-file-pdf": true,"fa-file-powerpoint": true,"fa-file-prescription": true,"fa-file-signature": true,"fa-file-upload": true,"fa-file-video": true,"fa-file-word": true,"fa-fill": true,"fa-fill-drip": true,"fa-film": true,"fa-filter": true,"fa-fingerprint": true,"fa-fire": true,"fa-fire-alt": true,"fa-fire-extinguisher": true,"fa-firefox-browser": true,"fa-first-aid": true,"fa-fish": true,"fa-fist-raised": true,"fa-flag": true,"fa-flag-checkered": true,"fa-flag-usa": true,"fa-flask": true,"fa-flushed": true,"fa-folder": true,"fa-folder-minus": true,"fa-folder-open": true,"fa-folder-plus": true,"fa-font": true,"fa-football-ball": true,"fa-forward": true,"fa-frog": true,"fa-frown": true,"fa-frown-open": true,"fa-funnel-dollar": true,"fa-futbol": true,"fa-gamepad": true,"fa-gas-pump": true,"fa-gavel": true,"fa-gem": true,"fa-genderless": true,"fa-ghost": true,"fa-gift": true,"fa-gifts": true,"fa-glass-cheers": true,"fa-glass-martini": true,"fa-glass-martini-alt": true,"fa-glass-whiskey": true,"fa-glasses": true,"fa-globe": true,"fa-globe-africa": true,"fa-globe-americas": true,"fa-globe-asia": true,"fa-globe-europe": true,"fa-golf-ball": true,"fa-gopuram": true,"fa-graduation-cap": true,"fa-greater-than": true,"fa-greater-than-equal": true,"fa-grimace": true,"fa-grin": true,"fa-grin-alt": true,"fa-grin-beam": true,"fa-grin-beam-sweat": true,"fa-grin-hearts": true,"fa-grin-squint": true,"fa-grin-squint-tears": true,"fa-grin-stars": true,"fa-grin-tears": true,"fa-grin-tongue": true,"fa-grin-tongue-squint": true,"fa-grin-tongue-wink": true,"fa-grin-wink": true,"fa-grip-horizontal": true,"fa-grip-lines": true,"fa-grip-lines-vertical": true,"fa-grip-vertical": true,"fa-guitar": true,"fa-h-square": true,"fa-hammer": true,"fa-hamsa": true,"fa-hand-holding": true,"fa-hand-holding-heart": true,"fa-hand-holding-usd": true,"fa-hand-lizard": true,"fa-hand-middle-finger": true,"fa-hand-paper": true,"fa-hand-peace": true,"fa-hand-point-down": true,"fa-hand-point-left": true,"fa-hand-point-right": true,"fa-hand-point-up": true,"fa-hand-pointer": true,"fa-hand-rock": true,"fa-hand-scissors": true,"fa-hand-spock": true,"fa-hands": true,"fa-hands-helping": true,"fa-handshake": true,"fa-hanukiah": true,"fa-hard-hat": true,"fa-hashtag": true,"fa-hat-cowboy": true,"fa-hat-cowboy-side": true,"fa-hat-wizard": true,"fa-hdd": true,"fa-heading": true,"fa-headphones": true,"fa-headphones-alt": true,"fa-headset": true,"fa-heart": true,"fa-heart-broken": true,"fa-heartbeat": true,"fa-helicopter": true,"fa-highlighter": true,"fa-hiking": true,"fa-hippo": true,"fa-history": true,"fa-hockey-puck": true,"fa-holly-berry": true,"fa-home": true,"fa-horse": true,"fa-horse-head": true,"fa-hospital": true,"fa-hospital-alt": true,"fa-hospital-symbol": true,"fa-hot-tub": true,"fa-hotdog": true,"fa-hotel": true,"fa-hourglass": true,"fa-hourglass-end": true,"fa-hourglass-half": true,"fa-hourglass-start": true,"fa-house-damage": true,"fa-hryvnia": true,"fa-i-cursor": true,"fa-ice-cream": true,"fa-icicles": true,"fa-icons": true,"fa-id-badge": true,"fa-id-card": true,"fa-id-card-alt": true,"fa-ideal": true,"fa-igloo": true,"fa-image": true,"fa-images": true,"fa-inbox": true,"fa-indent": true,"fa-industry": true,"fa-infinity": true,"fa-info": true,"fa-info-circle": true,"fa-instagram-square": true,"fa-italic": true,"fa-jedi": true,"fa-joint": true,"fa-kaaba": true,"fa-key": true,"fa-keyboard": true,"fa-khanda": true,"fa-kiss": true,"fa-kiss-beam": true,"fa-kiss-wink-heart": true,"fa-kiwi-bird": true,"fa-landmark": true,"fa-language": true,"fa-laptop": true,"fa-laptop-code": true,"fa-laptop-medical": true,"fa-laugh": true,"fa-laugh-beam": true,"fa-laugh-squint": true,"fa-laugh-wink": true,"fa-layer-group": true,"fa-leaf": true,"fa-lemon": true,"fa-less-than": true,"fa-less-than-equal": true,"fa-level-down-alt": true,"fa-level-up-alt": true,"fa-life-ring": true,"fa-lightbulb": true,"fa-link": true,"fa-lira-sign": true,"fa-list": true,"fa-list-alt": true,"fa-list-ol": true,"fa-list-ul": true,"fa-location-arrow": true,"fa-lock": true,"fa-lock-open": true,"fa-low-vision": true,"fa-luggage-cart": true,"fa-magic": true,"fa-magnet": true,"fa-mail-bulk": true,"fa-male": true,"fa-map": true,"fa-map-marked": true,"fa-map-marked-alt": true,"fa-map-marker": true,"fa-map-marker-alt": true,"fa-map-pin": true,"fa-map-signs": true,"fa-marker": true,"fa-mars": true,"fa-mars-double": true,"fa-mars-stroke": true,"fa-mars-stroke-h": true,"fa-mars-stroke-v": true,"fa-mask": true,"fa-medal": true,"fa-medkit": true,"fa-meh": true,"fa-meh-blank": true,"fa-meh-rolling-eyes": true,"fa-memory": true,"fa-menorah": true,"fa-mercury": true,"fa-meteor": true,"fa-microblog": true,"fa-microchip": true,"fa-microphone": true,"fa-microphone-alt": true,"fa-microphone-alt-slash": true,"fa-microphone-slash": true,"fa-microscope": true,"fa-minus": true,"fa-minus-circle": true,"fa-minus-square": true,"fa-mitten": true,"fa-mixer": true,"fa-mobile": true,"fa-mobile-alt": true,"fa-money-bill": true,"fa-money-bill-alt": true,"fa-money-bill-wave": true,"fa-money-bill-wave-alt": true,"fa-money-check": true,"fa-money-check-alt": true,"fa-monument": true,"fa-moon": true,"fa-mortar-pestle": true,"fa-mosque": true,"fa-motorcycle": true,"fa-mountain": true,"fa-mouse": true,"fa-mouse-pointer": true,"fa-mug-hot": true,"fa-music": true,"fa-network-wired": true,"fa-neuter": true,"fa-newspaper": true,"fa-not-equal": true,"fa-notes-medical": true,"fa-object-group": true,"fa-object-ungroup": true,"fa-oil-can": true,"fa-om": true,"fa-otter": true,"fa-outdent": true,"fa-pager": true,"fa-paint-brush": true,"fa-paint-roller": true,"fa-palette": true,"fa-pallet": true,"fa-paper-plane": true,"fa-paperclip": true,"fa-parachute-box": true,"fa-paragraph": true,"fa-parking": true,"fa-passport": true,"fa-pastafarianism": true,"fa-pause": true,"fa-pause-circle": true,"fa-paw": true,"fa-peace": true,"fa-pen": true,"fa-pen-alt": true,"fa-pen-fancy": true,"fa-pen-nib": true,"fa-pen-square": true,"fa-pencil-alt": true,"fa-pencil-ruler": true,"fa-people-carry": true,"fa-pepper-hot": true,"fa-percent": true,"fa-percentage": true,"fa-person-booth": true,"fa-phone": true,"fa-phone-alt": true,"fa-phone-slash": true,"fa-phone-square": true,"fa-phone-square-alt": true,"fa-phone-volume": true,"fa-photo-video": true,"fa-pied-piper-square": true,"fa-piggy-bank": true,"fa-pills": true,"fa-pizza-slice": true,"fa-place-of-worship": true,"fa-plane": true,"fa-plane-arrival": true,"fa-plane-departure": true,"fa-play": true,"fa-play-circle": true,"fa-plug": true,"fa-plus": true,"fa-plus-circle": true,"fa-plus-square": true,"fa-podcast": true,"fa-poll": true,"fa-poll-h": true,"fa-poo": true,"fa-poo-storm": true,"fa-poop": true,"fa-portrait": true,"fa-pound-sign": true,"fa-power-off": true,"fa-pray": true,"fa-praying-hands": true,"fa-prescription": true,"fa-prescription-bottle": true,"fa-prescription-bottle-alt": true,"fa-print": true,"fa-procedures": true,"fa-project-diagram": true,"fa-puzzle-piece": true,"fa-qrcode": true,"fa-question": true,"fa-question-circle": true,"fa-quidditch": true,"fa-quote-left": true,"fa-quote-right": true,"fa-quran": true,"fa-radiation": true,"fa-radiation-alt": true,"fa-rainbow": true,"fa-random": true,"fa-receipt": true,"fa-record-vinyl": true,"fa-recycle": true,"fa-redo": true,"fa-redo-alt": true,"fa-remove-format": true,"fa-reply": true,"fa-reply-all": true,"fa-republican": true,"fa-restroom": true,"fa-retweet": true,"fa-ribbon": true,"fa-ring": true,"fa-road": true,"fa-robot": true,"fa-rocket": true,"fa-route": true,"fa-rss": true,"fa-rss-square": true,"fa-ruble-sign": true,"fa-ruler": true,"fa-ruler-combined": true,"fa-ruler-horizontal": true,"fa-ruler-vertical": true,"fa-running": true,"fa-rupee-sign": true,"fa-sad-cry": true,"fa-sad-tear": true,"fa-satellite": true,"fa-satellite-dish": true,"fa-save": true,"fa-school": true,"fa-screwdriver": true,"fa-scroll": true,"fa-sd-card": true,"fa-seedling": true,"fa-server": true,"fa-shapes": true,"fa-share": true,"fa-share-alt": true,"fa-share-alt-square": true,"fa-share-square": true,"fa-shekel-sign": true,"fa-shield-alt": true,"fa-ship": true,"fa-shipping-fast": true,"fa-shoe-prints": true,"fa-shopify": true,"fa-shopping-bag": true,"fa-shopping-basket": true,"fa-shopping-cart": true,"fa-shower": true,"fa-shuttle-van": true,"fa-sign-language": true,"fa-signal": true,"fa-signature": true,"fa-sim-card": true,"fa-sitemap": true,"fa-skating": true,"fa-skiing": true,"fa-skiing-nordic": true,"fa-skull": true,"fa-skull-crossbones": true,"fa-slash": true,"fa-sleigh": true,"fa-sliders-h": true,"fa-smile": true,"fa-smile-beam": true,"fa-smile-wink": true,"fa-smog": true,"fa-smoking": true,"fa-smoking-ban": true,"fa-sms": true,"fa-snowboarding": true,"fa-snowflake": true,"fa-snowman": true,"fa-snowplow": true,"fa-socks": true,"fa-solar-panel": true,"fa-sort": true,"fa-sort-alpha-down": true,"fa-sort-alpha-down-alt": true,"fa-sort-alpha-up": true,"fa-sort-alpha-up-alt": true,"fa-sort-amount-down": true,"fa-sort-amount-down-alt": true,"fa-sort-amount-up": true,"fa-sort-amount-up-alt": true,"fa-sort-down": true,"fa-sort-numeric-down": true,"fa-sort-numeric-down-alt": true,"fa-sort-numeric-up": true,"fa-sort-numeric-up-alt": true,"fa-sort-up": true,"fa-spa": true,"fa-space-shuttle": true,"fa-spell-check": true,"fa-spider": true,"fa-spinner": true,"fa-splotch": true,"fa-spray-can": true,"fa-square": true,"fa-square-full": true,"fa-square-root-alt": true,"fa-stamp": true,"fa-star": true,"fa-star-and-crescent": true,"fa-star-half": true,"fa-star-half-alt": true,"fa-star-of-david": true,"fa-star-of-life": true,"fa-step-backward": true,"fa-step-forward": true,"fa-stethoscope": true,"fa-sticky-note": true,"fa-stop": true,"fa-stop-circle": true,"fa-stopwatch": true,"fa-store": true,"fa-store-alt": true,"fa-stream": true,"fa-street-view": true,"fa-strikethrough": true,"fa-stroopwafel": true,"fa-subscript": true,"fa-subway": true,"fa-suitcase": true,"fa-suitcase-rolling": true,"fa-sun": true,"fa-superscript": true,"fa-surprise": true,"fa-swatchbook": true,"fa-swimmer": true,"fa-swimming-pool": true,"fa-synagogue": true,"fa-sync": true,"fa-sync-alt": true,"fa-syringe": true,"fa-table": true,"fa-table-tennis": true,"fa-tablet": true,"fa-tablet-alt": true,"fa-tablets": true,"fa-tachometer-alt": true,"fa-tag": true,"fa-tags": true,"fa-tape": true,"fa-tasks": true,"fa-taxi": true,"fa-teeth": true,"fa-teeth-open": true,"fa-temperature-high": true,"fa-temperature-low": true,"fa-tenge": true,"fa-terminal": true,"fa-text-height": true,"fa-text-width": true,"fa-th": true,"fa-th-large": true,"fa-th-list": true,"fa-theater-masks": true,"fa-thermometer": true,"fa-thermometer-empty": true,"fa-thermometer-full": true,"fa-thermometer-half": true,"fa-thermometer-quarter": true,"fa-thermometer-three-quarters": true,"fa-thumbs-down": true,"fa-thumbs-up": true,"fa-thumbtack": true,"fa-ticket-alt": true,"fa-times": true,"fa-times-circle": true,"fa-tint": true,"fa-tint-slash": true,"fa-tired": true,"fa-toggle-off": true,"fa-toggle-on": true,"fa-toilet": true,"fa-toilet-paper": true,"fa-toolbox": true,"fa-tools": true,"fa-tooth": true,"fa-torah": true,"fa-torii-gate": true,"fa-tractor": true,"fa-trademark": true,"fa-traffic-light": true,"fa-trailer": true,"fa-train": true,"fa-tram": true,"fa-transgender": true,"fa-transgender-alt": true,"fa-trash": true,"fa-trash-alt": true,"fa-trash-restore": true,"fa-trash-restore-alt": true,"fa-tree": true,"fa-trophy": true,"fa-truck": true,"fa-truck-loading": true,"fa-truck-monster": true,"fa-truck-moving": true,"fa-truck-pickup": true,"fa-tshirt": true,"fa-tty": true,"fa-tv": true,"fa-umbrella": true,"fa-umbrella-beach": true,"fa-underline": true,"fa-undo": true,"fa-undo-alt": true,"fa-unity": true,"fa-universal-access": true,"fa-university": true,"fa-unlink": true,"fa-unlock": true,"fa-unlock-alt": true,"fa-upload": true,"fa-utensil-spoon": true,"fa-utensils": true,"fa-vector-square": true,"fa-venus": true,"fa-venus-double": true,"fa-venus-mars": true,"fa-vial": true,"fa-vials": true,"fa-video": true,"fa-video-slash": true,"fa-vihara": true,"fa-voicemail": true,"fa-volleyball-ball": true,"fa-volume-down": true,"fa-volume-mute": true,"fa-volume-off": true,"fa-volume-up": true,"fa-vote-yea": true,"fa-vr-cardboard": true,"fa-walking": true,"fa-wallet": true,"fa-warehouse": true,"fa-water": true,"fa-wave-square": true,"fa-weight": true,"fa-weight-hanging": true,"fa-wheelchair": true,"fa-wifi": true,"fa-wind": true,"fa-window-close": true,"fa-window-maximize": true,"fa-window-minimize": true,"fa-window-restore": true,"fa-wine-bottle": true,"fa-wine-glass": true,"fa-wine-glass-alt": true,"fa-won-sign": true,"fa-wrench": true,"fa-x-ray": true,"fa-yen-sign": true,"fa-yin-yang": true,
							}
						}
					},
				},
			},

			iconTxtWidget: {
				menuBtns: {
					"style": {
						classes: 'vd-pro',
						callback: function(btn, btnOptions) {
							this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
						}
					},
					"clone": {
						classes: 'vd-pro',
						callback: function(btn, btnOptions) {
							this.getFramework().vdPolymorphic('goProDialog', 'This is a Pro feature. Please upgrade to My Slider Pro to use this feature.', this);
						}
					},
					'icon-selector': {
						input: {
							proIcons: {
								"fa-user-shield": true,"fa-user-slash": true,"fa-user-tag": true,"fa-user-tie": true,"fa-user-times": true,"fa-users": true,"fa-users-cog": true,"fa-ad": true,"fa-address-book": true,"fa-address-card": true,"fa-adjust": true,"fa-air-freshener": true,"fa-allergies": true,"fa-ambulance": true,"fa-american-sign-language-interpreting": true,"fa-anchor": true,"fa-angry": true,"fa-ankh": true,"fa-apple-alt": true,"fa-archive": true,"fa-archway": true,"fa-assistive-listening-systems": true,"fa-asterisk": true,"fa-at": true,"fa-atlas": true,"fa-atom": true,"fa-audio-description": true,"fa-award": true,"fa-baby": true,"fa-baby-carriage": true,"fa-backspace": true,"fa-backward": true,"fa-bacon": true,"fa-bahai": true,"fa-balance-scale": true,"fa-balance-scale-left": true,"fa-balance-scale-right": true,"fa-ban": true,"fa-band-aid": true,"fa-barcode": true,"fa-baseball-ball": true,"fa-basketball-ball": true,"fa-bath": true,"fa-battery-empty": true,"fa-battery-full": true,"fa-battery-half": true,"fa-battery-quarter": true,"fa-battery-three-quarters": true,"fa-bed": true,"fa-beer": true,"fa-bell": true,"fa-bell-slash": true,"fa-bezier-curve": true,"fa-bible": true,"fa-bicycle": true,"fa-biking": true,"fa-binoculars": true,"fa-biohazard": true,"fa-birthday-cake": true,"fa-blender": true,"fa-blender-phone": true,"fa-blind": true,"fa-blog": true,"fa-bold": true,"fa-bolt": true,"fa-bomb": true,"fa-bone": true,"fa-bong": true,"fa-book": true,"fa-book-dead": true,"fa-book-medical": true,"fa-book-open": true,"fa-book-reader": true,"fa-bookmark": true,"fa-border-all": true,"fa-border-none": true,"fa-border-style": true,"fa-bowling-ball": true,"fa-box": true,"fa-box-open": true,"fa-boxes": true,"fa-braille": true,"fa-brain": true,"fa-bread-slice": true,"fa-briefcase": true,"fa-briefcase-medical": true,"fa-broadcast-tower": true,"fa-broom": true,"fa-brush": true,"fa-bug": true,"fa-building": true,"fa-bullhorn": true,"fa-bullseye": true,"fa-burn": true,"fa-bus": true,"fa-bus-alt": true,"fa-business-time": true,"fa-calculator": true,"fa-calendar": true,"fa-calendar-alt": true,"fa-calendar-check": true,"fa-calendar-day": true,"fa-calendar-minus": true,"fa-calendar-plus": true,"fa-calendar-times": true,"fa-calendar-week": true,"fa-camera": true,"fa-camera-retro": true,"fa-campground": true,"fa-candy-cane": true,"fa-cannabis": true,"fa-capsules": true,"fa-car": true,"fa-car-alt": true,"fa-car-battery": true,"fa-car-crash": true,"fa-car-side": true,"fa-caravan": true,"fa-carrot": true,"fa-cart-plus": true,"fa-cash-register": true,"fa-cat": true,"fa-certificate": true,"fa-chair": true,"fa-chalkboard": true,"fa-chalkboard-teacher": true,"fa-charging-station": true,"fa-chart-area": true,"fa-chart-bar": true,"fa-chart-line": true,"fa-chart-pie": true,"fa-check": true,"fa-check-circle": true,"fa-check-double": true,"fa-check-square": true,"fa-cheese": true,"fa-chess": true,"fa-chess-bishop": true,"fa-chess-board": true,"fa-chess-king": true,"fa-chess-knight": true,"fa-chess-pawn": true, "fa-hamburger": true,"fa-chess-queen": true,"fa-chess-rook": true,"fa-sign": true,"fa-child": true,"fa-church": true,"fa-circle-notch": true,"fa-city": true,"fa-clinic-medical": true,"fa-clipboard": true,"fa-clipboard-check": true,"fa-clipboard-list": true,"fa-clock": true,"fa-clone": true,"fa-closed-captioning": true,"fa-cloud": true,"fa-cloud-download-alt": true,"fa-cloud-meatball": true,"fa-cloud-moon": true,"fa-cloud-moon-rain": true,"fa-cloud-rain": true,"fa-cloud-showers-heavy": true,"fa-cloud-sun": true,"fa-cloud-sun-rain": true,"fa-cloud-upload-alt": true,"fa-cocktail": true,"fa-code": true,"fa-code-branch": true,"fa-coffee": true,"fa-cog": true,"fa-cogs": true,"fa-coins": true,"fa-columns": true,"fa-comment": true,"fa-comment-alt": true,"fa-comment-dollar": true,"fa-comment-dots": true,"fa-comment-medical": true,"fa-comment-slash": true,"fa-comments": true,"fa-comments-dollar": true,"fa-compact-disc": true,"fa-compass": true,"fa-compress": true,"fa-compress-alt": true,"fa-compress-arrows-alt": true,"fa-concierge-bell": true,"fa-cookie": true,"fa-cookie-bite": true,"fa-couch": true,"fa-credit-card": true,"fa-crop": true,"fa-crop-alt": true,"fa-cross": true,"fa-crosshairs": true,"fa-crow": true,"fa-crown": true,"fa-crutch": true,"fa-cube": true,"fa-cubes": true,"fa-cut": true,"fa-dailymotion": true,"fa-database": true,"fa-deaf": true,"fa-democrat": true,"fa-desktop": true,"fa-dharmachakra": true,"fa-diagnoses": true,"fa-dice": true,"fa-dice-d20": true,"fa-dice-d6": true,"fa-dice-five": true,"fa-dice-four": true,"fa-dice-one": true,"fa-dice-six": true,"fa-dice-three": true,"fa-dice-two": true,"fa-digital-tachograph": true,"fa-directions": true,"fa-divide": true,"fa-dizzy": true,"fa-dna": true,"fa-dog": true,"fa-dollar-sign": true,"fa-dolly": true,"fa-dolly-flatbed": true,"fa-donate": true,"fa-door-closed": true,"fa-door-open": true,"fa-dot-circle": true,"fa-dove": true,"fa-download": true,"fa-drafting-compass": true,"fa-dragon": true,"fa-draw-polygon": true,"fa-drum": true,"fa-drum-steelpan": true,"fa-drumstick-bite": true,"fa-dumbbell": true,"fa-dumpster": true,"fa-dumpster-fire": true,"fa-dungeon": true,"fa-edit": true,"fa-egg": true,"fa-eject": true,"fa-ellipsis-h": true,"fa-ellipsis-v": true,"fa-envelope": true,"fa-envelope-open": true,"fa-envelope-open-text": true,"fa-envelope-square": true,"fa-equals": true,"fa-eraser": true,"fa-ethernet": true,"fa-euro-sign": true,"fa-exchange-alt": true,"fa-exclamation": true,"fa-exclamation-circle": true,"fa-exclamation-triangle": true,"fa-expand": true,"fa-expand-alt": true,"fa-expand-arrows-alt": true,"fa-external-link-alt": true,"fa-external-link-square-alt": true,"fa-eye": true,"fa-eye-dropper": true,"fa-eye-slash": true,"fa-fan": true,"fa-fast-backward": true,"fa-fast-forward": true,"fa-fax": true,"fa-feather": true,"fa-feather-alt": true,"fa-female": true,"fa-fighter-jet": true,"fa-file": true,"fa-file-alt": true,"fa-file-archive": true,"fa-file-audio": true,"fa-file-code": true,"fa-file-contract": true,"fa-file-csv": true,"fa-file-download": true,"fa-file-excel": true,"fa-file-export": true,"fa-file-image": true,"fa-file-import": true,"fa-file-invoice": true,"fa-file-invoice-dollar": true,"fa-file-medical": true,"fa-file-medical-alt": true,"fa-file-pdf": true,"fa-file-powerpoint": true,"fa-file-prescription": true,"fa-file-signature": true,"fa-file-upload": true,"fa-file-video": true,"fa-file-word": true,"fa-fill": true,"fa-fill-drip": true,"fa-film": true,"fa-filter": true,"fa-fingerprint": true,"fa-fire": true,"fa-fire-alt": true,"fa-fire-extinguisher": true,"fa-firefox-browser": true,"fa-first-aid": true,"fa-fish": true,"fa-fist-raised": true,"fa-flag": true,"fa-flag-checkered": true,"fa-flag-usa": true,"fa-flask": true,"fa-flushed": true,"fa-folder": true,"fa-folder-minus": true,"fa-folder-open": true,"fa-folder-plus": true,"fa-font": true,"fa-football-ball": true,"fa-forward": true,"fa-frog": true,"fa-frown": true,"fa-frown-open": true,"fa-funnel-dollar": true,"fa-futbol": true,"fa-gamepad": true,"fa-gas-pump": true,"fa-gavel": true,"fa-gem": true,"fa-genderless": true,"fa-ghost": true,"fa-gift": true,"fa-gifts": true,"fa-glass-cheers": true,"fa-glass-martini": true,"fa-glass-martini-alt": true,"fa-glass-whiskey": true,"fa-glasses": true,"fa-globe": true,"fa-globe-africa": true,"fa-globe-americas": true,"fa-globe-asia": true,"fa-globe-europe": true,"fa-golf-ball": true,"fa-gopuram": true,"fa-graduation-cap": true,"fa-greater-than": true,"fa-greater-than-equal": true,"fa-grimace": true,"fa-grin": true,"fa-grin-alt": true,"fa-grin-beam": true,"fa-grin-beam-sweat": true,"fa-grin-hearts": true,"fa-grin-squint": true,"fa-grin-squint-tears": true,"fa-grin-stars": true,"fa-grin-tears": true,"fa-grin-tongue": true,"fa-grin-tongue-squint": true,"fa-grin-tongue-wink": true,"fa-grin-wink": true,"fa-grip-horizontal": true,"fa-grip-lines": true,"fa-grip-lines-vertical": true,"fa-grip-vertical": true,"fa-guitar": true,"fa-h-square": true,"fa-hammer": true,"fa-hamsa": true,"fa-hand-holding": true,"fa-hand-holding-heart": true,"fa-hand-holding-usd": true,"fa-hand-lizard": true,"fa-hand-middle-finger": true,"fa-hand-paper": true,"fa-hand-peace": true,"fa-hand-point-down": true,"fa-hand-point-left": true,"fa-hand-point-right": true,"fa-hand-point-up": true,"fa-hand-pointer": true,"fa-hand-rock": true,"fa-hand-scissors": true,"fa-hand-spock": true,"fa-hands": true,"fa-hands-helping": true,"fa-handshake": true,"fa-hanukiah": true,"fa-hard-hat": true,"fa-hashtag": true,"fa-hat-cowboy": true,"fa-hat-cowboy-side": true,"fa-hat-wizard": true,"fa-hdd": true,"fa-heading": true,"fa-headphones": true,"fa-headphones-alt": true,"fa-headset": true,"fa-heart": true,"fa-heart-broken": true,"fa-heartbeat": true,"fa-helicopter": true,"fa-highlighter": true,"fa-hiking": true,"fa-hippo": true,"fa-history": true,"fa-hockey-puck": true,"fa-holly-berry": true,"fa-home": true,"fa-horse": true,"fa-horse-head": true,"fa-hospital": true,"fa-hospital-alt": true,"fa-hospital-symbol": true,"fa-hot-tub": true,"fa-hotdog": true,"fa-hotel": true,"fa-hourglass": true,"fa-hourglass-end": true,"fa-hourglass-half": true,"fa-hourglass-start": true,"fa-house-damage": true,"fa-hryvnia": true,"fa-i-cursor": true,"fa-ice-cream": true,"fa-icicles": true,"fa-icons": true,"fa-id-badge": true,"fa-id-card": true,"fa-id-card-alt": true,"fa-ideal": true,"fa-igloo": true,"fa-image": true,"fa-images": true,"fa-inbox": true,"fa-indent": true,"fa-industry": true,"fa-infinity": true,"fa-info": true,"fa-info-circle": true,"fa-instagram-square": true,"fa-italic": true,"fa-jedi": true,"fa-joint": true,"fa-kaaba": true,"fa-key": true,"fa-keyboard": true,"fa-khanda": true,"fa-kiss": true,"fa-kiss-beam": true,"fa-kiss-wink-heart": true,"fa-kiwi-bird": true,"fa-landmark": true,"fa-language": true,"fa-laptop": true,"fa-laptop-code": true,"fa-laptop-medical": true,"fa-laugh": true,"fa-laugh-beam": true,"fa-laugh-squint": true,"fa-laugh-wink": true,"fa-layer-group": true,"fa-leaf": true,"fa-lemon": true,"fa-less-than": true,"fa-less-than-equal": true,"fa-level-down-alt": true,"fa-level-up-alt": true,"fa-life-ring": true,"fa-lightbulb": true,"fa-link": true,"fa-lira-sign": true,"fa-list": true,"fa-list-alt": true,"fa-list-ol": true,"fa-list-ul": true,"fa-location-arrow": true,"fa-lock": true,"fa-lock-open": true,"fa-low-vision": true,"fa-luggage-cart": true,"fa-magic": true,"fa-magnet": true,"fa-mail-bulk": true,"fa-male": true,"fa-map": true,"fa-map-marked": true,"fa-map-marked-alt": true,"fa-map-marker": true,"fa-map-marker-alt": true,"fa-map-pin": true,"fa-map-signs": true,"fa-marker": true,"fa-mars": true,"fa-mars-double": true,"fa-mars-stroke": true,"fa-mars-stroke-h": true,"fa-mars-stroke-v": true,"fa-mask": true,"fa-medal": true,"fa-medkit": true,"fa-meh": true,"fa-meh-blank": true,"fa-meh-rolling-eyes": true,"fa-memory": true,"fa-menorah": true,"fa-mercury": true,"fa-meteor": true,"fa-microblog": true,"fa-microchip": true,"fa-microphone": true,"fa-microphone-alt": true,"fa-microphone-alt-slash": true,"fa-microphone-slash": true,"fa-microscope": true,"fa-minus": true,"fa-minus-circle": true,"fa-minus-square": true,"fa-mitten": true,"fa-mixer": true,"fa-mobile": true,"fa-mobile-alt": true,"fa-money-bill": true,"fa-money-bill-alt": true,"fa-money-bill-wave": true,"fa-money-bill-wave-alt": true,"fa-money-check": true,"fa-money-check-alt": true,"fa-monument": true,"fa-moon": true,"fa-mortar-pestle": true,"fa-mosque": true,"fa-motorcycle": true,"fa-mountain": true,"fa-mouse": true,"fa-mouse-pointer": true,"fa-mug-hot": true,"fa-music": true,"fa-network-wired": true,"fa-neuter": true,"fa-newspaper": true,"fa-not-equal": true,"fa-notes-medical": true,"fa-object-group": true,"fa-object-ungroup": true,"fa-oil-can": true,"fa-om": true,"fa-otter": true,"fa-outdent": true,"fa-pager": true,"fa-paint-brush": true,"fa-paint-roller": true,"fa-palette": true,"fa-pallet": true,"fa-paper-plane": true,"fa-paperclip": true,"fa-parachute-box": true,"fa-paragraph": true,"fa-parking": true,"fa-passport": true,"fa-pastafarianism": true,"fa-pause": true,"fa-pause-circle": true,"fa-paw": true,"fa-peace": true,"fa-pen": true,"fa-pen-alt": true,"fa-pen-fancy": true,"fa-pen-nib": true,"fa-pen-square": true,"fa-pencil-alt": true,"fa-pencil-ruler": true,"fa-people-carry": true,"fa-pepper-hot": true,"fa-percent": true,"fa-percentage": true,"fa-person-booth": true,"fa-phone": true,"fa-phone-alt": true,"fa-phone-slash": true,"fa-phone-square": true,"fa-phone-square-alt": true,"fa-phone-volume": true,"fa-photo-video": true,"fa-pied-piper-square": true,"fa-piggy-bank": true,"fa-pills": true,"fa-pizza-slice": true,"fa-place-of-worship": true,"fa-plane": true,"fa-plane-arrival": true,"fa-plane-departure": true,"fa-play": true,"fa-play-circle": true,"fa-plug": true,"fa-plus": true,"fa-plus-circle": true,"fa-plus-square": true,"fa-podcast": true,"fa-poll": true,"fa-poll-h": true,"fa-poo": true,"fa-poo-storm": true,"fa-poop": true,"fa-portrait": true,"fa-pound-sign": true,"fa-power-off": true,"fa-pray": true,"fa-praying-hands": true,"fa-prescription": true,"fa-prescription-bottle": true,"fa-prescription-bottle-alt": true,"fa-print": true,"fa-procedures": true,"fa-project-diagram": true,"fa-puzzle-piece": true,"fa-qrcode": true,"fa-question": true,"fa-question-circle": true,"fa-quidditch": true,"fa-quote-left": true,"fa-quote-right": true,"fa-quran": true,"fa-radiation": true,"fa-radiation-alt": true,"fa-rainbow": true,"fa-random": true,"fa-receipt": true,"fa-record-vinyl": true,"fa-recycle": true,"fa-redo": true,"fa-redo-alt": true,"fa-remove-format": true,"fa-reply": true,"fa-reply-all": true,"fa-republican": true,"fa-restroom": true,"fa-retweet": true,"fa-ribbon": true,"fa-ring": true,"fa-road": true,"fa-robot": true,"fa-rocket": true,"fa-route": true,"fa-rss": true,"fa-rss-square": true,"fa-ruble-sign": true,"fa-ruler": true,"fa-ruler-combined": true,"fa-ruler-horizontal": true,"fa-ruler-vertical": true,"fa-running": true,"fa-rupee-sign": true,"fa-sad-cry": true,"fa-sad-tear": true,"fa-satellite": true,"fa-satellite-dish": true,"fa-save": true,"fa-school": true,"fa-screwdriver": true,"fa-scroll": true,"fa-sd-card": true,"fa-seedling": true,"fa-server": true,"fa-shapes": true,"fa-share": true,"fa-share-alt": true,"fa-share-alt-square": true,"fa-share-square": true,"fa-shekel-sign": true,"fa-shield-alt": true,"fa-ship": true,"fa-shipping-fast": true,"fa-shoe-prints": true,"fa-shopify": true,"fa-shopping-bag": true,"fa-shopping-basket": true,"fa-shopping-cart": true,"fa-shower": true,"fa-shuttle-van": true,"fa-sign-language": true,"fa-signal": true,"fa-signature": true,"fa-sim-card": true,"fa-sitemap": true,"fa-skating": true,"fa-skiing": true,"fa-skiing-nordic": true,"fa-skull": true,"fa-skull-crossbones": true,"fa-slash": true,"fa-sleigh": true,"fa-sliders-h": true,"fa-smile": true,"fa-smile-beam": true,"fa-smile-wink": true,"fa-smog": true,"fa-smoking": true,"fa-smoking-ban": true,"fa-sms": true,"fa-snowboarding": true,"fa-snowflake": true,"fa-snowman": true,"fa-snowplow": true,"fa-socks": true,"fa-solar-panel": true,"fa-sort": true,"fa-sort-alpha-down": true,"fa-sort-alpha-down-alt": true,"fa-sort-alpha-up": true,"fa-sort-alpha-up-alt": true,"fa-sort-amount-down": true,"fa-sort-amount-down-alt": true,"fa-sort-amount-up": true,"fa-sort-amount-up-alt": true,"fa-sort-down": true,"fa-sort-numeric-down": true,"fa-sort-numeric-down-alt": true,"fa-sort-numeric-up": true,"fa-sort-numeric-up-alt": true,"fa-sort-up": true,"fa-spa": true,"fa-space-shuttle": true,"fa-spell-check": true,"fa-spider": true,"fa-spinner": true,"fa-splotch": true,"fa-spray-can": true,"fa-square": true,"fa-square-full": true,"fa-square-root-alt": true,"fa-stamp": true,"fa-star": true,"fa-star-and-crescent": true,"fa-star-half": true,"fa-star-half-alt": true,"fa-star-of-david": true,"fa-star-of-life": true,"fa-step-backward": true,"fa-step-forward": true,"fa-stethoscope": true,"fa-sticky-note": true,"fa-stop": true,"fa-stop-circle": true,"fa-stopwatch": true,"fa-store": true,"fa-store-alt": true,"fa-stream": true,"fa-street-view": true,"fa-strikethrough": true,"fa-stroopwafel": true,"fa-subscript": true,"fa-subway": true,"fa-suitcase": true,"fa-suitcase-rolling": true,"fa-sun": true,"fa-superscript": true,"fa-surprise": true,"fa-swatchbook": true,"fa-swimmer": true,"fa-swimming-pool": true,"fa-synagogue": true,"fa-sync": true,"fa-sync-alt": true,"fa-syringe": true,"fa-table": true,"fa-table-tennis": true,"fa-tablet": true,"fa-tablet-alt": true,"fa-tablets": true,"fa-tachometer-alt": true,"fa-tag": true,"fa-tags": true,"fa-tape": true,"fa-tasks": true,"fa-taxi": true,"fa-teeth": true,"fa-teeth-open": true,"fa-temperature-high": true,"fa-temperature-low": true,"fa-tenge": true,"fa-terminal": true,"fa-text-height": true,"fa-text-width": true,"fa-th": true,"fa-th-large": true,"fa-th-list": true,"fa-theater-masks": true,"fa-thermometer": true,"fa-thermometer-empty": true,"fa-thermometer-full": true,"fa-thermometer-half": true,"fa-thermometer-quarter": true,"fa-thermometer-three-quarters": true,"fa-thumbs-down": true,"fa-thumbs-up": true,"fa-thumbtack": true,"fa-ticket-alt": true,"fa-times": true,"fa-times-circle": true,"fa-tint": true,"fa-tint-slash": true,"fa-tired": true,"fa-toggle-off": true,"fa-toggle-on": true,"fa-toilet": true,"fa-toilet-paper": true,"fa-toolbox": true,"fa-tools": true,"fa-tooth": true,"fa-torah": true,"fa-torii-gate": true,"fa-tractor": true,"fa-trademark": true,"fa-traffic-light": true,"fa-trailer": true,"fa-train": true,"fa-tram": true,"fa-transgender": true,"fa-transgender-alt": true,"fa-trash": true,"fa-trash-alt": true,"fa-trash-restore": true,"fa-trash-restore-alt": true,"fa-tree": true,"fa-trophy": true,"fa-truck": true,"fa-truck-loading": true,"fa-truck-monster": true,"fa-truck-moving": true,"fa-truck-pickup": true,"fa-tshirt": true,"fa-tty": true,"fa-tv": true,"fa-umbrella": true,"fa-umbrella-beach": true,"fa-underline": true,"fa-undo": true,"fa-undo-alt": true,"fa-unity": true,"fa-universal-access": true,"fa-university": true,"fa-unlink": true,"fa-unlock": true,"fa-unlock-alt": true,"fa-upload": true,"fa-utensil-spoon": true,"fa-utensils": true,"fa-vector-square": true,"fa-venus": true,"fa-venus-double": true,"fa-venus-mars": true,"fa-vial": true,"fa-vials": true,"fa-video": true,"fa-video-slash": true,"fa-vihara": true,"fa-voicemail": true,"fa-volleyball-ball": true,"fa-volume-down": true,"fa-volume-mute": true,"fa-volume-off": true,"fa-volume-up": true,"fa-vote-yea": true,"fa-vr-cardboard": true,"fa-walking": true,"fa-wallet": true,"fa-warehouse": true,"fa-water": true,"fa-wave-square": true,"fa-weight": true,"fa-weight-hanging": true,"fa-wheelchair": true,"fa-wifi": true,"fa-wind": true,"fa-window-close": true,"fa-window-maximize": true,"fa-window-minimize": true,"fa-window-restore": true,"fa-wine-bottle": true,"fa-wine-glass": true,"fa-wine-glass-alt": true,"fa-won-sign": true,"fa-wrench": true,"fa-x-ray": true,"fa-yen-sign": true,"fa-yin-yang": true,
							}
						}
					},
				}
			},

			navCntWidget: {
				menuBtns: {
					"foundation-cmps": {
						subMenu: {	
							"add-dropdown": {
								hidden: true,
							},
							"add-megamenu": {
								hidden: true,
							},
						}
					},
				},
			},
		},

		MAX_SLIDES: 4,

		vdOnInitialiseFramework: function(e, params) {
			var self = this;
			self._super(e, params);

			setTimeout(function() {
        var showUpgradeModal = $.vdg.vdGetQryParam('upgrade_modal_ms'/*, window.location.href*/);
        if (showUpgradeModal)
          self.mnthFreeTrialDialog();
      }, $.VD_DEFER);
		},

		vdOnPreCreateMenu: function(e, params) {
			if (params.menu.options.menuName == 'vd-iconTxtWidget-menu') {
				delete params.menu.options.menuBtns.style.subMenu;
			}
		},

		vdOnInitLinkInputMenu: function(e, params) {
			if (params.menu.widgetFullName != 'vd-linkInput')
				return;
			
			var hoverIgnore = ["colour","background-colour"];
			var btnOpts = {
				classes: 'vd-pro',
				input: false,
				subMenu: false,
				callback: function() {
					this.getFramework().vdPolymorphic('goProDialog', '', this);
				}
			};

			for (var hBtnName in $.vd.linkInput.prototype.options.menuBtns.hoverStyle.subMenu) {
				if (hoverIgnore.indexOf(hBtnName) > -1)
					continue;
				$.extend( true, $.vd.linkInput.prototype.options.menuBtns.hoverStyle.subMenu[hBtnName], btnOpts);
			}
			for (var aBtnName in $.vd.linkInput.prototype.options.menuBtns.activeStyle.subMenu) {
				$.extend( true, $.vd.linkInput.prototype.options.menuBtns.activeStyle.subMenu[aBtnName], btnOpts);
			}
			for (var vBtnName in $.vd.linkInput.prototype.options.menuBtns.visitedStyle.subMenu) {
				$.extend( true, $.vd.linkInput.prototype.options.menuBtns.visitedStyle.subMenu[vBtnName], btnOpts);
			}

			$.vd.linkInput.prototype.options.menuBtns.activeStyle.classes = 'vd-pro';
			$.vd.linkInput.prototype.options.menuBtns.visitedStyle.classes = 'vd-pro';
		},

		removeOrDisable: function(widget, createdOnPageLoad, msg) {
			var self = this;
			this.goProDialog(msg, widget);

			if (!createdOnPageLoad) {
				var parent = widget.parent();
				// widget.trash();

				setTimeout(function() {
					widget.trash();
					parent.vdPolymorphic('select');
				}, $.VD_DEFER);
			}
			else {
				widget.destroy();
			}
		},

		vdOnCreateMapWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Slider Pro to use Map Widgets.');
		},

		vdOnCreateHtmlWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Slider Pro to use HTML Widgets.');
		},

		vdOnCreateAudioWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Slider Pro to use Audio Widgets.');
		},

		// vdOnCreateSliderWidget: function(e, params) { 
		// 	this._super(e, params);
		// 	console.log('slider', params.widget.options.createdOnPageLoad);
		// 	this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Slider Pro to use Slider Widgets.');
		// },

		vdOnCreateVideoWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Slider Pro to use Video Widgets.');
		},

		vdOnCreateHrWidget: function(e, params) { 
			this._super(e, params);
			this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'This is a Pro feature. Upgrade to My Slider Pro to use Divider Widgets.');
		},

		vdOnCreateDropdownWidget: function(e, params) { 
			this._super(e, params);

			if ($('[vd-type="dropdown"]', params.widget.getDesigner()).length > 2)
				this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'Limit of 2 Dropdown Widgets. With My Slider Pro you can create unlimited Dropdown Widgets.');
		},

		vdOnCreateMegaMenuWidget: function(e, params) { 
			this._super(e, params);

			if ($('[vd-type="megamenu"]', params.widget.getDesigner()).length > 2)
				this.removeOrDisable(params.widget, params.widget.options.createdOnPageLoad, 'Limit of 2 Mega Menu Widgets. With My Slider Pro you can create unlimited Mega Menu Widgets.');
		},

		// validateWidgetCreation: function(widget) {
		// 	var self = this;
		// 	var validationTypes = ['row', 'section', 'nav'];
		// 	if (widget.options.defer || widget.options.createdOnPageLoad || !validationTypes.includes(widget.vdType))
		// 		return true;

		// 	setTimeout(function() {
		// 		var designer = gManager.visualDesignerManager('getSelectedVisualDesigner'); // widget.getDesigner();
		// 		var nSections = designer.find('[vd-type="section"]').length;
		// 		var nRows = designer.find('[vd-type="row"]').length;
		// 		var nNavs = designer.find('[vd-type="nav"]').length;
		// 		var isValid = false;
		// 		var msg = '';

		// 		if (widget.vdType == 'section' && nSections > self.MAX_SECTIONS || widget.vdType == 'section' && nRows > self.MAX_ROWS) {
		// 			msg = 'Limit of 2 Section Widgets. With My Slider Pro you can create unlimited Section Widgets.';
		// 		}
		// 		else if (widget.vdType == 'row' && nRows > self.MAX_ROWS) {
		// 			msg = 'Limit of 2 Row Widgets. With My Slider Pro you can create unlimited Row Widgets.';
		// 		}
		// 		else if (widget.vdType == 'nav' && nNavs > self.MAX_NAVS) {
		// 			msg = 'Limit of 1 Nav Widget. With My Slider Pro you can create unlimited Nav Widgets.';
		// 		}
		// 		else isValid = true;

		// 		if (!isValid) {
		// 			self.removeOrDisable(widget, widget.options.createdOnPageLoad, msg);
		// 		}

		// 		console.log('isValid', isValid);
		// 		return isValid;
		// 	}, $.VD_DEFER);
		// },

		goProDialog: function(msg, widget) {
			var self = this;
			var htmlMsg = (msg) ? '<div class="vd-text-widget " id="mhfp-1-20"><p id="mhfp-1-21" vd-font-units="px"><span>' + msg+ '</span></p></div>' : '';
			var html = '<div style="text-align: center;"><style type="text/css">#mhfp-1-44{text-align:left; padding: 0;}#mhfp-1-42{text-align:left; padding: 0;}#mhfp-1-40{text-align:left; padding: 0;}#mhfp-1-25{text-align:left; padding: 0;}#mhfp-1-24{font-size:18px;margin:15px 0px 0px}#mhfp-1-35{padding:0px; padding-bottom: 10px;}#mhfp-1-23{text-align:left}#mhfp-1-21{font-size:18px}#mhfp-1-20{text-align:left}#mhfp-1-19{display: inline-block; background-color:rgb(233, 1, 70);color:rgb(255, 255, 255);padding:20px;font-size:23px;margin:20px 0px;}#mhfp-1-13{font-size:30px;margin:15px 0px}</style><div class="vd-text-widget " id="mhfp-1-12"><p id="mhfp-1-13"><span><b>Pro Feature</b><br></span></p></div>' + htmlMsg  + '<div class="vd-btn-widget vd-text-widget " id="mhfp-1-14" vd-style-identifier="#mhfp-1-14"><a href="https://www.visualdesigner.io/my-slider#pricing" vd-link="true" id="mhfp-1-19" vd-style-identifier="#mhfp-1-19" vd-font-units="px" target="_blank"><span><b>Go PRO</b><br></span></a></div><div class="vd-text-widget " id="mhfp-1-20"><p id="mhfp-1-21" vd-font-units="px"><span>Get the Pro version of My Slider and get <b>24+ more features and benefits.</b></span></p></div><div class="vd-text-widget " id="mhfp-1-23"><p id="mhfp-1-24" vd-font-units="px"><span><b>Some of the features and benefits:<br></b></span></p></div><div class="vd-row-widget" id="mhfp-1-35"><div class="vd-7 vd-column-widget" id="mhfp-1-36"><div class="vd-text-widget" id="mhfp-1-25"><p id="mhfp-1-26" style="margin-bottom: 2px;font-size: 15px;"><span>- Use a different slider design on a specific page<br></span></p></div></div><div class="vd-7 vd-column-widget" id="mhfp-1-39"><div class="vd-text-widget" id="mhfp-1-42"><p id="mhfp-1-43" style="margin-bottom: 2px;font-size: 15px;"><span>- Get new widgets such as; Maps, Sliders, HTML widgets and much more!<br></span></p></div></div><div class="vd-7 vd-column-widget" id="mhfp-1-39"><div class="vd-text-widget " id="mhfp-1-40"><p id="mhfp-1-41" style="margin-bottom: 2px;font-size: 15px;"><span>- Use dynamic data such as; post titles, author name and much more!<br></span></p></div></div><div class="vd-7 vd-column-widget" id="mhfp-1-39"><div class="vd-text-widget " id="mhfp-1-44"><p id="mhfp-1-45" style="margin-bottom: 2px;font-size: 15px;"><span>- More styling options such as; custom CSS, dimension settings and much more!<br></span></p></div></div></div></div>';
			$.vdg.widgetFactory('modalWidget', {
          title: '',
          content: html
      }, self.element);
		},

		mnthFreeTrialDialog: function(msg, widget) {
			var self = this;
			var html = '<div style="text-align: center;"><style type="text/css"> #mhfp-1-12 {padding-top: 25px;}       #mhfp-1-44 {            text-align: left;        }        #mhfp-1-42 {            text-align: left;        }        #mhfp-1-40 {            text-align: left;        }        #mhfp-1-25 {            text-align: left;        }        #mhfp-1-24 {            font-size: 21px;            margin: 15px 0px 0px;        }        #mhfp-1-35 {            padding: 0px;        }        #mhfp-1-23 {            text-align: left;        }        #mhfp-1-21 {            font-size: 18px;            text-align: center;        }        #mhfp-1-20 {            text-align: left;        }        #mhfp-1-19 {            background-color: rgb(233, 1, 70);            color: rgb(255, 255, 255);            padding: 20px;            font-size: 23px;            margin: 20px 0px;            margin-top: 35px;        }        #mhfp-1-13 {            font-size: 30px; }    </style><div class="vd-text-widget " id="mhfp-1-12"><p id="mhfp-1-13" style="margin-bottom: 10px;"><span><b>1 Month Free</b></span></p></div><div class="vd-text-widget " id="mhfp-1-20"><p style="margin-bottom: 10px;" id="mhfp-1-21" vd-font-units="px"><span>Try My Slider Pro with 1 month free on us. Build your Sliders exactly how you want. </span></p></div><small>Just use the promo code <strong>WP2020</strong> at checkout.</small><div class="vd-btn-widget vd-text-widget " id="mhfp-1-14" vd-style-identifier="#mhfp-1-14"><a style="display: block; margin-top: 10px; text-decoration: none;" href="https://www.visualdesigner.io/my-slider#pricing" vd-link="true" id="mhfp-1-19" vd-style-identifier="#mhfp-1-19" vd-font-units="px" target="_blank"><span><b>1 MONTH FREE</b><br /></span></a></div></div>';
			$.vdg.widgetFactory('modalWidget', {
          title: '',
          content: html
      }, self.element);
		},
	});

})(jQuery);
;/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */

//;(function ( $, window, document, undefined ) {
 (function ($) {

	$.widget( "vd.wpnewsletterBuilderFramework", $.vd.wordpressFramework, {

		options: {
			menuYOffset: '10px',

			visualDesignerManager: {
				hiddenMenuBtns: {
					'seo-validate': true
				}
			},

			baseWidget: {
				hiddenMenuBtns: {
					'seo': true
				}
			},

			// widgetTypes: {
				
			// },

			columnWidget: {
				hiddenMenuBtns: {
					"hero-images": true,
					"sections": true,
					"carousels": true,
					"tabs": true,
					"accordions": true,
					"headline": true,
					"masonry-layout": true,
					'scroll-to-btn': true
				},
			},

			// textWidget: {
			// 	menuBtns: {
					
			// 	}
			// },
			// imgWidget: {
			// 	menuBtns: {
					
			// 	}
			// },
			// // btnWidget: {

			// // },
			// videoWidget: {
			// 	menuBtns: {
					
			// 	}
			// },

			vdOnManagerExport: function(e, params) {
				
				params.killSpinner = false;

		        setTimeout(function() {
		        	alert("Mock Update Success :D");
					params.menu.trigger('endSpinBtn', params.btn);
					//$.vdg.manager().isProcessing = false;
					params.instance.isProcessing = false;
		        }, 900);
			},

			// vdOnCreateMenu: function(e, params) {

				
			// },

			// vdOnInitialiseFramework: function(e, params) {

				
			// },

			// vdOnShowMenu: function(e, params) {
				
			// }
		},
	});

//})( jQuery, window, document );
})(jQuery);