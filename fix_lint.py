import subprocess
import re
import os

def run_lint():
    print("Running lint check...")
    try:
        result = subprocess.run(["bun", "x", "ultracite", "check"], capture_output=True, text=True)
        return result.stdout + result.stderr
    except Exception as e:
        return str(e)

def apply_fixes():
    output = run_lint()
    
    # Regex to find errors
    # apps/web/src/components/services/service-card.tsx:78:23 lint/nursery/noLeakedRender
    error_pattern = re.compile(r"^([a-zA-Z0-9_\-./]+):(\d+):\d+ lint/nursery/noLeakedRender")
    
    fixes = []
    
    lines = output.split('\n')
    for line in lines:
        match = error_pattern.search(line)
        if match:
            file_path = match.group(1)
            line_num = int(match.group(2))
            fixes.append({'file': file_path, 'line': line_num})
            
    print(f"Found {len(fixes)} noLeakedRender errors.")
    
    # Sort fixes by file and then line number (descending to not mess up offsets if we added lines, but we are replacing in place)
    # Actually, if we modify a line, it shouldn't shift others if we keep line count same.
    # But safe to process distinct files.
    
    files_to_fix = {}
    for fix in fixes:
        if fix['file'] not in files_to_fix:
            files_to_fix[fix['file']] = []
        files_to_fix[fix['file']].append(fix['line'])
        
    for file_path, line_nums in files_to_fix.items():
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        try:
            with open(file_path, 'r') as f:
                content = f.readlines()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            continue
            
        modified = False
        for line_idx in line_nums:
            idx = line_idx - 1 # 0-based
            if idx >= len(content):
                continue
                
            original_line = content[idx]
            
            # Fix 1: .length && -> .length > 0 &&
            if '.length &&' in original_line:
                new_line = original_line.replace('.length &&', '.length > 0 &&')
                if new_line != original_line:
                    content[idx] = new_line
                    modified = True
                    continue

            # Fix 2: {foo && ( -> {!!foo && (
            # Matches {variable && (
            # We want to capture the variable.
            # Simple regex for { VAR && (
            
            # Pattern: { something && 
            # We replace with { !!something &&
            
            # Be careful with things like {foo ? bar : baz && ...}
            
            # Conservative replacement:
            # Look for `{` followed by non-special chars, then `&&`
            
            # Case: {service.shortDescription && (
            # Fix: {!!service.shortDescription && (
            
            # Using simple string manipulation for common cases
            
            # Check for pattern " {VAR && " or "{VAR &&"
            # where VAR is safe chars.
            
            # We can use regex replacement on the line
            # r"{(\s*)([\w\.]+)(\s*)&&" -> r"{\1!!\2\3&&"
            
            pattern = r"\{(\s*)([a-zA-Z0-9_.]+)(\s*)&&"
            if re.search(pattern, original_line):
                 new_line = re.sub(pattern, r"{\1!!\2\3&&", original_line)
                 if new_line != original_line:
                    content[idx] = new_line
                    modified = True
                    continue
            
            # Also handle ternary cases if mentioned in error
            # But the error usually points to the specific line.
            
            # Attempt generic " && " -> " > 0 && " if it looks like a number? No.
            
            # Just applying !! to the variable before && if inside {}
            
            # What if it is `) && (` ?
            # e.g. (foo || bar) && ...
            # We can wrap the whole group in Boolean(...) or !!(...)
            
            # For now, let's stick to the high confidence fixes.
            
        if modified:
            print(f"Applying fixes to {file_path}")
            with open(file_path, 'w') as f:
                f.writelines(content)

if __name__ == "__main__":
    apply_fixes()
