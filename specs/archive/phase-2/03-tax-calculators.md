# Tax Calculators

**Status:** Planned
**Phase:** 2
**Priority:** Medium
**Estimated Effort:** 2-3 weeks

## Overview

Interactive calculators for Guyana tax calculations including PAYE, VAT, NIS, and corporate tax. Helps clients and staff quickly estimate tax obligations.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| TAX-FR-01 | PAYE calculator | Must |
| TAX-FR-02 | VAT calculator | Must |
| TAX-FR-03 | NIS contribution calculator | Must |
| TAX-FR-04 | Corporate tax estimator | Should |
| TAX-FR-05 | Withholding tax calculator | Should |
| TAX-FR-06 | Save calculation results | Should |
| TAX-FR-07 | Print/export results | Should |
| TAX-FR-08 | Year selection for rates | Should |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| TAX-NFR-01 | Calculation accuracy | 2 decimal places |
| TAX-NFR-02 | Calculation time | Instant |
| TAX-NFR-03 | Mobile responsive | Yes |

## Calculators

### 1. PAYE Calculator

Calculate Pay As You Earn tax for employees.

**Inputs:**
- Gross monthly income
- NIS contributions
- Other deductions
- Tax year

**Guyana PAYE Rates (2024):**
| Income Bracket | Rate |
|----------------|------|
| First $100,000/month | 28% |
| Over $100,000/month | 40% |

**Allowances:**
- Personal allowance: $85,000/month
- 1/3 of income threshold

**Output:**
- Taxable income
- Tax payable
- Net income
- Effective rate

### 2. VAT Calculator

Calculate Value Added Tax.

**Inputs:**
- Amount (inclusive or exclusive)
- Direction (add VAT or extract VAT)

**Guyana VAT Rate:** 14%

**Output:**
- Net amount
- VAT amount
- Gross amount

### 3. NIS Calculator

Calculate National Insurance Scheme contributions.

**Inputs:**
- Gross monthly earnings
- Employee type (Class A, B, C)

**NIS Rates (2024):**
| Class | Employee | Employer | Total |
|-------|----------|----------|-------|
| A | 5.6% | 8.4% | 14% |
| B | 5.2% | 7.8% | 13% |
| C | 4.8% | 7.2% | 12% |

**Ceiling:** Monthly insurable earnings cap

**Output:**
- Employee contribution
- Employer contribution
- Total contribution

### 4. Corporate Tax Estimator

Estimate corporate tax liability.

**Inputs:**
- Taxable profit
- Company type
- Tax year

**Guyana Corporate Tax Rates:**
| Type | Rate |
|------|------|
| Commercial | 40% |
| Non-commercial | 25% |
| Manufacturing (reduced) | 25% |

**Output:**
- Tax payable
- Effective rate

### 5. Withholding Tax Calculator

Calculate withholding on payments.

**Inputs:**
- Payment amount
- Payment type
- Recipient type (resident/non-resident)

**Withholding Rates:**
| Payment Type | Resident | Non-Resident |
|--------------|----------|--------------|
| Dividends | 0% | 20% |
| Interest | 20% | 20% |
| Royalties | 20% | 20% |
| Services | - | 20% |

**Output:**
- Withholding amount
- Net payment

## Database Schema

### Tables

#### `taxCalculation`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clientId | uuid | Client FK (optional) |
| calculatorType | enum | PAYE, VAT, NIS, CORPORATE, WITHHOLDING |
| inputs | jsonb | Input parameters |
| results | jsonb | Calculation results |
| taxYear | integer | Tax year used |
| notes | text | User notes |
| createdById | uuid | Creator FK |
| createdAt | timestamp | Created date |

#### `taxRate`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| type | varchar(50) | Rate type |
| name | varchar(100) | Rate name |
| value | decimal | Rate value |
| effectiveFrom | date | Start date |
| effectiveTo | date | End date (null if current) |
| metadata | jsonb | Additional info |

