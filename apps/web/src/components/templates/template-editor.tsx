import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlaceholderPicker } from "./placeholder-picker";

type TemplateEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function TemplateEditor({
  value,
  onChange,
  disabled,
}: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertPlaceholder = (placeholderKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const placeholder = `{{${placeholderKey}}}`;

    // Insert placeholder at cursor position
    const newValue =
      value.substring(0, start) + placeholder + value.substring(end);

    onChange(newValue);

    // Set focus back to textarea and position cursor after inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + placeholder.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="template-content">Template Content</Label>
        <PlaceholderPicker onSelectPlaceholder={handleInsertPlaceholder} />
      </div>
      <Textarea
        className="min-h-96 font-mono text-sm"
        disabled={disabled}
        id="template-content"
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your template content here. Use the 'Insert Placeholder' button to add dynamic fields."
        ref={textareaRef}
        value={value}
      />
      <p className="text-muted-foreground text-sm">
        Use placeholders like{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {"{{client.displayName}}"}
        </code>{" "}
        to insert dynamic data. Click &quot;Insert Placeholder&quot; to browse
        available fields.
      </p>
    </div>
  );
}
