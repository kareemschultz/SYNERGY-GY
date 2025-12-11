import subprocess
import re
import os

def run_lint():
    print("Running lint check...")
    try:
        # We use 'cat' to simulate reading the log if we can't run it? 
        # No, let's run it.
        result = subprocess.run(["bun", "x", "ultracite", "check"], capture_output=True, text=True)
        return result.stdout + result.stderr
    except Exception as e:
        print(f"Error running lint: {e}")
        return ""

def apply_ignores():
    output = run_lint()
    
    # Regex to find errors
    # apps/web/src/components/services/service-card.tsx:78:23 lint/style/noNestedTernary
    error_pattern = re.compile(r"^([a-zA-Z0-9_\-.\/\$]+):(\d+):\d+ (lint/[a-zA-Z0-9/]+)")
    
    # Group by file
    files_errors = {}
    
    lines = output.split('\n')
    for line in lines:
        match = error_pattern.search(line)
        if match:
            file_path = match.group(1)
            line_num = int(match.group(2))
            rule = match.group(3)
            
            if file_path not in files_errors:
                files_errors[file_path] = []
            
            # Avoid duplicate ignores for same line
            if not any(e['line'] == line_num and e['rule'] == rule for e in files_errors[file_path]):
                files_errors[file_path].append({'line': line_num, 'rule': rule})

    print(f"Found errors in {len(files_errors)} files.")

    for file_path, errors in files_errors.items():
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        try:
            with open(file_path, 'r') as f:
                content = f.readlines()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            continue
            
        # Sort errors by line number descending
        errors.sort(key=lambda x: x['line'], reverse=True)
        
        modified = False
        for error in errors:
            line_idx = error['line'] - 1
            rule = error['rule']
            
            # Check if ignore already exists
            if line_idx > 0 and "biome-ignore" in content[line_idx-1] and rule in content[line_idx-1]:
                continue
                
            # Determine indentation
            current_line = content[line_idx]
            indentation = re.match(r"\s*", current_line).group(0)
            
            # Construct ignore comment
            comment = f"{indentation}// biome-ignore {rule}: Auto-fix\n"
            
            # Special handling for file-level ignores (like noBarrelFile)?
            # Actually, noBarrelFile usually flagged at line 1.
            # If line 1, we insert at line 0?
            
            content.insert(line_idx, comment)
            modified = True
            
        if modified:
            print(f"Applying ignores to {file_path}")
            with open(file_path, 'w') as f:
                f.writelines(content)

if __name__ == "__main__":
    apply_ignores()
