import { useQuery } from "@tanstack/react-query";
import { Building2, Check, Search, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

type ClientOption = {
  id: string;
  displayName: string;
  type: string;
  businesses: string[];
};

type ClientSelectorProps = {
  value: string | null;
  onChange: (clientId: string, client: ClientOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type BusinessGroup = "GCMC" | "KAJ" | "BOTH";

function getBusinessGroup(businesses: string[]): BusinessGroup {
  const hasGCMC = businesses.includes("GCMC");
  const hasKAJ = businesses.includes("KAJ");

  if (hasGCMC && hasKAJ) {
    return "BOTH";
  }
  if (hasGCMC) {
    return "GCMC";
  }
  return "KAJ";
}

function getClientTypeIcon(type: string) {
  switch (type) {
    case "INDIVIDUAL":
    case "FOREIGN_NATIONAL":
      return <User className="h-4 w-4" />;
    case "CORPORATION":
    case "SMALL_BUSINESS":
      return <Building2 className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

export function ClientSelector({
  value,
  onChange,
  placeholder = "Select a client...",
  disabled = false,
  className,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch all active clients for the dropdown
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["clients", "selector"],
    queryFn: () =>
      client.clients.list({
        limit: 100,
        status: "ACTIVE",
        sortBy: "displayName",
        sortOrder: "asc",
      }),
    staleTime: 30_000, // Cache for 30 seconds
  });

  // Group clients by business affiliation
  const groupedClients = useMemo(() => {
    if (!clientsData?.clients) {
      return { GCMC: [], KAJ: [], BOTH: [] };
    }

    const groups: Record<BusinessGroup, ClientOption[]> = {
      GCMC: [],
      KAJ: [],
      BOTH: [],
    };

    for (const c of clientsData.clients) {
      const group = getBusinessGroup(c.businesses);
      groups[group].push({
        id: c.id,
        displayName: c.displayName,
        type: c.type,
        businesses: c.businesses,
      });
    }

    return groups;
  }, [clientsData]);

  // Filter clients based on search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) {
      return groupedClients;
    }

    const searchLower = search.toLowerCase();
    const filtered: Record<BusinessGroup, ClientOption[]> = {
      GCMC: [],
      KAJ: [],
      BOTH: [],
    };

    for (const group of ["GCMC", "KAJ", "BOTH"] as BusinessGroup[]) {
      filtered[group] = groupedClients[group].filter((c) =>
        c.displayName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [groupedClients, search]);

  // Get selected client info
  const selectedClient = useMemo(() => {
    if (!(value && clientsData?.clients)) {
      return null;
    }
    return clientsData.clients.find((c) => c.id === value);
  }, [value, clientsData]);

  const totalClients =
    filteredGroups.GCMC.length +
    filteredGroups.KAJ.length +
    filteredGroups.BOTH.length;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-full justify-start", className)}
          disabled={disabled}
          role="combobox"
          variant="outline"
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {selectedClient ? (
            <span className="truncate">{selectedClient.displayName}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0 sm:w-[400px]"
      >
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder="Search clients..."
            value={search}
          />
          <CommandList>
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  Loading clients...
                </div>
              ) : null}
              {!isLoading && totalClients === 0 ? (
                <CommandEmpty>
                  {search ? "No clients found." : "No clients available."}
                </CommandEmpty>
              ) : null}
              {!isLoading && totalClients > 0 ? (
                <>
                  {/* Both Businesses Group */}
                  {filteredGroups.BOTH.length > 0 && (
                    <CommandGroup heading="Both Businesses">
                      {filteredGroups.BOTH.map((c) => (
                        <CommandItem
                          key={c.id}
                          onSelect={() => {
                            onChange(c.id, c);
                            setOpen(false);
                            setSearch("");
                          }}
                          value={c.id}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="mr-2 text-muted-foreground">
                            {getClientTypeIcon(c.type)}
                          </span>
                          <span className="truncate">{c.displayName}</span>
                          <span className="ml-auto text-muted-foreground text-xs">
                            GCMC + KAJ
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* GCMC Only Group */}
                  {filteredGroups.GCMC.length > 0 && (
                    <CommandGroup heading="GCMC Only">
                      {filteredGroups.GCMC.map((c) => (
                        <CommandItem
                          key={c.id}
                          onSelect={() => {
                            onChange(c.id, c);
                            setOpen(false);
                            setSearch("");
                          }}
                          value={c.id}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="mr-2 text-muted-foreground">
                            {getClientTypeIcon(c.type)}
                          </span>
                          <span className="truncate">{c.displayName}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* KAJ Only Group */}
                  {filteredGroups.KAJ.length > 0 && (
                    <CommandGroup heading="KAJ Only">
                      {filteredGroups.KAJ.map((c) => (
                        <CommandItem
                          key={c.id}
                          onSelect={() => {
                            onChange(c.id, c);
                            setOpen(false);
                            setSearch("");
                          }}
                          value={c.id}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="mr-2 text-muted-foreground">
                            {getClientTypeIcon(c.type)}
                          </span>
                          <span className="truncate">{c.displayName}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              ) : null}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