## API Endpoints

### Base: `/tax`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/paye/calculate` | Calculate PAYE |
| POST | `/vat/calculate` | Calculate VAT |
| POST | `/nis/calculate` | Calculate NIS |
| POST | `/corporate/calculate` | Estimate corporate tax |
| POST | `/withholding/calculate` | Calculate withholding |
| POST | `/save` | Save calculation |
| GET | `/history` | User's calculations |
| GET | `/rates` | Current tax rates |

## UI Routes

```
/app/calculators/
├── index.tsx           # Calculator selection
├── paye.tsx            # PAYE calculator
├── vat.tsx             # VAT calculator
├── nis.tsx             # NIS calculator
├── corporate.tsx       # Corporate tax
└── withholding.tsx     # Withholding tax
```

## UI Components

### Calculator Layout
```
+------------------------------------------+
| Calculator Title                         |
+------------------------------------------+
| INPUT SECTION                            |
| [Form fields based on calculator]        |
| [Calculate Button]                       |
+------------------------------------------+
| RESULTS SECTION (shown after calc)       |
| - Line item breakdown                    |
| - Summary totals                         |
| [Save] [Print] [Clear]                   |
+------------------------------------------+
| DISCLAIMER                               |
| This is for estimation only...           |
+------------------------------------------+
```

### Shared Components
- `CalculatorCard` - Card wrapper with title
- `InputSection` - Form fields section
- `ResultsSection` - Results display
- `TaxBreakdown` - Line item breakdown table
- `CalculatorDisclaimer` - Legal disclaimer

## Implementation Plan

### Week 1: Core Calculators
- [ ] Tax rates schema and seeding
- [ ] PAYE calculation logic
- [ ] VAT calculation logic
- [ ] NIS calculation logic
- [ ] Calculator UI framework

### Week 2: Additional & Features
- [ ] Corporate tax calculator
- [ ] Withholding tax calculator
- [ ] Save calculation feature
- [ ] Calculation history
- [ ] Print/export

### Week 3: Polish
- [ ] Validate against GRA rules
- [ ] Mobile responsive
- [ ] Testing
- [ ] Documentation

## Business Rules

1. **Disclaimers**: All results must show disclaimer
2. **Rate Updates**: Rates table updated when GRA changes
3. **Accuracy**: Round to 2 decimal places, round down for tax
4. **History**: Optional save for logged-in users
5. **No Advice**: Calculations are estimates, not tax advice

## Legal Disclaimer

```
DISCLAIMER: This calculator provides estimates only and should not be
considered tax advice. Tax laws and rates are subject to change.
Please consult with a qualified tax professional or the Guyana Revenue
Authority (GRA) for official guidance. [Company Name] is not responsible
for any decisions made based on these calculations.
```

## Dependencies

- None (standalone feature)
- Client table (optional save)

## Rate Update Process

1. Monitor GRA announcements
2. Update `taxRate` table
3. Set effectiveTo on old rates
4. Add new rates with effectiveFrom
5. Test calculations

## Success Criteria

- [ ] 100+ calculations per month
- [ ] Results match manual calculations
- [ ] Zero complaints about accuracy

---

## Implementation Requirements

### Database Setup
1. **Schema Creation**
   - Create `taxCalculation` table for saved calculations
   - Create `taxRate` table for rate management
   - Add indexes on calculatorType, taxYear, createdAt
   - Set up foreign key to clients (optional)

2. **Tax Rate Seeding**
   - Seed initial 2024 tax rates for all calculator types
   - PAYE brackets and allowances
   - VAT rate (14%)
   - NIS rates by class
   - Corporate tax rates by company type
   - Withholding tax rates
   - Set effectiveFrom and effectiveTo dates

