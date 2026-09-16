# Waiver endpoint — Google Apps Script deployment

`waiver.html` posts the signed form to a Google Apps Script web app. The script
builds a Google Doc with the participant details and embedded signature,
exports it as a PDF, saves it into a Drive folder, and emails the PDF to the
participant. The temporary Doc is trashed — the PDF is the only artifact.

## One-time setup

1. **Create the Drive folder** where waiver PDFs will live (e.g.
   "Waiver Submissions"). Copy its ID from the URL:
   `https://drive.google.com/drive/folders/<FOLDER_ID>`.
2. Open [script.google.com](https://script.google.com) → **New project** →
   delete the default `myFunction` and paste the contents of
   [waiver.gs](waiver.gs).
3. In `waiver.gs`, set `FOLDER_ID` (and `OWNER_COPY_EMAIL` if it should differ
   from the default).
4. **Extensions → Apps Script Usage →** none needed, but do:
   **Project Settings →** no; go to **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Authorize the scopes when prompted (Drive, Docs, Gmail send). If Google
   shows "unverified app", click **Advanced → Go to … (unsafe)** — this is
   your own script.
6. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).
7. Paste it into `WAIVER_WEBHOOK_URL` in `js/config.js`.

## Testing

- Until `WAIVER_WEBHOOK_URL` is set, the form runs in dev mode: the payload
  (including the signature data URL) is logged to the console and the success
  panel shows.
- After deploying, submit a real waiver and confirm: PDF lands in the Drive
  folder, the participant receives the email, and the temporary Google Doc is
  in the trash.

## Make the PDF look designed (optional template)

By default the PDF is a clean but plain field/value table. For full control
over the look (logo, colors, fonts, your real waiver text), use a Google Doc
as a template:

1. Create a new Google Doc and design it however you like — insert your logo,
   set heading colors, write the full waiver text. Suggestion:
   [docs.new](https://docs.new).
2. Wherever a submission value should appear, type a placeholder in
   **double curly braces**. Available placeholders:

   | Placeholder | Filled with |
   |---|---|
   | `{{fullName}}` | Participant's full name |
   | `{{dateOfBirth}}` | Date of birth |
   | `{{email}}` | Email address |
   | `{{phone}}` | Phone number |
   | `{{emergencyContactName}}` | Emergency contact name |
   | `{{emergencyContactPhone}}` | Emergency contact phone |
   | `{{activity}}` | Programme / activity |
   | `{{activityDate}}` | Activity date |
   | `{{declaration}}` | Declaration acceptance |
   | `{{submittedAt}}` | Submission timestamp |
   | `{{signedOn}}` | Signing date (Asia/Kolkata) |
   | `{{signature}}` | **On its own line** — replaced by the drawn signature image |

   Put `{{signature}}` on a line by itself, under a "Signature" label.
   Any placeholder you don't use is simply left empty.
3. Copy the template's document ID from its URL:
   `https://docs.google.com/document/d/<DOC_ID>/edit`.
4. Paste it into `TEMPLATE_ID` at the top of `waiver.gs`.
5. Redeploy (**New version** — see below) and submit a test waiver.

The script makes a copy of the template for each submission, fills it in, and
exports the copy as PDF — the template itself is never modified. Until
`TEMPLATE_ID` is set, the script keeps using the built-in plain layout.

## Updating the script later

After any change to `waiver.gs`, redeploy:
**Deploy → Manage deployments → pencil icon → New version → Deploy** (the
`/exec` URL stays the same).
