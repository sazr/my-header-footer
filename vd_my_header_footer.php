<?php

/**
 * @wordpress-plugin
 * Plugin Name:       My Header Footer
 * Plugin URI:        https://www.visualdesigner.io/my-header-footer
 * Description:       Build, customize and style your theme header and footer
 * Version:           1.25
 * Author:            Visual Designer
 * Author URI:        https://www.visualdesigner.io/my-header-footer
 * License:           GPLv2 or later
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       vd_mhf
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
  die;
}

if (!class_exists('vD_Loader'))
    require_once('lib/vd_loader.php');

// Set Plugin Constants //
require_once('includes/env.php');

function run_vd_mhf() {
    if (vD_Loader::is_vd_theme_active() || vD_Loader::is_vd_addon_active('vd_my_header_footer_pro/vd_my_header_footer_pro.php'))
        return false;

    // Load dependencies
    vD_Loader::load_dependencies("ADDON", VD_ADDON_MHF_ENVIRONMENT, VD_ADDON_MHF_VERSION, plugin_dir_url(__FILE__), plugin_dir_path(__FILE__), true, true);
   
    if (!class_exists('vD_MHF_i18n'))
        require_once(path_join(plugin_dir_path( __FILE__ ), 'includes/class-i18n.php'));
    if (!class_exists('vD_My_Header_Footer'))
        require_once(path_join(plugin_dir_path( __FILE__ ), 'includes/addon.php'));

    register_activation_hook( __FILE__, 'vD_My_Header_Footer::on_activate' );
    register_deactivation_hook( __FILE__, 'vD_My_Header_Footer::on_deactivate' );

    // Set locale
    $plugin_i18n = new vD_MHF_i18n();
    add_action('plugins_loaded', [$plugin_i18n, 'load_plugin_textdomain']);
};
run_vd_mhf();
