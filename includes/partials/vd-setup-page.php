<?php 
  $logoPath     = path_join(plugin_dir_url( __FILE__ ), '../img/logo.png');
  $hImg         = path_join(plugin_dir_url( __FILE__ ), '../img/header.svg');
  $fImg         = path_join(plugin_dir_url( __FILE__ ), '../img/footer.svg');
  $hfImg        = path_join(plugin_dir_url( __FILE__ ), '../img/header-footer.svg');
  $ausSvg       = path_join(plugin_dir_url( __FILE__ ), '../img/australia.svg');
  $tmplDir      = 'https://www.visualdesigner.io/wp-content/uploads/templates/'; //path_join(plugin_dir_url( __FILE__ ), 'templates');
  $wizardSubmit = 'admin-post.php?action=vd_mhf_wizard_submit';
  $cacheToken   = VD_VERSION.'-'.get_option('VD_CACHE_TIME', VD_VERSION);
  $home         = home_url();
  $vdHome       = add_query_arg('vd-embed', 0, add_query_arg('mhf_auto_hide', 0, $home));

  function vdmhfRenderProTemplateAnchor($previewImgPath, $id, $tmplType) {
    if (defined('VD_ADDON_MHF_PRO_SLUG')) {
      echo "<a class=\"vd-tmpl-img\" href=\"javascript:selectTemplate($id, '$tmplType')\"><img class=\"lazy\" data-src=\"$previewImgPath\"/></a>";
    }
    else {
      echo "<a class=\"vd-tmpl-img vd-pro\" href=\"https://www.visualdesigner.io/my-header-footer#pricing\" target=\"_blank\"><img class=\"lazy\" data-src=\"$previewImgPath\"/></a>";
    }
  }

  function vdmhfGetTemplateImg($id, $tDir, $cToken) {
    return path_join($tDir, "$id.jpg?v=$cToken");
  }
?>

<script src="https://cdn.jsdelivr.net/npm/vanilla-lazyload@17.3.0/dist/lazyload.min.js"></script>
<style type="text/css">
    #adminmenumain {
        display: none !important;
    }

    #wpfooter {
        display: none !important;
    }

    #wpbody-content,
    #wpcontent {
        margin: 0 !important;
        padding: 0 !important;
    }

    .vd-release {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        background: #fff !important;
        width: 100% !important;
        z-index: 99998;
    }

    .vd-section-container {
        max-width: 1500px !important;
    }

    .vd-update-check {
        position: absolute;
        right: 15px;
        bottom: 15px;
        z-index: 9998;
        text-align: right;
        color: #e41b51;
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

    #rvdid-29 {
        background: rgba(0, 0, 0, 0) radial-gradient(99.03% 307.87% at 8.34% 24.3%, rgba(228, 31, 81, 0.5) 0%, rgba(255, 109, 63, 0.5) 100%) repeat scroll 0% 0%;
        min-height: 100vh;
    }

    .vd-next-btn,
    .vd-skip-btn,
    .vd-run-btn,
    .vd-finish-btn {
        font-size: 22px;
        margin-top: 20px;
        margin-bottom: 20px;
        text-decoration: none;
        outline: none !important;
    }

    .vd-next-btn:hover,
    .vd-skip-btn:hover,
    .vd-run-btn:hover,
    .vd-finish-btn:hover {
        text-decoration: none;
        outline: none !important;
    }

    .vd-w-error {
        display: none;
        color: #e41b51;
    }

    .vd-s-btn {
        font-weight: bold;
        font-size: 16px;
        color: rgb(232, 7, 74);
        text-decoration: none;
        margin: 1px;
    }

    .vd-hlink {
        border: solid 2px #eee;
        border-radius: 5px;
        padding: 10px;
        height: 100%;
        color: rgb(145, 145, 145); /*rgb(232, 7, 74);*/
        text-decoration: none;
    }

    .vd-mhf-survey .vd-hlink {
        width: 100%;
        font-weight: bold;
        font-size: 14px;
        min-height: 60px;
        height: 60px;
        display: flex;
        align-content: center;
        justify-content: center;
        align-items: center;
        box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px 3px;
        border: none;
        padding: 8px;
    }

    .vd-mhf-survey input:checked ~ .vd-hlink {
        color: rgb(232, 7, 74);
        fill: rgb(232, 7, 74);
        background-color: rgba(0, 0, 0, 0.06);
    }

    .vd-mhf-survey .vd-hlink * {
        line-height: 1.35;
    }

    .vd-mhf-survey > .vd-column-widget,
    .vd-mhf-survey > .vd-column-widget > .vd-container-widget {
        padding: 4px;
        padding-top: 1px;
        padding-bottom: 7px;
    }

    .vd-hbtn {
        margin-bottom: 10px;
        fill: rgb(145, 145, 145);
    }

    .vd-selected.vd-hlink,
    .vd-selected.vd-hlink .vd-hbtn,
    .vd-hlink:hover,
    .vd-hlink:hover .vd-hbtn,
    .vd-hlink:active,
    .vd-hlink:active .vd-hbtn {
        color: rgb(232, 7, 74);
        fill: rgb(232, 7, 74);
        background-color: rgba(0, 0, 0, 0.02);
        outline: none !important;
    }

    .vd-iframe-cnt {
        position: relative;
        text-decoration: center;
        margin-top: 2px;
        margin-bottom: 30px;
    }

    .vd-iframe {
        position: absolute;
        top: 0;
        left: 50%;
        transform: scale(0.2) translateX(-50%);
        transform-origin: top left;
        border: solid 2px black;
    }

    .vd-template-slider {
        width: 100%;
    }

    .vd-template-slider .vd-slide {
        padding: 10px;
    }

    .vd-bullet {
        outline: none !important;
    }

    .vd-w-instruct-cnt {
        position: sticky;
        top: 65px;
    }

    #vd-w-instruct {
        margin-top: 0px;
        text-shadow: rgba(255, 255, 255, 0.45) 3px 5px;
    }

    .vd-w-instruct-cnt h3 {
        line-height: 1.3;
    }

    /* Disallow swipe scroll on wizard */
    .vd-setup-wizard .vd-row-widget {
        overflow-x: hidden;
    }

    .vd-tmpl-img {
        position: relative;
        width: 100%;
    }

    .vd-tmpl-img img {
        width: 90%;
        max-height: 350px;
        border: solid 1px #ccc;
    }

    .vd-tmpl-img.vd-pro::after {
        content: " PRO ";
        position: absolute;
        bottom: 2%;
        right: 6%;
        background-color: orange;
        color: #eee;
        font-weight: 900;
        text-align: center;
        transform: rotatez(-45deg);
        overflow: hidden;
        padding: 30px 15px;
        font-size: 20px;
        clip-path: circle(45%);
        -webkit-clip-path: circle(45%);
        opacity: 0.65;
    }

    .vd-tmpl-img.vd-pro:hover::after {
        opacity: 0.9;
        transition: 800ms cubic-bezier(0.23, 1, 0.32, 1);
    }

    .vd-tmpl-img ~ span {
        margin-top: 8px;
    }

    /*.vd-tmpl-img:hover,*/
    .vd-tmpl-img:active,
    .vd-tmpl-img:visited,
    .vd-tmpl-img:focus {
        box-shadow: 0 0 0 1px #5b9dd9, 0 0 2px 1px rgb(30 140 190 / 80%);
        outline: 1px solid transparent;
    }

    .vd-s5-instructs div {
        padding: 0;
    }

    .vd-s5-instructs h4 {
        margin: 5px 0;
        margin-top: 30px;
    }

    #vd-t1 {
        font-size: 18px;
        margin-left: 10px;
    }
    #vd-t2 {
        margin-top: 20px;
        font-size: 18px;
        margin-left: 10px;
    }

    #rvdid-29 {
        box-sizing: border-box;
    }
    #rvdid-29-2 {
        padding: 100px 50px;
    }
    #rvdid-29-5 {
        background-color: rgb(255, 255, 255);
        border-style: none;
        border-radius: 6px;
        color: rgb(145, 145, 145);
    }
    #vd-step1 {
        padding: 50px 30px;
    }
    #rvdid-29-10 {
        color: rgb(196, 196, 196);
    }
    #rvdid-29-12 {
        color: rgb(196, 196, 196);
    }
    #rvdid-29-14 {
        color: rgb(196, 196, 196);
    }
    #rvdid-29-15 {
        font-weight: bold;
        margin: 0px 0px 30px;
        border-radius: 17px;
        font-size: 22px;
    }
    #rvdid-29-16 {
        font-size: 15px;
    }
    #rvdid-29-22 {
        font-weight: bold;
        font-size: 20px;
    }
    #rvdid-29-24 {
        margin-left: auto;
        margin-right: auto;
    }
    #rvdid-29-25 {
        font-weight: bold;
        font-size: 20px;
    }
    #rvdid-29-27 {
        margin-left: auto;
        margin-right: auto;
    }
    #rvdid-29-28 {
        font-weight: bold;
        font-size: 20px;
    }
    #rvdid-29-29 {
        background-color: rgb(232, 7, 74);
        color: rgb(255, 255, 255);
        text-decoration-line: none;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 2px;
        margin-top: 35px;
    }
    #vd-step3 {
        padding: 50px 30px;
        padding-bottom: 75px;
    }
    #rvdid-29-32 {
        font-weight: bold;
        margin: 0px 0px 30px;
        border-radius: 17px;
        font-size: 22px;
    }
    #rvdid-29-33 {
        font-size: 15px;
    }
    #vd-step5 {
        padding: 50px 30px;
    }
    #rvdid-29-46 {
        font-weight: bold;
        margin: 0px 0px 30px;
        border-radius: 17px;
        font-size: 22px;
    }
    #rvdid-29-47 {
        font-size: 15px;
    }
    #rvdid-29-58 {
        background-color: rgb(232, 7, 74);
        color: rgb(255, 255, 255);
        text-decoration-line: none;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 2px;
    }
    #rvdid-29-59 {
        padding: 0px;
    }
    #rvdid-29-6 {
        padding-bottom: 30px;
    }
    #rvdid-29-60 {
        padding: 0px;
    }
    #rvdid-29-62 {
        padding: 10px 20px;
    }
    #rvdid-29-63 {
        padding: 10px 20px;
    }
    #rvdid-29-64 {
        padding: 10px 20px;
    }
    #rvdid-29-11 {
        background-color: rgb(232, 7, 74);
        color: rgb(255, 255, 255);
        text-decoration-line: none;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 2px;
    }
    #vd-step2 {
        padding: 50px 30px;
        padding-bottom: 75px;
    }
    #rvdid-29-34 {
        font-weight: bold;
        margin: 0px 0px 30px;
        border-radius: 17px;
        font-size: 22px;
    }
    #rvdid-29-35 {
        font-size: 15px;
    }
    #rvdid-29-36 {
        padding: 20px 0px;
    }
    #rvdid-29-37 {
        padding: 0px;
        flex: 1 1 0px;
        flex-direction: row !important;
    }
    #rvdid-29-38 {
        padding: 10px 20px;
        border: solid 2px #eee;
        flex: 1 1 0px;
    }
    #rvdid-29-39 {
        padding: 10px 20px;
        border: solid 2px #eee;
        flex: 1 1 0px;
    }
    #rvdid-29-40 {
        padding: 10px 20px;
        border: solid 2px #eee;
        flex: 1 1 0px;
    }
    #rvdid-29-41 {
        padding: 30px 10px;
        border: solid 2px #eee;
    }
    #rvdid-29-42 {
        background-color: rgb(232, 7, 74);
        color: rgb(255, 255, 255);
        text-decoration-line: none;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 2px;
    }
    #rvdid-29-43 {
        color: rgb(196, 196, 196);
    }
    #rvdid-29-44 {
        color: rgb(196, 196, 196);
    }
    #rvdid-29-45 {
        color: rgb(196, 196, 196);
    }
    #vd-step4 {
        padding: 50px 30px;
    }
    #rvdid-29-69 {
        font-weight: bold;
        border-radius: 17px;
        font-size: 22px;
    }
    #rvdid-29-70 {
        font-size: 15px;
    }
    #rvdid-29-71 {
        background-color: rgb(232, 7, 74);
        color: rgb(255, 255, 255);
        text-decoration-line: none;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 2px;
    }
    #rvdid-29-73 {
        background-color: rgb(232, 7, 74);
        color: rgb(255, 255, 255);
        text-decoration-line: none;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 2px;
    }
