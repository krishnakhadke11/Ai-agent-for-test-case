import { NextRequest, NextResponse } from "next/server";
import { ParserFactory } from "@/lib/parsers/factory";
import { AIFactory } from "@/lib/ai/factory";
import { ExcelGenerator } from "@/lib/excel/generator";

/**
 * Helper function to parse a file or text input into a plain string.
 */
async function extractText(
  formData: FormData,
  bodyType: "form" | "json",
  fileKey: string,
  jsonBody?: Record<string, string>,
): Promise<string> {
  console.log(`Extracting text for ${fileKey}. Body type: ${bodyType}`);
  if (bodyType === "form") {
    const file = formData.get(fileKey) as File | null;
    if (!file) throw new Error(`Missing ${fileKey} in form data.`);
    console.log(
      `Got file: ${file.name}, type: ${file.type}, size: ${file.size}`,
    );

    // Convert to ArrayBuffer cleanly
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = ParserFactory.getParser(file.name, file.type);

    console.log(`Parsing file with ${parser.constructor.name}`);
    return await parser.parse(buffer);
  } else {
    const text = jsonBody?.[fileKey];
    if (!text || typeof text !== "string") {
      throw new Error(`Missing '${fileKey}' field in JSON body.`);
    }
    console.log(`Got text payload for ${fileKey}, length: ${text.length}`);
    return text;
  }
}

/**
 * POST /api/generate-testcases
 *
 * Orchestrates the full test case generation flow:
 * 1. Checks for multipart form-data (ud_file, hld_file) or raw json (ud_text, hld_text).
 * 2. Parses both documents.
 * 3. Sends both texts to the AI Provider with a 90% threshold rule.
 * 4. Checks the returned result.
 *    - If rejected, replies directly with error.
 *    - If approved, generates an Excel buffer and returns the JSON + Download URI.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let udText = "";
    let hldText = "";

    // 1. Extract text from request
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      udText = await extractText(formData, "form", "ud_file");
      hldText = await extractText(formData, "form", "hld_file");
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      udText = await extractText(new FormData(), "json", "ud_text", body);
      hldText = await extractText(new FormData(), "json", "hld_text", body);
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported Content-Type. Use multipart/form-data or application/json.",
        },
        { status: 415 },
      );
    }

    if (!udText.trim() || !hldText.trim()) {
      return NextResponse.json(
        { error: "One or both provided documents are empty." },
        { status: 400 },
      );
    }

    // 2. Generate Test Cases via AI mapping
    const aiProvider = AIFactory.getProvider();
    const threshold = parseInt(process.env.MATCH_THRESHOLD || "90", 10);
    const result = await aiProvider.generateTestCases(
      udText,
      hldText,
      threshold,
    );

    // 3. Enforce the threshold backend rule
    if (result.status === "rejected" || result.coveragePercentage < threshold) {
      if (result.status === "approved") {
        console.warn(
          "AI returned approved but coverage percentage was below threshold. Overriding.",
        );
        return NextResponse.json({
          status: "rejected",
          coveragePercentage: result.coveragePercentage,
          coverageBreakdown: result.coverageBreakdown,
          missingRequirements: [],
          weakCoverageRequirements: [],
          recommendations: [
            "Validation failed server-side. Please enhance your HLD based on the UD.",
          ],
        });
      }

      // Safe return of the rejected state (already properly formatted by AI schema)
      return NextResponse.json(result);
    }

    if (
      result.status === "approved" &&
      (!result.testCases || result.testCases.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "AI failed to generate any test cases despite meeting the threshold.",
        },
        { status: 500 },
      );
    }

    // 4. Generate Excel File for successful approvals
    const excelGenerator = new ExcelGenerator();
    const excelBuffer = await excelGenerator.generateBuffer(
      result.status === "approved" ? result.testCases : [],
    );

    // We use a Data URI for the download_url to maintain statelesness
    // while keeping the API Postman-compatible.
    const base64Excel = Buffer.from(excelBuffer).toString("base64");
    const downloadUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Excel}`;

    // 5. Return the structured response
    return NextResponse.json({
      ...result,
      download_url: downloadUrl,
    });
  } catch (error: unknown) {
    console.error(
      "=================== API ROUTE FATAL ERROR ===================",
    );
    console.error("Error in /api/generate-testcases:", error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    console.error(
      "=============================================================",
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during testcase generation.";
    return NextResponse.json(
      {
        status: "error",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
