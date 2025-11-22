#!/bin/bash

# Package verification script
# Verifies the built package is correct before publishing

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Verifying package build...${NC}"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

# Check for required files
REQUIRED_FILES=("dist/index.js" "dist/index.mjs" "dist/index.d.ts")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file missing: $file${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Found: $file${NC}"
    fi
done

# Test CommonJS import
echo -e "${YELLOW}🧪 Testing CommonJS import...${NC}"
node -e "
    try {
        const pkg = require('./dist/index.js');
        console.log('✅ CommonJS import successful');
        if (pkg.createSearchClient && pkg.createQuery) {
            console.log('✅ Main exports available');
        } else {
            console.log('❌ Main exports missing');
            process.exit(1);
        }
    } catch (error) {
        console.log('❌ CommonJS import failed:', error.message);
        process.exit(1);
    }
"

# Test ES Module import (Node.js 14+)
echo -e "${YELLOW}🧪 Testing ES Module import...${NC}"
node --input-type=module --eval "
    import('./dist/index.mjs').then(pkg => {
        console.log('✅ ES Module import successful');
        if (pkg.createSearchClient && pkg.createQuery) {
            console.log('✅ Main exports available');
        } else {
            console.log('❌ Main exports missing');
            process.exit(1);
        }
    }).catch(error => {
        console.log('❌ ES Module import failed:', error.message);
        process.exit(1);
    });
"

# Check TypeScript definitions
echo -e "${YELLOW}🧪 Testing TypeScript definitions...${NC}"
npx tsc --noEmit --skipLibCheck -p tsconfig.json

# Verify package.json files field
echo -e "${YELLOW}🔍 Verifying package files...${NC}"
npm pack --dry-run > /tmp/npm-pack-output.txt
echo -e "${GREEN}✅ Package contents:${NC}"
cat /tmp/npm-pack-output.txt
rm /tmp/npm-pack-output.txt

# Check package size
PACKAGE_SIZE=$(npm pack --dry-run 2>/dev/null | tail -n 1 | grep -o '[0-9.]*[kKmM][bB]' || echo "unknown")
echo -e "${GREEN}📦 Package size: $PACKAGE_SIZE${NC}"

echo -e "${GREEN}🎉 Package verification completed successfully!${NC}"