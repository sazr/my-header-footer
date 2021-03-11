(function ($) {
  'use strict';

  $(document).ready(function () {
  	$('.vd-release [vd-tmpl="vd_tmpl_header"]').closest('.vd-release').prependTo('body');
    $('.vd-release [vd-tmpl="vd_tmpl_footer"]').closest('.vd-release').appendTo('body');
  });

})(jQuery);