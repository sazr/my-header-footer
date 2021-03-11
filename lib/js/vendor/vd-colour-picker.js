/**!
 * iris-alpha
 */
( function( $ ) {
	// Variable for some backgrounds ( grid )
	var image   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAAHnlligAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHJJREFUeNpi+P///4EDBxiAGMgCCCAGFB5AADGCRBgYDh48CCRZIJS9vT2QBAggFBkmBiSAogxFBiCAoHogAKIKAlBUYTELAiAmEtABEECk20G6BOmuIl0CIMBQ/IEMkO0myiSSraaaBhZcbkUOs0HuBwDplz5uFJ3Z4gAAAABJRU5ErkJggg==';

	/**
	 * Overwrite iris
	 */
	$.widget( 'vd.colourPicker', $.a8c.iris, {
		_create: function() {
			var self = this;
			self._super();

			// Global option for check is mode rbga is enabled
			self.options.alpha = self.element.data( 'alpha' ) || false;

			if ( typeof this.options.alpha !== 'undefined' && this.options.alpha ) {
					var el         = self.element,
					_html      = '<div class="iris-strip iris-slider iris-alpha-slider"><div class="iris-slider-offset iris-slider-offset-alpha"></div></div>',
					aContainer = $( _html ).appendTo( self.picker.find( '.iris-picker-inner' ) ),
					aSlider    = aContainer.find( '.iris-slider-offset-alpha' ),
					controls   = {
						aContainer : aContainer,
						aSlider    : aSlider
					};

				// Push new controls
				$.each( controls, function( k, v ) {
					self.controls[k] = v;
				} );

				var inputContainer = $('<div class="vd-col-container"><input class="vd-col-input" placeholder="#ffffff"></input></div>');
				self.picker.find( '.iris-picker-inner' ).append(inputContainer);

				// Add new slider
				self._initControls();

				// For updated widget
				self._change();
			}
		},
		_initControls: function() {
			var self = this;
			self._super();

			if ( self.options.alpha ) {
				var controls = self.controls;

				controls.aSlider.slider({
					orientation : 'vertical',
					min         : 0,
					max         : 100,
					step        : 1,
					value       : parseInt( self._color._alpha * 100 ),
					slide       : function( event, ui ) {
						// Update alpha value
						self._color._alpha = parseFloat( ui.value / 100 );
						self._change.apply( self, arguments );
					}
				});
			}

			$('.vd-col-input', self.picker.find('.iris-picker-inner')).on('change', function(ev) {
				self._change( {type: 'input', value: $(ev.target).val()} );
			});
		},
		_change: function(ev) {
			this._super();

			var self = this,
				el   = self.element;

			if (ev && ev.type == 'input') {
				self._setOption( 'color', ev.value );
			}
			else if ( this.options.alpha ) {
				var	controls     = self.controls,
					alpha        = parseInt( self._color._alpha * 100 ),
					color        = self._color.toRgb(),
					gradient     = [
						'rgb(' + color.r + ',' + color.g + ',' + color.b + ') 0%',
						'rgba(' + color.r + ',' + color.g + ',' + color.b + ', 0) 100%'
					],
					defaultWidth = self.options.defaultWidth,
					customWidth  = self.options.customWidth,
					target       = self.picker.closest( '.wp-picker-container' ).find( '.wp-color-result' );

				// Generate background slider alpha, only for CSS3 old browser fuck!! :)
				controls.aContainer.css( { 'background' : 'linear-gradient(to bottom, ' + gradient.join( ', ' ) + '), url(' + image + ')' } );

				if ( target.hasClass( 'wp-picker-open' ) ) {
					// Update alpha value
					controls.aSlider.slider( 'value', alpha );

					/**
					 * Disabled change opacity in default slider Saturation ( only is alpha enabled )
					 * and change input width for view all value
					 */
					if ( self._color._alpha < 1 ) {
						controls.strip.attr( 'style', controls.strip.attr( 'style' ).replace( /rgba\(([0-9]+,)(\s+)?([0-9]+,)(\s+)?([0-9]+)(,(\s+)?[0-9\.]+)\)/g, 'rgb($1$3$5)' ) );
						el.width( parseInt( defaultWidth + customWidth ) );
					} else {
						el.width( defaultWidth );
					}
				}
			}

			var reset = el.data( 'reset-alpha' ) || false;

			if ( reset ) {
				self.picker.find( '.iris-palette-container' ).on( 'click.palette', '.iris-palette', function() {
					self._color._alpha = 1;
					self.active        = 'external';
					self._change();
				} );
			}

			$('.vd-col-input', this.picker.find('.iris-picker-inner')).val(this.options.color);
		},
		_addInputListeners: function( input ) {
			var self            = this,
				debounceTimeout = 100,
				callback        = function( event ) {
					var color = new Color( input.val() ),
						val   = input.val();

					input.removeClass( 'iris-error' );
					// we gave a bad color
					if ( color.error ) {
						// don't error on an empty input
						if ( val !== '' )
							input.addClass( 'iris-error' );
					} else {
						if ( color.toString() !== self._color.toString() ) {
							// let's not do this on keyup for hex shortcodes
							if ( ! ( event.type === 'keyup' && val.match( /^[0-9a-fA-F]{3}$/ ) ) )
								self._setOption( 'color', color.toString() );
						}
					}
				};

			input.on( 'change', callback ).on( 'keyup', self._debounce( callback, debounceTimeout ) );

			// If we initialized hidden, show on first focus. The rest is up to you.
			if ( self.options.hide ) {
				input.on( 'focus', function() {
					self.show();
				} );
			}
		},

		// _setOption: function ( key, value ) {
		// 	this._super( "_setOption", key, value );
		// }
	} );
}( jQuery ) );