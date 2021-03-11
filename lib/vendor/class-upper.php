<?php  
/**
* Smart Plugin/Theme Upgrader
* 
* Sometimes the native plugin/theme upgrader does not work. 
* This class solved many problems for us.
* 
* @author Tor Morten Jensen <tormorten@smartmedia.no>
*/

if (defined('VD_CLS_UPPER'))
	return;
define('VD_CLS_UPPER', true);

if (class_exists('Smart_Upgrader', false))
	return;
    
class Smart_Upgrader {

	/**
	 * The download URL
	 *
	 * @var string
	 **/
	public $url = '';


	public $update_check_url = '';

	/**
	 * The plugin slug
	 *
	 * @var string
	 **/
	public $slug = '';

	/**
	 * The path where zip file is being saved
	 *
	 * @var string
	 **/
	public $file_path = '';

	/**
	 * The path to the directory of the plugin
	 *
	 * @var string
	 **/
	public $dir_path = '';

	/**
	 * The plugin name (for WordPress)
	 *
	 * @var string
	 **/
	public $plugin = '';
	
	/**
	 * Sets the variables to be used
	 *
	 * @return void
	 **/
	public function __construct($slug, $update_check_url, $cur_version, $distribution) {
		$this->slug 						= $slug;
		$this->update_check_url = $update_check_url;
		$this->file_path 				= $this->join_paths(array(WP_CONTENT_DIR, 'plugins', $slug . '.zip'));
		$this->dir_path 				= $this->join_paths(array(WP_CONTENT_DIR, 'plugins', $slug));
		$this->out_dir 					= $this->join_paths(array(WP_CONTENT_DIR, 'plugins'));
		$this->plugins_path 		= $this->join_paths(array(WP_CONTENT_DIR, 'plugins')) . '/';
		$this->tmp_path 				= $this->join_paths(array(WP_CONTENT_DIR, 'plugins', wp_unique_filename($this->plugins_path, $this->join_paths(array($slug)) . '_tmp')));
		$this->plugin 					= $this->join_paths(array($slug, $slug . '.php'));
		$this->current_version 	= $cur_version;
		$this->distribution 		= $distribution; // RELEASE, BETA, DEMO, THEME
	}

	public static function initialise() {

	}

	private function join_paths() {
    $args = func_get_args();
    $paths = array();
    foreach ($args as $arg) {
        $paths = array_merge($paths, (array)$arg);
    }

    $paths = array_map(function($p) {
    		return trim($p, "/");
    	}, $paths);
    $paths = array_filter($paths);
    $result = join('/', $paths);

    // This function removes the first '/' which is needed for Unix/Linux
    if (substr(func_get_arg(0)[0], 0, 1) === "/")
    	$result = "/" . $result;

    return $result;
	}

	public function upgrade($url='') {
		if (!empty($url))
			$this->url = $url;

		$res = $this->download_native();
		if (!$res) {
			error_log("Failed at download");
			$this->rollback();
			return false;
		}
		error_log('download complete');

		$res = $this->unpack_native();
		if (!$res) {
			error_log("Failed at unpacking");
			$this->rollback();
			return false;
		}
		error_log('unpack complete');

		$res = $this->clean();
		if (!$res) {
			error_log("Failed at cleaning");
			$this->rollback();
			return false;
		}
		error_log('clean complete');

		return true;
	}

	private function download_native() {
		error_log("Dest: $this->file_path");
		if (file_exists($this->file_path)) {
			$res = unlink( $this->file_path );
			if (!$res) {
				error_log("Failed deleting existing zip prior to download");
			}
			else error_log('deleted existing zip prior to download');
		}

		$data = $this->url_get_contents($this->url); //file_get_contents($this->url);
		return file_put_contents($this->file_path, $data);
	}

