#!/usr/bin/env python3
"""
Hook: PostToolUse for Write (triggered by cache-research.py or manually)
Purpose: Generate api-tests-manifest.json entry from Zod schema

This hook reads the created Zod schema file and generates a comprehensive
manifest entry that gets appended to api-tests-manifest.json.

Added in v3.6.7 for complete API documentation automation.

What it generates:
  - Full requestSchema from Zod
  - All parameters with types, required, descriptions
  - Example curl commands for every parameter combination
  - Test cases from the test file
  - Response schema

Returns:
  - {"continue": true} - Always continues
"""
import json
import sys
import re
from datetime import datetime
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
# Default manifest location - can be overridden
DEFAULT_MANIFEST = Path.cwd() / "src" / "app" / "api-test" / "api-tests-manifest.json"


def get_active_endpoint(state):
    """Get active endpoint - supports both old and new state formats."""
    if "endpoints" in state and "active_endpoint" in state:
        active = state.get("active_endpoint")
        if active and active in state["endpoints"]:
            return active, state["endpoints"][active]
        return None, None

    endpoint = state.get("endpoint")
    if endpoint:
        return endpoint, state

    return None, None


def parse_zod_schema(schema_content: str) -> dict:
    """Parse Zod schema content and extract all field information."""
    properties = {}
    required = []

    # Match Zod object definitions
    # Pattern: fieldName: z.type(...).chain()
    field_pattern = r'(\w+):\s*z\.(\w+)\(([^)]*)\)([^\n,}]*)'

    for match in re.finditer(field_pattern, schema_content):
        field_name = match.group(1)
        zod_type = match.group(2)
        type_args = match.group(3)
        chain = match.group(4) or ""

        # Skip if it's not a real field
        if field_name in {'z', 'const', 'export', 'type', 'schema'}:
            continue

        prop = {}

        # Map Zod types to JSON Schema types
        type_map = {
            "string": "string",
            "number": "number",
            "boolean": "boolean",
            "array": "array",
            "object": "object",
            "date": "string",
            "bigint": "integer",
            "any": "any",
            "unknown": "any",
            "null": "null",
            "undefined": "null",
            "void": "null",
            "never": "null",
        }

        # Handle enum
        if zod_type == "enum":
            prop["type"] = "string"
            # Extract enum values: z.enum(["a", "b", "c"])
            enum_match = re.search(r'\[([^\]]+)\]', type_args)
            if enum_match:
                enum_str = enum_match.group(1)
                enum_values = re.findall(r'["\']([^"\']+)["\']', enum_str)
                if enum_values:
                    prop["enum"] = enum_values
        elif zod_type == "literal":
            prop["type"] = "string"
            literal_match = re.search(r'["\']([^"\']+)["\']', type_args)
            if literal_match:
                prop["const"] = literal_match.group(1)
        elif zod_type == "union":
            prop["type"] = "string"  # Simplified
        elif zod_type == "array":
            prop["type"] = "array"
            prop["items"] = {"type": "any"}
        else:
            prop["type"] = type_map.get(zod_type, "string")

        # Check for optional
        is_optional = ".optional()" in chain or ".nullish()" in chain

        # Extract description
        desc_match = re.search(r'\.describe\(["\']([^"\']+)["\']', chain)
        if desc_match:
            prop["description"] = desc_match.group(1)

        # Extract default
        default_match = re.search(r'\.default\(([^)]+)\)', chain)
        if default_match:
            default_val = default_match.group(1).strip()
            # Try to parse the default value
            if default_val.startswith('"') or default_val.startswith("'"):
                prop["default"] = default_val.strip('"\'')
            elif default_val == "true":
                prop["default"] = True
            elif default_val == "false":
                prop["default"] = False
            elif default_val.isdigit():
                prop["default"] = int(default_val)
            else:
                try:
                    prop["default"] = float(default_val)
                except ValueError:
                    prop["default"] = default_val

        # Extract min/max for numbers
        min_match = re.search(r'\.min\((\d+)\)', chain)
        if min_match:
            prop["minimum"] = int(min_match.group(1))

        max_match = re.search(r'\.max\((\d+)\)', chain)
        if max_match:
            prop["maximum"] = int(max_match.group(1))

        # Extract minLength/maxLength for strings
        min_len_match = re.search(r'\.min\((\d+)\)', chain)
        if min_len_match and prop.get("type") == "string":
            prop["minLength"] = int(min_len_match.group(1))

        max_len_match = re.search(r'\.max\((\d+)\)', chain)
        if max_len_match and prop.get("type") == "string":
            prop["maxLength"] = int(max_len_match.group(1))

        properties[field_name] = prop

        if not is_optional:
            required.append(field_name)

    return {
        "type": "object",
        "properties": properties,
        "required": required
    }


