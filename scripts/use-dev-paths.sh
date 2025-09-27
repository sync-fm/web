# Variables for find & replace strings
FIND_STRING='from "syncfm.ts"'
CURRENT_DIR=$(pwd)
LOCAL_SYNCFM_PATH=$(realpath "$CURRENT_DIR/../syncfm.ts/src")
REPLACE_STRING="from \"$LOCAL_SYNCFM_PATH\""

# Uninstall the original syncfm.ts package
bun remove syncfm.ts

# Replace paths in the src code to point to the local syncfm.ts folder
grep -rl --exclude-dir={"node_modules",".next"} --include=\*.ts --include=\*.tsx "$FIND_STRING" . | while read -r file; do
    sed -i.bak "s|$FIND_STRING|$REPLACE_STRING|g" "$file"
done

# Remove backup files created by sed
find . -name "*.bak" -type f -delete
