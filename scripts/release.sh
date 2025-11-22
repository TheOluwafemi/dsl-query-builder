#!/bin/bash

# Release script for Search Query Builder
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default release type
RELEASE_TYPE=${1:-patch}

echo -e "${YELLOW}🚀 Starting release process...${NC}"

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}❌ Invalid release type. Use: patch, minor, or major${NC}"
    exit 1
fi

# Check if we're on main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo -e "${RED}❌ Please switch to main/master branch before releasing${NC}"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin $CURRENT_BRANCH

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm run test:ci

# Run linting
echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint

# Run type checking
echo -e "${YELLOW}🔧 Running type check...${NC}"
npm run type-check

# Build the package
echo -e "${YELLOW}🏗️  Building package...${NC}"
npm run build

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}📋 Current version: ${CURRENT_VERSION}${NC}"

# Create version bump
echo -e "${YELLOW}🆙 Bumping version (${RELEASE_TYPE})...${NC}"
NEW_VERSION=$(npm version $RELEASE_TYPE --no-git-tag-version)
echo -e "${GREEN}✅ New version: ${NEW_VERSION}${NC}"

# Update CHANGELOG.md
echo -e "${YELLOW}📝 Updating CHANGELOG.md...${NC}"
DATE=$(date +%Y-%m-%d)
sed -i.bak "s/## \[Unreleased\]/## [Unreleased]\n\n## [${NEW_VERSION#v}] - $DATE/" CHANGELOG.md
rm CHANGELOG.md.bak 2>/dev/null || true

# Commit changes
echo -e "${YELLOW}💾 Committing changes...${NC}"
git add package.json CHANGELOG.md
git commit -m "chore: release ${NEW_VERSION}"

# Create git tag
echo -e "${YELLOW}🏷️  Creating git tag...${NC}"
git tag -a "${NEW_VERSION}" -m "Release ${NEW_VERSION}"

# Push changes and tags
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git push origin $CURRENT_BRANCH
git push origin "${NEW_VERSION}"

echo -e "${GREEN}🎉 Release ${NEW_VERSION} completed successfully!${NC}"
echo -e "${GREEN}📦 The GitHub Action will automatically publish to NPM.${NC}"
echo -e "${GREEN}🔗 Check the progress at: https://github.com/TheOluwafemi/query-composer/actions${NC}"