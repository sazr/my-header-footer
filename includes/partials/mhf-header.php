<!doctype html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta charset="<?php bloginfo('charset'); ?>">
	<title><?php wp_title(''); ?><?php if(wp_title('', false)) { echo ' :'; } ?> <?php bloginfo('name'); ?></title>
	
	<link href="//www.google-analytics.com" rel="dns-prefetch">
  <link href="<?php echo get_site_icon_url(); ?>" rel="shortcut icon">
  <link href="<?php echo get_site_icon_url(); ?>" rel="apple-touch-icon-precomposed">
	
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="<?php bloginfo('description'); ?>">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
	<?php do_action( 'wp_body_open' ); ?>
	<div id="page" class="hfeed site">

	<?php echo vD_Post::get_vd_template_post_content(get_the_ID(), 'vd_tmpl_header', '<p>Warning: VD Header Post does not exist!</p>'); ?>
