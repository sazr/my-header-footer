<?php

if (defined('VD_CLS_EDITOR_ADMIN'))
  return;
define('VD_CLS_EDITOR_ADMIN', true);

class vD_Editor_Admin {

  public static $MENU_ROOT_LABEL;
  public static $MENU_ROOT_ICON;
  public static $MENU_SETTINGS_LABEL;
  public static $EDIT_LABEL;
  public static $DISPLAY_EDIT_BTN;
  
  public static function initialise() {
    self::$MENU_ROOT_LABEL      = "Visual Designer";
    self::$MENU_ROOT_ICON       = path_join(VD_LIB, 'lib/img/tb-icon-sml.svg');
    self::$MENU_SETTINGS_LABEL  = "Settings";
    self::$EDIT_LABEL           = (defined('VD_THEME_ACTIVE')) ? 'Edit with tB' : 'Edit with vD';
    self::$DISPLAY_EDIT_BTN      = true;
    self::define_admin_hooks();
    
    // add_action('wp', function() {
    //   self::define_admin_hooks();
    // });
  }

  public static function define_admin_hooks() { 
    add_action( 'init', 'vD_Editor_Admin::set_admin_labels', 1 );
    add_action( 'admin_menu', 'vD_Editor_Admin::add_admin_page', 1 );
    add_action( 'admin_bar_menu', 'vD_Editor_Admin::admin_bar_menu', 9999 );
    add_action( 'admin_enqueue_scripts', 'vD_Editor_Admin::enqueue_scripts' );
    add_action( 'admin_enqueue_scripts', 'vD_Editor_Admin::enqueue_styles' );
    add_filter( 'page_row_actions', 'vD_Editor_Admin::render_row_actions' );
    add_filter( 'post_row_actions', 'vD_Editor_Admin::render_row_actions' );
    add_action( 'admin_init', 'vD_Editor_Admin::govern_editor_use' );
    add_action( 'activated_plugin', 'vD_Editor_Admin::activation_redirect' );

    // Should be admin_ajax???!!!
    add_action( 'wp_ajax_vd_feedback_request', 'vD_Editor_Admin::vd_feedback_request' );
    // add_action( 'admin_footer', 'vD_Editor_Admin::admin_footer' );
  }

  public static function is_vd_admin_page($string, $query='visual-designer') {
    // return substr($string, 0, strlen($query)) === $query; // starts with
    return stripos($string, $query) !== false; // contains
  }

  public static function is_wp_plugins_page() {
    return in_array(get_current_screen()->id, ['plugins', 'plugins-network']);
  }

