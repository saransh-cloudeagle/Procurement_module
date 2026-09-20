import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, Brain, Shield, Key, ClipboardCheck, LayoutGrid, Layers,
  Wallet, Store, Folder, RefreshCw, ShoppingCart, Search, Network, BarChart3,
  Database, Settings, HelpCircle, Mail, ChevronLeft, ChevronDown, ChevronRight,
  Sparkles, AlertTriangle, Check, FileText, Scale, PenLine, X, Info, Clock,
  CheckCircle2, Circle, Upload, TrendingDown, Bell, Eye, MoreVertical, Plus,
  Filter, Share2, RotateCcw, Loader, Laptop, UserPlus, Server, Gift, Package,
  Truck, Palette, Lock, Users, ArrowRight, Grid3x3,
  SlidersHorizontal, Building2, ArrowUpRight, Trash2, Columns2, GitBranch, Library, Globe,
  GripHorizontal, CopyPlus
} from "lucide-react";

/* ---------------------------------------------------------------------------
   TOKENS
   Established CloudEagle values, reused as-is. The four marked APPROX are
   neutrals the screenshots imply but that were not handed over as named
   tokens - placeholders for engineering to normalize, not final design.
--------------------------------------------------------------------------- */
const T = {
  navy: "#181B4A", indigo: "#4B53E1", blue: "#4C5AE4", lavender: "#F4F5FA",
  periwinkle: "#7B82F0", yellowPill: "#FDF3D7", surface: "#FFFFFF",
  border: "#E4E6F0",        // APPROX - normalize
  text: "#1A1D2E",          // APPROX - normalize
  textSecondary: "#5A5F7A", // APPROX - normalize
  placeholder: "#9BA0B8",   // APPROX - normalize
  success: "#0E7C5A", warning: "#B7791F", error: "#C53030",
};

const money = (n) => "$" + Math.round(n || 0).toLocaleString();

/* ------------------------------ REFERENCE DATA ---------------------------- */

const COST_CENTRES = [
  "CC-4180 Design", "CC-2200 Engineering", "CC-3100 IT Operations",
  "CC-5000 Marketing", "CC-6100 People Ops", "CC-1000 G&A",
];


const HARDWARE_MODELS = {
  Laptop: [
    { name: 'MacBook Pro 16"', price: 2499, standard: true },
    { name: 'MacBook Air 13"', price: 1299, standard: true },
    { name: "ThinkPad X1 Carbon", price: 1899, standard: true },
    { name: "Non-standard model", price: 3400, standard: false },
  ],
  "Mobile/Phone": [
    { name: "iPhone 15", price: 899, standard: true },
    { name: "Pixel 8", price: 799, standard: true },
    { name: "Non-standard model", price: 1400, standard: false },
  ],
  Monitor: [
    { name: "Dell U2723QE 27in", price: 579, standard: true },
    { name: "LG 27UP850 27in", price: 449, standard: true },
    { name: "Non-standard model", price: 1100, standard: false },
  ],
  Peripherals: [
    { name: "Logitech MX keyboard and mouse", price: 219, standard: true },
    { name: "Non-standard model", price: 450, standard: false },
  ],
  "Office Equipment": [
    { name: "Standing desk, standard", price: 749, standard: true },
    { name: "Ergonomic chair, standard", price: 1150, standard: true },
    { name: "Non-standard model", price: 2900, standard: false },
  ],
};

const CONTRACTOR_TIERS = {
  "Engineering - Senior": 145,
  "Engineering - Mid": 110,
  "Design": 120,
  "Data and Analytics": 130,
  "Marketing": 95,
};

const OVERLAP = [
  { app: "Figma", owned: 620, inactive: 248, pct: 40, acv: 268000, renews: "06 Nov 2026", days: 60,
    youHaveAccess: false },
  { app: "Sketch", owned: 40, inactive: 31, pct: 78, acv: 14400, renews: "22 Feb 2027", days: 168,
    youHaveAccess: true },
];

/* ---------------------------------------------------------------------------
   HAND-MAINTAINED LISTS
   These three lists are hardcoded on purpose. Edit them here to change what the
   requester sees. Nothing below is derived or matched at runtime.

   Rule kept from the product: anything already in the stack (see OVERLAP) is
   never repeated here, because owning it is a different action from buying it.
--------------------------------------------------------------------------- */

const MATCH_MIN_CHARS = 8;

const PREFERRED_VENDORS = [
  { name: "Framer B.V.", app: "Framer Enterprise", status: "Preferred",
    note: "Rate negotiated Feb 2026 at $396 per seat. MSA and DPA on file." },
  { name: "Adobe", app: "Adobe Creative Cloud", status: "Approved",
    note: "Security review cleared Mar 2026. Standard paper, no negotiated rate." },
  { name: "Axure Software", app: "Axure RP", status: "Approved",
    note: "Security review cleared Nov 2025. Renewal owner is IT Operations." },
  { name: "Balsamiq", app: "Balsamiq Wireframes", status: "Approved",
    note: "Low-cost option already used by two teams on individual licences." },
  { name: "Penpot", app: "Penpot", status: "Not evaluated",
    note: "No security review or MSA. Expect a longer path if you pick this." },
];

/* Requests already moving through procurement for something similar. */
const OPEN_REQUESTS = [
  { id: "Software-505", app: "Framer Enterprise", raisedBy: "Marcus Webb", team: "Engineering",
    seats: 120, stage: "Evaluation and Benchmark", raised: "24 Aug 2026" },
];



const SOFTWARE_THRESHOLD = 200000;
const HARDWARE_FAST_TRACK = 2500;
const HARDWARE_REFRESH_YEARS = 4;
const OTHERS_ESCALATION = 5000;

/* --------------------------- CATEGORY DEFINITIONS -------------------------- */
/* Each category owns its fields and its routing rule. Adding a category means
   adding an entry here, not branching the form. */

/* What a document of each kind actually yields. Anything not listed here is
   business context no supplier document carries, so the requester still fills
   it in. Keyed by category, read at extraction time. */
const DOC_EXTRACT = {
  software: {
    file: { name: "Framer_Enterprise_Quote_Q-2026-8841.pdf", size: "412 KB" },
    fields: {
      vendor:     { value: "Framer B.V.",       src: "Quote p.1" },
      product:    { value: "Framer Enterprise", src: "Quote p.1" },
      seats:      { value: 450,                 src: "Quote p.2" },
      annual:     { value: 210150,              src: "Quote p.2" },
      termMonths: { value: 24,                  src: "Quote p.2" },
      swStart:    { value: "2026-11-01",        src: "Quote p.3" },
      billing:    { value: "Annual upfront",    src: "Quote p.3" },
      autoRenew:  { value: "Yes",               src: "Quote p.4, cl. 7.2" },
      noticeDays: { value: 60,                  src: "Quote p.4, cl. 7.3" },
    },
  },
  hardware: {
    file: { name: "Reseller_Quote_Q-88214.pdf", size: "188 KB" },
    fields: {
      deviceType: { value: "Laptop",          src: "Quote line 1" },
      model:      { value: 'MacBook Pro 16"', src: "Quote line 1" },
      qty:        { value: 1,                 src: "Quote line 1" },
    },
  },
  contingent: {
    file: { name: "SOW_DesignSystems_StaffAug.pdf", size: "240 KB" },
    fields: {
      tier:       { value: "Engineering - Senior", src: "SOW s.2" },
      startDate:  { value: "2026-10-05",           src: "SOW s.3" },
      endDate:    { value: "2027-04-02",           src: "SOW s.3" },
      hoursWeek:  { value: 40,                     src: "SOW s.4" },
      hourlyRate: { value: 160,                    src: "SOW s.5, rate card" },
    },
  },
  datacenter: {
    file: { name: "Colocation_Order_Form_2026.pdf", size: "356 KB" },
    fields: {
      providerType:  { value: "Co-location facility", src: "Order form p.1" },
      costBasis:     { value: "Monthly (MRC)",        src: "Order form p.2" },
      recurringCost: { value: 28500,                  src: "Order form p.2" },
    },
  },
  swag: {
    file: { name: "Merch_Quote_5512.pdf", size: "96 KB" },
    fields: {
      qty:      { value: 1200,         src: "Quote p.1" },
      estCost:  { value: 28800,        src: "Quote p.1" },
      deadline: { value: "2026-11-20", src: "Quote p.2, lead time" },
    },
  },
  other: {
    file: { name: "Vendor_Invoice_INV-4471.pdf", size: "96 KB" },
    fields: {
      amount: { value: 6400, src: "Invoice total" },
    },
  },
};

const CATEGORIES = {
  software: {
    label: "Software",
    icon: Layers,
    blurb: "SaaS applications, cloud tools, desktop software, renewals",
    formName: "Software Purchase Request",
    overlapCheck: true,
    amountLabel: "Annual value",
    fields: [
      { id: "doc", type: "file", group: "Start here", label: "Have a quote or order form?",
        help: "Attach it and we fill in everything we can find, or fill the form in by hand. Supported: .doc, .docx, .csv, .xls, .xlsx, .png, .jpeg, .pdf", },

      { id: "team", type: "text", group: "Request details", label: "What team or department will use this?",
        required: true, placeholder: "e.g. Product Design" },
      { id: "problem", type: "paragraph", group: "Request details", rows: 3, required: true, custom: true,
        label: "What problem does this solve?", placeholder: "What is the team trying to do that they cannot do today?" },
      { id: "costCentre", type: "select", group: "Request details", label: "Cost centre", required: true,
        options: COST_CENTRES },

      { id: "vendor", type: "text", group: "Commercial details", label: "Vendor",
        fromQuote: true, placeholder: "e.g. Framer B.V." },
      { id: "product", type: "text", group: "Commercial details", label: "Application",
        fromQuote: true, placeholder: "e.g. Framer Enterprise" },
      { id: "seats", type: "number", group: "Commercial details", label: "Number of licenses",
        fromQuote: true, suffix: "licenses" },
      { id: "annual", type: "number", group: "Commercial details", label: "Annual value",
        fromQuote: true, prefix: "$" },
      { id: "termMonths", type: "number", group: "Commercial details", label: "Contract term",
        fromQuote: true, suffix: "months" },
      { id: "swStart", type: "date", group: "Commercial details", label: "Contract start date",
        fromQuote: true },
      { id: "billing", type: "select", group: "Commercial details", label: "Billing frequency", fromQuote: true,
        options: ["Annual upfront", "Quarterly", "Monthly"] },
      { id: "autoRenew", type: "toggle", group: "Commercial details", label: "Does it auto-renew?",
        fromQuote: true, options: ["Yes", "No"] },
      { id: "noticeDays", type: "number", group: "Commercial details", label: "Notice period to cancel",
        fromQuote: true, suffix: "days" },

      { id: "pii", type: "checkbox", group: "Security and compliance", custom: true,
        label: "Will this software store, process, or access customer PII?",
        help: "Personally Identifiable Information" },
      { id: "sso", type: "checkbox", group: "Security and compliance", custom: true,
        label: "Does this need to be connected to single sign-on?" },
    ],
    amount: (v) => v.annual || 0,
  },

  hardware: {
    label: "Hardware",
    icon: Laptop,
    blurb: "Employee devices, office equipment, physical tech assets",
    formName: "Hardware and Device Request",
    amountLabel: "Total cost",
    fields: [
      { id: "doc", type: "file", group: "Start here", label: "Have a quote from your reseller?",
        help: "Attach it and we fill in everything we can find, or fill the form in by hand. Supported: .doc, .docx, .csv, .xls, .xlsx, .png, .jpeg, .pdf" },
      { id: "deviceType", type: "select", label: "Device type", required: true,
        options: Object.keys(HARDWARE_MODELS) },
      { id: "reason", type: "radio", label: "What is this for?", required: true, custom: true,
        options: ["Replacing a broken or lost device", "New hire"] },
      { id: "deviceAge", type: "number", label: "How old is the device being replaced?",
        suffix: "years", help: "Standard refresh cycle is 4 years. Leave blank for a new hire." },
      { id: "model", type: "modelSelect", label: "Model", required: true, dependsOn: "deviceType" },
      { id: "qty", type: "number", label: "Quantity", required: true, min: 1 },
    ],
    amount: (v) => {
      const list = HARDWARE_MODELS[v.deviceType] || [];
      const m = list.find((x) => x.name === v.model);
      return m ? m.price * (v.qty || 0) : 0;
    },
  },

  contingent: {
    label: "Contingent Workers",
    icon: UserPlus,
    blurb: "Contractors, freelancers, staff augmentation, agency consultants",
    formName: "Contingent Worker Request",
    amountLabel: "Estimated engagement cost",
    fields: [
      { id: "doc", type: "file", group: "Start here", label: "Have a Statement of Work or rate card?",
        help: "Attach it and we fill in everything we can find, or fill the form in by hand. Supported: .doc, .docx, .csv, .xls, .xlsx, .png, .jpeg, .pdf" },
      { id: "tier", type: "select", label: "Role and tier", required: true, custom: true,
        options: Object.keys(CONTRACTOR_TIERS) },
      { id: "startDate", type: "date", label: "Expected start date", required: true },
      { id: "endDate", type: "date", label: "Expected end date", required: true },
      { id: "hoursWeek", type: "number", label: "Estimated hours per week", required: true, suffix: "hrs" },
      { id: "hourlyRate", type: "number", label: "Hourly rate", required: true, prefix: "$" },

    ],
    amount: (v) => {
      if (!v.startDate || !v.endDate) return 0;
      const wks = Math.max(0, (new Date(v.endDate) - new Date(v.startDate)) / (1000 * 60 * 60 * 24 * 7));
      return Math.round(wks * (v.hoursWeek || 0) * (v.hourlyRate || 0));
    },
  },

  datacenter: {
    label: "Data Centers",
    icon: Server,
    blurb: "Server infrastructure, colocation, public cloud, networking leases",
    formName: "Infrastructure and Data Centre Request",
    amountLabel: "Annualized cost",
    fields: [
      { id: "doc", type: "file", group: "Start here", label: "Have an order form or colocation quote?",
        help: "Attach it and we fill in everything we can find, or fill the form in by hand. Supported: .doc, .docx, .csv, .xls, .xlsx, .png, .jpeg, .pdf" },
      { id: "providerType", type: "select", label: "Provider type", required: true,
        options: ["Public Cloud", "Co-location facility", "On-prem infrastructure"] },
      { id: "envName", type: "text", label: "Project or environment name", required: true, custom: true,
        placeholder: "e.g. Production, Staging, QA" },
      { id: "costBasis", type: "toggle", label: "Cost basis", required: true,
        options: ["Monthly (MRC)", "Annual (ARC)"] },
      { id: "recurringCost", type: "number", label: "Estimated recurring cost", required: true, prefix: "$" },
    ],
    amount: (v) => (v.costBasis === "Monthly (MRC)" ? (v.recurringCost || 0) * 12 : v.recurringCost || 0),
  },

  swag: {
    label: "Swag",
    icon: Gift,
    blurb: "Branded merchandise, apparel, promotional event items",
    formName: "Branded Merchandise Request",
    amountLabel: "Estimated total cost",
    fields: [
      { id: "doc", type: "file", group: "Start here", label: "Have a quote from the supplier?",
        help: "Attach it and we fill in everything we can find, or fill the form in by hand. Supported: .doc, .docx, .csv, .xls, .xlsx, .png, .jpeg, .pdf" },
      { id: "purpose", type: "select", label: "Purpose", required: true, custom: true,
        options: ["Internal employee gifting", "Recruiting event", "Client giveaway"] },
      { id: "qty", type: "number", label: "Total quantity needed", required: true, suffix: "units" },
      { id: "deadline", type: "date", label: "Hard deadline for delivery", required: true },
      { id: "estCost", type: "number", label: "Estimated total cost", required: true, prefix: "$" },
    ],
    amount: (v) => v.estCost || 0,
  },

  other: {
    label: "Others",
    icon: Package,
    blurb: "Office supplies, travel, training, facilities, anything else",
    formName: "General Spend Request",
    amountLabel: "Total amount",
    fields: [
      { id: "doc", type: "file", group: "Start here", label: "Have an invoice or quote?",
        help: "Attach it and we fill in everything we can find, or fill the form in by hand. Supported: .doc, .docx, .csv, .xls, .xlsx, .png, .jpeg, .pdf" },
      { id: "costCentre", type: "select", label: "Cost centre", required: true,
        options: COST_CENTRES },
      { id: "detail", type: "paragraph", label: "Detailed business justification", required: true, rows: 4, custom: true,
        placeholder: "What is this for, and why now?" },

      { id: "amount", type: "number", label: "Total amount", required: true, prefix: "$" },
    ],
    amount: (v) => v.amount || 0,
  },
};

/* ------------------------------- ROUTING ---------------------------------- */
/* Returns { workflow, steps, conditions }. Conditions render on the routed
   screen so the requester can see why they got the workflow they got. */

const approval = (name, approvers) => ({ name, type: "Approval", approvers });

function route(cat, v, amount) {
  const conditions = [];
  const steps = [];
  let workflow = "";

  if (cat === "software") {
    const pii = !!v.pii;
    const sourcing = amount > SOFTWARE_THRESHOLD;
    workflow = pii && sourcing ? "Software purchase, security review and sourcing"
      : pii ? "Software purchase, security review"
      : sourcing ? "Software purchase, competitive sourcing"
      : "Software purchase, standard approval";
    steps.push({ name: "Finalize Requirements", type: "Requirements", assignee: "PA" });
    conditions.push({
      text: "Software that handles customer PII",
      matched: pii,
      detail: pii
        ? "A Cybersecurity and Data Privacy Review is inserted before any approval can start."
        : "PII was not indicated, so no security review is required.",
    });
    if (pii) steps.push({ name: "Cybersecurity and Data Privacy Review", type: "SecurityReview", assignee: "RM" });
    conditions.push({
      text: `Annual value is greater than ${money(SOFTWARE_THRESHOLD)}`,
      matched: sourcing,
      detail: sourcing
        ? `${money(amount)} exceeds the threshold, so competitive sourcing runs before approval.`
        : `${money(amount)} is within the threshold, so no sourcing is required.`,
    });
    if (sourcing) {
      steps.push({ name: "Competitive Sourcing", type: "RFx", assignee: "AM" });
    }
    steps.push(approval("Finance and Legal Approval", [
      { label: "Finance Approval", initials: "FT", key: "finance" },
      { label: "Legal Approval", initials: "LC", key: "legal" },
    ]));
    steps.push({ name: "Contract Signature", type: "Signature", assignee: "BO" });
    steps.push({ name: "License Provisioning", type: "Provisioning", assignee: "AM" });
  }

  if (cat === "hardware") {
    const list = HARDWARE_MODELS[v.deviceType] || [];
    const m = list.find((x) => x.name === v.model);
    const isStandard = !!(m && m.standard);
    const fast = isStandard && amount < HARDWARE_FAST_TRACK;

    // Policy as a routing condition rather than a spend rule: a device at or past
    // the refresh cycle is due, so no approver is engaged. Replacing one early is
    // the exception, and only the exception gets a human.
    const replacing = v.reason === "Replacing a broken or lost device";
    const age = Number(v.deviceAge) || 0;
    const refreshDue = replacing && age >= HARDWARE_REFRESH_YEARS;
    const earlyRefresh = replacing && age > 0 && age < HARDWARE_REFRESH_YEARS;

    workflow = refreshDue ? "Hardware, refresh due, auto approved"
      : earlyRefresh ? "Hardware, early refresh exception"
      : fast ? "Hardware, rapid fulfillment"
      : "Hardware, manager and finance approval";

    steps.push({ name: "Confirm Device Request", type: "Requirements", assignee: "PA" });

    conditions.push({
      text: `Replacing a device ${HARDWARE_REFRESH_YEARS} years or older`,
      matched: refreshDue,
      detail: refreshDue
        ? `The device is ${age} years old, past the ${HARDWARE_REFRESH_YEARS} year refresh cycle. The policy is satisfied, so no approver is engaged and this goes straight to IT Asset Management.`
        : null,
    });
    conditions.push({
      text: `Replacing a device less than ${HARDWARE_REFRESH_YEARS} years old`,
      matched: earlyRefresh,
      detail: earlyRefresh
        ? `The device is ${age} years old, ${HARDWARE_REFRESH_YEARS - age} year${HARDWARE_REFRESH_YEARS - age === 1 ? "" : "s"} short of the refresh cycle. An early replacement is an exception, so it routes to the direct manager.`
        : null,
    });
    conditions.push({
      text: `Pre-approved standard model under ${money(HARDWARE_FAST_TRACK)}`,
      matched: !refreshDue && !earlyRefresh && fast,
      detail: !refreshDue && !earlyRefresh && fast
        ? `${v.model} is a company standard and the total of ${money(amount)} is under the limit. Finance approval is skipped.`
        : null,
    });

    if (earlyRefresh) {
      steps.push(approval("Exception Approval", [
        { label: "Direct Manager", initials: "DM", key: "manager" },
      ]));
    } else if (!refreshDue && !fast) {
      steps.push(approval("Manager and Finance Approval", [
        { label: "Direct Manager", initials: "DM", key: "manager" },
        { label: "Finance Approval", initials: "FT", key: "finance" },
      ]));
    }
    steps.push({ name: "IT Asset Fulfillment", type: "Fulfillment", assignee: "IT" });
  }

  if (cat === "contingent") {
    const cap = CONTRACTOR_TIERS[v.tier];
    const overCap = cap != null && (v.hourlyRate || 0) > cap;
    workflow = "Contingent worker onboarding";
    steps.push({ name: "HR and Talent Review", type: "HRReview", assignee: "HR" });
    conditions.push({
      text: "Contractor classification must be verified before anything else",
      matched: true,
      detail: "Every contingent request routes to HR and Talent Acquisition first for a W2 versus 1099 determination.",
    });
    conditions.push({
      text: `Hourly rate is above the ${v.tier || "role"} cap`,
      matched: overCap,
      detail:
        cap == null ? "Pick a role tier to compare the rate against the cap."
        : overCap ? `$${v.hourlyRate} per hour exceeds the $${cap} cap for ${v.tier}. Finance Director sign-off is added.`
        : `$${v.hourlyRate || 0} per hour is within the $${cap} cap for ${v.tier}.`,
    });
    steps.push(approval("Hiring Manager and Finance Approval", [
      { label: "Hiring Manager", initials: "DM", key: "manager" },
      { label: "Finance Approval", initials: "FT", key: "finance" },
      ...(overCap ? [{ label: "Finance Director", initials: "FD", key: "director" }] : []),
    ]));
    steps.push({ name: "SOW Signature", type: "Signature", assignee: "BO" });
    steps.push({ name: "Access Provisioning", type: "Provisioning", assignee: "AM" });
  }

  if (cat === "datacenter") {
    workflow = "Infrastructure, executive review";
    steps.push({ name: "Confirm Infrastructure Scope", type: "Requirements", assignee: "PA" });
    conditions.push({
      text: "Data centre and infrastructure spend",
      matched: true,
      detail: "Infrastructure requests skip lower-level management and route directly to the VP of Infrastructure and a Finance Director.",
    });
    steps.push(approval("Executive Approval", [
      { label: "VP of Infrastructure", initials: "VI", key: "vp" },
      { label: "Finance Director", initials: "FD", key: "director" },
    ]));
    steps.push({ name: "Contract Signature", type: "Signature", assignee: "BO" });
    steps.push({ name: "Environment Provisioning", type: "Provisioning", assignee: "AM" });
  }

  if (cat === "swag") {
    workflow = "Swag and branded merchandise";
    steps.push({ name: "Brand and Marketing Review", type: "BrandReview", assignee: "ML" });
    conditions.push({
      text: "Branded merchandise",
      matched: true,
      detail: "All swag routes to the Brand team to check artwork against current guidelines and to check whether a preferred vendor can fulfil it.",
    });
    steps.push(approval("Marketing Approval", [
      { label: "Marketing Lead", initials: "ML", key: "marketing" },
    ]));
    steps.push({ name: "Order and Delivery", type: "Fulfillment", assignee: "ML" });
  }

  if (cat === "other") {
    const big = amount >= OTHERS_ESCALATION;
    workflow = big ? "General spend, department head approval" : "General spend, manager approval";
    steps.push({ name: "Confirm Request Details", type: "Requirements", assignee: "PA" });
    conditions.push({
      text: `Total amount is under ${money(OTHERS_ESCALATION)}`,
      matched: !big,
      detail: !big ? `${money(amount)} routes to the requester's direct manager only.` : null,
    });
    conditions.push({
      text: `Total amount is ${money(OTHERS_ESCALATION)} or above`,
      matched: big,
      detail: big ? `${money(amount)} routes to the department head instead of the direct manager.` : null,
    });
    steps.push(approval(big ? "Department Head Approval" : "Manager Approval", [
      big
        ? { label: "Department Head", initials: "DH", key: "head" }
        : { label: "Direct Manager", initials: "DM", key: "manager" },
    ]));
    steps.push({ name: "Purchase and Fulfillment", type: "Fulfillment", assignee: "AM" });
  }

  return { workflow, steps: steps.map((s, i) => ({ ...s, n: i + 1 })), conditions };
}

/* ---------------------------------------------------------------------------
   REPORTING DATA
   Volumes are hardcoded. Everything shown per field is derived from the same
   CATEGORIES config the intake form renders from, so a field added to the form
   appears in reporting without anything else changing.
--------------------------------------------------------------------------- */

const REQUEST_VOLUME = {
  software: 312, hardware: 174, contingent: 61, datacenter: 28, swag: 47, other: 63,
};
const TOTAL_REQUESTS = Object.values(REQUEST_VOLUME).reduce((a, b) => a + b, 0);

// Stable pseudo-random so the same field always reports the same numbers.
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FILL_OVERRIDE = { pii: 0.94, sso: 0.71, problem: 1, costCentre: 1, team: 1, billing: 0.62, noticeDays: 0.58 };

function fieldReport(catId, f) {
  const rnd = seeded(catId + ":" + f.id);
  const total = REQUEST_VOLUME[catId];
  const fill = FILL_OVERRIDE[f.id] != null ? FILL_OVERRIDE[f.id] : f.required ? 1 : 0.45 + rnd() * 0.4;
  const responses = Math.round(total * fill);

  let summary = null;
  if (f.type === "select" || f.type === "toggle" || f.type === "radio") {
    const opts = f.options || [];
    const raw = opts.map(() => 0.15 + rnd());
    const sum = raw.reduce((a, b) => a + b, 0);
    summary = { kind: "dist", rows: opts.map((o, i) => ({ label: o, pct: Math.round((raw[i] / sum) * 100) })) };
  } else if (f.type === "checkbox") {
    const yes = Math.round(28 + rnd() * 44);
    summary = { kind: "dist", rows: [{ label: "Yes", pct: yes }, { label: "No", pct: 100 - yes }] };
  } else if (f.type === "number") {
    const base = f.id === "annual" ? 48000 : f.id === "seats" ? 40 : f.id === "hourlyRate" ? 95 : 12;
    summary = { kind: "range",
      min: Math.round(base * (0.2 + rnd() * 0.2)),
      med: Math.round(base * (0.9 + rnd() * 0.4)),
      max: Math.round(base * (3 + rnd() * 4)),
      prefix: f.prefix || "", suffix: f.suffix || "" };
  } else {
    summary = { kind: "free" };
  }
  return { responses, fill: Math.round(fill * 100), summary };
}

const THRESHOLD_RULES = [
  { rule: "Software competitive sourcing", cond: "Annual value above $200,000", cat: "Software",
    evaluated: 312, matched: 34, unchanged: 41, addedDays: 11.2 },
  { rule: "Hardware rapid fulfillment", cond: "Standard model under $2,500", cat: "Hardware",
    evaluated: 174, matched: 118, unchanged: 96, addedDays: 0 },
  { rule: "Hardware manager and finance", cond: "Anything not fast-tracked", cat: "Hardware",
    evaluated: 174, matched: 56, unchanged: 93, addedDays: 4.2 },
  { rule: "General spend escalation", cond: "Total at or above $5,000", cat: "Others",
    evaluated: 63, matched: 19, unchanged: 84, addedDays: 3.6 },
  { rule: "PII security review", cond: "Handles customer PII", cat: "Software",
    evaluated: 312, matched: 87, unchanged: 62, addedDays: 6.8 },
  { rule: "Contractor rate cap", cond: "Rate above the tier cap", cat: "Contingent",
    evaluated: 61, matched: 14, unchanged: 50, addedDays: 5.1 },
];

const RECOMMENDATIONS = [
  { tone: "warning", title: "Raise the hardware fast-track limit to $3,200",
    body: "72 hardware requests landed between $2,500 and $3,200 in the last 12 months. Every one was approved unchanged, and each waited a median of 4.2 days for a Finance decision that never altered the outcome.",
    impact: "Would fast-track 41% more hardware requests and remove about 300 approval days a year." },
  { tone: "warning", title: "Drop Legal approval on software renewals under $25,000",
    body: "98% of renewal requests below $25,000 are approved with no redlines. Legal review adds a median of 3.1 days and has changed terms twice in 12 months.",
    impact: "Would cut a median 3.1 days from 140 requests a year." },
  { tone: "info", title: "Finance Director is the slowest step in the chain",
    body: "Requests waiting on a Finance Director sit for a median of 6.4 days, against 1.8 days for every other approver. 61% of that wait falls outside the delegate window.",
    impact: "Setting a standing delegate would recover an estimated 4 days per affected request." },
  { tone: "success", title: "The $200,000 sourcing threshold is set about right",
    body: "34 software requests crossed it. Sourcing changed the awarded vendor or price on 59% of them, and the median saving was 14% against the original quote.",
    impact: "No change recommended." },
];

const SENTIMENT = {
  requester: { score: 4.2, responses: 418, rate: 61, trend: [3.6, 3.7, 3.9, 3.8, 4.0, 4.2] },
  months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  byCategory: [
    { cat: "Hardware", score: 4.6 }, { cat: "Swag", score: 4.4 }, { cat: "Software", score: 4.1 },
    { cat: "Others", score: 3.9 }, { cat: "Contingent Workers", score: 3.5 }, { cat: "Data Centers", score: 3.2 },
  ],
  verbatims: [
    { cat: "Hardware", tone: "Positive", score: 5, month: "Sep",
      text: "Laptop request took two days end to end. Did not speak to a single person." },
    { cat: "Hardware", tone: "Positive", score: 5, month: "Aug",
      text: "The standard model list made it obvious what I could just pick without a debate." },
    { cat: "Hardware", tone: "Negative", score: 2, month: "Jul",
      text: "Asked for a second monitor and it went to Finance because the total tipped over the limit." },
    { cat: "Software", tone: "Positive", score: 5, month: "Sep",
      text: "The overlap check saved us buying a second design tool. Good catch." },
    { cat: "Software", tone: "Negative", score: 2, month: "Sep",
      text: "Was told halfway through that we already owned something similar. Would rather have known on day one." },
    { cat: "Software", tone: "Negative", score: 1, month: "Aug",
      text: "Six weeks for a tool the whole team had already trialled. Sourcing added nothing we did not know." },
    { cat: "Software", tone: "Positive", score: 4, month: "Jul",
      text: "Benchmark numbers gave me something concrete to push back on the vendor with." },
    { cat: "Software", tone: "Negative", score: 3, month: "Jun",
      text: "Had to re-enter everything that was already on the quote I attached." },
    { cat: "Data Centers", tone: "Negative", score: 1, month: "Aug",
      text: "Three weeks waiting on an approver who was on leave with no cover set." },
    { cat: "Data Centers", tone: "Negative", score: 2, month: "Jun",
      text: "Had to chase the VP twice. No visibility on where it was sitting." },
    { cat: "Contingent Workers", tone: "Negative", score: 2, month: "Sep",
      text: "Classification questions came after we had already agreed a start date with the agency." },
    { cat: "Contingent Workers", tone: "Positive", score: 4, month: "Jul",
      text: "The rate cap check flagged we were 15% over before we signed anything." },
    { cat: "Swag", tone: "Positive", score: 5, month: "Aug",
      text: "Preferred vendor already had our artwork on file. Ordered in ten minutes." },
    { cat: "Swag", tone: "Negative", score: 3, month: "Jun",
      text: "There is a hard deadline field but nothing seemed to actually use it." },
    { cat: "Others", tone: "Positive", score: 4, month: "Sep",
      text: "Straightforward for a small purchase. Manager approved the same day." },
    { cat: "Others", tone: "Negative", score: 3, month: "Jul",
      text: "Not clear which cost centre to pick and there was no help text." },
  ],
};

/* ---------------------------------------------------------------------------
   ADMIN
   The ten visible rows on each table are the real ones from the product. The
   rest are generated so search, paging and the row counts behave.
--------------------------------------------------------------------------- */

/* The workflows the routing engine can produce, so a condition configured here
   points at something that actually exists. */
const WORKFLOW_TEMPLATES = [
  "Software purchase, standard approval",
  "Software purchase, security review",
  "Software purchase, competitive sourcing",
  "Software purchase, security review and sourcing",
  "Hardware, refresh due, auto approved",
  "Hardware, early refresh exception",
  "Hardware, rapid fulfillment",
  "Hardware, manager and finance approval",
  "Contingent worker onboarding",
  "Contingent worker onboarding with finance director",
  "Infrastructure, executive review",
  "Swag and branded merchandise",
  "General spend, manager approval",
  "General spend, department head approval",
];

/* Operators offered depend on the answer type of the question picked. */
const OPERATORS = {
  number:   ["is greater than", "is less than", "is equal to", "is not equal to"],
  select:   ["is", "is not", "is any of"],
  toggle:   ["is", "is not"],
  radio:    ["is", "is not"],
  modelSelect: ["is", "is not", "is any of"],
  checkbox: ["is checked", "is not checked"],
  text:     ["contains", "does not contain", "is empty"],
  paragraph:["contains", "does not contain", "is empty"],
  date:     ["is before", "is after", "is within next"],
};

const ADMIN_NAV = [
  "Integrations", "Data Settings", "CE Roles & Users", "User Defined Fields",
  "Workflow Settings", "Intake Settings", "Forms Library", "Message Templates",
  "Notification Settings", "Company Settings", "Secure Browsing Settings",
];

const ADMIN_PEOPLE = ["Harshal Patil", "Karandeep Singh", "Priyanka Matalia Jani",
  "Saransh Chauhan", "Nidhi Jain", "Vipul Bansal", "Abdul Mateen", "Joel Platini"];

/* Every intake configuration in force. These are the same conditions the routing
   engine evaluates at submit time, expressed the way an admin authors them:
   a policy statement, the rule that enforces it, and where it routes.
   Stats are how each rule has performed over the last twelve months. */
const INTAKE_CONFIGS = {
  software: {
    catId: "software", form: "Software Purchase Request", branch: "yes",
    fallback: "Software purchase, standard approval",
    conds: [
      { id: "sc1", open: true,
        policy: "Software handling customer data above $200,000 needs both a security review and a competitive bid",
        rules: [{ field: "pii", op: "is checked", value: "" },
                { field: "annual", op: "is greater than", value: "200000" }],
        template: "Software purchase, security review and sourcing",
        name: "Software purchase, security review and sourcing",
        owner: "Abdul Mateen", watchers: ["Aaron Hopkins"],
        stats: { evaluated: 312, matched: 19, unchanged: 38, days: 14.6 } },
      { id: "sc2", open: false,
        policy: "Any software touching customer PII needs a security and privacy review before approval",
        rules: [{ field: "pii", op: "is checked", value: "" }],
        template: "Software purchase, security review",
        name: "Software purchase, security review",
        owner: "Abdul Mateen", watchers: ["Rahul Mehta"],
        stats: { evaluated: 312, matched: 87, unchanged: 62, days: 6.8 } },
      { id: "sc3", open: false,
        policy: "Competitive bids are required on software above $200,000",
        rules: [{ field: "annual", op: "is greater than", value: "200000" }],
        template: "Software purchase, competitive sourcing",
        name: "Software purchase, competitive sourcing",
        owner: "Abdul Mateen", watchers: ["Aaron Hopkins"],
        stats: { evaluated: 312, matched: 34, unchanged: 41, days: 11.2 },
        verdict: { tone: "success", text: "Set about right.",
          detail: "Sourcing changed the awarded vendor or price on 59% of matches, at a median saving of 14%." } },
    ],
  },
  hardware: {
    catId: "hardware", form: "Hardware and Device Request", branch: "yes",
    fallback: "Hardware, manager and finance approval",
    conds: [
      { id: "hc0a", open: true,
        policy: "Devices at or past the 4 year refresh cycle are approved automatically",
        rules: [{ field: "reason", op: "is", value: "Replacing a broken or lost device" },
                { field: "deviceAge", op: "is greater than", value: "3" }],
        template: "Hardware, refresh due, auto approved", name: "Hardware, refresh due, auto approved",
        owner: "Karandeep Singh", watchers: [],
        stats: { evaluated: 174, matched: 63, unchanged: 100, days: 0 },
        verdict: { tone: "success", text: "Working as intended.",
          detail: "63 replacements met the refresh cycle and cleared with no approver involved, removing roughly 63 approvals a year." } },
      { id: "hc0b", open: false,
        policy: "Replacing a device before 4 years is an exception and needs manager sign-off",
        rules: [{ field: "reason", op: "is", value: "Replacing a broken or lost device" },
                { field: "deviceAge", op: "is less than", value: "4" }],
        template: "Hardware, early refresh exception", name: "Hardware, early refresh exception",
        owner: "Karandeep Singh", watchers: ["Harshal Patil"],
        stats: { evaluated: 174, matched: 22, unchanged: 55, days: 2.4 } },
      { id: "hc1", open: false,
        policy: "Standard devices under $2,500 skip Finance and go straight to IT fulfilment",
        rules: [{ field: "model", op: "is any of", value: "Company standard models" },
                { field: "qty", op: "is less than", value: "2" }],
        template: "Hardware, rapid fulfillment", name: "Hardware, rapid fulfillment",
        owner: "Karandeep Singh", watchers: [],
        stats: { evaluated: 174, matched: 118, unchanged: 96, days: 0 },
        verdict: { tone: "warning", text: "Raise the limit to $3,200.",
          detail: "72 requests landed between $2,500 and $3,200. Every one was approved unchanged after a median 4.2 day wait." } },
    ],
  },
  contingent: {
    catId: "contingent", form: "Contingent Worker Request", branch: "yes",
    fallback: "Contingent worker onboarding",
    conds: [
      { id: "cc1", open: true,
        policy: "Contractor rates above the published tier cap need Finance Director sign-off",
        rules: [{ field: "hourlyRate", op: "is greater than", value: "145" }],
        template: "Contingent worker onboarding with finance director",
        name: "Contingent worker onboarding with finance director",
        owner: "Gunjan Yadav", watchers: ["Priyanka Matalia Jani"],
        stats: { evaluated: 61, matched: 14, unchanged: 50, days: 5.1 } },
    ],
  },
  other: {
    catId: "other", form: "General Spend Request", branch: "yes",
    fallback: "General spend, manager approval",
    conds: [
      { id: "oc1", open: true,
        policy: "General spend of $5,000 or more goes to the department head rather than the line manager",
        rules: [{ field: "amount", op: "is greater than", value: "4999" }],
        template: "General spend, department head approval",
        name: "General spend, department head approval",
        owner: "Harshal Patil", watchers: [],
        stats: { evaluated: 63, matched: 19, unchanged: 84, days: 3.6 },
        verdict: { tone: "warning", text: "Approved unchanged 84% of the time.",
          detail: "Worth checking whether the threshold is too low for the value it adds." } },
    ],
  },
  datacenter: {
    catId: "datacenter", form: "Infrastructure and Data Centre Request", branch: "no",
    fallback: "Infrastructure, executive review", conds: [],
  },
  swag: {
    catId: "swag", form: "Branded Merchandise Request", branch: "no",
    fallback: "Swag and branded merchandise", conds: [],
  },
};

