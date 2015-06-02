/*
 * Overbox - jQuery Plugin
 * The smart and flexible Lightbox Plugin.
 *
 * @author		Cornel Boppart <cornel@bopp-art.com>
 * @copyright	Author
 *
 * @version		2.1.0 (25/04/2015)
 */

;(function ($) {
	window.overbox = {
		cache : {},

		support : {},

		labels : {
			'errorMessage' : 'Source could not be found...',
			'sequenceInfo.of' : ' of ',
			'close' : 'Close',
			'navigator.prev' : 'Prev',
			'navigator.next' : 'Next',
			'navigator.play' : 'Play',
			'navigator.pause' : 'Pause'
		},

		/**
		 * Initializes the plugin
		 *
		 * @param	{object}	options
		 * @return	{object}
		 */
		init : function (options) {
			return this.each(function () {
				$(this).unbind('click').click(function (event) {
					event.preventDefault();
					$(this).overbox('start', options);
				});
			});
		},

		/**
		 * Starts the plugin
		 *
		 * @param	{object}	options
		 * @return	{void}
		 */
		start : function (options) {
			overbox.settings = $.extend(true, {
				idPrefix : 'overbox-',
				classPrefix : 'overbox-',
				transition : 'elastic',
				transitionIn : null,
				transitionOut : null,
				cssTransitions : true,
				speedIn : 250,
				speedOut : 250,
				maxWidth : 800,
				maxHeight : 500,
				forceWidth : false,
				forceHeight : false,
				liveResize : true,
				fullScreenModeForMobile : true,
				mobileMatchExpression : /(iphone|ipod|ipad|android|blackberry|symbian)/,
				disableShrink : false,
				shrinkFactor : .75,
				overlayOpacity : .9,
				slideshow : false,
				timeout : 5000,
				swipe : true,
				useKeys : true,
				navigateEndless : true,
				closeOnOverlayClick : true,
				title : null,
				caption : null,
				showTitle : true,
				showCaption : true,
				showSequenceInfo : true,
				inline : {
					width : 'auto',
					height : 'auto'
				},
				ajax : {
					width : 'auto',
					height : 'auto',
					type : 'get',
					dataType : 'html',
					data : {}
				},
				iframe : {
					width : 800,
					height : 500,
					frameborder : 0
				},
				flash : {
					width : 400,
					height : 205,
					wmode : 'transparent'
				},
				video : {
					width : 400,
					height : 225,
					poster : '',
					preload : 'auto',
					controls : true,
					autobuffer : true,
					autoplay : true,
					loop : false
				},
				attr: 'data-rel',
				href : null,
				type : null,
				typeMapping : {
					'image' : 'jpg,jpeg,gif,png,bmp',
					'flash' : 'swf',
					'video' : 'mp4,mov,ogv,ogg,webm',
					'iframe' : 'html,php',
					'ajax' : 'json,txt',
					'inline' : '#'
				},
				errorMessage : function () {
					return '<p class="' + overbox.settings.classPrefix + 'error">' + overbox.labels['errorMessage'] + '</p>';
				},
				markup : function () {
					$('body').append(
						$overlay = $('<div id="' + overbox.settings.idPrefix + 'overlay"></div>'),
						$loading = $('<div id="' + overbox.settings.idPrefix + 'loading" class="' + overbox.settings.classPrefix + 'icon-spin"></div>'),
						$case = $('<div id="' + overbox.settings.idPrefix + 'case" aria-hidden="true" role="dialog"></div>')
					);
					$case.after(
						$nav = $('<div id="' + overbox.settings.idPrefix + 'nav"></div>')
					);
					$nav.append(
						$close = $('<a href="#" class="' + overbox.settings.classPrefix + 'icon-close"><span>' + overbox.labels['close'] + '</span></a>'),
						$prev = $('<a href="#" class="' + overbox.settings.classPrefix + 'icon-prev"><span>' + overbox.labels['navigator.prev'] + '</span></a>').hide(),
						$next = $('<a href="#" class="' + overbox.settings.classPrefix + 'icon-next"><span>' + overbox.labels['navigator.next'] + '</span></a>').hide(),
						$play = $('<a href="#" class="' + overbox.settings.classPrefix + 'icon-play"><span>' + overbox.labels['navigator.play'] + '</span></a>').hide(),
						$pause = $('<a href="#" class="' + overbox.settings.classPrefix + 'icon-pause"><span>' + overbox.labels['navigator.pause'] + '</span></a>').hide()
					);
					$case.append(
						$content = $('<div class="' + overbox.settings.classPrefix + 'content"></div>'),
						$info = $('<div class="' + overbox.settings.classPrefix + 'info"></div>')
					);
					$content.append(
						$contentInner = $('<div class="' + overbox.settings.classPrefix + 'contentInner"></div>')
					);
					$info.append(
						$sequenceInfo = $('<div class="' + overbox.settings.classPrefix + 'sequenceInfo"></div>'),
						$title = $('<h4 class="' + overbox.settings.classPrefix + 'title"></h4>'),
						$caption = $('<p class="' + overbox.settings.classPrefix + 'caption"></p>')
					);
				},
				onInit : {},
				onStart : {},
				onFinish : {},
				onClose : {},
				onCleanup : {}
			}, options);

			// Call onInit hook functions
			overbox.callHooks(overbox.settings.onInit);

			overbox.objectData = overbox.getObjectData(this);

			overbox.cacheScrollPosition();
			overbox.watchScrollInteraction();

			overbox.addElements();
			overbox.overboxOpen();

			overbox.dimensions = overbox.getDimensions();
		},

		/**
		 * Gets the object data
		 *
		 * @param	{object}	$object
		 * @return	{object}	objectData
		 */
		getObjectData : function ($object) {
		 	var objectData = {
				$link : $object,
				title : overbox.settings.title || $object.attr('title'),
				caption : overbox.settings.caption || $object.children('img').attr('alt'),
				url : overbox.verifyDataUrl(overbox.settings.href || $object.attr('data-href') || $object.attr('href')),
				requestType : overbox.settings.ajax.type,
				requestData : overbox.settings.ajax.data,
				requestDataType : overbox.settings.ajax.dataType,
				rel : $object.attr(overbox.settings.attr),
				type : overbox.settings.type || overbox.verifyDataType($object.attr('data-href') || $object.attr('href')),
				isPartOfSequence : overbox.isPartOfSequence($object.attr(overbox.settings.attr), ':'),
				isPartOfSequenceWithSlideshow : overbox.isPartOfSequence($object.attr(overbox.settings.attr), ':slideshow'),
				currentIndex : $('[' + overbox.settings.attr + '="' + $object.attr(overbox.settings.attr) + '"]').index($object),
				sequenceLength : $('[' + overbox.settings.attr + '="' + $object.attr(overbox.settings.attr) + '"]').length
			};

			// Add sequence info to objectData
			objectData.sequenceInfo = (objectData.currentIndex + 1) + overbox.labels['sequenceInfo.of'] + objectData.sequenceLength;

			return objectData;
		},

		/**
		 * Verifies if the link is part of a sequence
		 *
		 * @param	{string}	rel
		 * @param	{string}	expression
		 * @return	{boolean}
		 */
		isPartOfSequence : function (rel, expression) {
			var getSimilarLinks = $('[' + overbox.settings.attr + '="' + rel + '"]'),
				regexp = new RegExp(expression);

			if (regexp.test(rel) && getSimilarLinks.length > 1) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * Verifies if the slideshow should be enabled
		 *
		 * @return	{boolean}
		 */
		isSlideshowEnabled : function () {
			if (overbox.objectData.isPartOfSequence && (overbox.settings.slideshow === true || overbox.objectData.isPartOfSequenceWithSlideshow === true)) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * Loads the new content to show
		 *
		 * @return	{void}
		 */
		loadContent : function () {
			if (overbox.cache.originalObject) {
				overbox.restoreObject();
			}
			
			overbox.createObject();
		},

		/**
		 * Creates a new object
		 *
		 * @return	{void}
		 */
		createObject : function () {
			var $object;

			// Create object
			switch (overbox.objectData.type) {
				case 'image' :
					$object = $(new Image());
					$object.attr({
						// The time expression is required to prevent the binding of an image load
						'src' : overbox.objectData.url,
						'alt' : overbox.objectData.title
					});
					break;
				case 'inline' :
					$object = $('<div class="' + overbox.settings.classPrefix + 'inlineWrap"></div>');
					$object.html(overbox.cloneObject($(overbox.objectData.url)));

					// Add custom attributes from overbox.settings
					$.each(overbox.settings.inline, function (name, value) {
						$object.attr('data-' + name, value);
					});
					break;
				case 'ajax' :
					$object = $('<div class="' + overbox.settings.classPrefix + 'inlineWrap"></div>');

					// Add custom attributes from overbox.settings
					$.each(overbox.settings.ajax, function (name, value) {
						if (name !== 'data') {
							$object.attr('data-' + name, value);
						}
					});
					break;
				case 'flash' :
					$object = $('<embed src="' + overbox.objectData.url + '" type="application/x-shockwave-flash"></embed>');

					// Add custom attributes from overbox.settings
					$.each(overbox.settings.flash, function (name, value) {
						$object.attr(name, value);
					});
					break;
				case 'video' :
					$object = $('<video></video>');
					$object.attr('src', overbox.objectData.url);

					// Add custom attributes from overbox.settings
					$.each(overbox.settings.video, function (name, value) {
						$object.attr(name, value);
					});
					break;
				default :
					$object = $('<iframe></iframe>');
					$object.attr({
						'src' : overbox.objectData.url
					});

					// Add custom attributes from overbox.settings
					$.each(overbox.settings.iframe, function (name, value) {
						$object.attr(name, value);
					});
			}

			overbox.addObject($object);
			overbox.loadObject($object);
		},

		/**
		 * Adds the new object to the markup
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		addObject : function ($object) {
			// Add object to content holder
			$contentInner.html($object);

			// Start loading
			overbox.loading('start');

			// Call onStart hook functions
			overbox.callHooks(overbox.settings.onStart);
			
			// Call hook function on initialization

			// Add sequenceInfo to the content holder or hide if its empty
			if (overbox.settings.showSequenceInfo === true && overbox.objectData.isPartOfSequence) {
				$sequenceInfo.html(overbox.objectData.sequenceInfo);
				$sequenceInfo.show();
			} else {
				$sequenceInfo.empty();
				$sequenceInfo.hide();
			}
			// Add title to the content holder or hide if its empty
			if (overbox.settings.showTitle === true && overbox.objectData.title !== undefined && overbox.objectData.title !== '') {
				$title.html(overbox.objectData.title);
				$title.show();
			} else {
				$title.empty();
				$title.hide();
			}
			// Add caption to the content holder or hide if its empty
			if (overbox.settings.showCaption === true && overbox.objectData.caption !== undefined && overbox.objectData.caption !== '') {
				$caption.html(overbox.objectData.caption);
				$caption.show();
			} else {
				$caption.empty();
				$caption.hide();
			}
		},

		/**
		 * Loads the new object
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		loadObject : function ($object) {
			// Load the object
			switch (overbox.objectData.type) {
				case 'inline' :
					if ($(overbox.objectData.url)) {
						overbox.showContent($object);
					} else {
						overbox.error();
					}
					break;
				case 'ajax' :
					$.ajax(
						$.extend({}, overbox.settings.ajax, {
							url : overbox.objectData.url,
							type : overbox.objectData.requestType,
							dataType : overbox.objectData.requestDataType,
							data : overbox.objectData.requestData,
							success : function (data, textStatus, jqXHR) {
								// Unserialize if data is transferred as json
								if (overbox.objectData.requestDataType === 'json') {
									overbox.objectData.data = data;
								} else {
									$object.html(data);
								}
								overbox.showContent($object);
							},
							error : function (jqXHR, textStatus, errorThrown) {
								overbox.error();
							}
						})
					);
					break;
				case 'flash' :
					overbox.showContent($object);
					break;
				case 'video' :
					if (typeof($object.get(0).canPlayType) === 'function' || $case.find('video').length === 0) {
						overbox.showContent($object);
					} else {
						overbox.error();
					}
					break;
				default :
					if (overbox.objectData.url) {
						$object.load(function () {
							overbox.showContent($object);
						});
						$object.error(function () {
							overbox.error();
						});
					} else {
						overbox.error();
					}
			}
		},

		/**
		 * Throws an error message if something went wrong
		 *
		 * @return	{void}
		 */
		error : function () {
			overbox.objectData.type = 'error';
			var $object = $('<div class="' + overbox.settings.classPrefix + 'inlineWrap"></div>');

			$object.html(overbox.settings.errorMessage);
			$contentInner.html($object);

			overbox.showContent($contentInner);
		},

		/**
		 * Calculates the dimensions to fit content
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		calculateDimensions : function ($object) {
			overbox.cleanupDimensions();
			
			// Set default dimensions
			var dimensions = {
				objectWidth : $object.attr('width') ? $object.attr('width') : $object.attr('data-width'), 
				objectHeight : $object.attr('height') ? $object.attr('height') : $object.attr('data-height'),
				maxWidth : parseInt(overbox.dimensions.windowWidth * overbox.settings.shrinkFactor),
				maxHeight : parseInt(overbox.dimensions.windowHeight * overbox.settings.shrinkFactor)
			};
			
			if (!overbox.settings.disableShrink) {
				// If the auto calculated maxWidth/maxHeight greather than the userdefined one, use that.
				if (dimensions.maxWidth > overbox.settings.maxWidth) {
					dimensions.maxWidth = overbox.settings.maxWidth;
				}
				if (dimensions.maxHeight > overbox.settings.maxHeight) {
					dimensions.maxHeight = overbox.settings.maxHeight;
				}

				// Calculate the difference between screen width/height and image width/height
				dimensions.differenceWidthAsPercent = parseInt(100 / dimensions.maxWidth * dimensions.objectWidth);
				dimensions.differenceHeightAsPercent = parseInt(100 / dimensions.maxHeight * dimensions.objectHeight);
				
				switch (overbox.objectData.type) {
					case 'image' :
					case 'flash' :
					case 'video' :
						if (dimensions.differenceWidthAsPercent > 100 && dimensions.differenceWidthAsPercent > dimensions.differenceHeightAsPercent) {
							dimensions.objectWidth = dimensions.maxWidth;
							dimensions.objectHeight = parseInt(dimensions.objectHeight / dimensions.differenceWidthAsPercent * 100);
						}
						if (dimensions.differenceHeightAsPercent > 100 && dimensions.differenceHeightAsPercent > dimensions.differenceWidthAsPercent) {
							dimensions.objectWidth = parseInt(dimensions.objectWidth / dimensions.differenceHeightAsPercent * 100);
							dimensions.objectHeight = dimensions.maxHeight;
						}
						if (dimensions.differenceHeightAsPercent > 100 && dimensions.differenceWidthAsPercent < dimensions.differenceHeightAsPercent) {
							dimensions.objectWidth = parseInt(dimensions.maxWidth / dimensions.differenceHeightAsPercent * dimensions.differenceWidthAsPercent);
							dimensions.objectHeight = dimensions.maxHeight;
						}

						break;
					case 'error' :
						if (!isNaN(dimensions.objectWidth) && dimensions.objectWidth > dimensions.maxWidth) {
							dimensions.objectWidth = dimensions.maxWidth;
						}

						break;
					default :
						if ((isNaN(dimensions.objectWidth) || dimensions.objectWidth > dimensions.maxWidth) && !overbox.settings.forceWidth) {
							dimensions.objectWidth = dimensions.maxWidth;
						}
						if (((isNaN(dimensions.objectHeight) && dimensions.objectHeight !== 'auto') || dimensions.objectHeight > dimensions.maxHeight) && !overbox.settings.forceHeight) {
							dimensions.objectHeight = dimensions.maxHeight;
						}
				}
			}

			overbox.adjustDimensions($object, dimensions);
		},

		/**
		 * Adjusts the dimensions
		 *
		 * @param	{object}	$object
		 * @param	{object}	dimensions
		 * @return	{void}
		 */
		adjustDimensions : function ($object, dimensions) {
			// Adjust width and height
			$object.css({
				'width' : dimensions.objectWidth,
				'height' : dimensions.objectHeight,
				'max-width' : $object.attr('data-max-width') ? $object.attr('data-max-width') : dimensions.maxWidth,
				'max-height' : $object.attr('data-max-height') ? $object.attr('data-max-height') : dimensions.maxHeight
			});
			
			$contentInner.css({
				'width' : $object.outerWidth(),
				'height' : $object.outerHeight(),
				'max-width' : '100%'
			});

			$case.css({
				'width' : $contentInner.outerWidth()
			});

			// Adjust margin
			$case.css({
				'margin-top' : parseInt(-($case.outerHeight() / 2)),
				'margin-left' : parseInt(-($case.outerWidth() / 2))
			});
		},

		/**
		 * Handles the loading
		 *
		 * @param	{string}	process
		 * @return	{void}
		 */
		loading : function (process) {
			if (process === 'start') {
				$case.addClass(overbox.settings.classPrefix + 'loading');
				$loading.show();
			} else if (process === 'end') {
				$case.removeClass(overbox.settings.classPrefix + 'loading');
				$loading.hide();
			}
		},

		/**
		 * Gets the client screen dimensions
		 *
		 * @return	{object}	dimensions
		 */
		getDimensions : function () {
			return {
				windowWidth : $(window).innerWidth(),
				windowHeight : $(window).innerHeight()
			};
		},

		/**
		 * Verifies the url
		 *
		 * @param	{string}	dataUrl
		 * @return	{string}	dataUrl	Clean url for processing content
		 */
		verifyDataUrl : function (dataUrl) {
			if (!dataUrl || dataUrl === undefined || dataUrl === '') {
				return false;
			}

			if (dataUrl.indexOf('#') > -1) {
				dataUrl = dataUrl.split('#');
				dataUrl = '#' + dataUrl[dataUrl.length - 1];
			}

			return dataUrl.toString();
		},

		/**
		 * Verifies the data type of the content to load
		 *
		 * @param	{string}			url
		 * @return	{string|boolean}	Array key if expression matched, else false
		 */
		verifyDataType : function (url) {
			var url = overbox.verifyDataUrl(url),
				typeMapping = overbox.settings.typeMapping;

			if (url) {
				for (var key in typeMapping) {
					var suffixArr = typeMapping[key].split(',');

					for (var i = 0; i < suffixArr.length; i++) {
						var suffix = suffixArr[i]
							,regexp = new RegExp('\.(' + suffix + ')$', 'i')
							// Verify only the last 5 characters of the string
							,str = url.split('?')[0].substr(-5);

						if (regexp.test(str) === true) {
							return key;
						} else if (key === 'inline' && (url.indexOf(suffix) > -1 || !url)) {
							return key;
						}
					}
				}
			}

			// If no expression matched, return 'iframe'.
			return 'iframe';
		},

		/**
		 * Extends html markup with the essential tags
		 *
		 * @return	{void}
		 */
		addElements : function () {
			if (typeof($case) !== 'undefined' && $('#' + $case.attr('id')).length) {
				return;
			}

			overbox.settings.markup();
		},

		/**
		 * Shows the loaded content
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		showContent : function ($object) {
			// Add data attribute with the object type
			$case.attr('data-type', overbox.objectData.type);

			overbox.cache.object = $object;
			overbox.calculateDimensions($object);

			// Call onFinish hook functions
			overbox.callHooks(overbox.settings.onFinish);

			switch (overbox.settings.transitionIn) {
				case 'scrollTop' :
				case 'scrollRight' :
				case 'scrollBottom' :
				case 'scrollLeft' :
				case 'scrollHorizontal' :
				case 'scrollVertical' :
					overbox.transition.scroll($case, 'in', overbox.settings.speedIn);
					overbox.transition.fade($contentInner, 'in', overbox.settings.speedIn);
					break;
				case 'elastic' :
					if ($case.css('opacity') < 1) {
						overbox.transition.zoom($case, 'in', overbox.settings.speedIn);
						overbox.transition.fade($contentInner, 'in', overbox.settings.speedIn);
					}
				case 'fade' :
				case 'fadeInline' :
					overbox.transition.fade($case, 'in', overbox.settings.speedIn);
					overbox.transition.fade($contentInner, 'in', overbox.settings.speedIn);
					break;
				default :
					overbox.transition.fade($case, 'in', 0);
			}

			// End loading
			overbox.loading('end');
			overbox.busy = false;
		},

		/**
		 * Processes the content to show
		 *
		 * @return	{void}
		 */
		processContent : function () {
			overbox.busy = true;
			
			switch (overbox.settings.transitionOut) {
				case 'scrollTop' :
				case 'scrollRight' :
				case 'scrollBottom' :
				case 'scrollLeft' :
				case 'scrollVertical' :
				case 'scrollHorizontal' :
					if ($case.is(':hidden')) {
						overbox.transition.fade($case, 'out', 0, 0, function () {
							overbox.loadContent();
						});
						overbox.transition.fade($contentInner, 'out', 0);
					} else {
						overbox.transition.scroll($case, 'out', overbox.settings.speedOut, function () {
							overbox.loadContent();
						});
					}
					break;
				case 'fade' :
					if ($case.is(':hidden')) {
						overbox.transition.fade($case, 'out', 0, 0, function () {
							overbox.loadContent();
						});
					} else {
						overbox.transition.fade($case, 'out', overbox.settings.speedOut, 0, function () {
							overbox.loadContent();
						});
					}
					break;
				case 'fadeInline' :
				case 'elastic' :
					if ($case.is(':hidden')) {
						overbox.transition.fade($case, 'out', 0, 0, function () {
							overbox.loadContent();
						});
					} else {
						overbox.transition.fade($contentInner, 'out', overbox.settings.speedOut, 0, function () {
							overbox.loadContent();
						});
					}
					break;
				default :
					overbox.transition.fade($case, 'out', 0, 0, function () {
						overbox.loadContent();
					});
			}
		},

		/**
		 * Handles events for gallery buttons
		 *
		 * @return	{void}
		 */
		handleEvents : function () {
			overbox.unbindEvents();

			$nav.children().not($close).hide();

			// If slideshow is enabled, show play/pause and start timeout.
			if (overbox.isSlideshowEnabled()) {
				// Only start the timeout if slideshow is not pausing
				if (!$nav.hasClass(overbox.settings.classPrefix + 'paused')) {
					overbox.startTimeout();
				} else {
					overbox.stopTimeout();
				}
			}

			if (overbox.settings.liveResize) {
				overbox.watchResizeInteraction();
			}

			$close.click(function (event) {
				event.preventDefault();
				overbox.overboxClose();
			});

			if (overbox.settings.closeOnOverlayClick === true) {
				$overlay.css('cursor', 'pointer').click(function (event) {
					event.preventDefault();
					
					overbox.overboxClose();
				});
			}

			if (overbox.settings.useKeys === true) {
				overbox.addKeyEvents();
			}

			if (overbox.objectData.isPartOfSequence) {
				$nav.attr('data-ispartofsequence', true);
				overbox.nav = overbox.setNavigation();

				$prev.click(function (event) {
					event.preventDefault();

					$prev.unbind('click');
					overbox.cache.action = 'prev';
					overbox.nav.$prevItem.click();
					
					if (overbox.isSlideshowEnabled()) {
						overbox.stopTimeout();
					}
				});

				$next.click(function (event) {
					event.preventDefault();
					
					$next.unbind('click');
					overbox.cache.action = 'next';
					overbox.nav.$nextItem.click();
					
					if (overbox.isSlideshowEnabled()) {
						overbox.stopTimeout();
					}
				});

				if (overbox.isSlideshowEnabled()) {
					$play.click(function (event) {
						event.preventDefault();
						overbox.startTimeout();
					});
					$pause.click(function (event) {
						event.preventDefault();
						overbox.stopTimeout();
					});
				}
				
				// Enable swiping if activated
				if (overbox.settings.swipe === true) {
					if ($.isPlainObject($.event.special.swipeleft)) {
						$case.on('swipeleft', function (event) {
							event.preventDefault();
							$next.click();
							if (overbox.isSlideshowEnabled()) {
								overbox.stopTimeout();
							}
						});
					}
					if ($.isPlainObject($.event.special.swiperight)) {
						$case.on('swiperight', function (event) {
							event.preventDefault();
							$prev.click();
							if (overbox.isSlideshowEnabled()) {
								overbox.stopTimeout();
							}
						});
					}
				}
			}
		},

		/**
		 * Adds the key events
		 *
		 * @return	{void}
		 */
		addKeyEvents : function () {
			$(document).bind('keyup.overbox', function (event) {
				// Do nothing if overbox is in process
				if (overbox.busy) {
					return;
				}

				switch (event.keyCode) {
					// Escape key
					case 27 :
						$close.click();
						break;
					// Backward key
					case 37 :
						if (overbox.objectData.isPartOfSequence) {
							$prev.click();
						}
						break;
					// Forward key
					case 39 :
						if (overbox.objectData.isPartOfSequence) {
							$next.click();
						}
						break;
				}
			});
		},

		/**
		 * Starts the slideshow timeout
		 *
		 * @return	{void}
		 */
		startTimeout : function () {
			$play.hide();
			$pause.show();
			
			overbox.cache.action = 'next';
			$nav.removeClass(overbox.settings.classPrefix + 'paused');

			overbox.timeout = setTimeout(function () {
				overbox.nav.$nextItem.click();
			}, overbox.settings.timeout);
		},

		/**
		 * Stops the slideshow timeout
		 *
		 * @return	{void}
		 */
		stopTimeout : function () {
			$play.show();
			$pause.hide();

			$nav.addClass(overbox.settings.classPrefix + 'paused');

			clearTimeout(overbox.timeout);
		},

		/**
		 * Sets the navigator buttons (prev/next)
		 *
		 * @return	{object}	items
		 */
		setNavigation : function () {
			var $links = $('[' + overbox.settings.attr + '="' + overbox.objectData.rel + '"]'),
				currentIndex = overbox.objectData.currentIndex,
				prevIndex = currentIndex - 1,
				nextIndex = currentIndex + 1,
				sequenceLength = overbox.objectData.sequenceLength - 1,
				items = {
					$prevItem : $links.eq(prevIndex),
					$nextItem : $links.eq(nextIndex)
				};

			if (currentIndex > 0) {
				$prev.show();
			} else {
				items.$prevItem = $links.eq(sequenceLength);
			}
			if (nextIndex <= sequenceLength) {
				$next.show();
			} else {
				items.$nextItem = $links.eq(0);
			}

			if (overbox.settings.navigateEndless === true) {
				$prev.show();
				$next.show();
			}

			return items;
		},

		/**
		 * Clones the object for inline elements
		 *
		 * @param	{object}	$object
		 * @return	{object}	$clone
		 */
		cloneObject : function ($object) {
			var $clone = $object.clone(),
				objectId = $object.attr('id');

			// If element is hidden, cache the object and remove
			if ($object.is(':hidden')) {
				overbox.cacheObjectData($object);
				$object.attr('id', overbox.settings.idPrefix + 'temp-' + objectId).empty();
			} else {
				// Prevent duplicated id's
				$clone.removeAttr('id');
			}

			return $clone.show();
		},

		/**
		 * Verifies if it is a mobile device
		 *
		 * @return	{boolean}
		 */
		isMobileDevice : function () {
			var deviceAgent = navigator.userAgent.toLowerCase(),
				agentId = deviceAgent.match(overbox.settings.mobileMatchExpression);

			return agentId ? true : false;
		},

		/**
		 * Verifies if css transitions are supported
		 *
		 * @return	{string|boolean}	The transition prefix if supported, else false.
		 */
		isTransitionSupported : function () {
			var body = $('body').get(0),
				isTransitionSupported = false,
				transitionMapping = {
					'transition' : '',
					'WebkitTransition' : '-webkit-',
					'MozTransition' : '-moz-',
					'OTransition' : '-o-',
					'MsTransition' : '-ms-'
				};

			for (var key in transitionMapping) {
				if (transitionMapping.hasOwnProperty(key) && key in body.style) {
					overbox.support.transition = transitionMapping[key];
					isTransitionSupported = true;
				}
			}

			return isTransitionSupported;
		},

		/**
		 * Transition types
		 *
		 */
		transition : {
			/**
			 * Fades in/out the object
			 *
			 * @param	{object}	$object
			 * @param	{string}	type
			 * @param	{number}	speed
			 * @param	{number}	opacity
			 * @param	{function}	callback
			 * @return	{void}		Animates an object
			 */
			fade : function ($object, type, speed, opacity, callback) {
				var isInTransition = type === 'in',
					startTransition = {},
					startOpacity = $object.css('opacity'),
					endTransition = {},
					endOpacity = opacity ? opacity : isInTransition ? 1 : 0;
				
				if (!overbox.open && isInTransition) return;
					
				startTransition['opacity'] = startOpacity;
				endTransition['opacity'] = endOpacity;

				$object.css(startTransition).show();

				// Css transition
				if (overbox.support.transitions) {
					endTransition[overbox.support.transition + 'transition'] = speed + 'ms ease';

					setTimeout(function () {
						$object.css(endTransition);

						setTimeout(function () {
							$object.css(overbox.support.transition + 'transition', '');

							if (callback && (overbox.open || !isInTransition)) {
								callback();
							}
						}, speed);
					}, 15);
				} else {
					// Fallback to js transition
					$object.stop();
					$object.animate(endTransition, speed, callback);
				}
			},

			/**
			 * Scrolls in/out the object
			 *
			 * @param	{object}	$object
			 * @param	{string}	type
			 * @param	{number}	speed
			 * @param	{function}	callback
			 * @return	{void}		Animates an object
			 */
			scroll : function ($object, type, speed, callback) {
				var isInTransition = type === 'in',
					transition = isInTransition ? overbox.settings.transitionIn : overbox.settings.transitionOut,
					direction = 'left',
					startTransition = {},
					startOpacity = isInTransition ? 0 : 1,
					startOffset = isInTransition ? '-50%' : '50%',
					endTransition = {},
					endOpacity = isInTransition ? 1 : 0,
					endOffset = isInTransition ? '50%' : '-50%';
				
				if (!overbox.open && isInTransition) return;

				switch (transition) {
					case 'scrollTop' :
						direction = 'top';
						break;
					case 'scrollRight' :
						startOffset = isInTransition ? '150%' : '50%';
						endOffset = isInTransition ? '50%' : '150%';
						break;
					case 'scrollBottom' :
						direction = 'top';
						startOffset = isInTransition ? '150%' : '50%';
						endOffset = isInTransition ? '50%' : '150%';
						break;
					case 'scrollHorizontal' : 
						startOffset = isInTransition ? '150%' : '50%';
						endOffset = isInTransition ? '50%' : '-50%';
						break;
					case 'scrollVertical' :
						direction = 'top';
						startOffset = isInTransition ? '-50%' : '50%';
						endOffset = isInTransition ? '50%' : '150%';
						break;
				}

				if (overbox.cache.action === 'prev') {
					switch (transition) {
						case 'scrollHorizontal' : 
							startOffset = isInTransition ? '-50%' : '50%';
							endOffset = isInTransition ? '50%' : '150%';
							break;
						case 'scrollVertical' : 
							startOffset = isInTransition ? '150%' : '50%';
							endOffset = isInTransition ? '50%' : '-50%';
							break;
					}
				}

				startTransition['opacity'] = startOpacity;
				startTransition[direction] = startOffset;

				endTransition['opacity'] = endOpacity;
				endTransition[direction] = endOffset;

				$object.css(startTransition).show();

				// Css transition
				if (overbox.support.transitions) {
					endTransition[overbox.support.transition + 'transition'] = speed + 'ms ease';

					setTimeout(function () {
						$object.css(endTransition);

						setTimeout(function () {
							$object.css(overbox.support.transition + 'transition', '');

							if (callback && (overbox.open || !isInTransition)) {
								callback();
							}
						}, speed);
					}, 15);
				} else {
					// Fallback to js transition
					$object.stop();
					$object.animate(endTransition, speed, callback);
				}
			},

			/**
			 * Zooms in/out the object
			 *
			 * @param	{object}	$object
			 * @param	{string}	type
			 * @param	{number}	speed
			 * @param	{function}	callback
			 * @return	{void}		Animates an object
			 */
			zoom : function ($object, type, speed, callback) {
				var isInTransition = type === 'in',
					startTransition = {},
					startOpacity = $object.css('opacity'),
					startScale = isInTransition ? 'scale(0.75)' : 'scale(1)',
					endTransition = {},
					endOpacity = isInTransition ? 1 : 0,
					endScale = isInTransition ? 'scale(1)' : 'scale(0.75)';

				if (!overbox.open && isInTransition) return;

				startTransition['opacity'] = startOpacity;
				startTransition[overbox.support.transition + 'transform'] = startScale;

				endTransition['opacity'] = endOpacity;
					
				$object.css(startTransition).show();

				// Css transition
				if (overbox.support.transitions) {
					endTransition[overbox.support.transition + 'transform'] = endScale;
					endTransition[overbox.support.transition + 'transition'] = speed + 'ms ease';
					
					setTimeout(function () {
						$object.css(endTransition);
					
						setTimeout(function () {
							$object.css(overbox.support.transition + 'transform', '');
							$object.css(overbox.support.transition + 'transition', '');
							
							if (callback && (overbox.open || !isInTransition)) {
								callback();
							}
						}, speed);
					}, 15);
				} else {
					// Fallback to js transition
					$object.stop();
					$object.animate(endTransition, speed, callback);
				}
			}
		},

		/**
		 * Calls all the registered functions of a specific hook
		 *
		 * @param	{object}	hooks
		 * @return	{void}
		 */
		callHooks : function (hooks) {
			if (typeof(hooks) === 'object') {
				$.each(hooks, function(index, hook) {
					if (typeof(hook) === 'function') {
						hook();
					}
				});
			}
		},

		/**
		 * Caches the object data
		 *
		 * @param	{object}	$object
		 * @return	{void}
		 */
		cacheObjectData : function ($object) {
			$.data($object, 'cache', {
				id : $object.attr('id'),
				content : $object.html()
			});

			overbox.cache.originalObject = $object;
		},

		/**
		 * Restores the object from cache
		 *
		 * @return	void
		 */
		restoreObject : function () {
			var $object = $('[id^="' + overbox.settings.idPrefix + 'temp-"]');
		
			$object.attr('id', $.data(overbox.cache.originalObject, 'cache').id);
			$object.html($.data(overbox.cache.originalObject, 'cache').content);
		},

		/**
		 * Executes functions for a window resize.
		 * It stops an eventual timeout and recalculates dimenstions.
		 *
		 * @return	{void}
		 */
		resize : function () {
			if (!overbox.open) return;

			if (overbox.isSlideshowEnabled()) {
				overbox.stopTimeout();
			}

			overbox.dimensions = overbox.getDimensions();
			overbox.calculateDimensions(overbox.cache.object);
		},

		/**
		 * Caches the actual scroll coordinates.
		 *
		 * @return	{void}
		 */
		cacheScrollPosition : function () {
			var	$window = $(window),
				$document = $(document),
				offset = {
					'top' : $window.scrollTop(),
					'left' :  $window.scrollLeft()
				};

			overbox.cache.scrollPosition = overbox.cache.scrollPosition || {};

			if ($document.width() > $window.width()) {
				overbox.cache.scrollPosition.left = offset.left;
			}
			if ($document.height() > $window.height()) {
				overbox.cache.scrollPosition.top = offset.top;
			}
		},

		/**
		 * Watches for any resize interaction and caches the new sizes.
		 *
		 * @return	{void}
		 */
		watchResizeInteraction : function () {
			$(window).resize(overbox.resize);
		},
		
		/**
		 * Stop watching any resize interaction related to overbox.
		 *
		 * @return	{void}
		 */
		unwatchResizeInteraction : function () {
			$(window).off('resize', overbox.resize);
		},

		/**
		 * Watches for any scroll interaction and caches the new position.
		 *
		 * @return	{void}
		 */
		watchScrollInteraction : function () {
			$(window).scroll(overbox.cacheScrollPosition);
		},

		/**
		 * Stop watching any scroll interaction related to overbox.
		 *
		 * @return	{void}
		 */
		unwatchScrollInteraction : function () {
			$(window).off('scroll', overbox.cacheScrollPosition);
		},
		
		/**
		 * Restores to the original scoll position before
		 * overbox got initialized.
		 *
		 * @return	{void}
		 */
		restoreScrollPosition : function () {
			$(window)
				.scrollTop(parseInt(overbox.cache.scrollPosition.top))
				.scrollLeft(parseInt(overbox.cache.scrollPosition.left))
				.resize();
		},

		/**
		 * Switches to the fullscreen mode
		 *
		 * @return	{void}
		 */
		switchToFullScreenMode : function () {
			overbox.settings.shrinkFactor = 1;
			overbox.settings.overlayOpacity = 1;

			$('html').addClass(overbox.settings.classPrefix + 'fullScreenMode');
		},

		/**
		 * Enters into the overbox view
		 *
		 * @return	{void}
		 */
		overboxOpen : function () {
			overbox.open = true;

			overbox.support.transitions = overbox.settings.cssTransitions ? overbox.isTransitionSupported() : false;
			overbox.support.mobileDevice = overbox.isMobileDevice();

			if (overbox.support.mobileDevice) {
				$('html').addClass(overbox.settings.classPrefix + 'isMobileDevice');

				if (overbox.settings.fullScreenModeForMobile) {
					overbox.switchToFullScreenMode();
				}
			}
			if (!overbox.settings.transitionIn) {
				overbox.settings.transitionIn = overbox.settings.transition;
			}
			if (!overbox.settings.transitionOut) {
				overbox.settings.transitionOut = overbox.settings.transition;
			}

			switch (overbox.settings.transitionIn) {
				case 'fade' :
				case 'fadeInline' :
				case 'elastic' :
				case 'scrollTop' :
				case 'scrollRight' :
				case 'scrollBottom' :
				case 'scrollLeft' :
				case 'scrollVertical' :
				case 'scrollHorizontal' :
					if ($case.is(':hidden')) {
						$close.css('opacity', 0);
						$overlay.css('opacity', 0);
						$case.css('opacity', 0);
						$contentInner.css('opacity', 0);
					}
					overbox.transition.fade($overlay, 'in', overbox.settings.speedIn, overbox.settings.overlayOpacity, function () {
						overbox.transition.fade($close, 'in', overbox.settings.speedIn);
						overbox.handleEvents();
						overbox.processContent();
					});
					break;
				default :
					overbox.transition.fade($overlay, 'in', 0, overbox.settings.overlayOpacity, function () {
						overbox.transition.fade($close, 'in', 0);
						overbox.handleEvents();
						overbox.processContent();
					});
			}

			$('html').addClass(overbox.settings.classPrefix + 'open');
			$case.attr('aria-hidden', 'false');
		},

		/**
		 * Escapes from the overbox view
		 *
		 * @return	{void}
		 */
		overboxClose : function () {
			overbox.open = false;

			if (overbox.isSlideshowEnabled()) {
				overbox.stopTimeout();
				$nav.removeClass(overbox.settings.classPrefix + 'paused');
			}

			$loading.hide();

			overbox.unbindEvents();

			overbox.unwatchResizeInteraction();
			overbox.unwatchScrollInteraction();

			$('html').removeClass(overbox.settings.classPrefix + 'open');
			$case.attr('aria-hidden', 'true');

			$nav.children().hide();

			overbox.restoreScrollPosition();
			
			// Call onClose hook functions
			overbox.callHooks(overbox.settings.onClose);

			switch (overbox.settings.transitionOut) {
				case 'fade' :
				case 'fadeInline' :
				case 'scrollTop' :
				case 'scrollRight' :
				case 'scrollBottom' :
				case 'scrollLeft' :
				case 'scrollHorizontal' :
				case 'scrollVertical' :
					overbox.transition.fade($case, 'out', overbox.settings.speedOut, 0, function () {
						overbox.transition.fade($overlay, 'out', overbox.settings.speedOut, 0, function () {
							overbox.cleanup();
						});
					});
					break;
				case 'elastic' :
					overbox.transition.zoom($case, 'out', overbox.settings.speedOut, function () {
						overbox.transition.fade($overlay, 'out', overbox.settings.speedOut, 0, function () {
							overbox.cleanup();
						});
					});
					break;
				default :
					overbox.cleanup();
			}
		},

		/**
		 * Unbinds all given events
		 *
		 * @return	{void}
		 */
		unbindEvents : function () {
			// Unbind overlay event
			$overlay.unbind('click');

			// Unbind key events
			$(document).unbind('keyup.overbox');

			// Unbind swipe events
			$case.unbind('swipeleft').unbind('swiperight');

			// Unbind navigator events
			$nav.children('a').unbind('click');

			// Unbind close event
			$close.unbind('click');
		},

		/**
		 * Cleans up the dimensions
		 *
		 * @return	{void}
		 */
		cleanupDimensions : function () {
			var opacity = $contentInner.css('opacity');

			$case.css({
				'width' : '',
				'height' : '',
				'top' : '',
				'left' : '',
				'margin-top' : '',
				'margin-left' : ''
			});

			$contentInner.removeAttr('style').css('opacity', opacity);
			$contentInner.children().removeAttr('style');
		},

		/**
		 * Cleanup after aborting overbox
		 *
		 * @return	{void}
		 */
		cleanup : function () {
			overbox.cleanupDimensions();

			$loading.hide();
			$overlay.hide();
			$case.hide();
			$nav.children().hide();

			$case.removeAttr('data-type');
			$nav.removeAttr('data-ispartofsequence');

			$contentInner.empty().hide();
			$info.children().empty();

			if (overbox.cache.originalObject) {
				overbox.restoreObject();
			}

			// Call onCleanup hook functions
			overbox.callHooks(overbox.settings.onCleanup);
			
			// Restore cache
			overbox.cache = {};
		}
	};

	$.fn.overbox = function (method) {
		// Method calling logic
		if (overbox[method]) {
			return overbox[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return overbox.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.overbox');
		}
	};
})(jQuery);