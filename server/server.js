// MoiBook2025 Node.js MySQL API
const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { pool, isPostgres } = require('./db');
const os = require('os');
const { spawn, exec } = require('child_process');
const LOGS_DIR = path.join(__dirname, '..', 'logs');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason?.stack || reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err?.stack || err);
});

const RECEIPT_WIDTH_MM = 80;
const RECEIPT_HEIGHT_MM = 150;

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Admin: clear all data (use with caution)
app.post('/api/admin/clear-data', async (req, res) => {
  try {
    const confirm = req.query.confirm || req.body?.confirm;
    if (confirm !== 'YES') {
      return res.status(400).json({ error: 'Confirmation required. Send confirm=YES.' });
    }

    await pool.query('DELETE FROM moi_entries');
    await pool.query('DELETE FROM members');
    await pool.query('DELETE FROM registrars');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM bookings');

    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

const toNumericId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return null;
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDecimal = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(num) ? Number(num.toFixed(2)) : 0;
};

const normalizeDate = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (!text) return null;

  // dd/mm/yyyy or dd-mm-yyyy -> yyyy-mm-dd
  const match = text.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  // If already yyyy-mm-dd or ISO, try to parse
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
};

// Lightweight UUID v4 generator (no dependency)
const generateUuidV4 = () => {
  // return RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const toNullableString = (value) => {
  if (value === undefined || value === null) return null;
  const str = typeof value === 'string' ? value : String(value);
  const trimmed = str.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return defaultValue;
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return defaultValue;
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  }
  return defaultValue;
};

const padId = (value, padLength = 4) => {
  if (value === undefined || value === null) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(padLength, '0');
};