	private function url_get_contents($url) {
    if (function_exists('curl_exec')) { 
      $conn = curl_init($url);
      // curl_setopt($conn, CURLOPT_SSL_VERIFYPEER, true);
      // curl_setopt($conn, CURLOPT_FRESH_CONNECT,  true);
      // curl_setopt($conn, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($conn, CURLOPT_SSL_VERIFYPEER, true);
      curl_setopt($conn, CURLOPT_FRESH_CONNECT,  true);
      curl_setopt($conn, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($conn, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
      curl_setopt($conn, CURLOPT_SSL_VERIFYPEER, 0);
      curl_setopt($conn, CURLOPT_SSL_VERIFYHOST, 0);
      $url_get_contents_data = (curl_exec($conn));
      curl_close($conn);
    } else if (function_exists('file_get_contents')) {
    	$url_get_contents_data = file_get_contents($url);
    } else if (function_exists('fopen') && function_exists('stream_get_contents')) {
      $handle = fopen ($url, "r");
      $url_get_contents_data = stream_get_contents($handle);
    } else {
      $url_get_contents_data = false;
    }
		return $url_get_contents_data;
	} 

	public function url_post_contents($url, $data) {
    if (function_exists('curl_exec')) { 
      $conn = curl_init($url);
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

	private function unpack_native() {
		// Rename existing plugin to temp name
		// wp_delete_file
		$res = rename($this->dir_path, $this->tmp_path);
		if (!$res) {
			error_log("Failed at renaming existing directory to tmp name");
			$this->rollback();
			return false;
		}
		error_log('rename complete');

		// Technique 1
		// $path = escapeshellarg($this->file_path);
		// $out = escapeshellarg($this->out_dir);
		// system("unzip -qq $path -d $out");
		// if (!$res) {
		// 	error_log("Failed at unzipping");
		// 	$this->rollback();
		// 	return false;
		// }
		// error_log('unzip complete');

		// Technique 2
		$zip = new ZipArchive;
		if ($zip->open($this->file_path) === TRUE) {
		    $zip->extractTo($this->out_dir);
		    $zip->close();
		    error_log("unzip complete");
		} else {
			error_log("Failed at unzipping");
			$this->rollback();
			return false;
		}

		return true;
	}

	private function rollback() {
		$funcRes = true;

		if (file_exists( $this->file_path )) {
			$res = unlink( $this->file_path );
			if (!$res) {
				error_log("Failed at rolling back; removal of zip");
				$funcRes = false;
			}
		}
		error_log('remove zip complete');

		if (is_dir($this->tmp_path)) {
			// Delete existing
			if (is_dir($this->dir_path)) {
				$res = $this->rmdir($this->dir_path);
				if (!$res) {
					error_log("Failed at removing directory 2");
					$this->rollback();
					return false;
				}
			}

			// rename back to orginal
			$res = rename($this->tmp_path, $this->dir_path);
			if (!$res) {
				error_log("Failed at renaming existing directory from tmp name back to original");
				$funcRes = false;
			}
		}
		error_log('rollback rename complete');

		return $funcRes;
	}

	private function clean() {
		$funcRes = true;

		if (file_exists( $this->file_path )) {
			$res = unlink( $this->file_path );
			if (!$res) {
				error_log("Failed at rolling back; removal of zip");
				$this->rollback();
				$funcRes = false;
			}
		}
		error_log('clean remove zip complete');
		
		if (is_dir($this->tmp_path)) {
			$res = $this->rmdir($this->tmp_path);
			if (!$res) {
				error_log("Failed at deletion of existing plugin dir");
				$this->rollback();
				$funcRes = false;
			}
		}
		error_log('clean remove orginal complete');

		return $funcRes;
	}

	/**
	 * Activates the current instance, specific for plugins.
	 *
	 * @return boolean Depending of the result
	 **/
	public function activate() {
		$current = get_option('active_plugins');
    $plugin = $this->plugin;

    if(!in_array($plugin, $current)) {
      $current[] = $plugin;
      sort($current);
      do_action('activate_plugin', trim($plugin));
      update_option('active_plugins', $current);
      do_action('activate_'.trim($plugin));
      // do_action('activated_plugin', trim($plugin)); // Can cause an error for Ninja Plugins so don't call
      return true;
    }
    else return false;
	}

	/**
	 * Recursive deletes the current instances directory
	 *
	 * @return boolean Depending of the result
	 **/

	private function rmdir($dir) {
    $dir = str_replace('\\', '/', $dir);
		if (is_dir($dir)) { 
			$objects = scandir($dir); 
			foreach ($objects as $object) { 
				if ($object != "." && $object != "..") { 
					if (filetype($dir."/".$object) == "dir") $this->rmdir($dir."/".$object); else unlink($dir."/".$object); 
				} 
			} 
			reset($objects); 
			rmdir($dir); 
			return true;

			// system('rm -rf -- ' . escapeshellarg($dir), $retval); // linux
			// if ($retval != 0) {
			// 	error_log("Failed first rmdir"); 
			// 	system('rd ' . escapeshellarg($dir) . ' /S /Q', $retval); // windows
			// }
			// return true; //$retval == 0;
			// require_once(ABSPATH . 'wp-admin/includes/class-wp-filesystem-base.php');
			// require_once(ABSPATH . 'wp-admin/includes/class-wp-filesystem-direct.php');
			// $fs = new WP_Filesystem_Direct();
			// return $fs->rmdir($dir, true);
		} 

		return false;
	}

	/**
	 * 
	 *
	 * @return boolean Depending of the result
	 **/
	public function needs_update($force_check) {
		// Check when last check was done.
		if (!$force_check && !$this->can_check_for_update())
			return FALSE;

		// $ch = curl_init($this->update_check_url);
  	// curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  	// $data = curl_exec($ch);
  	// curl_close($ch);

    $data = $this->url_get_contents($this->update_check_url); //file_get_contents($this->update_check_url);

    // Record time this check was done
    $time = time();
		$utcTime = $time + date("Z", $time);
	  update_option('vd_update_check_timestamp', $utcTime, true);
	    
    $obj = json_decode($data, true);

    $this->url = $obj[$this->distribution]['url'];

    return (floatval($obj[$this->distribution]['version']) > floatval($this->current_version));
	}


	public function can_check_for_update() {
		$lastCheck = get_option('vd_update_check_timestamp');
		
		if (!isset($lastCheck))
			return true;

		$time = time();
		$utcTime = $time + date("Z", $time);
		$minutesSinceLastCheck = round(abs($lastCheck - $utcTime) / 60, 2);

		return $minutesSinceLastCheck > 120;
	}
}

/**
* Theme Upgrader
* 
* Uses most of the same functionality as the plugin upgrader
* 
* @author Tor Morten Jensen <tormorten@smartmedia.no>
*/

// if (method_exists('Smart_Upgrader_Theme', 'initialise'))
//     return;
if (class_exists('Smart_Upgrader_Theme', false))
	return;

class Smart_Upgrader_Theme extends Smart_Upgrader {
	
	public function __construct( $url, $slug, $cur_version, $distribution ) {
		$this->url 							= $url;
		$this->slug 						= $slug;
		// $this->file_path 				= WP_CONTENT_DIR . '/themes/' . $slug . '.zip';
		// $this->dir_path 				= WP_CONTENT_DIR . '/themes/' . $slug . '/';
		// $this->out_dir 					= WP_CONTENT_DIR . '/themes';
		$this->file_path 				= $this->join_paths(array(WP_CONTENT_DIR, 'themes', $slug . '.zip'));
		$this->dir_path 				= $this->join_paths(array(WP_CONTENT_DIR, 'themes', $slug)) . '/';
		$this->tmp_path 				= $this->join_paths(array(WP_CONTENT_DIR, 'themes', $slug)) . '_tmp';
		$this->out_dir 					= $this->join_paths(array(WP_CONTENT_DIR, 'themes'));
		$this->plugin 					= $slug;
		$this->current_version 	= $cur_version;
		$this->distribution 		= $distribution; // RELEASE, BETA, DEMO, THEME
	}

	public static function initialise() {

	}

	public function activate() {
	    $plugin = $this->plugin;
	    switch_theme( $plugin );
	    return true;
	}
}

?>