<?php 
$logoPath     = path_join(plugin_dir_url( __FILE__ ), '../img/logo.png');
$ausSvg       = path_join(plugin_dir_url( __FILE__ ), '../img/australia.svg');
$home         = add_query_arg('vd', 0, home_url());
$homePost     = add_query_arg('tmpl', 'vd_tmpl_header', add_query_arg('sel', 'hide-content', $home));
$headerPost   = add_query_arg('tmpl', 'vd_tmpl_header', $home);
$footerPost   = add_query_arg('tmpl', 'vd_tmpl_footer', $home);
$helpSubmit   = add_query_arg('sel', 'support', $home);
$updateCheck  = 'admin-post.php?action=vd_mhf_update_check';
$rateLink     = 'https://wordpress.org/support/plugin/vd-my-header-footer/reviews?filter=5#new-post';
$wizardPage   = esc_url_raw( add_query_arg( 'page', vD_My_Header_Footer::VD_MHF_ROOT_SLUG.'-setup', admin_url( 'admin.php' ) ) ); 
?>

<!-- VisualDesigner BEGIN -->
<div class="vd-release">
  <style type="text/css" vd-assoc="rvdid-378">
    #wpcontent {
      padding-left: 0px !important;
    }

    #wpbody,
    #wpwrap {
      background-color: #e4f4fb !important;
    }

    #wpbody-content {
      position: relative !important;
    }

    .vd-release {
      position: absolute !important;
      width: 100% !important;
      left: 0px !important;
      top: 0px !important;
      z-index: 100 !important;
    }

    img {
      max-width: 100%;
      vertical-align: bottom;
    }

    a {
      color: #444;
      text-decoration: none;
    }

    a:hover {
      color: #444;
    }

    a:focus {
      outline: 0;
    }

    a:hover,
    a:active {
      outline: 0;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      word-wrap: break-word;
      font-weight: 700;
      letter-spacing: -0.02em;
      font-family: inherit;
      line-height: 1.1;
      color: inherit;
    }

    h1 small,
    h2 small,
    h3 small,
    h4 small,
    h5 small,
    h6 small {
      font-weight: normal;
      line-height: 1;
      color: #777777;
    }

    h1,
    h2,
    h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }

    h4,
    h5,
    h6 {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    h1 {
      font-size: 36px;
    }

    h2 {
      font-size: 30px;
    }

    h3 {
      font-size: 24px;
    }

    h4 {
      font-size: 18px;
    }

    h5 {
      font-size: 14px;
    }

    h6 {
      font-size: 12px;
    }

    h3 {
      margin-bottom: 30px;
    }

    p {
      color: rgb(61, 61, 61);
      font-family: Tahoma, Geneva, sans-serif;
      line-height: normal;
      font-size: 17px;
      margin: 7px 0px;
    }

    #rvdid-262-12 {
      text-align: left;
    }

    #rvdid-262-46 {
      padding-bottom: 60px;
    }

    .vd-img-widget > img {
      width: 51%;
    }

    .vd-icon-widget > i {
      line-height: normal;
      font-size: 184px;
    }

    .vd-video-widget > video {
      width: 73%;
    }

    .vd-btn-widget {
      text-align: center;
    }

    .vd-btn-widget > a {
      display: inline-block;
      background-color: rgb(186, 186, 186);
      padding: 10px 20px;
      border-radius: 2px;
      color: rgb(255, 255, 255);
      font-weight: bold;
      border-style: solid;
      border-color: rgb(255, 255, 255);
      border-width: 1px;
    }

    #rvdid-262-10 {
      padding: 40px 10px 10px;
    }

    #rvdid-262-4 {
      text-align: center;
    }

    #rvdid-262-1 {
      background-color: rgb(234, 31, 105);
      color: rgb(255, 255, 255);
    }

    #rvdid-262 {
      margin: 0px;
    }

    #rvdid-378-39 {
      border-style: solid;
      border-color: rgb(211, 224, 232);
      border-width: 2px 2px 0px 0px;
      border-radius: 5px;
      text-align: center;
      padding: 30px;
      background-color: rgb(255, 255, 255);
    }

    #rvdid-378-29 {
      text-align: center;
    }

    #rvdid-378-6 {
      margin: -75px 0px 0px;
    }

    #rvdid-378-26 {
      color: #e41b51;
    }

    #rvdid-378-24 {
      padding: 5px;
    }

    #rvdid-378-21 {
      color: #e41b51;
      line-height: normal;
      font-size: 55px;
    }

    #rvdid-378-4 {
      border-style: solid;
      border-color: rgb(211, 224, 232);
      border-width: 2px 2px 0px 0px;
      border-radius: 5px;
      text-align: center;
      padding: 30px;
      background-color: rgb(255, 255, 255);
    }

    #rvdid-378-11 {
      color: rgb(86, 86, 86);
      margin: 15px 0;
    }

    #rvdid-378-9 {
      background-color: rgba(255, 255, 255, 0.5);
      width: 20%;
    }

    #rvdid-378-5 {
      border-style: solid;
      border-color: rgb(211, 224, 232);
      border-width: 2px 2px 0px 0px;
      border-radius: 5px;
      text-align: center;
      padding: 30px;
      background-color: rgb(255, 255, 255);
    }

    #rvdid-378-2 {
      padding: 80px 20px 20px;
    }

    #rvdid-378-1 {
      color: rgb(169, 156, 156);
      background-color: rgb(228, 244, 251);
      padding-bottom: 35px;
    }

    #rvdid-378 {
      color: rgb(93, 79, 79);
    }

    .vd-settings-content {
      min-height: 60px;
    }

    .vd-contact-support {
      position: fixed;
      left: 15px;
      bottom: 15px;
      z-index: 9999;
      text-align: left;
      color: #888;
    }

    .vd-update-check {
      position: fixed;
      right: 15px;
      bottom: 15px;
      z-index: 9999;
      text-align: right;
      color: #888;
    }

    .vd-made-in {
      position: absolute;
      left: 15px;
      bottom: 15px;
      z-index: 9998;
      text-align: left;
      color: #e41b51;
      font-size: 13px !important;
    }

    .vd-made-in * {
      display: inline;
    }

    .vd-made-in img {
      height: 20px;
      display: inline;
      vertical-align: middle;
    }

    .vd-ref-link,
    .vd-update-check a {
      color: #e41b51;
    }

    .vd-m-row {
      padding: 20px;
    }

    .vd-support-btn {
      text-align: center;
    }

    .vd-support-btn a {
      display: block;
      text-decoration: none;
      white-space: nowrap;
      padding: 0.5em 1em;
      display: inline-block;
      zoom: 1;
      vertical-align: middle;
      background-color: #e41b51 !important;
      color: #fff !important;
      margin: 1px !important;
      position: relative !important;
      vertical-align: top !important;
      box-shadow: rgba(0, 0, 0, 0.4) 0 1px 3px;
      padding: 11px 30px;
    }

    @media (max-width: 414px) {
      #rvdid-378-10 {
        text-align: center;
      }
      #rvdid-378-4 {
        text-align: left;
      }
      #rvdid-378-29 {
        text-align: left;
      }
    }
  </style>
  <div
    data-type="visual-designer"
    designer-type="runningDesigner"
    data-framework="wpmenuFramework"
    vd-tag-name="Orientation"
    vd-post-id="378"
    class="vd-structural-widget vd-widget vd-running-designer vd-main vd-container-fluid vd-row-container"
    id="rvdid-378"
  >
    <div class="vd-update-check">
      <a href="<?php echo $updateCheck; ?>">Check for updates &nbsp;</a>
      <span><?php echo (defined('VD_ADDON_MHF_VERSION') ? VD_ADDON_MHF_VERSION:''); echo '&nbsp;'; echo (defined('VD_ADDON_MHF_PRO_VERSION') ? VD_ADDON_MHF_PRO_VERSION:''); ?></span>
      <br />
      <a href="<?php echo $helpSubmit; ?>" target="_blank"><span>Contact support</span></a>
    </div>

    <div class="vd-made-in">
      <span>Made in</span>
      <img src="<?php echo $ausSvg; ?>" alt="Australia" />
    </div>

    <section class="vd-section-widget vd-row-container vd-structural-widget vd-widget" id="rvdid-378-1">
      <div class="vd-section-container vd-container-fluid">
        <div class="vd-row-widget vd-structural-widget vd-widget" id="rvdid-378-2" style="max-width: 800px;">
          <div class="vd-structural-widget vd-widget pure-u-lg-24-24 pure-u-md-24-24 pure-u-24-24 vd-column-widget vd-row-container vd-content-widget" id="rvdid-378-5" desktop-width="12" tablet-width="12" mobile-width="12" vd-lock="false">
            <div class="vd-container-widget vd-content-widget vd-row-container vd-widget" id="rvdid-378-6" vd-lock="false">
              <div id="rvdid-378-7" class="vd-widget vd-img-widget" vd-lock="false"><img class="vd-img-full-w" alt="tB" id="rvdid-378-9" src="<?php echo $logoPath; ?>" vd-width="23" /></div>
            </div>
            <div class="vd-text-widget vd-widget" id="rvdid-378-10" vd-text-type="h3" vd-lock="false">
              <h3 id="rvdid-378-11" class="">
                <span>Welcome to My Header Footer<br /></span>
              </h3>
            </div>
            <?php if (!defined('VD_ADDON_MHF_PRO_VERSION')): ?>
            <h2 class="vd-support-btn" style="text-align: center;"><a href="https://www.visualdesigner.io/my-header-footer#pricing" target="_blank">Go PRO</a></h2>
            <p style="margin-top: 15px; margin-bottom: 25px;">Get the Pro version of My Header Footer and take complete control over your header and footer with <strong>24+ more features and benefits.</strong></p>
            <?php endif; ?>

            <br />
            <a class="vd-ref-link" href="<?php echo $rateLink; ?>" target="_blank"><span>Please rate us and give feedback :)</span></a>
          </div>
        </div>
        <div class="vd-m-row vd-row-widget vd-structural-widget vd-widget" id="rvdid-378-3" style="max-width: 800px;">
          <div class="vd-structural-widget vd-widget pure-u-lg-24-24 pure-u-md-24-24 pure-u-24-24 vd-column-widget vd-row-container vd-content-widget" id="rvdid-378-4" desktop-width="12" tablet-width="12" mobile-width="12">
            <div class="vd-text-widget vd-widget" id="rvdid-378-10" vd-text-type="h3" style="padding: 0;">
              <h3 id="rvdid-378-11">
                <span>Setup Checklist<br /></span>
              </h3>
            </div>
            <div class="vd-text-widget vd-widget" id="rvdid-378-40" vd-text-type="p" style="display: block; padding: 0; padding-bottom: 25px;">
              <p id="rvdid-378-41">
                <span>Perform the below steps to build your own header and/or footer.<br /></span>
              </p>

              <!-- 
              <br/>
              <a class="vd-ref-link" href="<?php echo $wizardPage; ?>" style="margin-top: 15px; display: block; font-weight: 700;"><span>Run setup wizard</span></a> 
              -->
            </div>
            <br />
            <div class="vd-row-widget vd-structural-widget vd-widget" id="rvdid-378-16">
              <div class="vd-structural-widget vd-widget pure-u-lg-12-24 pure-u-md-12-24 pure-u-24-24 vd-column-widget vd-row-container vd-content-widget" id="rvdid-378-36" desktop-width="6" tablet-width="6" mobile-width="12">
                <div class="vd-container-widget vd-content-widget vd-row-container vd-widget" id="rvdid-378-37">
                  <a href="<?php echo $homePost; ?>" target="_blank" class="tb-link">
                    <span class="vd-icon-widget vd-widget" id="rvdid-378-20"><i class="material-icons" id="rvdid-378-21" vd-font-units="px">remove_from_queue</i></span>
                    <div class="vd-container-widget vd-content-widget vd-row-container vd-widget" id="rvdid-378-24">
                      <div class="vd-text-widget vd-widget" id="rvdid-378-25" vd-text-type="h4">
                        <h4 id="rvdid-378-26">
                          <span>Hide Theme Header &amp; Footer<br /></span>
                        </h4>
                      </div>
                      <div class="vd-settings-content vd-text-widget vd-widget" id="rvdid-378-27" vd-text-type="p">
                        <p id="rvdid-378-28">
                          <span>
                            Remove your themes default header &amp;/or footer.
                            <br />
                            <small>Note removal is completely optional, you can keep your existing theme header/footer.</small><br />
                          </span>
                        </p>
                      </div>
                    </div>
                  </a>
                  <!-- <a href="https://youtube.com" target="_blank"><small>Quick Demo</small></a> -->
                </div>
              </div>
              <div class="vd-structural-widget vd-widget pure-u-lg-12-24 pure-u-md-12-24 pure-u-24-24 vd-column-widget vd-row-container vd-content-widget" id="rvdid-378-36" desktop-width="6" tablet-width="6" mobile-width="12">
                <div class="vd-container-widget vd-content-widget vd-row-container vd-widget" id="rvdid-378-37">
                  <a href="<?php echo $headerPost; ?>" target="_blank" class="tb-link">
                    <span class="vd-icon-widget vd-widget" id="rvdid-378-20"><i class="material-icons" id="rvdid-378-21" vd-font-units="px"></i></span>
                    <div class="vd-container-widget vd-content-widget vd-row-container vd-widget" id="rvdid-378-24">
                      <div class="vd-text-widget vd-widget" id="rvdid-378-25" vd-text-type="h4">
                        <h4 id="rvdid-378-26">
                          <span>Design the Header<br /></span>
                        </h4>
                      </div>
                      <div class="vd-settings-content vd-text-widget vd-widget" id="rvdid-378-27" vd-text-type="p">
                        <p id="rvdid-378-28">
                          <span>Start building your website's header.<br /></span>
                        </p>
                      </div>
                    </div>
                  </a>
                  <!-- <a href="https://youtube.com" target="_blank"><small>Quick Demo</small></a> -->
                </div>
              </div>
              <div class="vd-structural-widget vd-widget pure-u-lg-12-24 pure-u-md-12-24 pure-u-24-24 vd-column-widget vd-row-container vd-content-widget" id="rvdid-378-34" desktop-width="6" tablet-width="6" mobile-width="12">
                <div class="vd-container-widget vd-content-widget vd-row-container vd-widget" id="rvdid-378-35">
                  <a href="<?php echo $footerPost; ?>" target="_blank" class="tb-link">
                    <span class="vd-icon-widget vd-widget" id="rvdid-378-20"><i class="material-icons" id="rvdid-378-21" vd-font-units="px"></i></span>
                    <div class="vd-container-widget vd-content-widget vd-row-container vd-widget" id="rvdid-378-24">
                      <div class="vd-text-widget vd-widget" id="rvdid-378-25" vd-text-type="h4">
                        <h4 id="rvdid-378-26">
                          <span>Design the Footer<br /></span>
                        </h4>
                      </div>
                      <div class="vd-settings-content vd-text-widget vd-widget" id="rvdid-378-27" vd-text-type="p">
                        <p id="rvdid-378-28"><span>Start building your website's footer.</span></p>
                      </div>
                    </div>
                  </a>
                  <!-- <a href="https://youtube.com" target="_blank"><small>Quick Demo</small></a> -->
                </div>
              </div>
            </div>
            <a class="vd-ref-link" href="<?php echo $rateLink; ?>" target="_blank"><span>Please rate us and give feedback :)</span></a>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
<!-- VisualDesigner END -->