function parseJsonColumn(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  const text = String(value).trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch (err) {
    try {
      const relaxed = text.replace(/\'|\`/g, "'").replace(/\"/g, '"');
      return JSON.parse(relaxed);
    } catch (err2) {
      return fallback;
    }
  }
}

const mapEventToDbColumns = (event = {}) => {
  const eventName = toNullableString(event.eventName) ?? '';
  const eventSide = toNullableString(event.eventSide);
  const eventDate = normalizeDate(event.date);
  const eventTime = toNullableString(event.time);
  const location = toNullableString(event.location);
  const venue = toNullableString(event.venue);
  const place = toNullableString(event.place);
  const eventHead = toNullableString(event.eventHead);
  const eventHeadProf = toNullableString(event.eventHeadProf);
  const eventOrganizer = toNullableString(event.eventOrganizer);
  const eventOrganizerProf = toNullableString(event.eventOrganizerProf);
  const phone = toNullableString(event.phone ?? event.organizationPhone);
  const address = toNullableString(event.address ?? event.organizationAddress);
  const invitationCount = event.invitationCount !== undefined && event.invitationCount !== null
    ? (parseInt(event.invitationCount, 10) || null)
    : null;
  const tableCount = event.tableCount !== undefined && event.tableCount !== null
    ? (parseInt(event.tableCount, 10) || null)
    : null;
  const approvalPins = Array.isArray(event.approvalPins)
    ? JSON.stringify(event.approvalPins)
    : JSON.stringify(parseJsonColumn(event.approvalPins, []));

  const rawPayload = {
    ...event,
    permission: event.permission !== undefined ? !!event.permission : true,
    organizationAddress: address ?? '',
    organizationPhone: phone ?? ''
  };

  return {
    eventName,
    eventSide,
    eventDate,
    eventTime,
    location,
    venue,
    place,
    eventHead,
    eventHeadProf,
    eventOrganizer,
    eventOrganizerProf,
    phone,
    address,
    invitationCount,
    tableCount,
    approvalPins,
    raw: JSON.stringify(rawPayload)
  };
};

const mapBookingToDbColumns = (booking = {}) => {
  const name = toNullableString(booking.name) ?? '';
  const phone = toNullableString(booking.phone) ?? '';
  const eventName = toNullableString(booking.eventName ?? booking.event_name) ?? '';
  const bookingDate = normalizeDate(booking.date ?? booking.bookingDate ?? booking.booking_date);
  const bookingTime = toNullableString(booking.time ?? booking.bookingTime ?? booking.booking_time);
  const invitationCount = booking.invitationCount !== undefined && booking.invitationCount !== null
    ? (parseInt(booking.invitationCount, 10) || null)
    : null;
  const amount = toDecimal(booking.amount);
  const paymentMethod = toNullableString(booking.paymentMethod ?? booking.payment_method) ?? 'online';
  const paymentReference = toNullableString(booking.paymentReference ?? booking.payment_reference);
  const status = toNullableString(booking.status) ?? 'pending';

  return {
    name,
    phone,
    eventName,
    bookingDate,
    bookingTime,
    invitationCount,
    amount,
    paymentMethod,
    paymentReference,
    status
  };
};

const mapBookingRow = (row = {}) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  eventName: row.event_name,
  date: row.booking_date ? new Date(row.booking_date).toISOString().slice(0, 10) : null,
  time: row.booking_time,
  invitationCount: row.invitation_count,
  amount: row.amount,
  paymentMethod: row.payment_method,
  paymentReference: row.payment_reference,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

app.post('/api/printers/print', async (req, res) => {
  if (process.platform !== 'win32') {
    return res.status(501).json({ error: 'Direct printing is only supported on Windows hosts' });
  }

  const { printerName, pdfBase64, imageBase64, jobLabel, mimeType } = req.body || {};
  const payloadBase64 = imageBase64 || pdfBase64;

  if (!printerName || !payloadBase64) {
    return res.status(400).json({ error: 'printerName and printable payload are required' });
  }

  let base64String = String(payloadBase64).trim();
  const commaIndex = base64String.indexOf(',');
  if (commaIndex !== -1) {
    base64String = base64String.slice(commaIndex + 1);
  }

  let fileBuffer;
  try {
    fileBuffer = Buffer.from(base64String, 'base64');
  } catch (err) {
    return res.status(400).json({ error: 'Invalid print payload', details: err.message });
  }

  if (!fileBuffer || !fileBuffer.length) {
    return res.status(400).json({ error: 'Print payload is empty' });
  }

  const tempDir = path.join(os.tmpdir(), 'moibook_print_jobs');
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to prepare temp directory', details: err.message });
  }

  const normalizedMime = typeof mimeType === 'string' ? mimeType.toLowerCase() : '';
  const extensionFromMime = () => {
    if (!normalizedMime) return null;
    if (normalizedMime.includes('png')) return 'png';
    if (normalizedMime.includes('jpeg') || normalizedMime.includes('jpg')) return 'jpg';
    if (normalizedMime.includes('bmp')) return 'bmp';
    if (normalizedMime.includes('pdf')) return 'pdf';
    return null;
  };

  const chosenExtension = (() => {
    if (imageBase64) return extensionFromMime() || 'png';
    if (pdfBase64) return extensionFromMime() || 'pdf';
    return extensionFromMime() || 'dat';
  })();

  const fileName = `moi_receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${chosenExtension}`;
  const filePath = path.join(tempDir, fileName);

  try {
    await fs.writeFile(filePath, fileBuffer);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to stage print payload', details: err.message });
  }

  const sanitizedPrinter = printerName.replace(/["'`]/g, '').trim();
  if (!sanitizedPrinter) {
    await fs.unlink(filePath).catch(() => {});
    return res.status(400).json({ error: 'Printer name is invalid after sanitization' });
  }

  const invokePrintCommand = async () => {
    // Use PowerShell's System.Drawing.Printing namespace to print with custom paper size
    const scriptContent = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$printerName = "${sanitizedPrinter}"
$imagePath = "${filePath.replace(/\\/g, '\\\\')}"
$widthMm = ${RECEIPT_WIDTH_MM}

try {
    $image = [System.Drawing.Image]::FromFile($imagePath)
    $printDoc = New-Object System.Drawing.Printing.PrintDocument
    $printDoc.PrinterSettings.PrinterName = $printerName
    
    # Calculate paper height based on image aspect ratio
    $imageAspectRatio = $image.Height / $image.Width
    $widthInch = [int]($widthMm / 25.4 * 100)
    
    # Calculate height to fit image content (add 10% buffer)
    $calculatedHeightMm = $widthMm * $imageAspectRatio * 1.1
    $heightInch = [int]($calculatedHeightMm / 25.4 * 100)
    
    # Set custom paper size
    $customSize = New-Object System.Drawing.Printing.PaperSize("Custom", $widthInch, $heightInch)
    $printDoc.DefaultPageSettings.PaperSize = $customSize
    $printDoc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
    
    # Print handler
    $printDoc.add_PrintPage({
        param($sender, $ev)
        
        $pageWidth = $ev.PageBounds.Width
        $pageHeight = $ev.PageBounds.Height
        
        # Scale image to fit page width
        $scale = $pageWidth / $image.Width
        $scaledWidth = $pageWidth
        $scaledHeight = $image.Height * $scale
        
        # If scaled height exceeds page, scale to fit height instead
        if ($scaledHeight -gt $pageHeight) {
            $scale = $pageHeight / $image.Height
            $scaledWidth = $image.Width * $scale
            $scaledHeight = $pageHeight
        }
        
        $destRect = New-Object System.Drawing.Rectangle(0, 0, $scaledWidth, $scaledHeight)
        $ev.Graphics.DrawImage($image, $destRect)
        $ev.HasMorePages = $false
    })
    
    $printDoc.Print()
    $image.Dispose()
    
    Write-Output "Print successful"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
`;

    const scriptPath = path.join(os.tmpdir(), `moibook_print_${Date.now()}.ps1`);
    await fs.writeFile(scriptPath, scriptContent, { encoding: 'utf8' });
    
    try {
      await new Promise((resolve, reject) => {
        const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath];
        let stderr = '';
        let stdout = '';
        
        const child = spawn('powershell.exe', psArgs, { windowsHide: true });
        
        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });
        
        child.on('error', reject);
        child.on('exit', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`PowerShell print failed (code ${code}): ${stderr || stdout}`));
          }
        });
      });
    } finally {
      await fs.unlink(scriptPath).catch(() => {});
    }
  };

  try {
    await invokePrintCommand();
  } catch (err) {
    await fs.unlink(filePath).catch(() => {});
    return res.status(500).json({ error: 'Print command failed', details: err.message });
  }

  setTimeout(() => {
    fs.unlink(filePath).catch(() => {});
  }, 10000);

  console.log('Queued POS print job', {
    printer: sanitizedPrinter,
    jobLabel: jobLabel || null,
    filePath
  });

  res.json({ success: true, printer: sanitizedPrinter, jobLabel: jobLabel || null, filePath });
});

// Simple sync import endpoint for central ingestion of local batches
app.post('/api/sync/import', async (req, res) => {
  try {
    console.log('Received /api/sync/import request body (preview):', JSON.stringify(req.body).slice(0, 200));
  } catch (e) {}
  const batch = Array.isArray(req.body) ? req.body : (req.body.batch || []);
    // debug: persist incoming payload to workspace logs folder for troubleshooting
    try {
      await fs.mkdir(LOGS_DIR, { recursive: true });
      const debugPath = path.join(LOGS_DIR, `moibook_sync_in_${Date.now()}.json`);
      await fs.writeFile(debugPath, JSON.stringify({ headers: req.headers, body: req.body }, null, 2), 'utf8');
      console.log('Saved incoming sync payload to', debugPath);
    } catch (e) {
      console.warn('Failed to write incoming sync debug file', e.message);
    }
  if (!Array.isArray(batch) || batch.length === 0) {
    return res.status(400).json({ error: 'batch array required' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      // Expect items: { uuid, table: 'moi_entries', data: {...}, sourceEvent, created_at }
      const results = [];
      for (const item of batch) {
        if (!item || !item.uuid || !item.table || !item.data) continue;
        const table = String(item.table).replace(/[^a-z0-9_]/gi, '');
        if (table !== 'moi_entries' && table !== 'members' && table !== 'events') continue;

        // Upsert by uuid if present, otherwise insert
        if (item.uuid) {
          // Try update first
          const [existing] = await conn.query(`SELECT id FROM ?? WHERE uuid = ? LIMIT 1`, [table, item.uuid]);
          if (existing && existing.length) {
            const id = existing[0].id;
            await conn.query(`UPDATE ?? SET data = ?, synced = 1 WHERE id = ?`, [table, JSON.stringify(item.data), id]);
            results.push({ uuid: item.uuid, id, action: 'updated' });
            continue;
          }
        }

        // Insert
        if (table === 'moi_entries') {
          const insertData = item.data || {};
          const insertSql = isPostgres
            ? `INSERT INTO moi_entries (event_id, table_no, contributor_name, amount, phone, note, denominations, member_id, uuid, synced, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?) RETURNING id`
            : `INSERT INTO moi_entries (event_id, table_no, contributor_name, amount, phone, note, denominations, member_id, uuid, synced, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`;
          const [r] = await conn.query(
            insertSql,
            [insertData.event_id || null, insertData.table_no || null, insertData.contributor_name || '', insertData.amount || 0, insertData.phone || null, insertData.note || null, JSON.stringify(insertData.denominations || {}), insertData.member_id || null, item.uuid || null, item.created_at || null]
          );
          results.push({ uuid: item.uuid || null, id: r.insertId, action: 'inserted' });
        } else if (table === 'members') {
          const d = item.data || {};
          const insertSql = isPostgres
            ? `INSERT INTO members (name, phone, address, uuid) VALUES (?, ?, ?, ?) RETURNING id`
            : `INSERT INTO members (name, phone, address, uuid) VALUES (?, ?, ?, ?)`;
          const [r] = await conn.query(insertSql, [d.name || '', d.phone || null, d.address || null, item.uuid || null]);
          results.push({ uuid: item.uuid || null, id: r.insertId, action: 'inserted' });
        } else if (table === 'events') {
          const d = item.data || {};
          const insertSql = isPostgres
            ? `INSERT INTO events (event_name, event_date, location) VALUES (?, ?, ?) RETURNING id`
            : `INSERT INTO events (event_name, event_date, location) VALUES (?, ?, ?)`;
          const [r] = await conn.query(insertSql, [d.event_name || '', d.event_date || null, d.location || null]);
          results.push({ uuid: item.uuid || null, id: r.insertId, action: 'inserted' });
        }
      }

      res.json({ success: true, results });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Sync import error:', err);
    // Ensure we always return valid JSON and log outgoing error payload for debugging
    const errResp = { error: 'sync error', details: err.message };
    try {
      await fs.mkdir(LOGS_DIR, { recursive: true });
      const debugOut = path.join(LOGS_DIR, `moibook_sync_out_${Date.now()}.json`);
      await fs.writeFile(debugOut, JSON.stringify(errResp, null, 2), 'utf8');
      console.log('Saved sync error response to', debugOut);
    } catch (e) {
      console.warn('Failed to write outgoing sync debug file', e.message);
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify(errResp));
  }
});

const serializeDenominations = (value) => {
  if (!value) return JSON.stringify({});
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed ?? {});
    } catch (err) {
      console.warn('Failed to parse denominations string, defaulting to empty object:', err.message);
      return JSON.stringify({});
    }
  }
  return JSON.stringify(value);
};

const normalizePhone = (value) => {
  const strValue = toNullableString(value);
  if (!strValue) return '';
  const digits = strValue.replace(/[^0-9]/g, '');
  return digits.length ? digits : strValue;
};

const mapRegistrarToDbColumns = (registrar = {}) => {
  const name = toNullableString(registrar.name) ?? '';
  const designation = toNullableString(registrar.designation) ?? '';
  const address = toNullableString(registrar.address) ?? '';
  const phone = normalizePhone(registrar.phone ?? registrar.contactNumber ?? registrar.phoneNumber);
  const permissionSource =
    registrar.permission ?? registrar.allowed ?? registrar.hasPermission ?? registrar.isAllowed;

  return {
    name,
    designation,
    phone,
    address,
    permission: normalizeBoolean(permissionSource, true) ? 1 : 0,
    raw: JSON.stringify(registrar ?? {}) || '{}'
  };
};

const mapRowToRegistrar = (row) => {
  const parsed = parseJsonColumn(row.data) || {};
  const registrar = { ...parsed };

  if (row.id != null) {
    registrar.id = padId(row.id);
  }

  if (row.name != null) {
    registrar.name = row.name;
  }

  if (row.designation != null) {
    registrar.designation = row.designation;
  }

  if (row.phone != null) {
    const normalized = normalizePhone(row.phone);
    registrar.phone = normalized;
    if (!registrar.contactNumber) {
      registrar.contactNumber = normalized;
    }
  }

  if (row.address != null) {
    registrar.address = row.address;
  } else if (registrar.address != null) {
    registrar.address = registrar.address;
  } else if (parsed.Address != null) {
    registrar.address = parsed.Address;
  } else if (parsed.addressLine != null) {
    registrar.address = parsed.addressLine;
  }

  registrar.address = registrar.address != null ? registrar.address : '';

  if (row.permission != null) {
    registrar.permission = normalizeBoolean(row.permission, true);
  } else if (registrar.permission !== undefined) {
    registrar.permission = normalizeBoolean(registrar.permission, true);
  } else {
    registrar.permission = true;
  }

  registrar.permission = registrar.permission ?? true;
  registrar.address = toNullableString(registrar.address) ?? '';

  return registrar;
};

const mapMoiEntryToDbColumns = (entry = {}) => {
  const numericEventId = toNumericId(entry.eventId ?? entry.event_id);
  const serialNo = toNumericId(entry.serialNumber ?? entry.serial ?? entry.entryNumber ?? entry.id);
  const contributorName = toNullableString(entry.name ?? entry.contributor_name ?? entry.contributorName) ?? '';
  const note = toNullableString(entry.note ?? entry.notes) ?? '';
  const phone = toNullableString(entry.phone ?? entry.contactNumber) ?? '';

  return {
    eventId: numericEventId,
    serialNo,
    tableNo: toNullableString(entry.table ?? entry.table_no),
    contributorName,
    amount: toDecimal(entry.amount ?? entry.totalAmount),
    phone,
    note,
    denominations: serializeDenominations(entry.denominations ?? entry.denominationDetails ?? {}),
    memberId: toNullableString(entry.memberId ?? entry.member_id) ?? '',
    town: toNullableString(entry.town),
    townId: toNullableString(entry.townId ?? entry.town_id),
    street: toNullableString(entry.street),
    initial: toNullableString(entry.initial),
    baseName: toNullableString(entry.baseName ?? entry.base_name),
    relationshipName: toNullableString(entry.relationshipName ?? entry.relationship_name),
    relationshipType: toNullableString(entry.relationshipType ?? entry.relationship_type),
    relationship: toNullableString(entry.relationship),
    education: toNullableString(entry.education),
    profession: toNullableString(entry.profession),
  isMaternalUncle: normalizeBoolean(entry.isMaternalUncle ?? entry.is_maternal_uncle, false) ? 1 : 0,
    entryType: toNullableString(entry.type ?? entry.entry_type),
    raw: JSON.stringify(entry ?? {}) || '{}'
  };
};

const mapRowToMoiEntry = (row) => {
  const parsed = parseJsonColumn(row.data) || {};
  const entry = { ...parsed };

  if (row.id != null) {
    entry.id = row.id.toString();
  }

  if (row.serial_no != null && !entry.serialNumber) {
    const parsed = parseInt(row.serial_no, 10);
    if (Number.isFinite(parsed)) {
      entry.serialNumber = String(parsed).padStart(4, '0');
    }
  }

  if (row.event_id != null) {
    const paddedEventId = padId(row.event_id);
    entry.event_id = row.event_id;
    if (!entry.eventId) {
      entry.eventId = paddedEventId;
    }
  }
  if (row.eventId != null && !entry.eventId) {
    entry.eventId = padId(row.eventId);
  }

  if (row.table_no != null) {
    entry.table_no = row.table_no;
    if (!entry.table) {
      entry.table = row.table_no;
    }
  }
  if (row.tableNo != null && !entry.table) {
    entry.table = row.tableNo;
  }

  if (row.contributor_name != null) {
    entry.contributor_name = row.contributor_name;
    if (!entry.name) {
      entry.name = row.contributor_name;
    }
  }
  if (row.contributorName != null && !entry.name) {
    entry.name = row.contributorName;
  }

  if (row.base_name != null) {
    entry.base_name = row.base_name;
    if (!entry.baseName) {
      entry.baseName = row.base_name;
    }
  }
  if (row.baseName != null && !entry.baseName) {
    entry.baseName = row.baseName;
  }

  if (row.initial != null) {
    entry.initial = row.initial;
  }

  if (row.town != null) {
    entry.town = row.town;
  }

  if (row.town_id != null) {
    entry.town_id = row.town_id;
    if (!entry.townId) {
      entry.townId = row.town_id;
    }
  }
  if (row.townId != null && !entry.townId) {
    entry.townId = row.townId;
  }

  if (row.street != null) {
    entry.street = row.street;
  }

  if (row.relationship_name != null) {
    entry.relationship_name = row.relationship_name;
    if (!entry.relationshipName) {
      entry.relationshipName = row.relationship_name;
    }
  }
  if (row.relationshipName != null && !entry.relationshipName) {
    entry.relationshipName = row.relationshipName;
  }

  if (row.relationship_type != null) {
    entry.relationship_type = row.relationship_type;
    if (!entry.relationshipType) {
      entry.relationshipType = row.relationship_type;
    }
  }
  if (row.relationshipType != null && !entry.relationshipType) {
    entry.relationshipType = row.relationshipType;
  }

  if (row.relationship != null) {
    entry.relationship = row.relationship;
  }

  if (row.education != null) {
    entry.education = row.education;
  }

  if (row.profession != null) {
    entry.profession = row.profession;
  }

  if (row.phone != null) {
    entry.phone = row.phone;
    if (!entry.contactNumber) {
      entry.contactNumber = row.phone;
    }
  }

  if (row.member_id != null) {
    entry.member_id = row.member_id;
    if (!entry.memberId) {
      entry.memberId = row.member_id;
    }
  }
  if (row.memberId != null && !entry.memberId) {
    entry.memberId = row.memberId;
  }

  if (row.note != null) {
    entry.note = row.note;
  }

  if (row.amount != null) {
    const amountNumber = typeof row.amount === 'string' ? parseFloat(row.amount) : Number(row.amount);
    entry.amount = Number.isFinite(amountNumber) ? amountNumber : 0;
    if (entry.totalAmount === undefined) {
      entry.totalAmount = entry.amount;
    }
  }

  const parsedDenominations = parseJsonColumn(row.denominations);
  if (parsedDenominations) {
    entry.denominations = parsedDenominations;
    if (!entry.denominationDetails) {
      entry.denominationDetails = parsedDenominations;
    }
  } else if (!entry.denominations) {
    entry.denominations = {};
  }

  if (row.is_maternal_uncle != null) {
    entry.is_maternal_uncle = row.is_maternal_uncle;
    entry.isMaternalUncle = normalizeBoolean(row.is_maternal_uncle, false);
  }
  if (row.isMaternalUncle != null && entry.isMaternalUncle === undefined) {
    entry.isMaternalUncle = normalizeBoolean(row.isMaternalUncle, false);
  }

  if (row.entry_type != null) {
    entry.entry_type = row.entry_type;
    if (!entry.type) {
      entry.type = row.entry_type;
    }
  }
  if (row.entryType != null && !entry.type) {
    entry.type = row.entryType;
  }

  if (entry.isMaternalUncle !== undefined) {
    entry.isMaternalUncle = normalizeBoolean(entry.isMaternalUncle, false);
  }

  if (entry.is_maternal_uncle !== undefined) {
    entry.is_maternal_uncle = normalizeBoolean(entry.is_maternal_uncle, false) ? 1 : 0;
  }

  return entry;
};

const composeAddress = (street, town, fallbackAddress) => {
  const parts = [street, town].filter(part => part && String(part).trim().length);
  if (parts.length) {
    return parts.join(', ');
  }
  return toNullableString(fallbackAddress) ?? '';
};

const mapMemberToDbColumns = (member = {}) => {
  const memberCode = toNullableString(
    member.memberCode ?? member.member_code ?? member.memberId ?? member.member_id
  );

  const preferredName = toNullableString(member.name) ?? toNullableString(member.baseName ?? member.base_name) ?? '';
  const baseName = toNullableString(member.baseName ?? member.base_name);
  const initial = toNullableString(member.initial);
  const phone = normalizePhone(member.phone ?? member.contactNumber ?? member.phoneNumber);
  const street = toNullableString(member.street);
  const town = toNullableString(member.town);
  const townId = toNullableString(member.townId ?? member.town_id);
  const address = composeAddress(street, town, member.address ?? member.addressLine);
  const relationshipName = toNullableString(member.relationshipName ?? member.relationship_name);
  const relationshipType = toNullableString(member.relationshipType ?? member.relationship_type);
  const relationship = toNullableString(member.relationship);
  const education = toNullableString(member.education);
  const profession = toNullableString(member.profession);
  const notes = toNullableString(member.notes ?? member.note);
  const sourceEventId = toNumericId(member.sourceEventId ?? member.source_event_id ?? member.eventId ?? member.event_id);
  const isMaternalUncle = normalizeBoolean(member.isMaternalUncle ?? member.is_maternal_uncle, false) ? 1 : 0;

  const fullName = toNullableString(
    member.fullName ?? member.full_name ?? (
      initial && (preferredName || baseName)
        ? `${initial}. ${preferredName || baseName}`
        : preferredName || baseName || ''
    )
  );

  return {
    memberCode,
    name: preferredName,
    initial,
    baseName,
    fullName,
    phone,
    address,
    town,
    townId,
    street,
    relationshipName,
    relationshipType,
    relationship,
    education,
    profession,
    isMaternalUncle,
    notes,
    sourceEventId,
    raw: JSON.stringify(member ?? {}) || '{}'
  };
};

const mapRowToMember = (row) => {
  const parsed = parseJsonColumn(row.data) || {};
  const member = { ...parsed };

  if (row.id != null) {
    member.id = padId(row.id, 6);
  }

  if (row.member_code != null) {
    member.member_code = row.member_code;
    member.memberCode = row.member_code;
    if (!member.memberId) {
      member.memberId = row.member_code;
    }
  }

  if (row.name != null) {
    member.name = row.name;
  }

  if (row.initial != null) {
    member.initial = row.initial;
  }

  if (row.base_name != null) {
    member.base_name = row.base_name;
    if (!member.baseName) {
      member.baseName = row.base_name;
    }
  }

  if (row.full_name != null) {
    member.full_name = row.full_name;
    if (!member.fullName) {
      member.fullName = row.full_name;
    }
  }

  if (row.phone != null) {
    const normalized = normalizePhone(row.phone);
    member.phone = normalized;
    if (!member.contactNumber) {
      member.contactNumber = normalized;
    }
  }

  if (row.address != null) {
    member.address = row.address;
  }

  if (row.town != null) {
    member.town = row.town;
  }

  if (row.town_id != null) {
    member.town_id = row.town_id;
    if (!member.townId) {
      member.townId = row.town_id;
    }
  }

  if (row.street != null) {
    member.street = row.street;
  }

  if (row.relationship_name != null) {
    member.relationship_name = row.relationship_name;
    if (!member.relationshipName) {
      member.relationshipName = row.relationship_name;
    }
  }

  if (row.relationship_type != null) {
    member.relationship_type = row.relationship_type;
    if (!member.relationshipType) {
      member.relationshipType = row.relationship_type;
    }
  }

  if (row.relationship != null) {
    member.relationship = row.relationship;
  }

  if (row.education != null) {
    member.education = row.education;
  }

  if (row.profession != null) {
    member.profession = row.profession;
  }

  if (row.is_maternal_uncle != null) {
    member.is_maternal_uncle = row.is_maternal_uncle;
    member.isMaternalUncle = normalizeBoolean(row.is_maternal_uncle, false);
  }

  if (row.notes != null) {
    member.notes = row.notes;
  }

  if (row.source_event_id != null) {
    member.source_event_id = row.source_event_id;
    member.sourceEventId = padId(row.source_event_id);
  }

  member.memberCode = member.memberCode || member.member_code || member.memberId || null;
  member.memberId = member.memberId || member.memberCode;
  member.fullName = member.fullName || member.full_name;
  member.baseName = member.baseName || member.base_name;
  member.address = toNullableString(member.address) ?? composeAddress(member.street, member.town, null);

  return member;
};

const ensureSchema = async () => {
  const connection = await pool.getConnection();
  try {
    const statements = [
      `CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(255) NULL,
        event_side VARCHAR(255) NULL,
        event_date DATE NULL,
        event_time VARCHAR(10) NULL,
        location VARCHAR(255) NULL,
        venue VARCHAR(255) NULL,
        place VARCHAR(255) NULL,
        event_head VARCHAR(255) NULL,
        event_head_prof VARCHAR(255) NULL,
        event_organizer VARCHAR(255) NULL,
        event_organizer_prof VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        address TEXT NULL,
        invitation_count INT NULL,
        table_count INT NULL,
        approval_pins JSON NULL,
        data JSON NULL
      )`,
      `CREATE TABLE IF NOT EXISTS registrars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NULL,
        designation VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        address TEXT NULL,
        permission TINYINT(1) DEFAULT 1,
        data JSON NULL
      )`,
      `CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_code VARCHAR(64) NULL,
        name VARCHAR(255) NULL,
        initial VARCHAR(50) NULL,
        base_name VARCHAR(255) NULL,
        full_name VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        address TEXT NULL,
        town VARCHAR(255) NULL,
        town_id VARCHAR(64) NULL,
        street VARCHAR(255) NULL,
        relationship_name VARCHAR(255) NULL,
        relationship_type VARCHAR(64) NULL,
        relationship VARCHAR(255) NULL,
        education VARCHAR(255) NULL,
        profession VARCHAR(255) NULL,
        is_maternal_uncle TINYINT(1) DEFAULT 0,
        notes TEXT NULL,
        source_event_id INT NULL,
        data JSON NULL,
        UNIQUE KEY idx_member_code (member_code)
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(255) NULL,
        value TEXT NULL,
        data JSON NULL
      )`,
      `CREATE TABLE IF NOT EXISTS moi_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NULL,
        serial_no INT NULL,
        table_no VARCHAR(50) NULL,
        contributor_name VARCHAR(255) NULL,
        amount DECIMAL(12,2) DEFAULT 0,
        phone VARCHAR(50) NULL,
        note TEXT NULL,
        denominations JSON NULL,
        member_id VARCHAR(255) NULL,
        town VARCHAR(255) NULL,
        town_id VARCHAR(64) NULL,
        street VARCHAR(255) NULL,
        initial VARCHAR(50) NULL,
        base_name VARCHAR(255) NULL,
        relationship_name VARCHAR(255) NULL,
        relationship_type VARCHAR(64) NULL,
        relationship VARCHAR(255) NULL,
        education VARCHAR(255) NULL,
        profession VARCHAR(255) NULL,
        is_maternal_uncle TINYINT(1) DEFAULT 0,
        entry_type VARCHAR(64) NULL,
        data JSON NULL,
        uuid CHAR(36) NULL,
        synced TINYINT(1) DEFAULT 0,
        INDEX idx_event_id (event_id)
      )`
    ];

    for (const statement of statements) {
      await connection.query(statement);
    }

    const charsetUpdates = [
      'ALTER TABLE events CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      'ALTER TABLE registrars CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      'ALTER TABLE members CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      'ALTER TABLE settings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      'ALTER TABLE moi_entries CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    ];

    for (const statement of charsetUpdates) {
      try {
        await connection.query(statement);
      } catch (err) {
        console.warn('Charset update skipped:', err?.message || err);
      }
    }

    const eventColumnAdditions = [
      'ALTER TABLE events ADD COLUMN event_name VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN event_date DATE NULL',
      'ALTER TABLE events ADD COLUMN event_head VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN event_organizer VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN location VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN event_side VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN event_time VARCHAR(10) NULL',
      'ALTER TABLE events ADD COLUMN venue VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN place VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN event_head_prof VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN event_organizer_prof VARCHAR(255) NULL',
      'ALTER TABLE events ADD COLUMN phone VARCHAR(50) NULL',
      'ALTER TABLE events ADD COLUMN address TEXT NULL',
      'ALTER TABLE events ADD COLUMN invitation_count INT NULL',
      'ALTER TABLE events ADD COLUMN table_count INT NULL',
      'ALTER TABLE events ADD COLUMN approval_pins JSON NULL'
    ];

    for (const ddl of eventColumnAdditions) {
      try {
        await connection.query(ddl);
      } catch (alterErr) {
        if (alterErr.code !== 'ER_DUP_FIELDNAME') {
          console.warn('Warning: unable to apply schema change:', ddl, alterErr.message);
        }
      }
    }

    const registrarColumnAdditions = [
      'ALTER TABLE registrars ADD COLUMN address TEXT NULL',
      'ALTER TABLE registrars ADD COLUMN permission TINYINT(1) DEFAULT 1'
    ];

    for (const ddl of registrarColumnAdditions) {
      try {
        await connection.query(ddl);
      } catch (alterErr) {
        if (alterErr.code !== 'ER_DUP_FIELDNAME') {
          console.warn('Warning: unable to apply schema change:', ddl, alterErr.message);
        }
      }
    }

    const memberColumnAdditions = [
      'ALTER TABLE members ADD COLUMN member_code VARCHAR(64) NULL',
      'ALTER TABLE members ADD COLUMN initial VARCHAR(50) NULL',
      'ALTER TABLE members ADD COLUMN base_name VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN full_name VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN phone VARCHAR(50) NULL',
      'ALTER TABLE members ADD COLUMN address TEXT NULL',
      'ALTER TABLE members ADD COLUMN town VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN town_id VARCHAR(64) NULL',
      'ALTER TABLE members ADD COLUMN street VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN relationship_name VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN relationship_type VARCHAR(64) NULL',
      'ALTER TABLE members ADD COLUMN relationship VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN education VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN profession VARCHAR(255) NULL',
      'ALTER TABLE members ADD COLUMN is_maternal_uncle TINYINT(1) DEFAULT 0',
      'ALTER TABLE members ADD COLUMN notes TEXT NULL',
      'ALTER TABLE members ADD COLUMN source_event_id INT NULL'
    ];

    for (const ddl of memberColumnAdditions) {
      try {
        await connection.query(ddl);
      } catch (alterErr) {
        if (alterErr.code !== 'ER_DUP_FIELDNAME') {
          console.warn('Warning: unable to apply schema change:', ddl, alterErr.message);
        }
      }
    }

    try {
      await connection.query('ALTER TABLE members ADD UNIQUE KEY idx_member_code (member_code)');
    } catch (alterErr) {
      if (alterErr.code !== 'ER_DUP_KEYNAME' && alterErr.code !== 'ER_DUP_FIELDNAME') {
        console.warn('Warning: unable to add unique index to members.member_code:', alterErr.message);
      }
    }

    try {
      await connection.query('ALTER TABLE members MODIFY COLUMN data JSON NULL');
    } catch (alterErr) {
      if (alterErr.code !== 'ER_BAD_FIELD_ERROR') {
        console.warn('Warning: unable to alter members.data column:', alterErr.message);
      }
    }

    const moiEntryColumnAdditions = [
      'ALTER TABLE moi_entries ADD COLUMN event_id INT NULL',
      'ALTER TABLE moi_entries ADD COLUMN serial_no INT NULL',
      'ALTER TABLE moi_entries ADD COLUMN table_no VARCHAR(50) NULL',
      'ALTER TABLE moi_entries ADD COLUMN contributor_name VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN amount DECIMAL(12,2) DEFAULT 0',
      'ALTER TABLE moi_entries ADD COLUMN phone VARCHAR(50) NULL',
      'ALTER TABLE moi_entries ADD COLUMN note TEXT NULL',
      'ALTER TABLE moi_entries ADD COLUMN denominations JSON NULL',
      'ALTER TABLE moi_entries ADD COLUMN member_id VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN town VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN town_id VARCHAR(64) NULL',
      'ALTER TABLE moi_entries ADD COLUMN street VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN initial VARCHAR(50) NULL',
      'ALTER TABLE moi_entries ADD COLUMN base_name VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN relationship_name VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN relationship_type VARCHAR(64) NULL',
      'ALTER TABLE moi_entries ADD COLUMN relationship VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN education VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN profession VARCHAR(255) NULL',
      'ALTER TABLE moi_entries ADD COLUMN is_maternal_uncle TINYINT(1) DEFAULT 0',
      'ALTER TABLE moi_entries ADD COLUMN entry_type VARCHAR(64) NULL',
      'ALTER TABLE moi_entries ADD COLUMN data JSON NULL',
      'ALTER TABLE moi_entries ADD COLUMN uuid CHAR(36) NULL',
      'ALTER TABLE moi_entries ADD COLUMN synced TINYINT(1) DEFAULT 0'
    ];

    for (const ddl of moiEntryColumnAdditions) {
      try {
        await connection.query(ddl);
      } catch (alterErr) {
        if (alterErr.code !== 'ER_DUP_FIELDNAME') {
          console.warn('Warning: unable to apply schema change:', ddl, alterErr.message);
        }
      }
    }

    try {
      await connection.query('ALTER TABLE moi_entries MODIFY COLUMN table_no VARCHAR(50) NULL');
    } catch (alterErr) {
      if (alterErr.code !== 'ER_BAD_FIELD_ERROR') {
        console.warn('Warning: unable to alter moi_entries.table_no to VARCHAR(50):', alterErr.message);
      }
    }
  } catch (err) {
    console.error('Schema initialization error:', err.message);
  } finally {
    connection.release();
  }
};

if (!isPostgres) {
  ensureSchema().catch((err) => console.error('Schema setup failed:', err.message));
} else {
  console.log('PostgreSQL mode: skipping MySQL schema auto-setup. Run server/postgres_schema.sql in Supabase.');
}

app.get('/api/bookings', async (req, res) => {
  try {
    const status = toNullableString(req.query.status);
    const phone = toNullableString(req.query.phone);
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (phone) {
      query += ' AND phone LIKE ?';
      params.push(`%${phone}%`);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows.map(mapBookingRow));
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = mapBookingToDbColumns(req.body || {});
    if (!booking.name || !booking.phone || !booking.eventName || !booking.bookingDate || !booking.bookingTime) {
      return res.status(400).json({ error: 'Required booking fields missing' });
    }

    const id = generateUuidV4();
    const sql = `
      INSERT INTO bookings
        (id, name, phone, event_name, booking_date, booking_time, invitation_count, amount, payment_method, payment_reference, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      id,
      booking.name,
      booking.phone,
      booking.eventName,
      booking.bookingDate,
      booking.bookingTime,
      booking.invitationCount,
      booking.amount,
      booking.paymentMethod,
      booking.paymentReference,
      booking.status
    ]);

    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    const created = rows && rows.length ? mapBookingRow(rows[0]) : { id, ...booking };
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updates = mapBookingToDbColumns(req.body || {});
    const updateFields = [];
    const params = [];

    updateFields.push('updated_at = NOW()');

    if (req.body.status !== undefined) {
      updateFields.push('status = ?');
      params.push(updates.status);
    }
    if (req.body.paymentReference !== undefined) {
      updateFields.push('payment_reference = ?');
      params.push(updates.paymentReference);
    }
    if (req.body.invitationCount !== undefined) {
      updateFields.push('invitation_count = ?');
      params.push(updates.invitationCount);
    }
    if (req.body.amount !== undefined) {
      updateFields.push('amount = ?');
      params.push(updates.amount);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(bookingId);
    const sql = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, params);

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    res.json(rows && rows.length ? mapBookingRow(rows[0]) : { id: bookingId });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.get('/api/events', async (req, res) => {
  console.log('[GET] /api/events request received');
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY id ASC');
    const events = rows.map(row => {
      const parsed = parseJsonColumn(row.data);
      const approvalPinsColumn = parseJsonColumn(row.approval_pins);
      const eventDateValue = row.event_date
        ? (row.event_date instanceof Date
            ? row.event_date.toISOString().slice(0, 10)
            : String(row.event_date).slice(0, 10))
        : '';

      const eventDateFallback = row.eventDate
        ? (row.eventDate instanceof Date
            ? row.eventDate.toISOString().slice(0, 10)
            : String(row.eventDate).slice(0, 10))
        : '';

      const base = {
        id: padId(row.id),
        eventName: row.event_name || row.eventName || '',
        eventSide: row.event_side || row.eventSide || '',
        date: eventDateValue || eventDateFallback,
        time: row.event_time ? String(row.event_time).slice(0, 5) : (row.eventTime ? String(row.eventTime).slice(0, 5) : ''),
        eventHead: row.event_head || row.eventHead || '',
        eventHeadProf: row.event_head_prof || row.eventHeadProf || '',
        eventOrganizer: row.event_organizer || row.eventOrganizer || '',
        eventOrganizerProf: row.event_organizer_prof || row.eventOrganizerProf || '',
        venue: row.venue || row.location || row.eventVenue || row.eventLocation || '',
        place: row.place || row.eventPlace || '',
        phone: row.phone || row.eventPhone || '',
        address: row.address || row.eventAddress || '',
        invitationCount: row.invitation_count != null ? String(row.invitation_count) : (row.invitationCount != null ? String(row.invitationCount) : ''),
        tableCount: row.table_count != null ? String(row.table_count) : (row.tableCount != null ? String(row.tableCount) : ''),
        approvalPins: Array.isArray(approvalPinsColumn) ? approvalPinsColumn : []
      };


      const merged = parsed ? { ...base, ...parsed } : base;

      if (!Array.isArray(merged.approvalPins)) {
        const fallbackPins = parseJsonColumn(merged.approvalPins);
        merged.approvalPins = Array.isArray(fallbackPins) ? fallbackPins : base.approvalPins;
      }

      if (!Array.isArray(merged.approvalPins)) {
        merged.approvalPins = [];
      }

      merged.id = padId(row.id);
      return merged;
    });
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err?.stack || err);
    res.status(500).json({ error: 'Failed to fetch events', details: err?.message || String(err) });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const event = req.body || {};
    const numericId = event.id ? parseInt(event.id, 10) : null;
    const sanitized = mapEventToDbColumns(event);
    const baseParams = [
      sanitized.eventName,
      sanitized.eventSide,
      sanitized.eventDate,
      sanitized.eventTime,
      sanitized.location,
      sanitized.venue,
      sanitized.place,
      sanitized.eventHead,
      sanitized.eventHeadProf,
      sanitized.eventOrganizer,
      sanitized.eventOrganizerProf,
      sanitized.phone,
      sanitized.address,
      sanitized.invitationCount,
      sanitized.tableCount,
      sanitized.approvalPins,
      sanitized.raw
    ];

    const returningClause = isPostgres ? ' RETURNING id' : '';
    const snakeSql = numericId != null && !Number.isNaN(numericId)
      ? `INSERT INTO events (id, event_name, event_side, event_date, event_time, location, venue, place, event_head, event_head_prof, event_organizer, event_organizer_prof, phone, address, invitation_count, table_count, approval_pins, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`
      : `INSERT INTO events (event_name, event_side, event_date, event_time, location, venue, place, event_head, event_head_prof, event_organizer, event_organizer_prof, phone, address, invitation_count, table_count, approval_pins, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`;
    const snakeParams = numericId != null && !Number.isNaN(numericId)
      ? [numericId, ...baseParams]
      : baseParams;

    const camelSql = numericId != null && !Number.isNaN(numericId)
      ? `INSERT INTO events (id, eventName, eventSide, eventDate, eventTime, location, venue, place, eventHead, eventHeadProf, eventOrganizer, eventOrganizerProf, phone, address, invitationCount, tableCount, approvalPins, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`
      : `INSERT INTO events (eventName, eventSide, eventDate, eventTime, location, venue, place, eventHead, eventHeadProf, eventOrganizer, eventOrganizerProf, phone, address, invitationCount, tableCount, approvalPins, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`;
    const camelParams = snakeParams;

    let result;
    try {
      [result] = await pool.query(snakeSql, snakeParams);
    } catch (err) {
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        [result] = await pool.query(camelSql, camelParams);
      } else {
        throw err;
      }
    }
    const newId = numericId || result.insertId;
    res.json({ id: padId(newId) });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event', details: err?.message || String(err) });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const event = req.body || {};
    const sanitized = mapEventToDbColumns(event);
    const params = [
      sanitized.eventName,
      sanitized.eventSide,
      sanitized.eventDate,
      sanitized.eventTime,
      sanitized.location,
      sanitized.venue,
      sanitized.place,
      sanitized.eventHead,
      sanitized.eventHeadProf,
      sanitized.eventOrganizer,
      sanitized.eventOrganizerProf,
      sanitized.phone,
      sanitized.address,
      sanitized.invitationCount,
      sanitized.tableCount,
      sanitized.approvalPins,
      sanitized.raw,
      eventId
    ];

    const snakeSql = 'UPDATE events SET event_name = ?, event_side = ?, event_date = ?, event_time = ?, location = ?, venue = ?, place = ?, event_head = ?, event_head_prof = ?, event_organizer = ?, event_organizer_prof = ?, phone = ?, address = ?, invitation_count = ?, table_count = ?, approval_pins = ?, data = ? WHERE id = ?';
    const camelSql = 'UPDATE events SET eventName = ?, eventSide = ?, eventDate = ?, eventTime = ?, location = ?, venue = ?, place = ?, eventHead = ?, eventHeadProf = ?, eventOrganizer = ?, eventOrganizerProf = ?, phone = ?, address = ?, invitationCount = ?, tableCount = ?, approvalPins = ?, data = ? WHERE id = ?';

    try {
      await pool.query(snakeSql, params);
    } catch (err) {
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        await pool.query(camelSql, params);
      } else {
        throw err;
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

const getMoiEntriesHandler = async (req, res) => {
  try {
    const { eventId } = req.query;
    let sql = 'SELECT * FROM moi_entries';
    const params = [];
    if (eventId) {
      sql += ' WHERE event_id = ?';
      params.push(eventId);
    }
    sql += ' ORDER BY id ASC';
    const [rows] = await pool.query(sql, params);
    const items = rows.map(mapRowToMoiEntry);
    res.json(items);
  } catch (err) {
    console.error('Error fetching moi entries:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};

app.get('/api/moi_entries', getMoiEntriesHandler);
app.get('/api/moi-entries', getMoiEntriesHandler);

const createMoiEntryHandler = async (req, res) => {
  try {
    const entry = req.body || {};
    // accept uuid from client or generate one for local-first flow
    const assignedUuid = toNullableString(entry.uuid) || generateUuidV4();
    const sanitized = mapMoiEntryToDbColumns(entry);
    const params = [
      sanitized.eventId,
      sanitized.serialNo,
      sanitized.tableNo,
      sanitized.contributorName,
      sanitized.amount,
      sanitized.phone,
      sanitized.note,
      sanitized.denominations,
      sanitized.memberId,
      sanitized.town,
      sanitized.townId,
      sanitized.street,
      sanitized.initial,
      sanitized.baseName,
      sanitized.relationshipName,
      sanitized.relationshipType,
      sanitized.relationship,
      sanitized.education,
      sanitized.profession,
      sanitized.isMaternalUncle,
      sanitized.entryType,
      sanitized.raw,
      assignedUuid,
      0
    ];

    const returningClause = isPostgres ? ' RETURNING id' : '';
    const snakeSql = `INSERT INTO moi_entries (
        event_id,
        serial_no,
        table_no,
        contributor_name,
        amount,
        phone,
        note,
        denominations,
        member_id,
        town,
        town_id,
        street,
        initial,
        base_name,
        relationship_name,
        relationship_type,
        relationship,
        education,
        profession,
        is_maternal_uncle,
        entry_type,
        data,
        uuid,
        synced
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`;

    const camelSql = `INSERT INTO moi_entries (
        eventId,
    serialNo,
        tableNo,
        contributorName,
        amount,
        phone,
        note,
        denominations,
        memberId,
        town,
        townId,
        street,
        initial,
        baseName,
        relationshipName,
        relationshipType,
        relationship,
        education,
        profession,
        isMaternalUncle,
        entryType,
        data,
        uuid,
        synced
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`;

    let result;
    try {
      [result] = await pool.query(snakeSql, params);
    } catch (err) {
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        [result] = await pool.query(camelSql, params);
      } else {
        throw err;
      }
    }
    res.json({ id: result.insertId, uuid: assignedUuid });
  } catch (err) {
    console.error('Error creating moi entry:', err);
    res.status(500).json({ error: 'Failed to create entry', details: err?.message || String(err) });
  }
};

app.post('/api/moi_entries', createMoiEntryHandler);
app.post('/api/moi-entries', createMoiEntryHandler);

const updateMoiEntryHandler = async (req, res) => {
  try {
    const entryId = parseInt(req.params.id, 10);
    const entry = req.body || {};
    const sanitized = mapMoiEntryToDbColumns(entry);
    await pool.query(
      `UPDATE moi_entries SET
        event_id = ?,
        serial_no = ?,
        table_no = ?,
        contributor_name = ?,
        amount = ?,
        phone = ?,
        note = ?,
        denominations = ?,
        member_id = ?,
        town = ?,
        town_id = ?,
        street = ?,
        initial = ?,
        base_name = ?,
        relationship_name = ?,
        relationship_type = ?,
        relationship = ?,
        education = ?,
        profession = ?,
        is_maternal_uncle = ?,
        entry_type = ?,
        data = ?
      WHERE id = ?`,
      [
  sanitized.eventId,
  sanitized.serialNo,
        sanitized.tableNo,
        sanitized.contributorName,
        sanitized.amount,
        sanitized.phone,
        sanitized.note,
        sanitized.denominations,
        sanitized.memberId,
        sanitized.town,
        sanitized.townId,
        sanitized.street,
        sanitized.initial,
        sanitized.baseName,
        sanitized.relationshipName,
        sanitized.relationshipType,
        sanitized.relationship,
        sanitized.education,
        sanitized.profession,
        sanitized.isMaternalUncle,
        sanitized.entryType,
        sanitized.raw,
        entryId
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating moi entry:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

app.put('/api/moi_entries/:id', updateMoiEntryHandler);
app.put('/api/moi-entries/:id', updateMoiEntryHandler);

const deleteMoiEntryHandler = async (req, res) => {
  try {
    const entryId = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM moi_entries WHERE id = ?', [entryId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting moi entry:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
};

app.delete('/api/moi_entries/:id', deleteMoiEntryHandler);
app.delete('/api/moi-entries/:id', deleteMoiEntryHandler);

app.get('/api/registrars', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM registrars ORDER BY id ASC');
    const registrars = rows.map(mapRowToRegistrar);
    res.json(registrars);
  } catch (err) {
    console.error('Error fetching registrars:', err);
    res.status(500).json({ error: 'Failed to fetch registrars' });
  }
});

app.post('/api/registrars', async (req, res) => {
  try {
    const registrar = req.body || {};
    const numericId = registrar.id ? parseInt(registrar.id, 10) : null;
    const sanitized = mapRegistrarToDbColumns(registrar);
    const returningClause = isPostgres ? ' RETURNING id' : '';
    let sql = `INSERT INTO registrars (name, designation, phone, address, permission, data) VALUES (?, ?, ?, ?, ?, ?)${returningClause}`;
    const params = [
      sanitized.name,
      sanitized.designation,
      sanitized.phone,
      sanitized.address,
      sanitized.permission,
      sanitized.raw
    ];
    if (!Number.isNaN(numericId) && numericId != null) {
      sql = `INSERT INTO registrars (id, name, designation, phone, address, permission, data) VALUES (?, ?, ?, ?, ?, ?, ?)${returningClause}`;
      params.unshift(numericId);
    }
    const [result] = await pool.query(sql, params);
    const newId = numericId || result.insertId;
    res.json({ id: padId(newId) });
  } catch (err) {
    console.error('Error creating registrar:', err);
    res.status(500).json({ error: 'Failed to create registrar' });
  }
});

app.put('/api/registrars/:id', async (req, res) => {
  try {
    const registrarId = parseInt(req.params.id, 10);
    const registrar = req.body || {};
    const sanitized = mapRegistrarToDbColumns(registrar);
    await pool.query(
      'UPDATE registrars SET name = ?, designation = ?, phone = ?, address = ?, permission = ?, data = ? WHERE id = ?',
      [
        sanitized.name,
        sanitized.designation,
        sanitized.phone,
        sanitized.address,
        sanitized.permission,
        sanitized.raw,
        registrarId
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating registrar:', err);
    res.status(500).json({ error: 'Failed to update registrar' });
  }
});

app.delete('/api/registrars/:id', async (req, res) => {
  try {
    const registrarId = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM registrars WHERE id = ?', [registrarId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting registrar:', err);
    res.status(500).json({ error: 'Failed to delete registrar' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members ORDER BY id ASC');
    const members = rows.map(mapRowToMember);
    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const member = req.body || {};
    const numericId = member.id ? parseInt(member.id, 10) : null;
    const sanitized = mapMemberToDbColumns(member);
    if (!sanitized.memberCode) {
      return res.status(400).json({ error: 'memberCode is required' });
    }
    const returningClause = isPostgres ? ' RETURNING id' : '';
    let sql = `INSERT INTO members (
      member_code,
      name,
      initial,
      base_name,
      full_name,
      phone,
      address,
      town,
      town_id,
      street,
      relationship_name,
      relationship_type,
      relationship,
      education,
      profession,
      is_maternal_uncle,
      notes,
      source_event_id,
      data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`;
    const params = [
      sanitized.memberCode,
      sanitized.name,
      sanitized.initial,
      sanitized.baseName,
      sanitized.fullName,
      sanitized.phone,
      sanitized.address,
      sanitized.town,
      sanitized.townId,
      sanitized.street,
      sanitized.relationshipName,
      sanitized.relationshipType,
      sanitized.relationship,
      sanitized.education,
      sanitized.profession,
      sanitized.isMaternalUncle,
      sanitized.notes,
      sanitized.sourceEventId,
      sanitized.raw
    ];
    if (!Number.isNaN(numericId) && numericId != null) {
      sql = `INSERT INTO members (
        id,
        member_code,
        name,
        initial,
        base_name,
        full_name,
        phone,
        address,
        town,
        town_id,
        street,
        relationship_name,
        relationship_type,
        relationship,
        education,
        profession,
        is_maternal_uncle,
        notes,
        source_event_id,
        data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${returningClause}`;
      params.unshift(numericId);
    }
    const [result] = await pool.query(sql, params);
    const newId = numericId || result.insertId;
    res.json({ id: padId(newId) });
  } catch (err) {
    console.error('Error creating member:', err);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const member = req.body || {};
    const sanitized = mapMemberToDbColumns(member);
    if (!sanitized.memberCode) {
      return res.status(400).json({ error: 'memberCode is required' });
    }
    await pool.query(
      `UPDATE members SET
        member_code = ?,
        name = ?,
        initial = ?,
        base_name = ?,
        full_name = ?,
        phone = ?,
        address = ?,
        town = ?,
        town_id = ?,
        street = ?,
        relationship_name = ?,
        relationship_type = ?,
        relationship = ?,
        education = ?,
        profession = ?,
        is_maternal_uncle = ?,
        notes = ?,
        source_event_id = ?,
        data = ?
      WHERE id = ?`,
      [
        sanitized.memberCode,
        sanitized.name,
        sanitized.initial,
        sanitized.baseName,
        sanitized.fullName,
        sanitized.phone,
        sanitized.address,
        sanitized.town,
        sanitized.townId,
        sanitized.street,
        sanitized.relationshipName,
        sanitized.relationshipType,
        sanitized.relationship,
        sanitized.education,
        sanitized.profession,
        sanitized.isMaternalUncle,
        sanitized.notes,
        sanitized.sourceEventId,
        sanitized.raw,
        memberId
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM members WHERE id = ?', [memberId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

app.post('/api/members/bulk-sync', async (req, res) => {
  try {
    const incoming = Array.isArray(req.body) ? req.body : [];
    if (!incoming.length) {
      return res.json({ success: true, processed: 0 });
    }

    const sanitizedMembers = incoming
      .map(mapMemberToDbColumns)
      .filter(member => member.memberCode);

    if (!sanitizedMembers.length) {
      return res.status(400).json({ error: 'No member records with memberCode provided' });
    }

    const columns = [
      'member_code',
      'name',
      'initial',
      'base_name',
      'full_name',
      'phone',
      'address',
      'town',
      'town_id',
      'street',
      'relationship_name',
      'relationship_type',
      'relationship',
      'education',
      'profession',
      'is_maternal_uncle',
      'notes',
      'source_event_id',
      'data'
    ];

    const placeholders = `(${columns.map(() => '?').join(', ')})`;
    const values = [];
    const rowsSql = sanitizedMembers.map(member => {
      values.push(
        member.memberCode,
        member.name,
        member.initial,
        member.baseName,
        member.fullName,
        member.phone,
        member.address,
        member.town,
        member.townId,
        member.street,
        member.relationshipName,
        member.relationshipType,
        member.relationship,
        member.education,
        member.profession,
        member.isMaternalUncle,
        member.notes,
        member.sourceEventId,
        member.raw
      );
      return placeholders;
    });

    const updateAssignments = columns
      .filter(column => column !== 'member_code')
      .map(column => isPostgres
        ? `${column} = EXCLUDED.${column}`
        : `${column} = VALUES(${column})`)
      .join(', ');

    const sql = isPostgres
      ? `INSERT INTO members (${columns.join(', ')}) VALUES ${rowsSql.join(', ')}
        ON CONFLICT (member_code) DO UPDATE SET ${updateAssignments}`
      : `INSERT INTO members (${columns.join(', ')}) VALUES ${rowsSql.join(', ')}
        ON DUPLICATE KEY UPDATE ${updateAssignments}`;

    await pool.query(sql, values);

    res.json({ success: true, processed: sanitizedMembers.length });
  } catch (err) {
    console.error('Error syncing members:', err);
    res.status(500).json({ error: 'Failed to sync members' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings ORDER BY id ASC');
    const settings = rows.map(row => {
      const parsed = parseJsonColumn(row.data);
      return parsed ? { ...parsed, id: padId(row.id), data: parsed } : row;
    });
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const setting = req.body || {};
    const numericId = setting.id ? parseInt(setting.id, 10) : null;
    const returningClause = isPostgres ? ' RETURNING id' : '';
    let sql = `INSERT INTO settings (key_name, value, data) VALUES (?, ?, ?)${returningClause}`;
    const params = [setting.key_name || setting.keyName || '', setting.value || '', JSON.stringify(setting)];
    if (!Number.isNaN(numericId) && numericId != null) {
      sql = `INSERT INTO settings (id, key_name, value, data) VALUES (?, ?, ?, ?)${returningClause}`;
      params.unshift(numericId);
    }
    const [result] = await pool.query(sql, params);
    const newId = numericId || result.insertId;
    res.json({ id: padId(newId) });
  } catch (err) {
    console.error('Error creating setting:', err);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

app.post('/api/settings/save', async (req, res) => {
  try {
    const settingsPayload = req.body || {};
    await pool.query('DELETE FROM settings WHERE key_name = ?', ['app_settings']);
    await pool.query(
      'INSERT INTO settings (key_name, value, data) VALUES (?, ?, ?)',
      ['app_settings', '', JSON.stringify(settingsPayload)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Endpoint to enumerate local printers on the server host (Windows). This uses PowerShell
// and does not require native npm modules. It returns an array of printer names.
app.get('/api/printers', (req, res) => {
  // Restrict to Windows only - if not Windows, return empty list
  if (process.platform !== 'win32') {
    return res.json([]);
  }

  const psCommand = `try { Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress } catch { Get-WmiObject -Class Win32_Printer | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress }`;
  const cmd = `powershell -NoProfile -Command "${psCommand.replace(/"/g, '\\"')}"`;

  exec(cmd, { windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      console.warn('Printer enumeration failed:', err, stderr);
      // Fallback: return empty array but do not crash the API
      return res.status(500).json({ error: 'Failed to enumerate printers', details: err.message || stderr });
    }

    let printers = [];
    try {
      const parsed = JSON.parse(stdout);
      if (Array.isArray(parsed)) printers = parsed.map(p => String(p).trim()).filter(Boolean);
      else if (parsed) printers = [String(parsed).trim()];
    } catch (parseErr) {
      // If JSON parse fails, split by lines as a last resort
      printers = String(stdout).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }

    // Deduplicate and return
    printers = Array.from(new Set(printers));
    res.json(printers);
  });
});

app.listen(PORT, () => {
  console.log(`MoiBook MySQL API running on http://localhost:${PORT}`);
});