const SOFTWARE_INTAKE_CONFIG = INTAKE_CONFIGS.software;

const INTAKE_SEED = [
  ...Object.entries(INTAKE_CONFIGS).map(([id, c], i) => ({
    cat: CATEGORIES[id].label,
    badge: i === 0 ? "New" : undefined,
    mark: c.conds.length ? "routing" : undefined,
    config: c,
    page: "Procurement Request",
    form: c.form,
    type: c.conds.length ? "Routing" : "Standard",
    wfType: "Automated",
    wf: c.conds.length ? `${c.conds.length} condition${c.conds.length === 1 ? "" : "s"} and a default` : c.fallback,
    by: "Company", upd: "Saransh Chauhan", on: "Sep 12, 2026",
  })),

  { cat: "New Application Access Request", badge: "New", page: "Procurement Request", form: "New App Access Form",
    type: "Standard", wfType: "Automated", wf: "New Application Access", by: "Company", upd: "Harshal Patil", on: "Sep 3, 2026" },
  { cat: "FW Intake Form Updated Name", mark: "routing", page: "Procurement Request", form: "FW Intake Form",
    type: "Routing", wfType: "Automated", wf: "FleetWorthy Intake", by: "Company", upd: "Priyanka Matalia Jani", on: "Aug 28, 2026" },
  { cat: "New App Access Request 2", page: "Procurement Request", form: "(Form not Assigned)",
    type: "Standard", wfType: "Automated", wf: "Harshal App Access", by: "System", upd: "Harshal Patil", on: "Aug 19, 2026" },
  { cat: "Test Intake Forms", mark: "routing", page: "Procurement Request", form: "Demo Intake Form",
    type: "Routing", wfType: "Automated", wf: "Procurement for Demo", by: "Company", upd: "Saransh Chauhan", on: "Aug 14, 2026" },
  { cat: "Test-090", page: "Procurement Request", form: "Testform1",
    type: "Standard", wfType: "Automated", wf: "Cloudeagle", by: "Company", upd: "Karandeep Singh", on: "Jul 31, 2026" },
  { cat: "Jira Demo", page: "Procurement Request", form: "JIRA Form",
    type: "Standard", wfType: "Automated", wf: "Jira Demo", by: "Company", upd: "Nidhi Jain", on: "Jul 13, 2026" },
  { cat: "test supplier", page: "Procurement Request", form: "Renewal Form - Supplier",
    type: "Standard", wfType: "Automated", wf: "tytyyt", by: "Company", upd: "Karandeep Singh", on: "Jul 10, 2026" },
  { cat: "Testing the new feature", mark: "routing", page: "Procurement Request", form: "Testing the feature",
    type: "Routing", wfType: "Automated", wf: "hi", by: "Company", upd: "Karandeep Singh", on: "Jun 24, 2026" },
  { cat: "less than 100", mark: "tree", page: "Procurement Request", form: "Test template",
    type: "Standard", wfType: "Automated", wf: "testplate", by: "Company", upd: "Karandeep Singh", on: "Jun 9, 2026" },
  { cat: "over 300k", mark: "tree", page: "Procurement Request", form: "Test template",
    type: "Standard", wfType: "Automated", wf: "hi", by: "Company", upd: "Karandeep Singh", on: "Jun 9, 2026" },
];

const FORMS_SEED = [
  { form: "Survey Application Needs", type: "User Survey", creator: "Vipul Bansal", upd: "Harshal Patil", on: "Sep 11, 2026", q: 5 },
  { form: "Form Task Intake Form", type: "Procurement Intake", creator: "Abdul Mateen", upd: "Harshal Patil", on: "Sep 11, 2026", q: 1 },
  { form: "Request for new application", type: "Procurement Intake", creator: "Joel Platini", upd: "Harshal Patil", on: "Sep 3, 2026", q: 3 },
  { form: "FW Intake Form", type: "Procurement Intake", creator: "Harshal Patil", upd: "Harshal Patil", on: "Aug 28, 2026", q: 7 },
  { form: "Renewal Workflow Form v3", type: "Procurement Intake", creator: "Harshal Patil", upd: "Harshal Patil", on: "Aug 26, 2026", q: 6 },
  { form: "Renewal Workflow V2.0 Final", type: "Procurement Intake", creator: "Harshal Patil", upd: "Harshal Patil", on: "Aug 25, 2026", q: 5 },
  { form: "Renewal Workflow 25th Aug", type: "Procurement Intake", creator: "Harshal Patil", upd: "Harshal Patil", on: "Aug 25, 2026", q: 5 },
  { form: "Test XYZ", type: "Vendor Questionnaire", creator: "Harshal Patil", upd: "Harshal Patil", on: "Aug 24, 2026", q: 1 },
  { form: "CaptivateIQ - Renewal Workflow", type: "Procurement Intake", creator: "Harshal Patil", upd: "Harshal Patil", on: "Aug 24, 2026", q: 2 },
  { form: "Test form 009", type: "Procurement Intake", creator: "Karandeep Singh", upd: "Karandeep Singh", on: "Aug 20, 2026", q: 1 },
];

const FORM_TYPES = ["Procurement Intake", "Vendor Questionnaire", "User Survey"];

/* The forms that are actually wired into the prototype. Built lazily because
   CATEGORIES and FORM_TEMPLATES are the source of truth for the question
   counts, and the questionnaire templates are declared further down the file. */
function liveForms() {
  const intake = Object.values(CATEGORIES).map((c) => ({
    form: c.formName, type: "Procurement Intake", creator: "Saransh Chauhan",
    upd: "Saransh Chauhan", on: "Sep 12, 2026", q: c.fields.length, live: true,
  }));
  const questionnaires = Object.entries(FORM_TEMPLATES).map(([name, qs]) => ({
    form: name, type: "Vendor Questionnaire", creator: "Harshal Patil",
    upd: "Harshal Patil", on: "Sep 12, 2026", q: qs.length, live: true,
  }));
  const surveys = [{
    form: "Requester Experience Survey", type: "User Survey", creator: "Gunjan Yadav",
    upd: "Gunjan Yadav", on: "Sep 12, 2026", q: 4, live: true,
  }];
  return [...intake, ...questionnaires, ...surveys];
}

const OLDER_DATES = ["Jun 2, 2026", "May 28, 2026", "May 14, 2026", "Apr 30, 2026", "Apr 9, 2026",
  "Mar 26, 2026", "Mar 5, 2026", "Feb 18, 2026", "Feb 2, 2026", "Jan 21, 2026", "Jan 8, 2026"];

function buildIntakeRows() {
  const rows = [...INTAKE_SEED];
  const rnd = seeded("intake-settings");
  while (rows.length < 32) {
    const i = rows.length;
    const routing = rnd() > 0.7;
    rows.push({
      cat: `Intake category ${String(i + 1).padStart(2, "0")}`,
      mark: routing ? "routing" : undefined,
      page: "Procurement Request",
      form: `Form ${String(i + 1).padStart(3, "0")}`,
      type: routing ? "Routing" : "Standard",
      wfType: "Automated",
      wf: `Workflow ${String(i + 1).padStart(3, "0")}`,
      by: rnd() > 0.85 ? "System" : "Company",
      upd: ADMIN_PEOPLE[Math.floor(rnd() * ADMIN_PEOPLE.length)],
      on: OLDER_DATES[i % OLDER_DATES.length],
    });
  }
  return rows;
}

function buildFormRows() {
  const rows = [...liveForms(), ...FORMS_SEED];
  const rnd = seeded("forms-library");
  while (rows.length < 176) {
    const i = rows.length;
    const type = FORM_TYPES[Math.floor(rnd() * FORM_TYPES.length)];
    const stem = type === "Vendor Questionnaire" ? "Questionnaire"
      : type === "User Survey" ? "Survey" : "Intake form";
    rows.push({
      form: `${stem} ${String(i + 1).padStart(3, "0")}`,
      type,
      creator: ADMIN_PEOPLE[Math.floor(rnd() * ADMIN_PEOPLE.length)],
      upd: ADMIN_PEOPLE[Math.floor(rnd() * ADMIN_PEOPLE.length)],
      on: OLDER_DATES[i % OLDER_DATES.length],
      q: 1 + Math.floor(rnd() * 8),
      status: rnd() > 0.9 ? "Inactive" : "Active",
    });
  }
  return rows;
}

/* ------------------------------ PRIMITIVES -------------------------------- */

function Btn({ variant = "primary", children, onClick, disabled, size = "md", busy }) {
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const map = {
    primary: { background: T.blue, color: "#fff", border: `1px solid ${T.blue}` },
    secondary: { background: "#fff", color: T.blue, border: `1px solid ${T.blue}` },
    tertiary: { background: "transparent", color: T.blue, border: "1px solid transparent" },
    destructive: { background: "#fff", color: T.error, border: `1px solid ${T.error}` },
  };
  const off = disabled || busy;
  return (
    <button onClick={off ? undefined : onClick} disabled={off}
      className={`${pad} rounded-md font-medium inline-flex items-center gap-1.5 transition-opacity ${
        off ? "opacity-40 cursor-not-allowed" : "hover:opacity-85 cursor-pointer"}`}
      style={map[variant]}>
      {busy && <Loader size={13} className="animate-spin" />}
      {children}
    </button>
  );
}

function Pill({ children, bg, fg, dashed }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: bg, color: fg, border: dashed ? `1px dashed ${fg}` : "none" }}>
      {children}
    </span>
  );
}

function Avatar({ children }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold"
      style={{ background: T.lavender, color: T.navy, fontSize: 10 }}>{children}</span>
  );
}

function FieldLabel({ children, required, help }) {
  return (
    <div className="mb-1.5">
      <div className="text-sm font-medium" style={{ color: T.text }}>
        {children}{required && <span style={{ color: T.error }}> *</span>}
      </div>
      {help && <div className="text-xs mt-0.5" style={{ color: T.textSecondary }}>{help}</div>}
    </div>
  );
}

