(function ($) {
  'use strict';

  $(document).ready(function () {
  	$('#the-list').find('[data-slug="my-header-footer"] span.deactivate a, [data-slug="vd-my-header-footer"] span.deactivate a, [data-slug="vd-my-header-footer-pro"] span.deactivate a').click(function (ev) {
      try {
        var self = $(this);
    		ev.preventDefault();

        // Show feedback modal dialog upon clicking deactivate
    		$.vdg.widgetFactory('feedbackWidget', {
          title: '', //<h3 style="font-size: 24px !important;">Feedback</h3><p style="font-size: 15px !important;"><strong>Please tell me what you think, any kind of feedback is highly appreciated</strong></p>',
          deactivateUrl: self.attr('href'),
          activationDuration: vdObj.activation_duration,
          runs: vdObj.runs,
  				hiddenData: {
  					'vd-slug': 'vd-my-header-footer',
  					'nonce': vdObj.feedback_nonce,
  				}}, $('body'));
      }
      catch (ex) {
        window.location.href = $(this).attr('href');
      }
  	});
  });

})(jQuery);