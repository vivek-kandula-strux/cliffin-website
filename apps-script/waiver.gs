/**
 * Cliff-Inn Adventures — forms endpoint (Google Apps Script).
 *
 * Receives form payloads from the website (JSON, content-type text/plain to
 * avoid a CORS preflight). For waiver submissions it builds a Google Doc from
 * the template, embeds the signature, exports a PDF, saves it into a Drive
 * folder and emails a copy to the participant. Every submission (waiver or
 * not) is appended as a row to a Google Sheet, which doubles as the
 * entries dashboard.
 *
 * Deploy: see README.md in this folder.
 */

// --- Configuration -----------------------------------------------------------
// ID of the Drive folder where waiver PDFs are stored. Open the folder in
// Drive — the ID is the long string at the end of the URL:
// https://drive.google.com/drive/folders/<FOLDER_ID>
const FOLDER_ID = '1c6zDQzeWbcr6DhZO-y_YiV7I1yz1i_bf';

// Email address that receives a copy of every signed waiver (leave '' to skip).
const OWNER_COPY_EMAIL = 'cliffinnadventures@gmail.com';

// Optional: ID of a Google Doc used as the PDF template. When set, each waiver
// is a copy of this doc with {{placeholders}} filled in — design it once in
// Google Docs (logo, colors, waiver text) and the PDF inherits the styling.
// Leave as-is to use the built-in plain layout. See README.md "PDF template".
const TEMPLATE_ID = '1r723Nn98dsk7lAJFLSn_ICLB7klSwhdR4OQYWkdafZ4';

// Optional: ID of the Google Sheet that logs every submission (the dashboard).
// Run setupSheet() once (see README.md) to create the sheet, then paste its ID
// here. Leave '' to skip sheet logging — PDF/email flow still works.
const SHEET_ID = '1ZVfZZsaBjsz6VUoZKFgUptipfuBZbpXVAz-DeSghhbQ';
// -----------------------------------------------------------------------------

const PLACEHOLDERS = [
  'fullName', 'dateOfBirth', 'email', 'phone',
  'emergencyContactName', 'emergencyContactPhone',
  'activity', 'activityDate', 'tripStartDate', 'tripEndDate', 'declaration',
  'submittedAt', 'signedOn', 'signature',
];