### API Development
1. **Calculation Endpoints** (`/tax`)
   - POST `/paye/calculate` - Calculate PAYE with inputs validation
   - POST `/vat/calculate` - Calculate VAT (add or extract)
   - POST `/nis/calculate` - Calculate NIS by employee class
   - POST `/corporate/calculate` - Estimate corporate tax
   - POST `/withholding/calculate` - Calculate withholding tax
   - POST `/save` - Save calculation result (authenticated users)
   - GET `/history` - Retrieve user's calculation history
   - GET `/rates` - Get current tax rates by year
   - All calculations use rates from database

2. **Rate Management Endpoints** (`/tax/rates`)
   - GET `/list` - List all rates with filters
   - POST `/create` - Add new rate (admin only)
   - PUT `/update` - Update rate (admin only)
   - GET `/effective/:year` - Get rates for specific year

3. **Input Validation**
   - Zod schemas for each calculator's inputs
   - Validate positive numbers
   - Validate date formats
   - Validate enum values (employee class, company type, etc.)
   - Return clear error messages

### Calculation Logic Implementation
1. **PAYE Calculator**
   - Accept gross monthly income, NIS contributions, other deductions
   - Calculate taxable income (gross - allowances - deductions)
   - Apply progressive tax rates from database
   - Calculate personal allowance (lesser of $85,000 or 1/3 of income)
   - Return: taxable income, tax payable, net income, effective rate
   - Round down tax to nearest cent

2. **VAT Calculator**
   - Accept amount and direction (add VAT or extract VAT)
   - Retrieve VAT rate from database (14%)
   - Add VAT: net × (1 + rate)
   - Extract VAT: gross / (1 + rate) to get net, gross - net = VAT
   - Return: net amount, VAT amount, gross amount

3. **NIS Calculator**
   - Accept gross earnings and employee class (A, B, C)
   - Retrieve NIS rates from database by class
   - Apply monthly insurable earnings ceiling
   - Calculate employee contribution (earnings × employee rate)
   - Calculate employer contribution (earnings × employer rate)
   - Return: employee contribution, employer contribution, total

4. **Corporate Tax Calculator**
   - Accept taxable profit and company type
   - Retrieve corporate rate from database
   - Calculate tax liability (profit × rate)
   - Return: tax payable, effective rate

5. **Withholding Tax Calculator**
   - Accept payment amount, payment type, recipient type
   - Retrieve withholding rates from database
   - Calculate withholding (amount × rate)
   - Return: withholding amount, net payment

### UI Development
1. **Calculator Routes**
   - `/app/calculators/` - Calculator selection landing page
   - `/app/calculators/paye` - PAYE calculator
   - `/app/calculators/vat` - VAT calculator
   - `/app/calculators/nis` - NIS calculator
   - `/app/calculators/corporate` - Corporate tax calculator
   - `/app/calculators/withholding` - Withholding tax calculator

2. **Calculator Selection Page**
   - Grid of calculator cards
   - Icon and description for each
   - Quick links to each calculator
   - Recent calculations widget
   - Popular calculators highlighted

3. **Calculator Layout**
   - Consistent layout across all calculators
   - Input section with form fields
   - Calculate button (prominent)
   - Results section (initially hidden)
   - Breakdown table showing calculations
   - Summary totals
   - Action buttons: Save, Print, Clear
   - Disclaimer prominently displayed

4. **PAYE Calculator UI**
   - Gross monthly income input
   - NIS contributions input
   - Other deductions input
   - Tax year selector (defaults to current)
   - Results showing:
     - Gross income
     - Less: Personal allowance
     - Less: NIS
     - Less: Other deductions
     - Taxable income
     - Tax @ 28% (first $100k)
     - Tax @ 40% (over $100k)
     - Total tax payable
     - Net income
     - Effective rate

5. **VAT Calculator UI**
   - Amount input
   - Direction toggle (Add VAT / Extract VAT)
   - Results showing:
     - Net amount
     - VAT @ 14%
     - Gross amount

