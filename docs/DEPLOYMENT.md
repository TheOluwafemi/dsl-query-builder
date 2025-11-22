# 🚀 Deployment Guide

This guide explains how to deploy the Search Query Builder package to NPM using GitHub Actions.

## 📋 Prerequisites

### 1. NPM Account & Token

1. Create an account at [npmjs.com](https://npmjs.com)
2. Generate an automation token:
   - Go to [NPM Access Tokens](https://www.npmjs.com/settings/tokens)
   - Click "Generate New Token"
   - Select "Automation" type
   - Copy the token (starts with `npm_`)

### 2. GitHub Repository Setup

1. Push your code to GitHub repository
2. Go to repository Settings → Secrets and variables → Actions
3. Add the following secrets:
   - `NPM_TOKEN`: Your NPM automation token
   - `CODECOV_TOKEN`: (Optional) For code coverage reporting

## 🔄 Deployment Workflows

### Automatic Deployment (Recommended)

The easiest way to deploy is using the provided release script:

```bash
# For patch release (1.0.0 → 1.0.1)
./scripts/release.sh patch

# For minor release (1.0.0 → 1.1.0)
./scripts/release.sh minor

# For major release (1.0.0 → 2.0.0)
./scripts/release.sh major
```

This script will:

1. ✅ Run all tests and quality checks
2. ✅ Bump version in package.json
3. ✅ Update CHANGELOG.md
4. ✅ Create git commit and tag
5. ✅ Push to GitHub (triggers automatic NPM publish)

### Manual Deployment

If you prefer manual control:

```bash
# 1. Ensure everything is ready
npm run test:ci
npm run lint
npm run build

# 2. Bump version manually
npm version patch  # or minor/major

# 3. Push with tags
git push origin main --tags

# GitHub Actions will automatically publish to NPM
```

### Preview Releases

For beta/development releases:

```bash
# Push to develop or beta branch
git checkout develop
git push origin develop

# This publishes as: query-composer@1.0.0-develop.20250126120000
# Install with: npm install query-composer@develop
```

## 📦 What Gets Published

The NPM package includes:

- `dist/` - Compiled JavaScript and TypeScript definitions
- `README.md` - Package documentation
- `LICENSE` - MIT license
- `package.json` - Package metadata

Excluded files (via `.npmignore`):

- Source code (`src/`)
- Tests (`tests/`)
- Development configs
- `.env` files

## 🔍 Verification

After publishing, verify your package:

```bash
# Check package info
npm info query-composer

# Install and test
npm install query-composer@latest
node -e "console.log(require('query-composer'))"
```

## 🛠️ Troubleshooting

### Common Issues

**1. NPM_TOKEN Invalid**

```
Error: npm ERR! code E401
```

- Solution: Regenerate NPM token and update GitHub secret

**2. Package Name Taken**

```
Error: npm ERR! code E403
```

- Solution: Change package name in `package.json`

**3. Version Already Published**

```
Error: npm ERR! code E403
```

- Solution: Bump version and try again

**4. Build Failures**

```
Error: Tests failed
```

- Solution: Fix failing tests before releasing

### Debugging Steps

1. **Check GitHub Actions logs**:

   - Go to repository → Actions tab
   - Click on failed workflow
   - Review error messages

2. **Test locally**:

   ```bash
   npm run test:ci
   npm run build
   ./scripts/verify-package.sh
   ```

3. **Validate package contents**:
   ```bash
   npm pack --dry-run
   ```

## 🏷️ Version Strategy

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.1): Bug fixes, no API changes
- **Minor** (1.1.0): New features, backwards compatible
- **Major** (2.0.0): Breaking changes

### Release Branches

- `main/master`: Stable releases (1.0.0, 1.1.0, etc.)
- `develop`: Preview releases (1.0.0-develop.timestamp)
- `beta`: Beta releases (1.0.0-beta.timestamp)

## 📈 Monitoring

After deployment:

1. **NPM Package**: https://www.npmjs.com/package/query-composer
2. **GitHub Releases**: https://github.com/TheOluwafemi/query-composer/releases
3. **Download Stats**: https://npm-stat.com/charts.html?package=query-composer

## 🆘 Support

If you encounter issues:

1. Check [GitHub Issues](https://github.com/TheOluwafemi/query-composer/issues)
2. Review [GitHub Actions logs](https://github.com/TheOluwafemi/query-composer/actions)
3. Contact the maintainers
