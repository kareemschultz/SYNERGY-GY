import { Trash2 } from "lucide-react";
import { ServicePicker } from "@/components/invoices/service-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  serviceTypeId?: string;
  sortOrder?: number;
};

type LineItemEditorProps = {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
  business?: "GCMC" | "KAJ";
};

export function LineItemEditor({
  items,
  onChange,
  disabled = false,
  business,
}: LineItemEditorProps) {
  const handleItemChange = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate amount when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = Number.parseFloat(
        field === "quantity" ? value : updated[index].quantity
      );
      const unitPrice = Number.parseFloat(
        field === "unitPrice" ? value : updated[index].unitPrice
      );

      if (!(Number.isNaN(quantity) || Number.isNaN(unitPrice))) {
        updated[index].amount = (quantity * unitPrice).toFixed(2);
      }
    }

    onChange(updated);
  };

  const handleAddItem = () => {
    onChange([
      ...items,
      {
        description: "",
        quantity: "1",
        unitPrice: "",
        amount: "0",
        sortOrder: items.length,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    // Update sort orders
    const reordered = updated.map((item, i) => ({ ...item, sortOrder: i }));
    onChange(reordered);
  };

  const handleServiceSelect = (service: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    basePrice: string;
    pricingType: string;
  }) => {
    const unitPrice = service.basePrice || "0";
    const amount = Number.parseFloat(unitPrice).toFixed(2);

    onChange([
      ...items,
      {
        description: service.description,
        quantity: "1",
        unitPrice,
        amount,
        serviceTypeId: service.id,
        sortOrder: items.length,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Line Items *</Label>
        <div className="flex gap-2">
          {business ? (
            <ServicePicker
              business={business}
              disabled={disabled}
              onSelect={handleServiceSelect}
            />
          ) : null}
          <Button
            disabled={disabled}
            onClick={handleAddItem}
            size="sm"
            type="button"
            variant="outline"
          >
            Add Item
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-md border-2 border-border border-dashed bg-muted/10 px-6 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No line items added yet. Click "Add Item" to get started.
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              className="grid gap-3 rounded-md border p-4"
              key={`item-${
                // biome-ignore lint/suspicious/noArrayIndexKey: Items can be reordered, but index is stable within render
                index
              }`}
            >
              {/* Description - full width */}
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor={`desc-${index}`}>
                  Description
                </Label>
                <Input
                  disabled={disabled}
                  id={`desc-${index}`}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  placeholder="Service description"
                  value={item.description}
                />
              </div>

              {/* Quantity, Unit Price, Amount, Delete */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor={`qty-${index}`}>
                    Quantity
                  </Label>
                  <Input
                    disabled={disabled}
                    id={`qty-${index}`}
                    min="0"
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    placeholder="1"
                    step="0.01"
                    type="number"
                    value={item.quantity}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor={`price-${index}`}>
                    Unit Price (GYD)
                  </Label>
                  <Input
                    disabled={disabled}
                    id={`price-${index}`}
                    min="0"
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", e.target.value)
                    }
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={item.unitPrice}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor={`amount-${index}`}>
                    Amount (GYD)
                  </Label>
                  <Input
                    disabled
                    id={`amount-${index}`}
                    readOnly
                    value={item.amount}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    disabled={disabled}
                    onClick={() => handleRemoveItem(index)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove item</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subtotal Display */}
      {items.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  GYD{" "}
                  {items
                    .reduce(
                      (sum, item) =>
                        sum + Number.parseFloat(item.amount || "0"),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
