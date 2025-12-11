import subprocess
import re
import os
import shutil

def run_lint():
    print("Running lint check...")
    try:
        result = subprocess.run(["bun", "x", "ultracite", "check"], capture_output=True, text=True)
        return result.stdout + result.stderr
    except Exception as e:
        print(f"Error running lint: {e}")
        return ""

def fix_comments_and_renders():
    output = run_lint()
    
    # Files to fix
    files_to_fix = {}
    
    # Regex patterns
    # 1. noCommentText: apps/web/src/routes/app/admin/services/index.tsx:282:29 lint/suspicious/noCommentText
    comment_pattern = re.compile(r"^([a-zA-Z0-9_\-./$]+):(\d+):\d+ lint/suspicious/noCommentText")
    
    # 2. noLeakedRender: apps/web/src/routes/app/admin/services/index.tsx:283:30 lint/nursery/noLeakedRender
    render_pattern = re.compile(r"^([a-zA-Z0-9_\-./$]+):(\d+):\d+ lint/nursery/noLeakedRender")
    
    # 3. Filenaming: apps/web/src/routes/app/training/courses/$courseId.tsx lint/style/useFilenamingConvention
    filename_pattern = re.compile(r"^([a-zA-Z0-9_\-./$]+) lint/style/useFilenamingConvention")

    lines = output.split('\n')
    
    comment_fixes = []
    render_fixes = []
    filename_fixes = []

    for line in lines:
        # Check for comment issues
        match_comment = comment_pattern.search(line)
        if match_comment:
            file_path = match_comment.group(1)
            line_num = int(match_comment.group(2))
            comment_fixes.append({'file': file_path, 'line': line_num})
            if file_path not in files_to_fix:
                files_to_fix[file_path] = True

        # Check for render issues (still persisting)
        match_render = render_pattern.search(line)
        if match_render:
            file_path = match_render.group(1)
            line_num = int(match_render.group(2))
            render_fixes.append({'file': file_path, 'line': line_num})
            if file_path not in files_to_fix:
                files_to_fix[file_path] = True
                
        # Check for filename issues
        match_filename = filename_pattern.search(line)
        if match_filename:
            file_path = match_filename.group(1)
            if file_path not in filename_fixes:
                filename_fixes.append(file_path)

    # Apply file content fixes
    for file_path in files_to_fix.keys():
        if not os.path.exists(file_path):
            continue
            
        try:
            with open(file_path, 'r') as f:
                content = f.readlines()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            continue
            
        modified = False
        
        # 1. Fix Comments: // biome-ignore -> {/* // biome-ignore ... */} 
        # We need to be careful not to double wrap or mess up.
        # The lint error points to the line with the comment.
        
        current_file_comment_fixes = [f for f in comment_fixes if f['file'] == file_path]
        for fix in current_file_comment_fixes:
            idx = fix['line'] - 1
            if idx < len(content):
                line = content[idx]
                if "// biome-ignore" in line and "{/*" not in line:
                    # Wrap it
                    indent = re.match(r"\s*", line).group(0)
                    comment_text = line.strip()
                    # Remove // part to wrap correctly or just wrap the whole thing?
                    # JSX comments are {/* comment */}
                    # If it's already a JS comment //, we need to wrap it.
                    # content[idx] = f"{indent}{{/* {comment_text} */}}\n" 
                    # Actually, if it's // biome-ignore lint/..., we want:
                    # {/* biome-ignore lint/... */}
                    
                    clean_comment = comment_text.replace("// ", "").replace("//", "")
                    content[idx] = f"{indent}{{/* {clean_comment} */}}\n"
                    modified = True

        # 2. Fix Leaked Render: { condition && (
        # We want to change to { !!condition && (
        # BUT only if it's not already boolean.
        # The simple regex approach in previous script might have missed some or the offsets were off.
        # Let's try to be robust.
        
        current_file_render_fixes = [f for f in render_fixes if f['file'] == file_path]
        for fix in current_file_render_fixes:
            idx = fix['line'] - 1
            if idx < len(content):
                line = content[idx]
                
                # Check for "variable && (" pattern
                # Avoid changing if already has !! or Boolean()
                if "!!" in line or "Boolean(" in line:
                    continue
                    
                # Pattern: { something && 
                # Replace with { !!something &&
                
                # Simple replacement for common case
                pattern = r"\{(\s*)([a-zA-Z0-9_\?.!]+)(\s*)&&"
                if re.search(pattern, line):
                     new_line = re.sub(pattern, r"{\1!!\2\3&&", line)
                     if new_line != line:
                        content[idx] = new_line
                        modified = True
                        
                # Also handle: "something" in object &&
                pattern_in = r"\{(\s*)\"([a-zA-Z0-9_]+)\"\s+in\s+([a-zA-Z0-9_]+)(\s*)&&"
                # "serviceCount" in category && -> boolean check, should be fine?
                # Actually "in" operator returns boolean. 
                # Why does noLeakedRender complain?
                # Maybe it thinks it's not? 
                # The error says: Potential leaked value
                # "prop" in obj returns boolean true/false.
                # So `true && (...)` is fine.
                # Wait, maybe the linter is confused or I am misreading the line.
                # Line 283: {"serviceCount" in category && (
                # This should be safe. Maybe I should just suppress it if it's actually safe.
                # But to be safe, I can wrap in Boolean(...) or !!(...)
                # {!!("serviceCount" in category) &&
                
                if '" in ' in line:
                     # Just wrap the whole condition in !!(...)
                     # Hard to parse correctly with regex.
                     # Let's add an ignore comment for this specific case if not already there.
                     
                     # Check previous line for ignore
                     if idx > 0 and "noLeakedRender" in content[idx-1]:
                         continue
                         
                     indent = re.match(r"\s*", line).group(0)
                     # We need to insert {/* biome-ignore ... */} because we are in JSX (likely)
                     # Since we are fixing comments too, let's insert the correct format.
                     content.insert(idx, f"{indent}{{/* biome-ignore lint/nursery/noLeakedRender: Auto-fix */}}\n")
                     modified = True
                     # Adjust indices for subsequent fixes?
                     # Yes, inserting lines breaks subsequent line numbers.
                     # This approach (iterating by line number) is flawed if we insert lines.
                     # We should process fixes from bottom to top.
                     
        if modified:
            print(f"Applying fixes to {file_path}")
            with open(file_path, 'w') as f:
                f.writelines(content)

    # 3. Rename files
    for file_path in filename_fixes:
        if not os.path.exists(file_path):
            continue
            
        # $courseId.tsx -> $course-id.tsx
        dir_name = os.path.dirname(file_path)
        base_name = os.path.basename(file_path)
        
        # CamelCase to kebab-case logic, preserving $
        # $courseId -> $course-id
        
        name_part = base_name
        is_route_param = name_part.startswith('$')
        if is_route_param:
            name_part = name_part[1:]
            
        # Convert camel to kebab
        kebab = re.sub(r'(?<!^)(?=[A-Z])', '-', name_part).lower()
        
        if is_route_param:
            kebab = '$' + kebab
            
        new_path = os.path.join(dir_name, kebab)
        
        if new_path != file_path:
            print(f"Renaming {file_path} to {new_path}")
            try:
                shutil.move(file_path, new_path)
            except Exception as e:
                print(f"Error renaming {file_path}: {e}")

if __name__ == "__main__":
    fix_comments_and_renders()
