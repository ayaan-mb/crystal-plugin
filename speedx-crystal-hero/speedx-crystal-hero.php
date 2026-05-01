<?php
/**
 * Plugin Name: SpeedX Crystal Hero
 * Plugin URI: https://speedxmarketing.com
 * Description: Interactive WebGL crystal hero section shortcode using Three.js and GSAP.
 * Version: 1.0.0
 * Author: SpeedX Marketing
 * License: GPL2+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: speedx-crystal-hero
 */

if (!defined('ABSPATH')) {
    exit;
}

final class SpeedX_Crystal_Hero_Plugin
{
    const VERSION = '1.0.0';

    private static $shortcode_used = false;

    public function __construct()
    {
        add_shortcode('speedx_crystal_hero', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'register_assets'));
        add_action('wp_enqueue_scripts', array($this, 'conditionally_enqueue_assets'));
        add_action('admin_menu', array($this, 'register_admin_page'));
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_settings_link'));
    }

    public function register_assets()
    {
        wp_register_style(
            'speedx-crystal-hero-style',
            plugin_dir_url(__FILE__) . 'assets/css/style.css',
            array(),
            self::VERSION
        );

        wp_register_script(
            'speedx-three-js',
            'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.min.js',
            array(),
            '0.161.0',
            true
        );

        wp_register_script(
            'speedx-gsap',
            'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
            array(),
            '3.12.5',
            true
        );

        wp_register_script(
            'speedx-crystal-hero-script',
            plugin_dir_url(__FILE__) . 'assets/js/crystal-hero.js',
            array('speedx-three-js', 'speedx-gsap'),
            self::VERSION,
            true
        );
    }

    public function conditionally_enqueue_assets()
    {
        if (!self::$shortcode_used) {
            return;
        }

        wp_enqueue_style('speedx-crystal-hero-style');
        wp_enqueue_script('speedx-three-js');
        wp_enqueue_script('speedx-gsap');
        wp_enqueue_script('speedx-crystal-hero-script');
    }



    public function register_admin_page()
    {
        add_options_page(
            'SpeedX Crystal Hero',
            'SpeedX Crystal Hero',
            'manage_options',
            'speedx-crystal-hero',
            array($this, 'render_admin_page')
        );
    }

    public function add_settings_link($links)
    {
        $url = admin_url('options-general.php?page=speedx-crystal-hero');
        array_unshift($links, '<a href="' . esc_url($url) . '">Settings</a>');
        return $links;
    }

    public function render_admin_page()
    {
        ?>
        <div class="wrap">
            <h1>SpeedX Crystal Hero</h1>
            <p>Plugin is active. Use this shortcode on any page, post, or Elementor Shortcode widget:</p>
            <code>[speedx_crystal_hero]</code>
            <p>Tip: place the shortcode in a full-width section for best visual impact.</p>
        </div>
        <?php
    }

    public function render_shortcode($atts = array(), $content = null)
    {
        self::$shortcode_used = true;

        ob_start();
        ?>
        <section class="speedx-hero" data-speedx-crystal-hero>
            <div class="speedx-hero__bg-glow" aria-hidden="true"></div>
            <div class="speedx-hero__inner">
                <div class="speedx-hero__visual">
                    <div class="speedx-crystal-wrap">
                        <canvas class="speedx-crystal-canvas" aria-hidden="true"></canvas>
                        <div class="speedx-crystal-hint">Click, hold & drag</div>
                    </div>
                </div>

                <div class="speedx-hero__content">
                    <h1 class="speedx-hero__title">SpeedX Marketing</h1>
                    <p class="speedx-hero__subtitle">Interactive Websites, Smart Automation &amp; High-Converting Digital Experiences</p>
                    <a href="#" class="speedx-hero__button">Start Your Project</a>
                </div>
            </div>
        </section>
        <?php
        return ob_get_clean();
    }
}

new SpeedX_Crystal_Hero_Plugin();
