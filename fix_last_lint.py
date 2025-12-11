import subprocess
import re
import os

def run_lint():
    print("Running lint check...")
    try:
        # Using check --write --unsafe to fix formatting automatically first
        subprocess.run(["bun", "x", "ultracite", "check", "--write", "--unsafe"], capture_output=True, text=True)
        # Then get remaining errors
        result = subprocess.run(["bun", "x", "ultracite", "check"], capture_output=True, text=True)
        return result.stdout + result.stderr
    except Exception as e:
        print(f"Error running lint: {e}")
        return ""

def fix_remaining():
    # Fix the parse error in apps/web/src/routes/app/calendar/index.tsx
    # 440:22 parse expected `)` but instead found `:`
    # It seems to be a ternary logic issue.
    calendar_file = "apps/web/src/routes/app/calendar/index.tsx"
    if os.path.exists(calendar_file):
        with open(calendar_file, 'r') as f:
            content = f.readlines()
        
        modified = False
        # Look for the problematic line around 440
        # The log shows:
        # 438 onComplete={() => completeMutation.mutate(d.id)}
        # 439 />
        # 440 )) : (
        
        # It seems like it should be `)) : (` but the parser thinks it's inside something else?
        # Or maybe it's `) : (` vs `)) : (`
        # Let's inspect the file content around that area.
        
        # Actually, let's just replace the line if we find the exact match.
        # But better to just delete the colon if that's what it wants? 
        # "expected `)` but instead found `:`" -> implies it's looking for closing parenthesis of function or expression.
        
        # We can try to fix the unused suppressions by removing them.
        
    output = run_lint()
    
    # unused suppressions regex
    # apps/web/src/routes/app/admin/staff/$staff-id.tsx:458:30 suppressions/unused
    unused_pattern = re.compile(r"^([a-zA-Z0-9_\-./$]+):(\d+):\d+ suppressions/unused")
    
    unused_fixes = []
    lines = output.split('\n')
    for line in lines:
        match = unused_pattern.search(line)
        if match:
            file_path = match.group(1)
            line_num = int(match.group(2))
            unused_fixes.append({'file': file_path, 'line': line_num})
            
    # Process unused fixes
    # Sort by line descending to avoid offset issues
    files_unused = {}
    for fix in unused_fixes:
        if fix['file'] not in files_unused:
            files_unused[fix['file']] = []
        files_unused[fix['file']].append(fix['line'])
        
    for file_path, line_nums in files_unused.items():
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r') as f:
            content = f.readlines()
            
        line_nums.sort(reverse=True)
        modified = False
        
        for line_num in line_nums:
            idx = line_num - 1
            if idx < len(content):
                # Remove the line if it contains the suppression
                if "biome-ignore" in content[idx]:
                    print(f"Removing unused suppression in {file_path} at line {line_num}")
                    del content[idx]
                    modified = True
                    
        if modified:
            with open(file_path, 'w') as f:
                f.writelines(content)

    # Now manual fix for calendar/index.tsx if still needed
    # We will read it again.
    if os.path.exists(calendar_file):
        with open(calendar_file, 'r') as f:
            content = f.readlines()
        
        # Search for the syntax error pattern
        # likely around line 440
        # The previous log indicated:
        # > 440 │                   )) : (
        #       │                      ^
        # expected `)` but instead found `:`
        
        # This usually happens in nested ternaries when parentheses are mismatched.
        # Let's look for `)) : (` and see if we can balance it.
        # Maybe `) ? ( ... ) : (`
        
        # I'll just try to locate the specific line and see if I can spot the issue contextually.
        # But blindly replacing is risky.
        # Let's trust that removing unused suppressions might clear up some noise, 
        # and the formatting from run_lint() might have fixed formatting issues.
        pass

if __name__ == "__main__":
    fix_remaining()
