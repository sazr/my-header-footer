	<!-- footer -->
	<footer class="footer" role="contentinfo">

		<input class="vd-wp-input" type="hidden" vd-target="vd_footer_id"/>
		<?php echo vD_Post::get_vd_template_post_content(get_the_ID(), 'vd_tmpl_footer', '<p>Warning: VD Footer Post does not exist!</p>'); ?>

	</footer>
	<!-- /footer -->

	<?php wp_footer(); ?>

</body>
</html>