function Banner({ tone = "info", icon: Icon = Info, title, children, action }) {
  const tones = { info: { bg: T.lavender, bar: T.blue }, warning: { bg: T.yellowPill, bar: T.warning }, success: { bg: "#E6F4EE", bar: T.success } };
  const t = tones[tone];
  return (
    <div className="rounded-md p-3 flex gap-3" style={{ background: t.bg, borderLeft: `3px solid ${t.bar}` }}>
      <Icon size={18} style={{ color: t.bar, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        {title && <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{title}</div>}
        <div className="text-sm" style={{ color: T.textSecondary }}>{children}</div>
        {action && <div className="mt-2 flex gap-2 flex-wrap">{action}</div>}
      </div>
    </div>
  );
}

function Card({ children, pad = true, className = "" }) {
  return (
    <div className={`rounded-lg ${pad ? "p-4" : ""} ${className}`}
      style={{ background: T.surface, border: `1px solid ${T.border}` }}>{children}</div>
  );
}

function Skeleton({ w = "100%" }) {
  return <div className="h-4 rounded animate-pulse" style={{ background: T.lavender, width: w }} />;
}

function Dropdown({ value, options, onChange, placeholder, render }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-full rounded-md px-3 py-2 text-sm flex items-center justify-between cursor-pointer text-left"
        style={{ border: `1px solid ${open || value ? T.blue : T.border}`, color: value ? T.text : T.placeholder, background: "#fff" }}>
        <span className="truncate">{value ? (render ? render(value) : value) : placeholder}</span>
        <ChevronDown size={16} style={{ color: T.textSecondary, flexShrink: 0 }} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-md overflow-hidden shadow-lg max-h-60 overflow-y-auto"
          style={{ background: "#fff", border: `1px solid ${T.border}` }}>
          {options.map((o) => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:opacity-70"
              style={{ color: T.text, background: o === value ? T.lavender : "#fff" }}>
              {render ? render(o) : o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className="px-4 py-2 text-sm font-medium cursor-pointer"
          style={{ background: value === o ? T.blue : "#fff", color: value === o ? "#fff" : T.textSecondary }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Toasts({ items }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2">
      {items.map((t) => (
        <div key={t.id} className="rounded-md px-4 py-3 shadow-lg flex items-center gap-2.5 min-w-72"
          style={{ background: "#fff", border: `1px solid ${T.border}` }}>
          <CheckCircle2 size={17} style={{ color: T.success }} />
          <span className="text-sm" style={{ color: T.text }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ FIELD RENDERER ---------------------------- */

function Field({ f, v, set, onFile, onClear }) {
  const val = v[f.id];

  if (f.type === "toggle")
    return <Toggle value={val} options={f.options} onChange={(x) => set({ [f.id]: x })} />;

  if (f.type === "select")
    return <div className="w-96"><Dropdown value={val} options={f.options} placeholder="Select an option" onChange={(x) => set({ [f.id]: x })} /></div>;

  if (f.type === "modelSelect") {
    const list = HARDWARE_MODELS[v[f.dependsOn]] || [];
    if (!list.length)
      return <div className="text-sm" style={{ color: T.placeholder }}>Pick a device type first.</div>;
    return (
      <div className="space-y-1.5">
        {list.map((m) => {
          const picked = val === m.name;
          return (
            <div key={m.name} onClick={() => set({ [f.id]: m.name })}
              className="rounded-md px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:opacity-80"               style={{ width: 512, maxWidth: "100%", border: `1px solid ${picked ? T.blue : T.border}`, background: picked ? T.lavender : "#fff" }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${picked ? T.blue : T.border}` }}>
                {picked && <div className="w-2 h-2 rounded-full" style={{ background: T.blue }} />}
              </div>
              <div className="flex-1 text-sm font-medium" style={{ color: T.text }}>{m.name}</div>
              {m.standard
                ? <Pill bg="#E6F4EE" fg={T.success}>Company standard</Pill>
                : <Pill bg={T.yellowPill} fg={T.warning}>Non-standard</Pill>}
              <span className="text-sm w-20 text-right" style={{ color: T.text }}>{money(m.price)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (f.type === "radio")
    return (
      <div className="space-y-1.5">
        {f.options.map((o) => {
          const picked = val === o;
          return (
            <div key={o} onClick={() => set({ [f.id]: o })}
              className="rounded-md px-3 py-2 flex items-center gap-3 cursor-pointer hover:opacity-80 w-96 max-w-full"
              style={{ border: `1px solid ${picked ? T.blue : T.border}`, background: picked ? T.lavender : "#fff" }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${picked ? T.blue : T.border}` }}>
                {picked && <div className="w-2 h-2 rounded-full" style={{ background: T.blue }} />}
              </div>
              <span className="text-sm" style={{ color: T.text }}>{o}</span>
            </div>
          );
        })}
      </div>
    );

  if (f.type === "checkbox")
    return (
      <div onClick={() => set({ [f.id]: !val })}
        className="rounded-md px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:opacity-80"         style={{ width: 512, maxWidth: "100%", border: `1px solid ${val ? T.blue : T.border}`, background: val ? T.lavender : "#fff" }}>
        <div className="w-4 h-4 rounded flex items-center justify-center"
          style={{ border: `1px solid ${val ? T.blue : T.border}`, background: val ? T.blue : "#fff" }}>
          {val && <Check size={11} color="#fff" />}
        </div>
        <span className="text-sm" style={{ color: T.text }}>Yes</span>
      </div>
    );

  if (f.type === "text")
    return (
      <input value={val || ""} placeholder={f.placeholder || "your answer"}
        onChange={(e) => set({ [f.id]: e.target.value })}
        className="w-96 max-w-full rounded-md px-3 py-2 text-sm outline-none"
        style={{ border: `1px solid ${val ? T.blue : T.border}`, color: T.text }} />
    );

  if (f.type === "paragraph")
    return (
      <textarea rows={f.rows || 3} value={val || ""} placeholder={f.placeholder || "your answer"}
        onChange={(e) => set({ [f.id]: e.target.value })}
        className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none"
        style={{ border: `1px solid ${val ? T.blue : T.border}`, color: T.text }} />
    );

  if (f.type === "number")
    return (
      <span className="inline-flex items-center gap-1.5">
        {f.prefix && <span className="text-sm" style={{ color: T.textSecondary }}>{f.prefix}</span>}
        <input value={val || ""} placeholder="0"
          onChange={(e) => set({ [f.id]: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
          className="w-32 rounded-md px-3 py-2 text-sm outline-none"
          style={{ border: `1px solid ${val ? T.blue : T.border}`, color: T.text }} />
        {f.suffix && <span className="text-sm" style={{ color: T.textSecondary }}>{f.suffix}</span>}
      </span>
    );

  if (f.type === "date")
    return (
      <input type="date" value={val || ""} onChange={(e) => set({ [f.id]: e.target.value })}
        className="rounded-md px-3 py-2 text-sm outline-none"
        style={{ border: `1px solid ${val ? T.blue : T.border}`, color: val ? T.text : T.placeholder }} />
    );

  if (f.type === "file")
    return val ? (
      <div className="rounded-md px-3 py-2.5 flex items-center gap-3"         style={{ width: 512, maxWidth: "100%", border: `1px solid ${T.border}`, background: T.lavender }}>
        <FileText size={18} style={{ color: T.blue }} />
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: T.text }}>{(DOC_EXTRACT[v.category] || {}).file?.name}</div>
          <div className="text-xs" style={{ color: T.textSecondary }}>{(DOC_EXTRACT[v.category] || {}).file?.size}</div>
        </div>
        {v.extractPhase === "done"
          ? <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Read</Pill>
          : v.extractPhase === "idle"
          ? <Pill bg={T.lavender} fg={T.textSecondary}>Attached</Pill>
          : <Pill bg={T.yellowPill} fg={T.warning}><Sparkles size={11} /> Reading</Pill>}
        {onClear && (
          <button onClick={() => onClear(f)} className="cursor-pointer" title="Remove file">
            <X size={15} style={{ color: T.textSecondary }} />
          </button>
        )}
      </div>
    ) : (
      <button onClick={() => onFile(f)}
        className="rounded-md py-6 flex flex-col items-center gap-2 cursor-pointer hover:opacity-80"         style={{ width: 512, maxWidth: "100%", border: `1px dashed ${T.blue}`, background: T.lavender }}>
        <Upload size={22} style={{ color: T.blue }} />
        <span className="text-sm font-medium" style={{ color: T.blue }}>Choose a file</span>
      </button>
    );

  return null;
}

/* ------------------------------ INTAKE DRAWER ----------------------------- */

function CategoryPicker({ value, onChange }) {
  const cat = value ? CATEGORIES[value] : null;
  const Icon = cat ? cat.icon : null;
  const byLabel = (label) =>
    Object.keys(CATEGORIES).find((k) => CATEGORIES[k].label === label);
  return (
    <div className="w-96 max-w-full">
      <Dropdown
        value={cat ? cat.label : ""}
        options={Object.values(CATEGORIES).map((c) => c.label)}
        placeholder="Select a category"
        onChange={(label) => onChange(byLabel(label))}
      />
      {cat && (
        <div className="mt-2">
          <div className="flex items-start gap-2">
            <Icon size={14} style={{ color: T.textSecondary, flexShrink: 0, marginTop: 2 }} />
            <span className="text-xs" style={{ color: T.textSecondary }}>{cat.blurb}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <FileText size={13} style={{ color: T.blue, flexShrink: 0 }} />
            <span className="text-xs" style={{ color: T.blue }}>{cat.formName}</span>
            <span className="text-xs" style={{ color: T.textSecondary }}>
              &middot; {cat.fields.length} questions
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Everything we can tell the requester before they go any further: what the
   company already owns, what is already in flight, and who is already approved. */
function MatchesBlock({ w, set, setField, onDeflect, onJoin, toast }) {
  if (w.matchPhase === "searching")
    return (
      <div className="mt-5">
        <Banner tone="info" icon={Search} title="Checking your stack">
          <div className="space-y-2 mt-1"><Skeleton w="50%" /><Skeleton w="35%" /></div>
        </Banner>
      </div>
    );
  if (w.matchPhase !== "done") return null;

  const usePreferred = (p) => {
    set({
      vendor: p.name, product: p.app,
      sources: { ...(w.sources || {}), vendor: "preferred", product: "preferred" },
    });
    toast(`${p.name} selected from preferred vendors`);
  };

  return (
    <div className="mt-5 space-y-4">
      {/* already owned */}
      <Card>
        <div className="flex items-start justify-between mb-1">
          <div className="text-base font-semibold" style={{ color: T.text }}>
            You already own tools that may cover this
          </div>
          <Pill bg={T.yellowPill} fg={T.warning}>2 matches</Pill>
        </div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          Getting a seat on something you already pay for is faster than buying, and costs nothing extra.
        </div>
        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="grid px-3 py-2 text-xs font-semibold"
            style={{ background: T.lavender, color: T.navy, gridTemplateColumns: "1.1fr .8fr 1.2fr 1.1fr 1.5fr" }}>
            <div>Application</div><div>Licenses</div><div>Inactive 30 days</div><div>Renews</div><div>Your access</div>
          </div>
          {OVERLAP.map((o, i) => (
            <div key={o.app} className="grid px-3 py-2.5 text-sm items-center"
              style={{ borderTop: i ? `1px solid ${T.border}` : "none",
                       gridTemplateColumns: "1.1fr .8fr 1.2fr 1.1fr 1.5fr", color: T.text }}>
              <div className="font-medium">{o.app}</div>
              <div>{o.owned}</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: T.error }}>{o.inactive}</span>
                <span style={{ color: T.textSecondary }}>({o.pct}%)</span>
              </div>
              <div>
                <div>{o.renews}</div>
                <div className="text-xs" style={{ color: T.textSecondary }}>in {o.days} days</div>
              </div>
              <div>
                {o.youHaveAccess ? (
                  <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> You have a seat</Pill>
                ) : (
                  <Btn variant="primary" size="sm" onClick={onDeflect}>Request access instead</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Banner tone="warning" icon={AlertTriangle}>
            Figma has {OVERLAP[0].inactive} seats unused for 30 days and renews in {OVERLAP[0].days} days.
            Reclaiming them would cut roughly {money((OVERLAP[0].acv / OVERLAP[0].owned) * OVERLAP[0].inactive)} a year.
          </Banner>
        </div>
      </Card>

      {/* already in flight */}
      <Card>
        <div className="text-base font-semibold mb-1" style={{ color: T.text }}>
          Someone has already asked for this
        </div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          Joining an open request usually gets you there sooner, and buying together gets a better rate.
        </div>
        {OPEN_REQUESTS.map((r) => (
          <div key={r.id} className="rounded-md px-3 py-3" style={{ border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-3 mb-2">
              <FileText size={17} style={{ color: T.blue }} />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: T.text }}>{r.id} &middot; {r.app}</div>
                <div className="text-xs" style={{ color: T.textSecondary }}>
                  {r.raisedBy}, {r.team} &middot; {r.seats} licenses &middot; raised {r.raised}
                </div>
              </div>
              <Pill bg={T.yellowPill} fg={T.warning}><Clock size={11} /> {r.stage}</Pill>
            </div>
            <div className="flex gap-2">
              <Btn variant="primary" size="sm" onClick={() => onJoin(r)}>Join this request</Btn>
              <Btn variant="secondary" size="sm">View request</Btn>
            </div>
          </div>
        ))}
      </Card>

      {/* preferred vendors */}
      <Card>
        <div className="text-base font-semibold mb-1" style={{ color: T.text }}>
          Preferred vendors for this need
        </div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          Matched to what you described. Picking one of these fills in the vendor and application below.
        </div>
        <div className="space-y-2">
          {PREFERRED_VENDORS.map((p) => {
            const picked = w.vendor === p.name;
            return (
              <div key={p.name} className="rounded-md px-3 py-2.5 flex items-center gap-3"
                style={{ border: `1px solid ${picked ? T.blue : T.border}`, background: picked ? T.lavender : "#fff" }}>
                <Avatar>{p.name[0]}</Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: T.text }}>{p.app}</span>
                    {p.status === "Preferred" && <Pill bg="#E6F4EE" fg={T.success}>Preferred</Pill>}
                    {p.status === "Approved" && <Pill bg={T.lavender} fg={T.blue}>Approved</Pill>}
                    {p.status === "Not evaluated" && <Pill bg={T.yellowPill} fg={T.warning}>Not evaluated</Pill>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: T.textSecondary }}>{p.note}</div>
                </div>
                {picked
                  ? <Pill bg={T.blue} fg="#fff"><Check size={11} /> Selected</Pill>
                  : <Btn variant="secondary" size="sm" onClick={() => usePreferred(p)}>Use this vendor</Btn>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* the ask */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>Why do none of these work for you?</FieldLabel>
          <Btn variant="tertiary" size="sm"
            onClick={() => set({ justification: "Figma covers UI design but not production-grade interactive prototyping with real data. Marcus's request is scoped to Engineering only at 120 seats and does not cover the design org. The design system team has run Framer in a 12-person pilot since March." })}>
            Fill sample answer
          </Btn>
        </div>
        <textarea rows={3} value={w.justification} placeholder="your answer"
          onChange={(e) => set({ justification: e.target.value })}
          className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none"
          style={{ border: `1px solid ${w.justification ? T.blue : T.border}`, color: T.text }} />
      </div>
    </div>
  );
}

function IntakeDrawer({ w, set, onClose, onSubmit, onDeflect, onJoin, toast }) {
  const cat = w.category ? CATEGORIES[w.category] : null;
  const amount = cat ? cat.amount(w) : 0;

  // Overlap fires as soon as we know what is being asked for, whether that came
  // from the quote or was typed in by hand.

  const quoteFilled = Object.keys(w.sources || {}).filter((k) => w.sources[k] === "quote").length;

  const missing = (() => {
    if (!cat) return "Pick a category";
    for (const f of cat.fields) {
      if (!f.required) continue;
      const val = w[f.id];
      if (val === undefined || val === "" || val === null || val === 0) return `Fill in "${f.label}"`;
    }
    return null;
  })();

  // Marks a field as edited once the requester overrides something the quote supplied.
  const setField = (patch) => {
    const id = Object.keys(patch)[0];
    const next = { ...patch };
    if ((w.sources || {})[id] === "quote") next.sources = { ...w.sources, [id]: "edited" };
    set(next);
  };

  const doc = DOC_EXTRACT[w.category];

  const attach = (f) => {
    set({ [f.id]: true, extractPhase: "reading" });
    setTimeout(() => {
      const vals = {};
      const srcs = { ...(w.sources || {}) };
      Object.entries(doc.fields).forEach(([id, d]) => { vals[id] = d.value; srcs[id] = "quote"; });
      set({ ...vals, sources: srcs, extractPhase: "done" });
      const n = Object.keys(doc.fields).length;
      toast(`${n} field${n === 1 ? "" : "s"} filled from your document`);
    }, 1800);
  };

  // Removing the quote clears everything it supplied, so the manual path can be
  // demonstrated without resetting the whole request.
  const clearFile = (f) => {
    const cleared = {};
    const srcs = { ...(w.sources || {}) };
    Object.entries(doc.fields).forEach(([id, d]) => {
      if (srcs[id] === "quote") {
        cleared[id] = typeof d.value === "number" ? 0 : "";
        delete srcs[id];
      }
    });
    set({ ...cleared, [f.id]: false, sources: srcs, extractPhase: "idle" });
    toast("Document removed");
  };

  // The matches search keys off the problem description, so it fires whether the
  // requester typed the form by hand or attached a quote first.
  // The timer lives in a ref: setting matchPhase re-runs this effect, and a
  // cleanup that cleared the timeout would cancel the search before it landed.
  const matchTimer = useRef(null);
  useEffect(() => {
    if (!cat || !cat.overlapCheck) return;
    const typed = (w.problem || "").trim().length >= MATCH_MIN_CHARS;
    if (typed && w.matchPhase === "idle") {
      set({ matchPhase: "searching" });
      clearTimeout(matchTimer.current);
      matchTimer.current = setTimeout(() => set({ matchPhase: "done" }), 900);
    } else if (!typed && w.matchPhase !== "idle") {
      clearTimeout(matchTimer.current);
      set({ matchPhase: "idle" });
    }
  }, [w.problem, w.matchPhase, w.category]);

  useEffect(() => () => clearTimeout(matchTimer.current), []);

  const groups = cat
    ? cat.fields.reduce((acc, f) => {
        const g = f.group || "";
        const found = acc.find((x) => x.name === g);
        if (found) found.fields.push(f);
        else acc.push({ name: g, fields: [f] });
        return acc;
      }, [])
    : [];

  return (
    <div className="fixed inset-y-0 right-0 overflow-y-auto shadow-2xl z-40"
      style={{ background: "#fff", width: "66%", maxWidth: "100vw" }}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: T.text }}>Raise a Request</h2>
            <div className="text-sm mt-1" style={{ color: T.textSecondary }}>
              One place for every kind of spend. The form and the approval path change with the category.
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer"><X size={20} style={{ color: T.textSecondary }} /></button>
        </div>

        <div className="mb-6">
          <FieldLabel required>What are you requesting?</FieldLabel>
          <CategoryPicker value={w.category}
            onChange={(c) => set({ category: c, sources: {}, extractPhase: "idle", matchPhase: "idle", doc: false })} />
        </div>

        {!cat && (
          <div className="rounded-md p-8 text-center" style={{ border: `1px dashed ${T.border}` }}>
            <div className="text-sm" style={{ color: T.textSecondary }}>Pick a category to see the form.</div>
          </div>
        )}

        {cat && (
          <div className="space-y-7">
            {groups.map((g) => (
              <div key={g.name}>
                {g.name && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-sm font-semibold whitespace-nowrap" style={{ color: T.text }}>{g.name}</div>
                    <div className="flex-1 h-px" style={{ background: T.border }} />
                    {g.name === "Commercial details" && quoteFilled > 0 && (
                      <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> {quoteFilled} filled from quote</Pill>
                    )}
                  </div>
                )}
                <div className="space-y-5">
                  {g.fields.map((f) => {
                    const srcState = (w.sources || {})[f.id];
                    return (
                      <div key={f.id}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="text-sm font-medium" style={{ color: T.text }}>
                            {f.label}{f.required && <span style={{ color: T.error }}> *</span>}
                          </div>
                          {srcState === "quote" && doc && doc.fields[f.id] && (
                            <Pill bg={T.lavender} fg={T.blue}>{doc.fields[f.id].src}</Pill>
                          )}
                          {srcState === "edited" && <Pill bg={T.yellowPill} fg={T.warning}>Edited</Pill>}
                          {srcState === "preferred" && <Pill bg="#E6F4EE" fg={T.success}>From preferred vendors</Pill>}
                          {srcState === "research" && <Pill bg="#E6F4EE" fg={T.success}>From vendor research</Pill>}
                        </div>
                        {f.help && <div className="text-xs mb-1.5" style={{ color: T.textSecondary }}>{f.help}</div>}
                        <Field f={f} v={w} set={setField} onFile={attach} onClear={clearFile} />
                        {f.id === "annual" && w.seats > 0 && w.annual > 0 && (
                          <div className="text-xs mt-1.5" style={{ color: T.textSecondary }}>
                            ${Math.round(w.annual / w.seats)} per license
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {g.name === "Request details" && cat.overlapCheck && (
                  <MatchesBlock w={w} set={set} setField={setField}
                    onDeflect={onDeflect} onJoin={onJoin} toast={toast} />
                )}
              </div>
            ))}
          </div>
        )}

        {w.extractPhase === "done" && doc && (
          <div className="mt-5">
            <Banner tone="success" icon={Sparkles}
              title={`${Object.keys(doc.fields).length} fields filled from ${doc.file.name}`}>
              {(() => {
                const got = Object.keys(doc.fields);
                const rest = cat.fields.filter((f) => f.type !== "file" && !got.includes(f.id));
                return rest.length
                  ? `Everything else is business context the document does not carry: ${rest
                      .map((f) => f.label.replace(/\?$/, "").toLowerCase()).join(", ")}.`
                  : "Check each value before submitting.";
              })()}
            </Banner>
          </div>
        )}

        {w.extractPhase === "reading" && (
          <div className="mt-5">
            <Banner tone="info" icon={Sparkles} title="Reading your document">
              <div className="space-y-2 mt-1">
                <Skeleton w="55%" /><Skeleton w="40%" />
              </div>
            </Banner>
          </div>
        )}

      </div>

      <div className="sticky bottom-0 px-6 py-3 flex items-center justify-between"
        style={{ background: "#fff", borderTop: `1px solid ${T.border}` }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <div className="flex items-center gap-3">
          {missing && <span className="text-xs" style={{ color: T.textSecondary }}>{missing}</span>}
          <Btn variant="primary" onClick={onSubmit} disabled={!!missing} busy={w.submitting}>
            {w.submitting ? "Checking conditions" : "Submit request"}
          </Btn>
        </div>
      </div>
    </div>
  );
}



/* -------------------------------- CHROME ---------------------------------- */

const NAV = [
  { kind: "item", icon: LayoutDashboard, label: "Dashboard" },
  { kind: "group", label: "AI GOVERNANCE" },
  { kind: "item", icon: Brain, label: "AI Usage Control", caret: true },
  { kind: "item", icon: Shield, label: "Secure Browsing", caret: true },
  { kind: "item", icon: Key, label: "NHI Management" },
  { kind: "group", label: "RISKY APPS & RISKY USERS" },
  { kind: "item", icon: Key, label: "Access Management", caret: true },
  { kind: "item", icon: ClipboardCheck, label: "User Access Reviews", caret: true },
  { kind: "item", icon: LayoutGrid, label: "Employee App Catalog", caret: true },
  { kind: "group", label: "LICENSE MANAGEMENT" },
  { kind: "item", icon: Layers, label: "Application", caret: true },
  { kind: "item", icon: Wallet, label: "Vendor Spend", caret: true },
  { kind: "item", icon: Store, label: "Reseller" },
  { kind: "item", icon: Folder, label: "Documents", caret: true },
  { kind: "group", label: "PROCUREMENT" },
  { kind: "item", icon: RefreshCw, label: "Renewal", caret: true },
  { kind: "item", icon: ShoppingCart, label: "Procurement", caret: true, nav: "procurement" },
  { kind: "item", icon: Search, label: "Vendor Research", nav: "research" },
  { kind: "item", icon: Network, label: "SaaS Directory" },
  { kind: "group", label: "UTILITIES & ADMIN" },
  { kind: "item", icon: BarChart3, label: "Reports" },
  { kind: "item", icon: Database, label: "External Data", caret: true },
  { kind: "item", icon: Settings, label: "Admin", nav: "admin" },
];

function Sidebar({ module, onNav }) {
  return (
    <div className="w-60 flex-shrink-0 overflow-y-auto" style={{ background: T.navy }}>
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: T.periwinkle }}>
            <Circle size={10} fill="#fff" color="#fff" />
          </div>
          <span className="text-white font-semibold text-base">cloudeagle</span>
        </div>
        <Settings size={15} style={{ color: T.periwinkle }} />
      </div>
      <div className="pb-6">
        {NAV.map((n, i) =>
          n.kind === "group" ? (
            <div key={i} className="px-5 pt-4 pb-1.5 tracking-wide font-semibold" style={{ color: "#7E83A8", fontSize: 10 }}>{n.label}</div>
          ) : (
            <div key={i}
              onClick={n.nav ? () => onNav(n.nav) : undefined}
              className={`mx-2 px-3 py-2 rounded-md flex items-center gap-2.5 text-sm ${n.nav ? "cursor-pointer" : ""}`}
              style={{ background: n.nav === module ? T.indigo : "transparent",
                       color: n.nav === module ? "#fff" : "#C9CCE2" }}>
              <n.icon size={15} style={{ flexShrink: 0 }} />
              <span className="flex-1 truncate">{n.label}</span>
              {n.caret && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
            </div>
          )
        )}
        {[[HelpCircle, "Help Center"], [Mail, "Contact Us"], [ChevronLeft, "Collapse"]].map(([Ic, l], i) => (
          <div key={l} className={`mx-2 px-3 py-2 flex items-center gap-2.5 text-sm ${i === 0 ? "mt-4" : ""}`} style={{ color: "#C9CCE2" }}>
            <Ic size={15} /> {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="h-14 flex-shrink-0 flex items-center gap-4 px-6" style={{ background: "#fff", borderBottom: `1px solid ${T.border}` }}>
      <span className="font-semibold text-lg" style={{ color: T.periwinkle }}>cloudeagle.ai</span>
      <div className="flex-1" />
      <div className="w-72 rounded-md px-3 py-1.5 flex items-center gap-2" style={{ border: `1px solid ${T.border}` }}>
        <span className="text-sm flex-1" style={{ color: T.placeholder }}>Search here...</span>
        <Search size={15} style={{ color: T.textSecondary }} />
      </div>
      <div className="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium text-white" style={{ background: T.indigo }}>
        <Circle size={12} fill="#fff" color="#fff" /> EagleEye
      </div>
      <Bell size={18} style={{ color: T.textSecondary }} />
      <div className="flex items-center gap-2">
        <Avatar>PA</Avatar>
        <span className="text-sm" style={{ color: T.text }}>Priya Anand</span>
        <ChevronDown size={14} style={{ color: T.textSecondary }} />
      </div>
    </div>
  );
}

/* ------------------------------- REPORTING -------------------------------- */

function Bar({ pct, tone }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: T.lavender }}>
      <div style={{ width: pct + "%", background: tone || T.blue, height: "100%" }} />
    </div>
  );
}

function FormResponsesReport() {
  const [catFilter, setCatFilter] = useState("All categories");
  const [kind, setKind] = useState("All");
  const [q, setQ] = useState("");

  const rows = [];
  Object.entries(CATEGORIES).forEach(([id, c]) => {
    c.fields.forEach((f) => {
      if (f.type === "file") return;
      rows.push({ catId: id, cat: c.label, f, ...fieldReport(id, f) });
    });
  });

  const shown = rows.filter((r) => {
    if (catFilter !== "All categories" && r.cat !== catFilter) return false;
    if (kind === "Delivered" && r.f.custom) return false;
    if (kind === "Custom" && !r.f.custom) return false;
    if (q && !r.f.label.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const customCount = rows.filter((r) => r.f.custom).length;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="text-base font-semibold" style={{ color: T.text }}>Answers by field</div>
          <div className="flex-1" />
          <div className="w-52">
            <Dropdown value={catFilter}
              options={["All categories", ...Object.values(CATEGORIES).map((c) => c.label)]}
              onChange={setCatFilter} />
          </div>
          <div className="inline-flex rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            {["All", "Delivered", "Custom"].map((k) => (
              <button key={k} onClick={() => setKind(k)} className="px-3 py-2 text-xs font-medium cursor-pointer"
                style={{ background: kind === k ? T.blue : "#fff", color: kind === k ? "#fff" : T.textSecondary }}>
                {k}
              </button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fields"
            className="rounded-md px-3 py-2 text-sm outline-none w-48"
            style={{ border: `1px solid ${T.border}`, color: T.text }} />
          <Btn variant="secondary" size="sm">Export CSV</Btn>
        </div>

        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="grid px-3 py-2 text-xs font-semibold"
            style={{ background: T.lavender, color: T.navy, gridTemplateColumns: "2fr 1.1fr .9fr .9fr 2.2fr" }}>
            <div>Question</div><div>Category</div><div>Source</div><div>Answered</div><div>Answers</div>
          </div>
          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            {shown.map((r) => (
              <div key={r.catId + r.f.id} className="grid px-3 py-2.5 text-sm items-center"
                style={{ borderTop: `1px solid ${T.border}`, gridTemplateColumns: "2fr 1.1fr .9fr .9fr 2.2fr" }}>
                <div className="pr-3" style={{ color: T.text }}>{r.f.label}</div>
                <div style={{ color: T.textSecondary }}>{r.cat}</div>
                <div>
                  {r.f.custom
                    ? <Pill bg={T.lavender} fg={T.blue}>Custom</Pill>
                    : <Pill bg={T.lavender} fg={T.textSecondary}>Delivered</Pill>}
                </div>
                <div>
                  <div style={{ color: T.text }}>{r.responses}</div>
                  <div className="text-xs" style={{ color: T.textSecondary }}>{r.fill}%</div>
                </div>
                <div className="pr-2">
                  {r.summary.kind === "dist" && (
                    <div className="space-y-1">
                      {r.summary.rows.slice(0, 3).map((d) => (
                        <div key={d.label} className="flex items-center gap-2">
                          <span className="text-xs truncate" style={{ color: T.textSecondary, width: 104 }}>{d.label}</span>
                          <Bar pct={d.pct} />
                          <span className="text-xs w-8 text-right" style={{ color: T.text }}>{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.summary.kind === "range" && (
                    <span className="text-xs" style={{ color: T.textSecondary }}>
                      min {r.summary.prefix}{r.summary.min.toLocaleString()} &middot;{" "}
                      median <strong style={{ color: T.text }}>{r.summary.prefix}{r.summary.med.toLocaleString()}</strong> &middot;{" "}
                      max {r.summary.prefix}{r.summary.max.toLocaleString()} {r.summary.suffix}
                    </span>
                  )}
                  {r.summary.kind === "free" && (
                    <span className="text-xs" style={{ color: T.blue }}>Read {r.responses} written answers</span>
                  )}
                </div>
              </div>
            ))}
            {!shown.length && (
              <div className="px-3 py-8 text-center text-sm" style={{ color: T.textSecondary }}>
                No fields match that filter.
              </div>
            )}
          </div>
        </div>
        <div className="text-xs mt-3" style={{ color: T.textSecondary }}>
          Every question on every intake form appears here, whether it shipped with CloudEagle or
          your team added it. Adding a question to a form adds it to this table.
        </div>
      </Card>
    </div>
  );
}

function ThresholdReport({ toast }) {
  const [applied, setApplied] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-base font-semibold mb-1" style={{ color: T.text }}>How each rule is performing</div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          A rule that almost never changes the outcome is costing time without reducing risk.
        </div>
        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="grid px-3 py-2 text-xs font-semibold"
            style={{ background: T.lavender, color: T.navy, gridTemplateColumns: "1.7fr 1.6fr .8fr .8fr 1.4fr 1fr" }}>
            <div>Rule</div><div>Condition</div><div>Evaluated</div><div>Matched</div>
            <div>Approved unchanged</div><div>Days added</div>
          </div>
          {THRESHOLD_RULES.map((r, i) => (
            <div key={r.rule} className="grid px-3 py-2.5 text-sm items-center"
              style={{ borderTop: i ? `1px solid ${T.border}` : "none",
                       gridTemplateColumns: "1.7fr 1.6fr .8fr .8fr 1.4fr 1fr" }}>
              <div className="font-medium pr-2" style={{ color: T.text }}>{r.rule}</div>
              <div className="pr-2" style={{ color: T.textSecondary }}>{r.cond}</div>
              <div style={{ color: T.text }}>{r.evaluated}</div>
              <div style={{ color: T.text }}>{r.matched}</div>
              <div className="flex items-center gap-2 pr-3">
                <Bar pct={r.unchanged} tone={r.unchanged >= 90 ? T.warning : T.blue} />
                <span className="text-xs w-8 text-right" style={{ color: r.unchanged >= 90 ? T.warning : T.text }}>
                  {r.unchanged}%
                </span>
              </div>
              <div style={{ color: r.addedDays >= 5 ? T.warning : T.text }}>
                {r.addedDays ? r.addedDays + " days" : "None"}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="text-base font-semibold" style={{ color: T.text }}>What we would change</div>
        {RECOMMENDATIONS.map((r) => {
          const isApplied = applied.includes(r.title);
          const isDismissed = dismissed.includes(r.title);
          if (isDismissed) return null;
          return (
            <Card key={r.title}>
              <div className="flex items-start gap-3">
                {r.tone === "success"
                  ? <CheckCircle2 size={18} style={{ color: T.success, flexShrink: 0, marginTop: 2 }} />
                  : <AlertTriangle size={18} style={{ color: r.tone === "warning" ? T.warning : T.blue, flexShrink: 0, marginTop: 2 }} />}
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{r.title}</div>
                  <div className="text-sm mb-2" style={{ color: T.textSecondary }}>{r.body}</div>
                  <div className="text-sm" style={{ color: T.text }}>{r.impact}</div>
                  {r.tone !== "success" && (
                    <div className="mt-3 flex gap-2">
                      {isApplied ? (
                        <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Applied to the rule</Pill>
                      ) : (
                        <>
                          <Btn variant="primary" size="sm"
                            onClick={() => { setApplied([...applied, r.title]); toast("Rule updated"); }}>
                            Apply this change
                          </Btn>
                          <Btn variant="secondary" size="sm"
                            onClick={() => setDismissed([...dismissed, r.title])}>Dismiss</Btn>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function VerbatimsTable() {
  const [groupBy, setGroupBy] = useState("Category");
  const [tone, setTone] = useState("All");
  const [cat, setCat] = useState("All categories");
  const [q, setQ] = useState("");

  const shown = SENTIMENT.verbatims.filter((v) => {
    if (tone !== "All" && v.tone !== tone) return false;
    if (cat !== "All categories" && v.cat !== cat) return false;
    if (q && !v.text.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const keyOf = (v) => (groupBy === "Category" ? v.cat : groupBy === "Sentiment" ? v.tone : v.month);
  const order = groupBy === "Month" ? SENTIMENT.months : null;
  let keys = [...new Set(shown.map(keyOf))];
  keys = order ? keys.sort((a, b) => order.indexOf(a) - order.indexOf(b)) : keys.sort();

  const cols = "3fr 1.2fr .7fr 1fr .7fr";

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="text-base font-semibold" style={{ color: T.text }}>What people wrote</div>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: T.textSecondary }}>Group by</span>
        <div className="inline-flex rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          {["Category", "Sentiment", "Month"].map((g) => (
            <button key={g} onClick={() => setGroupBy(g)} className="px-3 py-2 text-xs font-medium cursor-pointer"
              style={{ background: groupBy === g ? T.blue : "#fff", color: groupBy === g ? "#fff" : T.textSecondary }}>
              {g}
            </button>
          ))}
        </div>
        <div className="w-48">
          <Dropdown value={cat}
            options={["All categories", ...Object.values(CATEGORIES).map((c) => c.label)]}
            onChange={setCat} />
        </div>
        <div className="inline-flex rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          {["All", "Positive", "Negative"].map((k) => (
            <button key={k} onClick={() => setTone(k)} className="px-3 py-2 text-xs font-medium cursor-pointer"
              style={{ background: tone === k ? T.blue : "#fff", color: tone === k ? "#fff" : T.textSecondary }}>
              {k}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search comments"
          className="rounded-md px-3 py-2 text-sm outline-none w-44"
          style={{ border: `1px solid ${T.border}`, color: T.text }} />
        <Btn variant="secondary" size="sm">Export CSV</Btn>
      </div>

      <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        <div className="grid px-3 py-2 text-xs font-semibold"
          style={{ background: T.lavender, color: T.navy, gridTemplateColumns: cols }}>
          <div>Comment</div><div>Category</div><div>Score</div><div>Sentiment</div><div>Month</div>
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {keys.map((k) => {
            const group = shown.filter((v) => keyOf(v) === k);
            const avg = group.reduce((a, b) => a + b.score, 0) / group.length;
            return (
              <div key={k}>
                <div className="flex items-center gap-3 px-3 py-2"
                  style={{ background: "#FBFBFE", borderTop: `1px solid ${T.border}` }}>
                  <span className="text-sm font-semibold" style={{ color: T.text }}>{k}</span>
                  <Pill bg={T.lavender} fg={T.textSecondary}>{group.length}</Pill>
                  <div className="flex-1" />
                  <span className="text-xs" style={{ color: T.textSecondary }}>average</span>
                  <span className="text-sm font-semibold" style={{ color: avg >= 4 ? T.success : T.warning }}>
                    {avg.toFixed(1)}
                  </span>
                </div>
                {group.map((v, i) => (
                  <div key={k + i} className="grid px-3 py-2.5 text-sm items-center"
                    style={{ borderTop: `1px solid ${T.border}`, gridTemplateColumns: cols }}>
                    <div className="pr-4" style={{ color: T.text }}>{v.text}</div>
                    <div style={{ color: T.textSecondary }}>{v.cat}</div>
                    <div style={{ color: v.score >= 4 ? T.success : T.warning }}>{v.score}/5</div>
                    <div>
                      <Pill bg={v.tone === "Positive" ? "#E6F4EE" : T.yellowPill}
                        fg={v.tone === "Positive" ? T.success : T.warning}>{v.tone}</Pill>
                    </div>
                    <div style={{ color: T.textSecondary }}>{v.month}</div>
                  </div>
                ))}
              </div>
            );
          })}
          {!shown.length && (
            <div className="px-3 py-8 text-center text-sm" style={{ color: T.textSecondary }}>
              No comments match that filter.
            </div>
          )}
        </div>
      </div>
      <div className="text-xs mt-3" style={{ color: T.textSecondary }}>
        Free-text survey answers are scored and grouped the same way intake answers are,
        so comments can be sliced by category, sentiment or period.
      </div>
    </Card>
  );
}

function SentimentReport({ toast }) {
  const [live, setLive] = useState(true);
  const d = SENTIMENT.requester;
  const max = 5;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-semibold" style={{ color: T.text }}>Requester survey</div>
            <div className="text-sm" style={{ color: T.textSecondary }}>Sent when a request is closed</div>
          </div>
          <button onClick={() => { setLive(!live); toast(live ? "Requester survey paused" : "Requester survey running"); }}
            className="cursor-pointer">
            {live
              ? <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Running</Pill>
              : <Pill bg={T.lavender} fg={T.textSecondary}>Paused</Pill>}
          </button>
        </div>
        <div className="flex items-end gap-8">
          <div>
            <div className="text-xs" style={{ color: T.textSecondary }}>Average score</div>
            <div className="text-3xl font-semibold" style={{ color: d.score >= 4 ? T.success : T.warning }}>
              {d.score.toFixed(1)}<span className="text-base" style={{ color: T.textSecondary }}>/5</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1.5" style={{ color: T.textSecondary }}>Last six months</div>
            <div className="flex items-end gap-1.5" style={{ height: 52 }}>
              {d.trend.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t"
                    style={{ height: (v / max) * 44, background: v >= 4 ? T.success : T.warning, opacity: 0.85 }} />
                  <span style={{ color: T.textSecondary, fontSize: 10 }}>{SENTIMENT.months[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: T.textSecondary }}>Responses</div>
            <div className="text-lg font-semibold" style={{ color: T.text }}>{d.responses}</div>
            <div className="text-xs" style={{ color: T.textSecondary }}>{d.rate}% response rate</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-base font-semibold mb-3" style={{ color: T.text }}>Score by category</div>
        <div className="space-y-2">
          {SENTIMENT.byCategory.map((c) => (
            <div key={c.cat} className="flex items-center gap-3">
              <span className="text-sm w-40" style={{ color: T.textSecondary }}>{c.cat}</span>
              <Bar pct={(c.score / max) * 100} tone={c.score >= 4 ? T.success : T.warning} />
              <span className="text-sm w-8 text-right font-medium" style={{ color: T.text }}>{c.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Banner tone="warning" icon={AlertTriangle}>
            Data Centers and Contingent Workers score lowest, and both run the longest approval chains.
          </Banner>
        </div>
      </Card>

      <VerbatimsTable />
    </div>
  );
}

function ReportingTab({ toast }) {
  const [sub, setSub] = useState("responses");
  const tabs = [
    ["responses", "Form responses"],
    ["thresholds", "Policy and thresholds"],
    ["sentiment", "Sentiment"],
  ];
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)}
            className="px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer"
            style={{ background: sub === id ? T.lavender : "transparent",
                     color: sub === id ? T.blue : T.textSecondary,
                     border: `1px solid ${sub === id ? T.blue : "transparent"}` }}>
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="text-xs" style={{ color: T.textSecondary }}>Last 12 months to 09 Sep 2026</div>
      </div>
      {sub === "responses" && <FormResponsesReport />}
      {sub === "thresholds" && <ThresholdReport toast={toast} />}
      {sub === "sentiment" && <SentimentReport toast={toast} />}
    </div>
  );
}

/* --------------------------- PROCUREMENT PAGE ----------------------------- */

function ProcurementPage({ dimmed, onRaise, toast }) {
  const [tab, setTab] = useState("mine");
  const rows = [
    ["Software-498", "Procurement_test_vendo...", "Software", "Completed"],
    ["Hardware-495", "Laptop refresh, Support", "Hardware", "Completed"],
    ["Contingent-491", "Design system contractor", "Contingent Workers", "In Progress"],
    ["Other-486", "Offsite catering", "Others", "Rejected"],
  ];
  return (
    <div className={dimmed ? "opacity-40 pointer-events-none" : ""}>
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-3xl font-semibold" style={{ color: T.text }}>Procurement</h1>
        <HelpCircle size={18} style={{ color: T.textSecondary }} />
        <div className="px-3 py-1.5 rounded-md text-sm flex items-center gap-2"
          style={{ border: `1px solid ${T.border}`, color: T.textSecondary }}>
          <Info size={14} /> Last data processed on: 09/07/2026, 12:42 AM
        </div>
        <RefreshCw size={15} style={{ color: T.blue }} />
        <div className="flex-1" />
        <Btn variant="primary" onClick={onRaise}>Raise a Request</Btn>
      </div>

      <div className="flex gap-8 mb-5" style={{ borderBottom: `1px solid ${T.border}` }}>
        {[["mine", "My Request"], ["all", "All"], ["reporting", "Reporting"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="pb-2 text-sm cursor-pointer"
            style={{ color: tab === id ? T.blue : T.textSecondary,
                     fontWeight: tab === id ? 500 : 400,
                     borderBottom: tab === id ? `2px solid ${T.blue}` : "2px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "reporting" && <ReportingTab toast={toast} />}

      {tab !== "reporting" && (
      <>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-80 rounded-md px-3 py-2 flex items-center gap-2" style={{ border: `1px solid ${T.border}` }}>
          <span className="text-sm flex-1" style={{ color: T.placeholder }}>Search</span>
          <Search size={15} style={{ color: T.textSecondary }} />
        </div>
        <div className="p-2 rounded-md" style={{ border: `1px solid ${T.border}` }}><Filter size={15} style={{ color: T.textSecondary }} /></div>
        <div className="px-3 py-2 rounded-md text-sm flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.text }}>
          Default View <ChevronDown size={14} />
        </div>
        <div className="p-2 rounded-md" style={{ border: `1px solid ${T.border}` }}><Share2 size={15} style={{ color: T.textSecondary }} /></div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        <div className="grid px-4 py-2.5 text-sm font-semibold"
          style={{ background: T.lavender, color: T.navy, gridTemplateColumns: "1.3fr 1.6fr 1.4fr 1fr" }}>
          <div>Requested Id</div><div>Request Name</div><div>Category</div><div>Status</div>
        </div>
        {rows.map((r) => (
          <div key={r[0]} className="grid px-4 py-3 text-sm"
            style={{ gridTemplateColumns: "1.3fr 1.6fr 1.4fr 1fr", borderTop: `1px solid ${T.border}`, color: T.text }}>
            <div style={{ color: T.blue }}>{r[0]}</div>
            <div style={{ color: T.blue }}>{r[1]}</div>
            <div>{r[2]}</div>
            <div>{r[3]}</div>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}

/* ------------------------------ DEFLECTED --------------------------------- */

function Deflected({ annual, onUndo }) {
  const f = OVERLAP[0];
  const saved = Math.round((f.acv / f.owned) * f.inactive);
  // The requester can deflect before they ever reach the commercial fields, so
  // fall back to the seat rate rather than reporting a confident zero.
  const avoided = annual > 0 ? money(annual) : "New purchase";
  return (
    <div className="max-w-3xl">
      <Banner tone="success" icon={CheckCircle2} title="No new purchase needed">
        Your request was converted to an access request against Figma. Design ops has been notified.
      </Banner>
      <div className="mt-4">
        <Card>
          <div className="text-base font-semibold mb-3" style={{ color: T.text }}>What happened</div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[[annual > 0 ? "New spend avoided" : "Avoided", avoided, T.success],
              ["Seats available", `${f.inactive} inactive`, T.text],
              ["Figma renewal", f.renews, T.text]].map(([k, v, c]) => (
              <div key={k}>
                <div className="text-xs" style={{ color: T.textSecondary }}>{k}</div>
                <div className="text-lg font-semibold" style={{ color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <Banner tone="info" icon={Info}>
            Reclaiming all {f.inactive} inactive seats before the {f.renews} renewal
            would also cut the Figma contract by around {money(saved)} a year.
          </Banner>
          <div className="mt-4">
            <Btn variant="secondary" onClick={onUndo}><RotateCcw size={13} /> Go back and buy new instead</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Joined({ req, showBack, onUndo }) {
  return (
    <div className="max-w-3xl">
      <Banner tone="success" icon={CheckCircle2} title="Added to an existing request">
        You have been added to {req.id}. {req.raisedBy} has been notified and no second
        request was raised.
      </Banner>
      <div className="mt-4">
        <Card>
          <div className="text-base font-semibold mb-3" style={{ color: T.text }}>What happens now</div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[["Request", `${req.id}, ${req.app}`], ["Owner", `${req.raisedBy}, ${req.team}`],
              ["Current step", req.stage]].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs" style={{ color: T.textSecondary }}>{k}</div>
                <div className="text-sm font-semibold" style={{ color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
          <Banner tone="info" icon={Info}>
            Your licence count was added to the sourcing event, so both teams are
            negotiated for together. Duplicate spend avoided, and a larger volume
            going into the negotiation.
          </Banner>
          <div className="mt-4">
            <Btn variant="secondary" onClick={onUndo}>
              <RotateCcw size={13} /> Go back and raise a separate request
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ ROUTED SCREEN ----------------------------- */

/* ------------------------------- TASK PANELS ------------------------------ */

function RequirementsPanel({ w, set, toast, onDone, label }) {
  const cat = CATEGORIES[w.category];
  const amount = cat.amount(w);
  return (
    <div>
      <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
        Captured at intake: {cat.label}, {money(amount)}.
      </div>
      {w.reqDone
        ? <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Confirmed</Pill>
        : <Btn variant="primary" onClick={() => { set({ reqDone: true }); toast(label + " confirmed"); onDone(); }}>Mark Complete</Btn>}
    </div>
  );
}

function SecurityReviewPanel({ w, set, toast, onDone }) {
  const items = [
    ["Data classification", "Customer PII, confidential"],
    ["Sub-processors disclosed", "3 listed in vendor DPA"],
    ["SOC 2 Type II", "Current, expires Mar 2027"],
    ["Data residency", "EU and US, configurable"],
  ];
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-semibold" style={{ color: T.text }}>Cybersecurity and Data Privacy Review</div>
          <div className="text-sm" style={{ color: T.textSecondary }}>
            Added because this is new software that will handle customer PII.
          </div>
        </div>
        <Pill bg={T.yellowPill} fg={T.warning}><Lock size={11} /> Blocks approval</Pill>
      </div>
      <div className="rounded-md overflow-hidden mb-3" style={{ border: `1px solid ${T.border}` }}>
        {items.map(([k, v], i) => (
          <div key={k} className="flex items-center px-3 py-2 text-sm"
            style={{ borderTop: i ? `1px solid ${T.border}` : "none" }}>
            <div className="w-52" style={{ color: T.textSecondary }}>{k}</div>
            <div className="flex-1" style={{ color: T.text }}>{v}</div>
          </div>
        ))}
      </div>
      {w.dpia ? (
        <Banner tone="success" icon={CheckCircle2} title="Review cleared">
          DPIA completed and filed. Approvals can now start.
        </Banner>
      ) : (
        <>
          <Banner tone="warning" icon={AlertTriangle}>
            A Data Protection Impact Assessment is required before this can clear.
          </Banner>
          <div className="mt-3 flex gap-2">
            <Btn variant="primary" onClick={() => { set({ dpia: true }); toast("Security review cleared"); onDone(); }}>
              Complete DPIA and clear
            </Btn>
            <Btn variant="destructive">Reject request</Btn>
          </div>
        </>
      )}
    </Card>
  );
}

function HRReviewPanel({ w, set, toast, onDone }) {
  const cap = CONTRACTOR_TIERS[w.tier];
  const over = (w.hourlyRate || 0) > cap;
  return (
    <div className="p-3 space-y-4">
      <Card>
        <div className="text-base font-semibold mb-1" style={{ color: T.text }}>Contractor classification</div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          Determine W2 versus 1099 before any approval or onboarding starts.
        </div>
        {w.classification ? (
          <Banner tone="success" icon={CheckCircle2} title={`Classified as ${w.classification}`}>
            Determination recorded against this engagement and stored for audit.
          </Banner>
        ) : (
          <div className="space-y-2">
            {[["1099 contractor", "Sets own hours, uses own equipment, works for multiple clients"],
              ["W2 employee of record", "Directed hours, company equipment, ongoing supervision"]].map(([k, d]) => (
              <div key={k} onClick={() => { set({ classification: k }); toast(`Classified as ${k}`); }}
                className="rounded-md px-3 py-2.5 cursor-pointer hover:opacity-80" style={{ border: `1px solid ${T.border}` }}>
                <div className="text-sm font-medium" style={{ color: T.text }}>{k}</div>
                <div className="text-xs" style={{ color: T.textSecondary }}>{d}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="text-base font-semibold mb-3" style={{ color: T.text }}>Rate against tier cap</div>
        <div className="flex items-baseline gap-8 mb-3">
          <div>
            <div className="text-xs" style={{ color: T.textSecondary }}>Requested rate</div>
            <div className="text-xl font-semibold" style={{ color: over ? T.warning : T.success }}>${w.hourlyRate}/hr</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: T.textSecondary }}>{w.tier} cap</div>
            <div className="text-xl font-semibold" style={{ color: T.text }}>${cap}/hr</div>
          </div>
        </div>
        {over
          ? <Banner tone="warning" icon={AlertTriangle}>
              ${w.hourlyRate - cap} per hour over cap. Finance Director sign-off was added to the approval step.
            </Banner>
          : <Banner tone="success" icon={CheckCircle2}>Within the standard cap for this tier.</Banner>}
        {w.classification && !w.hrDone && (
          <div className="mt-3">
            <Btn variant="primary" onClick={() => { set({ hrDone: true }); toast("HR review complete"); onDone(); }}>
              Complete HR review
            </Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

function BrandReviewPanel({ w, set, toast, onDone }) {
  const checks = [
    ["Logo files", "Current 2026 mark, correct clear space"],
    ["Colour palette", "Primary navy and periwinkle only"],
    ["Approved product list", "Hoodie and bottle are on the list"],
  ];
  return (
    <div className="p-3 space-y-4">
      <Card>
        <div className="text-base font-semibold mb-1" style={{ color: T.text }}>Brand guideline check</div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          {w.qty} units for {(w.purpose || "").toLowerCase()}, needed by {w.deadline || "the stated deadline"}.
        </div>
        <div className="rounded-md overflow-hidden mb-3" style={{ border: `1px solid ${T.border}` }}>
          {checks.map(([k, v], i) => (
            <div key={k} className="flex items-center px-3 py-2 text-sm gap-3" style={{ borderTop: i ? `1px solid ${T.border}` : "none" }}>
              <CheckCircle2 size={15} style={{ color: T.success }} />
              <div className="w-44" style={{ color: T.textSecondary }}>{k}</div>
              <div className="flex-1" style={{ color: T.text }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-base font-semibold mb-1" style={{ color: T.text }}>Preferred vendor check</div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          An internal preferred vendor can fulfil this order.
        </div>
        {w.preferredVendor ? (
          <Banner tone="success" icon={CheckCircle2} title="Routed to Everpress, preferred vendor">
            Artwork sent. Confirmed delivery 12 working days ahead of your deadline.
          </Banner>
        ) : (
          <Banner tone="info" icon={Store} title="Everpress, preferred vendor"
            action={
              <>
                <Btn variant="primary" size="sm" onClick={() => { set({ preferredVendor: true }); toast("Routed to preferred vendor"); }}>
                  Use preferred vendor
                </Btn>
                <Btn variant="secondary" size="sm">Source elsewhere</Btn>
              </>
            }>
            Pre-negotiated rates, artwork already on file, 12 day lead time.
          </Banner>
        )}
        {w.preferredVendor && !w.brandDone && (
          <div className="mt-3">
            <Btn variant="primary" onClick={() => { set({ brandDone: true }); toast("Brand review complete"); onDone(); }}>
              Complete brand review
            </Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

function RFxPanel({ w, set, onHandoff }) {
  const vr = w.sourcingHandoff;

  if (!vr)
    return (
      <Card>
        <div className="flex items-start justify-between mb-1">
          <div className="text-base font-semibold" style={{ color: T.text }}>Sourcing runs in Vendor Research</div>
          <Pill bg={T.lavender} fg={T.navy}><Search size={11} /> Linked module</Pill>
        </div>
        <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
          This opens a contact request in Vendor Research with the problem description
          carried across. Responses are scored and benchmarked there. Finalising a vendor
          for procurement closes this step.
        </div>
        <div className="rounded-md px-3 py-2.5 mb-3" style={{ border: `1px solid ${T.border}`, background: T.lavender }}>
          <div className="text-xs mb-1" style={{ color: T.textSecondary }}>Carried across</div>
          <div className="text-sm" style={{ color: T.text }}>
            {(w.problem || "").slice(0, 140) || "The problem description from intake"}
            {(w.problem || "").length > 140 ? "…" : ""}
          </div>
        </div>
        <Btn variant="primary" onClick={onHandoff}>
          Create contact request <ArrowRight size={13} />
        </Btn>
      </Card>
    );

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-semibold" style={{ color: T.text }}>{vr.name}</div>
          <div className="text-sm" style={{ color: T.textSecondary }}>Running in Vendor Research</div>
        </div>
        <Pill bg={T.yellowPill} fg={T.warning}><Clock size={11} /> Awaiting a finalised vendor</Pill>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[["Vendors invited", String((vr.vendors || []).length)],
          ["Deadline", vr.deadline || "—"],
          ["Linked to", w.reqId || "—"]].map(([k, v]) => (
          <div key={k}>
            <div className="text-xs" style={{ color: T.textSecondary }}>{k}</div>
            <div className="text-sm font-semibold" style={{ color: T.text }}>{v}</div>
          </div>
        ))}
      </div>
      <Banner tone="info" icon={Info}>
        Nothing to do here. Scoring, benchmarking and the executive summary all live on
        the research request. This step closes when a vendor is finalised for procurement.
      </Banner>
      <div className="mt-3">
        <Btn variant="secondary" onClick={() => set({ module: "research" })}>
          Open in Vendor Research <ArrowRight size={13} />
        </Btn>
      </div>
    </Card>
  );
}

function ApprovalPanel({ w, set, step, toast, onDone }) {
  const cat = CATEGORIES[w.category];
  const amount = w.awardValue || cat.amount(w);
  const all = step.approvers.every((a) => w[a.key]);

  useEffect(() => { if (all) onDone(); }, [all]);

  const checks = [];
  checks.push([true, "Category", `${cat.label} request for ${money(amount)}, routed under the ${cat.label} rules.`]);
  if (w.category === "software" && w.pii) checks.push([!!w.dpia, "Security review", w.dpia ? "DPIA completed and cleared." : "DPIA not yet cleared."]);
  if (w.category === "software" && w.overlapFlag !== false)
    checks.push([false, "Overlap", "248 inactive Figma seats were flagged at intake. Requester provided justification."]);
  if (w.category === "contingent")
    checks.push([!!w.classification, "Classification", w.classification ? `HR determined ${w.classification}.` : "Pending HR determination."]);
  if (w.category === "hardware")
    checks.push([false, "Standard model", `${w.model} at ${money(amount)} did not qualify for rapid fulfillment.`]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-base font-semibold mb-1" style={{ color: T.text }}>What the approver sees</div>
        <div className="text-sm mb-4" style={{ color: T.textSecondary }}>
          Policy checks travel with the approval, so the decision and its basis stay together in the audit record.
        </div>
        <div className="space-y-2">
          {checks.map(([ok, title, body], i) => (
            <div key={i} className="rounded-md px-3 py-2.5 flex gap-3" style={{ border: `1px solid ${T.border}` }}>
              {ok ? <CheckCircle2 size={17} style={{ color: T.success, flexShrink: 0, marginTop: 1 }} />
                  : <AlertTriangle size={17} style={{ color: T.warning, flexShrink: 0, marginTop: 1 }} />}
              <div>
                <div className="text-sm font-medium" style={{ color: T.text }}>{title}</div>
                <div className="text-sm" style={{ color: T.textSecondary }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-base font-semibold mb-3" style={{ color: T.text }}>Approvals</div>
        <div className="space-y-2">
          {step.approvers.map((a) => (
            <div key={a.key} className="rounded-md px-3 py-2.5 flex items-center gap-3" style={{ border: `1px solid ${T.border}` }}>
              <Scale size={16} style={{ color: w[a.key] ? T.success : T.textSecondary }} />
              <div className="flex-1 text-sm font-medium" style={{ color: T.text }}>{a.label}</div>
              <Avatar>{a.initials}</Avatar>
              {w[a.key] ? <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Approved</Pill> : (
                <div className="flex gap-2">
                  <Btn variant="secondary" size="sm" onClick={() => { set({ [a.key]: true }); toast(`${a.label} recorded`); }}>Approve</Btn>
                  <Btn variant="destructive" size="sm">Reject</Btn>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SignaturePanel({ w, set, toast, onDone, label }) {
  const cat = CATEGORIES[w.category];
  return (
    <Card>
      <div className="text-base font-semibold mb-1" style={{ color: T.text }}>{label}</div>
      <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
        {w.award || cat.label} paperwork, {money(w.awardValue || cat.amount(w))}.
      </div>
      {w.signed
        ? <Banner tone="success" icon={CheckCircle2} title="Signed">Countersigned. The next step started automatically.</Banner>
        : <Btn variant="primary" onClick={() => { set({ signed: true }); toast("Signed"); onDone(); }}><PenLine size={13} /> Sign</Btn>}
    </Card>
  );
}

function ProvisioningPanel({ w, set, toast }) {
  useEffect(() => {
    if (w.signed && w.provision === "idle") {
      set({ provision: "running" });
      setTimeout(() => { set({ provision: "done" }); toast("Provisioning complete"); }, 2000);
    }
  }, [w.signed, w.provision]);

  const isSoftware = w.category === "software";
  const f = OVERLAP[0];
  const saved = Math.round((f.acv / f.owned) * f.inactive);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-semibold" style={{ color: T.text }}>Provisioning job PRV-9042</div>
            <div className="text-sm" style={{ color: T.textSecondary }}>Triggered by signature</div>
          </div>
          {w.provision === "done"
            ? <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Complete</Pill>
            : <Pill bg={T.yellowPill} fg={T.warning}><Loader size={11} className="animate-spin" /> Running</Pill>}
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[["Target", w.award || (isSoftware ? "Framer" : "Environment")],
            ["Seats or access", w.provision === "done" ? (isSoftware ? String(w.seats) : "Granted") : "-"],
            ["Source group", isSoftware ? "Product Design (Okta)" : "Engineering (Okta)"],
            ["Completed", w.provision === "done" ? "30 Sep 2026" : "-"]].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs" style={{ color: T.textSecondary }}>{k}</div>
              <div className="text-sm font-semibold" style={{ color: T.text }}>{v}</div>
            </div>
          ))}
        </div>
        {w.provision === "done"
          ? <Banner tone="success" icon={CheckCircle2} title="Access granted">
              Access Management provisioned from the source group. Anyone removed from
              that group is deprovisioned automatically.
            </Banner>
          : <div className="space-y-2"><Skeleton w="60%" /><Skeleton w="40%" /></div>}
      </Card>

      {isSoftware && w.provision === "done" && (
        <Card>
          <div className="text-base font-semibold mb-1" style={{ color: T.text }}>Still open from this request</div>
          <div className="text-sm mb-3" style={{ color: T.textSecondary }}>Raised at intake, tracked separately.</div>
          {w.reclaim
            ? <Banner tone="success" icon={CheckCircle2} title="Reclaim started">
                248 Figma seats queued for removal. Notice deadline set for 07 Oct 2026.
              </Banner>
            : <Banner tone="warning" icon={AlertTriangle} title="248 inactive Figma seats, renewal in 60 days"
                action={
                  <>
                    <Btn variant="primary" size="sm" onClick={() => { set({ reclaim: true }); toast("Reclaim started"); }}>Start reclaim</Btn>
                    <Btn variant="secondary" size="sm">Open renewal</Btn>
                  </>
                }>
                Reclaiming these before the renewal would cut the Figma contract by around {money(saved)} a year.
              </Banner>}
        </Card>
      )}
    </div>
  );
}

function FulfillmentPanel({ w, set, toast }) {
  const cat = w.category;
  useEffect(() => {
    if (w.fulfil === "idle") {
      set({ fulfil: "running" });
      setTimeout(() => { set({ fulfil: "done" }); toast("Fulfillment complete"); }, 2000);
    }
  }, [w.fulfil]);

  const rows =
    cat === "hardware"
      ? [["Asset", w.model], ["Quantity", String(w.qty)], ["Assigned to", "Priya Anand"], ["Asset tag", w.fulfil === "done" ? "AST-20714" : "-"]]
      : cat === "swag"
      ? [["Vendor", w.preferredVendor ? "Everpress" : "To be sourced"], ["Quantity", `${w.qty} units`],
         ["Deadline", w.deadline || "-"], ["Delivery", w.fulfil === "done" ? "12 days ahead of deadline" : "-"]]
      : [["Cost centre", w.costCentre || "-"], ["Amount", money(w.amount)],
         ["PO", w.fulfil === "done" ? "PO-88104" : "-"], ["Status", w.fulfil === "done" ? "Issued" : "Pending"]];

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-semibold" style={{ color: T.text }}>
            {cat === "hardware" ? "IT Asset Management" : cat === "swag" ? "Order and delivery" : "Purchase and fulfillment"}
          </div>
          <div className="text-sm" style={{ color: T.textSecondary }}>
            {cat === "hardware" && w.fastTrack ? "Rapid fulfillment, Finance approval skipped." : "Queued for fulfillment."}
          </div>
        </div>
        {w.fulfil === "done"
          ? <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Complete</Pill>
          : <Pill bg={T.yellowPill} fg={T.warning}><Loader size={11} className="animate-spin" /> Running</Pill>}
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="text-xs" style={{ color: T.textSecondary }}>{k}</div>
            <div className="text-sm font-semibold" style={{ color: T.text }}>{v}</div>
          </div>
        ))}
      </div>
      {w.fulfil === "done"
        ? <Banner tone="success" icon={Truck} title="Dispatched">
            {cat === "hardware" ? "Device shipped and registered in the asset register."
              : cat === "swag" ? "Order placed with the preferred vendor and tracked against your deadline."
              : "Purchase order issued to the vendor."}
          </Banner>
        : <div className="space-y-2"><Skeleton w="55%" /><Skeleton w="35%" /></div>}
    </Card>
  );
}

/* ----------------------------- REQUEST SCREEN ----------------------------- */

function RequestScreen({ w, set, toast, onHandoff }) {
  const cat = CATEGORIES[w.category];
  const amount = cat.amount(w);
  const r = route(w.category, w, amount);

  const doneOf = (s) => {
    switch (s.type) {
      case "Requirements": return w.reqDone;
      case "SecurityReview": return !!w.dpia;
      case "HRReview": return !!w.hrDone;
      case "BrandReview": return !!w.brandDone;
      case "RFx": return !!w.sourcingDone;
      case "Approval": return s.approvers.every((a) => w[a.key]);
      case "Signature": return !!w.signed;
      case "Provisioning": return w.provision === "done";
      case "Fulfillment": return w.fulfil === "done";
      default: return false;
    }
  };

  // Coming back from Vendor Research remounts this screen, so open the first
  // step that is still outstanding rather than always starting at step one.
  const [open, setOpen] = useState(() => (r.steps.find((s) => !doneOf(s)) || r.steps[0]).n);

  const next = (n) => setOpen(Math.min(n + 1, r.steps.length));

  return (
    <div>
      <div className="flex items-center gap-2 text-sm mb-4" style={{ color: T.blue }}>
        <ChevronLeft size={15} /> Return to requests
      </div>

      <Card className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold" style={{ color: T.text }}>{w.reqName}</h1>
              <PenLine size={15} style={{ color: T.textSecondary }} />
            </div>
            <div className="text-sm mt-1" style={{ color: T.textSecondary }}>
              {w.reqId} &middot; {cat.label} &middot; Raised by Priya Anand
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Btn variant="tertiary" size="sm">View template</Btn>
            <MoreVertical size={17} style={{ color: T.textSecondary }} />
          </div>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: T.textSecondary }}>Value:</span>
            <span style={{ color: T.text }}>{money(amount)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: T.textSecondary }}>Priority:</span>
            <Pill bg={T.yellowPill} fg={T.warning}>Medium</Pill>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: T.textSecondary }}>Steps:</span>
            <div className="flex items-center gap-1">
              {r.steps.map((s) => (
                <div key={s.n} className="w-3 h-3 rounded-full"
                  style={{ background: doneOf(s) ? T.success : open === s.n ? T.warning : T.lavender, transition: "background .3s" }} />
              ))}
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm" style={{ color: T.blue }}>
            <Eye size={15} style={{ color: T.textSecondary }} />
            <span>Create Slack</span>
            <span style={{ color: T.textSecondary }}>channel for this workflow</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 items-start">
        <div className="space-y-3" style={{ width: "64%" }}>
          <div className="flex gap-8 mb-1" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="pb-2 text-sm" style={{ color: T.textSecondary }}>My Tasks</div>
            <div className="pb-2 text-sm font-medium" style={{ color: T.blue, borderBottom: `2px solid ${T.blue}` }}>
              All Tasks ({r.steps.length})
            </div>
          </div>

          {r.steps.map((s) => {
            const isOpen = open === s.n;
            const done = doneOf(s);
            return (
              <Card key={s.n} pad={false}>
                <button onClick={() => setOpen(isOpen ? 0 : s.n)} className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer text-left">
                  {isOpen ? <ChevronDown size={16} style={{ color: T.textSecondary }} /> : <ChevronRight size={16} style={{ color: T.textSecondary }} />}
                  <div className="flex-1 text-sm font-medium" style={{ color: T.text }}>Step {s.n}: {s.name}</div>
                  <Pill bg={T.lavender} fg={T.navy}>{s.type}</Pill>
                  {done ? <Pill bg="#E6F4EE" fg={T.success}>Complete</Pill>
                    : isOpen ? <Pill bg={T.yellowPill} fg={T.warning}>In Progress</Pill>
                    : <Pill bg={T.lavender} fg={T.textSecondary}>Upcoming</Pill>}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div className="pt-3 flex items-center gap-6 text-sm flex-wrap">
                      <div className="flex items-center gap-2">
                        <span style={{ color: T.textSecondary }}>Due date:</span>
                        <span style={{ color: T.text }}>Sep 21, 2026</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: T.textSecondary }}>Assignee:</span><Avatar>{s.assignee || "AM"}</Avatar>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: T.textSecondary }}>Escalate to:</span>
                        <Avatar>AH</Avatar>
                        <span style={{ color: T.text }}>Aaron Hopkins</span>
                        <Pill bg={T.lavender} fg={T.textSecondary}>after 1 day overdue</Pill>
                      </div>
                    </div>

                    <div className="mt-4">
                      {s.type === "Requirements" && <RequirementsPanel w={w} set={set} toast={toast} label={s.name} onDone={() => next(s.n)} />}
                      {s.type === "SecurityReview" && <SecurityReviewPanel w={w} set={set} toast={toast} onDone={() => next(s.n)} />}
                      {s.type === "HRReview" && <HRReviewPanel w={w} set={set} toast={toast} onDone={() => next(s.n)} />}
                      {s.type === "BrandReview" && <BrandReviewPanel w={w} set={set} toast={toast} onDone={() => next(s.n)} />}
                      {s.type === "RFx" && <RFxPanel w={w} set={set} onHandoff={onHandoff} />}
                      {s.type === "Approval" && <ApprovalPanel w={w} set={set} step={s} toast={toast} onDone={() => next(s.n)} />}
                      {s.type === "Signature" && <SignaturePanel w={w} set={set} toast={toast} label={s.name} onDone={() => next(s.n)} />}
                      {s.type === "Provisioning" && <ProvisioningPanel w={w} set={set} toast={toast} />}
                      {s.type === "Fulfillment" && <FulfillmentPanel w={w} set={set} toast={toast} />}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="flex-1 space-y-3">
          {["Workflow Details", "Form Details", "Workflow Activities"].map((t) => (
            <Card key={t} pad={false}>
              <div className="px-4 py-3 flex items-center gap-2">
                <ChevronRight size={16} style={{ color: T.textSecondary }} />
                <span className="text-sm font-medium" style={{ color: T.text }}>{t}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- VENDOR RESEARCH -----------------------------
   The module as built previously, embedded in the shared shell. Its own
   sidebar, top bar and procurement form are removed; the shell supplies the
   first two and the real intake drawer supplies the third.
-------------------------------------------------------------------------- */

const VR_CSS = `
/* Embedded inside the shared shell: the shell owns the sidebar, top bar and
   page background, so the module renders as plain page content. */
.ce-root.ce-embedded { min-height:0; background:transparent; display:block; }
.ce-root.ce-embedded .ce-page { padding:0; }

.ce-root { font-family: Inter, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color:#101828; background:#F4F6FA; min-height:100vh; display:flex; }
.ce-root *, .ce-root *::before, .ce-root *::after { box-sizing:border-box; }

/* ---------- sidebar ---------- */
.ce-rail { width:56px; flex:0 0 56px; background:#181B4A; display:flex; flex-direction:column;
  align-items:center; padding:12px 0; gap:2px; position:sticky; top:0; height:100vh; }
.ce-rail-logo { width:32px; height:32px; border-radius:50%; background:#4B53E1; display:flex;
  align-items:center; justify-content:center; margin-bottom:14px; }
.ce-rail-logo span { width:11px; height:11px; border-radius:50%; border:3px solid #fff; }
.ce-rail-item { width:36px; height:34px; display:flex; align-items:center; justify-content:center;
  color:#8E93C4; border-radius:6px; cursor:pointer; }
.ce-rail-item:hover { color:#fff; background:rgba(255,255,255,.07); }
.ce-rail-item.is-active { color:#fff; background:#4B53E1; }
.ce-rail-spacer { flex:1; }

/* ---------- shell ---------- */
.ce-main { flex:1; min-width:0; display:flex; flex-direction:column; }
.ce-topbar { height:60px; background:#fff; border-bottom:1px solid #E4E7F0; display:flex;
  align-items:center; justify-content:flex-end; gap:16px; padding:0 24px; }
.ce-topsearch { display:flex; align-items:center; gap:8px; width:240px; height:36px; padding:0 12px;
  border:1px solid #D0D5DD; border-radius:6px; color:#98A2B3; font-size:13px; }
.ce-eagleeye { display:flex; align-items:center; gap:7px; height:36px; padding:0 14px; border-radius:6px;
  background:#3B2A8C; color:#fff; font-size:13px; font-weight:600; }
.ce-topdiv { width:1px; height:24px; background:#E4E7F0; }
.ce-avatar { width:30px; height:30px; border-radius:50%; background:#4B53E1; color:#fff; font-size:11px;
  font-weight:600; display:flex; align-items:center; justify-content:center; }

.ce-page { padding:22px 28px 40px; }
.ce-page-head { display:flex; align-items:flex-start; justify-content:space-between; }
.ce-h1 { font-size:22px; font-weight:600; letter-spacing:-.2px; margin:0; }

/* ---------- tabs ---------- */
.ce-tabsbar { display:flex; align-items:center; justify-content:space-between; gap:20px;
  border-bottom:1px solid #E4E7F0; margin-top:16px; }
.ce-tabsbar .ce-tabs { margin-top:0; border-bottom:none; }
.ce-tabs { display:flex; gap:34px; border-bottom:1px solid #E4E7F0; margin-top:16px; }
.ce-tab { position:relative; padding:12px 2px 13px; font-size:13.5px; font-weight:600; color:#667085;
  background:none; border:none; cursor:pointer; letter-spacing:.2px; }
.ce-tab:hover { color:#101828; }
.ce-tab.is-active { color:#4C5AE4; }
.ce-tab.is-active::after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:#4C5AE4; }
.ce-tab-count { margin-left:7px; padding:1px 7px; border-radius:999px; background:#EFF1F7;
  color:#667085; font-size:11.5px; font-weight:600; }
.ce-tab.is-active .ce-tab-count { background:#EEF0FE; color:#4C5AE4; }

/* ---------- inline banner ---------- */
.ce-banner { display:flex; gap:10px; background:#EDF2FE; border:1px solid #DCE4FB; border-radius:8px;
  padding:14px 16px; }
.ce-banner-title { font-size:13.5px; font-weight:600; color:#3A45C4; margin:0 0 3px; }
.ce-banner p { font-size:13px; color:#4A5578; margin:0; line-height:1.55; }

/* ---------- cards strip ---------- */
.ce-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:20px; }
.ce-card { background:#fff; border:1px solid #E4E7F0; border-radius:8px; padding:16px 18px; cursor:pointer;
  text-align:left; }
.ce-card:hover { border-color:#B9C0F2; }
.ce-card.is-active { border-color:#4C5AE4; box-shadow:0 0 0 1px #4C5AE4 inset; }
.ce-card-label { font-size:12px; font-weight:600; color:#667085; letter-spacing:.3px; margin:0; }
.ce-card-value { font-size:28px; font-weight:600; margin:8px 0 6px; display:flex; align-items:center; gap:8px; }
.ce-card-help { font-size:12px; color:#98A2B3; margin:0; }

/* ---------- panel + toolbar ---------- */
.ce-panel { background:#fff; border:1px solid #E4E7F0; border-radius:8px; margin-top:20px; }
.ce-toolbar { display:flex; align-items:center; gap:10px; padding:14px 16px; }
.ce-toolbar-right { margin-left:auto; display:flex; align-items:center; gap:10px; }
.ce-search { display:flex; align-items:center; gap:8px; width:230px; height:34px; padding:0 10px;
  border:1px solid #D0D5DD; border-radius:6px; }
.ce-search input { border:none; outline:none; font-size:13px; width:100%; color:#101828; background:transparent; }
.ce-search input::placeholder { color:#98A2B3; }
.ce-iconbtn { width:34px; height:34px; border:1px solid #D0D5DD; border-radius:6px; background:#fff;
  display:flex; align-items:center; justify-content:center; color:#667085; cursor:pointer; }
.ce-iconbtn:hover { background:#F4F5FA; color:#101828; }
.ce-select { display:flex; align-items:center; gap:8px; height:34px; padding:0 10px; border:1px solid #D0D5DD;
  border-radius:6px; font-size:13px; color:#344054; background:#fff; cursor:pointer; }
.ce-count { font-size:13px; color:#475467; }

/* ---------- table ---------- */
.ce-tablewrap { overflow-x:auto; }
.ce-table { width:100%; border-collapse:collapse; font-size:13px; }
.ce-table thead th { background:#F4F5FA; color:#475467; font-weight:600; text-align:left; padding:11px 16px;
  border-top:1px solid #E4E7F0; border-bottom:1px solid #E4E7F0; white-space:nowrap; }
.ce-table tbody td { padding:14px 16px; border-bottom:1px solid #EFF1F7; vertical-align:middle; color:#344054; }
.ce-table tbody tr:hover { background:#FAFBFF; }
.ce-link { color:#4C5AE4; font-weight:500; text-decoration:none; background:none; border:none; padding:0;
  cursor:pointer; font-size:13px; }
.ce-link:hover { text-decoration:underline; }
.ce-vendors { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.ce-createdby { display:flex; align-items:center; gap:9px; }
.ce-createdby-name { font-size:13px; color:#101828; }
.ce-createdby-mail { font-size:11.5px; color:#98A2B3; }
.ce-empty { padding:56px 16px; text-align:center; }
.ce-empty h4 { font-size:14px; font-weight:600; margin:12px 0 4px; }
.ce-empty p { font-size:13px; color:#667085; margin:0 0 16px; }
.ce-pager { display:flex; align-items:center; justify-content:flex-end; gap:14px; padding:12px 16px;
  font-size:12.5px; color:#475467; }

/* ---------- pills ---------- */
.ce-pill { display:inline-flex; align-items:center; gap:6px; height:23px; padding:0 9px; border-radius:4px;
  font-size:12px; font-weight:500; white-space:nowrap; }
.ce-pill--neutral { background:#F2F4F7; color:#475467; }
.ce-pill--info { background:#EEF0FE; color:#3A45C4; }
.ce-pill--success { background:#ECFDF3; color:#027A48; }
.ce-pill--warning { background:#FDF3D7; color:#8A6100; }
.ce-pill--error { background:#FEF3F2; color:#B42318; }
.ce-dot { width:6px; height:6px; border-radius:50%; background:#4C5AE4; flex:none; }
.ce-vendorchip { display:inline-flex; align-items:center; height:23px; padding:0 8px; border:1px solid #E4E7F0;
  border-radius:4px; background:#fff; font-size:12px; color:#344054; }

/* ---------- buttons ---------- */
.ce-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; height:36px; padding:0 15px;
  border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; border:1px solid transparent;
  white-space:nowrap; }
.ce-btn:disabled { opacity:.45; cursor:not-allowed; }
.ce-btn--primary { background:#4C5AE4; color:#fff; }
.ce-btn--primary:not(:disabled):hover { background:#4048C9; }
.ce-btn--secondary { background:#fff; color:#344054; border-color:#D0D5DD; }
.ce-btn--secondary:not(:disabled):hover { background:#F4F5FA; }
.ce-btn--tertiary { background:transparent; color:#4C5AE4; padding:0 6px; }
.ce-btn--tertiary:not(:disabled):hover { text-decoration:underline; }
.ce-btn--destructive { background:#fff; color:#B42318; border-color:#F3C9C5; }
.ce-btn--destructive:not(:disabled):hover { background:#FEF3F2; }
.ce-btn--sm { height:30px; padding:0 11px; font-size:12.5px; }

/* ---------- fields ---------- */
.ce-field { margin-bottom:20px; }
.ce-label { display:block; font-size:13px; font-weight:600; color:#344054; margin-bottom:6px; }
.ce-help { font-size:12px; color:#667085; margin:6px 0 0; display:flex; align-items:center; gap:6px; }
.ce-input, .ce-textarea, .ce-selectbox { width:100%; border:1px solid #D0D5DD; border-radius:6px; padding:9px 12px;
  font-size:13px; color:#101828; font-family:inherit; background:#fff; outline:none; }
.ce-input:focus, .ce-textarea:focus, .ce-selectbox:focus { border-color:#4C5AE4; box-shadow:0 0 0 3px rgba(76,90,228,.12); }
.ce-input::placeholder, .ce-textarea::placeholder { color:#98A2B3; }
.ce-textarea { min-height:104px; resize:vertical; line-height:1.55; }
.ce-row2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

/* ---------- modal ---------- */
.ce-scrim { position:fixed; inset:0; background:rgba(16,24,40,.45); display:flex; align-items:center;
  justify-content:center; padding:28px; z-index:60; }
.ce-modal { background:#fff; border-radius:10px; width:100%; max-width:980px; height:min(88vh,780px);
  display:flex; flex-direction:column; overflow:hidden; }
.ce-modal-head { display:flex; align-items:center; justify-content:space-between; padding:18px 24px 0; }
.ce-modal-title { font-size:17px; font-weight:600; margin:0; }
.ce-modal-body { flex:1; overflow-y:auto; padding:22px 24px 28px; }
.ce-modal-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 24px;
  border-top:1px solid #E4E7F0; background:#fff; }
.ce-x { background:none; border:none; color:#667085; cursor:pointer; padding:4px; border-radius:4px; }
.ce-x:hover { background:#F4F5FA; color:#101828; }

/* ---------- stepper ---------- */
.ce-stepper { display:flex; align-items:center; gap:0; padding:16px 24px 0; overflow-x:auto; }
.ce-step { display:flex; align-items:center; gap:8px; padding-right:10px; flex:none; }
.ce-step-num { width:22px; height:22px; border-radius:50%; border:1.5px solid #D0D5DD; color:#98A2B3;
  font-size:11.5px; font-weight:600; display:flex; align-items:center; justify-content:center; flex:none; }
.ce-step-label { font-size:12.5px; color:#98A2B3; white-space:nowrap; }
.ce-step.is-done .ce-step-num { background:#4C5AE4; border-color:#4C5AE4; color:#fff; }
.ce-step.is-done .ce-step-label { color:#475467; }
.ce-step.is-current .ce-step-num { border-color:#4C5AE4; color:#4C5AE4; }
.ce-step.is-current .ce-step-label { color:#101828; font-weight:600; }
.ce-step-line { width:22px; height:1px; background:#E4E7F0; flex:none; margin-right:10px; }

/* ---------- misc blocks ---------- */
.ce-section-head { font-size:14px; font-weight:600; margin:0 0 4px; }
.ce-section-desc { font-size:13px; color:#667085; margin:0 0 18px; line-height:1.55; }
.ce-list { border:1px solid #E4E7F0; border-radius:8px; overflow:hidden; }
.ce-list-row { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-bottom:1px solid #EFF1F7; }
.ce-list-row:last-child { border-bottom:none; }
.ce-list-row.is-selected { background:#F7F8FE; }
.ce-list-title { font-size:13.5px; font-weight:600; margin:0 0 3px; }
.ce-list-desc { font-size:12.5px; color:#667085; margin:0; line-height:1.5; }
.ce-check { width:16px; height:16px; margin-top:2px; accent-color:#4C5AE4; cursor:pointer; flex:none; }
.ce-placeholder { display:flex; gap:9px; align-items:flex-start; border:1px dashed #C7CEE8; border-radius:8px;
  background:#FAFBFF; padding:13px 15px; font-size:12.5px; color:#4A5578; line-height:1.55; }
.ce-compare { width:100%; border-collapse:collapse; font-size:12.5px; border:1px solid #E4E7F0; border-radius:8px; }
.ce-compare th { background:#F4F5FA; text-align:left; padding:10px 12px; font-weight:600; color:#475467;
  border-bottom:1px solid #E4E7F0; }
.ce-compare td { padding:10px 12px; border-bottom:1px solid #EFF1F7; color:#344054; vertical-align:top; }
.ce-toast { position:fixed; top:74px; right:24px; background:#ECFDF3; border:1px solid #A6F4C5; color:#054F31;
  font-size:13px; padding:11px 14px; border-radius:6px; display:flex; align-items:center; gap:10px; z-index:90; }

/* ---------- questionnaire responses screen ---------- */
.ce-sumcards { display:flex; gap:16px; flex-wrap:wrap; }
.ce-sumcard { border:1px solid #E4E7F0; border-radius:8px; padding:14px 16px; min-width:230px; }
.ce-sumcard-label { font-size:11px; letter-spacing:.5px; color:#98A2B3; margin:0 0 9px; }
.ce-sumcard-value { font-size:15px; margin:0; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ce-hr { border:none; border-top:1px solid #E4E7F0; margin:24px 0; }
.ce-section-row { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:14px; }
.ce-vrcard { border:1px solid #E4E7F0; border-radius:8px; margin-bottom:14px; }
.ce-vrhead { display:flex; align-items:center; gap:12px; padding:14px 16px; width:100%; background:none;
  border:none; text-align:left; cursor:pointer; font-family:inherit; }
.ce-vrhead:hover { background:#FAFBFF; }
.ce-vrcard.is-open .ce-vrhead { border-bottom:1px solid #EFF1F7; }
.ce-vr-avatar { width:30px; height:30px; border-radius:6px; background:#F4F5FA; color:#4C5AE4; font-size:11.5px;
  font-weight:600; display:flex; align-items:center; justify-content:center; flex:none; }
.ce-vr-name { font-size:13.5px; font-weight:600; margin:0; color:#101828; }
.ce-vr-sub { font-size:12.5px; color:#667085; margin:4px 0 0; display:flex; align-items:center; gap:8px;
  flex-wrap:wrap; }
.ce-vr-vendor { color:#4C5AE4; }
.ce-vr-body { padding:2px 16px 6px; }
.ce-vr-qa { padding:13px 0; border-bottom:1px solid #EFF1F7; }
.ce-vr-qa:last-child { border-bottom:none; }
.ce-vr-q { font-size:12.5px; color:#667085; margin:0 0 5px; }
.ce-vr-a { font-size:13.5px; color:#101828; margin:0; line-height:1.5; }
.ce-radio { width:16px; height:16px; accent-color:#4C5AE4; cursor:pointer; flex:none; }
.ce-menuwrap { position:relative; }
.ce-menu { position:absolute; bottom:calc(100% + 6px); right:0; background:#fff; border:1px solid #E4E7F0;
  border-radius:8px; box-shadow:0 8px 24px rgba(16,24,40,.14); min-width:290px; overflow:hidden; z-index:5; }
.ce-menu button { display:block; width:100%; text-align:left; padding:11px 14px; font-size:13px; background:none;
  border:none; cursor:pointer; color:#344054; font-family:inherit; }
.ce-menu button:hover { background:#F4F5FA; }
.ce-menu button:disabled { color:#98A2B3; cursor:not-allowed; background:none; }
.ce-score { display:inline-block; min-width:44px; margin-right:9px; padding:1px 7px; border-radius:4px;
  font-size:11.5px; font-weight:600; text-align:center; }
.ce-score--success { background:#ECFDF3; color:#027A48; }
.ce-score--warning { background:#FDF3D7; color:#8A6100; }
.ce-score--error { background:#FEF3F2; color:#B42318; }
.ce-score--neutral { background:#F2F4F7; color:#475467; }
.ce-compare-total td { background:#FAFBFF; font-weight:600; color:#101828; }

/* ---------- raise a request form ---------- */
.ce-form { max-width:640px; }
.ce-req-label { display:block; font-size:13.5px; color:#344054; margin-bottom:7px; }
.ce-req-star { color:#B42318; margin-left:3px; }
.ce-w-md { max-width:420px; }
.ce-w-sm { max-width:300px; }
.ce-radios { display:flex; flex-direction:column; gap:11px; }
.ce-radio-row { display:flex; align-items:center; gap:10px; font-size:13.5px; color:#101828; cursor:pointer; }
.ce-prefix { display:flex; max-width:300px; }
.ce-prefix span { display:flex; align-items:center; padding:0 12px; background:#F4F5FA; border:1px solid #D0D5DD;
  border-right:none; border-radius:6px 0 0 6px; font-size:13px; color:#344054; }
.ce-prefix input { border-radius:0 6px 6px 0; }
.ce-autofilled { font-size:12px; color:#667085; margin:6px 0 0; }

/* ---------- question form builder ---------- */
.ce-qitem { display:flex; gap:14px; padding:17px 0; border-bottom:1px solid #EFF1F7; }
.ce-qnum { width:22px; height:22px; border-radius:4px; background:#F4F5FA; color:#4C5AE4; font-size:12px;
  font-weight:600; display:flex; align-items:center; justify-content:center; flex:none; }
.ce-qtext { font-size:13.5px; color:#101828; margin:0 0 11px; }
.ce-scale { display:flex; gap:8px; }
.ce-scale button { width:34px; height:34px; border:1px solid #D0D5DD; border-radius:6px; background:#fff;
  font-size:13px; color:#344054; cursor:pointer; font-family:inherit; }
.ce-scale button.is-on { border-color:#4C5AE4; background:#EEF0FE; color:#3A45C4; }
.ce-addq { display:flex; gap:10px; margin-top:18px; flex-wrap:wrap; }
.ce-btn--dashed { background:#fff; color:#4C5AE4; border:1px dashed #B9C0F2; }
.ce-btn--dashed:hover { background:#F7F8FE; }
.ce-btn--outlineblue { background:#fff; color:#4C5AE4; border:1px solid #4C5AE4; }
.ce-btn--outlineblue:hover { background:#F7F8FE; }

/* ---------- scorer token box ---------- */
.ce-tokenbox { border:1px solid #D0D5DD; border-radius:8px; overflow:hidden; max-width:700px; }
.ce-tokenarea { min-height:96px; padding:12px; display:flex; flex-wrap:wrap; gap:8px; align-content:flex-start;
  cursor:pointer; }
.ce-token { display:inline-flex; align-items:center; gap:7px; background:#EEF0FE; color:#3A45C4; border-radius:4px;
  padding:4px 8px; font-size:12.5px; height:26px; }
.ce-token button { background:none; border:none; color:#3A45C4; cursor:pointer; padding:0; display:flex; }
.ce-tokenfoot { background:#F4F5FA; border-top:1px solid #E4E7F0; padding:10px 12px; font-size:12.5px;
  color:#667085; display:flex; align-items:center; gap:7px; }
.ce-at { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px;
  border-radius:50%; border:1px solid #D0D5DD; font-size:11px; color:#475467; }

/* ---------- review + skeleton ---------- */
.ce-revgrid { display:grid; grid-template-columns:repeat(2, minmax(0,270px)); gap:16px; margin-bottom:26px; }
.ce-cta-panel { display:flex; align-items:center; gap:20px; border:1px solid #E4E7F0; border-radius:8px;
  padding:16px 18px; max-width:860px; }
.ce-skel { background:#EFF1F7; border-radius:4px; }
.ce-pricing { border:1px solid #E4E7F0; border-radius:8px; padding:14px 16px; background:#FBFBFE; max-width:640px; }
.ce-pricing-note { display:flex; align-items:center; gap:6px; font-size:12px; color:#667085; margin:0 0 12px; }
.ce-pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px 14px; }
.ce-insight { border:1px solid #E4E7F0; border-radius:8px; padding:14px 16px; margin-bottom:10px; }
.ce-insight-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; }
.ce-insight-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 18px; font-size:12.5px; }
.ce-insight-lever { font-size:12.5px; color:#4A5578; margin:10px 0 0; line-height:1.55;
  border-top:1px solid #EFF1F7; padding-top:10px; }
.ce-exec { border:1px solid #DCE4FB; background:#F7F9FF; border-radius:8px; padding:16px 18px; margin-bottom:18px; }
.ce-exec p { font-size:13px; color:#3F4A66; line-height:1.6; margin:0 0 10px; }
.ce-exec p:last-child { margin-bottom:0; }
.ce-split { display:grid; grid-template-columns:60fr 40fr; gap:26px; align-items:start; }
.ce-split .ce-list-row { gap:10px; }
@media (max-width:860px){ .ce-split { grid-template-columns:1fr; gap:22px; } }

/* ---------- activity timeline ---------- */
.ce-modal--sm { max-width:560px; height:auto; max-height:82vh; }
.ce-modal-sub { font-size:12.5px; color:#667085; margin:5px 0 0; display:flex; align-items:center; gap:8px;
  flex-wrap:wrap; }
.ce-actionbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:16px 24px;
  border-bottom:1px solid #E4E7F0; }
.ce-tl-row { display:flex; gap:12px; padding:16px 0; }
.ce-tl-dot { width:7px; height:7px; border-radius:50%; background:#98A2B3; margin-top:6px; flex:none; }
.ce-tl-head { display:flex; align-items:baseline; justify-content:space-between; gap:16px; }
.ce-tl-title { font-size:13.5px; font-weight:600; margin:0; }
.ce-tl-date { font-size:12.5px; color:#98A2B3; flex:none; }
.ce-tl-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:12.5px; color:#475467;
  margin:7px 0 0; }
.ce-tl-sep { width:4px; height:4px; border-radius:50%; background:#D0D5DD; flex:none; }
.ce-tl-status--warning { color:#8A6100; }
.ce-tl-status--success { color:#027A48; }
.ce-tl-status--info { color:#3A45C4; }
.ce-tl-status--neutral { color:#475467; }
.ce-tl-status--error { color:#B42318; }
.ce-back { display:inline-flex; align-items:center; gap:6px; background:none; border:none; padding:0;
  color:#4C5AE4; font-size:13px; font-weight:500; cursor:pointer; margin-bottom:16px; }
.ce-back:hover { text-decoration:underline; }
.ce-qa { border:1px solid #E4E7F0; border-radius:8px; overflow:hidden; }
.ce-qa-item { padding:14px 16px; border-bottom:1px solid #EFF1F7; }
.ce-qa-item:last-child { border-bottom:none; }
.ce-qa-q { font-size:13px; font-weight:600; margin:0 0 6px; display:flex; gap:9px; }
.ce-qa-q span { color:#98A2B3; font-weight:500; flex:none; }
.ce-qa-a { font-size:13px; color:#475467; margin:0 0 0 22px; line-height:1.55; }
.ce-qa-a--empty { color:#98A2B3; font-style:italic; }
.ce-kv { display:grid; grid-template-columns:170px 1fr; gap:12px 20px; font-size:13px; margin:0; }
.ce-kv dt { color:#667085; }
.ce-kv dd { margin:0; color:#101828; }
@media (max-width:1080px){ .ce-strip { grid-template-columns:repeat(2,1fr); } .ce-row2 { grid-template-columns:1fr; } }
`;

/* ------------------------------- data ---------------------------------- */

const A_CRM = [
  { q: "What is your licensing model and minimum commitment?", a: "Per seat, billed annually. Minimum 25 seats on the Enterprise tier.", s: 7 },
  { q: "Do you support SCIM provisioning and SAML SSO on our tier?", a: "Yes, both included at no extra cost from Enterprise upwards.", s: 9 },
  { q: "Where would our data be stored?", a: "EU-Frankfurt if elected at contract signature. Cannot be changed later without a migration.", s: 7 },
  { q: "What does implementation look like for a 60-person revenue team?", a: "6–8 weeks with a named onboarding lead. Data migration is quoted separately.", s: 8 },
];

const A_SEC = [
  { q: "What is your licensing model and minimum commitment?", a: "Per endpoint with an annual commitment. Tiered discount above 1,000 endpoints.", s: 8 },
  { q: "Do you support air-gapped deployments?", a: "Yes, using a local update mirror. Managed detection is not available in that mode.", s: 7 },
  { q: "What is your mean time to detect for known threat families?", a: "Under 60 seconds on the managed tier, verified in our last customer audit.", s: 9 },
  { q: "Which SIEM tools do you integrate with out of the box?", a: "Splunk, Microsoft Sentinel, Google Chronicle and Elastic.", s: 8 },
];

const A_CLM_1 = [
  { q: "Describe your SOC 2 Type II status and share the most recent report date.", a: "SOC 2 Type II, report dated 14 Mar 2026. Available under NDA.", s: 9 },
  { q: "What is your standard implementation timeline for 1,200 employees?", a: "8–10 weeks including two weeks of template migration.", s: 9 },
  { q: "List all data residency regions available.", a: "US-East, EU-Frankfurt and AU-Sydney. EU residency is Enterprise only.", s: 7 },
  { q: "Do you support SCIM provisioning and SAML SSO on our tier?", a: "Both are included from the Business tier upwards.", s: 9 },
];

const A_CLM_2 = [
  { q: "Describe your SOC 2 Type II status and share the most recent report date.", a: "SOC 2 Type II and ISO 27001. Latest report 02 Feb 2026.", s: 9 },
  { q: "What is your standard implementation timeline for 1,200 employees?", a: "12–14 weeks. We recommend a phased rollout by business unit.", s: 6 },
  { q: "List all data residency regions available.", a: "US, EU-Ireland, UK and Canada. EU available on all paid tiers.", s: 9 },
  { q: "Do you support SCIM provisioning and SAML SSO on our tier?", a: "SAML on all tiers, SCIM requires the Identity add-on.", s: 6 },
];

const A_CLM_3 = [
  { q: "Describe your SOC 2 Type II status and share the most recent report date.", a: "SOC 2 Type II, report dated 20 Dec 2025. Renewal audit is in progress.", s: 6 },
  { q: "What is your standard implementation timeline for 1,200 employees?", a: "16 weeks for a full deployment with custom clause libraries.", s: 5 },
  { q: "List all data residency regions available.", a: "US and EU-Frankfurt only at present. APAC is on the roadmap for 2027.", s: 6 },
  { q: "Do you support SCIM provisioning and SAML SSO on our tier?", a: "Yes to both, no add-on required.", s: 9 },
];

const A_ENG = [
  { q: "How do you anonymise responses below a reporting threshold?", a: "Results are suppressed below five responses per group and admins cannot unmask them.", s: 9 },
  { q: "What is your standard implementation timeline?", a: "4 weeks, or 6 if HRIS sync is in scope.", s: 8 },
  { q: "Do you support SCIM provisioning and SAML SSO on our tier?", a: "Yes, both are standard.", s: 8 },
];

const A_DW = [
  { q: "What is your pricing model for compute and storage?", a: "Separate metering. Compute per credit-second, storage at $23 per TB per month.", s: 8 },
  { q: "Describe your uptime commitment and the credit schedule.", a: "99.9% monthly uptime with tiered service credits from 10% to 50%.", s: 9 },
  { q: "Which regions can we run in without a private deployment?", a: "All 14 public regions, including EU-Frankfurt and AP-Mumbai.", s: 9 },
];

const SEED_REQUESTS = [
  {
    id: "req-1",
    name: "CRM replacement for revenue team",
    type: "RFI",
    vendors: [
      { name: "Salesforce", contact: "Rachel Kim", role: "Enterprise AE", status: "waiting", date: "15 Aug 2026", read: true, answers: [] },
      { name: "HubSpot", contact: "Marcus Johnson", role: "Solutions Consultant", status: "waiting", date: "15 Aug 2026", read: true, answers: [] },
      { name: "Zoho CRM", contact: "Nathan Patel", role: "Account Manager", status: "waiting", date: "15 Aug 2026", read: true, answers: [] },
    ],
    completed: false,
    created: "12 Aug 2026",
    createdBy: { name: "Priya Raman", email: "priya.raman@democorp.com", initials: "PR" },
    deadline: "05 Sep 2026",
  },
  {
    id: "req-2",
    name: "Endpoint security refresh",
    type: "RFI",
    vendors: [
      { name: "CrowdStrike", contact: "Emily Chen", role: "Enterprise AE", status: "responded", date: "Today", read: false, answers: A_SEC },
      { name: "SentinelOne", contact: "David Okafor", role: "Account Executive", status: "waiting", date: "12 Aug 2026", read: true, answers: [] },
      { name: "Sophos", contact: "Olivia Torres", role: "Sales Engineer", status: "waiting", date: "12 Aug 2026", read: true, answers: [] },
    ],
    completed: false,
    created: "09 Aug 2026",
    createdBy: { name: "Daniel Osei", email: "daniel.osei@democorp.com", initials: "DO" },
    deadline: "02 Sep 2026",
  },
  {
    id: "req-3",
    name: "Contract lifecycle management",
    type: "RFP",
    vendors: [
      { name: "Ironclad", contact: "Sarah Mitchell", role: "Enterprise AE", status: "responded", date: "09 Aug 2026", read: true, answers: A_CLM_1 },
      { name: "DocuSign CLM", contact: "James Carter", role: "Account Director", status: "responded", date: "Today", read: false, answers: A_CLM_2 },
      { name: "Icertis", contact: "Sophia Laurent", role: "Solutions Consultant", status: "responded", date: "Today", read: false, answers: A_CLM_3 },
    ],
    completed: false,
    created: "04 Aug 2026",
    createdBy: { name: "Meera Sundar", email: "meera.sundar@democorp.com", initials: "MS" },
    deadline: "28 Aug 2026",
  },
  {
    id: "req-4",
    name: "Employee engagement survey tool",
    type: "RFI",
    vendors: [
      { name: "Culture Amp", contact: "Ethan Brooks", role: "Account Executive", status: "responded", date: "06 Aug 2026", read: true, answers: A_ENG },
      { name: "Lattice", contact: "Aisha Rahman", role: "Enterprise AE", status: "waiting", date: "04 Aug 2026", read: true, answers: [] },
      { name: "Officevibe", contact: "Tom Nguyen", role: "Account Manager", status: "waiting", date: "04 Aug 2026", read: true, answers: [] },
    ],
    completed: false,
    created: "01 Aug 2026",
    createdBy: { name: "Aaron Blake", email: "aaron.blake@democorp.com", initials: "AB" },
    deadline: "10 Sep 2026",
  },
  {
    id: "req-5",
    name: "Data warehouse consolidation",
    type: "RFP",
    vendors: [
      { name: "Snowflake", contact: "Lucas Meyer", role: "Enterprise AE", status: "responded", date: "30 Jul 2026", read: true, answers: A_DW },
      { name: "Databricks", contact: "Nina Rossi", role: "Account Director", status: "responded", date: "01 Aug 2026", read: true, answers: A_DW },
    ],
    completed: true,
    created: "21 Jul 2026",
    createdBy: { name: "Lena Fischer", email: "lena.fischer@democorp.com", initials: "LF" },
    deadline: "15 Aug 2026",
  },
];

const RESPONSES_CLM = [
  { q: "Describe your SOC 2 Type II status and share the most recent report date.",
    a: "SOC 2 Type II, report dated 14 Mar 2026. Available under NDA through our trust portal." },
  { q: "What is your standard implementation timeline for an organisation of 1,200 employees?",
    a: "8–10 weeks for a standard rollout, including two weeks of template migration." },
  { q: "List all data residency regions available and confirm where our data would be stored.",
    a: "US-East, EU-Frankfurt and AU-Sydney. EU residency is Enterprise tier only." },
  { q: "Do you support SCIM provisioning and SAML SSO on our contracted tier?",
    a: "Both are included from the Business tier upwards at no extra cost." },
];

const RESPONSES_DW = [
  { q: "What is your pricing model for compute and storage?",
    a: "Separate metering. Compute billed per credit-second, storage at $23 per TB per month." },
  { q: "Describe your uptime commitment and the credit schedule.",
    a: "99.9% monthly uptime, tiered service credits from 10% to 50% of the monthly fee." },
  { q: "Which regions can we run in without a private deployment?",
    a: "All 14 public regions, including EU-Frankfurt and AP-Mumbai." },
];

const RESPONSES_ENG = [
  { q: "How do you anonymise survey responses below a reporting threshold?",
    a: "Results are suppressed below five responses per group and cannot be unmasked by admins." },
  { q: "What is your standard implementation timeline?",
    a: "4 weeks, or 6 if HRIS sync is in scope." },
  { q: "Do you support SCIM provisioning and SAML SSO on our contracted tier?", a: "" },
];

const SEED_FINALISED = [
  {
    id: "fv-1", vendor: "Snowflake", request: "Data warehouse consolidation",
    status: "Procurement Completed", owner: "Lena Fischer", updated: "24 Aug 2026",
    activities: [
      { id: "a-11", type: "questionnaire", title: "Questionnaire sent to vendor", date: "26 Jul 2026",
        status: { text: "Responded", tone: "success" }, meta: ["RFP", "3 questions", "answered 30 Jul 2026"],
        responses: RESPONSES_DW },
      { id: "a-12", type: "email", title: "Email sent to vendor", date: "02 Aug 2026",
        status: { text: "Replied", tone: "success" }, meta: ["Pricing clarification", "1 recipient"],
        subject: "Follow-up on storage pricing",
        body: "Thanks for the responses. Could you confirm whether the $23/TB storage rate holds for EU-Frankfurt, and what the committed-use discount looks like at a three-year term?" },
      { id: "a-13", type: "upload", title: "Document uploaded", date: "11 Aug 2026",
        status: { text: "Shared with evaluators", tone: "info" }, meta: ["Snowflake_MSA_draft.pdf", "1.4 MB"],
        fileName: "Snowflake_MSA_draft.pdf" },
      { id: "a-14", type: "procurement", title: "Procurement request created", date: "16 Aug 2026",
        status: { text: "Completed", tone: "success" }, meta: ["Contract signed 24 Aug 2026"], link: "PR-2055" },
    ],
  },
  {
    id: "fv-2", vendor: "Databricks", request: "Data warehouse consolidation",
    status: "Vendor Discarded", owner: "Lena Fischer", updated: "20 Aug 2026",
    activities: [
      { id: "a-21", type: "questionnaire", title: "Questionnaire sent to vendor", date: "26 Jul 2026",
        status: { text: "Responded", tone: "success" }, meta: ["RFP", "3 questions", "answered 01 Aug 2026"],
        responses: RESPONSES_DW },
    ],
  },
  {
    id: "fv-3", vendor: "Ironclad", request: "Contract lifecycle management",
    status: "Procurement Started", owner: "Meera Sundar", updated: "26 Aug 2026",
    activities: [
      { id: "a-31", type: "questionnaire", title: "Questionnaire sent to vendor", date: "04 Aug 2026",
        status: { text: "Responded", tone: "success" }, meta: ["RFP", "4 questions", "answered 09 Aug 2026"],
        responses: RESPONSES_CLM },
      { id: "a-32", type: "questionnaire", title: "Questionnaire sent to vendor", date: "18 Aug 2026",
        status: { text: "Waiting on vendor", tone: "warning" }, meta: ["Security RFI", "due in 3 days", "6 questions"],
        responses: [
          { q: "Confirm your penetration test cadence and who performs it.", a: "" },
          { q: "Do you hold cyber liability cover of at least $10M?", a: "" },
        ] },
      { id: "a-33", type: "upload", title: "Document uploaded", date: "21 Aug 2026",
        status: { text: "Shared with evaluators", tone: "info" }, meta: ["Ironclad_pricing_v2.xlsx", "88 KB"],
        fileName: "Ironclad_pricing_v2.xlsx" },
      { id: "a-34", type: "procurement", title: "Procurement request created", date: "26 Aug 2026",
        status: { text: "Pending approval", tone: "warning" }, meta: ["Legal review", "due in 7 days"], link: "PR-2061" },
    ],
  },
  {
    id: "fv-4", vendor: "Culture Amp", request: "Employee engagement survey tool",
    status: "Vendor Finalised", owner: "Aaron Blake", updated: "27 Aug 2026",
    activities: [
      { id: "a-41", type: "questionnaire", title: "Questionnaire sent to vendor", date: "12 Aug 2026",
        status: { text: "Waiting on vendor", tone: "warning" }, meta: ["RFI", "3 questions", "2 of 3 answered"],
        responses: RESPONSES_ENG },
    ],
  },
];

const EXISTING_APPS = [
  { name: "Salesforce", category: "CRM", status: "In use", tone: "info",
    detail: "340 licences · renews 12 Mar 2027" },
  { name: "Zoho CRM", category: "CRM", status: "Trial", tone: "warning",
    detail: "12 users · trial ends 20 Sep 2026" },
  { name: "HubSpot Marketing Hub", category: "Marketing automation", status: "In use", tone: "info",
    detail: "85 licences · renews 30 Sep 2026" },
  { name: "Ironclad", category: "Contract lifecycle", status: "Procurement started", tone: "warning",
    detail: "PR-2061 · pending approval" },
  { name: "Culture Amp", category: "Employee engagement", status: "Vendor finalised", tone: "info",
    detail: "Finalised 27 Aug 2026 · procurement not started" },
];

const SUGGESTED_VENDORS = [
  { name: "Salesforce", blurb: "Enterprise CRM. Already in your stack for support — 340 licences, renews Mar 2027." },
  { name: "HubSpot", blurb: "Mid-market CRM with native marketing suite. Not currently contracted." },
  { name: "Zoho CRM", blurb: "Lower price point, strong for smaller revenue teams. Not currently contracted." },
  { name: "Pipedrive", blurb: "Pipeline-first CRM. Limited enterprise admin controls." },
  { name: "Microsoft Dynamics 365", blurb: "Deep Office and Teams integration. Heavier implementation effort." },
  { name: "Freshsales", blurb: "Fast to deploy with built-in telephony. Thinner reporting than the larger suites." },
  { name: "Close", blurb: "Built for outbound-heavy teams. No native marketing automation." },
];



/* ---------------------------------------------------------------------------
   LOCKED PRICING AND BENCHMARKS
   Vendors answer a pricing question against a fixed schema rather than free
   text. That is what makes the numbers comparable, and comparable numbers are
   what the benchmark and the executive summary are built on.
--------------------------------------------------------------------------- */

const PRICING_SCHEMA = [
  { key: "unit",     label: "Pricing unit", hint: "Fixed list, vendor cannot change" },
  { key: "qty",      label: "Quantity",     hint: "Whole number" },
  { key: "term",     label: "Term",         hint: "Months" },
  { key: "currency", label: "Currency",     hint: "ISO code" },
  { key: "discount", label: "Discount",     hint: "% off list" },
  { key: "annual",   label: "Annual total", hint: "Calculated, read only" },
];

const VENDOR_PRICING = {
  "CrowdStrike":  { unit: "Per endpoint", qty: 1200, term: 36, currency: "USD", discount: 18,
                    annual: 246000, notice: 90, uplift: "None",   payment: "Annual upfront" },
  "Ironclad":     { unit: "Per seat", qty: 180, term: 24, currency: "USD", discount: 12,
                    annual: 151200, notice: 60, uplift: "5% cap", payment: "Annual upfront" },
  "Icertis":      { unit: "Per seat", qty: 180, term: 36, currency: "USD", discount: 22,
                    annual: 194400, notice: 90, uplift: "None",   payment: "Quarterly" },
  "DocuSign CLM": { unit: "Per seat", qty: 180, term: 12, currency: "USD", discount: 8,
                    annual: 129600, notice: 30, uplift: "4% cap", payment: "Annual upfront" },
  "Snowflake":    { unit: "Consumption", qty: 1, term: 36, currency: "USD", discount: 25,
                    annual: 420000, notice: 60, uplift: "None",   payment: "Annual upfront" },
  "Databricks":   { unit: "Consumption", qty: 1, term: 24, currency: "USD", discount: 20,
                    annual: 388000, notice: 30, uplift: "6% cap", payment: "Quarterly" },
  "Culture Amp":  { unit: "Per employee", qty: 900, term: 24, currency: "USD", discount: 15,
                    annual: 81000, notice: 30, uplift: "5% cap",  payment: "Annual upfront" },
};

// Cohort figures are per unit per year, except where the unit is consumption.
const PRICE_BENCHMARK = {
  "req-2": { cohort: "Endpoint security, 1,000 to 1,500 endpoints", n: 186, unit: "per endpoint",
             p25: 168, median: 205, p75: 243 },
  "req-3": { cohort: "Contract lifecycle, 150 to 250 seats", n: 132, unit: "per seat",
             p25: 690, median: 845, p75: 1010 },
  "req-4": { cohort: "Employee engagement, 750 to 1,000 employees", n: 204, unit: "per employee",
             p25: 74, median: 92, p75: 118 },
  "req-5": { cohort: "Cloud data platform, mid-market", n: 97, unit: "annual spend",
             p25: 310000, median: 395000, p75: 470000 },
};

const TERM_BENCHMARK = [
  { key: "term",    label: "Contract term", cohort: "24 months median",
    read: (p) => `${p.term} months`,   ok: (p) => p.term <= 24 },
  { key: "notice",  label: "Notice period", cohort: "30 days median",
    read: (p) => `${p.notice} days`,   ok: (p) => p.notice <= 30 },
  { key: "uplift",  label: "Uplift cap", cohort: "71% of contracts have one",
    read: (p) => p.uplift,             ok: (p) => p.uplift !== "None" },
  { key: "payment", label: "Payment terms", cohort: "Annual upfront in 64%",
    read: (p) => p.payment,            ok: (p) => p.payment === "Annual upfront" },
];

/* Negotiation playbook. Received paper is compared against this clause by clause. */
const PLAYBOOK = [
  { clause: "Uplift cap", position: "5% or lower, fixed for the full term" },
  { clause: "Notice period", position: "30 days or fewer to cancel" },
  { clause: "Payment terms", position: "Annual upfront only against a discount" },
  { clause: "Auto-renewal", position: "No evergreen renewal" },
  { clause: "Termination", position: "For convenience with 30 days notice" },
  { clause: "Liability cap", position: "12 months fees, uncapped for data breach" },
];

const VENDOR_PAPER = {
  "Ironclad":     { autoRenew: "Evergreen, 60 days notice", termination: "For cause only",
                    liability: "12 months fees" },
  "Icertis":      { autoRenew: "Evergreen, 90 days notice", termination: "For cause only",
                    liability: "6 months fees" },
  "DocuSign CLM": { autoRenew: "No evergreen renewal", termination: "For convenience, 30 days",
                    liability: "12 months fees" },
  "CrowdStrike":  { autoRenew: "Evergreen, 90 days notice", termination: "For cause only",
                    liability: "12 months fees" },
  "Snowflake":    { autoRenew: "Evergreen, 60 days notice", termination: "For cause only",
                    liability: "12 months fees" },
  "Databricks":   { autoRenew: "No evergreen renewal", termination: "For convenience, 60 days",
                    liability: "6 months fees" },
  "Culture Amp":  { autoRenew: "Evergreen, 30 days notice", termination: "For convenience, 30 days",
                    liability: "12 months fees" },
};

const vrMoney = (n) => "$" + Math.round(n).toLocaleString();
const perUnit = (p) => (p && p.qty > 1 ? Math.round(p.annual / p.qty) : p ? p.annual : 0);

const QUESTION_LIBRARY = [
  "Describe your SOC 2 Type II status and share the most recent report date.",
  "What is your standard implementation timeline for an organisation of 1,200 employees?",
  "List all data residency regions available and confirm where our data would be stored.",
  "Do you support SCIM provisioning and SAML SSO on our contracted tier?",
];

/* ---------------------------- derived logic ----------------------------- */

// Status text and category come straight from the requirements table.
function requestStatus(r) {
  if (r.completed) return { text: "Completed", category: "Closed Out", dot: false, tone: "success" };
  const responded = r.vendors.filter((v) => v.status === "responded").length;
  const unread = r.vendors.filter((v) => v.status === "responded" && !v.read).length;
  const text = `${responded} of ${r.vendors.length} vendors responded`;
  if (unread > 0) return { text, category: "Needs Review", dot: true, tone: "info" };
  return { text, category: "Awaiting Responses", dot: false, tone: "neutral" };
}

const FV_TONE = {
  "Vendor Finalised": "info",
  "Vendor Discarded": "error",
  "Procurement Started": "warning",
  "Procurement Completed": "success",
};

const avgScore = (v) =>
  v.answers.length ? v.answers.reduce((t, a) => t + (a.s || 0), 0) / v.answers.length : 0;

const scoreTone = (s) => (s == null ? "neutral" : s >= 8 ? "success" : s >= 6 ? "warning" : "error");

/* ------------------------------ primitives ------------------------------ */

const VPill = ({ tone = "neutral", dot = false, children, ...rest }) => (
  <span className={`ce-pill ce-pill--${tone}`} {...rest}>
    {dot && <span className="ce-dot" />}
    {children}
  </span>
);

const VBtn = ({ variant = "secondary", size, children, ...rest }) => (
  <button className={`ce-btn ce-btn--${variant}${size === "sm" ? " ce-btn--sm" : ""}`} {...rest}>
    {children}
  </button>
);

const VField = ({ label, help, children }) => (
  <div className="ce-field">
    {label && <label className="ce-label">{label}</label>}
    {children}
    {help && <p className="ce-help">{help}</p>}
  </div>
);

const VPlaceholder = ({ children }) => (
  <div className="ce-placeholder">
    <Info size={15} style={{ flex: "none", marginTop: 1, color: "#4C5AE4" }} />
    <span>{children}</span>
  </div>
);

const VToolbar = ({ count, noun, query, onQuery }) => (
  <div className="ce-toolbar">
    <div className="ce-search">
      <Search size={15} color="#98A2B3" />
      <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search" />
    </div>
    <button className="ce-iconbtn" title="Filter"><SlidersHorizontal size={15} /></button>
    <div className="ce-select">Default View <ChevronDown size={14} /></div>
    <button className="ce-iconbtn" title="Share view"><Share2 size={15} /></button>
    <div className="ce-toolbar-right">
      <span className="ce-count">{count} {noun}</span>
      <button className="ce-iconbtn" title="Edit columns"><LayoutGrid size={15} /></button>
      <button className="ce-iconbtn" title="More"><MoreVertical size={15} /></button>
    </div>
  </div>
);

const VPager = ({ total }) => (
  <div className="ce-pager">
    <span>Rows per page</span>
    <div className="ce-select" style={{ height: 30 }}>10 <ChevronDown size={13} /></div>
    <span>1–{total} of {total}</span>
    <button className="ce-iconbtn" style={{ width: 30, height: 30 }}><ChevronLeft size={14} /></button>
    <button className="ce-iconbtn" style={{ width: 30, height: 30 }}><ChevronRight size={14} /></button>
  </div>
);

/* ------------------------ create request stepper ------------------------ */

const STEPS = ["Describe request", "Questionnaire details", "Requirements", "Delivery", "Review"];

const FORM_TEMPLATES = {
  "Standard Vendor Evaluation": [
    { id: "q1", text: "What is your licensing model?", type: "select", required: true,
      options: ["Per seat", "Per endpoint", "Consumption", "Flat platform fee"] },
    { id: "q2", text: "What does implementation involve?", type: "text", required: true },
    { id: "q3", text: "How is support delivered?", type: "select", required: true,
      options: ["Named CSM", "Shared queue", "Partner-delivered"] },
    { id: "q4", text: "Would your standard tier cover our requirement?", type: "select", required: true,
      options: ["Yes", "No", "Only with an add-on"] },
    { id: "q5", text: "Does any customer or company data go into it?", type: "radio", required: true,
      options: ["Yes", "No"] },
    { id: "q6", text: "How disruptive would a migration be for our team?", type: "scale", required: false },
    { id: "q7", text: "Submit your pricing.", type: "pricing", required: true },
  ],
  "Security and Compliance Review": [
    { id: "q1", text: "Describe your SOC 2 Type II status.", type: "text", required: true },
    { id: "q2", text: "Where would our data be stored?", type: "select", required: true,
      options: ["US only", "EU only", "Customer elects at signature"] },
    { id: "q3", text: "Do you support SCIM and SAML SSO on our tier?", type: "radio", required: true,
      options: ["Yes", "No"] },
  ],
};

const SCORER_OPTIONS = ["IT Procurement Team", "Security Team", "Finance Team",
  "Priya Raman", "Daniel Osei", "Meera Sundar"];

const DEADLINE_OPTIONS = ["7 days", "14 days", "21 days", "30 days"];
const DECISION_OPTIONS = ["15 days", "30 days", "45 days", "60 days"];

function QuestionPreview({ q }) {
  const [scale, setScale] = useState(null);
  if (q.type === "pricing") {
    return (
      <div className="ce-pricing">
        <p className="ce-pricing-note">
          <Lock size={12} /> Locked format. Every vendor answers these fields the same way, so
          the numbers can be compared and benchmarked.
        </p>
        <div className="ce-pricing-grid">
          {PRICING_SCHEMA.map((f) => (
            <div key={f.key}>
              <label className="ce-req-label">{f.label}</label>
              <input className="ce-input" placeholder={f.hint} readOnly />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (q.type === "text") {
    return <input className="ce-input" style={{ maxWidth: 520 }} placeholder="Type your answer" readOnly />;
  }
  if (q.type === "select") {
    return (
      <select className="ce-selectbox" style={{ maxWidth: 210 }} defaultValue="">
        <option value="">Select</option>
        {(q.options || []).map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }
  if (q.type === "radio") {
    return (
      <div className="ce-radios">
        {(q.options || []).map((o) => (
          <label key={o} className="ce-radio-row">
            <input type="radio" className="ce-radio" name={`preview-${q.id}`} readOnly />
            {o}
          </label>
        ))}
      </div>
    );
  }
  return (
    <div className="ce-scale">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} className={scale === n ? "is-on" : ""} onClick={() => setScale(n)}>{n}</button>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="ce-list">
      {[0, 1, 2].map((i) => (
        <div key={i} className="ce-list-row">
          <div style={{ flex: 1 }}>
            <div className="ce-skel" style={{ width: 140, height: 13, marginBottom: 9 }} />
            <div className="ce-skel" style={{ width: "70%", height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateRequestModal({ onClose, onSend, prefill }) {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState(prefill || "");
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [picked, setPicked] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [qName, setQName] = useState("");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState({});
  const [template, setTemplate] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [decision, setDecision] = useState("");
  const [scorers, setScorers] = useState([]);
  const [scorerMenu, setScorerMenu] = useState(false);

  // Vendors are matched from the description itself — no separate match action.
  React.useEffect(() => {
    if (brief.trim().length < 8) { setMatched(false); setMatching(false); return; }
    setMatching(true);
    const t = setTimeout(() => { setMatching(false); setMatched(true); }, 700);
    return () => clearTimeout(t);
  }, [brief]);

  // Anything already owned or in procurement shows on the right, not as a new suggestion.
  const suggested = SUGGESTED_VENDORS.filter(
    (v) => !EXISTING_APPS.some((a) => a.name === v.name));

  const toggleVendor = (name) =>
    setPicked((p) => (p.includes(name) ? p.filter((v) => v !== name) : [...p, name]));

  const chooseTemplate = (name) => {
    setTemplate(name);
    setUploaded(false);
    setUploadName("");
    setQuestions(FORM_TEMPLATES[name] ? FORM_TEMPLATES[name].map((q) => ({ ...q })) : []);
  };

  const canContinue = [
    brief.trim().length > 0 && picked.length > 0,
    qName.trim().length > 0,
    template !== "" && questions.length > 0,
    deadline !== "" && decision !== "" && scorers.length > 0,
    true,
  ][step];

  return (
    <div className="ce-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ce-modal" role="dialog" aria-label="Create new request">
        <div className="ce-modal-head">
          <h3 className="ce-modal-title">Create new request</h3>
          <button className="ce-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="ce-stepper">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`ce-step${i === step ? " is-current" : ""}${i < step ? " is-done" : ""}`}>
                <span className="ce-step-num">{i < step ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                <span className="ce-step-label">{label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="ce-step-line" />}
            </React.Fragment>
          ))}
        </div>

        <div className="ce-modal-body">
          {/* Step 1 — description, with matched vendors underneath */}
          {step === 0 && (
            <>
              <VField
                label="What are you looking for?"
                help={<><Sparkles size={13} color="#4C5AE4" /> AI matches you with vendors as you type</>}
              >
                <textarea
                  className="ce-textarea"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="We need a CRM for a 60-person revenue team. Must support SSO, SCIM and EU data residency. Budget is around $90k a year."
                />
              </VField>

              <hr className="ce-hr" />

              {comparing ? (
                <>
                  <div className="ce-section-row">
                    <h4 className="ce-section-head" style={{ margin: 0 }}>Vendor comparison</h4>
                    <VBtn size="sm" onClick={() => setComparing(false)}>Back to list</VBtn>
                  </div>
                  <table className="ce-compare">
                    <thead>
                      <tr>
                        <th style={{ width: 150 }}>Criteria</th>
                        {picked.map((v) => <th key={v}>{v}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {["Fit to your description", "SSO / SCIM", "EU data residency", "Indicative annual cost",
                        "Already in your stack"].map((c) => (
                        <tr key={c}>
                          <td style={{ color: "#667085" }}>{c}</td>
                          {picked.map((v) => <td key={v}>PLACEHOLDER — AI comparison output</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="ce-split">
                  {/* left, 60% — suggested vendors */}
                  <div>
                    <div className="ce-section-row">
                      <h4 className="ce-section-head" style={{ margin: 0 }}>Suggested vendors</h4>
                      {matched && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <VBtn size="sm" disabled={picked.length < 2} onClick={() => setComparing(true)}>
                            <Sparkles size={13} /> Compare with AI
                          </VBtn>
                          <VBtn size="sm"><Plus size={13} /> Add a vendor</VBtn>
                        </div>
                      )}
                    </div>
                    <p className="ce-section-desc">
                      Matched to your description. Select who should receive the questionnaire.
                    </p>

                    {matching ? (
                      <SkeletonList />
                    ) : !matched ? (
                      <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
                        <Sparkles size={22} color="#98A2B3" />
                        <h4>Vendors appear as you describe the request</h4>
                        <p>Write what you need above and matches show up here.</p>
                      </div>
                    ) : (
                      <div className="ce-list">
                        {suggested.map((v) => (
                          <label key={v.name}
                            className={`ce-list-row${picked.includes(v.name) ? " is-selected" : ""}`}>
                            <input type="checkbox" className="ce-check" checked={picked.includes(v.name)}
                              onChange={() => toggleVendor(v.name)} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="ce-list-title">{v.name}</p>
                              <p className="ce-list-desc">{v.blurb}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* right, 40% — what you already own */}
                  <div>
                    <h4 className="ce-section-head">Already in your stack</h4>
                    <p className="ce-section-desc">
                      What you already pay for, are trialling, or have procurement underway for.
                    </p>

                    {matching ? (
                      <SkeletonList />
                    ) : !matched ? (
                      <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
                        <Grid3x3 size={22} color="#98A2B3" />
                        <h4>Nothing to check yet</h4>
                        <p>Anything you already own shows up here.</p>
                      </div>
                    ) : (
                      <div className="ce-list">
                        {EXISTING_APPS.map((app) => (
                          <div key={app.name} className="ce-list-row">
                            <div className="ce-vr-avatar">{app.name.slice(0, 2).toUpperCase()}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="ce-list-title">{app.name}</p>
                              <p className="ce-list-desc">{app.category}</p>
                              <p className="ce-list-desc">{app.detail}</p>
                            </div>
                            <VPill tone={app.tone}>{app.status}</VPill>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2 — questionnaire details */}
          {step === 1 && (
            <>
              <h4 className="ce-section-head">Questionnaire details</h4>
              <p className="ce-section-desc">Name the questionnaire and set who receives it.</p>
              <VField label="Questionnaire name">
                <input className="ce-input" value={qName} onChange={(e) => setQName(e.target.value)}
                  placeholder="CRM evaluation — FY27" />
              </VField>
              <VField label="Vendors invited to respond">
                <div className="ce-list">
                  {picked.map((v) => (
                    <div key={v} className="ce-list-row" style={{ alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <p className="ce-list-title">{v}</p>
                        <p className="ce-list-desc">{contacts[v] || "No contact added yet"}</p>
                      </div>
                      <VBtn size="sm" onClick={() =>
                        setContacts((c) => ({ ...c, [v]: `sales@${v.toLowerCase().replace(/\s/g, "")}.com` }))}>
                        <Plus size={13} /> {contacts[v] ? "Edit contact" : "Add contact"}
                      </VBtn>
                    </div>
                  ))}
                </div>
              </VField>
              <VField label="Message to the vendors">
                <textarea className="ce-textarea" value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi — we're evaluating options for our revenue team and would like your response to the questions below by the deadline." />
              </VField>
            </>
          )}

          {/* Step 3 — requirements */}
          {step === 2 && (
            <>
              <div className="ce-field">
                <label className="ce-req-label">Select Form Template<span className="ce-req-star">*</span></label>
                <select className="ce-selectbox" style={{ maxWidth: 280 }} value={template}
                  onChange={(e) => chooseTemplate(e.target.value)}>
                  <option value="">Select</option>
                  {Object.keys(FORM_TEMPLATES).map((t) => <option key={t}>{t}</option>)}
                  <option>Start from scratch</option>
                  <option>Upload an existing form</option>
                </select>
              </div>

              {template === "Upload an existing form" && !uploaded && (
                <div style={{ maxWidth: 560, marginBottom: 8 }}>
                  <VPlaceholder>
                    File picker and drag-and-drop target are not specified in the requirements. The Text Input
                    below stands in for the upload control.
                  </VPlaceholder>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label className="ce-req-label">Form file</label>
                      <input className="ce-input" value={uploadName} placeholder="Security_RFP_2026.docx"
                        onChange={(e) => setUploadName(e.target.value)} />
                    </div>
                    <VBtn variant="primary" disabled={!uploadName.trim()} onClick={() => {
                      setUploaded(true);
                      setQuestions(FORM_TEMPLATES["Security and Compliance Review"].map((q) => ({ ...q, id: `${q.id}-up` })));
                    }}>
                      <Upload size={14} /> Upload form
                    </VBtn>
                  </div>
                </div>
              )}

              {!template ? (
                <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
                  <FileText size={22} color="#98A2B3" />
                  <h4>Pick a template to see its questions</h4>
                  <p>Load a saved template, start from scratch, or upload a form you already have.</p>
                </div>
              ) : template === "Upload an existing form" && !uploaded ? null : (
                <>
                  <h4 className="ce-section-head" style={{ margin: "22px 0 6px" }}>Questions</h4>
                  {template === "Upload an existing form" && (
                    <p className="ce-section-desc">
                      Read from {uploadName}. Check each question and its answer type before sending.
                    </p>
                  )}
                  {questions.length === 0 && (
                    <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
                      <FileText size={22} color="#98A2B3" />
                      <h4>No questions yet</h4>
                      <p>Add them manually, pull from the library, or draft them with AI.</p>
                    </div>
                  )}
                  <div>
                    {questions.map((q, i) => (
                      <div key={q.id} className="ce-qitem">
                        <span className="ce-qnum">{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="ce-qtext">
                            {q.text}{q.required && <span className="ce-req-star">*</span>}
                          </p>
                          <QuestionPreview q={q} />
                        </div>
                        <button className="ce-x" title="Remove question"
                          onClick={() => setQuestions((arr) => arr.filter((x) => x.id !== q.id))}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="ce-addq">
                    <VBtn size="sm"
                      disabled={questions.some((q) => q.type === "pricing")}
                      onClick={() => setQuestions((arr) => [...arr,
                        { id: `q-price-${Date.now()}`, text: "Submit your pricing.", type: "pricing", required: true }])}>
                      <Lock size={13} /> Add pricing question
                    </VBtn>
                    <button className="ce-btn ce-btn--sm ce-btn--dashed"
                      onClick={() => setQuestions((arr) => [...arr,
                        { id: `q-${Date.now()}`, text: "New question", type: "text", required: false }])}>
                      <Plus size={13} /> Add Question Manually
                    </button>
                    <button className="ce-btn ce-btn--sm ce-btn--outlineblue"
                      onClick={() => setQuestions((arr) => [...arr,
                        { id: `q-${Date.now()}`, text: QUESTION_LIBRARY[arr.length % QUESTION_LIBRARY.length],
                          type: "text", required: true }])}>
                      <Plus size={13} /> Add Question From Library
                    </button>
                    <button className="ce-btn ce-btn--sm ce-btn--outlineblue"
                      onClick={() => setQuestions((arr) => [...arr,
                        { id: `q-${Date.now()}`, text: "How would you price a three-year commitment?",
                          type: "text", required: true }])}>
                      <Sparkles size={13} /> Add Question With AI
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 4 — delivery */}
          {step === 3 && (
            <>
              <div className="ce-row2" style={{ maxWidth: 700 }}>
                <div className="ce-field">
                  <label className="ce-req-label">Vendor response deadline<span className="ce-req-star">*</span></label>
                  <select className="ce-selectbox" value={deadline} onChange={(e) => setDeadline(e.target.value)}>
                    <option value="">Select</option>
                    {DEADLINE_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="ce-field">
                  <label className="ce-req-label">Target Decision in<span className="ce-req-star">*</span></label>
                  <select className="ce-selectbox" value={decision} onChange={(e) => setDecision(e.target.value)}>
                    <option value="">Select</option>
                    {DECISION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <h4 className="ce-section-head" style={{ margin: "8px 0 4px" }}>
                Who scores the responses?<span className="ce-req-star">*</span>
              </h4>
              <p className="ce-section-desc">
                Groups score as a team — any member can submit on the group's behalf.
              </p>

              <div className="ce-tokenbox">
                <div className="ce-tokenarea" onClick={() => setScorerMenu((o) => !o)}>
                  {scorers.length === 0 && <span style={{ fontSize: 13, color: "#98A2B3" }}>No one added yet</span>}
                  {scorers.map((s) => (
                    <span key={s} className="ce-token">
                      {s}
                      <button onClick={(e) => { e.stopPropagation(); setScorers((a) => a.filter((x) => x !== s)); }}
                        aria-label={`Remove ${s}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="ce-tokenfoot">
                  Use <span className="ce-at">@</span> to add user or groups
                </div>
              </div>

              {scorerMenu && (
                <div className="ce-list" style={{ maxWidth: 700, marginTop: 10 }}>
                  {SCORER_OPTIONS.filter((s) => !scorers.includes(s)).map((s) => (
                    <button key={s} className="ce-list-row" style={{ width: "100%", background: "none",
                      border: "none", borderBottom: "1px solid #EFF1F7", cursor: "pointer", textAlign: "left" }}
                      onClick={() => { setScorers((a) => [...a, s]); setScorerMenu(false); }}>
                      <span style={{ fontSize: 13 }}>{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 5 — review */}
          {step === 4 && (
            <>
              <div className="ce-revgrid">
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">QUESTIONNAIRE</p>
                  <p className="ce-sumcard-value">{qName || "—"}</p>
                </div>
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">VENDORS INVITED</p>
                  <p className="ce-sumcard-value">{picked.length}</p>
                </div>
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">QUESTIONS</p>
                  <p className="ce-sumcard-value">{questions.length}</p>
                </div>
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">RESPONSE DEADLINE</p>
                  <p className="ce-sumcard-value">In {deadline || "—"}</p>
                </div>
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">TARGET DECISION IN</p>
                  <p className="ce-sumcard-value">In {decision || "—"}</p>
                </div>
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">FORM</p>
                  <p className="ce-sumcard-value">{template || "—"}</p>
                </div>
              </div>

              <h4 className="ce-section-head">Contacts</h4>
              <div style={{ margin: "10px 0 24px" }}>
                {picked.map((v) => (
                  <p key={v} style={{ fontSize: 13, margin: "0 0 9px", color: "#101828" }}>
                    {v}: <span style={{ marginLeft: 8 }}>{contacts[v] || "No contact added"}</span>
                  </p>
                ))}
              </div>

              <h4 className="ce-section-head">Scored by</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 24px" }}>
                {scorers.length
                  ? scorers.map((s) => <span key={s} className="ce-vendorchip">{s}</span>)
                  : <span style={{ fontSize: 13, color: "#98A2B3" }}>No one added</span>}
              </div>

              <div className="ce-cta-panel">
                <div style={{ flex: 1 }}>
                  <p className="ce-list-title">See what the vendor gets</p>
                  <p className="ce-list-desc">
                    The email each vendor receives, and the form they open to respond — no login, they enter
                    their name at the top.
                  </p>
                </div>
                <VBtn size="sm">Open recipient view</VBtn>
              </div>
            </>
          )}
        </div>

        <div className="ce-modal-foot">
          {step > 0
            ? <VBtn onClick={() => setStep((s) => s - 1)}>Back</VBtn>
            : <span />}
          <div style={{ display: "flex", gap: 10 }}>
            <VBtn onClick={onClose}>Cancel</VBtn>
            {step < STEPS.length - 1 ? (
              <VBtn variant="primary" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>Next</VBtn>
            ) : (
              <VBtn variant="primary"
                onClick={() => onSend({ name: qName, vendors: picked, deadline: `In ${deadline}` })}>
                Send Questionnaire
              </VBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- start procurement: raise a request form --------------- */


const COMPLETE_OPTIONS = [
  { id: "complete", label: "Complete", needsVendor: false, multi: false },
  { id: "finalise", label: "Complete and finalise vendor", needsVendor: true, multi: true },
  { id: "procure", label: "Finalise vendor and start procurement", needsVendor: true, multi: false },
];

/* Answers questions about the responses on this request. Every answer is
   computed from the responses themselves and cites what it read, so the user can
   check it. Actions are proposed, never taken without a click. */
function askResponses(question, request, responded) {
  const q = (question || "").toLowerCase();
  const has = (...words) => words.some((w) => q.includes(w));
  const priced = responded.filter((v) => VENDOR_PRICING[v.name]);
  const bm = PRICE_BENCHMARK[request.id];
  const cite = (v, a) => ({ vendor: v.name, q: a.q, a: a.a, s: a.s });

  // cheapest, dearest, spread
  if (has("cheap", "price", "cost", "expensive", "spend", "how much")) {
    if (!priced.length)
      return { text: "No vendor has submitted pricing against the locked schema yet, so there is nothing to compare on cost.", cites: [] };
    const lo = priced.reduce((a, b) => (VENDOR_PRICING[a.name].annual <= VENDOR_PRICING[b.name].annual ? a : b));
    const hi = priced.reduce((a, b) => (VENDOR_PRICING[a.name].annual >= VENDOR_PRICING[b.name].annual ? a : b));
    const lines = priced.map((v) => {
      const p = VENDOR_PRICING[v.name];
      const u = perUnit(p);
      const delta = bm ? Math.round(((u - bm.median) / bm.median) * 100) : null;
      return `${v.name} at ${vrMoney(p.annual)} a year (${vrMoney(u)} ${bm ? bm.unit : "per unit"}${
        delta === null ? "" : `, ${Math.abs(delta)}% ${delta <= 0 ? "below" : "above"} the cohort median`})`;
    });
    return {
      text: `${lo.name} is cheapest at ${vrMoney(VENDOR_PRICING[lo.name].annual)} a year and ${hi.name} is dearest at ${vrMoney(VENDOR_PRICING[hi.name].annual)}, a spread of ${vrMoney(VENDOR_PRICING[hi.name].annual - VENDOR_PRICING[lo.name].annual)}.`,
      bullets: lines,
      cites: [], note: "Read from the locked pricing answer on each response.",
      actions: ["Open the benchmark", "Ask the dearest vendor to requote"],
    };
  }

  // scoring
  if (has("score", "best", "highest", "strongest", "rank", "who won")) {
    const ranked = [...responded].sort((a, b) => avgScore(b) - avgScore(a));
    return {
      text: `${ranked[0].name} scores highest at ${avgScore(ranked[0]).toFixed(1)} out of 10.`,
      bullets: ranked.map((v) => `${v.name} ${avgScore(v).toFixed(1)}`),
      cites: [], note: `Averaged across ${ranked[0].answers.length} scored answers per vendor.`,
      actions: ["Open the comparison report"],
    };
  }

  // commercial terms against the cohort
  if (has("term", "notice", "uplift", "renew", "payment", "risk", "deviat", "norm")) {
    const off = [];
    priced.forEach((v) => {
      const p = VENDOR_PRICING[v.name];
      TERM_BENCHMARK.forEach((t) => {
        if (!t.ok(p)) off.push(`${v.name}: ${t.label.toLowerCase()} of ${t.read(p)}, against ${t.cohort.toLowerCase()}`);
      });
    });
    return {
      text: off.length
        ? `${off.length} terms sit outside the cohort norm across ${priced.length} responses.`
        : "Every submitted term sits inside the cohort norm.",
      bullets: off, cites: [], note: "Compared against the commercial term benchmark.",
      actions: off.length ? ["Add these to the negotiation list"] : [],
    };
  }

  // who has not responded, and which answers are weak
  if (has("missing", "gap", "not answer", "no response", "weak", "chase", "outstanding")) {
    const waiting = request.vendors.filter((v) => v.status !== "responded");
    const weak = [];
    responded.forEach((v) => v.answers.forEach((a) => { if ((a.s || 0) <= 6) weak.push(cite(v, a)); }));
    return {
      text: waiting.length
        ? `${waiting.length} of ${request.vendors.length} vendors have not responded: ${waiting.map((v) => v.name).join(", ")}.`
        : "Every invited vendor has responded.",
      bullets: weak.length ? [`${weak.length} answers scored 6 or below and are worth a follow-up.`] : [],
      cites: weak.slice(0, 4),
      actions: waiting.length ? ["Send a reminder"] : weak.length ? ["Ask a follow-up question"] : [],
    };
  }

  // recommendation
  if (has("recommend", "should we", "which one", "pick", "choose", "go with")) {
    const ranked = [...responded].sort((a, b) => avgScore(b) - avgScore(a));
    const top = ranked[0];
    const p = VENDOR_PRICING[top.name];
    const risks = p ? TERM_BENCHMARK.filter((t) => !t.ok(p)) : [];
    return {
      text: `On the responses alone, ${top.name}. It scores ${avgScore(top).toFixed(1)}${
        p ? ` and prices at ${vrMoney(p.annual)} a year` : ""}.`,
      bullets: risks.length
        ? risks.map((t) => `Before signing, settle ${t.label.toLowerCase()}: currently ${t.read(p)} against ${t.cohort.toLowerCase()}.`)
        : ["No commercial terms sit outside the cohort norm."],
      cites: [], note: "A recommendation, not a decision. Scoring is yours to override.",
      actions: ["Finalise this vendor", "Open the comparison report"],
    };
  }

  // otherwise search the answers themselves. Short acronyms like SSO and SLA
  // matter, so the filter is a stopword list rather than a length cut, and only
  // the strongest matches are returned so a single common word is not a hit.
  const STOP = new Set(["does", "anyone", "what", "which", "about", "their", "there",
    "have", "with", "that", "this", "from", "your", "they", "them", "tell", "show",
    "are", "the", "and", "for", "any", "can", "did", "was", "our", "how", "who"]);
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !STOP.has(w));
  let hits = [];
  responded.forEach((v) => v.answers.forEach((a) => {
    const hay = (a.q + " " + a.a).toLowerCase();
    const score = words.filter((w) => hay.includes(w)).length;
    if (score) hits.push({ ...cite(v, a), score });
  }));
  const best = hits.reduce((m, h) => Math.max(m, h.score), 0);
  hits = hits.filter((h) => h.score === best).sort((a, b) => b.score - a.score);
  if (!hits.length)
    return {
      text: "Nothing in these responses covers that. Try asking about pricing, scores, commercial terms, gaps, or ask for a recommendation.",
      cites: [],
    };
  const vendors = [...new Set(hits.map((h) => h.vendor))];
  return {
    text: `${vendors.length} of ${responded.length} vendors addressed that: ${vendors.join(", ")}.`,
    cites: hits.slice(0, 4),
    actions: ["Ask a follow-up question"],
  };
}

const AGENT_SUGGESTIONS = [
  "Who is cheapest, and how does that compare to the benchmark?",
  "Who scored highest overall?",
  "Which commercial terms sit outside our norms?",
  "What is missing or weak in these responses?",
  "Who should we go with?",
];

function ResponseAgent({ request, responded, toast }) {
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = (text) => {
    if (!text.trim() || busy) return;
    setThread((t) => [...t, { role: "you", text }]);
    setDraft("");
    setBusy(true);
    setTimeout(() => {
      setThread((t) => [...t, { role: "agent", ...askResponses(text, request, responded) }]);
      setBusy(false);
    }, 700);
  };

  return (
    <div>
      <div className="ce-banner" style={{ marginBottom: 16 }}>
        <Sparkles size={16} color="#4C5AE4" style={{ flex: "none", marginTop: 1 }} />
        <div>
          <p className="ce-banner-title">Ask about these responses</p>
          <p>
            Answers are read from the {responded.length} responses on this request and cite what they
            came from. Anything it proposes needs your click before it happens.
          </p>
        </div>
      </div>

      {!thread.length && (
        <div style={{ marginBottom: 16 }}>
          <p className="ce-section-desc" style={{ marginBottom: 8 }}>Try one of these</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AGENT_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="ce-link"
                style={{ border: "1px solid #E4E7F0", borderRadius: 999, padding: "6px 12px",
                         background: "#fff", fontSize: 12.5 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3" style={{ marginBottom: 16 }}>
        {thread.map((m, i) => m.role === "you" ? (
          <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
            <div className="rounded-md px-3 py-2 text-sm"
              style={{ background: T.blue, color: "#fff", maxWidth: "80%" }}>{m.text}</div>
          </div>
        ) : (
          <div key={i} className="rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: T.lavender, flexShrink: 0 }}>
                <Sparkles size={14} style={{ color: T.periwinkle }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: T.text }}>{m.text}</div>

                {m.bullets && m.bullets.length > 0 && (
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
                    {m.bullets.map((b, j) => (
                      <li key={j} className="text-sm" style={{ color: T.textSecondary, marginBottom: 4 }}>{b}</li>
                    ))}
                  </ul>
                )}

                {m.cites && m.cites.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="text-xs mb-1.5" style={{ color: T.textSecondary }}>Read from</div>
                    <div className="space-y-1.5">
                      {m.cites.map((c, j) => (
                        <div key={j} className="rounded-md px-3 py-2" style={{ background: T.lavender }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold" style={{ color: T.navy }}>{c.vendor}</span>
                            {c.s != null && (
                              <span className={`ce-score ce-score--${scoreTone(c.s)}`}>{c.s}</span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: T.textSecondary }}>{c.q}</div>
                          <div className="text-xs mt-0.5" style={{ color: T.text }}>{c.a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {m.note && (
                  <div className="text-xs mt-2" style={{ color: T.textSecondary }}>{m.note}</div>
                )}

                {m.actions && m.actions.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {m.actions.map((a) => (
                      <VBtn key={a} size="sm" onClick={() => toast(`${a} — needs your confirmation`)}>{a}</VBtn>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {busy && (
          <div className="rounded-lg p-4 flex items-center gap-3" style={{ border: `1px solid ${T.border}` }}>
            <Loader size={14} className="animate-spin" style={{ color: T.periwinkle }} />
            <span className="text-sm" style={{ color: T.textSecondary }}>Reading the responses</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(draft)}
          placeholder="Ask anything about these responses"
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={{ border: `1px solid ${draft ? T.blue : T.border}`, color: T.text, flex: 1 }} />
        <VBtn variant="primary" onClick={() => ask(draft)} disabled={!draft.trim()}>Ask</VBtn>
      </div>
    </div>
  );
}

function ExecutiveSummary({ request, responded, topVendor, avg }) {
  const priced = responded.filter((v) => VENDOR_PRICING[v.name]);
  const bm = PRICE_BENCHMARK[request.id];
  const low = priced.length ? priced.reduce((a, b) =>
    VENDOR_PRICING[a.name].annual <= VENDOR_PRICING[b.name].annual ? a : b) : null;
  const high = priced.length ? priced.reduce((a, b) =>
    VENDOR_PRICING[a.name].annual >= VENDOR_PRICING[b.name].annual ? a : b) : null;
  const top = VENDOR_PRICING[topVendor];
  const risks = [];
  if (top) TERM_BENCHMARK.forEach((t) => {
    if (!t.ok(top)) risks.push(`${t.label.toLowerCase()} of ${t.read(top)} sits outside the cohort norm of ${t.cohort.toLowerCase()}`);
  });

  return (
    <div className="ce-exec">
      <div className="ce-insight-head">
        <h4 className="ce-section-head" style={{ margin: 0 }}>Executive summary</h4>
        <VPill tone="info"><Sparkles size={11} /> AI drafted</VPill>
      </div>
      <p>
        {responded.length} of {request.vendors.length} vendors responded to {request.name}.
        {priced.length > 1 && low && high && (
          <> Annual pricing ranged from {vrMoney(VENDOR_PRICING[low.name].annual)} ({low.name}) to{" "}
          {vrMoney(VENDOR_PRICING[high.name].annual)} ({high.name}), a spread of{" "}
          {vrMoney(VENDOR_PRICING[high.name].annual - VENDOR_PRICING[low.name].annual)}.</>
        )}
      </p>
      <p>
        <strong>Recommendation.</strong> {topVendor} scores highest at {avg.toFixed(1)} out of 10
        {top && bm && (
          <> and prices at {vrMoney(perUnit(top))} {bm.unit}, {" "}
          {perUnit(top) <= bm.median
            ? `${Math.round(((bm.median - perUnit(top)) / bm.median) * 100)}% below`
            : `${Math.round(((perUnit(top) - bm.median) / bm.median) * 100)}% above`} the cohort median</>
        )}.
      </p>
      {risks.length > 0 && (
        <p>
          <strong>Watch.</strong> {topVendor}'s {risks.join("; ")}. Raise these before signing.
        </p>
      )}
      <p style={{ fontSize: 12, color: "#667085" }}>
        Benchmarks drawn from aggregated, anonymised contract data.
        {" "}PLACEHOLDER — confirm the source line before this is shown to a customer.
      </p>
    </div>
  );
}

function PriceBenchmark({ request, responded }) {
  const bm = PRICE_BENCHMARK[request.id];
  const priced = responded.filter((v) => VENDOR_PRICING[v.name]);
  if (!bm || !priced.length)
    return (
      <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
        <BarChart3 size={22} color="#98A2B3" />
        <h4>No pricing to benchmark</h4>
        <p>Add a locked pricing question to the questionnaire and responses can be compared to a cohort.</p>
      </div>
    );

  return (
    <>
      <h4 className="ce-section-head" style={{ marginTop: 26 }}>Benchmark, pricing</h4>
      <p className="ce-section-desc">
        {bm.cohort} &middot; {bm.n} comparable contracts &middot; figures are {bm.unit}.
      </p>
      <table className="ce-compare">
        <thead>
          <tr>
            <th style={{ width: 210 }}>Vendor</th>
            <th>Submitted</th><th>Vs median ({vrMoney(bm.median)})</th>
            <th>Cohort range</th><th>Annual total</th>
          </tr>
        </thead>
        <tbody>
          {priced.map((v) => {
            const p = VENDOR_PRICING[v.name];
            const u = perUnit(p);
            const delta = Math.round(((u - bm.median) / bm.median) * 100);
            return (
              <tr key={v.name}>
                <td style={{ color: "#667085" }}>{v.name}</td>
                <td>{vrMoney(u)}</td>
                <td>
                  <span className={`ce-score ce-score--${delta <= 0 ? "success" : delta > 15 ? "danger" : "warning"}`}>
                    {delta > 0 ? "+" : ""}{delta}%
                  </span>
                  {delta <= 0 ? "below median" : "above median"}
                </td>
                <td>{vrMoney(bm.p25)} to {vrMoney(bm.p75)}</td>
                <td>{vrMoney(p.annual)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function TermBenchmark({ responded }) {
  const priced = responded.filter((v) => VENDOR_PRICING[v.name]);
  if (!priced.length) return null;
  return (
    <>
      <h4 className="ce-section-head" style={{ marginTop: 26 }}>Benchmark, commercial terms</h4>
      <p className="ce-section-desc">
        Beyond price. Anything outside the cohort norm is worth raising in negotiation.
      </p>
      <table className="ce-compare">
        <thead>
          <tr>
            <th style={{ width: 210 }}>Term</th>
            {priced.map((v) => <th key={v.name}>{v.name}</th>)}
            <th>Cohort</th>
          </tr>
        </thead>
        <tbody>
          {TERM_BENCHMARK.map((t) => (
            <tr key={t.key}>
              <td style={{ color: "#667085" }}>{t.label}</td>
              {priced.map((v) => {
                const p = VENDOR_PRICING[v.name];
                return (
                  <td key={v.name}>
                    <span className={`ce-score ce-score--${t.ok(p) ? "success" : "warning"}`}>
                      {t.ok(p) ? "In line" : "Outside"}
                    </span>
                    {t.read(p)}
                  </td>
                );
              })}
              <td style={{ color: "#667085" }}>{t.cohort}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function NegotiationInsights({ row }) {
  const p = VENDOR_PRICING[row.vendor];
  const paper = VENDOR_PAPER[row.vendor];
  if (!p || !paper)
    return (
      <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
        <Scale size={22} color="#98A2B3" />
        <h4>No paper to compare yet</h4>
        <p>Once a vendor has submitted pricing and terms, their paper is compared to your playbook here.</p>
      </div>
    );

  const rows = [
    { clause: "Uplift cap", theirs: p.uplift, ok: p.uplift !== "None",
      lever: "71% of comparable contracts carry a cap. Ask for 5% fixed for the full term." },
    { clause: "Notice period", theirs: `${p.notice} days`, ok: p.notice <= 30,
      lever: "Cohort median is 30 days. A longer notice period locks you in past the point of deciding." },
    { clause: "Payment terms", theirs: p.payment, ok: p.payment === "Annual upfront",
      lever: "Annual upfront is worth 3 to 6% in discount. Trade it rather than give it away." },
    { clause: "Auto-renewal", theirs: paper.autoRenew, ok: paper.autoRenew.startsWith("No"),
      lever: "Evergreen renewal removes your next negotiation. Ask for a fixed end date." },
    { clause: "Termination", theirs: paper.termination, ok: paper.termination.startsWith("For convenience"),
      lever: "For-cause-only termination leaves no exit if adoption stalls." },
    { clause: "Liability cap", theirs: paper.liability, ok: paper.liability.startsWith("12"),
      lever: "12 months fees is standard at this size. 6 months is below market." },
  ];
  const off = rows.filter((r) => !r.ok);

  return (
    <>
      <div className="ce-insight-head">
        <h4 className="ce-section-head" style={{ margin: 0 }}>Negotiation insights</h4>
        <VPill tone={off.length ? "warning" : "success"}>
          {off.length ? `${off.length} deviations from playbook` : "Matches playbook"}
        </VPill>
      </div>
      <p className="ce-section-desc">
        {row.vendor}'s paper compared clause by clause against your negotiation playbook.
      </p>

      {rows.map((r) => {
        const pb = PLAYBOOK.find((x) => x.clause === r.clause) || {};
        return (
          <div key={r.clause} className="ce-insight">
            <div className="ce-insight-head">
              <p className="ce-list-title" style={{ margin: 0 }}>{r.clause}</p>
              <VPill tone={r.ok ? "success" : "warning"}>{r.ok ? "In line" : "Deviates"}</VPill>
            </div>
            <div className="ce-insight-grid">
              <div>
                <p className="ce-list-desc" style={{ marginBottom: 2 }}>Your playbook</p>
                <p className="ce-list-title" style={{ fontWeight: 500 }}>{pb.position}</p>
              </div>
              <div>
                <p className="ce-list-desc" style={{ marginBottom: 2 }}>Their paper</p>
                <p className="ce-list-title" style={{ fontWeight: 500,
                  color: r.ok ? "#1A1D2E" : "#B7791F" }}>{r.theirs}</p>
              </div>
            </div>
            {!r.ok && <p className="ce-insight-lever"><strong>Lever.</strong> {r.lever}</p>}
          </div>
        );
      })}

      <VPlaceholder>
        Redline comparison against the uploaded contract file is not specified in the requirements.
        This compares the structured terms captured during sourcing.
      </VPlaceholder>
    </>
  );
}

function RequestResponsesModal({ request, onClose, onComplete, onRead, flash }) {
  const responded = request.vendors.filter((v) => v.status === "responded");
  const [openVendor, setOpenVendor] = useState(responded.length ? responded[0].name : null);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(null);   // option awaiting a vendor choice
  const [chosen, setChosen] = useState([]);       // vendors picked for that option
  const toggleChosen = (name) =>
    setChosen((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]));
  const [tab, setTab] = useState("responses");   // responses | ai
  const [aiView, setAiView] = useState("ask");   // ask | report

  const visible = request.vendors.filter((v) =>
    v.name.toLowerCase().includes(query.toLowerCase()) ||
    v.contact.toLowerCase().includes(query.toLowerCase()));

  const summaryStatus = request.completed
    ? { text: "Completed", tone: "success" }
    : responded.length === request.vendors.length
      ? { text: "All vendors responded", tone: "success" }
      : { text: "Awaiting vendor response", tone: "warning" };

  const pickOption = (opt) => {
    setMenuOpen(false);
    if (!opt.needsVendor) return onComplete(request, null, opt.id);
    setPending(opt);           // requirement: ask for vendors before finalising
    setChosen([]);
    setReport(false);
  };

  const questions = responded.length ? responded[0].answers.map((a) => a.q) : [];
  const topVendor = responded.length
    ? responded.reduce((best, v) => (avgScore(v) > avgScore(best) ? v : best), responded[0]).name
    : null;

  return (
    <div className="ce-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ce-modal" role="dialog" aria-label="Questionnaire responses">
        <div className="ce-modal-head" style={{ paddingBottom: 16 }}>
          <div>
            <h3 className="ce-modal-title">Questionnaire responses — {request.name}</h3>
            <p className="ce-modal-sub">
              {request.type} sent
              <span className="ce-tl-sep" />
              started {request.created} by {request.createdBy.name}
            </p>
          </div>
          <button className="ce-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="ce-tabsbar" style={{ margin: "0 24px", marginTop: 0 }}>
          <div className="ce-tabs">
            {[["responses", "Raw responses"], ["ai", "AI analysis"]].map(([id, label]) => (
              <button key={id} className={`ce-tab${tab === id ? " is-active" : ""}`}
                onClick={() => setTab(id)}>
                {label}
                {id === "responses" && <span className="ce-tab-count">{responded.length}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="ce-modal-body">
          {tab === "ai" ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {[["ask", "Ask about responses", Sparkles],
                  ["report", "Comparison report", BarChart3]].map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setAiView(id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer",
                             padding: "7px 13px", borderRadius: 7, fontSize: 13, fontWeight: 500,
                             background: aiView === id ? "#EEF0FE" : "#fff",
                             color: aiView === id ? "#4C5AE4" : "#667085",
                             border: `1px solid ${aiView === id ? "#4C5AE4" : "#E4E7F0"}` }}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {aiView === "ask" && (
                <ResponseAgent request={request} responded={responded} toast={flash} />
              )}

              {aiView === "report" && responded.length < 2 && (
                <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
                  <BarChart3 size={22} color="#98A2B3" />
                  <h4>Not enough responses to compare</h4>
                  <p>A comparison needs at least two vendors to have answered.</p>
                </div>
              )}
            </>
          ) : null}

          {tab === "ai" && aiView === "report" && responded.length >= 2 ? (
            <>
              <ExecutiveSummary request={request} responded={responded} topVendor={topVendor}
                avg={avgScore(responded.find((v) => v.name === topVendor))} />

              <h4 className="ce-section-head">Comparison report</h4>
              <p className="ce-section-desc">
                {responded.length} of {request.vendors.length} vendors compared, answer by answer.
              </p>
              <table className="ce-compare">
                <thead>
                  <tr>
                    <th style={{ width: 210 }}>Question</th>
                    {responded.map((v) => (
                      <th key={v.name}>
                        {v.name}
                        {v.name === topVendor && <VPill tone="success" style={{ marginLeft: 8 }}>Recommended</VPill>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q}>
                      <td style={{ color: "#667085" }}>{q}</td>
                      {responded.map((v) => {
                        const ans = v.answers[i] || {};
                        return (
                          <td key={v.name}>
                            <span className={`ce-score ce-score--${scoreTone(ans.s)}`}>
                              {ans.s != null ? `${ans.s}/10` : "—"}
                            </span>
                            {ans.a || "No answer"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {responded.some((v) => VENDOR_PRICING[v.name]) && (
                    <tr>
                      <td style={{ color: "#667085" }}>Pricing, locked format</td>
                      {responded.map((v) => {
                        const p = VENDOR_PRICING[v.name];
                        return (
                          <td key={v.name}>
                            {p ? <>{p.unit} &middot; {p.qty.toLocaleString()} &times; {p.term} months
                              &middot; {p.discount}% off list<br />
                              <strong>{vrMoney(p.annual)}</strong> a year</> : "No pricing submitted"}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                  <tr className="ce-compare-total">
                    <td>Overall score</td>
                    {responded.map((v) => (
                      <td key={v.name}>
                        <span className={`ce-score ce-score--${scoreTone(avgScore(v))}`}>
                          {avgScore(v).toFixed(1)}/10
                        </span>
                        {v.name === topVendor ? "Highest scoring" : "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <PriceBenchmark request={request} responded={responded} />
              <TermBenchmark responded={responded} />

              <div style={{ marginTop: 14 }}>
                <VPlaceholder>
                  Report content is generated at runtime. Citations back to each answer and export
                  options are not specified in the requirements.
                </VPlaceholder>
              </div>
            </>
          ) : null}

          {tab === "responses" && (
            <>
              <div className="ce-section-row">
                <h4 className="ce-section-head" style={{ margin: 0 }}>Summary</h4>
              </div>

              <div className="ce-sumcards">
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">STATUS</p>
                  <p className={`ce-sumcard-value ce-tl-status--${summaryStatus.tone}`}>{summaryStatus.text}</p>
                </div>
                <div className="ce-sumcard">
                  <p className="ce-sumcard-label">WHERE IT STANDS</p>
                  <p className="ce-sumcard-value">
                    {request.type}
                    <span className="ce-tl-sep" />
                    {request.vendors.length} Vendors
                    <span className="ce-tl-sep" />
                    Due {request.deadline}
                  </p>
                </div>
              </div>

              <hr className="ce-hr" />

              {pending && (
                <div className="ce-banner" style={{ marginBottom: 18 }}>
                  <Info size={16} color="#4C5AE4" style={{ flex: "none", marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <p className="ce-banner-title">{pending.multi ? "Select vendors" : "Select a vendor"}</p>
                    <p>{pending.multi
                      ? "Pick one or more vendors to finalise, then confirm."
                      : request.linkedTo
                        ? `Procurement runs for one vendor at a time. Pick the vendor to finalise, and ${request.linkedTo} picks up from its sourcing step.`
                        : "Procurement runs for one vendor at a time. Pick the vendor to finalise and send to procurement, then confirm."}</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <VBtn size="sm" onClick={() => { setPending(null); setChosen([]); }}>Cancel</VBtn>
                    <VBtn size="sm" variant="primary" disabled={chosen.length === 0}
                      onClick={() => onComplete(request, chosen, pending.id)}>
                      Confirm{pending.multi && chosen.length ? ` (${chosen.length})` : ""}
                    </VBtn>
                  </div>
                </div>
              )}

              <div className="ce-section-row">
                <h4 className="ce-section-head" style={{ margin: 0 }}>Vendor responses</h4>
                <VBtn size="sm" onClick={() => flash("Opening the form and email sent to vendors")}>
                  View form & email
                </VBtn>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div className="ce-search">
                  <Search size={15} color="#98A2B3" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vendor" />
                </div>
                <button className="ce-iconbtn" title="Filter"><SlidersHorizontal size={15} /></button>
                <span className="ce-count" style={{ marginLeft: "auto" }}>
                  {visible.length} vendors
                </span>
              </div>

              {visible.length === 0 ? (
                <div className="ce-empty">
                  <Users size={22} color="#98A2B3" />
                  <h4>No vendors match that search</h4>
                  <p>Clear the search to see everyone invited to respond.</p>
                </div>
              ) : (
                visible.map((v) => {
                  const isOpen = openVendor === v.name;
                  const hasAnswers = v.status === "responded";
                  return (
                    <div key={v.name} className={`ce-vrcard${isOpen && hasAnswers ? " is-open" : ""}`}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <button
                          className="ce-vrhead"
                          onClick={() => {
                            if (!hasAnswers) return;
                            if (!isOpen && !v.read) onRead(request.id, v.name);
                            setOpenVendor(isOpen ? null : v.name);
                          }}
                          style={{ cursor: hasAnswers ? "pointer" : "default" }}
                        >
                          {pending && hasAnswers && (
                            <input
                              type={pending.multi ? "checkbox" : "radio"}
                              className={pending.multi ? "ce-check" : "ce-radio"}
                              style={{ marginTop: 0 }}
                              name={pending.multi ? undefined : "finalise-vendor"}
                              checked={chosen.includes(v.name)}
                              onChange={() => (pending.multi ? toggleChosen(v.name) : setChosen([v.name]))}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <div className="ce-vr-avatar">
                            {v.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="ce-vr-name">{v.contact}</p>
                            <p className="ce-vr-sub">
                              <span className="ce-vr-vendor">{v.name}</span>
                              <span className="ce-tl-sep" />
                              {v.role}
                              <span className="ce-tl-sep" />
                              {hasAnswers ? v.date : `Pending since ${v.date}`}
                            </p>
                          </div>
                          {hasAnswers
                            ? <VPill tone="success">Responded</VPill>
                            : <VPill tone="warning">Waiting on vendor</VPill>}
                          {hasAnswers && (
                            <ChevronDown size={16} color="#98A2B3"
                              style={{ transform: isOpen ? "rotate(180deg)" : "none", flex: "none" }} />
                          )}
                        </button>
                        <div style={{ padding: "0 16px 0 10px" }}>
                          {hasAnswers
                            ? <VBtn size="sm" onClick={() => flash(`Follow-up sent to ${v.contact}`)}>Ask follow up</VBtn>
                            : <VBtn size="sm" onClick={() => flash("Reminder sent successfully")}>Send reminder</VBtn>}
                        </div>
                      </div>

                      {isOpen && hasAnswers && (
                        <div className="ce-vr-body">
                          {v.answers.map((qa, i) => (
                            <div key={i} className="ce-vr-qa">
                              <p className="ce-vr-q">{qa.q}</p>
                              <p className="ce-vr-a">{qa.a || "No answer yet"}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        <div className="ce-modal-foot">
          <VBtn onClick={onClose}>Close</VBtn>
          <div className="ce-menuwrap">
            <VBtn variant="primary" disabled={request.completed} onClick={() => setMenuOpen((o) => !o)}>
              Mark complete <ChevronDown size={14} />
            </VBtn>
            {menuOpen && (
              <div className="ce-menu">
                {COMPLETE_OPTIONS.map((opt) => (
                  <button key={opt.id}
                    disabled={opt.needsVendor && responded.length === 0}
                    onClick={() => pickOption(opt)}>
                    {opt.id === "procure" && request.linkedTo
                      ? "Finalise vendor and continue procurement"
                      : opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- finalised vendor details modal -------------------- */

const ACTIVITY_ICON = { questionnaire: FileText, email: Mail, upload: Upload, procurement: ShoppingCart };

function ActionModal({ kind, vendor, onClose, onSubmit }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const config = {
    questionnaire: {
      title: "Send another questionnaire",
      fields: [
        { label: "Questionnaire name", placeholder: "Security RFI — round 2", value: a, set: setA },
        { label: "Message to the vendor", placeholder: "A few follow-ups before we move to contract.", value: b, set: setB, area: true },
      ],
      cta: "Send questionnaire",
    },
    email: {
      title: "Send an email",
      fields: [
        { label: "Subject", placeholder: "Follow-up on pricing", value: a, set: setA },
        { label: "Message", placeholder: "Write your message to the vendor.", value: b, set: setB, area: true },
      ],
      cta: "Send email",
    },
    upload: {
      title: "Upload a document",
      fields: [
        { label: "File name", placeholder: "Vendor_pricing_v3.pdf", value: a, set: setA },
        { label: "Note for evaluators", placeholder: "What is this document and what should people look at?", value: b, set: setB, area: true },
      ],
      cta: "Upload document",
    },
  }[kind];

  return (
    <div className="ce-scrim" style={{ zIndex: 70 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ce-modal ce-modal--sm" role="dialog" aria-label={config.title}>
        <div className="ce-modal-head" style={{ paddingBottom: 0 }}>
          <div>
            <h3 className="ce-modal-title">{config.title}</h3>
            <p className="ce-modal-sub">{vendor}</p>
          </div>
          <button className="ce-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="ce-modal-body">
          {kind === "upload" && (
            <div style={{ marginBottom: 20 }}>
              <VPlaceholder>
                File picker and drag-and-drop target are not specified in the requirements. Shown here as a
                Text Input standing in for the upload control.
              </VPlaceholder>
            </div>
          )}
          {config.fields.map((f) => (
            <VField key={f.label} label={f.label}>
              {f.area
                ? <textarea className="ce-textarea" value={f.value} placeholder={f.placeholder}
                    onChange={(e) => f.set(e.target.value)} />
                : <input className="ce-input" value={f.value} placeholder={f.placeholder}
                    onChange={(e) => f.set(e.target.value)} />}
            </VField>
          ))}
        </div>
        <div className="ce-modal-foot">
          <VBtn variant="tertiary" onClick={onClose}>Cancel</VBtn>
          <VBtn variant="primary" disabled={!a.trim()} onClick={() => onSubmit(a.trim(), b.trim())}>
            {config.cta}
          </VBtn>
        </div>
      </div>
    </div>
  );
}

function VendorDetailsModal({ row, onClose, onStart, onContinue, onDiscard, onAddActivity }) {
  const activities = row.activities || [];
  const [openActivity, setOpenActivity] = useState(null);
  const [action, setAction] = useState(null);
  const [negotiation, setNegotiation] = useState(false);
  const [query, setQuery] = useState("");

  const visible = activities.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.meta.join(" ").toLowerCase().includes(query.toLowerCase()));

  const detail = openActivity && activities.find((a) => a.id === openActivity);

  const submitAction = (kind, a, b) => {
    const today = "Today";
    const built = {
      questionnaire: {
        id: `a-${Date.now()}`, type: "questionnaire", title: "Questionnaire sent to vendor", date: today,
        status: { text: "Waiting on vendor", tone: "warning" }, meta: [a, "awaiting response"],
        responses: [], message: b,
      },
      email: {
        id: `a-${Date.now()}`, type: "email", title: "Email sent to vendor", date: today,
        status: { text: "Waiting for response", tone: "warning" }, meta: [a, "1 recipient"],
        subject: a, body: b,
      },
      upload: {
        id: `a-${Date.now()}`, type: "upload", title: "Document uploaded", date: today,
        status: { text: "Shared with evaluators", tone: "info" }, meta: [a],
        fileName: a, note: b,
      },
    }[kind];
    onAddActivity(row.id, built);
    setAction(null);
    setOpenActivity(null);
  };

  return (
    <div className="ce-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ce-modal" role="dialog" aria-label={`${row.vendor} details`}>
        <div className="ce-modal-head" style={{ paddingBottom: 14 }}>
          <div>
            <h3 className="ce-modal-title">{row.vendor}</h3>
            <p className="ce-modal-sub">
              <VPill tone={FV_TONE[row.status]}>{row.status}</VPill>
              <span className="ce-tl-sep" />
              From {row.request}
              <span className="ce-tl-sep" />
              Owner {row.owner}
              <span className="ce-tl-sep" />
              Workflow{" "}
              {row.status === "Vendor Finalised" ? "not started"
                : row.status === "Vendor Discarded" ? "—"
                  : <button className="ce-link" onClick={() => row.workflow && onContinue(row.workflow)}>
                      {row.workflow
                        || (activities.find((a) => a.type === "procurement") || {}).link
                        || "PR-2061"}
                      <ArrowUpRight size={12} />
                    </button>}
            </p>
          </div>
          <button className="ce-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="ce-actionbar">
          <VBtn size="sm" onClick={() => setAction("questionnaire")}>
            <FileText size={13} /> Send another questionnaire
          </VBtn>
          <VBtn size="sm" onClick={() => setAction("email")}><Mail size={13} /> Send an email</VBtn>
          <VBtn size="sm" onClick={() => setAction("upload")}><Upload size={13} /> Upload a document</VBtn>
          <VBtn size="sm" onClick={() => { setNegotiation(true); setOpenActivity(null); }}>
            <Scale size={13} /> Negotiation insights
          </VBtn>
          {row.workflow ? (
            <VBtn size="sm" variant="primary" onClick={() => onContinue(row.workflow)}>
              Continue procurement with this vendor
            </VBtn>
          ) : (
            <VBtn size="sm" variant="primary" disabled={row.status !== "Vendor Finalised"}
              onClick={() => onStart(row)}>
              Start procurement
            </VBtn>
          )}
        </div>

        <div className="ce-modal-body">
          {/* ---- one activity in detail ---- */}
          {detail ? (
            <>
              <button className="ce-back" onClick={() => setOpenActivity(null)}>
                <ChevronLeft size={15} /> Back to activity
              </button>
              <h4 className="ce-section-head">{detail.title}</h4>
              <p className="ce-tl-meta" style={{ marginBottom: 20 }}>
                <span className={`ce-tl-status--${detail.status.tone}`}>Status: {detail.status.text}</span>
                {detail.meta.map((m) => (
                  <React.Fragment key={m}><span className="ce-tl-sep" />{m}</React.Fragment>
                ))}
                <span className="ce-tl-sep" />{detail.date}
              </p>

              {detail.type === "questionnaire" && (
                detail.responses && detail.responses.length ? (
                  <div className="ce-qa">
                    {detail.responses.map((r, i) => (
                      <div key={i} className="ce-qa-item">
                        <p className="ce-qa-q"><span>{i + 1}</span>{r.q}</p>
                        <p className={`ce-qa-a${r.a ? "" : " ce-qa-a--empty"}`}>{r.a || "No answer yet"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ce-empty" style={{ border: "1px solid #E4E7F0", borderRadius: 8 }}>
                    <FileText size={22} color="#98A2B3" />
                    <h4>No responses yet</h4>
                    <p>Answers appear here as soon as the vendor submits them.</p>
                  </div>
                )
              )}

              {detail.type === "email" && (
                <dl className="ce-kv">
                  <dt>Subject</dt><dd>{detail.subject}</dd>
                  <dt>Message</dt><dd style={{ lineHeight: 1.6 }}>{detail.body}</dd>
                </dl>
              )}

              {detail.type === "upload" && (
                <dl className="ce-kv">
                  <dt>File</dt><dd>{detail.fileName}</dd>
                  <dt>Note</dt><dd>{detail.note || "—"}</dd>
                </dl>
              )}

              {detail.type === "procurement" && (
                <dl className="ce-kv">
                  <dt>Procurement request</dt>
                  <dd><button className="ce-link">{detail.link} <ArrowUpRight size={12} /></button></dd>
                  <dt>Workflow stage</dt><dd>{detail.status.text}</dd>
                </dl>
              )}
            </>
          ) : negotiation ? (
            <>
              <button className="ce-back" onClick={() => setNegotiation(false)}>
                <ChevronLeft size={15} /> Back to activity
              </button>
              <NegotiationInsights row={row} />
            </>
          ) : (
            /* ---- activity timeline ---- */
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div className="ce-search">
                  <Search size={15} color="#98A2B3" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
                </div>
                <button className="ce-iconbtn" title="Filter"><SlidersHorizontal size={15} /></button>
                <div className="ce-select">Timeline View <ChevronDown size={14} /></div>
                <span className="ce-count" style={{ marginLeft: "auto" }}>{visible.length} Activities</span>
              </div>

              {visible.length === 0 ? (
                <div className="ce-empty">
                  <Circle size={22} color="#98A2B3" />
                  <h4>No activity yet</h4>
                  <p>Questionnaires, emails and uploads for this vendor show up here.</p>
                </div>
              ) : (
                visible.map((a) => {
                  const Icon = ACTIVITY_ICON[a.type] || Circle;
                  return (
                    <div key={a.id} className="ce-tl-row">
                      <span className="ce-tl-dot" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ce-tl-head">
                          <p className="ce-tl-title"><Icon size={13} style={{ marginRight: 7, verticalAlign: -1 }} />{a.title}</p>
                          <span className="ce-tl-date">{a.date}</span>
                        </div>
                        {a.link && (
                          <p style={{ margin: "6px 0 0" }}>
                            <button className="ce-link">{a.link}</button>
                          </p>
                        )}
                        <p className="ce-tl-meta">
                          <span className={`ce-tl-status--${a.status.tone}`}>Status: {a.status.text}</span>
                          {a.meta.map((m) => (
                            <React.Fragment key={m}><span className="ce-tl-sep" />{m}</React.Fragment>
                          ))}
                        </p>
                        <p style={{ margin: "9px 0 0" }}>
                          <button className="ce-link" onClick={() => setOpenActivity(a.id)}>View Activity</button>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        <div className="ce-modal-foot">
          <VBtn variant="destructive" disabled={row.status !== "Vendor Finalised"} onClick={() => onDiscard(row)}>
            Discard vendor
          </VBtn>
          <VBtn onClick={onClose}>Close</VBtn>
        </div>
      </div>

      {action && (
        <ActionModal
          kind={action}
          vendor={row.vendor}
          onClose={() => setAction(null)}
          onSubmit={(a, b) => submitAction(action, a, b)}
        />
      )}
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

function VendorResearchPage({ active, linkedTo, openCreate, prefill,
                              onLinkedCreated, onLinkedComplete, onStartProcurementWorkflow,
                              onOpenWorkflow }) {
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [finalised, setFinalised] = useState(SEED_FINALISED);
  const [reqFilter, setReqFilter] = useState("All Open Requests");
  const [fvFilter, setFvFilter] = useState(null);
  const [reqQuery, setReqQuery] = useState("");
  const [fvQuery, setFvQuery] = useState("");
  const [creating, setCreating] = useState(false);
  // Procurement can open the create flow from its sourcing step.
  React.useEffect(() => { if (openCreate) setCreating(true); }, [openCreate]);
  const [openRequestId, setOpenRequestId] = useState(null);
  const openRequest = requests.find((r) => r.id === openRequestId) || null;
  const [openVendorId, setOpenVendorId] = useState(null);
  const openVendor = finalised.find((f) => f.id === openVendorId) || null;
  const [toast, setToast] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const reqCounts = useMemo(() => {
    const c = { "All Open Requests": 0, "Needs Review": 0, "Awaiting Responses": 0, "Closed Out": 0 };
    requests.forEach((r) => {
      const cat = requestStatus(r).category;
      c[cat] += 1;
      if (cat !== "Closed Out") c["All Open Requests"] += 1;
    });
    return c;
  }, [requests]);

  const fvCounts = useMemo(() => {
    const c = { "Vendor Finalised": 0, "Procurement Started": 0, "Procurement Completed": 0 };
    finalised.forEach((r) => { if (c[r.status] !== undefined) c[r.status] += 1; });
    return c;
  }, [finalised]);

  const visibleRequests = requests
    .filter((r) => {
      const cat = requestStatus(r).category;
      if (reqFilter === "All Open Requests") return cat !== "Closed Out";
      return cat === reqFilter;
    })
    .filter((r) => r.name.toLowerCase().includes(reqQuery.toLowerCase()));

  const visibleFinalised = finalised
    .filter((r) => (fvFilter ? r.status === fvFilter : true))
    .filter((r) => r.vendor.toLowerCase().includes(fvQuery.toLowerCase()));

  const finishRequest = (request, vendorNames, mode) => {
    const names = vendorNames || [];
    if (names.length) {
      const status = mode === "procure" ? "Procurement Started" : "Vendor Finalised";
      setFinalised((prev) => [
        ...names.map((vendorName, i) => ({
          id: `fv-new-${Date.now()}-${i}`,
          vendor: vendorName,
          request: request.name,
          status,
          // Set only when this vendor was finalised for a workflow that already exists.
          workflow: mode === "procure" && request.linkedTo ? request.linkedTo : null,
          owner: request.createdBy.name,
          updated: "Today",
          activities: [{
            id: `a-new-${Date.now()}-${i}`,
            type: "questionnaire",
            title: "Questionnaire sent to vendor",
            date: request.created,
            status: { text: "Responded", tone: "success" },
            meta: [request.type, "answered"],
            responses: (request.vendors.find((v) => v.name === vendorName) || {}).answers || [],
          }, ...(mode === "procure" ? [{
            id: `a-proc-${Date.now()}-${i}`,
            type: "procurement",
            title: "Procurement request created",
            date: "Today",
            status: { text: "Pending approval", tone: "warning" },
            meta: ["due in 7 days"],
            link: request.linkedTo || `PR-${2060 + prev.length + i}`,
          }] : [])],
        })),
        ...prev,
      ]);
    }
    setRequests((prev) => prev.map((r) => (r.id === request.id
      ? { ...r, completed: true, vendors: r.vendors.map((v) => ({ ...v, read: true })) }
      : r)));
    setOpenRequestId(null);
    if (names.length) {
      const label = names.length === 1 ? names[0] : `${names.length} vendors`;
      // Raised from a procurement workflow: close its sourcing step instead of
      // dropping the user on the finalised tab.
      if (mode === "procure" && request.linkedTo && onLinkedComplete) {
        onLinkedComplete(names[0], request);
        return;
      }
      setTab("finalised");
      flash(mode === "procure"
        ? `${label} finalised and sent to procurement`
        : `${label} added to Finalised Vendors`);
    } else {
      flash("Request marked complete");
    }
  };

  const handleComplete = (request, vendorNames, mode) => {
    finishRequest(request, vendorNames, mode);
    // No procurement origin, so this starts a brand new workflow in Procurement.
    if (mode === "procure" && !request.linkedTo && onStartProcurementWorkflow)
      onStartProcurementWorkflow((vendorNames || [])[0]);
  };

  const startProcurement = (row) => {
    setFinalised((prev) => prev.map((x) =>
      x.id === row.id ? {
        ...x,
        status: "Procurement Started",
        updated: "Today",
        activities: [...(x.activities || []), {
          id: `a-${Date.now()}`, type: "procurement", title: "Procurement request created",
          date: "Today", status: { text: "Pending approval", tone: "warning" },
          meta: ["due in 7 days"], link: `PR-${2060 + prev.length}`,
        }],
      } : x));
    flash(`Procurement request raised for ${row.vendor}`);
    if (onStartProcurementWorkflow) onStartProcurementWorkflow(row.vendor);
  };

  return (
    <div className="ce-root ce-embedded" style={{ display: active ? "block" : "none" }}>
      <style>{VR_CSS}</style>

      <div className="ce-main">

        <div className="ce-page">
          <div className="ce-page-head">
            <h1 className="ce-h1">Vendor Research</h1>
          </div>

          {linkedTo && (
            <div className="ce-banner" style={{ marginTop: 14 }}>
              <Info size={16} color="#4C5AE4" style={{ flex: "none", marginTop: 1 }} />
              <div>
                <p className="ce-banner-title">Sourcing for {linkedTo}</p>
                <p>
                  This request came from a procurement workflow. Finalising a vendor for
                  procurement closes the sourcing step there and sends the result back.
                </p>
              </div>
            </div>
          )}

          <div className="ce-tabsbar">
            <div className="ce-tabs">
              <button className={`ce-tab${tab === "requests" ? " is-active" : ""}`} onClick={() => setTab("requests")}>
                CONTACT REQUESTS
              </button>
              <button className={`ce-tab${tab === "finalised" ? " is-active" : ""}`} onClick={() => setTab("finalised")}>
                FINALISED VENDORS
              </button>
            </div>
            <Btn variant="primary" onClick={() => setCreating(true)}>
              <Plus size={15} /> Create new request
            </Btn>
          </div>

          {tab === "requests" ? (
            <>
              <div className="ce-strip">
                {["All Open Requests", "Needs Review", "Awaiting Responses", "Closed Out"].map((label) => (
                  <button key={label}
                    className={`ce-card${reqFilter === label ? " is-active" : ""}`}
                    onClick={() => setReqFilter(label)}>
                    <p className="ce-card-label">{label}</p>
                    <p className="ce-card-value">{reqCounts[label]}</p>
                    <p className="ce-card-help">
                      {label === "All Open Requests" && "not yet closed out"}
                      {label === "Needs Review" && "unread vendor answers"}
                      {label === "Awaiting Responses" && "vendors still to reply"}
                      {label === "Closed Out" && "marked complete"}
                    </p>
                  </button>
                ))}
              </div>

              <div className="ce-panel">
                <VToolbar count={visibleRequests.length} noun="Requests" query={reqQuery} onQuery={setReqQuery} />

                <div className="ce-tablewrap">
                  <table className="ce-table">
                    <thead>
                      <tr>
                        <th>Request Name</th><th>Vendors</th><th>Status</th><th>Created Date</th>
                        <th>Created By</th><th>Deadline</th><th>Started From</th><th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRequests.map((r) => {
                        const st = requestStatus(r);
                        return (
                          <tr key={r.id}>
                            <td><button className="ce-link" onClick={() => setOpenRequestId(r.id)}>{r.name}</button></td>
                            <td>
                              <div className="ce-vendors">
                                {r.vendors.slice(0, 2).map((v) => <span key={v.name} className="ce-vendorchip">{v.name}</span>)}
                                {r.vendors.length > 2 && <span className="ce-vendorchip">+{r.vendors.length - 2}</span>}
                              </div>
                            </td>
                            <td><VPill tone={st.tone} dot={st.dot}>{st.text}</VPill></td>
                            <td>{r.created}</td>
                            <td>
                              <div className="ce-createdby">
                                <div className="ce-avatar" style={{ background: "#EEF0FE", color: "#3A45C4" }}>
                                  {r.createdBy.initials}
                                </div>
                                <div>
                                  <div className="ce-createdby-name">{r.createdBy.name}</div>
                                  <div className="ce-createdby-mail">{r.createdBy.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{r.deadline}</td>
                            <td>
                              {r.linkedTo ? (
                                <button className="ce-link" onClick={() => onOpenWorkflow(r.linkedTo)}>
                                  {r.linkedTo}
                                </button>
                              ) : (
                                <span style={{ color: "#667085" }}>New Request</span>
                              )}
                            </td>
                            <td><button className="ce-link" onClick={() => setOpenRequestId(r.id)}>View details</button></td>
                          </tr>
                        );
                      })}
                      {visibleRequests.length === 0 && (
                        <tr><td colSpan={8}>
                          <div className="ce-empty">
                            <Users size={22} color="#98A2B3" />
                            <h4>No requests here yet</h4>
                            <p>Create a request and we'll match you with vendors to send it to.</p>
                            <VBtn variant="primary" onClick={() => setCreating(true)}>
                              <Plus size={15} /> Create new request
                            </VBtn>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {visibleRequests.length > 0 && <VPager total={visibleRequests.length} />}
              </div>
            </>
          ) : (
            <>
              <div className="ce-strip" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                {["Vendor Finalised", "Procurement Started", "Procurement Completed"].map((label) => (
                  <button key={label}
                    className={`ce-card${fvFilter === label ? " is-active" : ""}`}
                    onClick={() => setFvFilter(fvFilter === label ? null : label)}>
                    <p className="ce-card-label">{label}</p>
                    <p className="ce-card-value">{fvCounts[label]}</p>
                    <p className="ce-card-help">
                      {label === "Vendor Finalised" && "ready to start procurement"}
                      {label === "Procurement Started" && "workflow in progress"}
                      {label === "Procurement Completed" && "workflow finished"}
                    </p>
                  </button>
                ))}
              </div>

              <div className="ce-panel">
                <VToolbar count={visibleFinalised.length} noun="Vendors" query={fvQuery} onQuery={setFvQuery} />

                <div className="ce-tablewrap">
                  <table className="ce-table">
                    <thead>
                      <tr><th>Vendor</th><th>Request Name</th><th>Status</th><th>Workflow</th><th>Details</th></tr>
                    </thead>
                    <tbody>
                      {visibleFinalised.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <button className="ce-link" onClick={() => setOpenVendorId(r.id)}>{r.vendor}</button>
                          </td>
                          <td>{r.request}</td>
                          <td><VPill tone={FV_TONE[r.status]}>{r.status}</VPill></td>
                          <td>
                            {r.workflow ? (
                              <VBtn size="sm" variant="primary" onClick={() => onOpenWorkflow(r.workflow)}>
                                Continue procurement with this vendor
                              </VBtn>
                            ) : r.status === "Vendor Finalised" ? (
                              <VBtn size="sm" onClick={() => startProcurement(r)}>
                                Start procurement workflow
                              </VBtn>
                            ) : r.status === "Vendor Discarded" ? (
                              <span style={{ color: "#98A2B3" }}>—</span>
                            ) : (
                              <button className="ce-link">Workflow #4821 <ArrowUpRight size={12} /></button>
                            )}
                          </td>
                          <td><button className="ce-link" onClick={() => setOpenVendorId(r.id)}>View details</button></td>
                        </tr>
                      ))}
                      {visibleFinalised.length === 0 && (
                        <tr><td colSpan={5}>
                          <div className="ce-empty">
                            <Building2 size={22} color="#98A2B3" />
                            <h4>No finalised vendors yet</h4>
                            <p>Vendors show up here once you mark a contact request complete or start procurement.</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {visibleFinalised.length > 0 && <VPager total={visibleFinalised.length} />}
              </div>
            </>
          )}
        </div>
      </div>

      {creating && (
        <CreateRequestModal
          prefill={prefill}
          onClose={() => setCreating(false)}
          onSend={({ name, vendors, deadline }) => {
            setRequests((prev) => [{
              id: `req-${Date.now()}`,
              name: name || "Untitled request",
              type: "RFI",
              vendors: vendors.map((v) => ({
                name: v,
                contact: "Vendor contact",
                role: "Account Executive",
                status: "waiting",
                date: "Today",
                read: true,
                answers: [],
              })),
              completed: false,
              created: "Today",
              createdBy: { name: "Guy Hawkins", email: "guy.hawkins@democorp.com", initials: "GH" },
              deadline: deadline || "—",
              linkedTo: linkedTo || null,
            }, ...prev]);
            if (linkedTo && onLinkedCreated)
              onLinkedCreated({ name: name || "Untitled request", vendors, deadline: deadline || "—" });
            setCreating(false);
            setTab("requests");
            setReqFilter("All Open Requests");
            flash("Questionnaire sent");
          }}
        />
      )}

      {openRequest && (
        <RequestResponsesModal
          request={openRequest}
          onClose={() => setOpenRequestId(null)}
          onComplete={handleComplete}
          onRead={(reqId, vendorName) =>
            setRequests((prev) => prev.map((r) => (r.id === reqId
              ? { ...r, vendors: r.vendors.map((v) => (v.name === vendorName ? { ...v, read: true } : v)) }
              : r)))}
          flash={flash}
        />
      )}

      {openVendor && (
        <VendorDetailsModal
          onContinue={onOpenWorkflow}
          row={openVendor}
          onClose={() => setOpenVendorId(null)}
          onAddActivity={(id, activity) => {
            setFinalised((prev) => prev.map((x) =>
              x.id === id ? { ...x, activities: [...(x.activities || []), activity], updated: "Today" } : x));
            flash({
              questionnaire: "Questionnaire sent",
              email: "Email sent",
              upload: "Document uploaded",
            }[activity.type]);
          }}
          onStart={(row) => startProcurement(row)}
          onDiscard={(row) => {
            setFinalised((prev) => prev.map((x) =>
              x.id === row.id ? { ...x, status: "Vendor Discarded", updated: "Today" } : x));
            setOpenVendorId(null);
            flash(`${row.vendor} discarded`);
          }}
        />
      )}


      {toast && <div className="ce-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

/* Turns a live form back into the builder's shape, so opening one from the
   library shows the questions that are actually in use rather than a stub. */
function answerTypeOf(f) {
  if (f.type === "paragraph") return "Long Answer";
  if (f.type === "text") return "Short Answer";
  if (f.type === "number") return "Number";
  if (f.type === "date") return "Date";
  if (f.type === "file" || f.type === "upload") return "File Upload";
  if (f.type === "checkbox") return "Yes / No";
  if (f.type === "scale") return "Rating (1-5)";
  if (f.type === "pricing") return "Pricing (locked)";
  if (f.type === "toggle")
    return (f.options || []).join("/") === "Yes/No" ? "Yes / No" : "Single Select";
  return "Single Select";  // select, radio, modelSelect
}

/* What other companies put on a form of this type. Anonymised and stated as a
   share of the customer base, so the requester can judge how standard a
   question is before adding it. */
const CROSS_COMPANY_QUESTIONS = {
  "Procurement Intake": [
    { text: "Who is the business owner accountable for this purchase?", type: "Short Answer", pct: 78 },
    { text: "Does this replace an existing tool or contract?", type: "Yes / No", pct: 71 },
    { text: "What is the expected go-live date?", type: "Date", pct: 64 },
    { text: "Which compliance reviews does this need?", type: "Multi Select", pct: 58 },
    { text: "What happens if this is not approved?", type: "Long Answer", pct: 44 },
  ],
  "Vendor Questionnaire": [
    { text: "Describe your data retention and deletion policy.", type: "Long Answer", pct: 82 },
    { text: "What is your uptime SLA and what are the remedies?", type: "Long Answer", pct: 76 },
    { text: "List any sub-processors with access to customer data.", type: "Long Answer", pct: 69 },
    { text: "What does implementation look like at our size?", type: "Short Answer", pct: 63 },
    { text: "Submit your pricing.", type: "Pricing (locked)", pct: 57 },
  ],
  "User Survey": [
    { text: "How easy was it to raise this request?", type: "Rating (1-5)", pct: 74 },
    { text: "How long did the process take from your point of view?", type: "Single Select", pct: 61 },
    { text: "What would have made this easier?", type: "Long Answer", pct: 55 },
  ],
};

/* What colleagues are already asking. Counted across the forms of this type that
   exist in the workspace, so it reflects the real library rather than a list. */
function companyQuestions(formType) {
  const counts = {};
  const note = (text, type, form) => {
    const k = text.toLowerCase();
    if (!counts[k]) counts[k] = { text, type, forms: [] };
    if (!counts[k].forms.includes(form)) counts[k].forms.push(form);
  };

  if (formType === "Procurement Intake")
    Object.values(CATEGORIES).forEach((c) => c.fields.forEach((f) => {
      if (f.type !== "file") note(f.label, answerTypeOf(f), c.formName);
    }));
  else if (formType === "Vendor Questionnaire")
    Object.entries(FORM_TEMPLATES).forEach(([name, qs]) =>
      qs.forEach((q) => note(q.text, answerTypeOf(q), name)));
  else if (formType === "User Survey")
    SURVEY_QUESTIONS.forEach((q) => note(q.text, q.type, "Requester Experience Survey"));

  return Object.values(counts).sort((a, b) => b.forms.length - a.forms.length);
}

const SURVEY_QUESTIONS = [
  { text: "How easy was it to raise this request?", type: "Rating (1-5)", required: true },
  { text: "Did the request take longer than you expected?", type: "Yes / No", required: true },
  { text: "What would have made this easier?", type: "Long Answer", required: false },
  { text: "Would you use procurement again for a purchase this size?", type: "Yes / No", required: true },
];

function questionsForForm(name) {
  const cat = Object.values(CATEGORIES).find((c) => c.formName === name);
  if (cat)
    return cat.fields.map((f) => ({
      id: `q-${f.id}`, text: f.label, desc: f.help || "",
      type: answerTypeOf(f), required: !!f.required,
    }));
  if (FORM_TEMPLATES[name])
    return FORM_TEMPLATES[name].map((q) => ({
      id: q.id, text: q.text, desc: "", type: answerTypeOf(q), required: !!q.required,
    }));
  if (name === "Requester Experience Survey")
    return SURVEY_QUESTIONS.map((q, i) => ({ id: `sv-${i}`, desc: "", ...q }));
  return null;
}

const FORM_TYPE_HELP = {
  "Procurement Intake": "Selectable when configuring an intake category, so requesters fill it in Raise a Request.",
  "Vendor Questionnaire": "Selectable as a template in Vendor Research when a contact request goes out to vendors.",
  "User Survey": "Sent to requesters on closure or to owners before renewal. Results land in Reporting.",
};

const ANSWER_TYPES = ["Short Answer", "Long Answer", "Single Select", "Multi Select",
  "Yes / No", "Rating (1-5)", "Date", "Number", "File Upload", "Pricing (locked)"];

/* Stand-in for generation. Keyed off the words in the prompt so the demo does
   not always produce the same form regardless of what was asked for. */
const AI_FORM_SETS = [
  { match: ["security", "compliance", "soc", "risk", "privacy", "pii"],
    name: "Security and Privacy Review", type: "Vendor Questionnaire",
    qs: [
      ["Describe your SOC 2 Type II status and audit date.", "Long Answer", true],
      ["Where will our data be stored?", "Single Select", true],
      ["Do you support SAML SSO and SCIM on our tier?", "Yes / No", true],
      ["Will any customer PII be processed?", "Yes / No", true],
      ["Attach your latest penetration test summary.", "File Upload", false],
    ] },
  { match: ["renewal", "contract", "term", "expiry"],
    name: "Contract Renewal Review", type: "Procurement Intake",
    qs: [
      ["What is the current contract end date?", "Date", true],
      ["How many licences are actively in use?", "Number", true],
      ["What changed in usage since the last renewal?", "Long Answer", true],
      ["Do we want to renew, renegotiate, or cancel?", "Single Select", true],
      ["Submit renewal pricing.", "Pricing (locked)", true],
    ] },
  { match: ["access", "licence", "license", "seat", "provision"],
    name: "Application Access Request", type: "Procurement Intake",
    qs: [
      ["Which application do you need access to?", "Short Answer", true],
      ["What will you use it for?", "Long Answer", true],
      ["Which team are you in?", "Single Select", true],
      ["Do you need admin rights?", "Yes / No", true],
      ["When do you need it by?", "Date", false],
    ] },
];

const AI_FORM_DEFAULT = {
  name: "Vendor Evaluation", type: "Vendor Questionnaire",
  qs: [
    ["What problem does your product solve for us?", "Long Answer", true],
    ["What is your licensing model?", "Single Select", true],
    ["Which of our requirements does your standard tier cover?", "Multi Select", true],
    ["How long does implementation typically take?", "Short Answer", true],
    ["Submit your pricing.", "Pricing (locked)", true],
  ],
};

function aiFormFor(prompt) {
  const p = (prompt || "").toLowerCase();
  return AI_FORM_SETS.find((s) => s.match.some((m) => p.includes(m))) || AI_FORM_DEFAULT;
}

const UPLOADED_FORM = {
  name: "Supplier Onboarding Pack", type: "Vendor Questionnaire",
  qs: [
    ["Registered company name", "Short Answer", true],
    ["Company registration number", "Short Answer", true],
    ["Primary billing contact", "Short Answer", true],
    ["Remittance bank details", "File Upload", true],
    ["W-9 or equivalent tax form", "File Upload", true],
    ["Certificate of insurance", "File Upload", false],
  ],
};

/* ---------------------------------- ADMIN --------------------------------- */

function AdminToolbar({ count, noun, query, onQuery, perPage, cta, onCta, cta2, onCta2 }) {
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <div className="w-80 rounded-md px-3 py-2 flex items-center gap-2" style={{ border: `1px solid ${T.border}` }}>
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search"
          className="text-sm flex-1 outline-none" style={{ color: T.text }} />
        <Search size={15} style={{ color: T.textSecondary }} />
      </div>
      <div className="p-2 rounded-md" style={{ border: `1px solid ${T.border}` }}>
        <Filter size={15} style={{ color: T.textSecondary }} />
      </div>
      <div className="px-3 py-2 rounded-md text-sm flex items-center gap-2"
        style={{ border: `1px solid ${T.border}`, color: T.text }}>
        Default View <ChevronDown size={14} />
      </div>
      <div className="p-2 rounded-md" style={{ border: `1px solid ${T.border}` }}>
        <Share2 size={15} style={{ color: T.textSecondary }} />
      </div>
      <div className="flex-1" />
      <span className="text-sm" style={{ color: T.textSecondary }}>{count} {noun}</span>
      <div className="p-2 rounded-md" style={{ border: `1px solid ${T.border}` }}>
        <Columns2 size={15} style={{ color: T.textSecondary }} />
      </div>
      <div className="p-2 rounded-md" style={{ border: `1px solid ${T.border}` }}>
        <MoreVertical size={15} style={{ color: T.textSecondary }} />
      </div>
      {cta2 && <Btn variant="secondary" onClick={onCta2}>{cta2}</Btn>}
      <Btn variant="primary" onClick={onCta}>{cta}</Btn>
    </div>
  );
}

function AdminPager({ total, page, perPage, onPage, onPerPage }) {
  const from = total === 0 ? 0 : page * perPage + 1;
  const to = Math.min(total, (page + 1) * perPage);
  const last = Math.max(0, Math.ceil(total / perPage) - 1);
  return (
    <div className="flex items-center justify-end gap-4 px-4 py-3"
      style={{ borderTop: `1px solid ${T.border}` }}>
      <span className="text-sm" style={{ color: T.textSecondary }}>Rows per page</span>
      <select value={perPage} onChange={(e) => { onPerPage(Number(e.target.value)); onPage(0); }}
        className="rounded-md px-2 py-1 text-sm outline-none cursor-pointer"
        style={{ border: `1px solid ${T.border}`, color: T.text }}>
        {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="text-sm" style={{ color: T.text }}>{from} - {to} of {total}</span>
      <button onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0}
        className="p-1 rounded cursor-pointer" style={{ opacity: page === 0 ? 0.35 : 1 }}>
        <ChevronLeft size={16} style={{ color: T.textSecondary }} />
      </button>
      <button onClick={() => onPage(Math.min(last, page + 1))} disabled={page >= last}
        className="p-1 rounded cursor-pointer" style={{ opacity: page >= last ? 0.35 : 1 }}>
        <ChevronRight size={16} style={{ color: T.textSecondary }} />
      </button>
    </div>
  );
}

function IntakeSettingsPage({ toast }) {
  const [tab, setTab] = useState("procurement");
  const [creating, setCreating] = useState(false);
  const [policies, setPolicies] = useState(false);
  const [editing, setEditing] = useState(null);
  const [added, setAdded] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const base = useMemo(buildIntakeRows, []);
  const all = [...added, ...base];

  const rows = all.filter((r) =>
    !query || [r.cat, r.form, r.wf, r.upd].join(" ").toLowerCase().includes(query.toLowerCase()));
  const shown = rows.slice(page * perPage, (page + 1) * perPage);
  const cols = "2.1fr 1.3fr 1.4fr 1fr 1.1fr 1.4fr 1fr 1.3fr 1.1fr";

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {[["procurement", "Procurement Intake"], ["renewal", "Renewal Trigger"]].map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setPage(0); }}
            className="px-4 py-2.5 rounded-md text-sm font-medium cursor-pointer"
            style={{ background: tab === id ? T.blue : "transparent",
                     color: tab === id ? "#fff" : T.textSecondary }}>
            {label}
          </button>
        ))}
      </div>

      <h1 className="text-3xl font-semibold mb-5" style={{ color: T.text }}>Intake settings</h1>

      {tab === "renewal" ? (
        <Card>
          <div className="py-10 text-center">
            <RefreshCw size={22} style={{ color: T.placeholder, margin: "0 auto 10px" }} />
            <div className="text-sm font-medium" style={{ color: T.text }}>No renewal triggers configured</div>
            <div className="text-sm mt-1" style={{ color: T.textSecondary }}>
              Renewal triggers fire an intake form ahead of a contract end date.
            </div>
          </div>
        </Card>
      ) : (
        <>
          <AdminToolbar count={rows.length} noun="Forms" query={query}
            onQuery={(v) => { setQuery(v); setPage(0); }}
            cta="Create new intake request" onCta={() => setCreating(true)}
            cta2="View policies" onCta2={() => setPolicies(true)} />

          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, background: "#fff" }}>
            <div className="grid px-4 py-2.5 text-sm font-semibold"
              style={{ background: T.lavender, color: T.navy, gridTemplateColumns: cols }}>
              <div>Intake Category</div><div>Page Name</div><div>Form</div><div>Intake Type</div>
              <div>Workflow Type</div><div>Workflow</div><div>Defined By</div><div>Updated By</div><div>Updated On</div>
            </div>
            {shown.map((r, i) => (
              <div key={r.cat + i} className="grid px-4 py-3 text-sm items-center"
                style={{ borderTop: `1px solid ${T.border}`, gridTemplateColumns: cols, color: T.text }}>
                <div className="flex items-center gap-2 pr-2 min-w-0">
                  {r.config ? (
                    <button onClick={() => { setEditing(r.config); setCreating(true); }}
                      className="truncate cursor-pointer text-left" style={{ color: T.blue }}>
                      {r.cat}
                    </button>
                  ) : (
                    <span className="truncate" style={{ color: T.blue }}>{r.cat}</span>
                  )}
                  {r.badge && <Pill bg={T.blue} fg="#fff">{r.badge}</Pill>}
                  {r.mark === "routing" && <GitBranch size={13} style={{ color: T.periwinkle, flexShrink: 0 }} />}
                  {r.mark === "tree" && <Network size={13} style={{ color: T.periwinkle, flexShrink: 0 }} />}
                </div>
                <div className="truncate pr-2" style={{ color: T.textSecondary }}>{r.page}</div>
                <div className="truncate pr-2" style={{ color: T.blue }}>{r.form}</div>
                <div>{r.type}</div>
                <div>{r.wfType}</div>
                <div className="truncate pr-2" style={{ color: T.blue }}>{r.wf}</div>
                <div>{r.by}</div>
                <div className="truncate pr-2">{r.upd}</div>
                <div>{r.on}</div>
              </div>
            ))}
            {!shown.length && (
              <div className="px-4 py-10 text-center text-sm" style={{ color: T.textSecondary }}>
                No intake categories match that search.
              </div>
            )}
            <AdminPager total={rows.length} page={page} perPage={perPage}
              onPage={setPage} onPerPage={setPerPage} />
          </div>
        </>
      )}

      {policies && (
        <PoliciesModal toast={toast} onClose={() => setPolicies(false)}
          onEdit={(cfg) => { setPolicies(false); setEditing(cfg); setCreating(true); }} />
      )}

      {creating && (
        <CreateIntakeModal toast={toast} initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(cfg) => {
            if (cfg.editing) {
              setCreating(false);
              setEditing(null);
              toast(`${cfg.cat} intake updated, ${cfg.conditions} conditions`);
              return;
            }
            setAdded((a) => [{
              cat: cfg.cat, badge: "New", mark: cfg.type === "Routing" ? "routing" : undefined,
              page: "Procurement Request", form: cfg.form, type: cfg.type, wfType: "Automated",
              wf: cfg.workflow, by: "Company", upd: "Saransh Chauhan", on: "Sep 12, 2026",
            }, ...a]);
            setCreating(false);
            setEditing(null);
            setQuery("");
            setPage(0);
            toast(`${cfg.cat} intake saved with ${cfg.conditions} condition${cfg.conditions === 1 ? "" : "s"}`);
          }} />
      )}
    </div>
  );
}

function FormsLibraryPage({ toast }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [adding, setAdding] = useState(false);
  const [opening, setOpening] = useState(null);
  const [added, setAdded] = useState([]);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const base = useMemo(buildFormRows, []);
  const all = [...added, ...base];

  const rows = all.filter((r) => {
    if (typeFilter !== "All types" && r.type !== typeFilter) return false;
    return !query || [r.form, r.type, r.creator, r.upd].join(" ").toLowerCase()
      .includes(query.toLowerCase());
  });
  const shown = rows.slice(page * perPage, (page + 1) * perPage);
  const cols = "2.2fr 1.5fr 1.3fr 1.3fr 1.1fr 1.2fr .9fr .9fr .5fr";

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-5" style={{ color: T.text }}>Form library</h1>

      <div className="flex items-center gap-2 mb-4">
        {["All types", ...FORM_TYPES].map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(0); }}
            className="px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer"
            style={{ background: typeFilter === t ? T.lavender : "transparent",
                     color: typeFilter === t ? T.blue : T.textSecondary,
                     border: `1px solid ${typeFilter === t ? T.blue : "transparent"}` }}>
            {t}
          </button>
        ))}
      </div>

      <AdminToolbar count={rows.length} noun="Forms" query={query}
        onQuery={(v) => { setQuery(v); setPage(0); }}
        cta="Add New Form" onCta={() => setAdding(true)} />

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, background: "#fff" }}>
        <div className="grid px-4 py-2.5 text-sm font-semibold"
          style={{ background: T.lavender, color: T.navy, gridTemplateColumns: cols }}>
          <div>Form</div><div>Form Type</div><div>Created By</div><div>Updated By</div>
          <div>Updated On</div><div>No Of Questions</div><div>Defined By</div>
          <div>Status</div><div>Actions</div>
        </div>
        {shown.map((r, i) => (
          <div key={r.form + i} className="grid px-4 py-3 text-sm items-center"
            style={{ borderTop: `1px solid ${T.border}`, gridTemplateColumns: cols, color: T.text }}>
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {r.live ? (
                <button onClick={() => setOpening(r)} className="truncate cursor-pointer text-left"
                  style={{ color: T.blue }}>{r.form}</button>
              ) : (
                <span className="truncate" style={{ color: T.blue }}>{r.form}</span>
              )}
              {r.live && <Pill bg="#E6F4EE" fg={T.success}>In use</Pill>}
            </div>
            <div className="pr-2">
              <Pill bg={T.lavender} fg={T.navy}>{r.type}</Pill>
            </div>
            <div className="truncate pr-2">{r.creator}</div>
            <div className="truncate pr-2">{r.upd}</div>
            <div>{r.on}</div>
            <div>{r.q}</div>
            <div>Company</div>
            <div>
              {(r.status || "Active") === "Active"
                ? <span style={{ color: T.text }}>Active</span>
                : <span style={{ color: T.textSecondary }}>Inactive</span>}
            </div>
            <div><MoreVertical size={15} style={{ color: T.textSecondary }} /></div>
          </div>
        ))}
        {!shown.length && (
          <div className="px-4 py-10 text-center text-sm" style={{ color: T.textSecondary }}>
            No forms match that search.
          </div>
        )}
        <AdminPager total={rows.length} page={page} perPage={perPage}
          onPage={setPage} onPerPage={setPerPage} />
      </div>

      {opening && (
        <AddFormModal toast={toast}
          initial={{ name: opening.form, type: opening.type,
                     questions: questionsForForm(opening.form) || [] }}
          onClose={() => setOpening(null)}
          onCreate={({ name, questions }) => {
            setOpening(null);
            toast(`${name} saved, ${questions.length} questions`);
          }} />
      )}

      {adding && (
        <AddFormModal toast={toast} onClose={() => setAdding(false)}
          onCreate={({ name, type, questions }) => {
            setAdded((a) => [{
              form: name, type, creator: "Saransh Chauhan",
              upd: "Saransh Chauhan", on: "Sep 12, 2026", q: questions.length,
              status: "Active", live: true,
            }, ...a]);
            setAdding(false);
            setTypeFilter("All types");
            setQuery("");
            setPage(0);
            toast(`${name} added as a ${type.toLowerCase()} with ${questions.length} questions`);
          }} />
      )}
    </div>
  );
}

/* Reads the live intake configurations and presents them as policy: the
   statement, the rule enforcing it, where it routes, and how it has performed.
   Recommendations are derived here, not hardcoded, so editing a condition
   changes what this screen says. */
function readRule(catId, r) {
  const f = (CATEGORIES[catId].fields || []).find((x) => x.id === r.field);
  const label = f ? f.label.replace(/\?$/, "") : r.field;
  // Not every number is a currency. Quantity is a count, rate and amount are not.
  const currency = f && f.type === "number" && f.prefix === "$";
  const val = r.value === "" ? "" :
    currency && !isNaN(Number(r.value)) ? money(Number(r.value)) : r.value;
  return [label, r.op, val].filter(Boolean).join(" ");
}

function policyRecommendations() {
  const out = [];
  Object.entries(INTAKE_CONFIGS).forEach(([id, cfg]) => {
    const label = CATEGORIES[id].label;

    if (!cfg.conds.length) {
      out.push({ tone: "warning", cat: label,
        title: `No policy in force for ${label}`,
        body: `Every ${label.toLowerCase()} request follows the same path regardless of value or risk. A $5,000 request and a $500,000 request are treated identically.`,
        impact: "Add at least a spend threshold so the exceptions are the only thing that needs a human." });
      return;
    }

    cfg.conds.forEach((c) => {
      if (c.verdict) {
        out.push({ tone: c.verdict.tone, cat: label, title: c.verdict.text,
          body: `${c.policy}. ${c.verdict.detail}`,
          impact: c.verdict.tone === "success" ? "No change recommended."
            : `Matched ${c.stats.matched} of ${c.stats.evaluated} requests, adding a median ${c.stats.days} days.` });
        return;
      }
      if (c.stats.unchanged >= 90) {
        out.push({ tone: "warning", cat: label, title: "Rarely changes the outcome",
          body: `${c.policy}. ${c.stats.unchanged}% of matches were approved with no change to the request.`,
          impact: `Removing or relaxing it would recover a median ${c.stats.days} days on ${c.stats.matched} requests a year.` });
      } else if (c.stats.days >= 5) {
        out.push({ tone: "info", cat: label,
          title: `Adds ${c.stats.days} days, and earns it`,
          body: `${c.policy}. It adds a median ${c.stats.days} days and changes the outcome on ${100 - c.stats.unchanged}% of matches.`,
          impact: "Worth keeping. Look at the approver wait rather than the rule itself." });
      }
    });
  });

  // a gap that only shows up when the configurations are compared to each other
  const thresholds = [];
  Object.entries(INTAKE_CONFIGS).forEach(([id, cfg]) =>
    cfg.conds.forEach((c) => c.rules.forEach((r) => {
      const f = (CATEGORIES[id].fields || []).find((x) => x.id === r.field);
      if (f && f.type === "number" && r.op.includes("greater")) 
        thresholds.push({ cat: CATEGORIES[id].label, value: Number(r.value) });
    })));
  const spread = thresholds.filter((t) => t.value >= 1000);
  if (spread.length > 1) {
    const lo = spread.reduce((a, b) => (a.value <= b.value ? a : b));
    const hi = spread.reduce((a, b) => (a.value >= b.value ? a : b));
    if (hi.value / lo.value > 10)
      out.push({ tone: "info", cat: "Across categories",
        title: "Spend thresholds are inconsistent between categories",
        body: `${hi.cat} escalates above ${money(hi.value)} while ${lo.cat} escalates above ${money(lo.value)}. The same dollar is treated very differently depending on what is being bought.`,
        impact: "Agree one escalation ladder and apply it per category, or be able to explain why they differ." });
  }
  return out;
}

function PoliciesModal({ onClose, onEdit, toast }) {
  const [applied, setApplied] = useState([]);
  const recs = policyRecommendations();
  const live = Object.entries(INTAKE_CONFIGS).filter(([, c]) => c.conds.length);
  const total = live.reduce((n, [, c]) => n + c.conds.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-8 overflow-y-auto"
      style={{ background: "rgba(24,27,74,.45)" }}>
      <div className="rounded-lg w-full max-w-4xl" style={{ background: "#fff" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: T.text }}>Procurement policies</h2>
            <div className="text-sm mt-0.5" style={{ color: T.textSecondary }}>
              {total} policies in force across {live.length} of {Object.keys(INTAKE_CONFIGS).length} categories,
              taken from the conditions configured on each intake.
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer"><X size={20} style={{ color: T.textSecondary }} /></button>
        </div>

        <div className="px-6 py-5" style={{ maxHeight: "72vh", overflowY: "auto" }}>
          <div className="text-base font-semibold mb-3" style={{ color: T.text }}>In force</div>

          {Object.entries(INTAKE_CONFIGS).map(([id, cfg]) => (
            <div key={id} className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold" style={{ color: T.text }}>{CATEGORIES[id].label}</span>
                <div className="flex-1 h-px" style={{ background: T.border }} />
                <button onClick={() => onEdit(cfg)} className="text-xs cursor-pointer" style={{ color: T.blue }}>
                  Edit conditions
                </button>
              </div>

              {!cfg.conds.length ? (
                <div className="rounded-lg px-4 py-3 text-sm"
                  style={{ border: `1px dashed ${T.border}`, color: T.textSecondary }}>
                  No conditions configured. Everything routes to {cfg.fallback}.
                </div>
              ) : cfg.conds.map((c) => (
                <div key={c.id} className="rounded-lg p-4 mb-2" style={{ border: `1px solid ${T.border}` }}>
                  <div className="flex items-start gap-3 mb-2">
                    <Scale size={16} style={{ color: T.periwinkle, flexShrink: 0, marginTop: 2 }} />
                    <div className="flex-1 text-sm font-medium" style={{ color: T.text }}>{c.policy}</div>
                    <Pill bg="#E6F4EE" fg={T.success}>Live</Pill>
                  </div>

                  <div className="rounded-md px-3 py-2 mb-3" style={{ background: T.lavender }}>
                    <span className="text-xs" style={{ color: T.textSecondary }}>Enforced when </span>
                    <span className="text-xs font-medium" style={{ color: T.navy }}>
                      {c.rules.map((r) => readRule(id, r)).join(" and ")}
                    </span>
                    <span className="text-xs" style={{ color: T.textSecondary }}> then route to </span>
                    <span className="text-xs font-medium" style={{ color: T.navy }}>{c.template}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[["Evaluated", c.stats.evaluated],
                      ["Matched", c.stats.matched],
                      ["Approved unchanged", c.stats.unchanged + "%"],
                      ["Median days added", c.stats.days || "None"]].map(([k, v], i) => (
                      <div key={k}>
                        <div className="text-xs" style={{ color: T.textSecondary }}>{k}</div>
                        <div className="text-sm font-semibold"
                          style={{ color: i === 2 && c.stats.unchanged >= 90 ? T.warning
                                        : i === 3 && c.stats.days >= 5 ? T.warning : T.text }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="text-base font-semibold mb-1 mt-6" style={{ color: T.text }}>What to improve</div>
          <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
            Read from the conditions above and how they have performed. Editing a condition changes what appears here.
          </div>

          <div className="space-y-3">
            {recs.map((r, i) => {
              const done = applied.includes(r.title + i);
              return (
                <div key={i} className="rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
                  <div className="flex items-start gap-3">
                    {r.tone === "success"
                      ? <CheckCircle2 size={17} style={{ color: T.success, flexShrink: 0, marginTop: 2 }} />
                      : <AlertTriangle size={17} style={{ color: r.tone === "warning" ? T.warning : T.blue,
                          flexShrink: 0, marginTop: 2 }} />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: T.text }}>{r.title}</span>
                        <Pill bg={T.lavender} fg={T.navy}>{r.cat}</Pill>
                      </div>
                      <div className="text-sm mb-2" style={{ color: T.textSecondary }}>{r.body}</div>
                      <div className="text-sm" style={{ color: T.text }}>{r.impact}</div>
                      {r.tone !== "success" && (
                        <div className="mt-3">
                          {done ? (
                            <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> Change applied</Pill>
                          ) : (
                            <Btn variant="secondary" size="sm"
                              onClick={() => { setApplied([...applied, r.title + i]); toast("Policy change recorded"); }}>
                              Apply this change
                            </Btn>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-end" style={{ borderTop: `1px solid ${T.border}` }}>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

function CreateIntakeModal({ initial, onClose, onSave, toast }) {
  const catIds = Object.keys(CATEGORIES);
  // Editing an existing intake starts from its saved rules, copied so the
  // constant is never mutated.
  const [catId, setCatId] = useState(initial ? initial.catId : "");
  const [branch, setBranch] = useState(initial ? initial.branch : "yes");
  const [form, setForm] = useState(initial ? initial.form : "");
  const [conds, setConds] = useState(() => initial
    ? initial.conds.map((c) => ({ ...c, rules: c.rules.map((r) => ({ ...r })), watchers: [...c.watchers] }))
    : [{ id: "c1", open: true, rules: [{ field: "", op: "", value: "" }],
         template: "", name: "", owner: "", watchers: [] }]);
  const [fallback, setFallback] = useState(initial ? initial.fallback : "");

  const cat = catId ? CATEGORIES[catId] : null;
  // Conditions can only test questions that exist on the selected form.
  const questions = cat ? cat.fields.filter((f) => f.type !== "file") : [];

  const pickCat = (id) => {
    setCatId(id);
    setForm(CATEGORIES[id].formName);
    setConds((cs) => cs.map((c) => ({ ...c, rules: c.rules.map(() => ({ field: "", op: "", value: "" })) })));
  };

  const updCond = (id, patch) => setConds((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const updRule = (cid, i, patch) => setConds((cs) => cs.map((c) => c.id !== cid ? c
    : { ...c, rules: c.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));

  const complete = conds.filter((c) => c.template && c.name
    && c.rules.some((r) => r.field && r.op));
  const ready = catId && form && (branch === "no" ? conds[0].template : complete.length > 0);

  const fieldOf = (id) => questions.find((q) => q.id === id);

  const valueControl = (cid, i, r) => {
    const f = fieldOf(r.field);
    if (!f || r.op === "is empty" || r.op === "is checked" || r.op === "is not checked")
      return <input disabled placeholder="Value" className="rounded-md px-3 py-2 text-sm w-full"
        style={{ border: `1px solid ${T.border}`, background: T.lavender, color: T.placeholder }} />;
    if (f.type === "modelSelect")
      return (
        <select value={r.value} onChange={(e) => updRule(cid, i, { value: e.target.value })}
          className="rounded-md px-3 py-2 text-sm w-full outline-none cursor-pointer"
          style={{ border: `1px solid ${T.border}`, color: r.value ? T.text : T.placeholder }}>
          <option value="">Value</option>
          {Object.values(HARDWARE_MODELS).flat().map((m) => <option key={m.name}>{m.name}</option>)}
        </select>
      );
    if (f.options)
      return (
        <select value={r.value} onChange={(e) => updRule(cid, i, { value: e.target.value })}
          className="rounded-md px-3 py-2 text-sm w-full outline-none cursor-pointer"
          style={{ border: `1px solid ${T.border}`, color: r.value ? T.text : T.placeholder }}>
          <option value="">Value</option>
          {f.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    return <input value={r.value} onChange={(e) => updRule(cid, i, { value: e.target.value })}
      placeholder="Value" className="rounded-md px-3 py-2 text-sm w-full outline-none"
      style={{ border: `1px solid ${r.value ? T.blue : T.border}`, color: T.text }} />;
  };

  const Step = ({ n, title, sub, last, children }) => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ background: T.blue, color: "#fff" }}>{n}</div>
        {!last && <div className="flex-1 w-px mt-1" style={{ background: T.blue, minHeight: 20 }} />}
      </div>
      <div className="flex-1 min-w-0 pb-6">
        <div className="text-base font-semibold" style={{ color: T.text }}>{title}</div>
        {sub && <div className="text-sm mt-0.5 mb-2" style={{ color: T.textSecondary }}>{sub}</div>}
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-8 overflow-y-auto"
      style={{ background: "rgba(24,27,74,.45)" }}>
      <div className="rounded-lg w-full max-w-4xl" style={{ background: "#fff" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.lavender }}>
              <GitBranch size={16} style={{ color: T.periwinkle }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: T.text }}>
              {initial ? "Edit Intake Request" : "Create Intake Request"}
            </h2>
          </div>
          <button onClick={onClose} className="cursor-pointer"><X size={20} style={{ color: T.textSecondary }} /></button>
        </div>

        <div className="px-6 py-5" style={{ maxHeight: "72vh", overflowY: "auto" }}>
          <Step n={1} title="Select the Intake Category">
            <div className="max-w-md">
              <div className="text-sm mb-1.5" style={{ color: T.textSecondary }}>Module</div>
              <div className="rounded-md px-3 py-2.5 text-sm mb-4"
                style={{ background: T.lavender, color: T.text, border: `1px solid ${T.border}` }}>
                Procurement Request Module
              </div>
              <div className="text-sm mb-1.5" style={{ color: T.text }}>
                Intake Request<span style={{ color: T.error }}> *</span>
              </div>
              <div className="flex items-center gap-3">
                <select value={catId} onChange={(e) => pickCat(e.target.value)}
                  className="flex-1 rounded-md px-3 py-2.5 text-sm outline-none cursor-pointer"
                  style={{ border: `1px solid ${catId ? T.blue : T.border}`, color: catId ? T.text : T.placeholder }}>
                  <option value="">Select</option>
                  {catIds.map((id) => <option key={id} value={id}>{CATEGORIES[id].label}</option>)}
                </select>
                <PenLine size={16} style={{ color: T.textSecondary }} />
                <Trash2 size={16} style={{ color: T.textSecondary }} />
              </div>
              <button className="text-sm mt-3 flex items-center gap-1.5 cursor-pointer" style={{ color: T.periwinkle }}>
                <Plus size={14} /> Add New Sub Category
              </button>
            </div>
          </Step>

          <Step n={2} title="Trigger different workflows based on form answers?">
            <div className="flex items-center gap-10">
              {[["no", "No"], ["yes", "Yes"]].map(([v, label]) => (
                <button key={v} onClick={() => setBranch(v)}
                  className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: T.text }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ border: `1px solid ${branch === v ? T.blue : T.border}` }}>
                    {branch === v && <span className="w-2 h-2 rounded-full" style={{ background: T.blue }} />}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </Step>

          <Step n={3} title="Select Form"
            sub="Selected form will be used across all conditions. Forms added inside individual workflow templates won't be used here.">
            <div className="max-w-md">
              <div className="text-sm mb-1.5" style={{ color: T.text }}>
                Select Form<span style={{ color: T.error }}> *</span>
              </div>
              <select value={form} onChange={(e) => setForm(e.target.value)} disabled={!cat}
                className="w-full rounded-md px-3 py-2.5 text-sm outline-none cursor-pointer"
                style={{ border: `1px solid ${form ? T.blue : T.border}`,
                         color: form ? T.text : T.placeholder, background: cat ? "#fff" : T.lavender }}>
                <option value="">{cat ? "Select" : "Pick an intake category first"}</option>
                {Object.values(CATEGORIES).map((c) => <option key={c.formName}>{c.formName}</option>)}
              </select>
              {cat && form === cat.formName && (
                <div className="text-xs mt-1.5" style={{ color: T.textSecondary }}>
                  {questions.length} questions, the same form requesters fill in Raise a Request.
                </div>
              )}
            </div>
          </Step>

          <Step n={4} last title="Configure conditions and workflows"
            sub="Rules are evaluated top to bottom, drag and drop to re-order the conditions">
            {!cat && (
              <div className="rounded-md p-6 text-center" style={{ border: `1px dashed ${T.border}` }}>
                <div className="text-sm" style={{ color: T.textSecondary }}>
                  Pick an intake category and its questions become available as conditions.
                </div>
              </div>
            )}

            {cat && conds.map((c, ci) => (
              <div key={c.id} className="rounded-lg mb-3" style={{ border: `1px solid ${T.border}` }}>
                <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#FBFBFE" }}>
                  <GripHorizontal size={15} style={{ color: T.placeholder }} />
                  <button onClick={() => updCond(c.id, { open: !c.open })} className="cursor-pointer">
                    {c.open ? <ChevronDown size={15} style={{ color: T.textSecondary }} />
                            : <ChevronRight size={15} style={{ color: T.textSecondary }} />}
                  </button>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ border: `1px solid ${T.periwinkle}`, color: T.periwinkle }}>{ci + 1}</span>
                  <span className="text-sm font-medium flex-1" style={{ color: T.text }}>Condition {ci + 1}</span>
                  {c.template && <span className="text-sm" style={{ color: T.textSecondary }}>{c.template}</span>}
                  <button className="cursor-pointer" disabled={conds.length === 1}
                    onClick={() => setConds((cs) => cs.filter((x) => x.id !== c.id))}>
                    <Trash2 size={15} style={{ color: conds.length === 1 ? T.placeholder : T.textSecondary }} />
                  </button>
                </div>

                {c.open && (
                  <div className="px-4 py-4">
                    <div className="text-sm mb-3" style={{ color: T.text }}>
                      Match <span className="px-1.5 py-0.5 rounded" style={{ background: T.lavender, color: T.periwinkle }}>all</span> of the following:
                    </div>

                    {c.rules.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 mb-2">
                        <span className="text-sm w-6" style={{ color: T.textSecondary }}>{i === 0 ? "If" : "and"}</span>
                        <select value={r.field}
                          onChange={(e) => updRule(c.id, i, { field: e.target.value, op: "", value: "" })}
                          className="flex-1 rounded-md px-3 py-2 text-sm outline-none cursor-pointer min-w-0"
                          style={{ border: `1px solid ${r.field ? T.blue : T.border}`,
                                   color: r.field ? T.text : T.placeholder }}>
                          <option value="">Select</option>
                          {questions.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
                        </select>
                        <select value={r.op} onChange={(e) => updRule(c.id, i, { op: e.target.value })}
                          disabled={!r.field}
                          className="rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
                          style={{ border: `1px solid ${r.op ? T.blue : T.border}`, width: 190,
                                   color: r.op ? T.text : T.placeholder,
                                   background: r.field ? "#fff" : T.lavender }}>
                          <option value="">Select</option>
                          {(OPERATORS[(fieldOf(r.field) || {}).type] || []).map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <div style={{ width: 200 }}>{valueControl(c.id, i, r)}</div>
                        {c.rules.length > 1 && (
                          <button className="cursor-pointer"
                            onClick={() => updCond(c.id, { rules: c.rules.filter((_, j) => j !== i) })}>
                            <X size={15} style={{ color: T.textSecondary }} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button onClick={() => updCond(c.id, { rules: [...c.rules, { field: "", op: "", value: "" }] })}
                      className="text-sm flex items-center gap-1.5 cursor-pointer mt-1" style={{ color: T.blue }}>
                      <Plus size={14} /> Add Condition
                    </button>

                    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                      <div className="text-sm mb-3" style={{ color: T.textSecondary }}>Route to workflow:</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm mb-1.5" style={{ color: T.text }}>
                            Workflow Template<span style={{ color: T.error }}> *</span>
                          </div>
                          <select value={c.template}
                            onChange={(e) => updCond(c.id, { template: e.target.value,
                              name: c.name || e.target.value })}
                            className="w-full rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
                            style={{ border: `1px solid ${c.template ? T.blue : T.border}`,
                                     color: c.template ? T.text : T.placeholder }}>
                            <option value="">Select</option>
                            {WORKFLOW_TEMPLATES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="text-sm mb-1.5" style={{ color: T.text }}>
                            Workflow Name<span style={{ color: T.error }}> *</span>
                          </div>
                          <input value={c.name} onChange={(e) => updCond(c.id, { name: e.target.value })}
                            placeholder="Workflow Name"
                            className="w-full rounded-md px-3 py-2 text-sm outline-none"
                            style={{ border: `1px solid ${c.name ? T.blue : T.border}`, color: T.text }} />
                        </div>
                        <div>
                          <div className="text-sm mb-1.5" style={{ color: T.text }}>
                            Owner<span style={{ color: T.error }}> *</span>
                          </div>
                          <select value={c.owner} onChange={(e) => updCond(c.id, { owner: e.target.value })}
                            className="w-full rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
                            style={{ border: `1px solid ${c.owner ? T.blue : T.border}`,
                                     color: c.owner ? T.text : T.placeholder }}>
                            <option value="">Add Owner</option>
                            {ADMIN_PEOPLE.map((p) => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="text-sm mb-1.5" style={{ color: T.text }}>Watchers</div>
                          <select value="" onChange={(e) => e.target.value &&
                            updCond(c.id, { watchers: [...new Set([...c.watchers, e.target.value])] })}
                            className="w-full rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
                            style={{ border: `1px solid ${T.border}`, color: T.placeholder }}>
                            <option value="">Add Watchers</option>
                            {ADMIN_PEOPLE.map((p) => <option key={p}>{p}</option>)}
                          </select>
                          {c.watchers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {c.watchers.map((p) => (
                                <Pill key={p} bg={T.lavender} fg={T.navy}>{p}</Pill>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {cat && (
              <>
                <button
                  onClick={() => setConds((cs) => [...cs, { id: `c${cs.length + 1}-${Date.now()}`, open: true,
                    rules: [{ field: "", op: "", value: "" }], template: "", name: "", owner: "", watchers: [] }])}
                  className="w-full rounded-lg py-3 flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 mb-3"
                  style={{ border: `1px dashed ${T.blue}`, color: T.blue }}>
                  <Plus size={15} /> Add Condition
                </button>

                <div className="rounded-lg" style={{ border: `1px solid ${T.border}` }}>
                  <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#FBFBFE" }}>
                    <span className="text-sm font-medium flex-1" style={{ color: T.text }}>Default Workflow</span>
                    <Pill bg={T.yellowPill} fg={T.warning}>Catches all unmatched responses</Pill>
                  </div>
                  <div className="px-4 py-4 max-w-md">
                    <div className="text-sm mb-1.5" style={{ color: T.text }}>Workflow Template</div>
                    <select value={fallback} onChange={(e) => setFallback(e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
                      style={{ border: `1px solid ${fallback ? T.blue : T.border}`,
                               color: fallback ? T.text : T.placeholder }}>
                      <option value="">Select</option>
                      {WORKFLOW_TEMPLATES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </Step>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${T.border}` }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={!ready}
            onClick={() => onSave({ cat: CATEGORIES[catId].label, form,
              type: branch === "yes" ? "Routing" : "Standard",
              workflow: branch === "yes" && complete.length > 1
                ? `${complete.length} conditions and a default`
                : (conds[0] && conds[0].name) || fallback || "—",
              conditions: complete.length, editing: !!initial })}>
            {initial ? "Save changes" : "Save"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function AnswerPreview({ type }) {
  const box = { border: `1px solid ${T.border}`, background: T.lavender, color: T.placeholder };
  if (type === "Pricing (locked)")
    return (
      <div className="rounded-md p-3" style={{ border: `1px solid ${T.border}`, background: "#FBFBFE" }}>
        <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: T.textSecondary }}>
          <Lock size={12} /> Locked format, the same six fields for every respondent
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PRICING_SCHEMA.map((f) => (
            <div key={f.key} className="rounded px-2 py-1.5 text-xs" style={box}>{f.label}</div>
          ))}
        </div>
      </div>
    );
  if (type === "Long Answer")
    return <div className="rounded-md px-3 py-6 text-sm" style={box}>Long answer</div>;
  if (type === "Single Select" || type === "Multi Select")
    return (
      <div className="space-y-1.5">
        {["Option 1", "Option 2"].map((o) => (
          <div key={o} className="flex items-center gap-2 text-sm" style={{ color: T.placeholder }}>
            <span className="w-4 h-4" style={{ border: `1px solid ${T.border}`,
              borderRadius: type === "Single Select" ? "50%" : 4 }} />
            {o}
          </div>
        ))}
        <button className="text-xs cursor-pointer" style={{ color: T.blue }}>+ Add option</button>
      </div>
    );
  if (type === "Yes / No")
    return (
      <div className="flex gap-4 text-sm" style={{ color: T.placeholder }}>
        {["Yes", "No"].map((o) => (
          <span key={o} className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{ border: `1px solid ${T.border}` }} />{o}
          </span>
        ))}
      </div>
    );
  if (type === "File Upload")
    return (
      <div className="rounded-md px-3 py-4 text-sm flex items-center gap-2"
        style={{ border: `1px dashed ${T.border}`, color: T.placeholder }}>
        <Upload size={14} /> Respondent attaches a file
      </div>
    );
  return <div className="rounded-md px-3 py-2 text-sm" style={box}>{type}</div>;
}

function AddFormModal({ initial, onClose, onCreate, toast }) {
  const blank = () => ({ id: `q-${Math.random().toString(36).slice(2, 8)}`,
    text: "", desc: "", type: "Short Answer", required: true });

  const [name, setName] = useState(initial ? initial.name : "");
  const [formType, setFormType] = useState(initial ? initial.type : "");
  const [source, setSource] = useState("scratch");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [library, setLibrary] = useState(false);
  const [libTab, setLibTab] = useState("company");
  const [questions, setQuestions] = useState(() => initial
    ? initial.questions.map((q) => ({ ...q }))
    : [blank()]);
  const [preview, setPreview] = useState(false);

  const upd = (id, patch) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const load = (set) => setQuestions(set.qs.map(([text, type, required]) =>
    ({ ...blank(), text, type, required })));

  const generate = () => {
    setBusy(true);
    setTimeout(() => {
      const set = aiFormFor(prompt);
      load(set);
      if (!name) setName(set.name);
      if (!formType) setFormType(set.type);
      setBusy(false);
      toast(`${set.qs.length} questions drafted`);
    }, 1500);
  };

  const upload = () => {
    setUploadName("Supplier_Onboarding_Pack.docx");
    setBusy(true);
    setTimeout(() => {
      load(UPLOADED_FORM);
      if (!name) setName(UPLOADED_FORM.name);
      if (!formType) setFormType(UPLOADED_FORM.type);
      setBusy(false);
      toast(`${UPLOADED_FORM.qs.length} questions read from the file`);
    }, 1600);
  };

  const filled = questions.filter((q) => q.text.trim());
  const ready = name.trim() && formType && filled.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-8 overflow-y-auto"
      style={{ background: "rgba(24,27,74,.45)" }}>
      <div className="rounded-lg w-full max-w-3xl" style={{ background: "#fff" }}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${T.border}` }}>
          <h2 className="text-xl font-semibold" style={{ color: T.text }}>
            {initial ? initial.name : "Add New Form"}
          </h2>
          <button onClick={onClose} className="cursor-pointer">
            <X size={20} style={{ color: T.textSecondary }} />
          </button>
        </div>

        <div className="px-6 py-5" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {preview ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold" style={{ color: T.text }}>
                    {name || "Untitled form"}
                  </div>
                  <div className="text-sm" style={{ color: T.textSecondary }}>
                    {formType || "Form"} &middot; {filled.length} questions, as the respondent will see them
                  </div>
                </div>
                <Btn variant="secondary" size="sm" onClick={() => setPreview(false)}>Back to editing</Btn>
              </div>
              <div className="space-y-5">
                {filled.map((q, i) => (
                  <div key={q.id}>
                    <div className="text-sm font-medium mb-1" style={{ color: T.text }}>
                      {i + 1}. {q.text}{q.required && <span style={{ color: T.error }}> *</span>}
                    </div>
                    {q.desc && <div className="text-xs mb-1.5" style={{ color: T.textSecondary }}>{q.desc}</div>}
                    <AnswerPreview type={q.type} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-base font-semibold mb-4" style={{ color: T.text }}>
                {initial ? "These are the questions on this form" : "Add your questions to create your form"}
              </div>

              <div className="mb-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1.5" style={{ color: T.text }}>
                    Form Name<span style={{ color: T.error }}> *</span>
                  </div>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="i.e Contract Renewal Workflow"
                    className="w-full rounded-md px-3 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${name ? T.blue : T.border}`, color: T.text }} />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1.5" style={{ color: T.text }}>
                    Form Type<span style={{ color: T.error }}> *</span>
                  </div>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-md px-3 py-2.5 text-sm outline-none cursor-pointer"
                    style={{ border: `1px solid ${formType ? T.blue : T.border}`,
                             color: formType ? T.text : T.placeholder }}>
                    <option value="">Select a form type</option>
                    {FORM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {formType && (
                <div className="mb-5">
                  <Banner tone="info" icon={Info}>{FORM_TYPE_HELP[formType]}</Banner>
                </div>
              )}

              <div className="mb-5" style={{ display: initial ? "none" : "block" }}>
                <div className="text-sm font-medium mb-1.5" style={{ color: T.text }}>
                  How do you want to start?
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[["scratch", "Start from scratch", "Write the questions yourself", PenLine],
                    ["ai", "Create with AI", "Describe it and we draft the questions", Sparkles],
                    ["upload", "Upload a file", "Pull questions out of an existing form", Upload],
                    ["library", "Question library", "Borrow questions already in use", Library],
                  ].map(([id, title, sub, Icon]) => (
                    <button key={id}
                      onClick={() => { setSource(id); setLibrary(id === "library");
                        if (id === "scratch") setUploadName(""); }}
                      className="rounded-lg p-3 text-left cursor-pointer hover:opacity-85"
                      style={{ border: `1px solid ${source === id ? T.blue : T.border}`,
                               background: source === id ? T.lavender : "#fff" }}>
                      <Icon size={16} style={{ color: source === id ? T.blue : T.textSecondary }} />
                      <div className="text-sm font-medium mt-2" style={{ color: T.text }}>{title}</div>
                      <div className="text-xs mt-0.5" style={{ color: T.textSecondary }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {source === "ai" && (
                <div className="mb-5 rounded-lg p-4" style={{ border: `1px solid ${T.border}`, background: T.lavender }}>
                  <div className="text-sm font-medium mb-1.5" style={{ color: T.text }}>
                    What should this form ask?
                  </div>
                  <textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. a security review for a vendor that will process customer data"
                    className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none mb-3"
                    style={{ border: `1px solid ${prompt ? T.blue : T.border}`, color: T.text, background: "#fff" }} />
                  <Btn variant="primary" busy={busy} disabled={!prompt.trim()} onClick={generate}>
                    <Sparkles size={13} /> {busy ? "Drafting questions" : "Generate questions"}
                  </Btn>
                </div>
              )}

              {source === "upload" && (
                <div className="mb-5 rounded-lg p-4" style={{ border: `1px solid ${T.border}`, background: T.lavender }}>
                  {!uploadName ? (
                    <>
                      <div className="text-sm mb-3" style={{ color: T.textSecondary }}>
                        Supported: .doc, .docx, .csv, .xls, .xlsx, .pdf
                      </div>
                      <Btn variant="primary" onClick={upload}><Upload size={13} /> Upload form</Btn>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <FileText size={18} style={{ color: T.blue }} />
                      <div className="flex-1 text-sm font-medium" style={{ color: T.text }}>{uploadName}</div>
                      {busy
                        ? <Pill bg={T.yellowPill} fg={T.warning}><Sparkles size={11} /> Reading</Pill>
                        : <Pill bg="#E6F4EE" fg={T.success}><Check size={11} /> {filled.length} questions read</Pill>}
                    </div>
                  )}
                  {uploadName && !busy && (
                    <div className="text-xs mt-2" style={{ color: T.textSecondary }}>
                      Check each question and its answer type before saving.
                    </div>
                  )}
                </div>
              )}

              {library && (
                <div className="mb-5 rounded-lg" style={{ border: `1px solid ${T.border}` }}>
                  <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#FBFBFE" }}>
                    <Library size={16} style={{ color: T.periwinkle }} />
                    <span className="text-sm font-semibold flex-1" style={{ color: T.text }}>Question library</span>
                    <button onClick={() => setLibrary(false)} className="cursor-pointer">
                      <X size={16} style={{ color: T.textSecondary }} />
                    </button>
                  </div>

                  {!formType ? (
                    <div className="px-4 py-8 text-center text-sm" style={{ color: T.textSecondary }}>
                      Pick a form type above and the library shows what is being asked on forms like it.
                    </div>
                  ) : (
                    <>
                      <div className="px-4 pt-3 flex items-center gap-2">
                        {[["company", "In your company", Users], ["market", "Across other companies", Globe]]
                          .map(([id, label, Icon]) => (
                          <button key={id} onClick={() => setLibTab(id)}
                            className="px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer flex items-center gap-2"
                            style={{ background: libTab === id ? T.lavender : "transparent",
                                     color: libTab === id ? T.blue : T.textSecondary,
                                     border: `1px solid ${libTab === id ? T.blue : "transparent"}` }}>
                            <Icon size={13} /> {label}
                          </button>
                        ))}
                      </div>

                      <div className="px-4 pt-2 pb-1 text-xs" style={{ color: T.textSecondary }}>
                        {libTab === "company" ? (() => {
                          const qs = companyQuestions(formType);
                          const reused = qs.filter((q) => q.forms.length > 1).length;
                          const forms = new Set(qs.flatMap((q) => q.forms)).size;
                          return `${qs.length} questions across ${forms} ${formType} form${forms === 1 ? "" : "s"}. `
                            + (reused
                              ? `${reused} asked on more than one.`
                              : "None asked on more than one, so nothing is standardised yet.");
                        })() : `Questions common to ${formType} forms across the customer base, anonymised.`}
                      </div>

                      <div className="px-4 pb-4 pt-2 space-y-2" style={{ maxHeight: 280, overflowY: "auto" }}>
                        {(libTab === "company"
                          ? companyQuestions(formType).map((q) => ({ ...q,
                              basis: `${q.forms.length} form${q.forms.length === 1 ? "" : "s"}`,
                              detail: q.forms.join(", ") }))
                          : (CROSS_COMPANY_QUESTIONS[formType] || []).map((q) => ({ ...q,
                              basis: `${q.pct}%`, detail: "of companies ask this" }))
                        ).filter((q) => !questions.some((x) => x.text.toLowerCase() === q.text.toLowerCase()))
                         .map((q) => (
                          <div key={q.text} className="rounded-md px-3 py-2.5 flex items-center gap-3"
                            style={{ border: `1px solid ${T.border}` }}>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm" style={{ color: T.text }}>{q.text}</div>
                              <div className="text-xs mt-0.5" style={{ color: T.textSecondary }}>
                                {q.type} &middot; {q.basis} {q.detail}
                              </div>
                            </div>
                            <Btn variant="secondary" size="sm"
                              onClick={() => setQuestions((qs) => [...qs.filter((x) => x.text.trim()),
                                { ...blank(), text: q.text, type: q.type }])}>
                              <Plus size={12} /> Add
                            </Btn>
                          </div>
                        ))}
                        {(libTab === "company" ? companyQuestions(formType) : (CROSS_COMPANY_QUESTIONS[formType] || []))
                          .filter((q) => !questions.some((x) => x.text.toLowerCase() === q.text.toLowerCase()))
                          .length === 0 && (
                          <div className="py-6 text-center text-sm" style={{ color: T.textSecondary }}>
                            Everything in this group is already on your form.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium" style={{ color: T.text }}>
                  Add Questions<span style={{ color: T.error }}> *</span>
                </div>
                {!library && (
                  <Btn variant="tertiary" size="sm" onClick={() => setLibrary(true)}>
                    <Library size={13} /> Browse question library
                  </Btn>
                )}
              </div>

              {busy && (
                <div className="space-y-2 mb-3">
                  <Skeleton w="45%" /><Skeleton w="70%" /><Skeleton w="60%" />
                </div>
              )}

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
                    <div className="flex justify-center mb-2">
                      <GripHorizontal size={16} style={{ color: T.placeholder }} />
                    </div>
                    <div className="text-xs mb-1.5" style={{ color: T.textSecondary }}>Question {i + 1}</div>
                    <div className="flex gap-3 mb-2">
                      <input value={q.text} onChange={(e) => upd(q.id, { text: e.target.value })}
                        placeholder="Type Your Question"
                        className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
                        style={{ border: `1px solid ${q.text ? T.blue : T.border}`, color: T.text }} />
                      <select value={q.type} onChange={(e) => upd(q.id, { type: e.target.value })}
                        className="rounded-md px-3 py-2 text-sm outline-none cursor-pointer w-48"
                        style={{ border: `1px solid ${T.border}`, color: T.text }}>
                        {ANSWER_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <input value={q.desc} onChange={(e) => upd(q.id, { desc: e.target.value })}
                      placeholder="Add Description (optional)"
                      className="w-full rounded-md px-3 py-2 text-sm outline-none mb-3"
                      style={{ border: `1px solid ${T.border}`, color: T.text }} />

                    <AnswerPreview type={q.type} />

                    <div className="flex items-center justify-end gap-3 mt-3">
                      <button className="cursor-pointer"
                        onClick={() => setQuestions((qs) => {
                          const c = qs.findIndex((x) => x.id === q.id);
                          return [...qs.slice(0, c + 1), { ...q, id: `q-${Math.random().toString(36).slice(2, 8)}` },
                            ...qs.slice(c + 1)];
                        })}>
                        <CopyPlus size={16} style={{ color: T.textSecondary }} />
                      </button>
                      <button className="cursor-pointer" disabled={questions.length === 1}
                        onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}>
                        <Trash2 size={16} style={{ color: questions.length === 1 ? T.placeholder : T.textSecondary }} />
                      </button>
                      <span className="text-sm" style={{ color: T.text }}>Mandatory</span>
                      <button onClick={() => upd(q.id, { required: !q.required })}
                        className="w-10 h-5 rounded-full cursor-pointer flex items-center px-0.5"
                        style={{ background: q.required ? T.blue : T.border,
                                 justifyContent: q.required ? "flex-end" : "flex-start" }}>
                        <span className="w-4 h-4 rounded-full" style={{ background: "#fff" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setQuestions((qs) => [...qs, blank()])}
                className="w-full rounded-lg py-4 mt-3 flex items-center justify-center gap-2 cursor-pointer hover:opacity-80"
                style={{ border: `1px solid ${T.border}`, color: T.textSecondary }}>
                <Plus size={16} /> Add Question
              </button>
            </>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${T.border}` }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <div className="flex items-center gap-3">
            <Btn variant="secondary" disabled={!filled.length} onClick={() => setPreview(true)}>
              <Eye size={13} /> Preview
            </Btn>
            <Btn variant="primary" disabled={!ready}
              onClick={() => { onCreate({ name: name.trim(), type: formType, questions: filled,
                source, editing: !!initial }); }}>
              {initial ? "Save changes" : "Next"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPage({ w, set, toast }) {
  const active = w.adminNav;
  return (
    <div className="flex gap-6 items-start">
      <div className="w-56 flex-shrink-0 rounded-lg overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.border}` }}>
        <button onClick={() => set({ module: "procurement" })}
          className="w-full px-4 py-3 flex items-center gap-2 text-sm cursor-pointer text-left"
          style={{ color: T.text, borderBottom: `1px solid ${T.border}` }}>
          <ChevronLeft size={15} /> Back
        </button>
        {ADMIN_NAV.map((n) => (
          <button key={n} onClick={() => set({ adminNav: n })}
            className="w-full px-4 py-3 text-sm cursor-pointer text-left"
            style={{ color: n === active ? T.blue : T.text,
                     fontWeight: n === active ? 500 : 400,
                     borderBottom: `1px solid ${T.border}` }}>
            {n}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        {active === "Intake Settings" && <IntakeSettingsPage toast={toast} />}
        {active === "Forms Library" && <FormsLibraryPage toast={toast} />}
        {active !== "Intake Settings" && active !== "Forms Library" && (
          <>
            <h1 className="text-3xl font-semibold mb-5" style={{ color: T.text }}>{active}</h1>
            <Card>
              <div className="py-10 text-center">
                <Settings size={22} style={{ color: T.placeholder, margin: "0 auto 10px" }} />
                <div className="text-sm font-medium" style={{ color: T.text }}>Not part of this prototype</div>
                <div className="text-sm mt-1" style={{ color: T.textSecondary }}>
                  Intake Settings and Forms Library are the two admin pages built out here.
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- SHELL ---------------------------------- */

const INITIAL = {
  stage: "procurement", drawer: false, category: "", submitting: false,
  reqId: "", reqName: "",
  // software
  doc: false, team: "", problem: "", pii: false, sso: false,
  extractPhase: "idle", sources: {}, matchPhase: "idle", joined: null,
  // module switching and Vendor Research
  module: "procurement", adminNav: "Intake Settings",
  vrLinkedTo: null, vrOpenCreate: false, vrPrefill: "",
  sourcingHandoff: null, vrResearchName: null,
  vendor: "", product: "", seats: 0, annual: 0, termMonths: 0, swStart: "",
  billing: "", autoRenew: "", noticeDays: 0, justification: "",
  // hardware
  deviceType: "", reason: "", model: "", qty: 0,
  // contingent
  tier: "", startDate: "", endDate: "", hoursWeek: 0, hourlyRate: 0,
  // datacenter
  providerType: "", envName: "", costBasis: "", recurringCost: 0,
  // swag
  purpose: "", deadline: "", estCost: 0,
  // other
  costCentre: "", detail: "", amount: 0,
  // workflow
  reqDone: false, dpia: false, classification: "", hrDone: false,
  preferredVendor: false, brandDone: false,
  rfx: false, rfxBusy: false, chosen: [], invited: false, responded: false, sourcingDone: false,
  award: null, awardValue: null,
  finance: false, legal: false, manager: false, director: false, vp: false, marketing: false, head: false,
  signed: false, provision: "idle", fulfil: "idle", reclaim: false,
};

const REQ_NAMES = {
  software: ["Software", "Framer Enterprise, Product Design"],
  hardware: ["Hardware", "Device request, Product Design"],
  contingent: ["Contingent", "Contractor engagement, Design Systems"],
  datacenter: ["Infra", "Infrastructure request"],
  swag: ["Swag", "Branded merchandise order"],
  other: ["Other", "General spend request"],
};

export default function App() {
  const [w, setW] = useState(INITIAL);
  const [toasts, setToasts] = useState([]);
  const set = (patch) =>
    setW((p) => (typeof patch === "function" ? patch(p) : { ...p, ...patch }));

  const toast = (msg) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  // Procurement -> Vendor Research. Carries the description across and remembers
  // which request is waiting on the result.
  // Procurement -> Vendor Research. Opens the create flow there with the problem
  // description carried across and a note of which request is waiting on it.
  const handoffToResearch = () => {
    set({ module: "research", vrOpenCreate: true, vrLinkedTo: w.reqId, vrPrefill: w.problem || "" });
    toast("Opening a research request in Vendor Research");
  };

  // The linked request has been sent. Keep a small mirror so the sourcing step
  // can show what is running without reaching into the module's own state.
  const linkedCreated = (summary) => {
    set({ vrOpenCreate: false, sourcingHandoff: summary });
    toast("Questionnaire sent, sourcing step is now waiting");
  };

  // A vendor was finalised for procurement on a linked request. Sourcing and
  // evaluation both happened in Vendor Research, so both steps close here.
  const linkedComplete = (vendorName, request) => {
    set({
      module: "procurement", stage: "request",
      sourcingDone: true, award: vendorName, chosen: [vendorName],
      awardValue: w.annual || 0, vrResearchName: request.name,
      vrLinkedTo: null, vrOpenCreate: false,
    });
    toast(`${vendorName} sent back to ${request.linkedTo}`);
  };

  // A vendor finalised outside any workflow starts a new one, prefilled.
  const startProcurementWorkflow = (vendorName) => {
    set({
      module: "procurement", stage: "procurement", drawer: true,
      category: "software", vendor: vendorName, product: vendorName,
      sources: { vendor: "research", product: "research" },
    });
    toast(`Starting a procurement workflow for ${vendorName}`);
  };

  const submit = () => {
    set({ submitting: true });
    setTimeout(() => {
      const [prefix, name] = REQ_NAMES[w.category];
      const cat = CATEGORIES[w.category];
      const amount = cat.amount(w);
      const list = HARDWARE_MODELS[w.deviceType] || [];
      const m = list.find((x) => x.name === w.model);
      set({
        submitting: false, drawer: false, stage: "request",
        reqId: `${prefix}-512`, reqName: name,
        fastTrack: !!(m && m.standard && amount < HARDWARE_FAST_TRACK),
      });
      toast(`${prefix}-512 created`);
    }, 1400);
  };

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: T.lavender }}>
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2" style={{ background: T.navy }}>
        <span className="text-xs font-semibold" style={{ color: T.periwinkle }}>PROTOTYPE</span>
        <span className="text-xs" style={{ color: "#9BA0C8" }}>
          One intake surface, six categories. Fields and approval path change with the category.
        </span>
        <div className="flex-1" />
        <Btn variant="secondary" size="sm" onClick={() => { setW(INITIAL); setToasts([]); }}>
          <RotateCcw size={12} /> Reset
        </Btn>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar module={w.module} onNav={(m) => set({ module: m })} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 relative"
            style={{ overflowY: w.drawer ? "hidden" : "auto" }}>
            <div className="p-6">
              {/* Always mounted: the module owns its own state, so unmounting on
                  navigation would throw away in-flight requests. */}
              <VendorResearchPage
                active={w.module === "research"}
                linkedTo={w.vrLinkedTo}
                openCreate={w.vrOpenCreate}
                prefill={w.vrPrefill}
                onOpenWorkflow={() => set({ module: "procurement", stage: "request" })}
                onLinkedCreated={linkedCreated}
                onLinkedComplete={linkedComplete}
                onStartProcurementWorkflow={startProcurementWorkflow}
              />
              {w.module === "admin" && <AdminPage w={w} set={set} toast={toast} />}
              {w.module === "procurement" && w.stage === "procurement" && <ProcurementPage dimmed={w.drawer} onRaise={() => set({ drawer: true })} toast={toast} />}
              {w.module === "procurement" && w.stage === "deflected" && <Deflected annual={w.annual} onUndo={() => set({ stage: "procurement", drawer: true })} />}
              {w.module === "procurement" && w.stage === "joined" && <Joined req={w.joined} onUndo={() => set({ stage: "procurement", drawer: true, joined: null })} />}
              {w.module === "procurement" && w.stage === "request" && <RequestScreen w={w} set={set} toast={toast} onHandoff={handoffToResearch} />}
            </div>
          </div>
        </div>
      </div>

      {/* Rendered at the root and fixed to the viewport. Inside the scrolling
          content area its height depended on a percentage that does not resolve
          against a flex-sized parent, so it grew with its own content. */}
      {w.drawer && (
        <IntakeDrawer w={w} set={set}
          onClose={() => set({ drawer: false })}
          onSubmit={submit}
          onDeflect={() => { set({ drawer: false, stage: "deflected" }); toast("Converted to a Figma access request"); }}
          onJoin={(r) => { set({ drawer: false, stage: "joined", joined: r }); toast(`Added to ${r.id}`); }}
          toast={toast} />
      )}

      <Toasts items={toasts} />
    </div>
  );
}
