<?php

if (defined('VD_CLS_MHF_ADDON'))
  return;
define('VD_CLS_MHF_ADDON', true);

class vD_My_Header_Footer {

  const SLUG                            = 'vd-my-header-footer'; // MUST DEFINE HERE for use by PRO and FREE
  const VD_MHF_ROOT_SLUG                = 'visual-designer-mhf';
  const VD_MHF_PRO_SLUG                 = 'vd-mhf-pro';
  const VD_MHF_STYLE_POST_PRIV          = 'vd_mhf_style_post_private';
  const VD_MHF_STYLE_POST_TITLE_PRIV    = 'MHF Styling Private';
  const VD_MHF_STYLE_POST_CONTENT_PRIV  = "<!-- VisualDesigner BEGIN --><style id='mhf-priv' type='text/css' vd-post-id='' vd-designer-name='' vd-gtmpl=''>@media (max-width: 8900000px) { #mhf-priv {box-sizing: border-box;} }</style><!-- VisualDesigner END -->";

	public static function initialise() {
    add_action('activated_plugin', 'vD_My_Header_Footer::activation_redirect');
    add_filter('vd_set_admin_labels', 'vD_My_Header_Footer::set_admin_labels', 20, 1);
    add_filter('vd_admin_menu_setup', 'vD_My_Header_Footer::vd_admin_menu_setup', 20); 
    add_filter('vd_deactivate_feedback', 'vD_My_Header_Footer::vd_deactivate_feedback', 20); 
    add_filter('wp_update_plugins', 'vD_My_Header_Footer::check_update_wp_repo');
    add_action('wp_version_check', 'vD_My_Header_Footer::check_update_wp_repo');
    add_action('wp_update_themes', 'vD_My_Header_Footer::check_update_wp_repo');
    add_action('admin_post_vd_mhf_update_check', 'vD_My_Header_Footer::form_post_vd_update_check');
    add_action('admin_post_vd_mhf_wizard_submit', 'vD_My_Header_Footer::form_post_vd_wizard_submit');
    add_action( 'admin_enqueue_scripts', 'vD_My_Header_Footer::enqueue_feedback_dependencies' );
    add_action( 'admin_enqueue_scripts', 'vD_My_Header_Footer::enqueue_setup_wizard_dependencies' );
    // add_filter('auto_update_plugin', 'vD_My_Header_Footer::check_update_wp_repo_alt', 10, 2);
    
    if (!vD_Loader::is_vd_theme_active()) {
      add_action('init', 'vD_My_Header_Footer::setup', 20);
      // add_action('get_header', 'vD_My_Header_Footer::get_header', 999);
      // add_action('get_footer', 'vD_My_Header_Footer::get_footer', 999);
      add_action('wp_footer', 'vD_My_Header_Footer::get_header_footer', 9999);
      add_action('wp_head', 'vD_My_Header_Footer::output_mhf_style', 9999);
      add_action( 'wp_enqueue_scripts', 'vD_My_Header_Footer::enqueue_styles');
      add_action( 'wp_enqueue_scripts', 'vD_My_Header_Footer::enqueue_scripts', 9999);
      // add_action( 'admin_enqueue_scripts', 'vD_My_Header_Footer::enqueue_styles_admin');
      add_action('switch_theme', 'vD_My_Header_Footer::on_switch_theme');
      add_action('admin_notices', 'vD_My_Header_Footer::notices');
      add_action('wp_ajax_mhf_dismiss', 'vD_My_Header_Footer::dismiss_nag');
      add_filter('vd_save_wp_template_post', 'vD_My_Header_Footer::save_wp_template_post', 25, 4);
      add_filter('vd_embed_vd_callback', 'vD_My_Header_Footer::on_embed_vd', 20, 1);
      add_action('plugin_action_links_vd-my-header-footer/vd_my_header_footer.php', 'vD_My_Header_Footer::plugin_action_links');

      if (!defined('VD_ADDON_MHF_PRO_SLUG')) {
        add_action('wp_head', 'vD_My_Header_Footer::enqueue_essential_scripts', 1);
        // add_action( 'wp_enqueue_scripts', 'vD_My_Header_Footer::enqueue_essential_scripts', 1);
        add_filter('vd_load_editor_scripts', 'vD_My_Header_Footer::vd_load_editor_scripts', 25);
      }
    }
	}

