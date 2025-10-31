/**
 * PHP Syntax Validator Tests
 *
 * Tests all known PHP syntax issues that have occurred in Quick Widget generation.
 */

import { validatePhpWidget, formatValidationResult } from '../php-syntax-validator';

describe('PHP Syntax Validator', () => {
  describe('Orphaned PHP Tags', () => {
    test('should detect orphaned <?php tag in render method', () => {
      const code = `<?php
class Test_Widget extends \\Elementor\\Widget_Base {
    protected function render() {
        $settings = $this->get_settings_for_display();

<?php
        $heading_text = $settings['heading'];
        ?>
        <h1><?php echo $heading_text; ?></h1>
    }
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
      expect(result.errors[0].message).toContain('Orphaned <?php tag');
    });

    test('should allow <?php after ?> (valid transition)', () => {
      const code = `<?php
class Test_Widget extends \\Elementor\\Widget_Base {
    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <h1>Hello</h1>
        <?php
        // Custom CSS
    }
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('HTML Document Structure', () => {
    test('should detect DOCTYPE in widget', () => {
      const code = `<?php
protected function render() {
    ?>
    <!DOCTYPE html>
    <html>
    <head><title>Test</title></head>
    <body>
        <h1>Hello</h1>
    </body>
    </html>
    <?php
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('DOCTYPE'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('<html>'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('<head>'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('<body>'))).toBe(true);
    });

    test('should allow section-level HTML', () => {
      const code = `<?php
protected function render() {
    ?>
    <section class="hero">
        <h1>Welcome</h1>
        <p>Description</p>
    </section>
    <?php
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(true);
    });
  });

  describe('PHP Mode Transitions', () => {
    test('should detect HTML output without closing PHP mode', () => {
      const code = `<?php
protected function render() {
    $settings = $this->get_settings_for_display();
    <h1>Hello</h1>
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('without closing PHP mode'))).toBe(true);
    });

    test('should detect redundant ?>...<?php transitions', () => {
      const code = `<?php
protected function render() {
    $var = 'test';
    ?>
    <?php
    $var2 = 'test2';
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('redundant'))).toBe(true);
    });
  });

  describe('Control Names', () => {
    test('should detect invalid control names', () => {
      const code = `<?php
protected function render() {
    $settings = $this->get_settings_for_display();
    echo $settings['control-with-dashes'];
    echo $settings['control with spaces'];
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('Invalid control name'))).toBe(true);
    });

    test('should allow valid control names', () => {
      const code = `<?php
protected function render() {
    $settings = $this->get_settings_for_display();
    echo $settings['h1_0_heading_text'];
    echo $settings['button_link_url'];
}`;

      const result = validatePhpWidget(code);
      expect(result.errors.filter(e => e.message.includes('control name'))).toHaveLength(0);
    });
  });

  describe('Balanced Quotes', () => {
    test('should detect unbalanced single quotes', () => {
      const code = `<?php
$var = 'unclosed string;
echo 'test';`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unbalanced single quotes'))).toBe(true);
    });

    test('should detect unbalanced double quotes', () => {
      const code = `<?php
$var = "unclosed string;
echo "test";`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unbalanced double quotes'))).toBe(true);
    });
  });

  describe('Class Structure', () => {
    test('should detect missing Widget_Base extension', () => {
      const code = `<?php
class Test_Widget {
    protected function render() {}
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('extend \\Elementor\\Widget_Base'))).toBe(true);
    });

    test('should detect missing required methods', () => {
      const code = `<?php
class Test_Widget extends \\Elementor\\Widget_Base {
    public function get_name() { return 'test'; }
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('get_title'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('render'))).toBe(true);
    });

    test('should validate complete widget structure', () => {
      const code = `<?php
class Test_Widget extends \\Elementor\\Widget_Base {
    public function get_name() { return 'test'; }
    public function get_title() { return 'Test'; }
    public function get_icon() { return 'eicon-code'; }
    public function get_categories() { return ['general']; }
    protected function register_controls() {}
    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <h1><?php echo esc_html($settings['heading']); ?></h1>
        <?php
    }
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Real-World Error Cases', () => {
    test('Issue #1: Static HTML with orphaned PHP tag (Navigation Bar)', () => {
      const code = `<?php
protected function render() {
    $settings = $this->get_settings_for_display();

<?php
    ?>
    <nav class="navbar">
        <a href="#">Home</a>
    </nav>

    <?php
    // Custom CSS
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Orphaned'))).toBe(true);
    });

    test('Issue #2: Dynamic HTML ending with PHP block (Hello World)', () => {
      const code = `<?php
protected function render() {
    $settings = $this->get_settings_for_display();

    $heading_text = $settings['heading'];
    ?>
    <h1><?php echo $heading_text; ?></h1>
    <?php endif; ?>

    // Custom CSS
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      // Should catch that // comment is outside PHP mode
    });

    test('Issue #3: Full HTML document in widget (Coming Soon)', () => {
      const code = `<?php
protected function render() {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
    </head>
    <body>
        <section class="hero">
            <h1>Coming Soon</h1>
        </section>
        <script src="script.js"></script>
    </body>
    </html>
    <?php
}`;

      const result = validatePhpWidget(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
      expect(result.errors.some(e => e.message.includes('DOCTYPE'))).toBe(true);
    });
  });

  describe('Format Validation Result', () => {
    test('should format errors and warnings', () => {
      const result = {
        valid: false,
        errors: [
          { type: 'syntax' as const, message: 'Orphaned PHP tag', line: 42 },
          { type: 'structure' as const, message: 'Missing method', snippet: 'class Foo' }
        ],
        warnings: [
          { type: 'security' as const, message: 'Unescaped output' }
        ]
      };

      const formatted = formatValidationResult(result);
      expect(formatted).toContain('❌');
      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('Orphaned PHP tag');
      expect(formatted).toContain('Line: 42');
      expect(formatted).toContain('Unescaped output');
    });

    test('should format valid result', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: []
      };

      const formatted = formatValidationResult(result);
      expect(formatted).toContain('✅');
      expect(formatted).toContain('valid');
    });
  });
});
