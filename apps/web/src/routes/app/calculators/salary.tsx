import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Calculator,
  ChevronDown,
  DollarSign,
  GraduationCap,
  Info,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { client } from "@/utils/orpc";
import { unwrapOrpc } from "@/utils/orpc-response";

// Types for tax rates response
type TaxRatesResponse = {
  paye: {
    firstBracketRate: number;
    firstBracketThreshold: number;
    secondBracketRate: number;
  };
  nis: {
    employeeRate: number;
    monthlyCeiling: number;
  };
  salary: {
    gratuityRate: number;
  };
};

export const Route = createFileRoute("/app/calculators/salary")({
  component: SalaryCalculator,
});

type PayFrequency = "daily" | "weekly" | "fortnightly" | "monthly" | "yearly";
type QualificationLevel =
  | "NONE"
  | "CERTIFICATE"
  | "DIPLOMA"
  | "BACHELORS"
  | "MASTERS"
  | "DOCTORATE";

const frequencyLabels: Record<PayFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const qualificationLabels: Record<QualificationLevel, string> = {
  NONE: "None",
  CERTIFICATE: "Certificate",
  DIPLOMA: "Diploma",
  BACHELORS: "Bachelor's Degree",
  MASTERS: "Master's Degree",
  DOCTORATE: "Doctorate",
};