const FIELD_LABELS = {
  fullName: 'Full name',
  dateOfBirth: 'Date of birth',
  email: 'Email',
  phone: 'Phone',
  emergencyContactName: 'Emergency contact name',
  emergencyContactPhone: 'Emergency contact phone',
  activity: 'Programme / activity',
  activityDate: 'Activity date',
  tripStartDate: 'Trip start date',
  tripEndDate: 'Trip end date',
  declaration: 'Declaration',
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let pdfFileName = '';

    if (data.form === 'waiver') {
      pdfFileName = handleWaiver_(data);
    }

    // Sheet logging is best-effort: a sheet problem must not block the
    // waiver PDF/email or the enquiry submission.
    try {
      logToSheet_(data, pdfFileName);
    } catch (sheetErr) {
      console.error('logToSheet failed: ' + sheetErr);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Waiver pipeline: template PDF → Drive folder → participant + owner email. */
function handleWaiver_(data) {
  const pdf = buildWaiverPdf_(data);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const fileName = 'Waiver - ' + sanitize_(data.fullName || 'Participant') + ' - ' + fileStamp_();
  folder.createFile(pdf.setName(fileName));

  const emailBody =
    'Hi ' + (data.fullName || 'there') + ',\n\n' +
    'Thank you for signing the Cliff-Inn Adventures release of liability waiver ' +
    'for "' + (data.activity || 'your activity') + '". Your signed copy is attached.\n\n' +
    'See you out there!\n' +
    'Team Cliff-Inn Adventures';

  MailApp.sendEmail({
    to: data.email,
    replyTo: OWNER_COPY_EMAIL || undefined,
    subject: 'Your signed Cliff-Inn Adventures waiver',
    body: emailBody,
    attachments: [pdf],
  });

  if (OWNER_COPY_EMAIL && data.email !== OWNER_COPY_EMAIL) {
    MailApp.sendEmail(OWNER_COPY_EMAIL, 'Waiver signed: ' + (data.fullName || 'Participant'),
      'Programme: ' + (data.activity || '-') + '\nDate: ' + (data.activityDate || '-') +
      '\nEmail: ' + (data.email || '-'));
  }

  return fileName;
}

function doGet() {
  return json_({
    ok: true,
    service: 'cliff-inn-waiver',
    version: 3,
    templateActive: Boolean(TEMPLATE_ID && TEMPLATE_ID !== 'PASTE_TEMPLATE_DOC_ID'),
    sheetActive: Boolean(SHEET_ID),
  });
}

function buildWaiverPdf_(data) {
  if (TEMPLATE_ID && TEMPLATE_ID !== 'PASTE_TEMPLATE_DOC_ID') {
    return buildFromTemplate_(data);
  }
  return buildPlain_(data);
}

/**
 * Copy the template doc, fill {{placeholders}} with the submission values,
 * embed the signature image at the {{signature}} marker, export as PDF,
 * and trash the copy (the PDF is the artifact; the template stays pristine).
 */
function buildFromTemplate_(data) {
  const doc = DocumentApp.openById(
    DriveApp.getFileById(TEMPLATE_ID).makeCopy('Waiver - ' + (data.fullName || 'Participant')).getId()
  );
  const body = doc.getBody();

  PLACEHOLDERS.filter(function (key) { return key !== 'signature'; }).forEach(function (key) {
    const raw = key === 'signedOn' ? fileStamp_() : data[key];
    const value = Array.isArray(raw) ? raw.join(', ') : String(raw || '');
    // Replacement text is literal; only the search pattern is a regex.
    body.replaceText('\\{\\{\\s*' + key + '\\s*\\}\\}', value);
  });

  const signature = data.signature || '';
  const marker = body.findText('\\{\\{\\s*signature\\s*\\}\\}');
  if (marker && signature.indexOf('data:image/png;base64,') === 0) {
    const parent = marker.getElement().getParent();
    if (parent.getType() === DocumentApp.ElementType.PARAGRAPH) {
      const png = Utilities.newBlob(
        Utilities.base64Decode(signature.split(',')[1]),
        'image/png',
        'signature.png'
      );
      const paragraph = parent.asParagraph();
      paragraph.clear();
      paragraph.appendInlineImage(png).setWidth(240);
    } else {
      body.replaceText('\\{\\{\\s*signature\\s*\\}\\}', '');
    }
  } else {
    body.replaceText('\\{\\{\\s*signature\\s*\\}\\}', '');
  }

  doc.saveAndClose();
  const pdf = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return pdf;
}

/** Fallback layout when no template is configured — a tidy field/value table. */
function buildPlain_(data) {
  const doc = DocumentApp.create('Waiver - ' + (data.fullName || 'Participant'));
  const body = doc.getBody();

  body.appendParagraph('Cliff-Inn Adventures').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Participant Release of Liability Waiver').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('Submitted: ' + (data.submittedAt || new Date().toISOString()));

  const table = body.appendTable();
  table.setBorderWidth(0.5);
  Object.keys(FIELD_LABELS).forEach(function (key) {
    const value = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
    if (value === undefined || value === '') return;
    const row = table.appendTableRow();
    row.appendTableCell(FIELD_LABELS[key]).setBold(true);
    row.appendTableCell(String(value));
  });

  body.appendParagraph('Signature:');
  const signature = data.signature || '';
  if (signature.indexOf('data:image/png;base64,') === 0) {
    const png = Utilities.newBlob(
      Utilities.base64Decode(signature.split(',')[1]),
      'image/png',
      'signature.png'
    );
    body.appendImage(png).setWidth(240);
  }

  doc.saveAndClose();
  const pdf = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  DriveApp.getFileById(doc.getId()).setTrashed(true); // source doc is scratch; the PDF is the artifact
  return pdf;
}

// Fixed column order for the submissions sheet — keep stable, append only.
const SHEET_COLUMNS = [
  'submittedAt', 'form', 'fullName', 'email', 'phone',
  'audience', 'trip', 'experiences', 'activity', 'activityDate',
  'tripStartDate', 'tripEndDate', 'dateOfBirth',
  'emergencyContactName', 'emergencyContactPhone', 'declaration', 'message',
  'pdf', 'page',
];

/**
 * One-time setup (run manually from the editor: Run → review permissions).
 * Creates the submissions spreadsheet with the header row and logs its ID —
 * paste that ID into SHEET_ID above, then redeploy as a new version.
 */
function setupSheet() {
  const sheet = SpreadsheetApp.create('Cliff-Inn Submissions');
  sheet.getActiveSheet().setName('Submissions').appendRow(SHEET_COLUMNS);
  console.log('SHEET_ID = ' + sheet.getId());
  return sheet.getId();
}

/** Append one row per submission. No-op when SHEET_ID is not configured. */
function logToSheet_(data, pdfFileName) {
  if (!SHEET_ID) return;
  const row = SHEET_COLUMNS.map(function (key) {
    if (key === 'pdf') return pdfFileName;
    // The browser sends UTC ISO strings — display them in IST instead.
    if (key === 'submittedAt' && data.submittedAt) {
      return Utilities.formatDate(new Date(data.submittedAt), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    }
    const value = data[key];
    if (Array.isArray(value)) return value.join(', ');
    return value === undefined || value === null ? '' : String(value);
  });
  const ss = SpreadsheetApp.openById(SHEET_ID);
  // Prefer a tab named "Submissions"; otherwise use whichever tab exists.
  const tab = ss.getSheetByName('Submissions') || ss.getSheets()[0];
  tab.appendRow(row);
}

function sanitize_(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
}

function fileStamp_() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH-mm');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
