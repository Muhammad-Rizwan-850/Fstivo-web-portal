#!/bin/bash

echo "Removing debug console statements..."

# Remove console.log but keep console.error and console.warn in try-catch blocks
find /home/rizwan/attempt_02/src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -exec sed -i '/console\.log/d' {} \;

echo "Kept console.error and console.warn for error handling"
echo "Removed all console.log statements"
