import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calculator, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/app/calculators/vat")({
  component: VATCalculator,
});

function VATCalculator() {
  const [amount, setAmount] = useState("");
  const [includesVAT, setIncludesVAT] = useState<"yes" | "no">("no");
  const [result, setResult] = useState<{
    amount: number;
    vatAmount: number;
    totalWithVAT: number;
    totalWithoutVAT: number;
    vatRate: number;
  } | null>(null);

  const calculateMutation = orpc.taxCalculators.calculate.vat.useMutation();
  const saveMutation = orpc.taxCalculators.history.save.useMutation();

  const handleCalculate = async () => {
    const amountValue = Number.parseFloat(amount);
    if (Number.isNaN(amountValue) || amountValue < 0) {
      return;
    }

    try {
      const calculationResult = await calculateMutation.mutateAsync({
        amount: amountValue,
        includesVAT: includesVAT === "yes",
      });
      setResult(calculationResult);
    } catch (error) {
      console.error("Failed to calculate VAT:", error);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      await saveMutation.mutateAsync({
        calculationType: "VAT",
        inputData: {
          amount: result.amount,
          includesVAT: includesVAT === "yes",
        },
        result,
      });
    } catch (error) {
      console.error("Failed to save calculation:", error);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link to="/app/calculators">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to calculators</span>
          </Button>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-3xl tracking-tight">VAT Calculator</h1>
          <p className="text-muted-foreground">
            Calculate Value Added Tax at Guyana's 14% standard rate
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-amber-900 text-sm dark:text-amber-200">
          <strong>Disclaimer:</strong> This calculator is for reference purposes
          only. For official tax calculations, please consult the Guyana Revenue
          Authority (GRA).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amount Details</CardTitle>
            <CardDescription>
              Enter the amount and specify if VAT is included
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (GYD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                min="0"
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={amount}
              />
            </div>

            <div className="space-y-2">
              <Label>Does this amount include VAT?</Label>
              <RadioGroup
                onValueChange={(value) => setIncludesVAT(value as "yes" | "no")}
                value={includesVAT}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="no" value="no" />
                  <Label className="font-normal" htmlFor="no">
                    No - Add VAT to this amount
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="yes" value="yes" />
                  <Label className="font-normal" htmlFor="yes">
                    Yes - Extract VAT from this amount
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-muted-foreground text-xs">
                Select "No" to calculate the total with VAT added. Select "Yes"
                to extract the VAT from a total that already includes it.
              </p>
            </div>

            <Button
              className="w-full"
              disabled={calculateMutation.isPending}
              onClick={handleCalculate}
            >
              <Calculator className="mr-2 size-4" />
              {calculateMutation.isPending ? "Calculating..." : "Calculate VAT"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>
                Your VAT calculation at {result.vatRate}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-lg bg-muted p-4">
                <h4 className="font-semibold text-sm">Breakdown</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Amount without VAT:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(result.totalWithoutVAT)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    VAT ({result.vatRate}%):
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {formatCurrency(result.vatAmount)}
                  </span>
                </div>
                <div className="border-border border-t pt-3">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total with VAT:</span>
                    <span>{formatCurrency(result.totalWithVAT)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
                <div className="flex justify-between">
                  <span className="font-semibold">VAT Amount:</span>
                  <span className="font-bold text-blue-600 text-xl dark:text-blue-400">
                    {formatCurrency(result.vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {includesVAT === "yes"
                      ? "Amount excluding VAT:"
                      : "Total including VAT:"}
                  </span>
                  <span className="font-bold text-lg">
                    {includesVAT === "yes"
                      ? formatCurrency(result.totalWithoutVAT)
                      : formatCurrency(result.totalWithVAT)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3 text-center text-muted-foreground text-sm">
                {includesVAT === "yes" ? (
                  <>
                    VAT of {formatCurrency(result.vatAmount)} has been extracted
                    from the total amount.
                  </>
                ) : (
                  <>
                    VAT of {formatCurrency(result.vatAmount)} has been added to
                    the base amount.
                  </>
                )}
              </div>

              <Button
                className="w-full"
                disabled={saveMutation.isPending}
                onClick={handleSave}
                variant="outline"
              >
                <Save className="mr-2 size-4" />
                {saveMutation.isPending
                  ? "Saving..."
                  : saveMutation.isSuccess
                    ? "Saved!"
                    : "Save Calculation"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How VAT is Calculated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="mb-2 font-semibold">
              Adding VAT (VAT not included)
            </h4>
            <p className="text-muted-foreground">
              When the amount does not include VAT, we multiply by 14% to get
              the VAT amount, then add it to the base amount to get the total
              with VAT.
            </p>
            <p className="mt-2 font-mono text-muted-foreground text-xs">
              VAT Amount = Base Amount × 0.14
              <br />
              Total = Base Amount + VAT Amount
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">
              Extracting VAT (VAT included)
            </h4>
            <p className="text-muted-foreground">
              When the amount already includes VAT, we divide by 1.14 to get the
              base amount, then subtract it from the total to get the VAT
              amount.
            </p>
            <p className="mt-2 font-mono text-muted-foreground text-xs">
              Base Amount = Total Amount ÷ 1.14
              <br />
              VAT Amount = Total Amount - Base Amount
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">VAT in Guyana</h4>
            <p className="text-muted-foreground">
              The standard VAT rate in Guyana is 14% on most goods and services.
              Some items may be zero-rated or exempt from VAT. Always check with
              the GRA for specific product classifications.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
