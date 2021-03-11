<?php

if (defined('VD_CLS_POST'))
  return;
define('VD_CLS_POST', true);

class vD_Post {

    const VD_BEGIN_SIGNATURE = '<!-- VisualDesigner BEGIN -->';

    const VD_END_SIGNATURE = '<!-- VisualDesigner END -->';

    const VD_POST_TAG = 'vd-post-id';

    private static $VD_VALID_POST_TYPES = array('post', 'page', 'vd_posts', 'vd_posts_private');

    // Post Sub-Types //
    const VD_GENERAL_NAME = "";

    const VD_WEB_ELE_NAME = "web_element";

    const VD_WP_TEMPLATE_NAME = "wp_template";

    const VD_PRIVATE_NAME = "private";

    const VD_BASE_HTML = "<div vd-type='vd-designer' data-type='visual-designer' vd-post-id='%s' vd-focus='true'></div>";

    const VD_GENERAL_TEMPLATE = "<!-- VisualDesigner BEGIN -->
<div class='vd-release'>
<div vd-type='vd-designer' data-type='visual-designer' vd-designer-name='UNDEFINED' vd-post-id='UNDEFINED'></div>
</div>
<!-- VisualDesigner END -->";

    const VD_WP_TEMPLATE = "<!-- VisualDesigner BEGIN -->
<div class='vd-release'>
<div data-type='visual-designer' data-framework='wpmenuFramework' vd-designer-name='UNDEFINED' vd-post-id='UNDEFINED' vd-tmpl='UNDEFINED' designer-type='runningDesigner' vd-type='running-designer'>
<section class='vd-section-widget vd-row-container vd-structural-widget vd-widget ui-sortable' vd-type='section'>
    <div class='vd-section-container vd-container-fluid'>
        <div class='vd-row-widget vd-structural-widget vd-widget ui-sortable vd-widget-hover' vd-type='row'>
            <div class='vd-structural-widget vd-widget pure-u-lg-24-24 pure-u-md-24-24 pure-u-24-24 vd-column-widget vd-row-container vd-content-widget ui-sortable vd-force-dimensions vd-widget-selected' vd-type='column' desktop-width='12' tablet-width='12' mobile-width='12'>
                
            </div>
        </div>
    </div>
</section>
</div>
</div>
<!-- VisualDesigner END -->";

