/**
 * Striking Details - Book sync endpoint
 *
 * The phone stays the source of truth. It pushes a full snapshot; this writes
 * it into tabs you can read, and files receipt photos into Drive so they stop
 * eating phone storage. Pull is for moving to a new phone.
 *
 * SETUP
 *  1. Extensions > Apps Script in your sheet, paste this in, Save.
 *  2. Project Settings > Script Properties > Add:
 *        SECRET = a long random string you invent
 *  3. Deploy > New deployment > Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *     Copy the /exec URL.
 *  4. In the app: More > Cloud backup, paste the URL and the same SECRET.
 *
 * "Anyone" is required because the phone calls this without a Google login.
 * The SECRET is what actually protects it, so make it long and never put it
 * in a repo or a screenshot.
 */

var TABS = {
  Contacts: ['id','name','company','phone','category','status','source','metAt','metOn',
             'nextStep','nextDue','quoteAmount','planAmount','vehicles','notes','updated'],
  Ledger:   ['id','date','kind','amount','cat','memo','contactId','contactName',
             'vehicles','hours','paid','receiptUrl'],
  Invoices: ['id','no','date','toName','toCompany','attn','toAddr','toCity',
             'terms','total','lines','notes']
};

function doPost(e) {
  var out = function (o) {
    return ContentService.createTextOutput(JSON.stringify(o))
      .setMimeType(ContentService.MimeType.JSON);
  };
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var want = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!want || body.secret !== want) return out({ ok: false, error: 'bad secret' });

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (body.action === 'pull')  return out({ ok: true, data: readAll_() });
      if (body.action === 'push')  return out({ ok: true, saved: writeAll_(body.data || {}) });
      if (body.action === 'ping')  return out({ ok: true, sheet: SpreadsheetApp.getActive().getName() });
      return out({ ok: false, error: 'unknown action' });
    } finally { lock.releaseLock(); }
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function sheet_(name) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  return sh;
}

function writeAll_(db) {
  var counts = {};

  // receipts and cards go to Drive, so the phone can drop the base64
  var folder = receiptFolder_();
  var urls = {};
  (db.ledger || []).forEach(function (r) {
    if (r.receipt && String(r.receipt).indexOf('data:') === 0) {
      urls[r.id] = saveImage_(folder, r.receipt, 'receipt-' + (r.date || '') + '-' + r.id + '.jpg');
    } else if (r.receiptUrl) { urls[r.id] = r.receiptUrl; }
  });

  var rows = (db.contacts || []).map(function (c) {
    return [c.id, c.name, c.company, c.phone, c.category, c.status, c.source, c.metAt, c.metOn,
            c.nextStep, c.nextDue, c.quoteAmount || 0, c.planAmount || 0,
            (c.vehicles || []).map(function (v) { return (v.desc || v.type) + (v.len ? ' ' + v.len + 'ft' : ''); }).join('; '),
            c.notes, c.updated];
  });
  counts.contacts = put_('Contacts', rows);

  rows = (db.ledger || []).map(function (r) {
    var c = (db.contacts || []).filter(function (x) { return x.id === r.contactId; })[0];
    return [r.id, r.date, r.kind, r.amount, r.cat, r.memo, r.contactId, c ? c.name : '',
            r.vehicles || '', r.hours || '', r.paid ? 'yes' : 'no', urls[r.id] || ''];
  });
  counts.ledger = put_('Ledger', rows);

  rows = (db.invoices || []).map(function (iv) {
    var tot = (iv.items || []).reduce(function (t, x) { return t + (+x.amount || 0); }, 0);
    return [iv.id, iv.no, iv.date, iv.toName, iv.toCompany, iv.attn, iv.toAddr, iv.toCity,
            iv.terms, tot,
            (iv.items || []).map(function (x) {
              var v = x.vehicle || {};
              return [v.year, v.make, v.model, v.color].filter(String).join(' ') + ' - ' + (x.service || '') + ' $' + (x.amount || 0);
            }).join(' | '),
            iv.notes];
  });
  counts.invoices = put_('Invoices', rows);

  var meta = sheet_('Meta');
  meta.clear();
  meta.getRange(1, 1, 5, 2).setValues([
    ['Last sync', new Date()],
    ['Take-home target', (db.goal || {}).target || ''],
    ['Tax %', (db.goal || {}).taxPct || ''],
    ['Contacts', counts.contacts],
    ['Ledger entries', counts.ledger]
  ]);
  meta.getRange(1, 1, 5, 1).setFontWeight('bold');

  // hand the Drive links back so the phone can bin its copies
  return { counts: counts, receiptUrls: urls };
}

function put_(name, rows) {
  var sh = sheet_(name), head = TABS[name];
  sh.clear();
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#08182E').setFontColor('#F4F1E8');
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows);
  sh.setFrozenRows(1);
  return rows.length;
}

function readAll_() {
  function grab(name) {
    var sh = SpreadsheetApp.getActive().getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return [];
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, TABS[name].length).getValues();
    return vals.map(function (r) {
      var o = {}; TABS[name].forEach(function (k, i) { o[k] = r[i]; }); return o;
    });
  }
  return { contacts: grab('Contacts'), ledger: grab('Ledger'), invoices: grab('Invoices') };
}

function receiptFolder_() {
  var name = 'Striking Details receipts';
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function saveImage_(folder, dataUrl, filename) {
  var parts = String(dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!parts) return '';
  var blob = Utilities.newBlob(Utilities.base64Decode(parts[2]), parts[1], filename);
  var existing = folder.getFilesByName(filename);
  if (existing.hasNext()) return existing.next().getUrl();
  return folder.createFile(blob).getUrl();
}
