#!/bin/bash
# Script to combine all markdown files in the paper folder into a single document
# Usage: ./combine-docs.sh [output-file]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAPER_DIR="$SCRIPT_DIR"
OUTPUT_FILE="$PAPER_DIR/${1:-combined-documentation.md}"

echo "Combining documentation files..."
echo "Output: $OUTPUT_FILE"
echo ""

# Create or clear the output file
> "$OUTPUT_FILE"

# Add header
cat << 'EOF' >> "$OUTPUT_FILE"
# Web Loom - Complete Documentation
# Framework-Agnostic UI Architecture Toolkit

**Generated:** $(date)
**Purpose:** Consolidated documentation for LLM consumption

---

EOF

# Define file order (logical reading order)
FILES=(
    "executive-summary.md"
    "architecture-overview.md"
    "mvvm-pattern.md"
    "framework-adapters.md"
    "plugin-system.md"
    "state-management.md"
    "prompt.md"
    # read me from the parent directory will be added later if requested
    "../README.md"
)

# Add each file with a separator
for file in "${FILES[@]}"; do
    if [ -f "$PAPER_DIR/$file" ]; then
        echo "Adding: $file"
        echo "" >> "$OUTPUT_FILE"
        echo "<!-- ============================================ -->" >> "$OUTPUT_FILE"
        echo "<!-- SOURCE FILE: $file -->" >> "$OUTPUT_FILE"
        echo "<!-- ============================================ -->" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        cat "$PAPER_DIR/$file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    else
        echo "Warning: $file not found, skipping..."
    fi
done

# Add main README if requested
if [ "$2" == "--include-readme" ]; then
    README_PATH="$SCRIPT_DIR/../README.md"
    if [ -f "$README_PATH" ]; then
        echo "Adding: ../README.md"
        echo "" >> "$OUTPUT_FILE"
        echo "<!-- ============================================ -->" >> "$OUTPUT_FILE"
        echo "<!-- SOURCE FILE: ../README.md -->" >> "$OUTPUT_FILE"
        echo "<!-- ============================================ -->" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        cat "$README_PATH" >> "$OUTPUT_FILE"
    fi
fi

# Add footer
cat << 'EOF' >> "$OUTPUT_FILE"

---

# End of Combined Documentation

This document combines all Web Loom architectural documentation for comprehensive understanding.
For the latest version, see: https://github.com/yourusername/web-loom

EOF

echo ""
echo "✓ Documentation combined successfully!"
echo "✓ Output written to: $OUTPUT_FILE"
echo "✓ Total size: $(wc -l < "$OUTPUT_FILE") lines"