  public static function setup() {
    vD_Post::register_vd_post_type();

    $headerPostId       = vD_Post::integrity_check(vD_Post::VD_HEADER_POST, 'vd_posts');
    $footerPostId       = vD_Post::integrity_check(vD_Post::VD_FOOTER_POST, 'vd_posts');
    $themeStylePrivId   = vD_Post::integrity_check(self::VD_MHF_STYLE_POST_PRIV, 'vd_posts');
    
    // MUST INCLUDE THIS OR post_exists() fails and causes white screen of death!
    require_once( ABSPATH . 'wp-admin/includes/post.php' );
    if (!$headerPostId) {
      $headerPostId = vD_Post::create(vD_Post::VD_HEADER_POST, vD_Post::VD_HEADER_POST_TITLE, file_get_contents(path_join(__DIR__, 'partials/main-header-tmpl.html')), 'wp_template', 'vd_tmpl_header', 'vd_posts', 'draft');
    }
    if (!$footerPostId) {
      $footerPostId = vD_Post::create(vD_Post::VD_FOOTER_POST, vD_Post::VD_FOOTER_POST_TITLE, file_get_contents(path_join(__DIR__, 'partials/main-footer-tmpl.html')), 'wp_template', 'vd_tmpl_footer', 'vd_posts', 'draft');
    }
    if (!$themeStylePrivId) {
      $themeStylePrivId = vD_Post::create(self::VD_MHF_STYLE_POST_PRIV, self::VD_MHF_STYLE_POST_TITLE_PRIV, self::VD_MHF_STYLE_POST_CONTENT_PRIV, 'private', 'vd_style_mhf', 'vd_posts', 'draft');
    }

    $default_tmpls = [
      'vd_tmpl_header'    => $headerPostId,
      'vd_tmpl_footer'    => $footerPostId,
    ];

    foreach ($default_tmpls as $tmpl_tag => $id ) {
      $current = get_option($tmpl_tag, 'undefined');
      if ($current == 'undefined' || get_post_status($current) != 'publish')
        update_option($tmpl_tag, $id);
    }

    // Add roles 
    // add_role('vd_mhf_admin', 'MHF Administrator', [
    //   'read'         => true,
    //   'edit_posts'   => true,
    //   'upload_files' => true,
    // ]);
    // add_role('vd_mhf_editor', 'MHF Editor', [
    //   'read'         => true,
    //   'edit_posts'   => true,
    //   'upload_files' => true,
    // ]);
  }

  public static function on_activate() {
    // Certain themes would show a 404 when going to www.abc.com/vd_posts/vd_ms_demo_slider
    flush_rewrite_rules();

    $time = time();
    $utcTime = $time + date("Z", $time);
    $nagTime = $utcTime - 1000000;
    update_option('VD_NOTIF_MHF_REMINDER', true);
    update_option('VD_CACHE_TIME', time());
    update_option('VD_MHF_ACTIVATE_TIME', $utcTime);
    update_option('VD_MHF_RUNS', get_option('VD_MHF_RUNS', 0));
    update_option('VD_MHF_NAG_1_DISMISS_TIME', $nagTime);
    update_option('VD_MHF_NAG_2_DISMISS_TIME', $nagTime);
    // update_option('VD_MHF_NAG_3_DISMISS_TIME', $nagTime);

    self::backwards_compat();

    if (defined('VD_ADDON_MHF_VERSION')) {
      if (version_compare(VD_ADDON_MHF_VERSION, 1.22) <= 0)
        update_option('VD_SUPPORT_PRE_1_2', true);
    }
    if (defined('VD_ADDON_MHF_PRO_VERSION')) {
      if (version_compare(VD_ADDON_MHF_PRO_VERSION, 1.22) <= 0)
        update_option('VD_SUPPORT_PRE_1_2', true);
    }

    wp_redirect( esc_url_raw( add_query_arg( 'page', self::VD_MHF_ROOT_SLUG, admin_url( 'admin.php' ) ) ) );
  }

  public static function on_deactivate() {
    // error_log("on_deactivate");
    // self::backwards_compat();
  }

