#!/usr/bin/env bash
set -e
show_help() {
cat <<EOF
Usage: $0 [environment] [extra shopify CLI args]

environment:
  prod       Deploys the 'prod' branch to UDO_SHOPIFY_STORE_PROD
  dev        Deploys the 'dev' branch to UDO_SHOPIFY_STORE_DEV
  (empty)    Uses the current branch with a warning

Examples:
  $0 prod
  $0 dev "--theme=123456789"

Environment variables (.env):
  UDO_SHOPIFY_STORE_PROD   Store URL for prod branch
  UDO_SHOPIFY_STORE_DEV    Store URL for dev branch

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
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not installed. Please install Node.js first."
  exit 1
fi
NODE_MAJOR=$(node -v | sed 's/v\([0-9]\+\).*/\1/')
if [ "$NODE_MAJOR" -lt 12 ]; then
  echo "❌ Node.js version must be >=12 (detected v${NODE_MAJOR})."
  exit 1
fi
ENV_ARG="$1"
EXTRA_ARGS="$2"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -z "$ENV_ARG" ]; then
  DEPLOY_BRANCH="$CURRENT_BRANCH"
  echo "⚠️  No environment argument provided. Using current branch: $DEPLOY_BRANCH"
else
  DEPLOY_BRANCH="$ENV_ARG"
  echo "ℹ️  Deploy environment specified: $DEPLOY_BRANCH"
  git fetch origin "$DEPLOY_BRANCH"
  git checkout "$DEPLOY_BRANCH"
fi
if [ "$DEPLOY_BRANCH" = "main" ]; then
  echo "⚠️  You are on the main branch. Please checkout to 'prod' or 'dev',"
  echo "    or run: ./deploy.sh prod (or dev)"
  exit 1
fi
git fetch origin main >/dev/null 2>&1 || true
if ! git merge-base --is-ancestor "origin/main" "$DEPLOY_BRANCH"; then
  echo "⚠️  Branch '$DEPLOY_BRANCH' might be behind main. Consider merging main first."
else
  if ! git merge-base --is-ancestor "$DEPLOY_BRANCH" "origin/main"; then
    echo "⚠️  '$DEPLOY_BRANCH' is behind main. Please update it soon."
  fi
fi
ENV_VAR_NAME="UDO_SHOPIFY_STORE_${DEPLOY_BRANCH^^}"
STORE_URL="${!ENV_VAR_NAME}"
if [ -z "$STORE_URL" ]; then
  echo "❌ Store URL not set for branch '$DEPLOY_BRANCH'."
  echo "   Add $ENV_VAR_NAME to your .env file."
  exit 1
fi
echo "🚀 Pushing theme for branch '$DEPLOY_BRANCH' to store '$STORE_URL' ..."
#shellcheck disable=SC2086
shopify theme push --store="$STORE_URL" $EXTRA_ARGS