def detect_http_method(route_content: str) -> str:
    """Detect HTTP method from route file."""
    if "export async function GET" in route_content or "export const GET" in route_content:
        return "GET"
    elif "export async function DELETE" in route_content or "export const DELETE" in route_content:
        return "DELETE"
    elif "export async function PUT" in route_content or "export const PUT" in route_content:
        return "PUT"
    elif "export async function PATCH" in route_content or "export const PATCH" in route_content:
        return "PATCH"
    return "POST"


def generate_example_value(prop: dict, field_name: str, variant: str = "default") -> any:
    """Generate an example value for a property.

    Args:
        prop: Property definition from schema
        field_name: Name of the field
        variant: Which variant to generate:
            - "default": First/default value
            - "alt": Alternative value (2nd enum, different example)
            - "min": Minimum boundary value
            - "max": Maximum boundary value
            - "empty": Empty/minimal value
    """
    # Handle enums with variants
    if "enum" in prop:
        enum_values = prop["enum"]
        if variant == "alt" and len(enum_values) > 1:
            return enum_values[1]
        elif variant == "all":
            return enum_values  # Return all for reference
        return enum_values[0]

    if "const" in prop:
        return prop["const"]

    if variant == "default" and "default" in prop:
        return prop["default"]

    prop_type = prop.get("type", "string")

    if prop_type == "string":
        # Handle boundary variants
        min_len = prop.get("minLength", 0)
        max_len = prop.get("maxLength", 100)

        if variant == "min" and min_len > 0:
            return "x" * min_len
        elif variant == "max" and max_len < 1000:
            return "x" * min(max_len, 50)  # Cap at 50 for readability
        elif variant == "empty":
            return ""

        # Try to generate meaningful example based on field name
        name_lower = field_name.lower()
        if "email" in name_lower:
            return "user@example.com" if variant == "default" else "admin@test.org"
        elif "url" in name_lower or "link" in name_lower:
            return "https://example.com" if variant == "default" else "https://test.org/page"
        elif "domain" in name_lower:
            return "example.com" if variant == "default" else "google.com"
        elif "id" in name_lower:
            return "abc123" if variant == "default" else "xyz789"
        elif "name" in name_lower:
            return "Example Name" if variant == "default" else "Test User"
        elif "model" in name_lower:
            return "gpt-4o" if variant == "default" else "claude-3-opus"
        elif "prompt" in name_lower or "message" in name_lower or "content" in name_lower:
            return "Hello, how can I help you?" if variant == "default" else "Explain quantum computing"
        elif "query" in name_lower or "search" in name_lower:
            return "search term" if variant == "default" else "alternative query"
        else:
            return f"example-{field_name}" if variant == "default" else f"alt-{field_name}"

    elif prop_type == "number":
        minimum = prop.get("minimum", 0)
        maximum = prop.get("maximum", 1000)
        if variant == "min":
            return minimum
        elif variant == "max":
            return maximum
        elif variant == "alt":
            return (minimum + maximum) // 2 if maximum > minimum else 100
        return prop.get("default", 42)

    elif prop_type == "integer":
        minimum = prop.get("minimum", 0)
        maximum = prop.get("maximum", 1000)
        if variant == "min":
            return minimum
        elif variant == "max":
            return maximum
        elif variant == "alt":
            return (minimum + maximum) // 2 if maximum > minimum else 50
        return prop.get("default", 100)

    elif prop_type == "boolean":
        if variant == "alt":
            return not prop.get("default", True)
        return prop.get("default", True)

    elif prop_type == "array":
        items = prop.get("items", {})
        if variant == "empty":
            return []
        elif variant == "single":
            return [generate_example_value(items, f"{field_name}_item", "default")]
        elif variant == "multiple":
            return [
                generate_example_value(items, f"{field_name}_item", "default"),
                generate_example_value(items, f"{field_name}_item", "alt")
            ]
        # Default: show array with one example item
        return [generate_example_value(items, f"{field_name}_item", "default")]

    elif prop_type == "object":
        # For nested objects, try to generate example if we have properties
        nested_props = prop.get("properties", {})
        if nested_props and variant != "empty":
            result = {}
            for nested_name, nested_prop in nested_props.items():
                result[nested_name] = generate_example_value(nested_prop, nested_name, variant)
            return result
        return {}

    return "example"


