import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to Google Apps Script doGet endpoint.
 * Future integration: connect to live Google Sheets.
 * For now returns mock data structure.
 *
 * Apps Script endpoint pattern:
 * https://script.google.com/macros/s/{SCRIPT_ID}/exec?tab={tabName}
 */
export async function POST(req: NextRequest) {
  try {
    const { sheetId, tabName } = await req.json();

    if (!sheetId || !tabName) {
      return NextResponse.json({ error: "sheetId and tabName required" }, { status: 400 });
    }

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      // Return mock data when not connected
      return NextResponse.json({
        connected: false,
        message: "Google Sheets not connected. Set APPS_SCRIPT_URL env var.",
        data: [],
      });
    }

    const url = `${appsScriptUrl}?sheetId=${sheetId}&tab=${tabName}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Apps Script returned ${res.status}`);

    const data = await res.json();
    return NextResponse.json({ connected: true, data });
  } catch (err) {
    console.error("Fetch sheet error:", err);
    return NextResponse.json({ error: "Failed to fetch sheet data" }, { status: 500 });
  }
}