  // Hooks //
  public static function enqueue_styles($hook_suffix) {
    wp_enqueue_style( 'vd-bar-style', path_join(VD_LIB, 'lib/css/vd-public.css'), 0, VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
    
    if (self::is_vd_admin_page($hook_suffix) || self::is_wp_plugins_page()) {
      wp_enqueue_style( "vd-mat", 'https://fonts.googleapis.com/icon?family=Material+Icons', array(), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
      wp_enqueue_style( "vd-fa", 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.1/css/all.min.css', array(), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );

      wp_enqueue_style( "vd-release", path_join(VD_LIB, 'lib/css/visual-designer-release.min.css'), array("vd-mat", "vd-fa"), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
    }
  }

  public static function enqueue_scripts($hook_suffix) {
    if (self::is_vd_admin_page($hook_suffix)) {
      wp_enqueue_media();

      wp_enqueue_script( 'jquery-core', null, array(
        // 'jquery',  
        'jquery-migrate', 
        'jquery-ui-core', 
        'jquery-ui-widget', 
        'jquery-touch-punch', 
        'wp-mediaelement',
        'media-upload',
        ), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true);
    }
  }

  public static function set_admin_labels() {
    $args = [
      'menu_root_label'     => self::$MENU_ROOT_LABEL,
      'menu_root_icon'      => self::$MENU_ROOT_ICON,
      'menu_settings_label' => self::$MENU_SETTINGS_LABEL,
      'edit_label'          => self::$EDIT_LABEL,
      'display_edit_btn'    => self::$DISPLAY_EDIT_BTN
    ];
    $args = apply_filters('vd_set_admin_labels', $args);
    self::$MENU_ROOT_LABEL      = $args['menu_root_label'];
    self::$MENU_ROOT_ICON       = $args['menu_root_icon'];
    self::$MENU_SETTINGS_LABEL  = $args['menu_settings_label'];
    self::$EDIT_LABEL           = $args['edit_label'];
    self::$DISPLAY_EDIT_BTN     = $args['display_edit_btn'];
  }

  public static function add_admin_page() {
    $defMenuArgs = [
      'root_slug'       => 'visual-designer',
      'root_menu_args'  => [
        'Builders', 
        'Builders', 
        'edit_pages',                                     // capability
        'visual-designer',                                // menuSlug
        null,                                             // function 
        path_join(VD_LIB, 'lib/img/tb-icon-sml.svg'),     // icon
        '3.0'                                             // menu position
      ],
    ];
    $menuArgs = [
      'root_slug'           => $defMenuArgs['root_slug'],
      'root_menu_args'      => $defMenuArgs['root_menu_args'],
      'vd_products'         => [],
      'menu_items'          => [],
      'menu_item_callbacks' => [],
      'glb_menu_items'      => ['theme_ad' => true, 'vd_posts', 'vd_posts_list' => true],
    ];

    if (has_filter('vd_admin_menu_setup'))
      $menuArgs = apply_filters('vd_admin_menu_setup', $menuArgs);

    if (count($menuArgs['vd_products']) > 1) {
      $menuArgs = $defMenuArgs + $menuArgs;
      array_unshift($menuArgs['menu_items'], [
        'Builders', 
        'Builders', 
        'edit_pages',
        $menuArgs['root_slug'], 
        'vD_Editor_Admin::show_theme_features_page', 
        -1
      ]);
    }

    // Add top menu
    call_user_func_array('add_menu_page', $menuArgs['root_menu_args']);

    // global $submenu;
    foreach ($menuArgs['menu_items'] as $menuItem) {
      // error_log(print_r($menuItem, true));
      if (gettype($menuItem) == 'object')
        $menuItem(/*$submenu,*/ $menuArgs['root_slug']);
      else {
        array_unshift($menuItem, $menuArgs['root_slug']);
        call_user_func_array('add_submenu_page', $menuItem);
      }
    }

    if ($menuArgs['glb_menu_items']['theme_ad']) {
      add_submenu_page(
        $menuArgs['root_slug'], 
        'Build a Theme', 
        'Build a Theme', 
        'edit_pages',
        'visual-designer-tb', 
        'vD_Editor_Admin::show_theme_features_page', 
        null
      );
    }
    if ($menuArgs['glb_menu_items']['vd_posts_list']) {
      add_submenu_page(
        $menuArgs['root_slug'], 
        'Templates', 
        'Templates', 
        'edit_pages', 
        'edit.php?post_type=vd_posts'
      ); 
    }
  }

  public static function show_admin_page() {
    include_once plugin_dir_path( __FILE__ ) . '../includes/partials/vd-settings-page.php';
  }

  public static function show_theme_features_page() {
    include_once plugin_dir_path( __FILE__ ) . '../includes/partials/vd-theme-features-page.php';
  }

  static function activation_redirect( $plugin ) {
    if( $plugin == 'vd/vd.php' )
      exit( wp_redirect( admin_url( 'admin.php?page=visual-designer' ) ) );
  }

  public static function govern_editor_use() {
    $post_id = null;
    if (array_key_exists('post', $_GET))
      $post_id = sanitize_text_field($_GET['post']);
    else if (array_key_exists('post_ID', $_POST))
      $post_id =  sanitize_text_field($_POST['post_ID']);

    if(!isset( $post_id )) 
      return;

    $hasVd = get_post_meta($post_id, 'uses_visual_designer', true);

    if (!$hasVd)
      return;

    remove_post_type_support(get_post_type($post_id), 'editor');
  }  

  public static function vd_feedback_request() {
    $result = [
      'type'    => "Failed",
      'message' => ""
    ];
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce($_REQUEST['nonce'], "vd_feedback_nonce"))
      exit("No naughty business please"); 
    if (!is_user_logged_in())
      exit("User not logged in");
    if (!vD_Editor::can_process_request(10)) {
      error_log("vd_feedback_request called too frequently. Please wait before calling vd_feedback_request again.");
      $result['message']  = "Limit of 1 submission every 60 seconds. Please wait a minute before submitting again.";
      echo json_encode($result);
      die();
    }
    
    $theme          = wp_get_theme();
    $themeName      = $theme->get('Name');
    $themeUrl       = $theme->get( 'ThemeURI' );
    $environ        = VD_ENVIRONMENT;
    $version        = VD_VERSION;
    $url            = get_home_url();
    $reason         = (isset($_REQUEST['vd-feedback'])) ? esc_html($_REQUEST['vd-feedback']): 'No reason given';
    // $ABTestVersion  = (isset($_REQUEST['vd-feedback-type'])) ? esc_html($_REQUEST['vd-feedback-type']): 'Standard';
    global $wp_version;

    $data = [
      'action'          => 'feedback',
      'nonce'           => 'k522CtkMZRcusAmQ',
      'msg'             => 'Deactivation Feedback',
      'slug'            => (isset($_REQUEST['vd-slug'])) ? esc_html($_REQUEST['vd-slug']) : 'not specified',
      'environ'         => $environ,
      'version'         => $version,
      'url'             => $url,
      'themeName'       => $themeName,
      'themeUrl'        => $themeUrl,
      'vdReason'        => $reason,
      'vdOtherFeedback' => esc_html($_REQUEST['vd-other-feedback']),
      'vdIssuesDetail'  => esc_html($_REQUEST['vd-issues-detail']),
      'platform'        => esc_html($_REQUEST['platform']),
      'os'              => esc_html($_REQUEST['os']),
      'useragent'       => esc_html($_REQUEST['useragent']),
      'phpVersion'      => esc_html(phpversion()),
      'wpVersion'       => esc_html($wp_version),
      'custom'          => '',
    ];

    if (has_filter('vd_deactivate_feedback'))
      $data = apply_filters('vd_deactivate_feedback', $data);

    try { 
      // If the user hasn't set up their email or worse disabled it I never get the support request!! Thus the need for the above code
      vD_Loader::url_post_contents('https://www.visualdesigner.io/dist/vd_feedback.php', $data); 
      $result['type']     = "success";
      $result['message']  = "Thank you for providing feedback";
    } 
    catch (Exception $e) { 
      error_log("Failed to send vd_feedback");
      $result['message'] = "An error occurred sending request. Click <a href='https://www.visualdesigner.io/support?rel=wp' target='_blank'>here</a>."; 
    }

    // If the user hasn't set up their email or worse disabled it I never get the support request!! Thus the need for the above code
    // $message = "
    // <html>
    // <head>
    //   <title>vD Deactivation</title>
    // </head>
    // <body>
    //   <p>Message:</p>
    //   <ul>
    //     <li><strong>Deactivation Feedback:</strong> " . $reason                                   . "</li>
    //     <li><strong>Other Feedback:</strong> "        . esc_html($_REQUEST['vd-other-feedback'])  . "</li>
    //     <li><strong>Platform:</strong> "              . esc_html($_REQUEST['platform'])           . "</li>
    //     <li><strong>OS:</strong> "                    . esc_html($_REQUEST['os'])                 . "</li>
    //     <li><strong>User Agent:</strong> "            . esc_html($_REQUEST['useragent'])          . "</li>
    //     <li><strong>WordPress Version:</strong> "     . esc_html(phpversion())                    . "</li>
    //     <li><strong>PHP Version:</strong> "           . esc_html($wp_version)                     . "</li>

    //     " . $custom['html'] . "
        
    //     <li><strong>Environment:</strong>     $environ</li>
    //     <li><strong>Version:</strong>         $version</li>
    //     <li><strong>Url:</strong>             $homeUrl</li>
    //     <li><strong>Theme Name:</strong>      $themeName</li>
    //     <li><strong>Theme Url Type:</strong>  $themeUrl</li>
    //   </ul>
    // </body>
    // </html>
    // ";

    // $emailResult =  wp_mail("contact@visualdesigner.io", "Deactivation Feedback", $message, array('Content-Type: text/html; charset=UTF-8') );
    // error_log("Feedback request send res: $emailResult");

    $result = json_encode($result);
    echo $result;
    die();
  }

  public static function admin_bar_menu($wp_admin_bar) {
    if (!vD_Editor::can_use_vd() || !self::$DISPLAY_EDIT_BTN)
      return;
    
    $id = 'vd-menu';
    $adminUrl = get_admin_url();

    // global $wp_the_query;
    global $post;
    global $pagenow;
    $is_post = is_singular() && $post || $pagenow == 'post.php';  
    if ($is_post && vD_Post::is_vd_compatible_post($post->post_type)) {
      $wp_admin_bar->add_node( array(
        'id'    => 'vd-frontend-edit-link',
        'title' => self::$EDIT_LABEL,
        'meta'  => array('class' => 'vd-admin-bar-btn'),
        'href'  => set_url_scheme( add_query_arg( 'vd', '', get_permalink())) 
      ));
    }
  }

  public static function render_row_actions( $actions = array() )  {
    if (!self::$DISPLAY_EDIT_BTN)
      return $actions;

    global $post;
    if (!in_array($post->post_status, ['trash',FALSE]) && //'trash' != $post->post_status && 
        current_user_can( 'edit_post', $post->ID ) && 
        wp_check_post_lock( $post->ID ) === false && 
        vD_Post::is_vd_compatible_post($post->post_type)) {
      $actions['visual-designer'] = '<a href="' . add_query_arg( 'vd', '', get_permalink( $post->ID ) ) . '">' . self::$EDIT_LABEL . '</a>';
    }
    
    return $actions;
  }

  /*public function admin_footer() {
    if (!$this->can_use_vd())
         return;

    $post_id = get_the_ID();

    if( function_exists( 'is_gutenberg_page' ) && is_gutenberg_page() ) {
      <a href="<?php get_permalink( $post_id ); ?>">Edit with vD</a>
    }
    else {
      <a href="<?php get_permalink( $post_id ); ?>">Edit with vD other</a>
    }
  }*/
}

vD_Editor_Admin::initialise();