def get_all_enum_fields(properties: dict) -> list:
    """Find all fields with enum values for generating enum-specific examples."""
    enum_fields = []
    for field_name, prop in properties.items():
        if "enum" in prop and len(prop["enum"]) > 1:
            enum_fields.append({
                "name": field_name,
                "values": prop["enum"]
            })
    return enum_fields


def generate_curl_examples(endpoint: str, method: str, schema: dict) -> list:
    """Generate comprehensive curl examples covering all parameter possibilities."""
    examples = []
    properties = schema.get("properties", {})
    required = schema.get("required", [])

    base_url = f"http://localhost:3001/api/v2/{endpoint}"

    def make_curl(body: dict, extra_headers: list = None) -> str:
        """Helper to generate curl command."""
        if method in ["POST", "PUT", "PATCH"]:
            curl = f"curl -X {method} {base_url} \\\n"
            curl += "  -H \"Content-Type: application/json\""
            if extra_headers:
                for h in extra_headers:
                    curl += f" \\\n  -H \"{h}\""
            curl += f" \\\n  -d '{json.dumps(body, indent=2)}'"
        else:
            # GET/DELETE - use query params
            if body:
                params = []
                for k, v in body.items():
                    if isinstance(v, str):
                        params.append(f"{k}={v}")
                    else:
                        params.append(f"{k}={json.dumps(v)}")
                curl = f"curl \"{base_url}?{'&'.join(params)}\""
            else:
                curl = f"curl {base_url}"
            if extra_headers:
                for h in extra_headers:
                    curl += f" \\\n  -H \"{h}\""
        return curl

    # ================================================================
    # Example 1: Minimal (required fields only)
    # ================================================================
    if required:
        minimal_body = {}
        for field in required:
            if field in properties:
                minimal_body[field] = generate_example_value(properties[field], field, "default")

        if minimal_body:
            examples.append({
                "name": "Minimal (required fields only)",
                "description": f"Request with only required fields: {', '.join(required)}",
                "request": minimal_body,
                "curl": make_curl(minimal_body)
            })

    # ================================================================
    # Example 2: Full (all parameters)
    # ================================================================
    if properties:
        full_body = {}
        for field, prop in properties.items():
            full_body[field] = generate_example_value(prop, field, "default")

        examples.append({
            "name": "Full (all parameters)",
            "description": f"Request with all {len(properties)} parameters",
            "request": full_body,
            "curl": make_curl(full_body)
        })

    # ================================================================
    # Example 3: With authentication header
    # ================================================================
    auth_body = {}
    for field in required[:2]:  # First 2 required fields
        if field in properties:
            auth_body[field] = generate_example_value(properties[field], field, "default")
    if not auth_body:
        auth_body = {"param": "value"}

    examples.append({
        "name": "With authentication",
        "description": "Request with X-API-Key header",
        "request": auth_body,
        "curl": make_curl(auth_body, ["X-API-Key: your-api-key"])
    })

    # ================================================================
    # Example 4-N: Enum variations (one example per enum field per value)
    # ================================================================
    enum_fields = get_all_enum_fields(properties)
    for enum_field in enum_fields:
        field_name = enum_field["name"]
        enum_values = enum_field["values"]

        for i, enum_val in enumerate(enum_values[:4]):  # Cap at 4 values per enum
            enum_body = {}
            # Include required fields
            for field in required:
                if field in properties:
                    enum_body[field] = generate_example_value(properties[field], field, "default")
            # Set the enum field to this specific value
            enum_body[field_name] = enum_val

            examples.append({
                "name": f"{field_name}={enum_val}",
                "description": f"Using {field_name} option: {enum_val}",
                "request": enum_body,
                "curl": make_curl(enum_body)
            })

    # ================================================================
    # Example: Alternative values
    # ================================================================
    if len(properties) > 1:
        alt_body = {}
        for field, prop in properties.items():
            alt_body[field] = generate_example_value(prop, field, "alt")

        examples.append({
            "name": "Alternative values",
            "description": "Request with alternative/varied parameter values",
            "request": alt_body,
            "curl": make_curl(alt_body)
        })

    # ================================================================
    # Example: Array fields with multiple items
    # ================================================================
    array_fields = [f for f, p in properties.items() if p.get("type") == "array"]
    if array_fields:
        array_body = {}
        for field in required:
            if field in properties:
                array_body[field] = generate_example_value(properties[field], field, "default")

        # Show arrays with multiple items
        for field in array_fields:
            array_body[field] = generate_example_value(properties[field], field, "multiple")

        examples.append({
            "name": "With array items",
            "description": f"Request showing array fields with multiple items: {', '.join(array_fields)}",
            "request": array_body,
            "curl": make_curl(array_body)
        })

    # ================================================================
    # Example: Boundary values (min/max)
    # ================================================================
    numeric_fields = [f for f, p in properties.items()
                      if p.get("type") in ["number", "integer"]
                      and (p.get("minimum") is not None or p.get("maximum") is not None)]
    if numeric_fields:
        # Minimum values example
        min_body = {}
        for field in required:
            if field in properties:
                if field in numeric_fields:
                    min_body[field] = generate_example_value(properties[field], field, "min")
                else:
                    min_body[field] = generate_example_value(properties[field], field, "default")
        for field in numeric_fields:
            min_body[field] = generate_example_value(properties[field], field, "min")

        examples.append({
            "name": "Minimum boundary values",
            "description": f"Request with minimum values for: {', '.join(numeric_fields)}",
            "request": min_body,
            "curl": make_curl(min_body)
        })

        # Maximum values example
        max_body = {}
        for field in required:
            if field in properties:
                if field in numeric_fields:
                    max_body[field] = generate_example_value(properties[field], field, "max")
                else:
                    max_body[field] = generate_example_value(properties[field], field, "default")
        for field in numeric_fields:
            max_body[field] = generate_example_value(properties[field], field, "max")

        examples.append({
            "name": "Maximum boundary values",
            "description": f"Request with maximum values for: {', '.join(numeric_fields)}",
            "request": max_body,
            "curl": make_curl(max_body)
        })

    # ================================================================
    # Example: Optional fields only (no required - for APIs with all optional)
    # ================================================================
    optional_fields = [f for f in properties.keys() if f not in required]
    if optional_fields and len(optional_fields) > 1:
        optional_body = {}
        for field in optional_fields[:3]:  # First 3 optional
            optional_body[field] = generate_example_value(properties[field], field, "default")

        # Must include required fields too
        for field in required:
            if field in properties:
                optional_body[field] = generate_example_value(properties[field], field, "default")

        if len(optional_body) != len(properties):  # Only if different from full
            examples.append({
                "name": "With optional parameters",
                "description": f"Request including optional fields: {', '.join(optional_fields[:3])}",
                "request": optional_body,
                "curl": make_curl(optional_body)
            })

    return examples


