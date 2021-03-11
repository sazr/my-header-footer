<?php

if (defined('VD_CLS_EDITOR'))
  return;
define('VD_CLS_EDITOR', true);

class vD_Editor {

  public static function initialise() {
    switch (VD_ENVIRONMENT)
    {
        case 'RELEASE':
        {
            define('VD_ALLOW_EDITOR', 'allow_editor_release'); 
            define('VD_IS_EDITOR_REQUEST', 'is_editor_request_release');
        }
        break;
        case 'BETA':
        {
            define('VD_ALLOW_EDITOR', 'allow_editor_release'); 
            define('VD_IS_EDITOR_REQUEST', 'is_editor_request_release'); 
        }
        break;
        case 'DEMO':
        {
            define('VD_ALLOW_EDITOR', 'allow_editor_demo'); 
            define('VD_IS_EDITOR_REQUEST', 'is_editor_request_demo'); 
        }
        break;
        case 'DEBUG':
        {
            define('VD_ALLOW_EDITOR', 'allow_editor_release'); 
            define('VD_IS_EDITOR_REQUEST', 'is_editor_request_release'); 
        }
        break;
        default: 
        {
            define('VD_ALLOW_EDITOR', 'allow_editor_release'); 
            define('VD_IS_EDITOR_REQUEST', 'is_editor_request_release'); 
        }
        break;
    }

    $current = get_option('VD_CACHE_TIME', 'undefined');
    if ($current == 'undefined')
      update_option('VD_CACHE_TIME', time(), true);

    add_action('init', function() {
      self::define_public_hooks();
      self::define_global_hooks();
    });
  }

  public static function can_use_vd() {
    global $wp_the_query;
    // $user = wp_get_current_user();
    $can_edit_publish = current_user_can('editor') || current_user_can('administrator') || current_user_can( 'edit_post', $wp_the_query->post->ID );
    return $can_edit_publish;
  }

  public static function can_process_request($limitSeconds=3, $updateOption=true, $option='vd_last_exec') {
    $time = time();
    $lastCall = get_option($option, false);
    if (!$lastCall)
      $lastCall = $time - 3600; // now - 1 hour
    $utcTime = $time + date("Z", $time);
    $secondsSinceLastCall = round(abs($lastCall - $utcTime), 2);
    
    if ($secondsSinceLastCall < $limitSeconds)
      return false;

    if ($updateOption)
      update_option($option, $utcTime, true);

    return true;
  }

	private static function is_vd_page($param) {
    global $wp_the_query;

    $has_param = isset( $_GET[$param] ) || isset( $post_data[$param] );

    if (!$has_param || !is_user_logged_in())
        return FALSE;

    // $user = wp_get_current_user();
    $allowed_roles = array('editor', 'administrator', 'author');
    //$can_edit_post = current_user_can( 'edit_post', $wp_the_query->post->ID ); 
    $can_edit_publish = current_user_can('editor') || current_user_can('administrator') || current_user_can( 'edit_post', $wp_the_query->post->ID );

    return $can_edit_publish;
  }

	public static function is_vd_demo($must_be_embedded) {

	  $demo_pages = array('demo');
	  $slug = basename(strtok($_SERVER["REQUEST_URI"],'?'));
	  $is_demo_page = in_array($slug, $demo_pages);
	  // $is_home = empty( basename(strtok($_SERVER["REQUEST_URI"],'?')) );
	  $is_embedded = isset( $_GET['vd-embed'] ) || isset( $post_data['vd-embed'] );

	  if ($must_be_embedded)
	     return ($is_demo_page && $is_embedded);
	  else return ($is_demo_page && !$is_embedded);
	}

	private static function is_vd_editor_request() {
	  return self::is_vd_page('vd');
	}

	public static function is_vd_embedded_editor() {
	  return self::is_vd_page('vd-embed');
	}

	public static function is_editor_request_release() {
	  return self::is_vd_editor_request();
	}

	public static function is_editor_request_demo() {
	  return self::is_vd_editor_request() || self::is_vd_demo(FALSE);
	}

	public static function allow_editor_demo() {
	  return (self::is_vd_embedded_editor() || self::is_vd_demo(TRUE));
	}

	public static function allow_editor_release() {
	  return self::is_vd_embedded_editor();
	}


	public static function init_editor() {
    if (!call_user_func(['vD_Editor', VD_ALLOW_EDITOR]))
      return;

    // Remove 3rd party editor buttons.
		remove_all_actions('media_buttons', 999999);
		remove_all_actions('media_buttons_context', 999999);

		// Get the post.
		require_once ABSPATH . 'wp-admin/includes/post.php';

    global $wp_the_query;
		$post_id = (isset($wp_the_query->post) && isset($wp_the_query->post->ID)) ? $wp_the_query->post->ID : NULL;

		// Check to see if the post is locked.
		if (wp_check_post_lock($post_id) !== false) {
			header('Location: ' . admin_url('/post.php?post=' . $post_id . '&action=edit'));
            return;
		}
  }

