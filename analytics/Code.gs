/**
 * Google Apps Script backend for site visit tracking.
 *
 * Receives a JSON page-view payload from public/analytics.js and appends one
 * row to the bound Google Sheet. Deploy as a Web app (see README.md).
 */

// Column order written to the sheet. Keep in sync with the header row.
var FIELDS = [
  'ts', 'path', 'referrer', 'title', 'lang', 'tz', 'screen',
  'country', 'region', 'city', 'lat', 'lon', 'isp', 'org', 'domain', 'ip', 'ua'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Write a header row the first time.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['received_at'].concat(FIELDS));
    }

    var row = [new Date()];
    for (var i = 0; i < FIELDS.length; i++) {
      row.push(data[FIELDS[i]] || '');
    }
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple health check when you open the /exec URL in a browser.
function doGet() {
  return ContentService.createTextOutput('Visit tracker is live.');
}