def generate_test_cases(schema: dict) -> list:
    """Generate comprehensive test case definitions covering all parameter scenarios."""
    test_cases = []
    properties = schema.get("properties", {})
    required = schema.get("required", [])

    # Helper to create valid base body
    def make_valid_body():
        body = {}
        for field in required:
            if field in properties:
                body[field] = generate_example_value(properties[field], field, "default")
        return body

    # ================================================================
    # SUCCESS CASES
    # ================================================================

    # Test: Valid request with required fields only
    valid_body = make_valid_body()
    if valid_body:
        test_cases.append({
            "name": "Valid request (required only)",
            "description": "Should succeed with valid required parameters",
            "input": valid_body,
            "expectedStatus": 200
        })

    # Test: Valid request with all fields
    if properties:
        full_body = {}
        for field, prop in properties.items():
            full_body[field] = generate_example_value(prop, field, "default")
        test_cases.append({
            "name": "Valid request (all fields)",
            "description": f"Should succeed with all {len(properties)} parameters",
            "input": full_body,
            "expectedStatus": 200
        })

    # Test: Valid request with alternative values
    if len(properties) > 1:
        alt_body = {}
        for field, prop in properties.items():
            alt_body[field] = generate_example_value(prop, field, "alt")
        test_cases.append({
            "name": "Valid request (alternative values)",
            "description": "Should succeed with different valid values",
            "input": alt_body,
            "expectedStatus": 200
        })

    # ================================================================
    # ENUM VALIDATION TESTS
    # ================================================================
    enum_fields = get_all_enum_fields(properties)
    for enum_field in enum_fields:
        field_name = enum_field["name"]
        enum_values = enum_field["values"]

        # Test: Each valid enum value
        for enum_val in enum_values[:3]:  # First 3 values
            enum_body = make_valid_body()
            enum_body[field_name] = enum_val
            test_cases.append({
                "name": f"Valid enum: {field_name}={enum_val}",
                "description": f"Should succeed with {field_name}='{enum_val}'",
                "input": enum_body,
                "expectedStatus": 200
            })

        # Test: Invalid enum value
        invalid_enum_body = make_valid_body()
        invalid_enum_body[field_name] = "INVALID_ENUM_VALUE_XYZ"
        test_cases.append({
            "name": f"Invalid enum: {field_name}",
            "description": f"Should fail with invalid {field_name} value",
            "input": invalid_enum_body,
            "expectedStatus": 400,
            "expectedError": f"Invalid {field_name}"
        })

    # ================================================================
    # REQUIRED FIELD TESTS
    # ================================================================
    for req_field in required:
        missing_body = make_valid_body()
        if req_field in missing_body:
            del missing_body[req_field]
            test_cases.append({
                "name": f"Missing required: {req_field}",
                "description": f"Should fail when {req_field} is missing",
                "input": missing_body,
                "expectedStatus": 400,
                "expectedError": f"Required"
            })

    # ================================================================
    # TYPE VALIDATION TESTS
    # ================================================================
    for field_name, prop in properties.items():
        field_type = prop.get("type", "string")
        invalid_body = make_valid_body()

        # Generate wrong type based on field type
        if field_type == "string":
            invalid_body[field_name] = 12345  # Number instead of string
            type_desc = "number instead of string"
        elif field_type in ["number", "integer"]:
            invalid_body[field_name] = "not-a-number"
            type_desc = "string instead of number"
        elif field_type == "boolean":
            invalid_body[field_name] = "not-a-boolean"
            type_desc = "string instead of boolean"
        elif field_type == "array":
            invalid_body[field_name] = "not-an-array"
            type_desc = "string instead of array"
        elif field_type == "object":
            invalid_body[field_name] = "not-an-object"
            type_desc = "string instead of object"
        else:
            continue

        test_cases.append({
            "name": f"Invalid type: {field_name}",
            "description": f"Should fail with {type_desc} for {field_name}",
            "input": invalid_body,
            "expectedStatus": 400
        })

    # ================================================================
    # BOUNDARY VALUE TESTS
    # ================================================================
    for field_name, prop in properties.items():
        field_type = prop.get("type", "string")

        # Number/Integer min/max tests
        if field_type in ["number", "integer"]:
            minimum = prop.get("minimum")
            maximum = prop.get("maximum")

            if minimum is not None:
                # Test at minimum (should pass)
                min_body = make_valid_body()
                min_body[field_name] = minimum
                test_cases.append({
                    "name": f"Boundary: {field_name} at minimum ({minimum})",
                    "description": f"Should succeed at minimum value",
                    "input": min_body,
                    "expectedStatus": 200
                })

                # Test below minimum (should fail)
                below_min_body = make_valid_body()
                below_min_body[field_name] = minimum - 1
                test_cases.append({
                    "name": f"Boundary: {field_name} below minimum",
                    "description": f"Should fail below minimum ({minimum - 1} < {minimum})",
                    "input": below_min_body,
                    "expectedStatus": 400
                })

            if maximum is not None:
                # Test at maximum (should pass)
                max_body = make_valid_body()
                max_body[field_name] = maximum
                test_cases.append({
                    "name": f"Boundary: {field_name} at maximum ({maximum})",
                    "description": f"Should succeed at maximum value",
                    "input": max_body,
                    "expectedStatus": 200
                })

                # Test above maximum (should fail)
                above_max_body = make_valid_body()
                above_max_body[field_name] = maximum + 1
                test_cases.append({
                    "name": f"Boundary: {field_name} above maximum",
                    "description": f"Should fail above maximum ({maximum + 1} > {maximum})",
                    "input": above_max_body,
                    "expectedStatus": 400
                })

        # String length tests
        if field_type == "string":
            min_length = prop.get("minLength")
            max_length = prop.get("maxLength")

            if min_length is not None and min_length > 0:
                # Test below minLength
                short_body = make_valid_body()
                short_body[field_name] = "x" * (min_length - 1) if min_length > 1 else ""
                test_cases.append({
                    "name": f"Boundary: {field_name} too short",
                    "description": f"Should fail when {field_name} < {min_length} chars",
                    "input": short_body,
                    "expectedStatus": 400
                })

            if max_length is not None:
                # Test above maxLength
                long_body = make_valid_body()
                long_body[field_name] = "x" * (max_length + 1)
                test_cases.append({
                    "name": f"Boundary: {field_name} too long",
                    "description": f"Should fail when {field_name} > {max_length} chars",
                    "input": long_body,
                    "expectedStatus": 400
                })

    # ================================================================
    # ARRAY TESTS
    # ================================================================
    array_fields = [(f, p) for f, p in properties.items() if p.get("type") == "array"]
    for field_name, prop in array_fields:
        # Empty array (if allowed)
        empty_array_body = make_valid_body()
        empty_array_body[field_name] = []
        test_cases.append({
            "name": f"Array: {field_name} empty",
            "description": f"Test with empty {field_name} array",
            "input": empty_array_body,
            "expectedStatus": 200  # Usually allowed unless minItems
        })

        # Array with multiple items
        multi_array_body = make_valid_body()
        multi_array_body[field_name] = generate_example_value(prop, field_name, "multiple")
        test_cases.append({
            "name": f"Array: {field_name} multiple items",
            "description": f"Test with multiple items in {field_name}",
            "input": multi_array_body,
            "expectedStatus": 200
        })

    # ================================================================
    # EDGE CASES
    # ================================================================

    # Empty body
    test_cases.append({
        "name": "Empty body",
        "description": "Should fail with empty request body",
        "input": {},
        "expectedStatus": 400
    })

    # Null values for required fields
    for req_field in required[:2]:  # First 2 required
        null_body = make_valid_body()
        null_body[req_field] = None
        test_cases.append({
            "name": f"Null value: {req_field}",
            "description": f"Should fail when {req_field} is null",
            "input": null_body,
            "expectedStatus": 400
        })

    # Extra unknown field (should be ignored or error depending on strictness)
    extra_field_body = make_valid_body()
    extra_field_body["unknownExtraField123"] = "should-be-ignored"
    test_cases.append({
        "name": "Extra unknown field",
        "description": "Test behavior with unexpected field",
        "input": extra_field_body,
        "expectedStatus": 200,  # Most APIs ignore extra fields
        "note": "Depends on schema strictness"
    })

    return test_cases