	public static function render_editor($content) {
    if (!call_user_func(['vD_Editor', VD_ALLOW_EDITOR]))
        return $content;

    if (!vD_Post::is_vd_post() && (/*!defined(VD_DISABLE_INJECT) ||*/ !VD_DISABLE_INJECT)) {
      global $wp_the_query;
      $content = vD_Post::inject_vd($wp_the_query->post->ID, $content);
    }
    
    return $content;
  }

  public static function render_attribs() {
    if (!call_user_func(['vD_Editor', VD_ALLOW_EDITOR]))
        return;

    global $wp_the_query;
    $uVDNonce         = wp_create_nonce("update_visual_design");
    $doShortcodeNonce = wp_create_nonce("vd_do_shortcode");
    $theme            = wp_get_theme();
    $themeName        = $theme->get( 'Name' );
    $themeUrl         = $theme->get( 'ThemeURI' );
    $canLock          = (current_user_can('administrator') || current_user_can('editor')) ? 'true' : 'false';
    $systemDetails    = '<div class="vd-wp-attribs"><input class="vd-wp-input" data-type="vd-upload-nonce" type="hidden" vd-nonce="%s"/><input class="vd-wp-input" data-type="vd-shortcode-nonce" type="hidden" vd-nonce="%s"/><input class="vd-wp-input" data-type="vd-post-id" type="hidden" vd-post-id="%s"/><input class="vd-wp-input" data-type="vd-theme-name" type="hidden" value="%s"/><input class="vd-wp-input" data-type="vd-theme-url" type="hidden" value="%s"/><input class="vd-wp-input" data-type="vd-lock" type="hidden" value="%s"/></div>';

    echo sprintf($systemDetails, $uVDNonce, $doShortcodeNonce, $wp_the_query->post->ID, $themeName, $themeUrl, $canLock);
  }

  public static function embed_vd_callback($buffer) {
    global $wp;
    $id     = get_the_id();
    $custom = ['custom_head' => '', 'qry_params' => ['ts' => strtotime("now"), 'id' => $id]];
    if (has_filter('vd_embed_vd_callback'))
      $custom = apply_filters('vd_embed_vd_callback', $custom);

    $url        = home_url( $wp->request ) . "?vd-embed&" . http_build_query($custom['qry_params']);
    $svgUrl     = path_join(VD_LIB, 'lib/img/spinner.svg');
    $customHead = $custom['custom_head'];

    $jQueryFallback = "";
    try {
      $requiredFiles = ["js/jquery/jquery.js", "js/jquery/jquery-migrate.min.js", "js/jquery/ui/core.min.js", "js/jquery/ui/widget.min.js"];
      $includesDir = "";
      if (defined('WP_CONTENT_DIR'))
         $includesDir = str_replace('wp-content', 'wp-includes', WP_CONTENT_DIR);
      foreach ($requiredFiles as $path) {
        if (file_exists(path_join($includesDir, $path)))
          $jQueryFallback .= "<script type='text/javascript' src='" . includes_url($path) . "' id='jquery-core-js'></script>";
      }
    }
    catch (Exception $e) { }
    finally {
      if (empty($jQueryFallback))
        $jQueryFallback = "<script type=\"text/javascript\" src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js\"></script>";
    }

    $content = <<<MARKER
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"></meta>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no">
    <title>Visual Designer Editor</title>

    $customHead

    <script type="text/javascript">
      // console.time('initVdIframe');
      window.onload = function () {
        var loadTime = window.performance.timing.domContentLoadedEventEnd-window.performance.timing.navigationStart; 
        console.log('Page load time is '+ loadTime);
      }
    </script>
    <style type="text/css">
      .rotate { animation: rotation 2.5s infinite linear; -webkit-filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4)); filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4)); }
        @keyframes rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(359deg); }
        }

      .iframe-viewport {
        position: fixed; 
        width: 100%; 
        height: 100%; 
        overflow-y: scroll; 
        border: medium none; 
        top: 0; 
        left: 0; 
        right: 0; 
        margin: 0 auto; 
        visibility:hidden;
      }

      .iframe-scale {
        transform: scale(0.75) !important;
        -webkit-transform: scale(0.75) !important;
        -ms-transform: scale(0.75) !important;
        -moz-transform-origin: center top;
        -ms-transform-origin:  center top;
        -o-transform-origin: center top;
        -webkit-transform-origin:  center top;
        transform-origin: center top;
        will-change: transform;
        top: auto; 
        left: auto; 
        right: auto; 
        position: static;

        box-shadow: rgba(0,0,0,.4) 5px 10px 10px !important;
        overflow-x: visible !important;
        overflow-y: visible !important;
      }

      .vd-instructions,
      .vd-load-notif {
        width: 100%;
        text-align: center;
        margin-top: 100px;
        margin-bottom: 50px;
        color: #777;
        z-index: 99999;
        line-height: normal;
        font-family: Tahoma, Geneva, sans-serif;
      }

      .vd-load-notif {
        position: absolute;
        bottom: 5%;
        margin: 0 auto;
        z-index: auto;
      }

      .vd-instructions .vd-instr-heading {
        font-size: 32px;
        line-height: normal;
      }

      .vd-instructions .vd-instr-txt,
      .vd-load-notif .vd-instr-txt  {
        line-height: normal;
        display: block;
        font-size: 18px;
      }

      .vd-load-notif .vd-instr-txt {
        font-size: 16px;
      }
    </style>
  </head>
  <body style='margin: 0 auto; background-color: #f2f3fa'>
    <img id="vd-platform-loader" class="rotate" src="$svgUrl" style="height: 250px; left: 50%; margin-top: -125px; margin-left: -125px;position: absolute; top: 50%; width: 250px;"/>

    <div class="vd-instructions">
      <span class="vd-instr-heading"></span>
      <small class="vd-instr-txt"></small>
    </div>

    <div id="vd-load-notif" class="vd-load-notif">
      <small class="vd-instr-txt">Experiencing any issues using the front-end builder? Click <a href="https://www.visualdesigner.io/support?rel=wp" target="_blank">here</a> for help.</small>
    </div>

    <iframe id='vd-platform-view' class='iframe-viewport' pid='$id' src='$url' frameborder='0'></iframe>

    $jQueryFallback
  </body>
  </html>
