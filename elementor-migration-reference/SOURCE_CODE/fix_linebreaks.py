#!/usr/bin/env python3
import re

# Read the file
with open('html-to-elementor-converter.html', 'r') as f:
    content = f.read()

# Fix specific known broken patterns
replacements = [
    # Fix "Tr\nansform"
    (r'Tr\s*\nansform', 'Transform'),
    # Fix "result.c\nss"
    (r'result\.c\s*\nss', 'result.css'),
    # Fix "JSON.st\nringify"
    (r'JSON\.st\s*\nringify', 'JSON.stringify'),
    # Fix "generateDefaultValues\n(result.fields)"
    (r'generateDefaultValues\s*\n\(result\.fields\)', 'generateDefaultValues(result.fields)'),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open('html-to-elementor-converter.html', 'w') as f:
    f.write(content)

print("Fixed line breaks!")