  public static function vd_deactivate_feedback($args) {
    if ($args['slug'] != self::SLUG) 
      return $args;

    $time               = time();
    $utcTime            = $time + date("Z", $time);
    $activateTime       = get_option('VD_MHF_ACTIVATE_TIME', 9999999999);
    $minsSinceLastCheck = round(abs($activateTime - $utcTime) / 60, 2);
    $runs               = intval(get_option('VD_MHF_RUNS', 0));
    $ABTestVersion      = (isset($_REQUEST['vd-feedback-type'])) ? esc_html($_REQUEST['vd-feedback-type']): 'Standard';
    $args['custom']     .= "<li><strong>MHF Activated for:</strong> $minsSinceLastCheck minutes</li><li><strong>MHF Runs:</strong> $runs</li><li><strong>Feedback A/B Type:</strong> $ABTestVersion</li>";
    return $args;
  }

  public static function vd_admin_menu_setup($menuArgs) {
    array_push($menuArgs['vd_products'], self::SLUG);
    
    $menuArgs['root_slug'] = self::VD_MHF_ROOT_SLUG;
    $menuArgs['root_menu_args'] = [
      null, 
      'My Header Footer', 
      'edit_pages',                                           // capability
      self::VD_MHF_ROOT_SLUG,                                 // menuSlug
      null,                                                   // function 
      path_join(plugin_dir_url( __FILE__ ), 'img/logo.svg'),  // icon
      '3.0'                                                   // menu position
    ];  

    array_push($menuArgs['menu_items'], [
      'MHF Settings', 
      'MHF Settings', 
      'edit_pages', 
      self::VD_MHF_ROOT_SLUG, 
      'vD_My_Header_Footer::get_admin_settings_page', 
      5
    ]);

    if (!defined('VD_ADDON_MHF_PRO_SLUG')) {
      array_push($menuArgs['menu_items'], function($rSlug) {
        global $submenu;
        $submenu[$rSlug][] = ['PRO MHF Version', 'edit_pages', 'https://www.visualdesigner.io/my-header-footer#pricing'];
      });
    }

    // Hidden page
    add_submenu_page(
      null, 
      'MHF Setup Wizard',
      'MHF Setup Wizard', 
      'edit_pages',  
      self::VD_MHF_ROOT_SLUG.'-setup', 
      'vD_My_Header_Footer::get_setup_wizard_page'
     );

    return $menuArgs;
  }

