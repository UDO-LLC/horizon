#!/usr/bin/env bash
set -e
show_help() {
cat <<EOF
Usage: $0 [extra shopify CLI args]

This script pulls the current branch's theme from the mapped Shopify store.

Rules:
  - It detects the current Git branch.
  - If the branch is 'main', it does nothing and exits.
  - It reads the store domain from .env:
      UDO_SHOPIFY_STORE_<BRANCHNAME> (uppercase)

Examples:
  $0                      # Pulls current branch's store theme
  $0 "--theme=123456789"  # Passes extra args to shopify CLI
EOF
}
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  show_help
  exit 0
fi
if [ -f ".env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️  No .env file found. Make sure to create one with your store names."
  exit 1
fi
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌  Current branch is 'main'. Nothing to pull. Exiting."
  exit 1
fi
ENV_VAR_NAME="UDO_SHOPIFY_STORE_${CURRENT_BRANCH^^}"
STORE_URL="${!ENV_VAR_NAME}"
if [ -z "$STORE_URL" ]; then
  echo "❌ Store URL not set for branch '$CURRENT_BRANCH'."
  echo "   Add $ENV_VAR_NAME to your .env file."
  exit 1
fi
EXTRA_ARGS="$1"
echo "📥 Pulling theme for branch '$CURRENT_BRANCH' from store '$STORE_URL' ..."
#shellcheck disable=SC2086
shopify theme pull --store="$STORE_URL" $EXTRA_ARGS
