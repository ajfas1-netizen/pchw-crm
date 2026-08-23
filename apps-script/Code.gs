/**
 * Striking Details — Book
 * Server. The app is served from here and the Sheet is the database.
 * Nothing is stored on anyone's phone.
 *
 * Deploy: Web app · Execute as "User accessing" · Access "Anyone with a Google Account".
 * Add a Script Property ALLOWED with the comma separated emails allowed in.
 */

var SCHEMA = {
  contacts: ['id','name','company','phone','email','category','status','source',
             'metAt','metOn','nextStep','nextDue','quoteAmount','planAmount',
             'vehicles','notes','cardUrl','memoUrl','createdAt','updatedAt','updatedBy'],
  ledger:   ['id','date','kind','amount','cat','memo','contactId','vehicles','hours',
             'paid','receiptUrl','createdAt','updatedAt','updatedBy'],
  invoices: ['id','no','date','serviceDate','terms','toName','toCompany','attn','toAddr',
             'toCity','phone','email','total','summary','itemsJson','notes',
             'createdAt','updatedAt','updatedBy']
};
var TAB = { contacts:'Contacts', ledger:'Ledger', invoices:'Invoices' };
var NUMERIC = {quoteAmount:1, planAmount:1, amount:1, hours:1, vehicles:1, total:1};
var BOOLEAN = {paid:1};

/* ---------------- entry point ---------------- */

function doGet() {
  return HtmlService.createTemplateFromFile('App')
    .evaluate()
    .setTitle('Striking Details — Book')
    .addMetaTag('viewport','width=device-width,initial-scale=1,viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(f){ return HtmlService.createHtmlOutputFromFile(f).getContent(); }

/* ---------------- identity ---------------- */

function currentEmail_(){
  var e = Session.getActiveUser().getEmail();
  return (e || '').toLowerCase();
}
function allowList_(){
  var raw = PropertiesService.getScriptProperties().getProperty('ALLOWED') || '';
  var list = raw.split(',').map(function(s){return s.trim().toLowerCase();}).filter(String);
  if (!list.length) list = [Session.getEffectiveUser().getEmail().toLowerCase()];
  return list;
}
function requireUser_(){
  var me = currentEmail_();
  if (!me) throw new Error('Could not read your Google account. Open the app directly rather than in a preview frame.');
  if (allowList_().indexOf(me) === -1) throw new Error('This book is not shared with ' + me + '.');
  return me;
}
function whoAmI(){ return { email: requireUser_() }; }

/* ---------------- read ---------------- */

function bootstrap(){
  var me = requireUser_();
  return {
    user: me,
    contacts: readTab_('contacts'),
    ledger:   readTab_('ledger'),
    invoices: readTab_('invoices'),
    settings: readSettings_()
  };
}

function sheet_(name){
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); }
  return sh;
}

function ensureHeader_(kind){
  var sh = sheet_(TAB[kind]), cols = SCHEMA[kind];
  if (sh.getLastRow() === 0 || sh.getLastColumn() < cols.length) {
    sh.getRange(1,1,1,cols.length).setValues([cols])
      .setFontWeight('bold').setBackground('#08182E').setFontColor('#F4F1E8');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readTab_(kind){
  var sh = ensureHeader_(kind), cols = SCHEMA[kind];
  if (sh.getLastRow() < 2) return [];
  var vals = sh.getRange(2,1,sh.getLastRow()-1,cols.length).getValues();
  var out = [];
  vals.forEach(function(r){
    if (!r[0]) return;
    var o = {};
    cols.forEach(function(k,i){
      var v = r[i];
      if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (NUMERIC[k]) v = (v === '' || v === null) ? 0 : Number(v);
      if (BOOLEAN[k]) v = (v === true || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'true');
      o[k] = v;
    });
    out.push(o);
  });
  return out;
}

function readSettings_(){
  var sh = sheet_('Settings');
  if (sh.getLastRow() < 2) return {};
  var vals = sh.getRange(2,1,sh.getLastRow()-1,2).getValues(), o = {};
  vals.forEach(function(r){ if (r[0]) { try { o[r[0]] = JSON.parse(r[1]); } catch(e){ o[r[0]] = r[1]; } } });
  return o;
}

/* ---------------- write ---------------- */

function saveRecord(kind, rec){
  var me = requireUser_();
  if (!SCHEMA[kind]) throw new Error('unknown kind ' + kind);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = ensureHeader_(kind), cols = SCHEMA[kind];
    rec = rec || {};
    if (!rec.id) rec.id = Utilities.getUuid().slice(0,8);
    var now = new Date().toISOString();
    rec.updatedAt = now; rec.updatedBy = me;

    var ids = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues() : [];
    var row = -1;
    for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(rec.id)) { row = i + 2; break; }
    if (row === -1) rec.createdAt = rec.createdAt || now;

    var line = cols.map(function(k){
      var v = rec[k];
      if (v === undefined || v === null) return '';
      if (BOOLEAN[k]) return v ? 'yes' : 'no';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    });
    if (row === -1) sh.appendRow(line);
    else sh.getRange(row,1,1,cols.length).setValues([line]);
    return rec;
  } finally { lock.releaseLock(); }
}

function deleteRecord(kind, id){
  requireUser_();
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = ensureHeader_(kind);
    if (sh.getLastRow() < 2) return false;
    var ids = sh.getRange(2,1,sh.getLastRow()-1,1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) { sh.deleteRow(i+2); return true; }
    }
    return false;
  } finally { lock.releaseLock(); }
}

function saveSetting(key, value){
  requireUser_();
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_('Settings');
    if (sh.getLastRow() === 0) {
      sh.getRange(1,1,1,2).setValues([['key','value']])
        .setFontWeight('bold').setBackground('#08182E').setFontColor('#F4F1E8');
      sh.setFrozenRows(1);
    }
    var keys = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues() : [];
    var payload = JSON.stringify(value);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i][0] === key) { sh.getRange(i+2,2).setValue(payload); return true; }
    }
    sh.appendRow([key, payload]);
    return true;
  } finally { lock.releaseLock(); }
}

/* ---------------- photos ---------------- */

function uploadImage(dataUrl, filename){
  requireUser_();
  var m = String(dataUrl||'').match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error('not an image');
  var folder = folder_('Striking Details photos');
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], filename || ('photo-'+Date.now()+'.jpg'));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?id=' + file.getId();
}

function folder_(name){
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/* ---------------- one-time setup helper ---------------- */

function setupSheet(){
  ['contacts','ledger','invoices'].forEach(ensureHeader_);
  saveSetting('_initialised', new Date().toISOString());
  var ss = SpreadsheetApp.getActive();
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0) ss.deleteSheet(def);
  return 'Sheet ready. Tabs: Contacts, Ledger, Invoices, Settings.';
}