  public static function enqueue_styles() {
    // wp_enqueue_style( "foo", '//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/default.min.css', array(), '1.0', 'all' );

    // TODO: check if any existing designs are not upgraded
    if (get_option('VD_SUPPORT_PRE_1_2', false))
      wp_enqueue_style( "vd-release-back-compat", path_join(VD_LIB, 'lib/css/vd-release-pre1.2.min.css'), array("vd-mat", "vd-fa"), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
  }
  
  public static function enqueue_scripts() {
    // JQuery is a ESSENTIAL dependency for both the moving of the header and footer AND for the show/hide of the nav menus
    wp_enqueue_script( "mhf-core", path_join(plugin_dir_url( __FILE__ ), 'js/mhf-public.js'), ['jquery-core', 'jquery-migrate', 'jquery-ui-core', 'jquery-ui-widget'], VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );
  }

  public static function enqueue_essential_scripts() {
    if (vD_Editor::is_vd_embedded_editor()) {
      $profiler     = path_join(VD_LIB, 'lib/js/vendor/bugsnag.min.js');
      $initialiser  = path_join(plugin_dir_url( __FILE__ ), 'js/mhf-editor.js');
      echo "<script id=\"bsProfiler\" type='text/javascript' src=\"$profiler\" onload=\"Bugsnag.start({ apiKey: '936edfdc0414c2e19a62cba18ef5998a' });\"></script>";
    }
  }

  public static function enqueue_setup_wizard_dependencies($hook_suffix) {
    if (stripos($hook_suffix, self::VD_MHF_ROOT_SLUG.'-setup') == false)
      return;

    $vdObj = [
      'ajax' => admin_url( 'admin-ajax.php' ),
    ];

    wp_register_script("visual-designer-js", path_join(VD_LIB, 'lib/js/visual-designer-release.min.js'));
    wp_localize_script("visual-designer-js", 'vdObj', $vdObj); 
    wp_enqueue_script( "visual-designer-js", path_join(VD_LIB, 'lib/js/visual-designer-release.min.js'), ['jquery-core', 'jquery-migrate', 'jquery-ui-core', 'jquery-ui-widget'], VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );
  }

  public static function enqueue_feedback_dependencies() {
    if (!vD_Editor_Admin::is_wp_plugins_page())
      return;

    $time           = time();
    $utcTime        = $time + date("Z", $time);
    $activateTime   = get_option('VD_MHF_ACTIVATE_TIME', 9999999999);
    $minsActivated  = round(abs($activateTime - $utcTime) / 60, 2);
    $runs           = intval(get_option('VD_MHF_RUNS', 0));

    wp_enqueue_script( "visual-designer-js", path_join(VD_LIB, 'lib/js/visual-designer-release.min.js'), ['jquery-core', 'jquery-migrate', 'jquery-ui-core', 'jquery-ui-widget'], VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );

    $vdObj = [
      'ajax' => admin_url( 'admin-ajax.php' ),
      'feedback_nonce' => wp_create_nonce("vd_feedback_nonce"),
      'activation_duration' => $minsActivated,
      'runs' => $runs,
    ];

    wp_register_script("mhf-admin-js", path_join(plugin_dir_url( __FILE__ ), 'js/mhf-feedback.js'));
    wp_localize_script("mhf-admin-js", 'vdObj', $vdObj); 
    wp_enqueue_script( "mhf-admin-js", path_join(plugin_dir_url( __FILE__ ), 'js/mhf-feedback.js'), ['jquery-core', 'jquery-migrate', 'jquery-ui-core', 'jquery-ui-widget'], VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );
  }

  public static function vd_load_editor_scripts($obj) {
    wp_enqueue_script( "mhf-b-js", path_join(plugin_dir_url( __FILE__ ), 'js/html2canvas.min.js'), ['visual-designer-js'], VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );
    wp_enqueue_script( "mhf-editor-js", path_join(plugin_dir_url( __FILE__ ), 'js/mhf-editor.js'), ['visual-designer-js'], VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );
    return $obj;
  }

  public static function set_admin_labels($args) {
    $args['menu_root_label']      = 'My Header Footer';
    $args['menu_root_icon']       = path_join(plugin_dir_url( __FILE__ ), 'img/logo.svg');
    $args['menu_settings_label']  = 'Settings';
    $args['edit_label']           = 'Edit Header or Footer';
    $args['display_edit_btn']     = false;
    return $args;
  }

  public static function on_embed_vd($args) {
    update_option('VD_MHF_RUNS', intval(get_option('VD_MHF_RUNS', 0)) + 1);

    // Add bugsnag to outside iframe
    $profiler = path_join(VD_LIB, 'lib/js/vendor/bugsnag.min.js');
    $args['custom_head'] .= "<script id=\"bsProfiler\" type='text/javascript' src=\"$profiler\" onload=\"Bugsnag.start({ apiKey: '936edfdc0414c2e19a62cba18ef5998a' });\"></script>";    

    if (defined('VD_ADDON_MHF_PRO_VERSION'))  
      return $args;

    $runs = intval(get_option('VD_MHF_RUNS', 0));
    if ($runs == 3 || $runs%5 == 0)  
     $args['qry_params']['upgrade_modal_mhf'] = '1';   
    if ($runs == 1 || $runs%2 == 0)  
     $args['qry_params']['survey_mhf'] = '1';  

    return $args;
  }

  public static function get_admin_settings_page() {
    include_once('partials/vd-settings-page.php');
  }

  public static function show_theme_features_page() {
    include_once('partials/vd-theme-features-page.php');
  }

  public static function get_setup_wizard_page() {
    include_once('partials/vd-setup-page.php');
  }

  public static function get_header() {
    require('partials/mhf-header.php');
    $template_names = ['header.php'];
    remove_all_actions('wp_head');
    ob_start();
    locate_template($template_names, true);
    ob_get_clean();
  }

  public static function get_footer() {
    require('partials/mhf-footer.php');
    $template_names = ['footer.php'];
    remove_all_actions('wp_footer');
    ob_start();
    locate_template($template_names, true);
    ob_get_clean();
  }

  public static function get_header_footer() {
    $header = vD_Post::get_vd_template_post(get_the_ID(), 'vd_tmpl_header');
    if (!empty($header) && !is_user_logged_in() && in_array(get_post_status($header->ID), ['publish']) && !post_password_required($header->ID)
      ||
      !empty($header) && is_user_logged_in() && !in_array(get_post_status($header->ID), ['trash',FALSE])) {
      echo '<input class="vd-wp-input" type="hidden" vd-target="vd_header_id"/>';
      echo do_shortcode( do_shortcode($header->post_content) );
    }

    $footer = vD_Post::get_vd_template_post(get_the_ID(), 'vd_tmpl_footer');
    if (!empty($footer) && !is_user_logged_in() && in_array(get_post_status($footer->ID), ['publish']) && !post_password_required($footer->ID)
      ||
      !empty($footer) && is_user_logged_in() && !in_array(get_post_status($footer->ID), ['trash',FALSE])) {
      echo '<input class="vd-wp-input" type="hidden" vd-target="vd_footer_id"/>';
      echo do_shortcode( do_shortcode($footer->post_content) );
    }
  }

  public static function output_mhf_style() {
    $themeStylePriv = vD_Post::get(self::VD_MHF_STYLE_POST_PRIV, 'vd_posts');
    if (isset($themeStylePriv) && !is_user_logged_in() && in_array(get_post_status($themeStylePriv->ID), ['publish']) && !post_password_required($themeStylePriv->ID)
      ||
      isset($themeStylePriv) && is_user_logged_in() && !in_array(get_post_status($themeStylePriv->ID), ['trash',FALSE])) {
      echo do_shortcode( $themeStylePriv->post_content );
    }

    // echo vD_Post::get_content(self::VD_MHF_STYLE_POST_PRIV, '<!-- No mhf style -->');
  }

  static function activation_redirect( $plugin ) {
    if ($plugin == 'vd-my-header-footer/vd_my_header_footer.php' || $plugin == 'vd-my-header-footer-pro/vd_my_header_footer_pro.php' ) {
      // REDIRECT to wizard
      // exit( wp_redirect( esc_url_raw( add_query_arg( 'page', self::VD_MHF_ROOT_SLUG.'-setup', admin_url( 'admin.php' ) ) ) ) );
      // Redirect to admin page
      exit( wp_redirect( esc_url_raw( add_query_arg( 'page', self::VD_MHF_ROOT_SLUG, admin_url( 'admin.php' ) ) ) ) );
    }
  }

  public static function form_post_vd_wizard_submit() {
    $result = [
      'type'    => "failure",
      'message' => "Failed"
    ];

    if (!is_user_logged_in()) {
      error_log("form_post_vd_wizard_submit(): error not logged in");
      $result['message']  = "Error user not logged in";
      echo json_encode($result);
      die();
    }
    if (!vD_Editor::can_process_request(3)) {
      error_log("form_post_vd_wizard_submit called too frequently. Please wait before calling form_post_vd_wizard_submit again.");
      echo json_encode($result);
      die();
    }
    // if (!vD_Editor::can_use_vd()) { }

    $customHeader     = isset($_REQUEST['customHeader'])      ? filter_var(esc_html($_REQUEST['customHeader']), FILTER_VALIDATE_BOOLEAN)  : false;
    $customFooter     = isset($_REQUEST['customFooter'])      ? filter_var(esc_html($_REQUEST['customFooter']), FILTER_VALIDATE_BOOLEAN)  : false;
    $headerTemplate   = isset($_REQUEST['headerTemplate'])    ? esc_html($_REQUEST['headerTemplate'])   : false;
    $footerTemplate   = isset($_REQUEST['footerTemplate'])    ? esc_html($_REQUEST['footerTemplate'])   : false;
    $hideElementsCSS  = isset($_REQUEST['hideElementsCSS'])   ? vD_Post::html_purify($_REQUEST['hideElementsCSS'])  : false;
    $header           = vD_Post::get(vD_Post::VD_HEADER_POST, 'vd_posts');
    $footer           = vD_Post::get(vD_Post::VD_FOOTER_POST, 'vd_posts');
    $themeStylePriv   = vD_Post::get( self::VD_MHF_STYLE_POST_PRIV, 'vd_posts' );
    $home             = add_query_arg('vd', 0, home_url());
    $headerUrl        = add_query_arg('tmpl', 'vd_tmpl_header', $home);
    $footerUrl        = add_query_arg('tmpl', /*$footerId*/'vd_tmpl_footer', $home);
    $styleHtml        = isset($hideElementsCSS) ? $hideElementsCSS : self::VD_MHF_STYLE_POST_CONTENT_PRIV;
    
    if (!isset($header)) {
      $result['message']  = "Error could not retrieve main header post";
      echo json_encode($result);
      die();
    }
    if (!isset($footer)) {
      $result['message']  = "Error could not retrieve main footer post";
      echo json_encode($result);
      die();
    }
    if (!isset($themeStylePriv)) {
      $result['message']  = "Error could not retrieve MHF private post";
      echo json_encode($result);
      die();
    }

    if ($customFooter && isset($footerTemplate)) {
      $footerHtml = self::get_mhf_template($footerTemplate, path_join(__DIR__, 'partials/main-footer-tmpl.html'));
      vD_Post::save($footer->ID, $footerHtml, ["post_status" => "draft", "overwrite_all" => true]);
      $result['editUrl'] = $footerUrl;
    }
    if ($customHeader && isset($headerTemplate)) {
      $headerHtml = self::get_mhf_template($headerTemplate, path_join(__DIR__, 'partials/main-header-tmpl.html'));
      vD_Post::save($header->ID, $headerHtml, ["post_status" => "draft", "overwrite_all" => true]);
      $result['editUrl'] = $headerUrl;
    }

    vD_Post::save($themeStylePriv->ID, $hideElementsCSS, ["post_status" => "draft", "overwrite_all" => true]);

    $result['message']  = "Success";
    $result['type']     = "success";
    $result = json_encode($result);
    echo $result;
    die();
  }

  private static function get_mhf_template($tmpl_id, $fallback) {
    $tmplFile = path_join(__DIR__, "partials/templates/$tmpl_id.html");
    if (!file_exists($tmplFile))
      return file_get_contents($fallback); 

    return file_get_contents($tmplFile);
  }

  public static function notices() {
    // Only show nag on certain screens
    $screen = get_current_screen();
    $page = (isset($screen) && isset($screen->parent_base)) ? $screen->parent_base : 'ignore';
    $validPages = ['index', 'themes', 'plugins'];
    if (!in_array($page, $validPages))
      return; 

    $time = time();
    $utcTime = $time + date("Z", $time);
    $activateTime = get_option('VD_MHF_ACTIVATE_TIME', 9999999999);
    $hoursSinceActivate = round(abs($activateTime - $utcTime) / ( 60 * 60 ), 2);
    $hoursSinceDismiss1 = round(abs(get_option('VD_MHF_NAG_1_DISMISS_TIME', $utcTime - 1000000) - $utcTime) / ( 60 * 60 ), 2);
    $hoursSinceDismiss2 = round(abs(get_option('VD_MHF_NAG_2_DISMISS_TIME', $utcTime - 1000000) - $utcTime) / ( 60 * 60 ), 2);

    if (!defined('VD_ADDON_MHF_PRO_VERSION') && $hoursSinceActivate <= 72 && $hoursSinceDismiss1 > 7) {
      include_once 'partials/vd-notif-1.php';
    }
    else if (!defined('VD_ADDON_MHF_PRO_VERSION') && $hoursSinceDismiss1 > 7 && $hoursSinceDismiss2 > 72) {
      include_once 'partials/vd-notif-2.php';
    }
  }

  public static function dismiss_nag() {
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce( $_REQUEST['nonce'], "mhf_dismiss"))
      exit("No naughty business please");
    if (!is_user_logged_in())
      exit("User not logged in");
    if (!isset($_REQUEST['nag']))
      exit("No nag");

    $time = time();
    $utcTime = $time + date("Z", $time);
    $nag = sanitize_text_field($_REQUEST['nag']);
    update_option("VD_" . $nag . "_DISMISS_TIME", $utcTime);
  }

