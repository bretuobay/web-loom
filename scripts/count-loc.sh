#!/bin/bash
# Lines of Code Counter for Web Loom Monorepo
# Alternative bash implementation using cloc or tokei

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if cloc is installed
if command -v cloc &> /dev/null; then
    echo "Using cloc for analysis..."

    cd "$ROOT_DIR"

    echo ""
    echo "========================================================"
    echo "WEB LOOM - LINES OF CODE REPORT (via cloc)"
    echo "Generated: $(date)"
    echo "========================================================"

    echo -e "\n📊 OVERALL SUMMARY\n"
    cloc packages apps \
        --exclude-dir=node_modules,dist,build,.next,coverage,.turbo,.git,.angular,public,assets \
        --exclude-ext=json,md,lock,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot \
        --by-file-by-lang \
        --quiet

    echo -e "\n\n📦 PACKAGES\n"
    cloc packages \
        --exclude-dir=node_modules,dist,build,.next,coverage,.turbo,.git,.angular,public,assets \
        --exclude-ext=json,md,lock,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot \
        --quiet

    echo -e "\n\n🚀 APPS\n"
    cloc apps \
        --exclude-dir=node_modules,dist,build,.next,coverage,.turbo,.git,.angular,public,assets \
        --exclude-ext=json,md,lock,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot \
        --quiet

    echo -e "\n========================================================"

elif command -v tokei &> /dev/null; then
    echo "Using tokei for analysis..."

    cd "$ROOT_DIR"

    echo ""
    echo "========================================================"
    echo "WEB LOOM - LINES OF CODE REPORT (via tokei)"
    echo "Generated: $(date)"
    echo "========================================================"

    echo -e "\n📊 OVERALL SUMMARY\n"
    tokei packages apps \
        --exclude node_modules dist build .next coverage .turbo .git .angular public assets \
        --sort code

    echo -e "\n\n📦 PACKAGES\n"
    tokei packages \
        --exclude node_modules dist build .next coverage .turbo .git .angular public assets \
        --sort code

    echo -e "\n\n🚀 APPS\n"
    tokei apps \
        --exclude node_modules dist build .next coverage .turbo .git .angular public assets \
        --sort code

    echo -e "\n========================================================"

else
    echo "ERROR: Neither cloc nor tokei is installed."
    echo ""
    echo "Please install one of the following:"
    echo ""
    echo "For macOS:"
    echo "  brew install cloc        # Recommended"
    echo "  brew install tokei       # Alternative (faster)"
    echo ""
    echo "For Linux:"
    echo "  sudo apt install cloc    # Debian/Ubuntu"
    echo "  cargo install tokei      # Via Rust"
    echo ""
    echo "Or use the TypeScript version:"
    echo "  npm run count-loc"
    exit 1
fi
