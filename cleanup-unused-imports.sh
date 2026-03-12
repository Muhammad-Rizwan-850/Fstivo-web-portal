#!/bin/bash

# Automated script to remove unused imports from TypeScript files
# This will use tsc output to identify and remove unused imports

cd /home/rizwan/attempt_02/festivo-event-nexus

echo "🧹 Starting automated unused import cleanup..."
echo "================================================"

# Function to remove unused import from a file
remove_unused_import() {
    local file=$1
    local import_name=$2
    
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Check if file contains the unused import
    if ! grep -q "$import_name" "$file"; then
        return
    fi
    
    # Try to remove from lucide-react imports
    if grep -q "from 'lucide-react'" "$file"; then
        # Remove the specific icon from lucide import
        sed -i "s/, $import_name//g; s/$import_name, //g; s/\(\n[[:space:]]*\)$import_name,\?/\1/g" "$file"
        sed -i "s/{ $import_name }/{ }/g; s/{  }/{ }/g" "$file"
    fi
}

# Get all TS6133 errors and process them
echo "📊 Analyzing unused imports..."
npx -y tsc --noEmit 2>&1 | grep "error TS6133" > /tmp/unused_imports.txt

total=$(wc -l < /tmp/unused_imports.txt)
echo "Found $total unused import errors"
echo ""

# Process each error
processed=0
while IFS= read -r line; do
    # Parse: src/file.tsx(line,col): error TS6133: 'IconName' is declared but its value is never read.
    file=$(echo "$line" | cut -d'(' -f1)
    import_name=$(echo "$line" | grep -o "'[^']*' is declared" | cut -d"'" -f2)
    
    if [ -n "$file" ] && [ -n "$import_name" ]; then
        remove_unused_import "$file" "$import_name"
        ((processed++))
    fi
    
    if [ $((processed % 50)) -eq 0 ] && [ $processed -gt 0 ]; then
        echo "✓ Processed $processed imports..."
    fi
done < /tmp/unused_imports.txt

echo ""
echo "✓ Cleanup complete! Processed $processed unused imports"
echo ""
echo "🔍 Running tsc to measure improvement..."
error_count=$(npx -y tsc --noEmit 2>&1 | grep -c "error TS")
echo "Current error count: $error_count"