6. **NIS Calculator UI**
   - Gross monthly earnings input
   - Employee class selector (A, B, C)
   - Results showing:
     - Insurable earnings (capped)
     - Employee contribution
     - Employer contribution
     - Total contribution

7. **Corporate Tax Calculator UI**
   - Taxable profit input
   - Company type selector
   - Tax year selector
   - Results showing:
     - Taxable profit
     - Tax rate applied
     - Tax payable
     - Effective rate

8. **Withholding Tax Calculator UI**
   - Payment amount input
   - Payment type selector
   - Recipient type selector (Resident/Non-Resident)
   - Results showing:
     - Gross payment
     - Withholding rate
     - Withholding amount
     - Net payment

9. **Shared Components**
   - `<CalculatorCard>` - Calculator wrapper with consistent styling
   - `<CalculatorInput>` - Formatted number input with currency
   - `<ResultsTable>` - Breakdown table component
   - `<TaxDisclaimer>` - Legal disclaimer component
   - `<SaveCalculationDialog>` - Save with notes
   - `<CalculationHistory>` - List of saved calculations

### Save & History Features
1. **Save Calculation**
   - Button to save current calculation
   - Optional: Link to client
   - Optional: Add notes
   - Store inputs and results as JSON
   - Timestamp and user tracking

2. **Calculation History**
   - List saved calculations
   - Filter by calculator type
   - Filter by date range
   - View saved calculation details
   - Reload calculation to calculator
   - Export to PDF

### Print/Export Features
1. **Print Layout**
   - Printer-friendly CSS
   - Include all inputs and results
   - Include company branding
   - Include disclaimer
   - Include calculation date

2. **Export Options**
   - Print to PDF (browser print)
   - Copy results to clipboard
   - Export to CSV (for history)

### Disclaimer Implementation
- Display on all calculator pages
- Clear, readable font
- Visible without scrolling (sticky footer or prominent box)
- Text: "DISCLAIMER: This calculator provides estimates only and should not be considered tax advice. Tax laws and rates are subject to change. Please consult with a qualified tax professional or the Guyana Revenue Authority (GRA) for official guidance. [Company Name] is not responsible for any decisions made based on these calculations."

## Acceptance Criteria

### PAYE Calculator
- [ ] Accepts valid inputs
- [ ] Calculates taxable income correctly
- [ ] Applies personal allowance correctly
- [ ] Applies progressive tax rates
- [ ] Returns accurate tax payable
- [ ] Calculates net income correctly
- [ ] Shows effective tax rate
- [ ] Matches manual calculations

### VAT Calculator
- [ ] Adds VAT correctly (14%)
- [ ] Extracts VAT correctly
- [ ] Handles both directions
- [ ] Returns net, VAT, and gross amounts
- [ ] Currency formatted properly

### NIS Calculator
- [ ] Accepts employee class selection
- [ ] Retrieves correct rates by class
- [ ] Applies earnings ceiling
- [ ] Calculates employee contribution
- [ ] Calculates employer contribution
- [ ] Shows total contribution
- [ ] Matches GRA NIS tables

### Corporate Tax Calculator
- [ ] Accepts company type
- [ ] Applies correct rate by type
- [ ] Calculates tax liability
- [ ] Shows effective rate

### Withholding Tax Calculator
- [ ] Accepts payment type
- [ ] Accepts recipient type
- [ ] Applies correct withholding rate
- [ ] Calculates withholding amount
- [ ] Calculates net payment

### Rate Management
- [ ] Rates stored in database
- [ ] Rates retrievable by year
- [ ] Effective date ranges working
- [ ] Admin can update rates
- [ ] Rate changes don't affect historical calculations

### Save & History
- [ ] Calculations can be saved
- [ ] Saved calculations retrievable
- [ ] History filtered by type
- [ ] Saved calculations can be reloaded
- [ ] Client linking optional

