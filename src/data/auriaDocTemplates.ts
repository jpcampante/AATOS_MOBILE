import type { AuriaIconName } from '../components/icons';

/**
 * Built-in document templates, ported from the Auria web app
 * (`DOC_WELCOME_TYPES` / `docWelcomeTemplateContent`). Each card opens a preview
 * of `body`; "Use template" drops that document into the chat.
 */
export type AuriaDocTemplate = {
  id: string;
  /** Card title. */
  label: string;
  /** Card subtitle. */
  description: string;
  /** Accent colour (icon tint + Use-template button). */
  accent: string;
  icon: AuriaIconName;
  /** Generated document title. */
  title: string;
  /** Plain-text document body shown in the preview and the chat artifact. */
  body: string;
};

export const AURIA_DOC_TEMPLATES: AuriaDocTemplate[] = [
  {
    id: 'contract',
    label: 'Contract',
    description: 'MSA, SOW, vendor or client agreement',
    accent: '#2B7CD8',
    icon: 'document',
    title: 'Master Services Agreement',
    body: `Parties and effective date
This Master Services Agreement is entered into as of [Effective Date] between [Client Legal Name] ("Client") and [Vendor Legal Name] ("Vendor").

1. Services and relationship
Vendor will provide the services described in each Statement of Work (SOW) to enterprise standards, as an independent contractor.

2. Statements of Work and governance
Each SOW lists scope, deliverables, timeline, and fees, and is governed by a joint steering committee with quarterly reviews.

3. Deliverables and acceptance
Client has [10] business days to review deliverables; acceptance criteria and the cure process are defined per SOW.

4. Fees, invoicing, and audit
Fees are invoiced [monthly], net [30]. Client may audit charges once per year on reasonable notice.

5. Confidentiality and IP
Each party protects the other's confidential information; work product is assigned to Client on full payment.

6. Warranties and limitation of liability
Services are performed in a professional manner. Aggregate liability is capped at the fees paid in the preceding [12] months.

7. Term and termination
The Agreement runs until terminated for convenience on [90] days' notice or for uncured material breach on [30] days' notice.`,
  },
  {
    id: 'nda',
    label: 'NDA',
    description: 'Mutual or one-way non-disclosure',
    accent: '#6B4BB4',
    icon: 'shieldCheck',
    title: 'Mutual Non-Disclosure Agreement',
    body: `Purpose and permitted use
The parties wish to explore a potential business relationship and will exchange confidential information solely for that purpose.

1. Definition of Confidential Information
Non-public business, technical, and financial information disclosed in any form and reasonably understood to be confidential.

2. Exclusions
Information that is public, already known, independently developed, or rightfully received from a third party.

3. Standard of care
Each party protects the other's information with at least the care it uses for its own, and limits access to a need-to-know basis.

4. Compelled disclosure
If legally required to disclose, the receiving party gives prompt notice and cooperates to seek protective treatment.

5. Return or destruction
On request or termination, confidential information is returned or destroyed, subject to standard archival retention.

6. Term and survival
Obligations apply for [3] years from disclosure; trade-secret protection survives for as long as the information remains a trade secret.`,
  },
  {
    id: 'employment',
    label: 'Employment',
    description: 'Offer letter, role change, HR notice',
    accent: '#15915E',
    icon: 'briefcase',
    title: 'Offer of Employment',
    body: `Position details
We are pleased to offer you the role of [Title], reporting to [Manager], starting on [Start Date], based in [Location].

Compensation
Base salary of [Amount] per year, paid [bi-weekly], with eligibility for an annual performance bonus of up to [%].

Equity and benefits
[Number] of restricted stock units vesting over [4] years, plus health, retirement, and paid time off per company plans.

Responsibilities
You will be accountable for [key outcomes] and the success metrics agreed with your manager.

Confidentiality and IP
Employment is subject to the company's confidentiality, invention-assignment, and acceptable-use policies.

At-will employment
Employment is at-will; either party may end the relationship at any time, subject to applicable notice.

Conditions and acceptance
This offer is contingent on background and eligibility checks. Please sign and return by [Date] to accept.`,
  },
  {
    id: 'proposal',
    label: 'Proposal',
    description: 'Client pitch or project proposal',
    accent: '#C45A12',
    icon: 'list',
    title: 'Enterprise Proposal',
    body: `Executive summary
[Your Company] proposes a phased program to deliver [outcome] for [Client], reducing [pain] and unlocking [value].

Client context and current state
[Client] faces [challenges]; the current state shows [gaps] that limit [goal].

Problem statement and drivers
The core problem is [problem], driven by [factors] and amplified by [market pressure].

Proposed solution — phased approach
Phase 1: Discovery and alignment. Phase 2: Build and integrate. Phase 3: Rollout and enablement.

Expected outcomes
[Metric] improvement within [timeframe], with a projected ROI of [x].

Pricing and timeline
Fixed program fee of [Amount] over [N] weeks, billed by milestone.

Next steps
Confirm scope, sign the SOW, and schedule the kickoff for [Date].`,
  },
  {
    id: 'policy',
    label: 'Policy',
    description: 'Internal policy or handbook section',
    accent: '#5A5A5A',
    icon: 'squarePen',
    title: 'Company Policy',
    body: `1. Purpose and intent
This policy establishes the requirements for [topic] to protect the company, its people, and its data.

2. Scope and applicability
Applies to all employees, contractors, and systems within [scope], across all regions where the company operates.

3. Definitions
Key terms used in this policy are defined to ensure consistent interpretation.

4. Roles and responsibilities
[Owner] maintains the policy; managers enforce it; all staff are responsible for compliance.

5. Control requirements
Access is granted on least-privilege; data is classified and handled per its sensitivity.

6. Acceptable use and exceptions
Resources are used for legitimate business purposes; exceptions require documented approval from [authority].

7. Enforcement and review
Violations may result in disciplinary action. This policy is reviewed at least [annually].`,
  },
  {
    id: 'invoice',
    label: 'Invoice & quote',
    description: 'Commercial billing or price quote',
    accent: '#0E7C86',
    icon: 'currencyDollar',
    title: 'Quote & Tax Invoice',
    body: `Summary
Quote [#0001] prepared for [Client] by [Your Company], valid for [30] days from [Date].

Scope overview
Covers [deliverables] as described in the related Statement of Work.

Line items
1. [Service / item] — [qty] × [unit price] = [amount]
2. [Service / item] — [qty] × [unit price] = [amount]
3. [Service / item] — [qty] × [unit price] = [amount]

Totals
Subtotal [amount] · Tax ([rate]%) [amount] · Total due [amount].

Payment terms
Net [30] days from invoice date. Late payments accrue interest at [rate]% per month.

Remittance instructions
Pay by bank transfer to [account details], referencing invoice [#0001].

Notes
Prices exclude expenses unless stated. Please contact [name] with any billing questions.`,
  },
  {
    id: 'memo',
    label: 'Memo',
    description: 'Meeting notes or internal memo',
    accent: '#4A6FA5',
    icon: 'document',
    title: 'Internal Memo',
    body: `Purpose and decision request
This memo summarizes [topic] and requests approval to [decision].

Background
[Context and prior decisions that led to this discussion.]

Recommendation
We recommend [option], because [rationale] and [expected impact].

Key decisions
1. [Decision] — Owner: [name] — Due: [date]
2. [Decision] — Owner: [name] — Due: [date]

Risks and mitigations
[Risk] is mitigated by [action]; [dependency] must be resolved before [milestone].

Meeting record
Attendees: [names]. Date: [date]. Discussion notes captured above.

Next steps and follow-up
Owners confirm actions by [date]; a follow-up review is scheduled for [date].`,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Regulatory summary or legal brief',
    accent: '#8B4518',
    icon: 'scale',
    title: 'Compliance Summary',
    body: `Executive summary
This summary assesses [organization]'s compliance with [framework] and outlines the priority actions to close gaps.

Scope and applicability
Covers [systems, teams, and processes] in scope for [regulation].

Regulatory context
Applicable requirements derive from [framework / regulation] and related guidance.

Control domains assessed
Identity and access, data protection, incident response, and vendor risk.

Findings and gaps
[N] gaps identified; the most material relate to [area], rated [risk level].

Recommended controls and remediation
1. [Control] — Priority: [High] — Owner: [name]
2. [Control] — Priority: [Medium] — Owner: [name]

Reporting and governance
Progress is reported to [committee] [monthly] until all high-priority items are closed.

Legal disclaimer
This summary is informational and not a substitute for advice from qualified legal counsel.`,
  },
];
