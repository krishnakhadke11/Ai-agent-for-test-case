import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

import {
  AIProvider,
  TestCaseGenerationResult,
  TestCaseGenerationResultSchema,
} from "./types";

/**
 * Gemini implementation of the AIProvider.
 * Uses the Vercel AI SDK to stream/parse structured JSON for test case generation.
 */
export class GeminiProvider implements AIProvider {
  /**
   * Constructs the specific prompt for test case generation based on the Usage Decision document.
   * @param documentText The raw text from the uploaded document.
   * @returns The constructed prompt string.
   */

  knowledgeBaseText: string = `# Functional Knowledge Base

      ## Application Overview

      The **Mintoak Web UI** is a comprehensive merchant portal designed to provide businesses with deep insights and control over their daily payment operations. It serves as a unified dashboard for viewing transactions, managing refunds, tracking settlements, handling staff roles, and requesting/managing hardware like POS terminals and SoundBoxes.

      ### Who is this application for?

      - **Merchants / Business Owners**: To monitor business health, track settlements, and manage staff.
      - **Cashiers / Staff**: To initiate refunds or view daily transactions (based on role permissions).
      - **Admin/Support (Maker-Checker)**: To approve or reject bulk actions and sensitive requests.

      ---

      ## Core Functional Modules

      ### 1. Dashboard & Reports

      The application provides robust data visualization and reporting tools to help merchants understand their business performance.

      - **Summary KPI Cards**: High-level metrics for total sales, transaction counts, etc.
      - **Charts and Graphs**: Includes Bar Charts (Daily, By Dates, Comparison), Line Charts (Trends), and Pie Charts.
      - **Settlement Reports**: Extensive filtering and reporting on settled vs. unsettled funds.
      - **Export Capabilities**: Almost all reports and tables support downloading data, likely in CSV/Excel formats (via 'xlsx' and custom 'DownloadDropdown' components).

      ### 2. Transaction Management

      A central hub for viewing and filtering all payment activities.

      - **Transactions Table**: A detailed list of all transactions with statuses ('TxnStatus.tsx').
      - **Filtering**: Extensive filtering options ('TransactionFilterBar.tsx') by date range, payment mode, status, and legal entity/TID (Terminal ID).
      - **Transaction Details**: In-depth modal views for individual transaction lifecycles ('TransactionDetailsModal.tsx').
      - **Digital Charge Slips**: Ability to view and potentially share digital receipts/charge slips ('DigitalChargeSlip.tsx').

      ### 3. Refunds & Dispute Management

      One of the most complex modules, supporting both individual and bulk refund workflows with approval layers.

      - **Initiate Refund**: Flow for selecting a transaction and initiating a partial or full refund ('InitiateRefund.tsx', 'RefundSelectTransaction.tsx').
      - **Bulk Uploads**: Supports uploading CSV/Excel files for processing multiple refunds at once ('BulkUploadRefundStep1.tsx', 'PartialRefundBulkUpload.tsx').
      - **Maker-Checker Workflow**: Features like 'RefundRejectionModal.tsx', 'RefundReviewBulkUpload.tsx', and 'ToApprovRefund.tsx' indicate a strict approval process where one role requests a refund and another (manager/admin) approves it.
      - **OTP Verification**: Sensitive actions like finalizing a refund require OTP validation ('RefundOtpModal.tsx').
      - **Timelines**: Visual tracking of a refund request's status lifecycle ('RefundTimelineList.tsx').

      ### 4. Staff & Role Management

      Merchants can add and manage access for their employees across different stores or terminal IDs.

      - **User/Staff Table**: Listing of all registered staff ('UserTable.tsx').
      - **Add/Edit Staff**: Forms to add new staff members, capturing basic details and assigning roles ('AddEditStaffForm.tsx', 'ManageRoles.tsx').
      - **Granular Permissions**: Staff access can be restricted by Brand, City, MID (Merchant ID), TID (Terminal ID), or specific Outlets ('BrandOptionStaff.tsx', 'TidOptionStaff.tsx').
      - **Bulk Staff Upload**: Similar to refunds, merchants can bulk-upload staff lists ('BulkUploadStaffStep1.tsx').
      - **Action Requests**: A system to track pending staff additions/modifications that require approval ('ActionRequestTable.tsx').

      ### 5. Hardware & Device Management (POS & SoundBox)

      Merchants can view, compare, and manage their physical payment hardware.

      - **POS Terminals**: View device details, compare POS models, check MDR (Merchant Discount Rate) charges, and apply promo codes for new plans ('ComparePosDevices.tsx', 'PlanRadio.tsx', 'MDRChargesTable.tsx').
      - **SoundBox**: Specific flows for selecting TIDs to associate with SoundBoxes ('SoundBoxTidSelection...').
      - **Service Requests**: Users can likely raise tickets or order new paper rolls and equipment ('orderAndRequest' directory context).

      ### 6. Settlement Tracking

      Provides clarity on when funds will reach the merchant's bank account.

      - **Settlement Tables**: Detailed breakdown of amounts settled and bank reference numbers ('SettlementAmountTable.tsx').
      - **Unsettled Transactions**: Visibility into transactions that have been processed but not yet deposited ('UnsettledTransactionsTable.tsx').

      ---

      ## AI Prompt Context: Test Case Generation Guidelines

      When generating test cases based on a Usage Decision (UD), use this functional context to understand the _domain_:

      1.  **Multi-Tiered Workflows**: If a UD mentions "Refund", don't just test the API. Test the _Maker-Checker_ flow (Request -> Pending -> Approve/Reject) and the impact of the _OTP Modal_.
      2.  **Granular Filtering**: For Transaction and Settlement UDs, ensure test cases cover the extensive filtering logic (combinations of Date ranges, TIDs, Payment Modes, and Statuses).
      3.  **Validation**: Test cases must cover the edge cases of file uploads (especially for Bulk Refunds and Bulk Staff additions), ensuring format validation, size limits, and error handling for malformed rows.
      4.  **Role Access**: When testing Staff modules, always consider test cases that verify "Cashier" visibility vs. "Admin" visibility, particularly around the 'ManageRoles.tsx' and TID assignment layers.
`;