    const VD_WP_CONTENT_TEMPLATE = "<!-- VisualDesigner BEGIN -->
<div class='vd-release'>
<div data-type='visual-designer' data-framework='wpmenuFramework' vd-designer-name='UNDEFINED' vd-post-id='UNDEFINED' vd-tmpl='UNDEFINED' designer-type='runningDesigner' vd-type='running-designer'>
<section class='vd-section-widget vd-row-container vd-structural-widget vd-widget ui-sortable' vd-type='section'>
    <div class='vd-section-container vd-container-fluid'>
        <div class='vd-row-widget vd-structural-widget vd-widget ui-sortable vd-widget-hover' vd-type='row'>
            <div class='vd-structural-widget vd-widget pure-u-lg-24-24 pure-u-md-24-24 pure-u-24-24 vd-column-widget vd-row-container vd-content-widget ui-sortable vd-force-dimensions vd-widget-selected' vd-type='column' desktop-width='12' tablet-width='12' mobile-width='12'>
                    <div class='vd-container-widget vd-content-widget vd-row-container vd-widget vd-force-dimensions' vd-type='container' id='rvdid-9999-1' wp-code='T_C'>[vd_convert c=\"T_C\"]</div>
            </div>
        </div>
    </div>
</section>
</div'
</div>
<!-- VisualDesigner END -->";

    const VD_WEB_ELE_TEMPLATE = "<!-- VisualDesigner BEGIN -->
<div class='vd-release'>
<div vd-type='vd-designer' data-type='visual-designer' designer-type='runningDesigner' data-framework='wpmenuFramework' vd-designer-name='UNDEFINED' vd-post-id='UNDEFINED'></div>
</div>
<!-- VisualDesigner END -->";


    // TEMPLATES //
    const VD_GLOBAL_STYLE_POST = 'vd_global_style_post';
    const VD_GLOBAL_STYLE_POST_TITLE = 'Global Styling';

    const VD_GLOBAL_STYLE_POST_PRIV = 'vd_global_style_post_private';
    const VD_GLOBAL_STYLE_POST_TITLE_PRIV = 'Global Styling Private';

    const VD_HEADER_POST = 'vd_header_post';
    const VD_HEADER_POST_TITLE = 'Main Header';

    const VD_FOOTER_POST = 'vd_footer_post';
    const VD_FOOTER_POST_TITLE = 'Main Footer';

    const VD_404_POST = 'vd_404_post';
    const VD_404_POST_TITLE = '404 Page Not Found';

    const VD_POST_TMPL = 'vd_post';
    const VD_POST_TMPL_TITLE = 'Post Template';

    const VD_PAGE_TMPL = 'vd_page';
    const VD_PAGE_TMPL_TITLE = 'Page Template';

    const VD_ARCHIVES_TMPL = 'vd_archives';
    const VD_ARCHIVES_TMPL_TITLE = 'Archives Template';

    const VD_SEARCH_TMPL = 'vd_search';
    const VD_SEARCH_TMPL_TITLE = 'Search Results Template';

    const VD_POST_SMRY_TMPL = 'vd_post_smry';
    const VD_POST_SMRY_TMPL_TITLE = 'Post Summary Template';

    const VD_SIDEBAR_POST = 'vd_sidebar';
    const VD_SIDEBAR_POST_TITLE = 'Sidebar';

    const VD_SEARCH_FORM_POST = 'vd_search_form';
    const VD_SEARCH_FORM_TITLE = 'Search Form';

    const VD_DEMO_POST = 'vd_demo_post';
    const VD_DEMO_POST_TITLE = 'Demo Post';

    const VD_DEMO_PAGE = 'vd_demo_page';
    const VD_DEMO_PAGE_TITLE = 'Demo Page';

    const VD_DEMO_HOME = 'vd_demo_home';
    const VD_DEMO_HOME_TITLE = 'Demo Home';
    // END TEMPLATES //

    public static function initialise() {
        //error_log("vd_post loaded from plugin");
    }

    public static function is_vd_compatible_post($post_type) {
      return in_array($post_type, self::$VD_VALID_POST_TYPES);
    }

    public static function is_vd_post() {
      global $wp_the_query;
      $hasVd = (isset($wp_the_query->post->ID)) ? get_post_meta($wp_the_query->post->ID, 'uses_visual_designer', true) : false;
      return $hasVd;
    }


    public static function register_vd_post_type() {
        // Set UI labels for Custom Post Type
        $labels = array(
            'name'                => _x( 'Template', 'Post Type General Name', 'vd' ),
            'singular_name'       => _x( 'Template', 'Post Type Singular Name', 'vd' ),
            'menu_name'           => __( 'Theme Templates', 'vd' ),
            'parent_item_colon'   => __( 'Parent Template', 'vd' ),
            'all_items'           => __( 'Templates', 'vd' ),
            'view_item'           => __( 'View Template', 'vd' ),
            'add_new_item'        => __( 'Add New Template', 'vd' ),
            'add_new'             => __( 'Add New', 'vd' ),
            'edit_item'           => __( 'Edit Template', 'vd' ),
            'update_item'         => __( 'Update Template', 'vd' ),
            'search_items'        => __( 'Search Template', 'vd' ),
            'not_found'           => __( 'Not Found', 'vd' ),
            'not_found_in_trash'  => __( 'Not found in Trash', 'vd' ),
        );
         
            // Set other options for Custom Post Type
        $args = array(
            'label'               => __( 'vd_posts', 'vd' ),
            'description'         => __( 'Visual Designer custom posts', 'vd' ),
            'labels'              => $labels,
            'supports'            => array( 'title', 'revisions', 'author', 'thumbnail', 'excerpt', /*'editor', 'comments', 'custom-fields',*/ ),
            'taxonomies'          => array( 'vd_posts' ),
            'hierarchical'        => false,
            'public'              => true,
            'show_ui'             => true,
            // 'show_in_menu'        => true,
            'show_in_menu'        => false, //'visual-designer',
            'show_in_nav_menus'   => false, //true,
            'show_in_admin_bar'   => false, //true,
            'show_in_rest'        => true,
            'query_var'           => true,
            'menu_position'       => 5,
            'can_export'          => false, //true,
            'has_archive'         => true,
            'exclude_from_search' => true,
            'publicly_queryable'  => true,
            'capability_type'     => 'page',
            // 'rest_base'              => 'vdpost',
            // 'rest_controller_class'  => 'WP_REST_Posts_Controller',
        );
         
        // Registering your Custom Post Type
        register_post_type( 'vd_posts', $args );

        if (is_user_logged_in()) {
            add_action('save_post', 'vD_Post::on_save', 10, 3);
            add_action('pre_get_posts', 'vD_Post::filter_vd_posts', 1);
            add_filter('manage_vd_posts_posts_columns','vD_Post::filter_vd_posts_columns');
            add_action('manage_posts_custom_column','vD_Post::action_custom_columns_content', 10, 2 );
        }
    }

    public static function filter_vd_posts($query) {
        if ( !$query->is_main_query() || !is_post_type_archive('vd_posts'))
            return;

        $query->set( 'meta_query', array(
            array(
             'key'      => 'vd_sub_type',
             'value'    => vD_Post::VD_PRIVATE_NAME,
             'compare'  => '!='
            ),
        ) );
    }

    public static function create($post_name, $post_title, $content=false, $sub_type=false, $tmpl_type=false, $base_type='vd_posts', $post_status='publish') {
        $tmpl_type = trim(strtolower($tmpl_type));
        switch (trim(strtolower($sub_type) ))
        {
            case 'web_element':
            {
                $content = ($content) ? $content : self::VD_WEB_ELE_TEMPLATE; 
            }
            break;
            case 'wp_template':
            {
                $def_content = in_array($tmpl_type, ['vd_tmpl_page', 'vd_tmpl_post']) ? self::VD_WP_CONTENT_TEMPLATE : self::VD_WP_TEMPLATE;
                $content = ($content) ? $content : $def_content; 
                $content = preg_replace('/(vd-tmpl=(\\\"|\\\'|\"|\')(.*?)(\\\"|\\\'|\"|\'))/im', "vd-tmpl='$tmpl_type'", $content);
                $content = preg_replace('/(vd-gtmpl=(\\\"|\\\'|\"|\')(.*?)(\\\"|\\\'|\"|\'))/im', "vd-gtmpl='$tmpl_type'", $content);
            }
            break;
            case 'private':
            {
                //$content = ($content) ? $content : VD_WP_TEMPLATE; 
                $content = preg_replace('/(vd-tmpl=(\\\"|\\\'|\"|\')(.*?)(\\\"|\\\'|\"|\'))/im', "vd-tmpl='$tmpl_type'", $content);
                $content = preg_replace('/(vd-gtmpl=(\\\"|\\\'|\"|\')(.*?)(\\\"|\\\'|\"|\'))/im', "vd-gtmpl='$tmpl_type'", $content);
            }
            break;
            //case 'general':
            default:
            {
                $content = ($content) ? $content : self::VD_GENERAL_TEMPLATE; 
            }
            break;
        }

        $vdVersion = 1.2;

        error_log("Creating $post_name, $post_status");
        $id = wp_insert_post(array(
          'post_name'     => $post_name,
          'post_title'    => $post_title,
          'post_content'  => $content,
          'post_type'     => $base_type, //'vd_posts',
          'post_status'   => $post_status,
          'meta_input'    => array(
            'uses_visual_designer' => true,
            'vd_sub_type'          => $sub_type,
            'vd_tmpl_type'         => $tmpl_type,
            'vd_version'           => $vdVersion  
          )
        ));

        global $wp_version;
        if (version_compare($wp_version, '4.4.0', '<')) {
            update_post_meta($id, 'uses_visual_designer', true);
            update_post_meta($id, 'vd_sub_type', $sub_type);
            update_post_meta($id, 'vd_tmpl_type', $tmpl_type);
            update_post_meta($id, 'vd_version', $vdVersion);
        }

        return $id;
    }

    public static function inject_vd($post_id, $content) {
        return sprintf("$content". self::VD_BASE_HTML, $post_id);
    }

    public static function integrity_check($post_name, $post_type='vd_posts', $post_status=array('publish', 'pending', 'draft', 'future', 'private')) {
        $post = self::get($post_name, $post_type, $post_status);
        // $postId = post_exists($post_title, '', '', $post_type);
        
        // if ($postId == 0)
        if (!isset($post)) {
            error_log("no set");
            return false;
        }

        $post_id                = $post->ID;
        // $post                   = get_post($postId);
        $postContent            = $post->post_content;
        $postIntegrityContent   = get_post_meta($post_id, 'vd_integrity', true);

        // Handle case where integrity value is not there?
        if (empty($postIntegrityContent)) 
            return $post_id;
        if (strcmp($postContent, $postIntegrityContent) == 0)
            return $post_id;

        // Fails integrity check: a plugin, theme or USER has editted and potentially corrupted the post content: why dude?
        self::save($post_id, $postIntegrityContent, array('overwrite_all' => true));
        return $post_id;
    }

    public static function get($post_name, $post_type='vd_posts', $post_status=array('publish', 'pending', 'draft', 'future', 'private')) {
        $posts = get_posts( array( 
            'name'              => $post_name, 
            'post_type'         => $post_type,
            'posts_per_page'    => 1,
            'post_status'       => $post_status,    // any except trash or auto-draft
            // 'perm'              => 'readable'       // VERY IMPORTANT SO we can find DRAFT posts when user not logged in!!!
        ));

        return (is_null($posts) || count($posts) <= 0) ? null : $posts[0];
    }

    public static function get_vd_template_post($id, $tmpl_tag) {
      $postId = get_post_meta($id, $tmpl_tag, true);
      
      if (empty($postId) || in_array(get_post_status($postId), ['trash',FALSE])) {
        // Lookup wp_option
        return self::get_vd_template_post_type($id, $tmpl_tag);
      }
      
      return get_post($postId);
    }

    public static function get_vd_template_post_content($id, $tmpl_tag, $fallback_content) {
      $post = self::get_vd_template_post($id, $tmpl_tag);
      if (empty($post))
        return $fallback_content;
      // must wrap twice to do the shortcodes in the post content
      return do_shortcode( do_shortcode($post->post_content) );
    }

    public static function get_vd_template_post_type($id, $tmpl_tag) {
      if (!isset($tmpl_tag))
        return self::get_vd_global_template_post($tmpl_tag);

      $postType = (!get_post_type($id)) ? 'page' : get_post_type($id);
      $optName = $tmpl_tag . '_' . $postType;
      $postId = get_option($optName);
      error_log("****************** $optName, $postId," . get_post_type($id));
      
      if (empty($postId) || in_array(get_post_status($postId), ['trash',FALSE])) {
        return self::get_vd_global_template_post($tmpl_tag);
      }

      return get_post($postId);
    }

    public static function get_vd_global_template_post($tmpl_tag) {
      $postId = get_option($tmpl_tag);
      
      if (empty($postId) || in_array(get_post_status($postId), ['trash',FALSE])) {
        return false;
      }

      return get_post($postId);
    }

    public static function get_vd_global_template_post_content($tmpl_tag) {
      $post = self::get_vd_global_template_post($tmpl_tag);
      if (empty($post))
        return "undefined";
      // must wrap twice to do the shortcodes in the post content
      return do_shortcode( do_shortcode($post->post_content) );
    }

    public static function get_content($post_name, $default) {
        $post = vD_Post::get($post_name);
        return do_shortcode( (is_null($post)) ? $default : $post->post_content );
    }

    public static function on_save($post_id, $post, $update) {
        if (get_post_type($post_id) != 'vd_posts' 
            && !get_post_meta($post_id, 'uses_visual_designer', true))
            return;

        // MUST AVOID ININITE LOOP
        remove_action( 'save_post', 'vD_Post::on_save');
        self::save($post_id, $post->post_content, ['no_revision'=>!$update, 'is_create'=>!$update]);
        add_action('save_post', 'vD_Post::on_save', 10, 3);
    }

    public static function save($post_id, $content, $data) {
        $post               = get_post($post_id);
        $existingContent    = $post->post_content;
        $alreadyHsVd        = get_post_meta($post_id, 'uses_visual_designer', true);
        $content            = self::sanitise($post_id, $content, $post->post_title);
        $isCreate           = (isset($data["is_create"]))   ? $data["is_create"]    : false;
        $status             = (isset($data["post_status"])) ? $data["post_status"]  : $post->post_status; //($isCreate) ? 'draft':'publish';
        $vdVersion          = (isset($data["vd_version"]))  ? $data["vd_version"]   : 1.2;

        if (!isset($data["no_revision"]) || !$data["no_revision"])
            wp_save_post_revision($post_id);
        
        $sub_type = get_post_meta($post_id, 'vd_sub_type', true);
        if (!isset($content) || trim($content) === '') {
            $sub_type = 'general';
        }
        switch (trim(strtolower($sub_type) ))
        {
            case 'web_element':
            {
                $content = self::save_web_element_post($post_id, $content, $post->post_title, $data); 
            }
            break;
            case 'wp_template':
            {
                $content = self::save_wp_template_post($post_id, $content, $post->post_title, $data); 
            }
            break;
            case 'private':
            {
                $content = self::save_private_post($post_id, $content, $post->post_title, $data); 
            }
            break;
            //case 'general':
            default:
            {
                
            }
            break;
        }

        // Just write content as is and overwrite all existing post_content
        if (isset($data["overwrite_all"])) {
            // $content = $content;
        }
        // Get post content and update VD
        else if ($alreadyHsVd) {
            $beginVd = strpos($existingContent, self::VD_BEGIN_SIGNATURE);
            $endVd = strrpos($existingContent, self::VD_END_SIGNATURE) + strlen(self::VD_END_SIGNATURE); // get last occurence
            $content = substr_replace($existingContent, $content, $beginVd, $endVd - $beginVd);

            // TODO: check if shebangs found at all
        }
        else {
            $content = $existingContent . $content;
        }

        error_log("Saving $post_id, $status");
        wp_update_post(array(
          'ID'              => $post_id,
          'post_content'    => $content,
          'post_status'     => $status,
          'meta_input'      => array(
            'uses_visual_designer' => true,
            'vd_integrity'         => $content,
            'vd_version'           => $vdVersion
          )
        ));

        global $wp_version;
        if (version_compare($wp_version, '4.4.0', '<')) {
            update_post_meta($post_id, 'uses_visual_designer', true);
            update_post_meta($post_id, 'vd_integrity', $content);
            update_post_meta($post_id, 'vd_version', $vdVersion);
        }
        
        return true;
    }

    private static function save_web_element_post($post_id, $content, $post_title, $data) {
        // WARNING: to use must specify number of arguments as 4 like so:
        //  add_filter('vd_save_web_element_post' 'myCallback', $priority=25, 4); // ie 4 arguments
        apply_filters('vd_save_web_element_post', $content,  $post_id, $post_title, $data);

        return $content;
    }

    private static function save_wp_template_post($post_id, $content, $post_title, $data) {
        // Page/post templates must have a content
        $tmpl = trim(strtolower(get_post_meta($post_id, 'vd_tmpl_type', true)));
        if ($tmpl == 'vd_tmpl_page' || $tmpl == 'vd_tmpl_post') {
            
        }

        // Update global style template
        if (isset($data["global_style"])) {
            $glbStyleId = self::get(self::VD_GLOBAL_STYLE_POST_PRIV)->ID;
            self::save($glbStyleId, $data["global_style"], []);
            error_log('saving glb style');
        }

        // Set the main posts template; eg page 'XYZ' can use header template 'ABC'
        if (isset($data['main_post_id']) && isset($data['vd_tmpl']) && intval($data['main_post_id']) != intval($post_id)) {
            update_post_meta($data['main_post_id'], $data['vd_tmpl'], $post_id);
        }
        // Set the global template; eg the (global) 404 page is this post
        if (isset($data['vd_gtmpl'])) {
            update_option($data['vd_gtmpl'], $post_id);
        }

        // WARNING: to use must specify number of arguments as 4 like so:
        //  add_filter('vd_save_web_element_post' 'myCallback', $priority=25, 4); // ie 4 arguments
        apply_filters('vd_save_wp_template_post', $content,  $post_id, $post_title, $data);
        
        return $content;
    }

    private static function save_private_post($post_id, $content, $post_title, $data) {
        // Set the main posts template; eg page 'XYZ' can use header template 'ABC'
        if (isset($data['main_post_id']) && isset($data['vd_tmpl']) && intval($data['main_post_id']) != intval($post_id)) {
            update_post_meta($data['main_post_id'], $data['vd_tmpl'], $post_id);
        }
        // Set the global template; eg the (global) 404 page is this post
        if (isset($data['vd_gtmpl'])) {
            update_option($data['vd_gtmpl'], $post_id);
        }

        // WARNING: to use must specify number of arguments as 4 like so:
        //  add_filter('vd_save_web_element_post' 'myCallback', $priority=25, 4); // ie 4 arguments
        apply_filters('vd_save_private_post', $content,  $post_id, $post_title, $data);

        return $content;
    }

    public static function sanitise($post_id, $content, $post_title) {
        $content = preg_replace('/(vd-post-id[\s]?=[\s]?(\\\"|\\\'|\"|\').*?(\\\"|\\\'|\"|\'))/im', "vd-post-id='$post_id'", $content);
        // $content = preg_replace('/(vd-assoc[\s]?=[\s]?(\\\"|\\\'|\"|\').*?(\\\"|\\\'|\"|\'))/im', "vd-assoc='$post_id'", $content);
        $content = preg_replace('/(vd-designer-name[\s]?=[\s]?(\\\"|\\\'|\"|\').*?(\\\"|\\\'|\"|\'))/im', "vd-designer-name='$post_title'", $content);
        $content = preg_replace('/(\[vd_convert)\s(c[\s]?=[\s]?(\\\"|\\\'|\"|\')(T_C?)(\\\"|\\\'|\"|\'))/im', "[vd_convert c=\"T_C\" c_caller=\"$post_id\" ", $content);

        $content = preg_replace('/(”|″|’)/im', '"', $content);

        // WARNING only handles 1 occurrence of < or >, if more occur it wont replace them
        // Replace occurrences of > or < that are inside "" quotes
        $content = preg_replace('/(vd-style-identifier[\s]?=[\s]?[\\\"|\\\'|\"|\'][^\"\']*?)>(.*?[\\\"|\\\'|\"|\'])/im', "$1&gt;$2", $content); 
        // $content = preg_replace('/(vd-style-identifier=[\\\"|\\\'|\"|\'].*?)<(.*?[\\\"|\\\'|\"|\'])/im', "$1&lt;$2", $content);

        return $content;
    }

    public static function html_purify($html) {
        if (empty(self::$HTML_FILTER)) {
            foreach (self::$HTML_TAGS as $tag)
                self::$HTML_FILTER[$tag] = self::$HTML_ATTRIBS;
            self::$HTML_FILTER = array_merge_recursive(wp_kses_allowed_html('post'), self::$HTML_FILTER);
        }
        return wp_kses($html, self::$HTML_FILTER);
    }

    public static function on_activate() {
        // $posts = get_posts( array( 
        //     'meta_query', array(
        //         array(
        //          'key'      => 'uses_visual_designer',
        //          'value'    => true,
        //          'compare'  => '='
        //         ),
        //     )
        // ));

        // if (is_null($posts) || count($posts) <= 0)
        //     return;

        // foreach ($posts as $post) {
        //     // Update content so VD shortcodes ONLY are now NOT in comments
        // } 
    }

    public static function on_deactivate() {
        // $posts = get_posts( array( 
        //     'meta_query', array(
        //         array(
        //          'key'      => 'uses_visual_designer',
        //          'value'    => true,
        //          'compare'  => '='
        //         ),
        //     )
        // ));

        // if (is_null($posts) || count($posts) <= 0)
        //     return;

        // foreach ($posts as $post) {
        //     // Update content so VD shortcodes ONLY are now in comments
        // } 
    }

    public static function filter_vd_posts_columns( $columns ) {
        // $columns['vd_sub_type']     = 'Type';
        $columns['vd_tmpl_type']    = 'Template';
        return $columns;
    }

    public static function action_custom_columns_content( $column_id, $post_id ) {
        switch( $column_id ) { 
            // case 'vd_sub_type': 
            // {
            //     $subtype = get_post_meta($post_id, 'vd_sub_type', true);
            //     switch ($subtype)
            //     {
            //         case 'wp_template':     { echo 'WP Template'; } break;
            //         case 'web_element':     { echo 'Template'; } break;
            //         case 'private':         { echo 'Private Template'; } break;
            //         default:                { echo 'Generic'; } break;
            //     }
            // }
            // break;
            case 'vd_tmpl_type': 
            {
                $tmpl = get_post_meta($post_id, 'vd_tmpl_type', true);

                switch ($tmpl)
                {
                    case 'vd_tmpl_header':          { echo 'Header Template'; } break;
                    case 'vd_tmpl_footer':          { echo 'Footer Template'; } break;
                    case 'vd_tmpl_post':            { echo 'Post Template'; } break;
                    case 'vd_tmpl_page':            { echo 'Page Template'; } break;
                    case 'vd_tmpl_sidebar':         { echo 'Sidebar Template'; } break;
                    case 'vd_tmpl_public_style':    { echo 'Global Style'; } break;
                    default:                        { echo 'Generic Template'; } break;
                }
            }
            break;
            default: 
            break;
       }
    }

  private static $HTML_ATTRIBS = [
    'vd-post-id' => 1,  'vd-designer-name' => 1,    'data-framework' => 1,
    'vd-tmpl' => 1,    'vd-width' => 1,    'vd-height' => 1,    'designer-type' => 1,    'name' => 1,
    'vd-type' => 1,    'vd-tag-name' => 1,    'desktop-width' => 1, 'tablet-width' => 1,  'vd-lh-units' => 1,   'mobile-width' => 1,    'data-type' => 1,    'type' => 1,
    'vd-dynamic' => 1,    'vd-style-identifier' => 1,    'vd-link' => 1, 'vd-assoc' => 1,    'href' => 1,    'alt' => 1,
    'src' => 1,    'a' => 1,    'style' => 1,    'vd-framework' => 1, 'alt' => 1, 'for' => 1,    'vd-icon' => 1,    'vd-text-type' => 1,    'wp-code' => 1,
    'vd-font-units' => 1,    'target' => 1,    'rel' => 1, 'class' => 1,    'id' => 1, 'vd-a' => 1,    'contenteditable' => 1, 'controls' => 1, 'autoplay' => 1, 'allowfullscreen' => 1, 'assoc' => 1, 'pid' => 1, 'vd-focus' => 1, 'vd-shortcode' => 1, 'role' => 1, 'vd-gtmpl' => 1, 'vd-nonce' => 1, 'vd-lock' => 1, 'vd-preserve' => 1, 'value' => 1, 'vd-ts' => 1, 'vd-version' => 1, 'onclick' => 1, 'onmouseup' => 1, 'post_status' => 1, 'vd-target' => 1, 'vd-renderer' => 1, 'vd-drag' => 1, 'vd-interval' => 1
  ];  // 'data-scope' => 1,

  private static $HTML_TAGS = [
    'a',    'audio',    'hr',
    'button',    'p',    'h1',
    'h2',    'h3',    'h4',
    'h5',    'h6',    'b' ,
    'i' ,    'br',    'footer',
    'header',    'nav',    'img',
    'video',    'label',    'span',
    'section',    'small',    'strong',
    'input',    'table',    'u',
    'div',    'style',    'vdwp',
    'style',    'source' 
  ];

  private static $HTML_FILTER = [];
}

vD_Post::initialise();