def generate_orchestration_examples(endpoint: str, combine_config: dict, method: str) -> list:
    """Generate orchestration examples for combined API endpoints.

    Shows how multiple APIs are called in sequence/parallel and how data flows.
    """
    examples = []
    source_elements = combine_config.get("source_elements", [])
    flow_type = combine_config.get("flow_type", "sequential")
    error_strategy = combine_config.get("error_strategy", "fail-fast")

    if len(source_elements) < 2:
        return examples

    base_url = f"http://localhost:3001/api/v2/{endpoint}"

    # Get source API names
    source_names = []
    for elem in source_elements:
        if isinstance(elem, dict):
            source_names.append(elem.get("name", "unknown"))
        else:
            source_names.append(str(elem))

    # ================================================================
    # Example 1: Sequential flow
    # ================================================================
    if flow_type == "sequential":
        seq_body = {
            "steps": [
                {"api": source_names[0], "params": {"input": "example"}},
                {"api": source_names[1], "params": {"useResultFrom": source_names[0]}}
            ]
        }
        curl = f'curl -X {method} {base_url} \\\n'
        curl += '  -H "Content-Type: application/json" \\\n'
        curl += f"  -d '{json.dumps(seq_body, indent=2)}'"

        examples.append({
            "name": "Sequential orchestration",
            "description": f"Calls {source_names[0]} first, then {source_names[1]} with results",
            "request": seq_body,
            "curl": curl,
            "flow": f"{source_names[0]} → {source_names[1]}"
        })

    # ================================================================
    # Example 2: Parallel flow
    # ================================================================
    elif flow_type == "parallel":
        par_body = {
            "parallel": True,
            "apis": [
                {"name": source_names[0], "params": {"query": "example1"}},
                {"name": source_names[1], "params": {"query": "example2"}}
            ],
            "merge_strategy": "combine"
        }
        curl = f'curl -X {method} {base_url} \\\n'
        curl += '  -H "Content-Type: application/json" \\\n'
        curl += f"  -d '{json.dumps(par_body, indent=2)}'"

        examples.append({
            "name": "Parallel orchestration",
            "description": f"Calls {source_names[0]} and {source_names[1]} simultaneously",
            "request": par_body,
            "curl": curl,
            "flow": f"[{source_names[0]} || {source_names[1]}] → merge"
        })

    # ================================================================
    # Example 3: Conditional flow
    # ================================================================
    elif flow_type == "conditional":
        cond_body = {
            "condition": {
                "check": source_names[0],
                "if_success": source_names[1],
                "if_failure": "fallback"
            },
            "params": {"input": "example"}
        }
        curl = f'curl -X {method} {base_url} \\\n'
        curl += '  -H "Content-Type: application/json" \\\n'
        curl += f"  -d '{json.dumps(cond_body, indent=2)}'"

        examples.append({
            "name": "Conditional orchestration",
            "description": f"Calls {source_names[1]} only if {source_names[0]} succeeds",
            "request": cond_body,
            "curl": curl,
            "flow": f"{source_names[0]} ? {source_names[1]} : fallback"
        })

    # ================================================================
    # Example 4: With error handling
    # ================================================================
    error_body = {
        "steps": [
            {"api": source_names[0], "params": {"input": "data"}},
            {"api": source_names[1], "params": {"input": "data"}}
        ],
        "error_strategy": error_strategy,
        "retry": {"attempts": 3, "delay_ms": 1000}
    }
    curl = f'curl -X {method} {base_url} \\\n'
    curl += '  -H "Content-Type: application/json" \\\n'
    curl += f"  -d '{json.dumps(error_body, indent=2)}'"

    examples.append({
        "name": f"With {error_strategy} error handling",
        "description": f"Orchestration with {error_strategy} strategy and retry logic",
        "request": error_body,
        "curl": curl
    })

    # ================================================================
    # Example 5: Full data flow
    # ================================================================
    full_body = {
        "input": {
            "source": "user-provided",
            "data": {"query": "example query", "options": {"format": "json"}}
        },
        "flow": [
            {
                "step": 1,
                "api": source_names[0],
                "transform": "extract.content"
            },
            {
                "step": 2,
                "api": source_names[1],
                "input_mapping": {"content": "$.step1.result"},
                "transform": "format.output"
            }
        ],
        "output": {"include": ["final_result", "metadata"]}
    }
    curl = f'curl -X {method} {base_url} \\\n'
    curl += '  -H "Content-Type: application/json" \\\n'
    curl += f"  -d '{json.dumps(full_body, indent=2)}'"

    examples.append({
        "name": "Complete orchestration with transforms",
        "description": "Full data flow with input mapping and output transformation",
        "request": full_body,
        "curl": curl,
        "flow_diagram": f"""
Input → [{source_names[0]}] → transform → [{source_names[1]}] → Output
           ↑                                    ↑
      extract.content                    format.output
"""
    })

    return examples