MARKER;

      return $content; 
  }

  public static function buffer_start() { 
    if (call_user_func(['vD_Editor', VD_IS_EDITOR_REQUEST])) {
        ob_start("self::embed_vd_callback"); 
    }
  }

  public static function buffer_end() { 
    if (call_user_func(['vD_Editor', VD_IS_EDITOR_REQUEST])) {
      ob_end_flush(); 
      //while ( @ob_end_flush() );
    }
  }

  // AJAX Callbacks //
  public static function update_visual_design() {
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce( $_REQUEST['nonce'], "update_visual_design"))
      exit("No naughty business please");
    if (!is_user_logged_in())
      exit("User not logged in");

    $result = [
      'type'    => "failure",
      'message' => "Failed to update design."
    ];

    if (!self::can_process_request(3)) {
      error_log("update_visual_design called too frequently. Please wait before calling update_visual_design again.");
      $result['message']  = "";
      echo json_encode($result);
      die();
    }

    if (self::can_use_vd()) {
      $data = $_REQUEST["custom"]; // $data is sanitised on the below lines
      $purify = function(&$value, $key) {
        $value = vD_Post::html_purify($value); // uses wp_kses() to sanitise html
      };
      array_walk_recursive($data, $purify); 
      $data['vd_version'] = VD_VERSION;
      $post_id            = sanitize_text_field($_REQUEST["post_id"]);
      $content            = vD_Post::html_purify($_REQUEST["content"]); // uses wp_kses() to sanitise html
      $saveRes            = vD_Post::save($post_id, $content, $data);

      $result['type'] = ($saveRes) ? "Design Saved" : "Error occurred";
      $result['post_id'] = $post_id;
      $result['content'] = $content;
      $result['message'] = "Design updated";
    }
    else $result['message'] = "Your role does not allow you to edit posts/pages";

    // There is wp_send_json(); wp_send_json_success(); wp_send_json_error();
    $result = json_encode($result);
    echo $result;
    die();
  }

  public static function demo_update_visual_design() {
    exit("No naughty business please");
  }

  public static function vd_assign_template() {
    $result = [
      'type'    => "Failed",
      'message' => "Something went wrong"
    ];
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce( $_REQUEST['nonce'], "vd_do_shortcode"))
      exit("No naughty business please"); 
    if (!is_user_logged_in())
      exit("User not logged in");
    if (!self::can_process_request(1)) {
      error_log("vd_assign_template called too frequently. Please wait before calling vd_assign_template again.");
      $result['message']  = "Limit of 1 submission every 60 seconds. Please wait a minute before submitting again.";
      echo json_encode($result);
      die();
    }
    if (!isset($_REQUEST['tmpl_tag']) || !isset($_REQUEST['custom_post_type']) || !isset($_REQUEST['tmpl_id'])) {
      error_log("vd_assign_template: Missing parameters");
      $result['message']  = "Missing parameters";
      echo json_encode($result);
      die();
    }

    $custom_post  = esc_html($_REQUEST['custom_post_type']);
    $tmpl_tag     = esc_html($_REQUEST['tmpl_tag']);
    $tmpl_id      = esc_html($_REQUEST['tmpl_id']);
    $opt_name     = $tmpl_tag . '_' . $custom_post;
    
    $updateRes = update_option($opt_name, $tmpl_id, true);
    $result['type'] = 'success';
    // error_log("Update Res: $updateRes");
    // if (isset($updateRes)) {
    //   $result['type'] = 'success';
    // }

    $result = json_encode($result);
    echo $result;
    die();
  }

  public static function vd_get_web_ele_posts() {
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce($_REQUEST['nonce'], "vd_do_shortcode"))
      exit("No naughty business please");
    if (!is_user_logged_in())
      exit("User not logged in");
    
    $result = [
      'type'        => "success",
      'webElePosts' => [],
      'customPosts' => []
    ];

    $webElePosts = [];
    $webElePosts = array_merge( $webElePosts, get_posts([
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
    ]) );

    foreach ($webElePosts as $post) {
      array_push($result['webElePosts'], [
        'display'   => $post->post_title,
        'value'     => $post->ID,
        'template'  => get_post_meta($post->ID, 'vd_tmpl_type', true)
      ]);
    }

    // Get custom post names
    $customPosts = get_post_types(['public' => true], 'objects', 'and');

    foreach ($customPosts as $cp) {
      array_push($result['customPosts'], [
        'display'   => $cp->labels->singular_name,
        'value'     => $cp->name,
        'template'  => $cp->name
      ]);
    }

    $result = json_encode($result);
    echo $result;
    die();
  }

  public static function vd_get_custom_post_names() {
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce($_REQUEST['nonce'], "vd_do_shortcode"))
      exit("No naughty business please");
    if (!is_user_logged_in())
      exit("User not logged in");
    
    $result = [
      'type'  => "success",
      'names' => []
    ];
    $names = get_post_types(['public' => true], 'names', 'and');

    foreach ($names as $name) {
      array_push($result['names'], [
        'display'   => $name,
        'value'     => $name,
        'template'  => $name
      ]);
    }

    $result = json_encode($result);
    echo $result;
    die();
  }

  public static function vd_support_request() {
    $result = [
      'type'    => "Failed",
      'message' => ""
    ];
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce( $_REQUEST['nonce'], "vd_do_shortcode"))
      exit("No naughty business please"); 
    if (!is_user_logged_in())
      exit("User not logged in");
    if (!self::can_process_request(10)) {
      error_log("vd_support_request called too frequently. Please wait before calling vd_support_request again.");
      $result['message']  = "Limit of 1 submission every 60 seconds. Please wait a minute before submitting again.";
      echo json_encode($result);
      die();
    }
    
    $theme = wp_get_theme();
    $themeName = $theme->get('Name');
    $themeUrl = $theme->get( 'ThemeURI' );
    $environ = VD_ENVIRONMENT;
    $version = VD_VERSION;
    $url = get_home_url();
    global $wp_version;

    $data = [
      'action'      => 'support_request',
      'nonce'       => 'k522CtkMZRcusAmQ',
      'msg'         => 'Support Request',
      'environ'     => $environ,
      'version'     => $version,
      'url'         => $url,
      'themeName'   => $themeName,
      'themeUrl'    => $themeUrl,
      'vdEmail'     => esc_html($_REQUEST['vd-email']),
      'vdName'      => esc_html($_REQUEST['vd-name']),
      'vdSupportType' => esc_html($_REQUEST['vd-support-type']),
      'vdMsg'       => sanitize_textarea_field($_REQUEST['vd-message']),
      'platform'    => esc_html($_REQUEST['platform']),
      'os'          => esc_html($_REQUEST['os']),
      'useragent'   => esc_html($_REQUEST['useragent']),
      'phpVersion'  => esc_html(phpversion()),
      'wpVersion'   => esc_html($wp_version),
    ];
    try { 
      // If the user hasn't set up their email or worse disabled it I never get the support request!! Thus the need for the above code
      vD_Loader::url_post_contents('https://www.visualdesigner.io/dist/vd_support.php', $data); 
      $result['type']     = "success";
      $result['message']  = "Message successfully sent. We will be in contact soon.";
      error_log("Support message sent");
    } 
    catch (Exception $e) { 
      error_log("Failed to send vd_support");
      $result['message'] = "An error occurred sending request. Click <a href='https://www.visualdesigner.io/support?rel=wp' target='_blank'>here</a>."; 
    }

    // If the user hasn't set up their email or worse disabled it I never get the support request!! Thus the need for the above code
    // $message = "
    // <html>
    // <head>
    //   <title>vD Support Request</title>
    // </head>
    // <body>
    //   <p>Message:</p>
    //   <ul>
    //     <li><strong>Email:</strong> "             . esc_html($_REQUEST['vd-email'])         . "</li>
    //     <li><strong>Name:</strong> "              . esc_html($_REQUEST['vd-name'])          . "</li>
    //     <li><strong>Category:</strong> "          . esc_html($_REQUEST['vd-support-type'])  . "</li>
    //     <li><strong>Platform:</strong> "          . esc_html($_REQUEST['platform'])         . "</li>
    //     <li><strong>OS:</strong> "                . esc_html($_REQUEST['os'])               . "</li>
    //     <li><strong>User Agent:</strong> "        . esc_html($_REQUEST['useragent'])        . "</li>
    //     <li><strong>WordPress Version:</strong> " . esc_html(phpversion())                  . "</li>
    //     <li><strong>PHP Version:</strong> "       . esc_html($wp_version)                   . "</li>
        
    //     <li><strong>Environment:</strong>     $environ</li>
    //     <li><strong>Version:</strong>         $version</li>
    //     <li><strong>Url:</strong>             $homeUrl</li>
    //     <li><strong>Theme Name:</strong>      $themeName</li>
    //     <li><strong>Theme Url Type:</strong>  $themeUrl</li>

    //     <li><strong>Message:</strong> "   . sanitize_textarea_field($_REQUEST['vd-message']) . "</li>
    //   </ul>
    // </body>
    // </html>
    // ";

    // $emailResult =  wp_mail("contact@visualdesigner.io", "Support Request", $message, array('Content-Type: text/html; charset=UTF-8') );
    // error_log("Support request send res: $emailResult");

    $result = json_encode($result);
    echo $result;
    die();
  }

  // Shortcodes //
  public static function vd_do_shortcode() {
    if (!isset($_REQUEST['nonce']) || !wp_verify_nonce($_REQUEST['nonce'], "vd_do_shortcode"))
        exit("No naughty business please");
    if (!is_user_logged_in())
      exit("User not logged in");
    if (!self::can_process_request(2)) {
      error_log("vd_do_shortcode called too frequently. Please wait before calling vd_do_shortcode again.");
      exit("vd_do_shortcode called too frequently. Please wait before calling vd_do_shortcode again.");
    }
    
    $result = [
      'type'    => "failure",
      'message' => "Failed to execute shortcode. Is your shortcode syntax correct?",
      'data'    => do_shortcode(str_replace('\"', '"', $_REQUEST["shortcode"]), false) // existing sanitising functions will corrupt $_REQUEST["shortcode"] so its not used
    ];

    if (isset($_REQUEST["json_response_data"]))
        $result['data'] = json_decode( $result['data'] );
    if (isset($result['data'])) {
        $result['type']     = "success";
        $result['message']  = "Shortcode successfully executed.";
    }

    $result = json_encode($result); //, JSON_FORCE_OBJECT);
    echo $result;
    die();
  }

  public static function vd_get_post($atts) {
    $atts = shortcode_atts(array( 'id' => 0 ), $atts);

    $post_status = get_post_status($atts['id']);
    $post_type = get_post_type($atts['id']);
    if (in_array($post_status, ['trash',FALSE]))
      return '<p>Post in trash or invalid id</p>';
    if (!vD_Post::is_vd_compatible_post($post_type))
      return '<p>Cannot retrieve this type of post</p>';
    if (!is_user_logged_in() && $post_status != 'publish')
      return '<p>Post not published</p>';

    $post = get_post($atts['id']);
    return ($post) ? do_shortcode($post->post_content, true) : '<p>Post id invalid</p>';
  }

  public static function vd_create_post($atts) {
    $atts = shortcode_atts(array( 'name' => null, 'content' => null, 'vd_tmpl' => null, 'vd_gtmpl' => null, 'nonce' => null), $atts);
    $result = [
      'type'          => "failure",
      'post_id'       => null,
      'post_content'  => null
    ];

    if (!is_user_logged_in())
      return json_encode($result);
    if (!isset($atts['nonce']) || !wp_verify_nonce($atts['nonce'], "vd_do_shortcode")) {
      error_log("vd_create_post must have a valid nonce.");
      return json_encode($result);
    }
    if (!self::can_process_request(3, true, 'vd_last_exec_cp')) {
      error_log("vd_create_post called too frequently. Please wait before calling vd_create_post again.");
      return json_encode($result);
    }
    if (is_null($atts['name']))
      return json_encode($result);

    $name     = urldecode($atts['name']);
    $content  = (is_null($atts['content'])) ? false : urldecode($atts['content']);
    $type     = is_null($atts['vd_tmpl']) && is_null($atts['vd_gtmpl']) ? 'web_element' : 'wp_template';
    $tmpl     = is_null($atts['vd_gtmpl']) ? $atts['vd_tmpl'] : $atts['vd_gtmpl'];
    
    $id = vD_Post::create($name, $name, $content, $type, $tmpl);
    error_log("created id $id");
    $post = get_post($id);
    $result['type'] = "success";
    $result['post_id'] = $id;
    $result['post_content'] = ($post) ? do_shortcode($post->post_content, true) : '<p>Post id invalid</p>';
    return json_encode($result);
  }

  public static function vd_convert($atts) {
    $atts = shortcode_atts(array( 'c' => '', 'c_caller' => null, 'id' => null, 'tid' => null, 'ptype' => null, 'repeat' => null, 'strt' => null, 'end' => null, 'attr' => null, 'mid' => null, 'tmpl' => null ), $atts);
    $id = !is_null($atts['id']) ? $atts['id'] : get_the_id();
    try {
    if (empty($id))
      $id = get_option('page_on_front'); //vD_Post::get( vD_Post::VD_DEMO_PAGE, 'page' )->ID;

    // Check if vd_subtype = wp_template: set id to dummy data post
    $sub_type = get_post_meta($id, 'vd_tmpl_type', true);
    switch ($sub_type)
    {
      case 'vd_tmpl_page':
      {
        error_log("is page template");
        $id = vD_Post::get( vD_Post::VD_DEMO_PAGE, 'page' )->ID; 
      }
      break;
      case 'vd_tmpl_post':
      {
        error_log("is post template");
        $id = vD_Post::get( vD_Post::VD_DEMO_POST, 'post' )->ID; 
      }
      break;
      default: {} break;
    }
    // error_log("$sub_type, $id");

    switch (str_replace('&QUOT;', '', trim(strtoupper($atts['c'])))) {
      case 'T_C':
      {
        if (!isset($atts['c_caller'])) {
          error_log('vd_convert c="T_C" shortcode called with no c_caller specified. Must equal caller post id.');
          return "<!-- no c_caller param $sub_type -->";
        }
        else if ($id == intval($atts['c_caller'])) {
          error_log('vd_convert c="T_C" shortcode c property equals c_caller property. Must be different.');
          return "<!-- bad c_caller param $sub_type -->";
        }

        // NOTE: if you use this shortcode in the vd_header it throws an error:
        // Warning: count(): Parameter must be an array or an object that implements Countable in wp-includes\post-template.php on line 316
        $content = apply_filters('the_content', get_the_content(false, false, $id));
        return $content;
      }
      break;
      case 'T_T':
      {
        return get_the_title($id);
      }
      break;
      case 'S_T':
      {
        return get_bloginfo('name');
      }
      break;
      case 'S_T_L':
      {
        return get_bloginfo('description');
      }
      break;
      case 'S_U':
      {
        return get_bloginfo('url');
      }
      break;
      case 'P_L':
      {
        return get_the_permalink($id);
      }
      break;
      case 'S_B':
      {
        return vD_Post::get_vd_template_post_content($id, 'vd_tmpl_sidebar', '<p>Warning: VD Sidebar Post does not exist!</p>');;
      }
      break;
      case 'T_A':
      {
        return get_the_author_meta('display_name', get_post_field('post_author', $id));
      }
      break;
      case 'T_A_A':
      {
        return get_avatar_url( get_post_field('post_author', $id) );
      }
      break;
      case 'T_P_T':
      {
        return get_the_post_thumbnail_url($id);
      }
      break;
      case 'S_L':
      {
        $custom_logo_id = get_theme_mod('custom_logo');
        $image = wp_get_attachment_image_src($custom_logo_id , 'full');
        return ( is_null($image[0]) || empty($image[0])) ? path_join(plugin_dir_url( __FILE__ ), '../includes/img/logo.png') : $image[0];
      }
      break;
      case 'L_U':
      {
        return wp_login_url();
      }
      break;
      case 'R_P':
      {
        error_log(print_r($atts, true));
        if (!isset($atts['tid'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no tid param $sub_type -->";
        }
        if (!isset($atts['ptype'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no ptype param $sub_type -->";
        }
        // if (!isset($atts['repeat'])) {
        //   error_log('vd_convert repeater bad param');
        //   return "<!-- no repeat param $sub_type -->";
        // }
        if (!isset($atts['strt'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no strt param $sub_type -->";
        }
        if (!isset($atts['end'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no end param $sub_type -->";
        }
        
        $res = '';
        global $wp_query;
        // Check if already made a qry and dont reset
        $strt = urldecode($atts['strt']);
        $end = urldecode($atts['end']);
        $original_query = $wp_query;
        $wp_query = null;
        $wp_query = new WP_Query([
          'post_type'       => $atts['ptype'],
          'post_status'     => 'publish',
          'posts_per_page'  => isset($atts['repeat']) ? $atts['repeat'] : -1,
        ]);
        if ($wp_query->have_posts()) :
          while ( $wp_query->have_posts() ) : $wp_query->the_post();
            $res .= $strt;
            // if ( is_search() || ! is_singular() && get_theme_mod( 'blog_content', 'full' ) === 'summary' ) {
            //    $res .= apply_filters('the_exerpt', get_the_exerpt(false, false, $atts['tid']));
            // else 
            $res .= apply_filters('the_content', get_the_content(false, false, $atts['tid']));
            $res .= $end;
          endwhile;
        else:
            $res .= 'no posts found';
        endif;
        $wp_query = null;
        $wp_query = $original_query;
        wp_reset_postdata();

        // Consider set what post you were at
        // Consider record what kind of qry you made
        return $res;
      }
      break;
      case 'R_P2':
      {
        error_log(print_r($atts, true));
        // if (!isset($atts['tid'])) {
        //   error_log('vd_convert repeater bad param');
        //   return "<!-- no tid param $sub_type -->";
        // }
        if (!isset($atts['ptype'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no ptype param $sub_type -->";
        }
        if (!isset($atts['tmpl'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no tmpl param $sub_type -->";
        }
        
        $res = '';
        $tmpl = urldecode($atts['tmpl']);
        global $wp_query;
        // Check if already made a qry and dont reset
        $strt = urldecode($atts['strt']);
        $end = urldecode($atts['end']);
        $original_query = $wp_query;
        $wp_query = null;
        $wp_query = new WP_Query([
          'post_type'       => $atts['ptype'],
          'post_status'     => 'publish',
          'posts_per_page'  => isset($atts['repeat']) ? $atts['repeat'] : -1,
        ]);
        if ($wp_query->have_posts()) :
          while ( $wp_query->have_posts() ) : $wp_query->the_post();
            // $res .= do_shortcode($tmpl);
        $res .= apply_filters('the_content', $tmpl);
            // $res .= preg_replace('/(VDC_CONTENT)/', $content, $tmpl);
          endwhile;
        else:
            $res .= 'no posts found';
        endif;
        $wp_query = null;
        $wp_query = $original_query;
        wp_reset_postdata();

        // Consider set what post you were at
        // Consider record what kind of qry you made
        return $res;
      }
      break;
      case 'S_F':
      {
        return get_search_form(['echo' => false]); // return searchform post
      }
      break;
      case 'S_R':
      {
        error_log(print_r($atts, true));
        if (!isset($atts['tid'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no tid param $sub_type -->";
        }
        if (!isset($atts['ptype'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no ptype param $sub_type -->";
        }
        if (!isset($atts['strt'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no strt param $sub_type -->";
        }
        if (!isset($atts['end'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no end param $sub_type -->";
        }
        
        $res = '';
        // Check if already made a qry and dont reset
        $strt = urldecode($atts['strt']);
        $end = urldecode($atts['end']);
        if (have_posts()) :
          while ( have_posts() ) : the_post();
            $res .= $strt;
            // if ( is_search() || ! is_singular() && get_theme_mod( 'blog_content', 'full' ) === 'summary' ) {
            //    $res .= apply_filters('the_exerpt', get_the_exerpt(false, false, $atts['tid']));
            // else 
            $res .= apply_filters('the_content', get_the_content(false, false, $atts['tid']));
            $res .= $end;
          endwhile;
        else:
            $res .= 'no posts found';
        endif;
        wp_reset_postdata();

        // Consider set what post you were at
        // Consider record what kind of qry you made
        return $res;
      }
      break;
      case 'M_I': // menu items
      {
        error_log(print_r($atts, true));
        if (!isset($atts['mid'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no mid param $sub_type -->";
        }
        if (!isset($atts['tmpl'])) {
          error_log('vd_convert repeater bad param');
          return "<!-- no tmpl param $sub_type -->";
        }
        
        $res = '';
        $tmpl = urldecode($atts['tmpl']);
        $menuItems = wp_get_nav_menu_items($atts['mid']);
        error_log("%%%%%%%FOO");
        error_log(print_r($menuItems, true));

        if (!isset($menuItems))
          return "<!-- menu does not exist -->";

        foreach ($menuItems as $mItem) {
          error_log("running");
          error_log(print_r($mItem, true));
          if (isset($mItem->post_parent) && $mItem->post_parent != 0)
            continue;
          $anchor = preg_replace('/(VDC_HREF)/', $mItem->url, $tmpl);
          error_log("Building: $anchor");
          $anchor = preg_replace('/VDC_TITLE/m', $mItem->title, $anchor);
          $res .= $anchor;
        }

        return $res;
      }
      break;
      default:
      {
        return '<p>Error</p> ' . $atts['c'];
      }
      break;
    }

    }
    catch (Exception $ex) {
      error_log("vd_convert exception");
      error_log($ex->getMessage());
    }

    return '<p>Error</p>';
  }

  // Hooks //
  public static function define_public_hooks() {
    add_action( 'wp_enqueue_scripts', 'vD_Editor::enqueue_styles');
    add_action( 'wp_enqueue_scripts', 'vD_Editor::enqueue_scripts', 9999); 
    add_filter( 'body_class', 'vD_Editor::add_body_class' );

    if (is_user_logged_in()) {
      add_action( 'wp', 'vD_Editor::init_editor', 11);
      add_filter( 'the_content', 'vD_Editor::render_editor' );
      // add_action( 'wp_footer', 'vD_Editor::render_attribs', 9999);
      add_action( 'wp_ajax_update_visual_design', 'vD_Editor::update_visual_design' );
      add_action( 'wp_ajax_demo_update_visual_design', 'vD_Editor::demo_update_visual_design' );
      add_action( 'wp_ajax_vd_do_shortcode', 'vD_Editor::vd_do_shortcode' );
      add_action( 'wp_ajax_vd_get_vd_posts', 'vD_Editor::vd_get_web_ele_posts' );
      add_action( 'wp_ajax_vd_support_request', 'vD_Editor::vd_support_request' );
      add_action( 'wp_ajax_vd_assign_template', 'vD_Editor::vd_assign_template' );
      add_action('wp_loaded', 'vD_Editor::buffer_start');
      add_action('shutdown', 'vD_Editor::buffer_end');

      add_shortcode( 'vd_create_post', 'vD_Editor::vd_create_post' );
    }

    add_shortcode( 'vd_get_post', 'vD_Editor::vd_get_post' );
    add_shortcode( 'vd_convert', 'vD_Editor::vd_convert' );
   }

  public static function define_global_hooks() {
    // Stop wordpress wrapping comments or any breakline in <p> tags
    // remove_filter( 'the_content', 'wpautop' );
    // remove_filter( 'the_excerpt', 'wpautop' );

    self::fix_ob_end_flush();
  }

  public static function enqueue_styles() {
    if (call_user_func(['vD_Editor', VD_ALLOW_EDITOR])) {
      wp_enqueue_style( "vd-mat", 'https://fonts.googleapis.com/icon?family=Material+Icons', array(),VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
      wp_enqueue_style( "vd-fa", 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.1/css/all.min.css', array(), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
      // wp_enqueue_style( "vd-medium", path_join(VD_LIB, 'lib/css/vendor/medium-editor.min.css'), array(),VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
      wp_enqueue_style( "vd-release", path_join(VD_LIB, 'lib/css/visual-designer.min.css'), array('wp-mediaelement', 'wp-color-picker', "vd-mat", "vd-fa", /*"vd-medium"*/), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
    }
    else if (vD_Post::is_vd_post() || defined('VD_LOAD_RELEASE_FILES_ALWAYS') && VD_LOAD_RELEASE_FILES_ALWAYS) {
        wp_enqueue_style( "vd-mat", 'https://fonts.googleapis.com/icon?family=Material+Icons', array(),VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
        wp_enqueue_style( "vd-fa", 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.1/css/all.min.css', array(), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );

        wp_enqueue_style( "vd-release", path_join(VD_LIB, 'lib/css/visual-designer-release.min.css'), array("vd-mat", "vd-fa"), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );

        // // TODO: check if any existing designs are not upgraded
        // if (get_option('VD_SUPPORT_PRE_1_2', false))
        //   wp_enqueue_style( "vd-release-back-compat", path_join(VD_LIB, 'lib/css/vd-release-pre1.2.min.css'), array("vd-mat", "vd-fa"), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
    }

    if (is_user_logged_in())
        wp_enqueue_style( 'vd-bar-style', path_join(VD_LIB,  'lib/css/vd-public.css'), 0, VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), 'all' );
  }

  public static function enqueue_scripts() {
    if (self::is_vd_demo(TRUE)) {
      self::load_editor_scripts(/*path_join(VD_LIB, 'lib/js/vd-private.js')*/);
    }
    else if (self::is_vd_embedded_editor()) {
      self::load_editor_scripts(/*VD_INITIALISER*/); //path_join(VD_LIB,  'lib/js/vd-public.js'));
    }
    else if (vD_Post::is_vd_post() || defined('VD_LOAD_RELEASE_FILES_ALWAYS') && VD_LOAD_RELEASE_FILES_ALWAYS) {
      wp_enqueue_script( "visual-designer-js", path_join(VD_LIB, 'lib/js/visual-designer-release.min.js'), ['jquery-core', 'jquery-migrate', 'jquery-ui-core', 'jquery-ui-widget'], VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );
    }
  }

  public static function load_editor_scripts() {
    wp_enqueue_media();

    // wp_enqueue_script('vd-medium', path_join(VD_LIB, 'lib/js/vendor/medium-editor.min.js'), 0, VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true);

    wp_enqueue_script('iris', admin_url('js/iris.min.js'), 0, VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true);

    wp_enqueue_script( 'vd-colour-picker', path_join(VD_LIB, 'lib/js/vendor/vd-colour-picker.js'), array(
        // 'jquery', 
        'jquery-core', 
        'jquery-migrate', 
        'jquery-ui-core', 
        'jquery-ui-widget', 
        'jquery-ui-slider', 
        'jquery-ui-draggable',
        'jquery-ui-sortable',
        'jquery-touch-punch',  
        'iris',
        'wp-mediaelement',
        'media-upload',
        // 'vd-medium'
        ), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true);


    global $wp_the_query;
    $theme = wp_get_theme();
    $post_id = (isset($wp_the_query->post) && isset($wp_the_query->post->ID)) ? $wp_the_query->post->ID : NULL;
    $vdObj = [
      'post_id' => $post_id,
      'upload_nonce' => wp_create_nonce("update_visual_design"),
      'shortcode_nonce' => wp_create_nonce("vd_do_shortcode"),
      'theme_name' => $theme->get( 'Name' ),
      'theme_url' => $theme->get( 'ThemeURI' ),
      'can_lock' => (current_user_can('administrator') || current_user_can('editor')) ? 'true' : 'false',
      'ajax' => admin_url( 'admin-ajax.php' )
    ];

    wp_register_script( "visual-designer-js", path_join(VD_LIB, 'lib/js/visual-designer.js') /*path_join(VD_LIB, 'lib/js/visual-designer.min.js')*/);
    wp_localize_script( "visual-designer-js", 'vdObj', $vdObj); 
    wp_enqueue_script( "visual-designer-js", /*path_join(VD_LIB, 'lib/js/visual-designer.js')*/ path_join(VD_LIB, 'lib/js/visual-designer.min.js'), array('vd-colour-picker'), VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION), true );
    
    $obj = [];
    $obj = apply_filters('vd_load_editor_scripts', $obj);
  }

  public static function add_body_class($classes) {
    if (!self::is_vd_embedded_editor())
        return $classes;

    $classes[] = 'vd-wp-editor';
    return $classes;
  }

  public static function fix_ob_end_flush() {
    // BUG in NGINX?
    // Fix the following error ob_end_flush(): failed to send buffer of zlib output compression (1) in 
    // remove_action( 'shutdown', 'wp_ob_end_flush_all', 1 );
    // add_action( 'shutdown', function() {
    //    while ( @ob_end_flush() );
    // } );
  }
}

vD_Editor::initialise();