type SalaryResult = {
  grossMonthly: number;
  grossAnnual: number;
  frequency: PayFrequency;
  deductions: {
    personalAllowance: number;
    qualificationAllowance: number;
    childDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
  };
  taxableIncome: number;
  tax: {
    firstBracketIncome: number;
    firstBracketTax: number;
    secondBracketIncome: number;
    secondBracketTax: number;
    totalAnnualTax: number;
    monthlyTax: number;
  };
  nis: {
    employeeMonthly: number;
    employerMonthly: number;
    employeeAnnual: number;
    employerAnnual: number;
    cappedIncome: number;
    ceiling: number;
  };
  gratuity: {
    included: boolean;
    rate: number;
    monthlyAmount: number;
    isSpecialMonth: boolean;
    specialMonthBonus: number;
  };
  netPay: {
    monthly: number;
    annual: number;
    daily: number;
    weekly: number;
    fortnightly: number;
  };
  employerCosts: {
    grossSalary: number;
    nisContribution: number;
    gratuityContribution: number;
    totalMonthlyCost: number;
    totalAnnualCost: number;
  };
  effectiveRates: {
    taxRate: number;
    nisRate: number;
    totalDeductionRate: number;
  };
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Salary calculator displays comprehensive tax breakdown with multiple conditional sections (tax rates, deductions, NIS, gratuity, employer costs, effective rates)
function SalaryCalculator() {
  const [grossSalary, setGrossSalary] = useState("");
  const [frequency, setFrequency] = useState<PayFrequency>("monthly");
  const [includeGratuity, setIncludeGratuity] = useState(false);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [qualificationLevel, setQualificationLevel] =
    useState<QualificationLevel>("NONE");
  const [numberOfChildren, setNumberOfChildren] = useState("");
  const [otherDeductions, setOtherDeductions] = useState("");
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: taxRatesRaw } = useQuery({
    queryKey: ["taxRates"],
    queryFn: () => client.taxCalculators.getTaxRates(),
  });
  const taxRates = unwrapOrpc<TaxRatesResponse>(taxRatesRaw);

  const calculateMutation = useMutation({
    mutationFn: async (data: {
      grossSalary: number;
      frequency: PayFrequency;
      includeGratuity: boolean;
      month?: number;
      qualificationLevel?: QualificationLevel;
      numberOfChildren?: number;
      otherDeductions?: number;
    }) => {
      const response = await client.taxCalculators.calculateSalary(data);
      return unwrapOrpc<SalaryResult>(response);
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to calculate salary"
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: {
      calculationType: "PAYE" | "VAT" | "NIS" | "SALARY";
      inputData: Record<string, unknown>;
      result: Record<string, unknown>;
    }) => client.taxCalculators.saveCalculation(data),
    onSuccess: () => {
      toast.success("Calculation saved successfully");
    },
    onError: () => {
      toast.error("Failed to save calculation");
    },
  });

  const handleCalculate = () => {
    const salary = Number.parseFloat(grossSalary);
    if (Number.isNaN(salary) || salary < 0) {
      toast.error("Please enter a valid gross salary");
      return;
    }

    calculateMutation.mutate({
      grossSalary: salary,
      frequency,
      includeGratuity,
      month,
      qualificationLevel:
        qualificationLevel !== "NONE" ? qualificationLevel : undefined,
      numberOfChildren: numberOfChildren
        ? Number.parseInt(numberOfChildren, 10)
        : undefined,
      otherDeductions: otherDeductions
        ? Number.parseFloat(otherDeductions)
        : undefined,
    });
  };

  const handleSave = () => {
    if (!result) {
      return;
    }

    saveMutation.mutate({
      calculationType: "SALARY",
      inputData: {
        grossSalary: Number.parseFloat(grossSalary),
        frequency,
        includeGratuity,
        month,
        qualificationLevel,
        numberOfChildren: numberOfChildren
          ? Number.parseInt(numberOfChildren, 10)
          : 0,
        otherDeductions: otherDeductions
          ? Number.parseFloat(otherDeductions)
          : 0,
      },
      result: result as unknown as Record<string, unknown>,
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

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
            Payroll Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate net pay with PAYE, NIS, gratuity, and deductions
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-amber-900 text-sm dark:text-amber-200">
          <strong>Disclaimer:</strong> This calculator is for reference purposes
          only. For official payroll calculations, please consult with a
          qualified accountant or the Guyana Revenue Authority (GRA).
        </p>
      </div>

      {/* Tax Rates Info */}
      {!!taxRates && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="text-muted-foreground text-xs">
                First Tax Bracket
              </div>
              <div className="font-semibold text-lg">
                {taxRates.paye.firstBracketRate}%
              </div>
              <div className="text-muted-foreground text-xs">
                on first {formatCurrency(taxRates.paye.firstBracketThreshold)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="pt-4">
              <div className="text-muted-foreground text-xs">
                Second Tax Bracket
              </div>
              <div className="font-semibold text-lg">
                {taxRates.paye.secondBracketRate}%
              </div>
              <div className="text-muted-foreground text-xs">
                above {formatCurrency(taxRates.paye.firstBracketThreshold)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-4">
              <div className="text-muted-foreground text-xs">NIS Employee</div>
              <div className="font-semibold text-lg">
                {taxRates.nis.employeeRate}%
              </div>
              <div className="text-muted-foreground text-xs">
                ceiling {formatCurrency(taxRates.nis.monthlyCeiling)}/mo
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="pt-4">
              <div className="text-muted-foreground text-xs">Gratuity Rate</div>
              <div className="font-semibold text-lg">
                {taxRates.salary.gratuityRate}%
              </div>
              <div className="text-muted-foreground text-xs">
                of gross salary
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Salary Details
            </CardTitle>
            <CardDescription>
              Enter your gross salary and select options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gross Salary */}
            <div className="space-y-2">
              <Label htmlFor="grossSalary">
                Gross Salary (GYD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="grossSalary"
                min="0"
                onChange={(e) => setGrossSalary(e.target.value)}
                placeholder="Enter amount"
                step="1000"
                type="number"
                value={grossSalary}
              />
            </div>

            {/* Pay Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Pay Frequency</Label>
              <Select
                onValueChange={(v) => setFrequency(v as PayFrequency)}
                value={frequency}
              >
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gratuity Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base" htmlFor="gratuity">
                  Include Gratuity
                </Label>
                <p className="text-muted-foreground text-sm">
                  Add 22.5% gratuity to salary
                </p>
              </div>
              <Switch
                checked={includeGratuity}
                id="gratuity"
                onCheckedChange={setIncludeGratuity}
              />
            </div>

            {/* Month selector for gratuity */}
            {includeGratuity === true ? (
              <div className="space-y-2">
                <Label className="flex items-center gap-2" htmlFor="month">
                  Current Month
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          June and December have special gratuity calculations
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  onValueChange={(v) => setMonth(Number.parseInt(v, 10))}
                  value={month.toString()}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((monthName, index) => (
                      <SelectItem
                        key={monthName}
                        value={(index + 1).toString()}
                      >
                        {monthName}
                        {(index + 1 === 6 || index + 1 === 12) && " (Special)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Advanced Options */}
            <Collapsible onOpenChange={setShowAdvanced} open={showAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  className="w-full justify-between"
                  type="button"
                  variant="outline"
                >
                  Advanced Options
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* Qualification Level */}
                <div className="space-y-2">
                  <Label
                    className="flex items-center gap-2"
                    htmlFor="qualification"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Qualification Level
                  </Label>
                  <Select
                    onValueChange={(v) =>
                      setQualificationLevel(v as QualificationLevel)
                    }
                    value={qualificationLevel}
                  >
                    <SelectTrigger id="qualification">
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(qualificationLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Higher qualifications may provide tax deductions
                  </p>
                </div>

                {/* Number of Children */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor="children">
                    <Users className="h-4 w-4" />
                    Number of Children
                  </Label>
                  <Input
                    id="children"
                    max="10"
                    min="0"
                    onChange={(e) => setNumberOfChildren(e.target.value)}
                    placeholder="0"
                    type="number"
                    value={numberOfChildren}
                  />
                  <p className="text-muted-foreground text-xs">
                    Up to 4 children qualify for tax deductions
                  </p>
                </div>

                {/* Other Deductions */}
                <div className="space-y-2">
                  <Label
                    className="flex items-center gap-2"
                    htmlFor="otherDeductions"
                  >
                    <DollarSign className="h-4 w-4" />
                    Other Monthly Deductions (GYD)
                  </Label>
                  <Input
                    id="otherDeductions"
                    min="0"
                    onChange={(e) => setOtherDeductions(e.target.value)}
                    placeholder="0"
                    type="number"
                    value={otherDeductions}
                  />
                  <p className="text-muted-foreground text-xs">
                    Additional tax-deductible expenses
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              className="w-full"
              disabled={calculateMutation.isPending || !grossSalary}
              onClick={handleCalculate}
            >
              {calculateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="mr-2 h-4 w-4" />
              )}
              {calculateMutation.isPending ? "Calculating..." : "Calculate"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result ? (
          <div className="space-y-4">
            {/* Net Pay Summary */}
            <Card className="border-2 border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Net Pay Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Monthly Net Pay
                  </p>
                  <p className="font-bold text-3xl text-green-600 dark:text-green-400">
                    {formatCurrency(result.netPay.monthly)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Annual</p>
                    <p className="font-semibold">
                      {formatCurrency(result.netPay.annual)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Weekly</p>
                    <p className="font-semibold">
                      {formatCurrency(result.netPay.weekly)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deductions Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Deductions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Monthly:</span>
                  <span className="font-medium">
                    {formatCurrency(result.grossMonthly)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Monthly PAYE Tax:
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(result.tax.monthlyTax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NIS (Employee):</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(result.nis.employeeMonthly)}
                  </span>
                </div>
                {result.gratuity.included ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gratuity:</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(result.gratuity.monthlyAmount)}
                    </span>
                  </div>
                ) : null}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Monthly Pay:</span>
                    <span className="text-green-600">
                      {formatCurrency(result.netPay.monthly)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tax Calculation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Personal Allowance:
                  </span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(result.deductions.personalAllowance)}
                  </span>
                </div>
                {result.deductions.qualificationAllowance > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Qualification Allowance:
                    </span>
                    <span className="font-medium text-green-600">
                      -
                      {formatCurrency(result.deductions.qualificationAllowance)}
                    </span>
                  </div>
                ) : null}
                {result.deductions.childDeduction > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Child Deduction:
                    </span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(result.deductions.childDeduction)}
                    </span>
                  </div>
                ) : null}
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Taxable Income (Annual):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(result.taxableIncome)}
                    </span>
                  </div>
                </div>
                {result.tax.firstBracketIncome > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      First Bracket (25%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(result.tax.firstBracketTax)}
                    </span>
                  </div>
                ) : null}
                {result.tax.secondBracketIncome > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Second Bracket (35%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(result.tax.secondBracketTax)}
                    </span>
                  </div>
                ) : null}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Annual Tax:</span>
                    <span className="text-red-600">
                      {formatCurrency(result.tax.totalAnnualTax)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Costs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Employer Total Cost</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Salary:</span>
                  <span className="font-medium">
                    {formatCurrency(result.employerCosts.grossSalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    NIS (Employer 8.4%):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(result.employerCosts.nisContribution)}
                  </span>
                </div>
                {result.gratuity.included ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gratuity:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        result.employerCosts.gratuityContribution
                      )}
                    </span>
                  </div>
                ) : null}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Monthly Cost:</span>
                    <span>
                      {formatCurrency(result.employerCosts.totalMonthlyCost)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Annual Cost:</span>
                    <span>
                      {formatCurrency(result.employerCosts.totalAnnualCost)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Effective Rates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Effective Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-muted-foreground text-xs">Tax Rate</p>
                    <p className="font-semibold text-lg">
                      {result.effectiveRates.taxRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">NIS Rate</p>
                    <p className="font-semibold text-lg">
                      {result.effectiveRates.nisRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Total Deduction
                    </p>
                    <p className="font-semibold text-lg">
                      {result.effectiveRates.totalDeductionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              className="w-full"
              disabled={saveMutation.isPending}
              onClick={handleSave}
              variant="outline"
            >
              <Save className="mr-2 h-4 w-4" />
              {(() => {
                if (saveMutation.isPending) {
                  return "Saving...";
                }
                if (saveMutation.isSuccess) {
                  return "Saved!";
                }
                return "Save Calculation";
              })()}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Salary is Calculated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="mb-2 font-semibold">1. Convert to Monthly</h4>
            <p className="text-muted-foreground">
              If your salary is entered in a different frequency (daily, weekly,
              etc.), it's first converted to a monthly equivalent for consistent
              calculations.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">2. Apply Tax Deductions</h4>
            <p className="text-muted-foreground">
              Personal allowance ($1,560,000/year), qualification allowances,
              child deductions (up to 4 children), and other deductions are
              subtracted from annual income before tax calculation.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">3. Calculate Progressive Tax</h4>
            <p className="text-muted-foreground">
              PAYE is calculated at 25% on the first $3,120,000 of taxable
              income, then 35% on any amount above that threshold.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">4. Calculate NIS</h4>
            <p className="text-muted-foreground">
              NIS contributions are 5.6% for employees and 8.4% for employers,
              capped at a monthly ceiling of $280,000.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">5. Add Gratuity (Optional)</h4>
            <p className="text-muted-foreground">
              If enabled, gratuity at 22.5% of gross salary is added to your
              take-home pay. June and December may have special bonus
              calculations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