</style>

<div class="vd-release">
    <div
        data-type="visual-designer"
        data-framework="wpmenuFramework"
        vd-designer-name="wizard"
        vd-post-id="29"
        vd-tmpl="vd_tmpl_header"
        designer-type="runningDesigner"
        vd-type="running-designer"
        class="vd-main vd-running-designer vd-pre-1-2"
        vd-version="1.2"
        id="rvdid-29"
        vd-ts="1604196789"
    >
        <section class="vd-section-widget" vd-type="section" id="rvdid-29-3">
            <div class="vd-section-container">
                <div class="vd-row-widget" vd-type="row" id="rvdid-29-2">
                    <div vd-type="column" desktop-width="7" tablet-width="12" mobile-width="12" style="padding: 40px 10px;" class="vd-column-widget vd-sm-1 vd-xs-1 vd-9 vd-c-top">
                        <div class="vd-w-instruct-cnt">
                            <h1 id="vd-w-instruct" style="font-size: 50px; color: #23282d;">
                                <span for="vd-step1">Before you start, tell us a little about yourself</span>
                                <span for="vd-step2" style="display: none;">Setup your header, footer or both?</span>
                                <span for="vd-step3" style="display: none;">Choose a header template</span>
                                <span for="vd-step4" style="display: none;">Choose a footer template</span>
                                <span for="vd-step5" style="display: none;">What to do with that pesky theme header or footer?</span>
                                <span for="vd-step6" style="display: none;">All Done :D</span>
                            </h1>

                            <h3 id="vd-w-instruct-detail">
                                <!-- <span for="vd-step1">The first step to improving a plugin involves understanding who uses the plugin and what their needs are. Understanding you and your needs as a user helps me improve the plugin and provide a better service to you.  
                </span> -->
                                <span for="vd-step2" style="display: none;">Let's get started. This wizard you guide you through setting up your new header &amp;/or footer and also removing your existing theme header &amp;/or footer.</span>
                                <span for="vd-step3" style="display: none;">Select from a range of pre-made header templates for any need.</span>
                                <span for="vd-step4" style="display: none;">Select from a range of pre-made footer templates for any need.</span>
                                <span for="vd-step5" style="display: none;"><!-- With My Header Footer you choose what parts of your theme's header &amp;/or footer to remove. --></span>
                                <span for="vd-step6" style="display: none;"></span>
                            </h3>
                        </div>
                    </div>
                    <div class="vd-column-widget vd-sm-1 vd-xs-1 vd-5" vd-type="column" desktop-width="7" tablet-width="12" mobile-width="12" id="rvdid-29-1">
                        <div class="vd-c-middle vd-wizard-widget vd-setup-wizard" vd-type="wizard" id="rvdid-29-4">
                            <div class="vd-row-widget" id="rvdid-29-5">
                                <div
                                    class="vd-column-widget vd-slide vd-1 vd-sm-1 vd-xs-1 vd-c-center vd-c-middle"
                                    vd-type="column"
                                    id="vd-step1"
                                    desktop-width="12"
                                    tablet-width="12"
                                    mobile-width="12"
                                    vd-validator="step1Validator"
                                    vd-next="#vd-step2"
                                >
                                    <!-- <p class="vd-text-widget" vd-type="text" id="rvdid-29-15" vd-text-type="p"><span class="">Before you start, tell us a little about yourself</span></p> -->
                                    <p class="vd-text-widget vd-left" vd-type="text" id="vd-t1" vd-text-type="p" vd-font-units="px"><span class="">Your profession...</span></p>
                                    <div class="vd-row-widget vd-mhf-survey" vd-type="row" id="mvdid-1-6">
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-prof2" type="radio" name="vd-profession" value="freelance-developer" style="display: none;" />
                                                <label for="vd-mhf-prof2" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Freelance Developer</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-prof3" type="radio" name="vd-profession" value="freelance-designer" style="display: none;" />
                                                <label for="vd-mhf-prof3" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Freelance Designer</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-prof" type="radio" name="vd-profession" value="entrepreneur" style="display: none;" />
                                                <label for="vd-mhf-prof" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Entrepreneur</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-prof4" type="radio" name="vd-profession" value="digital-agency-developer" style="display: none;" />
                                                <label for="vd-mhf-prof4" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Digital Agency Developer</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-prof5" type="radio" name="vd-profession" value="digital-agency-designer" style="display: none;" />
                                                <label for="vd-mhf-prof5" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Digital Agency Designer</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-prof6" type="radio" name="vd-profession" value="other" style="display: none;" />
                                                <label for="vd-mhf-prof6" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Other</span></label>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="vd-text-widget vd-left" vd-type="text" id="vd-t2" vd-text-type="p" vd-font-units="px"><span class="">Your team size...</span></p>
                                    <div class="vd-row-widget vd-mhf-survey" vd-type="row" id="mvdid-1-6">
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-tsize1" type="radio" name="vd-team-size" value="just-me" style="display: none;" />
                                                <label for="vd-mhf-tsize1" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">It's just me</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-tsize2" type="radio" name="vd-team-size" value="team-2-4" style="display: none;" />
                                                <label for="vd-mhf-tsize2" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Team of 2-4</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-tsize3" type="radio" name="vd-team-size" value="team-5-10" style="display: none;" />
                                                <label for="vd-mhf-tsize3" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Team of 5-10</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-tsize4" type="radio" name="vd-team-size" value="team-11-15" style="display: none;" />
                                                <label for="vd-mhf-tsize4" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Team of 11-15</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-tsize5" type="radio" name="vd-team-size" value="team-16-20" style="display: none;" />
                                                <label for="vd-mhf-tsize5" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Team of 16-20</span></label>
                                            </div>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="mvdid-1-7" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <div class="vd-container-widget vd-c-center" vd-type="container" id="mvdid-1-10">
                                                <input id="vd-mhf-tsize6" type="radio" name="vd-team-size" value="team-20+" style="display: none;" />
                                                <label for="vd-mhf-tsize6" class="vd-text-widget vd-hlink" vd-type="text" id="mvdid-1-11" vd-text-type="p"><span class="">Team of 20+</span></label>
                                            </div>
                                        </div>
                                    </div>
                                    <a class="vd-btn-widget vd-next-btn" vd-type="btn" id="rvdid-29-29" vd-text-type="a" href="#/" target="_top" rel="noopener noreferrer"><span class="">Continue</span></a>
                                    <small class="vd-w-error">Please answer the above questions</small>
                                </div>
                                <div
                                    class="vd-column-widget vd-slide vd-1 vd-sm-1 vd-xs-1 vd-c-center vd-c-middle"
                                    vd-type="column"
                                    id="vd-step2"
                                    desktop-width="12"
                                    tablet-width="12"
                                    mobile-width="12"
                                    vd-validator="step2Validator"
                                    vd-next="#vd-step3"
                                >
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-15" vd-text-type="p"><span class="">Do you want to customise your header, footer or both?</span></p>
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-16" vd-text-type="p" vd-font-units="px"><span class="">I want to setup my...</span></p>
                                    <div class="vd-row-widget" vd-type="row" id="rvdid-29-17">
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="rvdid-29-18" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <a class="vd-hlink" href="#/" onmouseup="selectGoal(true, false, this);">
                                                <svg
                                                    class="vd-img-widget vd-hbtn"
                                                    vd-type="img"
                                                    id="rvdid-29-21"
                                                    version="1.1"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    xmlns:xlink="http://www.w3.org/1999/xlink"
                                                    x="0px"
                                                    y="0px"
                                                    viewBox="0 0 1000 1000"
                                                    enable-background="new 0 0 1000 1000"
                                                    xml:space="preserve"
                                                >
                                                    <g>
                                                        <g transform="translate(0.000000,511.000000) scale(0.100000,-0.100000)">
                                                            <path
                                                                d="M118,4995.1c-9-6.7-15.7-653.8-15.7-1437.9V2135.1H5000h4897.8l-4.5,1433.4l-6.8,1431.1l-4877.5,6.7C2326.5,5008.6,124.7,5004.1,118,4995.1z M9313.6,3561.7v-865H5000H686.4v865v865H5000h4313.6V3561.7z"
                                                            />
                                                            <path d="M1540.1,3561.7v-280.8h584.1h584.1v280.8v280.8h-584.1h-584.1V3561.7z" />
                                                            <path d="M3854.2,3561.7v-280.8H6157h2302.8v280.8v280.8H6157H3854.2V3561.7z" />
                                                            <path d="M106.7,1265.6l6.7-287.6l287.6-6.7l285.3-6.7v294.3V1551H394.3H100L106.7,1265.6z" />
                                                            <path d="M9313.6,1258.9V964.6l287.6,6.7l285.3,6.7l6.8,287.6l6.7,285.3h-294.3h-292.1V1258.9z" />
                                                            <path d="M111.2,375.9c-4.5-15.7-6.7-146-4.5-287.6l6.7-256.1l287.6-6.7l285.3-6.8v294.3v292.1H405.6C194.4,405.2,120.2,398.4,111.2,375.9z" />
                                                            <path d="M9313.6,113.1v-294.3l287.6,6.8l285.3,6.7v280.8v280.8l-285.3,6.7l-287.6,6.7V113.1z" />
                                                            <path d="M118-756.4c-9-6.7-15.7-139.3-15.7-292.1v-276.3h292.1h292.1v292.1v292.1H410C257.3-740.7,124.7-747.4,118-756.4z" />
                                                            <path d="M9313.6-1032.7v-292.1h292.1H9900l-6.7,287.6l-6.8,285.3l-285.3,6.7l-287.6,6.7V-1032.7z" />
                                                            <path d="M102.3-2189.8v-280.8h292.1h292.1v280.8v280.8H394.3H102.3V-2189.8z" />
                                                            <path d="M9313.6-2189.8v-280.8h292.1h292.1v280.8v280.8h-292.1h-292.1V-2189.8z" />
                                                            <path d="M102.3-3335.6v-280.8h292.1h292.1v280.8v280.8H394.3H102.3V-3335.6z" />
                                                            <path d="M9313.6-3335.6v-280.8h292.1h292.1v280.8v280.8h-292.1h-292.1V-3335.6z" />
                                                            <path d="M106.7-4485.9l6.7-287.6l287.6-6.7l285.3-6.7v294.3v292.1H394.3H100L106.7-4485.9z" />
                                                            <path d="M1270.5-4492.6v-292.1h280.8h280.8v292.1v292.1h-280.8h-280.8V-4492.6z" />
                                                            <path d="M2416.3-4492.6v-292.1h280.8H2978v292.1v292.1h-280.8h-280.8V-4492.6z" />
                                                            <path d="M3562.1-4492.6v-294.3l287.6,6.7l285.3,6.7l6.7,287.6l6.7,285.3h-294.3h-292.1V-4492.6z" />
                                                            <path d="M4712.4-4485.9l6.7-287.6H5000h280.8l6.8,287.6l6.7,285.3H5000h-294.3L4712.4-4485.9z" />
                                                            <path d="M5858.3-4485.9l6.7-287.6l287.6-6.7l285.3-6.7v294.3v292.1h-292.1h-294.3L5858.3-4485.9z" />
                                                            <path d="M7022-4492.6v-292.1h280.8h280.8v292.1v292.1h-280.8H7022V-4492.6z" />
                                                            <path d="M8167.8-4492.6v-292.1h280.8h280.8v292.1v292.1h-280.8h-280.8V-4492.6z" />
                                                            <path d="M9313.6-4492.6v-294.3l287.6,6.7l285.3,6.7l6.8,287.6l6.7,285.3h-294.3h-292.1V-4492.6z" />
                                                        </g>
                                                    </g>
                                                </svg>
                                                <p class="vd-text-widget" vd-type="text" id="rvdid-29-22" vd-text-type="p"><span class="">Header</span></p>
                                            </a>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="rvdid-29-23" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <a class="vd-hlink" href="#/" onmouseup="selectGoal(false, true, this);">
                                                <svg
                                                    class="vd-img-widget vd-hbtn"
                                                    vd-type="img"
                                                    id="rvdid-29-24"
                                                    version="1.1"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    xmlns:xlink="http://www.w3.org/1999/xlink"
                                                    x="0px"
                                                    y="0px"
                                                    viewBox="0 0 1000 1000"
                                                    enable-background="new 0 0 1000 1000"
                                                    xml:space="preserve"
                                                >
                                                    <g>
                                                        <g transform="translate(0.000000,511.000000) scale(0.100000,-0.100000)">
                                                            <path d="M100,4727.3v-281.5h281.5h281.5v281.5v281.5H381.5H100V4727.3z" />
                                                            <path d="M1248.7,4727.3v-281.5h281.5h281.5v281.5v281.5h-281.5h-281.5V4727.3z" />
                                                            <path d="M2397.4,4727.3v-281.5h281.5h281.5v281.5v281.5h-281.5h-281.5V4727.3z" />
                                                            <path d="M3546.1,4727.3v-281.5h292.8h292.8v281.5v281.5h-292.8h-292.8V4727.3z" />
                                                            <path d="M4694.8,4727.3v-281.5h292.8h292.8v281.5v281.5h-292.8h-292.8V4727.3z" />
                                                            <path d="M5866,4727.3v-281.5h281.5h281.5v281.5v281.5h-281.5H5866V4727.3z" />
                                                            <path d="M7014.7,4727.3v-281.5h281.6h281.5v281.5v281.5h-281.5h-281.6V4727.3z" />
                                                            <path d="M8163.4,4727.3v-281.5H8445h281.5v281.5v281.5H8445h-281.6V4727.3z" />
                                                            <path d="M9312.1,4727.3v-281.5H9605h292.8v281.5v281.5H9605h-292.8V4727.3z" />
                                                            <path d="M100,3567.4v-292.8h281.5h281.5v292.8v292.8H381.5H100V3567.4z" />
                                                            <path d="M9312.1,3567.4v-295.1l288.3,6.8l286.1,6.7l6.8,288.3l6.7,286.1h-295h-292.8V3567.4z" />
                                                            <path d="M100,2418.7v-292.8h281.5h281.5v292.8v292.8H381.5H100V2418.7z" />
                                                            <path d="M9312.1,2418.7v-295.1l288.3,6.8l286.1,6.7v281.5v281.5l-286.1,6.8l-288.3,6.8V2418.7z" />
                                                            <path d="M100,1265.5V977.2h281.5h281.5v281.5c0,209.5-6.8,281.5-27,283.8c-15.8,2.3-144.1,4.5-281.5,6.8l-254.5,2.3V1265.5z" />
                                                            <path d="M9420.3,1547l-108.1-9v-281.5V977.2H9605h292.8v281.5v281.5h-105.9c-60.8,0-144.1,4.5-186.9,9C9562.1,1553.8,9478.8,1551.5,9420.3,1547z" />
                                                            <path d="M100,110v-281.5h281.5h281.5V110v281.5H381.5H100V110z" />
                                                            <path d="M9312.1,110v-281.5H9605h292.8V110v281.5H9605h-292.8V110z" />
                                                            <path d="M100-1038.7v-281.5h281.5h281.5v281.5v281.5H381.5H100V-1038.7z" />
                                                            <path d="M9312.1-1038.7v-281.5H9605h292.8v281.5v281.5H9605h-292.8V-1038.7z" />
                                                            <path
                                                                d="M100-3347.4v-1441.5h4898.9h4898.9v1441.5v1441.5H4998.9H100V-3347.4z M9312.1-3356.4V-4219l-4284-2.2c-2358.2,0-4304.2,4.5-4324.5,9c-38.3,11.3-40.5,72.1-40.5,867.2v853.7h4324.5h4324.5V-3356.4z"
                                                            />
                                                            <path d="M1541.5-3347.4v-292.8h855.9h855.9v292.8v292.8h-855.9h-855.9V-3347.4z" />
                                                            <path d="M6152.1-3070.3c-9-6.8-15.8-139.6-15.8-292.8v-277h292.8h292.8v292.8v292.8h-277C6291.7-3054.6,6158.8-3061.3,6152.1-3070.3z" />
                                                            <path d="M7014.7-3347.4v-292.8h281.6h281.5v292.8v292.8h-281.5h-281.6V-3347.4z" />
                                                            <path d="M7870.6-3347.4v-292.8h292.8h295l-6.7,288.3l-6.7,286.1l-286.1,6.7l-288.3,6.7V-3347.4z" />
                                                        </g>
                                                    </g>
                                                </svg>
                                                <p class="vd-text-widget" vd-type="text" id="rvdid-29-25" vd-text-type="p"><span class="">Footer</span></p>
                                            </a>
                                        </div>
                                        <div class="vd-column-widget vd-9 vd-sm-9 vd-xs-1" vd-type="column" id="rvdid-29-26" desktop-width="4" tablet-width="4" mobile-width="12">
                                            <a class="vd-hlink" href="#/" onmouseup="selectGoal(true, true, this);">
                                                <svg class="vd-img-widget vd-hbtn" vd-type="img" id="rvdid-29-27" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
                                                    <style>
                                                        tspan {
                                                            white-space: pre;
                                                        }
                                                        /*.shp0 { fill: #000000 } */
                                                    </style>
                                                    <g id="Layer">
                                                        <g id="Layer">
                                                            <path
                                                                id="Layer"
                                                                fill-rule="evenodd"
                                                                class="shp0"
                                                                d="M500.9 10.37L988.65 11.04L989.33 154.15L989.78 297.49L10.23 297.49L10.23 155.28C10.23 76.87 10.9 12.16 11.8 11.49C12.47 10.59 232.65 10.14 500.9 10.37ZM931.36 68.33L68.64 68.33L68.64 241.33L931.36 241.33L931.36 68.33Z"
                                                            />
                                                            <path id="Layer" class="shp0" d="M154.01 154.83L154.01 182.91L212.42 182.91L270.83 182.91L270.83 154.83L270.83 126.75L212.42 126.75L154.01 126.75L154.01 154.83Z" />
                                                            <path id="Layer" class="shp0" d="M385.42 154.83L385.42 182.91L615.7 182.91L845.98 182.91L845.98 154.83L845.98 126.75L615.7 126.75L385.42 126.75L385.42 154.83Z" />
                                                            <path id="Layer" class="shp0" d="M10.67 384.44L11.34 413.2L40.1 413.87L68.63 414.54L68.63 385.11L68.63 355.9L39.43 355.9L10 355.9L10.67 384.44Z" />
                                                            <path id="Layer" class="shp0" d="M931.36 385.11L931.36 414.54L960.12 413.87L988.65 413.2L989.33 384.44L990 355.91L960.57 355.91L931.36 355.91L931.36 385.11Z" />
                                                            <path
                                                                id="Layer"
                                                                class="shp0"
                                                                d="M11.12 473.41C10.67 474.98 10.45 488.01 10.67 502.17L11.34 527.78L40.1 528.45L68.63 529.13L68.63 499.7L68.63 470.49L40.56 470.49C19.44 470.48 12.02 471.16 11.12 473.41Z"
                                                            />
                                                            <path id="Layer" class="shp0" d="M931.36 499.69L931.36 529.12L960.12 528.44L988.65 527.77L988.65 499.69L988.65 471.61L960.12 470.94L931.36 470.27L931.36 499.69Z" />
                                                            <path
                                                                id="Layer"
                                                                class="shp0"
                                                                d="M11.8 586.64C10.9 587.31 10.23 600.57 10.23 615.85L10.23 643.48L39.44 643.48L68.65 643.48L68.65 614.27L68.65 585.06L41 585.06C25.73 585.07 12.47 585.74 11.8 586.64Z"
                                                            />
                                                            <path id="Layer" class="shp0" d="M931.36 614.27L931.36 643.48L960.57 643.48L990 643.48L989.33 614.72L988.65 586.19L960.12 585.52L931.36 584.85L931.36 614.27Z" />
                                                        </g>
                                                    </g>
                                                    <g id="Layer">
                                                        <g id="Layer">
                                                            <path
                                                                id="Layer"
                                                                class="shp0"
                                                                d="M10 384.45L10 413.28L38.15 413.28L66.3 413.28L66.3 385.13C66.3 364.18 65.62 356.98 63.6 356.75C62.02 356.52 49.19 356.3 35.45 356.07L10 355.84L10 384.45Z"
                                                            />
                                                            <path
                                                                id="Layer"
                                                                class="shp0"
                                                                d="M942.03 356.3L931.22 357.2L931.22 385.35L931.22 413.28L960.5 413.28L989.78 413.28L989.78 385.13L989.78 356.98L979.19 356.98C973.11 356.98 964.78 356.53 960.5 356.08C956.21 355.62 947.88 355.85 942.03 356.3Z"
                                                            />
                                                            <path id="Layer" class="shp0" d="M10 500L10 528.15L38.15 528.15L66.3 528.15L66.3 500L66.3 471.85L38.15 471.85L10 471.85L10 500Z" />
                                                            <path id="Layer" class="shp0" d="M931.21 500L931.21 528.15L960.5 528.15L989.78 528.15L989.78 500L989.78 471.85L960.5 471.85L931.22 471.85L931.22 500L931.21 500Z" />
                                                            <path id="Layer" class="shp0" d="M10 614.87L10 643.02L38.15 643.02L66.3 643.02L66.3 614.87L66.3 586.72L38.15 586.72L10 586.72L10 614.87Z" />
                                                            <path id="Layer" class="shp0" d="M931.21 614.87L931.21 643.02L960.5 643.02L989.78 643.02L989.78 614.87L989.78 586.72L960.5 586.72L931.22 586.72L931.22 614.87L931.21 614.87Z" />
                                                            <path
                                                                id="Layer"
                                                                fill-rule="evenodd"
                                                                class="shp0"
                                                                d="M10 701.59L989.78 701.59L989.78 989.89L10 989.89L10 701.59ZM931.21 760.13L66.31 760.13L66.31 845.5C66.31 925.01 66.53 931.09 70.36 932.22C72.39 932.67 266.99 933.12 502.81 933.12L931.21 932.9L931.21 760.13Z"
                                                            />
                                                            <path id="Layer" class="shp0" d="M154.15 845.74L154.15 875.02L239.74 875.02L325.33 875.02L325.33 845.74L325.33 816.46L239.74 816.46L154.15 816.46L154.15 845.74Z" />
                                                            <path
                                                                id="Layer"
                                                                class="shp0"
                                                                d="M615.21 818.03C614.31 818.71 613.63 831.99 613.63 847.31L613.63 875.01L642.91 875.01L672.19 875.01L672.19 845.73L672.19 816.45L644.49 816.45C629.17 816.46 615.88 817.13 615.21 818.03Z"
                                                            />
                                                            <path id="Layer" class="shp0" d="M701.47 845.74L701.47 875.02L729.63 875.02L757.78 875.02L757.78 845.74L757.78 816.46L729.63 816.46L701.47 816.46L701.47 845.74Z" />
                                                            <path id="Layer" class="shp0" d="M787.06 845.74L787.06 875.02L816.34 875.02L845.84 875.02L845.17 846.19L844.5 817.58L815.89 816.91L787.06 816.24L787.06 845.74L787.06 845.74Z" />
                                                        </g>
                                                    </g>
                                                </svg>
                                                <p class="vd-text-widget" vd-type="text" id="rvdid-29-28" vd-text-type="p"><span class="">Header and Footer</span></p>
                                            </a>
                                        </div>
                                    </div>
                                    <a class="vd-btn-widget vd-next-btn" vd-type="btn" id="rvdid-29-29" vd-text-type="a" href="#/" target="_top" rel="noopener noreferrer"><span class="">Continue</span></a>
                                    <small class="vd-w-error">Please select one of the options above by clicking it</small>
                                </div>
                                <div
                                    class="vd-column-widget vd-slide vd-1 vd-sm-1 vd-xs-1 vd-c-center vd-c-middle"
                                    vd-type="column"
                                    id="vd-step3"
                                    desktop-width="12"
                                    tablet-width="12"
                                    mobile-width="12"
                                    vd-validator="step3Validator"
                                    vd-next="#vd-step4"
                                >
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-34" vd-text-type="p"><span class="">Choose a header template</span></p>
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-35" vd-text-type="p" vd-font-units="px">
                                        <span class="">Choose a pre-made template. And don't worry you can always edit and customise your templates later.</span>
                                    </p>
                                    <div class="vd-c-middle vd-slider-widget vd-template-slider" vd-type="slider" vd-renderer="sliderWidgetRelease">
                                        <div class="vd-row-widget" vd-target="" style="border: none;">
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <a class="vd-tmpl-img" href="javascript:selectTemplate(1, 'headerTemplate')"><img class="lazy" data-src='<?php echo vdmhfGetTemplateImg('1', $tmplDir, $cacheToken); ?>' /></a>
                                                <span>Standard responsive header with dropdown menus and mega-menus</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <a class="vd-tmpl-img" href="javascript:selectTemplate(8, 'headerTemplate')"><img class="lazy" data-src="<?php echo vdmhfGetTemplateImg('8', $tmplDir, $cacheToken); ?>" /></a>
                                                <span>Bright agency responsive header with mega-menus</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <a class="vd-tmpl-img" href="javascript:selectTemplate(9, 'headerTemplate')"><img class="lazy" data-src="<?php echo vdmhfGetTemplateImg('9', $tmplDir, $cacheToken); ?>" /></a>
                                                <span>Recipe blog responsive header with dropdown menus, mega-menus and login button</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <a class="vd-tmpl-img" href="javascript:selectTemplate(2, 'headerTemplate')"><img class="lazy" data-src="<?php echo vdmhfGetTemplateImg('2', $tmplDir, $cacheToken); ?>" /></a>
                                                <span>Personal website responsive header with dropdown menus and mega-menus</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <a class="vd-tmpl-img" href="javascript:selectTemplate(3, 'headerTemplate')"><img class="lazy" data-src="<?php echo vdmhfGetTemplateImg('3', $tmplDir, $cacheToken); ?>" /></a>
                                                <span>Current events and news responsive header with login button</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <?php vdmhfRenderProTemplateAnchor(vdmhfGetTemplateImg('4', $tmplDir, $cacheToken), 4, 'headerTemplate'); ?>
                                                <span>Informative blog responsive header with dynamic page title heading</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <?php vdmhfRenderProTemplateAnchor(vdmhfGetTemplateImg('5', $tmplDir, $cacheToken), 5, 'headerTemplate'); ?>
                                                <span>Webstore responsive header with dropdown menus, mega-menus and login button</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <?php vdmhfRenderProTemplateAnchor(vdmhfGetTemplateImg('7', $tmplDir, $cacheToken), 7, 'headerTemplate'); ?>
                                                <span>Business responsive header with dropdown menus</span>
                                            </div>
                                        </div>
                                        <div class="vd-overlay">
                                            <span class="vd-icon-widget fas fa-angle-left vd-abs-left vd-abs-middle vd-slider-ar vd-slider-l-ar" vd-tag-name="Arrow" vd-type="icon"></span>
                                            <span class="vd-icon-widget fas fa-angle-right vd-abs-right vd-abs-middle vd-slider-ar vd-slider-r-ar" vd-tag-name="Arrow" vd-type="icon"></span>
                                        </div>
                                    </div>
                                    <a class="vd-btn-widget vd-next-btn" vd-type="btn" id="rvdid-29-42" vd-text-type="a" href="#/" target="_top"><span class="">Continue</span></a>
                                    <small class="vd-w-error">Please select a template by clicking it</small>
                                </div>
                                <div
                                    class="vd-column-widget vd-slide vd-1 vd-sm-1 vd-xs-1 vd-c-center vd-c-middle"
                                    vd-type="column"
                                    id="vd-step4"
                                    desktop-width="12"
                                    tablet-width="12"
                                    mobile-width="12"
                                    vd-validator="step4Validator"
                                    vd-next="#vd-step5"
                                >
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-32" vd-text-type="p"><span class="">Choose a footer template</span></p>
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-33" vd-text-type="p" vd-font-units="px">
                                        <span class="">Choose a pre-made template. And don't worry you can always edit and customise your templates later.</span>
                                    </p>
                                    <div class="vd-c-middle vd-slider-widget vd-template-slider" vd-type="slider" vd-renderer="sliderWidgetRelease">
                                        <div class="vd-row-widget" vd-target="" style="border: none;">
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <a class="vd-tmpl-img" href="javascript:selectTemplate(99999, 'footerTemplate')"><img class="lazy" data-src="<?php echo vdmhfGetTemplateImg('99999', $tmplDir, $cacheToken); ?>" /></a>
                                                <span>Standard responsive footer</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <a class="vd-tmpl-img" href="javascript:selectTemplate(12, 'footerTemplate')"><img class="lazy" data-src="<?php echo vdmhfGetTemplateImg('12', $tmplDir, $cacheToken); ?>" /></a>
                                                <span>Agency responsive footer</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <?php vdmhfRenderProTemplateAnchor(vdmhfGetTemplateImg('11', $tmplDir, $cacheToken), 11, 'footerTemplate'); ?>
                                                <span>Webstore responsive footer</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <?php vdmhfRenderProTemplateAnchor(vdmhfGetTemplateImg('14', $tmplDir, $cacheToken), 14, 'footerTemplate'); ?>
                                                <span>Business responsive footer</span>
                                            </div>
                                            <div class="vd-slide-widget vd-slide vd-c-center vd-c-middle vd-1 vd-sm-1 vd-xs-1" vd-type="slide" desktop-width="12" tablet-width="12" mobile-width="12">
                                                <?php vdmhfRenderProTemplateAnchor(vdmhfGetTemplateImg('15', $tmplDir, $cacheToken), 15, 'footerTemplate'); ?>
                                                <span>Personal website responsive footer</span>
                                            </div>
                                        </div>
                                        <div class="vd-overlay">
                                            <span class="vd-icon-widget fas fa-angle-left vd-abs-left vd-abs-middle vd-slider-ar vd-slider-l-ar" vd-tag-name="Arrow" vd-type="icon"></span>
                                            <span class="vd-icon-widget fas fa-angle-right vd-abs-right vd-abs-middle vd-slider-ar vd-slider-r-ar" vd-tag-name="Arrow" vd-type="icon"></span>
                                        </div>
                                    </div>
                                    <a class="vd-btn-widget vd-next-btn" vd-type="btn" id="rvdid-29-11" vd-text-type="a" href="#/" target="_top"><span class="">Continue</span></a>
                                    <small class="vd-w-error">Please select a template by clicking it</small>
                                </div>
                                <div
                                    class="vd-column-widget vd-slide vd-1 vd-sm-1 vd-xs-1 vd-c-center vd-c-middle"
                                    vd-type="column"
                                    id="vd-step5"
                                    desktop-width="12"
                                    tablet-width="12"
                                    mobile-width="12"
                                    vd-validator="step5Validator"
                                    vd-next="#vd-step6"
                                >
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-69" vd-text-type="p"><span class="">Hide your theme's existing header, footer or both</span></p>
                                    <p style="margin-bottom: 3px;">
                                        <span class="">
                                            Below on the left is your current website and how it looks now. On the below right is your website with pink highlighted areas. These pink highlighted areas will be removed and replaced with your
                                            new header &amp;/or footer.
                                        </span>
                                    </p>
                                    <p style="margin-top: 3px;">
                                        <span>
                                            If you don't want to remove these pink hightlighted areas just left click them to de-select them. If you want to remove more areas of your theme simply hover your mouse over the bottom right
                                            website and select the pink highlighted areas.
                                        </span>
                                    </p>

                                    <br />
                                    <a href="javascript:showWhyModal();">Why should I need to perform this step?</a>
                                    <br />

                                    <!-- <p class="vd-text-widget" vd-type="text" id="rvdid-29-70" vd-text-type="p" vd-font-units="px"><span class="">The pink highlighted areas</span></p> -->

                                    <div class="vd-row-widget vd-s5-instructs" vd-type="row">
                                        <div class="vd-column-widget vd-c-center vd-c-middle vd-7" vd-type="column">
                                            <h4>Below is your existing website.</h4>
                                        </div>
                                        <div class="vd-column-widget vd-c-center vd-c-middle vd-7" vd-type="column">
                                            <h4>The pink highlighted areas will be removed from your website sitewide.</h4>
                                        </div>
                                    </div>

                                    <div class="vd-row-widget" vd-type="row">
                                        <div class="vd-column-widget vd-c-center vd-c-middle vd-7 vd-iframe-cnt" vd-type="column">
                                            <iframe width="1200" id="vd-iframe-std" class="vd-iframe" src="<?php echo $home; ?>" onload="vdmhfRenderIframe(this);"></iframe>
                                        </div>
                                        <div class="vd-column-widget vd-c-center vd-c-middle vd-7 vd-iframe-cnt" vd-type="column">
                                            <iframe width="1200" id="vd-iframe-ml" class="vd-iframe" src="<?php echo $vdHome; ?>"></iframe>
                                        </div>
                                    </div>

                                    <!-- <iframe class="vd-iframe" src="http://localhost:8080/theme_beta?vd=0&sel=hide-content&tmpl=vd_tmpl_header"></iframe> -->
                                    <div class="vd-horz vd-container-widget vd-c-center">
                                        <a class="vd-btn-widget vd-next-btn" vd-type="btn" id="rvdid-29-73" vd-text-type="a" href="#/" target="_top" rel="noopener noreferrer" style="display: block;">
                                            <span class="">Continue</span>
                                            <span class="vd-skip fas fa-circle-notch vd-spinner" style="display: inline-block;"></span>
                                        </a>
                                        <a class="vd-btn-widget vd-skip-btn" vd-type="btn" id="rvdid-29-71" vd-text-type="a" href="#/" style="display: block;">
                                            <span class="">Skip Step</span>
                                            <span class="vd-skip fas fa-circle-notch vd-spinner" style="display: inline-block;"></span>
                                        </a>
                                    </div>
                                </div>
                                <div class="vd-column-widget vd-slide vd-1 vd-sm-1 vd-xs-1 vd-c-center vd-c-middle" vd-type="column" id="vd-step6" desktop-width="12" tablet-width="12" mobile-width="12">
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-46" vd-text-type="p"><span class="">Wizard Complete! :)</span></p>
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-47" vd-text-type="p" vd-font-units="px"><span class="">Now it's time to customise and style your brand new header and/or footer</span></p>
                                    <p class="vd-text-widget" vd-type="text" id="rvdid-29-47" vd-text-type="p" vd-font-units="px">
                                        <span class="">
                                            Note: your brand new header and/or footer is visible only to you, visitors cannot see it on your website yet. You need to continue onto the next step and <strong>Save your Design</strong> to
                                            publish your new header and/or footer. After you publish it, visitors will be able to see your new header and/or footer.
                                        </span>
                                    </p>
                                    <a class="vd-btn-widget vd-finish-btn" vd-type="btn" id="rvdid-29-58" vd-text-type="a" href="#/" target="_top" rel="noopener noreferrer" style="display: block;"><span class="">Finish</span></a>
                                </div>
                            </div>
                            <div class="vd-overlay">
                                <div class="vd-container-widget vd-horz vd-sm-horz vd-xs-horz vd-c-center vd-c-middle vd-abs-bottom vd-abs-center vd-slider-bullets" vd-tag-name="Steps" vd-type="container" id="rvdid-29-6">
                                    <span class="vd-icon-widget fas fa-circle vd-bullet" vd-tag-name="Bullet" vd-type="icon" id="rvdid-29-10"></span>
                                    <span class="vd-icon-widget fas fa-circle vd-bullet" vd-tag-name="Bullet" vd-type="icon" id="rvdid-29-12"></span>
                                    <span class="vd-icon-widget fas fa-circle vd-bullet" vd-tag-name="Bullet" vd-type="icon" id="rvdid-29-14"></span>
                                    <span class="vd-icon-widget fas fa-circle vd-bullet" vd-tag-name="Bullet" vd-type="icon" id="rvdid-29-43"></span>
                                    <span class="vd-icon-widget fas fa-circle vd-bullet" vd-tag-name="Bullet" vd-type="icon" id="rvdid-29-44"></span>
                                    <span class="vd-icon-widget fas fa-circle vd-bullet" vd-tag-name="Bullet" vd-type="icon" id="rvdid-29-45"></span>
                                </div>
                                <div class="vd-text-widget vd-abs-left vd-abs-bottom vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden" vd-tag-name="Step Back" vd-type="text" id="rvdid-29-7" vd-text-type="div">
                                    <span class="">Prev</span>
                                </div>
                                <div class="vd-text-widget vd-abs-right vd-abs-bottom vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden" vd-tag-name="Step Forward" vd-type="text" id="rvdid-29-8" vd-text-type="div" style="">
                                    <span class="">Next</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="vd-update-check">
            <a href="javascript:showCreditsModal();"><span>Credits</span></a>
        </div>

        <div class="vd-made-in">
            <span>Made in</span>
            <img src="<?php echo $ausSvg; ?>" alt="Australia" />
        </div>
    </div>
