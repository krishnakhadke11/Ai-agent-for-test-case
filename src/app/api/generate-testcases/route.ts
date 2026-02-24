import { NextRequest, NextResponse } from "next/server";
import { ParserFactory } from "@/lib/parsers/factory";
import { AIFactory } from "@/lib/ai/factory";
import { ExcelGenerator } from "@/lib/excel/generator";

/**
 * POST /api/generate-testcases
 *
 * Orchestrates the full test case generation flow:
 * 1. Checks for multipart form-data (file upload) or raw json (text).
 * 2. Parses the document if given a file.
 * 3. Sends the text to the AI Provider.
 * 4. Generates an Excel buffer from the resulting test cases.
 * 5. Returns the JSON response with a data URI for the Excel download.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let documentText = "";

    // 1. Extract text from request
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided in form data." },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = ParserFactory.getParser(file.name, file.type);
      documentText = await parser.parse(buffer);
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (!body.text || typeof body.text !== "string") {
        return NextResponse.json(
          { error: "Missing 'text' field in JSON body." },
          { status: 400 },
        );
      }
      documentText = body.text;
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported Content-Type. Use multipart/form-data or application/json.",
        },
        { status: 415 },
      );
    }

    if (!documentText || documentText.trim().length === 0) {
      return NextResponse.json(
        { error: "The provided document or text is empty." },
        { status: 400 },
      );
    }

    // 2. Generate Test Cases via AI
    const aiProvider = AIFactory.getProvider();
    const result = await aiProvider.generateTestCases(documentText);

    if (!result.test_cases || result.test_cases.length === 0) {
      return NextResponse.json(
        {
          error:
            "AI failed to generate any test cases from the provided document.",
        },
        { status: 500 },
      );
    }

    // 3. Generate Excel File
    const excelGenerator = new ExcelGenerator();
    const excelBuffer = await excelGenerator.generateBuffer(result.test_cases);

    // We use a Data URI for the download_url to maintain statelesness
    // while keeping the API Postman-compatible.
    const base64Excel = Buffer.from(excelBuffer).toString("base64");
    const downloadUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Excel}`;

    // 4. Return the structured response
    return NextResponse.json({
      status: "success",
      summary: result.summary,
      test_cases: result.test_cases,
      download_url: downloadUrl,
    });
  } catch (error: unknown) {
    console.error("Error in /api/generate-testcases:", error);
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
