import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Calculator,
  DollarSign,
  Receipt,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/app/calculators/")({
  component: CalculatorsIndex,
});

function CalculatorsIndex() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">Tax Calculators</h1>
        <p className="text-muted-foreground">
          Calculate PAYE, VAT, NIS, and payroll based on Guyana tax rates (2025)
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-amber-900 text-sm dark:text-amber-200">
          <strong>Disclaimer:</strong> These calculators are for reference
          purposes only. For official tax calculations and compliance
          requirements, please consult the Guyana Revenue Authority (GRA).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Payroll Calculator - Primary */}
        <Card className="flex flex-col border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/20">
              <Briefcase className="size-6 text-primary" />
            </div>
            <CardTitle>Payroll Calculator</CardTitle>
            <CardDescription>
              Comprehensive net pay calculator with PAYE, NIS, gratuity, and
              deductions
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Includes:</span>
                <span className="font-medium">PAYE + NIS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gratuity:</span>
                <span className="font-medium">22.5% optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequencies:</span>
                <span className="font-medium">All supported</span>
              </div>
            </div>
            <Link to="/app/calculators/salary">
              <Button className="w-full">
                <Calculator className="mr-2 size-4" />
                Calculate Payroll
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Receipt className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>PAYE Calculator</CardTitle>
            <CardDescription>
              Calculate Pay As You Earn income tax based on monthly or annual
              salary
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">First bracket:</span>
                <span className="font-medium">25% on first $3.12M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Second bracket:</span>
                <span className="font-medium">35% above $3.12M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Personal allowance:
                </span>
                <span className="font-medium">$1,560,000/year</span>
              </div>
            </div>
            <Link to="/app/calculators/paye">
              <Button className="w-full" variant="outline">
                <Calculator className="mr-2 size-4" />
                Calculate PAYE
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="size-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>VAT Calculator</CardTitle>
            <CardDescription>
              Calculate Value Added Tax at 14% standard rate for goods and
              services
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard rate:</span>
                <span className="font-medium">14%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add or extract:</span>
                <span className="font-medium">Both supported</span>
              </div>
            </div>
            <Link to="/app/calculators/vat">
              <Button className="w-full" variant="outline">
                <Calculator className="mr-2 size-4" />
                Calculate VAT
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>NIS Calculator</CardTitle>
            <CardDescription>
              Calculate National Insurance Scheme contributions for employees
              and employers
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee rate:</span>
                <span className="font-medium">5.6%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer rate:</span>
                <span className="font-medium">8.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly ceiling:</span>
                <span className="font-medium">$1,386,600</span>
              </div>
            </div>
            <Link to="/app/calculators/nis">
              <Button className="w-full" variant="outline">
                <Calculator className="mr-2 size-4" />
                Calculate NIS
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About These Calculators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">PAYE (Pay As You Earn)</h3>
            <p className="text-muted-foreground text-sm">
              PAYE is the income tax system in Guyana. Tax is calculated on
              annual income after deducting the personal allowance
              ($1,560,000/year) and other eligible deductions. The progressive
              rate system applies 25% on the first $3.12M GYD and 35% on income
              above that threshold.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">VAT (Value Added Tax)</h3>
            <p className="text-muted-foreground text-sm">
              VAT is charged at 14% on most goods and services in Guyana. This
              calculator can both add VAT to a base amount or extract VAT from a
              total that already includes it.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">
              NIS (National Insurance Scheme)
            </h3>
            <p className="text-muted-foreground text-sm">
              NIS contributions fund social security benefits including pensions
              and unemployment benefits. Both employees and employers
              contribute, with contributions capped at a monthly income ceiling
              of $1,386,600 GYD.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
