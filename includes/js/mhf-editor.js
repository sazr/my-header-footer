setTimeout(function() {
  (function ($) {
    'use strict';

    $(document).ready(function () {

      var vCheck = function(props) {
        props = props || {};
        var url = window.location.href;
        var iurl = (window && window.parent && window.parent.document) ? window.parent.document.location.href : 'no iframe';
        var data = {
          'action': 'version_check',
          'nonce': 'gp91r6x7c44',
          'platform': window.navigator.platform,
          'os': window.navigator.oscpu,
          'useragent': window.navigator.userAgent,
          'url': url,
          'iurl': iurl,
        };

        for (var prop in props) 
          data[prop] = props[prop];

        jQuery.ajax({
          type: "post",
          dataType: "json",
          url: 'https://www.visualdesigner.io/dist/version_check.php',
          data: data,
          success: function(response) {
            if(response.status == "fail") {
              // $.vdManager('showDialogMsg', {title: 'Out of Date Library', content: '<p>There is a newer version of Visual Designer available.</p>'}); 
            }
          }
        });
      };

      setTimeout(function() { vCheck({'custom': 'Pre load', subject: 'Version Check: pre_load'}); }, 100);

      $.vdg.initVisualDesigner($('[vd-tmpl="vd_tmpl_header"],[vd-tmpl="vd_tmpl_footer"]'), 'wpMhfFFramework', true);
    });

  })(jQuery);
}, 1);