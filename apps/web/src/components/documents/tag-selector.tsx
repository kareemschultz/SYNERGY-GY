import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { client, queryClient } from "@/utils/orpc";

type TagSelectorProps = {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
};

const DEFAULT_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

export function TagSelector({
  selectedTags,
  onTagsChange,
  placeholder = "Select tags...",
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);

  // Fetch available tags
  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags", search],
    queryFn: () => client.tags.list({ search: search || undefined }),
  });

  // Create tag mutation
  const createMutation = useMutation({
    mutationFn: (input: { name: string; color: string }) =>
      client.tags.create(input),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      onTagsChange([...selectedTags, newTag.name]);
      setCreateDialogOpen(false);
      setNewTagName("");
      toast.success(`Tag "${newTag.name}" created`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create tag");
    },
  });

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const removeTag = (tagName: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagName));
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }
    createMutation.mutate({
      name: newTagName.trim(),
      color: newTagColor,
    });
  };

  const getTagColor = (tagName: string): string => {
    const tag = tags?.find((t) => t.name === tagName);
    return tag?.color || "#6B7280";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tagName) => (
            <Badge
              className="cursor-pointer gap-1 pr-1"
              key={tagName}
              style={{
                backgroundColor: `${getTagColor(tagName)}20`,
                color: getTagColor(tagName),
                borderColor: `${getTagColor(tagName)}40`,
              }}
              variant="outline"
            >
              {tagName}
              <button
                className="rounded-full p-0.5 hover:bg-black/10"
                onClick={() => removeTag(tagName)}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector popover */}
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            className="w-full justify-start text-muted-foreground"
            size="sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[300px] p-0">
          <Command>
            <CommandInput
              onValueChange={setSearch}
              placeholder="Search tags..."
              value={search}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="py-3 text-center text-sm">
                      <p className="text-muted-foreground">No tags found.</p>
                      <Button
                        className="mt-2"
                        onClick={() => {
                          setNewTagName(search);
                          setCreateDialogOpen(true);
                          setOpen(false);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Create "{search}"
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {tags?.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => toggleTag(tag.name)}
                          value={tag.name}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div
                            className="mr-2 h-3 w-3 rounded-full"
                            style={{ backgroundColor: tag.color || "#6B7280" }}
                          />
                          {tag.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setCreateDialogOpen(true);
                        setOpen(false);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create new tag
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create tag dialog */}
      <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag for organizing documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Tax Return"
                value={newTagName}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                      newTagColor === color
                        ? "border-foreground"
                        : "border-transparent"
                    )}
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div className="pt-2">
              <Label className="text-muted-foreground text-sm">Preview</Label>
              <div className="mt-1">
                <Badge
                  style={{
                    backgroundColor: `${newTagColor}20`,
                    color: newTagColor,
                    borderColor: `${newTagColor}40`,
                  }}
                  variant="outline"
                >
                  {newTagName || "Tag Preview"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setCreateDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={createMutation.isPending || !newTagName.trim()}
              onClick={handleCreateTag}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