  public static function check_update_wp_repo() {
    $transient = get_site_transient('update_plugins');
    $slug = 'vd-my-header-footer'; // VD_ADDON_MHF_SLUG;
    $path = 'vd-my-header-footer/vd_my_header_footer.php';
    if (!property_exists($transient, 'response') || !isset($transient->response[$path]))
      return; 

    $obj = $transient->response[$path];
    if (!property_exists($obj, 'new_version') || !property_exists($obj, 'package'))
      return;
    if (version_compare(VD_ADDON_MHF_VERSION, $obj->new_version) >= 0)
      return;

    $upgrader = new Smart_Upgrader($slug, $obj->package, VD_ADDON_MHF_VERSION, VD_ADDON_MHF_ENVIRONMENT); 
    $res = $upgrader->upgrade($obj->package);
    error_log("Update Result: $res");

    self::backwards_compat();
  }

  // public static function check_update_wp_repo_alt($update, $item) {
  //   error_log("auto_update_plugin");
  //   error_log(print_r($update, true));
  //   error_log(print_r($item, true));
  //   $plugins = array('vd-my-header-footer');
  //   if (in_array( $item->slug, $plugins))
  //     return true;
    
  //   return $update;
  // }

  public static function form_post_vd_update_check() {
    self::check_update_wp_repo();
    wp_redirect( admin_url( 'admin.php?page='.self::VD_MHF_ROOT_SLUG ) );
  }

