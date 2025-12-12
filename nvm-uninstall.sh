#!/usr/bin/env bash

# Exit if nvm is not loaded
if ! command -v nvm >/dev/null 2>&1; then
    echo "nvm is not loaded. Trying to source it..."
    # Adjust this path if your nvm is installed elsewhere
    export NVM_DIR="$HOME/.nvm"
    # Load nvm
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

if ! command -v nvm >/dev/null 2>&1; then
    echo "Error: nvm could not be loaded. Exiting."
    exit 1
fi

echo "Fetching installed Node versions..."
INSTALLED_VERSIONS=$(nvm ls --no-colors | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sort -V)

echo "Installed versions:"
echo "$INSTALLED_VERSIONS"
echo

for VERSION in $INSTALLED_VERSIONS; do
    # Remove the leading 'v'
    NUM_VERSION=${VERSION#v}

    # Compare major version number
    MAJOR=$(echo "$NUM_VERSION" | cut -d. -f1)

    if [ "$MAJOR" -lt 20 ]; then
        echo "Uninstalling Node $VERSION ..."
        nvm uninstall "$VERSION"
    else
        echo "Keeping Node $VERSION (>= 20)"
    fi
done

echo
echo "Cleanup complete."