  private buildPrompt(documentText: string): string {
    // return `
    //   You are an expert Quality Assurance Engineer and Test Automation Specialist.
    //   I will provide you with a Usage Decision (UD) document describing the full logical working of an application.

    //   Your objective is to:
    //   1. Parse and extract meaningful functional requirements from this text.
    //   2. Analyze workflows, conditions, validations, edge cases, and failure paths.
    //   3. Generate all possible test cases covering:
    //      - Positive test cases
    //      - Negative test cases
    //      - Boundary test cases
    //      - Edge cases
    //      - Validation scenarios
    //      - Error handling cases

    //   Return strictly a structured JSON object according to the exact schema provided.
    //   Do not include explanations, intro text, or formatting beyond the requested JSON.

    //   Here is the Usage Decision document content:
    //   ---
    //   ${documentText}
    //   ---
    // `;

    return `
    You are an expert Quality Assurance Engineer and Test Automation Specialist.

      You are generating test cases for the following application.

      ========================
      APPLICATION KNOWLEDGE BASE
      ========================
      The following information describes the system architecture, terminology,
      business rules, constraints, and domain definitions.
      Use this context to improve requirement interpretation and coverage accuracy.

      ${this.knowledgeBaseText}

      ========================
      INSTRUCTIONS
      ========================
      1. Parse and extract meaningful functional requirements from the Usage Decision.
      2. Analyze workflows, conditions, validations, edge cases, and failure paths.
      3. Generate all possible test cases covering:
        - Positive test cases
        - Negative test cases
        - Boundary test cases
        - Edge cases
        - Validation scenarios
        - Error handling cases

      Return strictly a structured JSON object according to the exact schema provided.
      Do not include explanations or formatting outside the JSON.

      ========================
      USAGE DECISION DOCUMENT
      ========================
      ${documentText}
    
    `;
  }

  /**
   * Communicates with Google's Gemini via the Vercel AI SDK
   * to strictly return the JSON structure defined by TestCaseGenerationResultSchema.
   */

  async generateTestCases(
    documentText: string,
  ): Promise<TestCaseGenerationResult> {
    try {
      const prompt = this.buildPrompt(documentText);

      // Using gemini-1.5-pro for better context windows and reasoning capabilities.
      // Falls back to standard gemini if preferred.
      const { object } = await generateObject({
        // model: google("gemini-2.5-flash"),
        model: anthropic("claude-3-5-sonnet-20241022"),
        schema: TestCaseGenerationResultSchema,
        prompt: prompt,
        temperature: 0.2, // Low temperature for deterministic output
      });

      return object;
    } catch (error) {
      console.error("GeminiProvider: Failed to generate test cases:", error);
      throw new Error("Failed to generate test cases using Gemini Provider.");
    }
  }
}