  public static function on_switch_theme($new_theme) {
    update_option('VD_NOTIF_MHF_REMINDER', 'true');
    
    // Clear VD_MHF_STYLE_POST_PRIV post
    $themeStylePriv   = vD_Post::get( self::VD_MHF_STYLE_POST_PRIV, 'vd_posts' );
    $themeStylePrivId = isset($themeStylePriv) ? $themeStylePriv->ID : false;
    if (!$themeStylePrivId)
      return;

    vD_Post::save($themeStylePrivId, self::VD_MHF_STYLE_POST_CONTENT_PRIV, ["overwrite_all" => true]);
  }

  public static function save_wp_template_post($content, $post_id, $post_title, $data) {
    // Update mhf style template
    if (isset($data["mhf_style"])) {
        $id = vd_Post::get(self::VD_MHF_STYLE_POST_PRIV)->ID;
        vD_Post::save($id, $data["mhf_style"], ["post_status" => "publish"]);
    }

    self::backwards_compat_1_2();
  }

  public static function plugin_action_links($links) {
    if (defined('VD_ADDON_MHF_PRO_VERSION'))
      return $links;
    $link = '<a class="vd-go-pro" href="https://visualdesigner.io/my-header-footer#pricing" target="_blank">Go PRO</a>';
    array_push($links, $link);
    return $links;
  }

