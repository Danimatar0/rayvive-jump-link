# Google Sheets Newsletter Integration Setup

This guide will help you set up Google Sheets integration for the newsletter subscription feature.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Rename it to "Rayvive Newsletter Subscriptions" (or any name you prefer)
4. The headers will be automatically added when the first subscription is received:
   - Column A: Name
   - Column B: Email
   - Column C: Timestamp
   - Column D: Source

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete the default code and paste the following:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Add headers if this is the first row
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 4).setValues([['Name', 'Email', 'Timestamp', 'Source']]);
    }

    // Add the new subscription data
    sheet.appendRow([
      data.name,
      data.email,
      data.timestamp,
      data.source
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data added successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Save the script (Ctrl+S or Cmd+S)
4. Name your project (e.g., "Newsletter Integration")

## Step 3: Deploy the Web App

1. Click **Deploy** → **New deployment**
2. Choose **Web app** as the type
3. Set the following settings:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Important**: You may need to authorize the script. Click "Authorize access" and follow the prompts
6. Copy the **Web app URL** that appears after deployment

## Step 4: Configure Environment Variable

1. Open your `.env` file in the project root
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with the Web app URL you copied:
   ```
   VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the newsletter section on your website
3. Fill out the form with test data
4. Check your Google Sheet to verify the data was added

## Troubleshooting

### Common Issues:

1. **"Integration not configured" error**
   - Make sure the `VITE_GOOGLE_SHEETS_URL` is set correctly in your `.env` file
   - Restart your development server after updating the `.env` file

2. **CORS errors in browser console**
   - This is normal behavior and expected with Google Apps Script
   - The integration uses `no-cors` mode to bypass this restriction
   - Data will still be saved to your sheet despite the CORS message

3. **Data not appearing in sheet**
   - Verify the Web app URL is correct
   - Check that the Apps Script deployment has "Anyone" access
   - Make sure you saved and deployed the script after pasting the code

4. **Authorization issues**
   - Re-run the deployment process
   - Make sure you authorize the script when prompted
   - Try using an incognito/private browser window for testing

### Security Notes:

- The Web app URL is safe to expose in your frontend code
- No sensitive data or API keys are required
- All data is stored securely in your Google Sheet
- You maintain full control over who can access the sheet

## Data Format

Each newsletter subscription will be saved with the following columns:

| Name | Email | Timestamp | Source |
|------|-------|-----------|--------|
| John Doe | john@example.com | 2024-01-15T10:30:00.000Z | Rayvive Website Newsletter |

The timestamp is in ISO format and the source helps you track where subscriptions came from.