def generate_manifest_entry(endpoint: str, endpoint_data: dict, state: dict) -> dict:
    """Generate a complete manifest entry for the endpoint."""
    # Check if this is a combined workflow
    combine_config = state.get("combine_config", {})
    is_combined = bool(combine_config.get("source_elements"))

    # Find schema file
    schema_file = endpoint_data.get("phases", {}).get("schema_creation", {}).get("schema_file")
    if not schema_file:
        # Try to find it
        schema_file = f"src/lib/schemas/{endpoint}.ts"

    schema_path = STATE_FILE.parent.parent / schema_file
    schema_content = ""
    if schema_path.exists():
        schema_content = schema_path.read_text()

    # Find route file
    route_content = ""
    files_created = endpoint_data.get("files_created", []) or state.get("files_created", [])
    for f in files_created:
        if "route.ts" in f:
            route_path = STATE_FILE.parent.parent / f
            if route_path.exists():
                route_content = route_path.read_text()
            break

    # Parse schema
    request_schema = parse_zod_schema(schema_content) if schema_content else {"type": "object", "properties": {}}

    # Detect method
    method = detect_http_method(route_content)

    # Generate examples
    examples = generate_curl_examples(endpoint, method, request_schema)

    # Add orchestration examples for combined endpoints
    if is_combined:
        orchestration_examples = generate_orchestration_examples(endpoint, combine_config, method)
        examples.extend(orchestration_examples)

    # Generate test cases
    test_cases = generate_test_cases(request_schema)

    # Get interview decisions for description
    interview = endpoint_data.get("phases", {}).get("interview", {})
    decisions = interview.get("decisions", {})
    questions = interview.get("questions", [])

    # Build description from interview
    description = f"API endpoint for {endpoint}"
    if decisions:
        decision_summary = ", ".join(f"{k}: {v}" for k, v in list(decisions.items())[:3])
        description = f"{endpoint} endpoint. Configured for: {decision_summary}"

    # Build the manifest entry
    entry = {
        "id": f"{endpoint}-{method.lower()}",
        "method": method,
        "path": f"/api/v2/{endpoint}",
        "summary": f"{method} {endpoint}",
        "description": description,
        "requestSchema": request_schema,
        "responseSchema": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "data": {"type": "object"},
                "error": {"type": "string"}
            }
        },
        "examples": examples,
        "testCases": test_cases,
        "metadata": {
            "generatedAt": datetime.now().isoformat(),
            "generatedBy": "api-dev-tools v3.10.0",
            "schemaFile": schema_file,
            "researchFresh": True
        }
    }

    # Add combined workflow metadata
    if is_combined:
        source_names = []
        for elem in combine_config.get("source_elements", []):
            if isinstance(elem, dict):
                source_names.append(elem.get("name", "unknown"))
            else:
                source_names.append(str(elem))

        entry["metadata"]["isCombined"] = True
        entry["metadata"]["sourceApis"] = source_names
        entry["metadata"]["flowType"] = combine_config.get("flow_type", "sequential")
        entry["metadata"]["errorStrategy"] = combine_config.get("error_strategy", "fail-fast")

    return entry