### UI/UX
- [ ] All calculators mobile-responsive
- [ ] Inputs clearly labeled
- [ ] Results displayed clearly
- [ ] Breakdown tables readable
- [ ] Calculate button prominent
- [ ] Clear button resets form
- [ ] Loading states shown
- [ ] Error messages helpful

### Disclaimer
- [ ] Disclaimer visible on all calculators
- [ ] Disclaimer text complete and accurate
- [ ] Disclaimer readable and prominent

### Print/Export
- [ ] Print layout formatted correctly
- [ ] All data included in print
- [ ] Print-friendly styling
- [ ] Export to PDF functional

### Performance
- [ ] Calculations instant (< 100ms)
- [ ] Results update immediately
- [ ] No lag on input changes
- [ ] Page load under 2 seconds

### Accuracy
- [ ] All calculations accurate to 2 decimal places
- [ ] PAYE matches GRA guidelines
- [ ] VAT calculations correct
- [ ] NIS matches official tables
- [ ] Corporate tax rates correct
- [ ] Withholding rates correct

### Security
- [ ] Input validation prevents injection
- [ ] Positive number validation
- [ ] No sensitive data exposed
- [ ] Rate changes logged

## Test Cases

### Unit Tests
1. **PAYE Calculation**
   - Test with income below allowance
   - Test with income in 28% bracket only
   - Test with income in 40% bracket
   - Test with maximum deductions
   - Verify personal allowance calculation
   - Test rounding

2. **VAT Calculation**
   - Test add VAT to net amount
   - Test extract VAT from gross
   - Test with various amounts
   - Verify calculation precision

3. **NIS Calculation**
   - Test Class A rates
   - Test Class B rates
   - Test Class C rates
   - Test earnings ceiling
   - Test below ceiling
   - Test at ceiling

4. **Corporate Tax**
   - Test commercial rate (40%)
   - Test non-commercial rate (25%)
   - Test manufacturing rate (25%)

5. **Withholding Tax**
   - Test resident dividend (0%)
   - Test non-resident dividend (20%)
   - Test interest (20%)
   - Test royalties (20%)
   - Test services to non-resident (20%)

6. **Rate Retrieval**
   - Test getting current year rates
   - Test getting historical rates
   - Test effective date ranges

### Integration Tests
1. **Save and Reload**
   - Calculate → Save → Retrieve → Reload → Verify match

2. **Rate Update Impact**
   - Calculate with current rate → Update rate → Calculate again → Verify new rate used

3. **History Filtering**
   - Save multiple calculations → Filter by type → Verify correct results

### End-to-End Tests
1. **Complete Flow**
   - Open calculator → Enter inputs → Calculate → View results → Save → View in history

2. **Print Flow**
   - Calculate → Print → Verify PDF output

### Accuracy Tests
1. **PAYE Test Cases**
   - Income $50,000 → Expected tax $0 (below allowance)
   - Income $100,000 → Expected tax (compare with GRA tables)
   - Income $200,000 → Expected tax (compare with GRA tables)

2. **VAT Test Cases**
   - Add VAT to $100 → $114
   - Extract VAT from $114 → $100 net, $14 VAT

3. **NIS Test Cases**
   - Class A, $100,000 → Employee $5,600, Employer $8,400

### Performance Tests
- 100 concurrent calculations
- Calculate with large numbers
- History with 1000+ saved calculations

## Dependencies from Phase 1

### Optional Dependencies
1. **Client Management** (optional)
   - For linking saved calculations to clients
   - Not required for calculator functionality

2. **Authentication** (for save feature)
   - User context for saved calculations
   - Calculators can work without auth (guest mode)

### No Hard Dependencies
- Tax calculators are standalone feature
- Can be implemented independently
- Can be used by anonymous users
- Save feature requires authentication

### Integration Points
- If client management exists, allow linking calculations to clients
- Use authentication for save/history features
- Use activity logging for calculation tracking
