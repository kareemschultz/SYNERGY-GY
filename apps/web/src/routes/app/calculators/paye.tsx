import { useMutation } from "@tanstack/react-query";
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
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/calculators/paye")({
  component: PAYECalculator,
});

function PAYECalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [personalAllowance, setPersonalAllowance] = useState("");
  const [otherDeductions, setOtherDeductions] = useState("");
  const [result, setResult] = useState<{
    monthlyIncome: number;
    annualIncome: number;
    personalAllowance: number;
    taxableIncome: number;
    totalTax: number;
    monthlyTax: number;
    netIncome: number;
    effectiveRate: number;
  } | null>(null);

  const calculateMutation = useMutation({
    mutationFn: (data: {
      monthlyIncome: number;
      personalAllowance?: number;
      otherDeductions?: number;
    }) => client.taxCalculators.calculatePaye(data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: {
      calculationType: "PAYE" | "VAT" | "NIS";
      inputData: Record<string, unknown>;
      result: Record<string, unknown>;
    }) => client.taxCalculators.saveCalculation(data),
  });

  const handleCalculate = async () => {
    const income = Number.parseFloat(monthlyIncome);
    if (Number.isNaN(income) || income < 0) {
      return;
    }

    const allowance = personalAllowance
      ? Number.parseFloat(personalAllowance)
      : undefined;
    const deductions = otherDeductions
      ? Number.parseFloat(otherDeductions)
      : undefined;

    try {
      const calculationResult = await calculateMutation.mutateAsync({
        monthlyIncome: income,
        personalAllowance: allowance,
        otherDeductions: deductions,
      });
      setResult(calculationResult);
    } catch (error) {
      const { toast } = await import("sonner");
      toast.error(
        error instanceof Error ? error.message : "Failed to calculate PAYE"
      );
    }
  };

  const handleSave = async () => {
    if (!result) {
      return;
    }

    try {
      await saveMutation.mutateAsync({
        calculationType: "PAYE",
        inputData: {
          monthlyIncome: result.monthlyIncome,
          personalAllowance: result.personalAllowance,
          otherDeductions: otherDeductions
            ? Number.parseFloat(otherDeductions)
            : 0,
        },
        result,
      });
    } catch (error) {
      const { toast } = await import("sonner");
      toast.error(
        error instanceof Error ? error.message : "Failed to save calculation"
      );
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
          <h1 className="font-bold text-3xl tracking-tight">
            PAYE Tax Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate Pay As You Earn income tax based on Guyana tax rates
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
            <CardTitle>Income Details</CardTitle>
            <CardDescription>
              Enter your monthly income and deductions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">
                Monthly Income (GYD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="monthlyIncome"
                min="0"
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="0"
                step="1000"
                type="number"
                value={monthlyIncome}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalAllowance">
                Personal Allowance (GYD/year)
              </Label>
              <Input
                id="personalAllowance"
                min="0"
                onChange={(e) => setPersonalAllowance(e.target.value)}
                placeholder="780000 (default)"
                step="10000"
                type="number"
                value={personalAllowance}
              />
              <p className="text-muted-foreground text-xs">
                Default: $780,000 GYD per year. Leave blank to use default.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherDeductions">
                Other Deductions (GYD/year)
              </Label>
              <Input
                id="otherDeductions"
                min="0"
                onChange={(e) => setOtherDeductions(e.target.value)}
                placeholder="0"
                step="10000"
                type="number"
                value={otherDeductions}
              />
              <p className="text-muted-foreground text-xs">
                Additional tax-deductible expenses (optional)
              </p>
            </div>

            <Button
              className="w-full"
              disabled={calculateMutation.isPending}
              onClick={handleCalculate}
            >
              <Calculator className="mr-2 size-4" />
              {calculateMutation.isPending ? "Calculating..." : "Calculate Tax"}
            </Button>
          </CardContent>
        </Card>

        {!!result && (
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>
                Your estimated PAYE tax breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Income:</span>
                  <span className="font-medium">
                    {formatCurrency(result.monthlyIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Annual Income:</span>
                  <span className="font-medium">
                    {formatCurrency(result.annualIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Personal Allowance:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{formatCurrency(result.personalAllowance)}
                  </span>
                </div>
                <div className="border-border border-t pt-3">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Taxable Income:</span>
                    <span>{formatCurrency(result.taxableIncome)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg bg-muted p-4">
                <h4 className="font-semibold text-sm">Tax Calculation</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    PAYE Rate (25%):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(result.totalTax)}
                  </span>
                </div>
                <div className="border-border border-t pt-3">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total Annual Tax:</span>
                    <span className="text-destructive">
                      {formatCurrency(result.totalTax)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Monthly Tax:</span>
                  <span className="font-bold text-destructive text-lg">
                    {formatCurrency(result.monthlyTax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Monthly Net Income:</span>
                  <span className="font-bold text-green-600 text-lg dark:text-green-400">
                    {formatCurrency(result.netIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Effective Rate:</span>
                  <span className="font-medium">
                    {result.effectiveRate.toFixed(2)}%
                  </span>
                </div>
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
                  : // biome-ignore lint/style/noNestedTernary: Auto-fix
                    saveMutation.isSuccess
                    ? "Saved!"
                    : "Save Calculation"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How PAYE is Calculated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="mb-2 font-semibold">1. Calculate Annual Income</h4>
            <p className="text-muted-foreground">
              Your monthly income is multiplied by 12 to get your annual income.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">
              2. Apply Personal Allowance and Deductions
            </h4>
            <p className="text-muted-foreground">
              The personal allowance ($780,000 by default) and any other
              deductions are subtracted from your annual income to determine
              taxable income.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">3. Calculate Tax</h4>
            <p className="text-muted-foreground">
              Tax is calculated at a flat rate of 25% on taxable income.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">4. Monthly Tax</h4>
            <p className="text-muted-foreground">
              The total annual tax is divided by 12 to get your monthly PAYE
              deduction.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
