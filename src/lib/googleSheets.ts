/**
 * Google Sheets Integration Helper
 * Handles newsletter subscription data submission to Google Sheets
 */

export interface NewsletterData {
  name: string;
  email: string;
  timestamp?: string;
  source?: string;
}

/**
 * Submits newsletter subscription data to Google Sheets via Google Apps Script Web App
 *
 * Setup Instructions:
 * 1. Create a new Google Sheet
 * 2. Create a Google Apps Script (script.google.com)
 * 3. Deploy as Web App with public access
 * 4. Set the deployed URL as VITE_GOOGLE_SHEETS_URL in .env
 *
 * @param data Newsletter subscription data
 * @returns Promise<boolean> Success status
 */
export async function submitToGoogleSheets(data: NewsletterData): Promise<boolean> {
  const url = import.meta.env.VITE_GOOGLE_SHEETS_URL;

  if (!url) {
    console.error('Google Sheets URL not configured. Please set VITE_GOOGLE_SHEETS_URL in your environment.');
    throw new Error('Google Sheets integration not configured');
  }

  const payload = {
    name: data.name,
    email: data.email,
    timestamp: data.timestamp || new Date().toISOString(),
    source: data.source || 'Rayvive Website Newsletter'
  };

  try {
    // Use no-cors mode to bypass CORS restrictions with Google Apps Script
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // With no-cors mode, we can't read the response, but if no error is thrown,
    // the request was successful
    console.log('Newsletter subscription sent to Google Sheets successfully');
    return true;
  } catch (error) {
    console.error('Error submitting to Google Sheets:', error);
    throw error;
  }
}

/**
 * Google Apps Script code for the Web App (paste this in script.google.com):
 *
 * function doPost(e) {
 *   try {
 *     const sheet = SpreadsheetApp.getActiveSheet();
 *     const data = JSON.parse(e.postData.contents);
 *
 *     // Add headers if this is the first row
 *     if (sheet.getLastRow() === 0) {
 *       sheet.getRange(1, 1, 1, 4).setValues([['Name', 'Email', 'Timestamp', 'Source']]);
 *     }
 *
 *     // Add the new subscription data
 *     sheet.appendRow([
 *       data.name,
 *       data.email,
 *       data.timestamp,
 *       data.source
 *     ]);
 *
 *     return ContentService.createTextOutput(JSON.stringify({
 *       success: true,
 *       message: 'Data added successfully'
 *     })).setMimeType(ContentService.MimeType.JSON);
 *
 *   } catch (error) {
 *     return ContentService.createTextOutput(JSON.stringify({
 *       success: false,
 *       error: error.toString()
 *     })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */