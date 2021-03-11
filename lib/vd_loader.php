<?php

if (defined('VD_CLS_LOADER'))
  return;
define('VD_CLS_LOADER', true);

class vD_Loader {

  public static function load_dependencies($context, $environment, $version, $url, $path, $alwaysLoadBuilderFiles=false, $disableVdInject=false) {
    if (!self::can_load($context))
      return;

    if (!defined('VD_ENVIRONMENT'))
      define('VD_ENVIRONMENT', $environment); // BETA, DEMO, DEBUG, RELEASE
    if (!defined('VD_VERSION'))
      define('VD_VERSION', $version);
    if (!defined('VD_LIB'))
      define('VD_LIB', $url);
    if (!defined('VD_LOAD_RELEASE_FILES_ALWAYS'))
      define('VD_LOAD_RELEASE_FILES_ALWAYS', $alwaysLoadBuilderFiles);
    if (!defined('VD_DISABLE_INJECT'))
      define('VD_DISABLE_INJECT', $disableVdInject);
    if (!defined('VD_INITIALISER'))
      define('VD_INITIALISER', path_join(VD_LIB,  'lib/js/vd-public.js')); //($initialiser) ? $initialiser : path_join(VD_LIB,  'lib/js/vd-public.js'));

    if (!class_exists('vD_Post'))
      vD_Loader::load_php($context, path_join($path, 'lib/vd_post.php'));
    if (!class_exists('vD_Editor'))
      vD_Loader::load_php($context, path_join($path, 'lib/vd_editor.php'));
    if (!class_exists('vD_Editor_Admin'))
      vD_Loader::load_php($context, path_join($path, 'lib/vd_editor_admin.php'));
    if (!class_exists('Smart_Upgrader'))
      vD_Loader::load_php($context, path_join($path, 'lib/vendor/class-upper.php'));
  }

  public static function can_load($context) {
    $context = trim(strtoupper($context));
    return ($context == "PLUGIN" ||
            $context == "THEME" && !self::is_vd_plugin_active() ||
            /*$context == "ADDON" &&*/ !self::is_vd_plugin_active() && !self::is_vd_theme_active());
  }

  public static function vd_declare($context, $name, $value=true) {
    if (self::can_load($context) && !defined($name))
      define($name, $value);
  }

  public static function load_style($context, $handle, $src, $deps=[], $ver=false, $media='all') {
    if (self::can_load($context))
      wp_enqueue_style($handle, $src, $deps, $ver, $media);
  }

  public static function load_script($context, $handle, $src, $deps=[], $ver=false, $in_footer=false) {
    if (self::can_load($context))
      wp_enqueue_script($handle, $src, $deps, $ver, $in_footer);
  }

  public static function load_php($context, $path) {
    if (self::can_load($context))
      require_once($path);
  }

  public static function is_vd_plugin_active() {
    require_once(ABSPATH . 'wp-admin/includes/plugin.php');
    return is_plugin_active('vd/vd.php');
  }

  public static function is_vd_theme_active() {
     return wp_get_theme()->name == 'Theme-Builder';
  }

  public static function is_vd_addon_active($path) {
    require_once(ABSPATH . 'wp-admin/includes/plugin.php');
    return is_plugin_active($path);
  }

  public static function url_post_contents($url, $data) {
    if (function_exists('curl_exec')) { 
      $conn = curl_init($url);
      // error_log(http_build_query($data));
      curl_setopt($conn, CURLOPT_POST, 1);
      curl_setopt($conn, CURLOPT_POSTFIELDS, http_build_query($data));
      curl_setopt($conn, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
      curl_setopt($conn, CURLOPT_SSL_VERIFYPEER, 0);
      curl_setopt($conn, CURLOPT_SSL_VERIFYHOST, 0);
      curl_setopt($conn, CURLOPT_HEADER, 0);
      curl_setopt($conn, CURLOPT_NOSIGNAL, 1);
      curl_setopt($conn, CURLOPT_RETURNTRANSFER, 1);
      // curl_setopt($conn, CURLOPT_TIMEOUT, 3);
      $response = curl_exec($conn);
      curl_close($conn);
    } else if (function_exists('file_get_contents')) {
      $options = array(
        'http' => array(
          'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
          'method'  => 'POST',
          'content' => http_build_query($data),
        )
      );
      $context  = stream_context_create($options);
      $response = file_get_contents($url, false, $context);
    } 
    /*else if (function_exists('fopen') && function_exists('stream_get_contents')) {
      $handle = fopen ($url, "r");
      $url_get_contents_data = stream_get_contents($handle);
    }*/ 
    else {
      $response = false;
    }
    return $response;
  } 
}