  public static function backwards_compat() {
    // Version specific fixes
    $v111FixesDone = get_option('VD_MHF_V_1_11', 'undefined');
    if ($v111FixesDone == 'undefined') {
      update_option('VD_MHF_V_1_11', true);
      // Delete existing MHF Priv style
      self::on_switch_theme('undefined');
    }

    // Version 1.2+ todos
    self::backwards_compat_1_2();
  }

  private static function backwards_compat_1_2() {
    $vdPosts = get_posts([
      'post_type'   => 'vd_posts',
      'post_status' => 'publish',
      'numberposts' => -1,
      'meta_query' => array(
        array(
         'key'      => 'vd_sub_type',
         'value'    => vD_Post::VD_PRIVATE_NAME,
         'compare'  => '!='
        ),
      )
    ]);

    $support1_2 = false;
    foreach ($vdPosts as $post) {
      $vdVersion = get_post_meta($post->ID, 'vd_version', true);      
      error_log("vd_version $vdVersion");
      if (!isset($vdVersion) || floatval($vdVersion) < 1.2) {
        error_log("Need to support pre 1.2");
        $support1_2 = true;
        break;
      }
    }

    error_log("Pre 1.2 Setting: $support1_2");
    update_option('VD_SUPPORT_PRE_1_2', $support1_2);
  }
}

vD_My_Header_Footer::initialise();
