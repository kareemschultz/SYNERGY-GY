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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/calculators/nis")({
  component: NISCalculator,
});

function NISCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [contributionType, setContributionType] = useState<
    "employee" | "employer" | "both"
  >("both");
  const [result, setResult] = useState<{
    monthlyIncome: number;
    cappedIncome: number;
    employeeContribution: number;
    employerContribution: number;
    totalContribution: number;
    employeeRate: number;
    employerRate: number;
    ceiling: number;
  } | null>(null);

  const calculateMutation = useMutation({
    mutationFn: (data: {
      monthlyIncome: number;
      contributionType: "employee" | "employer" | "both";
    }) => client.taxCalculators.calculateNis(data),
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

    try {
      const calculationResult = await calculateMutation.mutateAsync({
        monthlyIncome: income,
        contributionType,
      });
      setResult(calculationResult);
    } catch (error) {
      console.error("Failed to calculate NIS:", error);
    }
  };

  const handleSave = async () => {
    if (!result) {
      return;
    }

    try {
      await saveMutation.mutateAsync({
        calculationType: "NIS",
        inputData: {
          monthlyIncome: result.monthlyIncome,
          contributionType,
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
          <h1 className="font-bold text-3xl tracking-tight">NIS Calculator</h1>
          <p className="text-muted-foreground">
            Calculate National Insurance Scheme contributions for employees and
            employers
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-amber-900 text-sm dark:text-amber-200">
          <strong>Disclaimer:</strong> This calculator is for reference purposes
          only. For official NIS calculations, please consult the National
          Insurance Scheme.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income Details</CardTitle>
            <CardDescription>
              Enter monthly income and contribution type
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
                placeholder="0.00"
                step="1000"
                type="number"
                value={monthlyIncome}
              />
              <p className="text-muted-foreground text-xs">
                Contributions are capped at a monthly income ceiling of
                $1,386,600 GYD
              </p>
            </div>

            <div className="space-y-2">
              <Label>Calculate contributions for:</Label>
              <RadioGroup
                onValueChange={(value) =>
                  setContributionType(value as "employee" | "employer" | "both")
                }
                value={contributionType}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="both" value="both" />
                  <Label className="font-normal" htmlFor="both">
                    Both employee and employer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="employee" value="employee" />
                  <Label className="font-normal" htmlFor="employee">
                    Employee only (5.6%)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="employer" value="employer" />
                  <Label className="font-normal" htmlFor="employer">
                    Employer only (8.4%)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              className="w-full"
              disabled={calculateMutation.isPending}
              onClick={handleCalculate}
            >
              <Calculator className="mr-2 size-4" />
              {calculateMutation.isPending
                ? "Calculating..."
                : "Calculate Contributions"}
            </Button>
          </CardContent>
        </Card>

        {!!result && (
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>Your NIS contribution breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Income:</span>
                  <span className="font-medium">
                    {formatCurrency(result.monthlyIncome)}
                  </span>
                </div>
                {result.monthlyIncome > result.ceiling && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="text-amber-900 text-xs dark:text-amber-200">
                      <strong>Note:</strong> Income exceeds the NIS ceiling of{" "}
                      {formatCurrency(result.ceiling)}. Contributions are
                      calculated on the capped amount only.
                    </p>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Income for calculation:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(result.cappedIncome)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 rounded-lg bg-muted p-4">
                <h4 className="font-semibold text-sm">
                  Contribution Breakdown
                </h4>
                {contributionType !== "employer" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Employee ({result.employeeRate}%):
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(result.employeeContribution)}
                    </span>
                  </div>
                )}
                {contributionType !== "employee" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Employer ({result.employerRate}%):
                    </span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {formatCurrency(result.employerContribution)}
                    </span>
                  </div>
                )}
                <div className="border-border border-t pt-3">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total Contribution:</span>
                    <span>{formatCurrency(result.totalContribution)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
                {contributionType === "both" && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        Employee Contribution:
                      </span>
                      <span className="font-bold text-blue-600 text-lg dark:text-blue-400">
                        {formatCurrency(result.employeeContribution)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        Employer Contribution:
                      </span>
                      <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                        {formatCurrency(result.employerContribution)}
                      </span>
                    </div>
                    <div className="border-border border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold">Combined Total:</span>
                        <span className="font-bold text-xl">
                          {formatCurrency(result.totalContribution)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {contributionType === "employee" && (
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      Employee Contribution:
                    </span>
                    <span className="font-bold text-blue-600 text-xl dark:text-blue-400">
                      {formatCurrency(result.employeeContribution)}
                    </span>
                  </div>
                )}
                {contributionType === "employer" && (
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      Employer Contribution:
                    </span>
                    <span className="font-bold text-purple-600 text-xl dark:text-purple-400">
                      {formatCurrency(result.employerContribution)}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted p-3 text-center text-muted-foreground text-sm">
                {contributionType === "both" && (
                  <>
                    Total NIS contribution is{" "}
                    {formatCurrency(result.totalContribution)} (
                    {result.employeeRate + result.employerRate}% combined)
                  </>
                )}
                {contributionType === "employee" && (
                  <>
                    Employee contributes {result.employeeRate}% of monthly
                    income (up to ceiling)
                  </>
                )}
                {contributionType === "employer" && (
                  <>
                    Employer contributes {result.employerRate}% of monthly
                    income (up to ceiling)
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
          <CardTitle>How NIS Contributions are Calculated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="mb-2 font-semibold">1. Apply Income Ceiling</h4>
            <p className="text-muted-foreground">
              If your monthly income exceeds $1,386,600 GYD, contributions are
              calculated only on the capped amount. This protects higher earners
              from unlimited contribution requirements.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">
              2. Calculate Employee Contribution
            </h4>
            <p className="text-muted-foreground">
              Employees contribute 5.6% of their monthly income (up to the
              ceiling). This amount is typically deducted from their paycheck by
              the employer.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">
              3. Calculate Employer Contribution
            </h4>
            <p className="text-muted-foreground">
              Employers contribute 8.4% of the employee's monthly income (up to
              the ceiling). This is paid by the employer in addition to the
              employee's salary.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">4. Combined Contribution</h4>
            <p className="text-muted-foreground">
              The total NIS contribution is 14% (5.6% employee + 8.4% employer)
              of the capped monthly income. These contributions fund social
              security benefits including pensions, unemployment benefits, and
              medical coverage.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">About NIS in Guyana</h4>
            <p className="text-muted-foreground">
              The National Insurance Scheme provides social security protection
              for workers and their families. Benefits include old age pensions,
              invalidity benefits, survivors benefits, employment injury
              benefits, and maternity benefits. Regular contributions ensure
              eligibility for these important protections.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
