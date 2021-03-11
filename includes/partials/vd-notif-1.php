<?php
$home 			= add_query_arg('vd', 0, home_url());
$homePost 	= add_query_arg('sel', 'hide-content', $home);
$helpSubmit = add_query_arg('sel', 'support', $home);
?>

<div class="vd-mhf-nag notice notice-info is-dismissible">
  <h3><strong style="font-weight:700">3 Day Activation Promotion! - 10% OFF</strong></h3>
  <p>Thank you for installing My Header Footer (MHF). Upgrade to MHF Pro within the next 3 days and get <strong>10% OFF</strong> your purchase! Just click the below link and use the promo code <strong>WP2020</strong> at checkout to get 10% off. <span style="text-decoration: underline;">Offer only lasts for 3 days.</span></p>
  <div style='display: inline-block;width: 100%;'>
	 <p style='display: inline; float: left; margin: 0;'><a href="https://www.visualdesigner.io/my-header-footer#pricing" target="_blank">Go PRO</a></p>
  </div>

  <p><small>For support or questions don't hesitate to lodge a support request on the plugin page <a href="https://wordpress.org/support/plugin/vd-my-header-footer/" target="_blank">here</a> or through the front-end editor <a href="<?php echo $helpSubmit; ?>" target="_blank">here</a> :)</small></p>
	
	<input class="mhf-nonce" type="hidden" value="<?php echo wp_create_nonce("mhf_dismiss"); ?>" />
	<script type="text/javascript">
		(function ($) {
		  'use strict';

		  $(document).ready(function () {
		  	$(document).on('click', '.vd-mhf-nag .notice-dismiss', function(ev) {
		  		var nag = $(this).closest('.vd-mhf-nag');
		  		var nonce = $('.mhf-nonce', nag);
		  		console.log('nonce ele', nonce);
		  		console.log('nonce', nonce.attr('value'));
		  		jQuery.ajax({
            type: "post",
            dataType: "json",
            url: '<?php echo esc_url( admin_url( 'admin-ajax.php?' ) ); ?>',
            data : {
              'action': 'mhf_dismiss',
              'nonce': nonce.attr('value'),
              'nag': 'MHF_NAG_1'
            }
        	});
		  	});
		  });

		})(jQuery);
	</script>
</div>