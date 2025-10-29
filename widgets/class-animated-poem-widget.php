<?php
/**
 * Elementor Animated Poem Widget
 *
 * @package Hustle_Tools
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Elementor_Animated_Poem_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name.
     */
    public function get_name() {
        return 'animated_poem_widget';
    }

    /**
     * Get widget title.
     */
    public function get_title() {
        return esc_html__('Animated Poem', 'hustle-tools');
    }

    /**
     * Get widget icon.
     */
    public function get_icon() {
        return 'eicon-text-area';
    }

    /**
     * Get widget categories.
     */
    public function get_categories() {
        return ['hustle-tools'];
    }

    /**
     * Get widget keywords.
     */
    public function get_keywords() {
        return ['poem', 'text', 'animated', 'heading', 'quote'];
    }

    /**
     * Register widget controls.
     */
    protected function register_controls() {

        // =====================================================
        // CONTENT TAB - Poem Content Section
        // =====================================================
        $this->start_controls_section(
            'section_poem_content',
            [
                'label' => esc_html__('Poem Content', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'poem_text',
            [
                'label' => esc_html__('Poem Text', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'rows' => 10,
                'default' => 'Two roads diverged in a wood, and I— I took the one less traveled by, and that has made all the difference.',
                'placeholder' => esc_html__('Enter your poem text here...', 'hustle-tools'),
                'description' => 'CSS Selector: .animated-poem',
                'dynamic' => [
                    'active' => true,
                ],
            ]
        );

        $this->add_control(
            'poem_html_tag',
            [
                'label' => esc_html__('HTML Tag', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    'h1' => 'H1',
                    'h2' => 'H2',
                    'h3' => 'H3',
                    'h4' => 'H4',
                    'h5' => 'H5',
                    'h6' => 'H6',
                    'div' => 'div',
                    'p' => 'p',
                    'span' => 'span',
                ],
                'default' => 'h1',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // STYLE TAB - Typography Section
        // =====================================================
        $this->start_controls_section(
            'section_poem_typography',
            [
                'label' => esc_html__('Typography', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'poem_typography',
                'label' => esc_html__('Poem Typography', 'hustle-tools'),
                'selector' => '{{WRAPPER}} .animated-poem',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_text_align',
            [
                'label' => esc_html__('Text Alignment', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => esc_html__('Left', 'hustle-tools'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => esc_html__('Center', 'hustle-tools'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => esc_html__('Right', 'hustle-tools'),
                        'icon' => 'eicon-text-align-right',
                    ],
                    'justify' => [
                        'title' => esc_html__('Justified', 'hustle-tools'),
                        'icon' => 'eicon-text-align-justify',
                    ],
                ],
                'default' => 'left',
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'text-align: {{VALUE}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_text_transform',
            [
                'label' => esc_html__('Text Transform', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    '' => esc_html__('Default', 'hustle-tools'),
                    'uppercase' => esc_html__('Uppercase', 'hustle-tools'),
                    'lowercase' => esc_html__('Lowercase', 'hustle-tools'),
                    'capitalize' => esc_html__('Capitalize', 'hustle-tools'),
                    'none' => esc_html__('None', 'hustle-tools'),
                ],
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'text-transform: {{VALUE}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // STYLE TAB - Color Section
        // =====================================================
        $this->start_controls_section(
            'section_poem_color',
            [
                'label' => esc_html__('Colors', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'poem_text_color',
            [
                'label' => esc_html__('Text Color', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'color: {{VALUE}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_background_color',
            [
                'label' => esc_html__('Background Color', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'background-color: {{VALUE}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // STYLE TAB - Text Shadow Section
        // =====================================================
        $this->start_controls_section(
            'section_poem_text_shadow',
            [
                'label' => esc_html__('Text Shadow', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Text_Shadow::get_type(),
            [
                'name' => 'poem_text_shadow',
                'label' => esc_html__('Text Shadow', 'hustle-tools'),
                'selector' => '{{WRAPPER}} .animated-poem',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // STYLE TAB - Border Section
        // =====================================================
        $this->start_controls_section(
            'section_poem_border',
            [
                'label' => esc_html__('Border', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'poem_border',
                'label' => esc_html__('Border', 'hustle-tools'),
                'selector' => '{{WRAPPER}} .animated-poem',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_responsive_control(
            'poem_border_radius',
            [
                'label' => esc_html__('Border Radius', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'poem_box_shadow',
                'label' => esc_html__('Box Shadow', 'hustle-tools'),
                'selector' => '{{WRAPPER}} .animated-poem',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // STYLE TAB - Spacing Section
        // =====================================================
        $this->start_controls_section(
            'section_poem_spacing',
            [
                'label' => esc_html__('Spacing', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'poem_margin',
            [
                'label' => esc_html__('Margin', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_responsive_control(
            'poem_padding',
            [
                'label' => esc_html__('Padding', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%', 'em'],
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // STYLE TAB - Additional Styling
        // =====================================================
        $this->start_controls_section(
            'section_poem_additional_styling',
            [
                'label' => esc_html__('Additional Styling', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'poem_display',
            [
                'label' => esc_html__('Display', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    '' => esc_html__('Default', 'hustle-tools'),
                    'block' => esc_html__('Block', 'hustle-tools'),
                    'inline-block' => esc_html__('Inline Block', 'hustle-tools'),
                    'inline' => esc_html__('Inline', 'hustle-tools'),
                    'flex' => esc_html__('Flex', 'hustle-tools'),
                    'none' => esc_html__('None', 'hustle-tools'),
                ],
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'display: {{VALUE}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_responsive_control(
            'poem_width',
            [
                'label' => esc_html__('Width', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'vw'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 2000,
                        'step' => 1,
                    ],
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'width: {{SIZE}}{{UNIT}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_responsive_control(
            'poem_max_width',
            [
                'label' => esc_html__('Max Width', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'vw'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 2000,
                        'step' => 1,
                    ],
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_opacity',
            [
                'label' => esc_html__('Opacity', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1,
                        'step' => 0.01,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'opacity: {{SIZE}};',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // ADVANCED TAB - Custom CSS Section
        // =====================================================
        $this->start_controls_section(
            'section_custom_css',
            [
                'label' => esc_html__('Custom CSS', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'custom_css',
            [
                'label' => esc_html__('Custom CSS', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::CODE,
                'language' => 'css',
                'rows' => 20,
                'description' => esc_html__('Add your custom CSS code here. Use "selector" to target the widget wrapper. Example: selector .animated-poem { color: red; }', 'hustle-tools'),
                'placeholder' => 'selector .animated-poem {' . "\n" . '    /* Your custom styles here */' . "\n" . '}',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // ADVANCED TAB - Custom JavaScript Section
        // =====================================================
        $this->start_controls_section(
            'section_custom_js',
            [
                'label' => esc_html__('Custom JavaScript', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'custom_js',
            [
                'label' => esc_html__('Custom JavaScript', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::CODE,
                'language' => 'javascript',
                'rows' => 20,
                'description' => esc_html__('Add your custom JavaScript code here. The code will be wrapped in jQuery(document).ready(). Do not include <script> tags.', 'hustle-tools'),
                'placeholder' => '// Your custom JavaScript code here' . "\n" . 'console.log("Animated Poem Widget Loaded");',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // ADVANCED TAB - Animation Section
        // =====================================================
        $this->start_controls_section(
            'section_animation',
            [
                'label' => esc_html__('Entrance Animation', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'poem_entrance_animation',
            [
                'label' => esc_html__('Entrance Animation', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::ANIMATION,
                'prefix_class' => 'animated ',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_animation_duration',
            [
                'label' => esc_html__('Animation Duration (ms)', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 1000,
                'min' => 0,
                'max' => 10000,
                'step' => 100,
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'animation-duration: {{VALUE}}ms;',
                ],
                'condition' => [
                    'poem_entrance_animation!' => '',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_animation_delay',
            [
                'label' => esc_html__('Animation Delay (ms)', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 0,
                'min' => 0,
                'max' => 10000,
                'step' => 100,
                'selectors' => [
                    '{{WRAPPER}} .animated-poem' => 'animation-delay: {{VALUE}}ms;',
                ],
                'condition' => [
                    'poem_entrance_animation!' => '',
                ],
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // ADVANCED TAB - Visibility Section
        // =====================================================
        $this->start_controls_section(
            'section_visibility',
            [
                'label' => esc_html__('Visibility', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'poem_hide_desktop',
            [
                'label' => esc_html__('Hide on Desktop', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Yes', 'hustle-tools'),
                'label_off' => esc_html__('No', 'hustle-tools'),
                'return_value' => 'yes',
                'default' => '',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_hide_tablet',
            [
                'label' => esc_html__('Hide on Tablet', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Yes', 'hustle-tools'),
                'label_off' => esc_html__('No', 'hustle-tools'),
                'return_value' => 'yes',
                'default' => '',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->add_control(
            'poem_hide_mobile',
            [
                'label' => esc_html__('Hide on Mobile', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Yes', 'hustle-tools'),
                'label_off' => esc_html__('No', 'hustle-tools'),
                'return_value' => 'yes',
                'default' => '',
                'description' => 'CSS Selector: .animated-poem',
            ]
        );

        $this->end_controls_section();

        // =====================================================
        // ADVANCED TAB - Custom Attributes
        // =====================================================
        $this->start_controls_section(
            'section_custom_attributes',
            [
                'label' => esc_html__('Custom Attributes', 'hustle-tools'),
                'tab' => \Elementor\Controls_Manager::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'poem_custom_id',
            [
                'label' => esc_html__('Custom ID', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '',
                'placeholder' => 'my-custom-id',
                'description' => esc_html__('Add a custom ID attribute to the poem element (without #).', 'hustle-tools') . ' CSS Selector: .animated-poem',
                'label_block' => true,
            ]
        );

        $this->add_control(
            'poem_custom_classes',
            [
                'label' => esc_html__('Custom CSS Classes', 'hustle-tools'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '',
                'placeholder' => 'class-one class-two',
                'description' => esc_html__('Add custom CSS classes to the poem element (space-separated).', 'hustle-tools') . ' CSS Selector: .animated-poem',
                'label_block' => true,
            ]
        );

        $this->end_controls_section();

    }

    /**
     * Render widget output on the frontend.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();

        // Build class list
        $classes = ['animated-poem'];

        // Add custom classes
        if (!empty($settings['poem_custom_classes'])) {
            $custom_classes = explode(' ', $settings['poem_custom_classes']);
            $classes = array_merge($classes, $custom_classes);
        }

        // Add visibility classes
        if ($settings['poem_hide_desktop'] === 'yes') {
            $classes[] = 'elementor-hidden-desktop';
        }
        if ($settings['poem_hide_tablet'] === 'yes') {
            $classes[] = 'elementor-hidden-tablet';
        }
        if ($settings['poem_hide_mobile'] === 'yes') {
            $classes[] = 'elementor-hidden-mobile';
        }

        // Build attributes
        $attributes = [];

        // Add custom ID
        if (!empty($settings['poem_custom_id'])) {
            $attributes[] = 'id="' . esc_attr($settings['poem_custom_id']) . '"';
        }

        // Add classes
        $attributes[] = 'class="' . esc_attr(implode(' ', $classes)) . '"';

        // Get HTML tag
        $html_tag = !empty($settings['poem_html_tag']) ? $settings['poem_html_tag'] : 'h1';

        // Output the HTML
        ?>
        <<?php echo esc_attr($html_tag); ?> <?php echo implode(' ', $attributes); ?>>
            <?php echo wp_kses_post($settings['poem_text']); ?>
        </<?php echo esc_attr($html_tag); ?>>

        <?php
        // Output custom CSS
        if (!empty($settings['custom_css'])) {
            $custom_css = str_replace('selector', '{{WRAPPER}}', $settings['custom_css']);
            $custom_css = str_replace('{{WRAPPER}}', '.elementor-element-' . $this->get_id(), $custom_css);
            ?>
            <style>
                <?php echo $custom_css; ?>
            </style>
            <?php
        }

        // Output custom JavaScript
        if (!empty($settings['custom_js'])) {
            ?>
            <script>
                (function($) {
                    $(document).ready(function() {
                        <?php echo $settings['custom_js']; ?>
                    });
                })(jQuery);
            </script>
            <?php
        }
    }

    /**
     * Render widget output in the editor.
     */
    protected function content_template() {
        ?>
        <#
        var classes = ['animated-poem'];

        // Add custom classes
        if (settings.poem_custom_classes) {
            var customClasses = settings.poem_custom_classes.split(' ');
            classes = classes.concat(customClasses);
        }

        // Add visibility classes
        if (settings.poem_hide_desktop === 'yes') {
            classes.push('elementor-hidden-desktop');
        }
        if (settings.poem_hide_tablet === 'yes') {
            classes.push('elementor-hidden-tablet');
        }
        if (settings.poem_hide_mobile === 'yes') {
            classes.push('elementor-hidden-mobile');
        }

        var htmlTag = settings.poem_html_tag || 'h1';
        var customId = settings.poem_custom_id ? ' id="' + settings.poem_custom_id + '"' : '';
        #>
        <{{{ htmlTag }}} class="{{{ classes.join(' ') }}}" {{{ customId }}}>
            {{{ settings.poem_text }}}
        </{{{ htmlTag }}}>
        <?php
    }
}