</div>


<script type="text/javascript">
var selectGoal, selectTemplate, showCreditsModal, showWhyModal, vdmhfRenderIframe, vdmhfShowInstruct, isProcessing = false;
var wizardData = {
  customHeader: false,
  customFooter: false,
  headerTemplate: 0,
  footerTemplate: 0,
  hideElementsCSS: null,
  profession: null,
  teamSize: null,
  need: null,
};

(function ($) {
  "use strict";

  window.step1Validator = function (slide) {
    wizardData.profession = $('input[name="vd-profession"]:checked').val();
    wizardData.teamSize = $('input[name="vd-team-size"]:checked').val();

    if (!wizardData.profession || !wizardData.teamSize) return false;

    return true;
  };
  window.step2Validator = function (slide) {
    var step1Valid = window.step1Validator();
    return step1Valid && (wizardData.customHeader || wizardData.customFooter);
  };
  window.step3Validator = function (slide) {
    var step1Valid = window.step1Validator();
    var step2Valid = window.step2Validator();
    return step1Valid && step2Valid && (!wizardData.customHeader || wizardData.headerTemplate > 0);
  };
  window.step4Validator = function (slide) {
    var step1Valid = window.step1Validator();
    var step2Valid = window.step2Validator();
    var step3Valid = window.step3Validator();
    return step1Valid && step2Valid && step3Valid && (!wizardData.customFooter || wizardData.footerTemplate > 0);
  };
  window.step5Validator = function (slide, params) {
    params = params || {};
    if (isProcessing || !window.step1Validator() || !window.step2Validator() || !window.step3Validator() || !window.step4Validator()) return;
    isProcessing = true;

    if (!params.skipHideElementCSS) {
      var contents = $("#vd-iframe-ml").contents();
      var mhfStyle = $("#vd-mhf-pre", contents).html();
      if (mhfStyle && (mhfStyle + "").length) wizardData.hideElementsCSS = mhfConvert(mhfStyle);
      console.log("*******CSS", mhfStyle);
      console.log("*******Formatted CSS", wizardData.hideElementsCSS);

      wizardData.skipHideElementCSS = false;
    } else wizardData.hideElementsCSS = null;

    var continueBtn = params.btn || $(".vd-next-btn .vd-spinner", slide);
    continueBtn.removeClass("vd-skip");
    continueBtn.addClass("fa-circle-notch fa-spin"); // (re)trigger rotation

    wizardData.url = window.location.href;
    var data = {
      nonce: "2nhj98ba1",
      action: "wizard_setup",
      wizardData: wizardData,
    };

    jQuery.ajax({
      type: "post",
      dataType: "json",
      url: "https://www.visualdesigner.io/dist/vd_setup_wizard.php",
      data: data,
      success: function (response) {},
      error: function (response) {
        console.log("error", response);
      },
      complete: function (response) {},
    });

    jQuery.ajax({
      type: "post",
      dataType: "json",
      url: "admin-post.php?action=vd_mhf_wizard_submit",
      data: wizardData,
      success: function (response) {
        // console.log('response', response);
        if (response.type == "success") {
          if (response.editUrl) $(".vd-finish-btn").attr("href", response.editUrl);
          // Advance to finish slide
          // $(slide).nextAll('.vd-slide:not(.vd-skip):first')[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          mhfScrollTo($(slide).nextAll(".vd-slide:not(.vd-skip):first"));
          vdmhfShowInstruct($(slide).nextAll(".vd-slide:not(.vd-skip):first"));
        }
      },
      error: function (response) {
        console.log("error", response);
      },
      complete: function (response) {
        isProcessing = false;
        continueBtn.removeClass("vd-skip fa-spin");
        continueBtn.addClass("vd-skip");
      },
    });

    return false;
  };
  // window.step6Validator = function(slide) {
  //   return true;
  // };

  selectGoal = function (customHeader, customFooter, btn) {
    wizardData.customHeader = customHeader;
    wizardData.customFooter = customFooter;

    if (wizardData.customHeader && wizardData.customFooter) {
      $("#vd-step1,#vd-step2,#vd-step3,#vd-step4").removeClass("vd-skip");
      $("#rvdid-29-4 .vd-bullet").removeClass("vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden");
      wizardData.hideDecision = "hide_both";
      sendHideDecision("hide_both");
    } else if (wizardData.customHeader) {
      $("#vd-step3").removeClass("vd-skip");
      $("#vd-step4").addClass("vd-skip");
      $("#rvdid-29-4 .vd-bullet").last().addClass("vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden");
      wizardData.hideDecision = "hide_header";
      sendHideDecision("hide_header");
    } else if (wizardData.customFooter) {
      $("#vd-step4").removeClass("vd-skip");
      $("#vd-step3").addClass("vd-skip");
      $("#rvdid-29-4 .vd-bullet").last().addClass("vd-desktop-hidden vd-tablet-hidden vd-mobile-hidden");
      wizardData.hideDecision = "hide_footer";
      sendHideDecision("hide_footer");
    }

    $(".vd-hlink").removeClass("vd-selected");
    $(btn).addClass("vd-selected");
  };

  selectTemplate = function (id, prop) {
    wizardData[prop] = id;
  };

  showWhyModal = function () {
    wizardData.whyPerformStepClicked = true;
    $.vdg.widgetFactory(
      "modalWidget",
      {
        title: "<h1>Why do I need to perform this step?</h1>",
        content:
          "<br/><small>If you want to keep your existing theme header and/or footer you don't need to perform this step. Simply click the <strong>Skip Step</strong> button.</small><br/><br/> <p>My Header Footer plugin is compatible with almost any theme, but automatic integration does not always work correctly with some themes. We get the user to confirm exactly which theme elements they want to remove thereby having complete control over the changes being made.</p>",
      },
      $("body")
    );
  };

  showCreditsModal = function () {
    wizardData.creditsModalClicked = true;
    $.vdg.widgetFactory(
      "modalWidget",
      {
        title: "<h1>Credits</h1>",
        content: '<a href="http://www.onlinewebfonts.com" target="_blank">oNline Web Fonts</a>',
      },
      $("body")
    );
  };

  vdmhfRenderIframe = function (obj) {
    setTimeout(function () {
      // Hide WP top bar and vd-release elements
      $("#wpadminbar,.vd-release", $("#vd-iframe-std").contents()).css("display", "none");
      $("#site-content,#content,.site-content,.content", $("#vd-iframe-std").contents()).css({
        "max-height": "1000px",
        overflow: "hidden",
      });
      $("html", $("#vd-iframe-std").contents()).css({
        overflow: "hidden",
      });
      $("style#mhf-priv", $("#vd-iframe-std").contents()).remove();

      // Override html->margin-top: 32px !important;
      var iHtml = $("html", $("#vd-iframe-std").contents());
      iHtml.attr("style", iHtml.attr("style") + ";margin-top:0px!important");
    }, 2);
  };

  vdmhfShowInstruct = function (slide) {
    $("#vd-w-instruct span[for]").hide();
    $("#vd-w-instruct-detail span[for]").hide();
    $('#vd-w-instruct span[for="' + slide.attr("id") + '"]').fadeIn();
    $('#vd-w-instruct-detail span[for="' + slide.attr("id") + '"]').fadeIn();
    $(".vd-w-error").hide();

    if (slide.attr("id") == "vd-step2") {
      // $('#vd-iframe-ml').each(function() {
      //   if (!$(this).is("[src]"))
      //     LazyLoad.load(this, {threshold:0});
      //   else console.log('@@@@@@@@@@@@@@@@Already loaded');
      // });
    }
    if (slide.attr("id") == "vd-step2") {
      $("#vd-step3 .vd-slider-widget img, #vd-step4 .vd-slider-widget img").each(function () {
        if (!$(this).is("[src]")) LazyLoad.load(this, { threshold: 0 });
        // else console.log('@@@@@@@@@@@@@@@@Already loaded');
      });
      // $('#vd-iframe-std').each(function() {
      //   if (!$(this).is("[src]"))
      //     LazyLoad.load(this, {threshold:0});
      //   else console.log('@@@@@@@@@@@@@@@@Already loaded');
      // });
    }
    if (slide.attr("id") == "vd-step3" || slide.attr("id") == "vd-step4") {
      // $('#vd-iframe-ml').each(function() {
      //   if (!$(this).is("[src]"))
      //     LazyLoad.load(this, {threshold:0});
      //   else console.log('@@@@@@@@@@@@@@@@Already loaded');
      // });
      // setTimeout(function() {
      // sendHideDecision(wizardData.hideDecision);
      // }, 500);
    }

    if (slide.attr("id") == "vd-step5") {
      setTimeout(function () {
        var cwin1 = $("#vd-iframe-ml")[0].contentWindow || $("#vd-iframe-ml")[0].contentDocument;
        // var cwin2 = (cwin1.jQuery('#vd-platform-view')[0].contentWindow || cwin1.jQuery('#vd-platform-view')[0].contentDocument);
        var cwin3 = $("#vd-iframe-std")[0].contentWindow || $("#vd-iframe-std")[0].contentDocument;
        $("#vd-iframe-ml")[0].style.width = cwin1.document.body.scrollWidth + "px";
        $("#vd-iframe-ml")[0].style.height = $(cwin1.document.body).outerHeight() + "px";
        $("#vd-iframe-std")[0].style.width = cwin3.document.body.scrollWidth + "px";
        $("#vd-iframe-std")[0].style.height = $(cwin3.document.body).outerHeight() + "px";
        $("#vd-iframe-std")
          .parent()
          .css("height", $("#vd-iframe-std")[0].getBoundingClientRect().height + 60 + "px");
      }, 10);

      // Dynamically size iframes to fit
      var colWidth = $(".vd-iframe-cnt").first().outerWidth() - 20;
      var ratio = parseFloat(colWidth, 10) / parseInt($("#vd-iframe-std").attr("width") || 1200, 10);
      console.log("DYNAMICALLY refitting", colWidth, ratio);

      setTimeout(function () {
        sendHideDecision(wizardData.hideDecision);
      }, 20);
    } else {
      $("#vd-iframe-ml")[0].style.height = "100%";
      $("#vd-iframe-std")[0].style.height = "100%";
      $("#vd-iframe-std").parent().css("height", "100%");
    }
  };

  var sendHideDecision = function (decision) {
    var cwin1 = $("#vd-iframe-ml")[0].contentWindow || $("#vd-iframe-ml")[0].contentDocument;
    cwin1.postMessage({ action: "mhf_hide_decision", value: decision }, "*");
  };

  var mhfConvert = function (convert) {
    return $("<span />", { html: convert }).text();
  };

  var mhfScrollTo = function (slide) {
    var cnt = $("#rvdid-29-5");
    cnt.scrollLeft((cnt.scrollLeft() || 0) + $(slide).position().left + 1, 750);
  };

  setTimeout(function () {
    $('input[type="radio"]').prop("checked", false);
  }, 10);

  $(document).ready(function () {
    window.ll = new LazyLoad({
      threshold: 0,
    });

    mhfScrollTo($("#vd-step1"));
    $.vdg.releaseRender(false, true);

    $(".vd-next-btn").on("mouseup", function (ev, params) {
      var slide = $(this).closest(".vd-column-widget");
      if (window[slide.attr("vd-validator")](slide, params) == true) { // MUST  == true
        mhfScrollTo(slide.nextAll(".vd-slide:not(.vd-skip):first"));
        vdmhfShowInstruct(slide.nextAll(".vd-slide:not(.vd-skip):first"));
      } else {
        $(".vd-w-error", slide).fadeIn().delay(3000).fadeOut("slow");
      }
    });

    $(".vd-setup-wizard .vd-bullet").on("mouseup", function (ev) {
      var bulletIndex = $(this).index(); //($(this).index()-1 >= 0) ? $(this).index()-1 : 0;
      var slide = $(".vd-setup-wizard > .vd-row-widget > .vd-slide:not(.vd-skip)").eq(bulletIndex);
      var prevSlide = slide.prevAll(".vd-slide:not(.vd-skip):first");

      if (bulletIndex == 0) {
        // slide[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        mhfScrollTo(slide);
        vdmhfShowInstruct(slide);
      } else if (!prevSlide.attr("vd-validator") || window[prevSlide.attr("vd-validator")](prevSlide) == true) { // MUST  == true
        mhfScrollTo(slide);
        vdmhfShowInstruct(slide);
      } else {
        $(".vd-w-error", prevSlide).fadeIn().delay(3000).fadeOut("slow");
      }
    });

    $(".vd-skip-btn").click(function () {
      wizardData.skipHideElementCSS = true;
      wizardData.hideElementsCSS = null;
      var slide = $(this).closest(".vd-column-widget");
      $(".vd-next-btn", slide).trigger("mouseup", { skipHideElementCSS: true, btn: $(".vd-spinner", $(this)) });
    });
  });
})(jQuery);

</script>


