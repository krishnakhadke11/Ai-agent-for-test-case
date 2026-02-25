import ExcelJS from "exceljs";
import { TestCase } from "../ai/types";

/**
 * Handles the generation of an Excel Spreadsheet from structured Test Cases.
 * Uses exceljs to format headers, standardize sizes, and write to a buffer.
 */
export class ExcelGenerator {
  /**
   * Converts a list of Test Cases to an Excel buffer suitable for client download.
   *
   * @param testCases The raw structured test case objects.
   * @returns Resolves to an ArrayBuffer containing the `.xlsx` file data.
   */
  async generateBuffer(testCases: TestCase[]): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AI Test Generator";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Test Cases", {
      views: [{ state: "frozen", ySplit: 1 }], // Freeze header row
    });

    // Define columns clearly per requirements
    sheet.columns = [
      { header: "Test Case ID", key: "testCaseId", width: 15 },
      { header: "Mapped Req", key: "mappedRequirementId", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Title", key: "title", width: 35 },
      { header: "Preconditions", key: "preconditions", width: 35 },
      { header: "Steps", key: "steps", width: 60 },
      { header: "Expected Result", key: "expectedResult", width: 40 },
    ];

    // Style the header row to stand out
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }, // Indigo 600
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Fill in the rows and wrap text neatly
    testCases.forEach((tc) => {
      const row = sheet.addRow(tc);
      row.alignment = { vertical: "top", wrapText: true };
    });

    // Return the built buffer
    return workbook.xlsx.writeBuffer();
  }
}