def update_manifest(entry: dict, manifest_path: Path = None):
    """Add or update entry in api-tests-manifest.json."""
    if manifest_path is None:
        manifest_path = DEFAULT_MANIFEST

    if not manifest_path.exists():
        # Create minimal manifest structure
        manifest = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "version": "2.0.0",
            "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
            "baseUrl": "http://localhost:3001",
            "sections": []
        }
    else:
        manifest = json.loads(manifest_path.read_text())

    # Find or create "Generated APIs" section
    generated_section = None
    for section in manifest.get("sections", []):
        if section.get("id") == "generated-apis":
            generated_section = section
            break

    if not generated_section:
        generated_section = {
            "id": "generated-apis",
            "name": "Generated APIs",
            "description": "APIs created with /api-create workflow",
            "endpoints": []
        }
        manifest.setdefault("sections", []).append(generated_section)

    # Remove existing entry with same ID
    generated_section["endpoints"] = [
        e for e in generated_section.get("endpoints", [])
        if e.get("id") != entry["id"]
    ]

    # Add new entry
    generated_section["endpoints"].append(entry)

    # Update timestamp
    manifest["lastUpdated"] = datetime.now().strftime("%Y-%m-%d")

    # Write back
    manifest_path.write_text(json.dumps(manifest, indent=2))
    return True


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        input_data = {}

    # Load state
    if not STATE_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    endpoint, endpoint_data = get_active_endpoint(state)
    if not endpoint or not endpoint_data:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if documentation phase is complete or completing
    doc_phase = endpoint_data.get("phases", {}).get("documentation", {})
    if doc_phase.get("status") not in ["in_progress", "complete"]:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if manifest already updated
    if doc_phase.get("manifest_updated"):
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Generate manifest entry
    try:
        entry = generate_manifest_entry(endpoint, endpoint_data, state)

        # Update manifest file
        manifest_path = STATE_FILE.parent.parent / "src" / "app" / "api-test" / "api-tests-manifest.json"
        if manifest_path.exists():
            update_manifest(entry, manifest_path)

            # Update state to mark manifest as updated
            doc_phase["manifest_updated"] = True
            doc_phase["manifest_entry_id"] = entry["id"]
            STATE_FILE.write_text(json.dumps(state, indent=2))

            print(json.dumps({
                "continue": True,
                "message": f"Generated manifest entry: {entry['id']} with {len(entry['examples'])} examples and {len(entry['testCases'])} test cases"
            }))
        else:
            print(json.dumps({
                "continue": True,
                "message": f"Manifest file not found at {manifest_path}"
            }))
    except Exception as e:
        print(json.dumps({
            "continue": True,
            "message": f"Error generating manifest: {str(e)}"
        }))

    sys.exit(0)


if __name__ == "__main__":
    main()
