/**
 * Rayvive — Orders backend
 * =============================================================================
 * Deployed as a Google Apps Script Web App. This is the ONLY trusted layer in
 * the system: the website is static (GitHub Pages), so nothing in the browser
 * can be trusted with prices, order creation or admin access.
 *
 * Responsibilities:
 *   1. Recalculate every order total server-side (browser totals are ignored).
 *   2. Write orders into the Orders / Order Items sheets.
 *   3. Authenticate the admin dashboard and serve order data only to it.
 *
 * SETUP: see docs/ORDERS_SETUP.md. Two Script Properties are required:
 *   ADMIN_PASSWORD  — the password used to log in at /orders
 *   SESSION_SECRET  — a long random string used to sign admin session tokens
 * =============================================================================
 */

/* -------------------------------------------------------------------------- */
/* Catalog — the authoritative price list                                      */
/* -------------------------------------------------------------------------- */

/**
 * IMPORTANT — KEEP IN SYNC WITH src/data/products.json
 *
 * The server cannot trust prices sent by the browser, so it needs its own copy.
 * When you change a price, change it in BOTH places. A mismatch is logged as a
 * warning and the price below always wins.
 */
var PRODUCTS = {
  'nova-white':    { name: 'Nova White',    price: 16.99, available: true },
  'flare':         { name: 'Flare',         price: 16.99, available: true },
  'umbra':         { name: 'Umbra',         price: 16.99, available: true },
  'aether':        { name: 'Aether',        price: 19.99, available: false },
  'nocturne':      { name: 'Nocturne',      price: 19.99, available: true },
  'vesper':        { name: 'Vesper',        price: 19.99, available: true },
  'combo-package': {
    name: 'Combo Package',
    price: 33.99,
    available: true,
    variantGroups: {
      speed:  ['nova-white', 'flare', 'umbra'],
      beaded: ['nocturne', 'vesper']
    }
  }
};

/** Display labels for variant ids, used when writing the Variant column. */
var VARIANT_LABELS = {
  'nova-white': 'Nova White',
  'flare': 'Flare',
  'umbra': 'Umbra',
  'nocturne': 'Nocturne',
  'vesper': 'Vesper'
};

/* -------------------------------------------------------------------------- */
/* Shipping — mirrors src/lib/shipping.ts                                      */
/* -------------------------------------------------------------------------- */

var SHIPPING_ZONES = { 'beirut': 4, 'outside-beirut': 5 };

var CITY_ZONES = {
  'beirut': 'beirut',
  'mount-lebanon': 'outside-beirut',
  'north-lebanon': 'outside-beirut',
  'akkar': 'outside-beirut',
  'bekaa': 'outside-beirut',
  'baalbek-hermel': 'outside-beirut',
  'south-lebanon': 'outside-beirut',
  'nabatieh': 'outside-beirut'
};

var CITY_LABELS = {
  'beirut': 'Beirut',
  'mount-lebanon': 'Mount Lebanon',
  'north-lebanon': 'North Lebanon',
  'akkar': 'Akkar',
  'bekaa': 'Bekaa',
  'baalbek-hermel': 'Baalbek-Hermel',
  'south-lebanon': 'South Lebanon',
  'nabatieh': 'Nabatieh'
};

/** null = no free-shipping offer. Mirrors FREE_SHIPPING_THRESHOLD. */
var FREE_SHIPPING_THRESHOLD = null;

var CURRENCY = 'USD';
var MAX_QUANTITY_PER_LINE = 10;
var MAX_ITEMS_PER_ORDER = 20;

var ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
var PAYMENT_STATUSES = ['COD', 'Pending', 'Paid', 'Failed'];

var PAYMENT_METHODS = {
  'cod': { label: 'Cash on Delivery', initialStatus: 'COD' }
};

/* -------------------------------------------------------------------------- */
/* Sheet definitions                                                           */
/* -------------------------------------------------------------------------- */

var ORDERS_SHEET = 'Orders';
var ITEMS_SHEET = 'Order Items';

var ORDER_HEADERS = [
  'Order ID', 'Order Date', 'Order Status', 'Payment Status', 'Payment Method',
  'First Name', 'Last Name', 'Full Name', 'Email', 'Phone',
  'Country', 'City', 'Area', 'Address', 'Building', 'Delivery Notes',
  'Items Summary', 'Item Count',
  'Subtotal', 'Shipping', 'Total', 'Currency',
  'Meta Event ID', 'Source',
  'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term',
  'Landing Page', 'Referrer', 'FBCLID', 'FBP',
  'Client Request Id', 'Created At'
];

var ITEM_HEADERS = [
  'Order ID', 'Product ID', 'Product Name', 'Variant',
  'Quantity', 'Unit Price', 'Line Total'
];

/* -------------------------------------------------------------------------- */
/* HTTP entry points                                                           */
/* -------------------------------------------------------------------------- */

/** Health check so you can confirm the deployment in a browser. */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'ping') {
    return jsonResponse({ ok: true, service: 'rayvive-orders', time: new Date().toISOString() });
  }
  return jsonResponse({
    ok: true,
    service: 'rayvive-orders',
    message: 'This endpoint accepts POST requests. Deployment is live.'
  });
}

/**
 * All client calls arrive here as POST with Content-Type: text/plain.
 *
 * text/plain is deliberate — it is a CORS-safelisted content type, so the
 * browser skips the OPTIONS preflight that Apps Script cannot answer. The body
 * is still JSON and still arrives in e.postData.contents.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'EMPTY_REQUEST', message: 'No request body received.' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    switch (action) {
      case 'createOrder':       return handleCreateOrder(payload);
      case 'login':             return handleLogin(payload);
      case 'listOrders':        return handleListOrders(payload);
      case 'getOrder':          return handleGetOrder(payload);
      case 'updateOrderStatus': return handleUpdateOrderStatus(payload);
      case 'setup':             return handleSetup();
      default:
        return jsonResponse({ ok: false, error: 'UNKNOWN_ACTION', message: 'Unknown action: ' + action });
    }
  } catch (err) {
    // Log full detail server-side; return a generic message so internal
    // structure and customer data never leak to the browser.
    console.error('doPost failed: ' + err + ' | stack: ' + (err && err.stack));
    return jsonResponse({ ok: false, error: 'SERVER_ERROR', message: 'The server could not process this request.' });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* -------------------------------------------------------------------------- */
/* Sheet helpers                                                               */
/* -------------------------------------------------------------------------- */

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Returns the sheet, creating it with a frozen header row if absent. */
function ensureSheet(name, headers) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Maps header name -> zero-based column index by reading the actual header row.
 * Looking columns up by name means inserting or reordering a column in the
 * sheet does not break the script.
 */
function headerIndex(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var index = {};
  for (var i = 0; i < headers.length; i++) {
    index[String(headers[i]).trim()] = i;
  }
  return index;
}

function handleSetup() {
  ensureSheet(ORDERS_SHEET, ORDER_HEADERS);
  ensureSheet(ITEMS_SHEET, ITEM_HEADERS);
  return jsonResponse({ ok: true, message: 'Sheets ready: ' + ORDERS_SHEET + ', ' + ITEMS_SHEET });
}

/* -------------------------------------------------------------------------- */
/* Validation helpers                                                          */
/* -------------------------------------------------------------------------- */

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function cleanString(value, maxLength) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength || 300);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Lebanese numbers, with or without country code. Digits only after cleanup. */
function isValidPhone(phone) {
  var digits = String(phone).replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/* -------------------------------------------------------------------------- */
/* Order creation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Validates the cart against the server catalog and recomputes every figure.
 * Anything the browser claimed about price or total is discarded here.
 */
function buildValidatedItems(rawItems) {
  if (!rawItems || !rawItems.length) {
    return { error: 'EMPTY_CART', message: 'Your cart is empty.' };
  }
  if (rawItems.length > MAX_ITEMS_PER_ORDER) {
    return { error: 'TOO_MANY_ITEMS', message: 'An order can contain at most ' + MAX_ITEMS_PER_ORDER + ' different items.' };
  }

  var items = [];

  for (var i = 0; i < rawItems.length; i++) {
    var raw = rawItems[i];
    var productId = cleanString(raw.productId, 60);
    var product = PRODUCTS[productId];

    if (!product) {
      return { error: 'UNKNOWN_PRODUCT', message: 'This product is no longer available: ' + productId };
    }
    if (!product.available) {
      return { error: 'PRODUCT_UNAVAILABLE', message: product.name + ' is sold out and cannot be ordered.' };
    }

    var quantity = Number(raw.quantity);
    if (!isFinite(quantity) || Math.floor(quantity) !== quantity || quantity < 1) {
      return { error: 'INVALID_QUANTITY', message: 'Invalid quantity for ' + product.name + '.' };
    }
    if (quantity > MAX_QUANTITY_PER_LINE) {
      return { error: 'QUANTITY_TOO_HIGH', message: 'You can order at most ' + MAX_QUANTITY_PER_LINE + ' of ' + product.name + '.' };
    }

    // Variants must be present and drawn from the allowed set for this product.
    var variantLabel = '';
    if (product.variantGroups) {
      var chosen = raw.variant || {};
      var labels = [];

      for (var groupId in product.variantGroups) {
        if (!product.variantGroups.hasOwnProperty(groupId)) continue;
        var allowed = product.variantGroups[groupId];
        var picked = cleanString(chosen[groupId], 60);

        if (!picked || allowed.indexOf(picked) === -1) {
          return {
            error: 'INVALID_VARIANT',
            message: 'Please choose a valid option for ' + product.name + ' (' + groupId + ').'
          };
        }
        labels.push(VARIANT_LABELS[picked] || picked);
      }
      variantLabel = labels.join(' + ');
    }

    // Warn if the browser's idea of the price drifted from ours.
    if (raw.unitPrice !== undefined && round2(Number(raw.unitPrice)) !== round2(product.price)) {
      console.warn('Price mismatch for ' + productId + ': client sent ' + raw.unitPrice + ', server has ' + product.price);
    }

    items.push({
      productId: productId,
      name: product.name,
      variant: variantLabel,
      quantity: quantity,
      unitPrice: round2(product.price),
      lineTotal: round2(product.price * quantity)
    });
  }

  return { items: items };
}

/** Server-side totals. Mirrors calculateTotals() in src/lib/shipping.ts. */
function calculateTotals(items, cityId) {
  var subtotal = 0;
  for (var i = 0; i < items.length; i++) {
    subtotal += items[i].lineTotal;
  }
  subtotal = round2(subtotal);

  var zone = CITY_ZONES[cityId];
  var shipping = SHIPPING_ZONES[zone];

  if (FREE_SHIPPING_THRESHOLD !== null && subtotal >= FREE_SHIPPING_THRESHOLD) {
    shipping = 0;
  }

  return {
    subtotal: subtotal,
    shipping: round2(shipping),
    total: round2(subtotal + shipping),
    currency: CURRENCY
  };
}

/**
 * Sequential, human-readable and collision-free: RV-20260822-0001.
 * The counter lives in Script Properties and is only ever touched while the
 * document lock is held, so two simultaneous checkouts cannot collide.
 */
function generateOrderId() {
  var props = PropertiesService.getScriptProperties();
  var seq = Number(props.getProperty('ORDER_SEQ') || '0') + 1;
  props.setProperty('ORDER_SEQ', String(seq));

  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  var padded = ('0000' + seq).slice(-4);
  return 'RV-' + stamp + '-' + padded;
}

/** Finds an existing order created by the same checkout attempt, if any. */
function findOrderByClientRequestId(sheet, clientRequestId) {
  if (!clientRequestId) return null;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var idx = headerIndex(sheet);
  var reqCol = idx['Client Request Id'];
  if (reqCol === undefined) return null;

  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][reqCol]) === clientRequestId) {
      return rowToOrder(values[i], idx);
    }
  }
  return null;
}

function handleCreateOrder(payload) {
  var customer = payload.customer || {};
  var shippingInfo = payload.shipping || {};

  // --- Required field validation -------------------------------------------
  var firstName = cleanString(customer.firstName, 80);
  var lastName = cleanString(customer.lastName, 80);
  var email = cleanString(customer.email, 200);
  var phone = cleanString(customer.phone, 40);
  var cityId = cleanString(shippingInfo.city, 60);
  var area = cleanString(shippingInfo.area, 160);
  var address = cleanString(shippingInfo.address, 400);

  var fieldErrors = {};
  if (!firstName) fieldErrors.firstName = 'First name is required.';
  if (!lastName) fieldErrors.lastName = 'Last name is required.';
  if (!phone || !isValidPhone(phone)) fieldErrors.phone = 'A valid phone number is required.';
  if (email && !isValidEmail(email)) fieldErrors.email = 'Please enter a valid email address.';
  if (!cityId || !CITY_ZONES[cityId]) fieldErrors.city = 'Please choose a delivery city.';
  if (!area) fieldErrors.area = 'Area is required.';
  if (!address) fieldErrors.address = 'Address is required.';

  var paymentMethodId = cleanString(payload.paymentMethod, 40) || 'cod';
  var paymentMethod = PAYMENT_METHODS[paymentMethodId];
  if (!paymentMethod) fieldErrors.paymentMethod = 'Please choose a payment method.';

  for (var key in fieldErrors) {
    if (fieldErrors.hasOwnProperty(key)) {
      return jsonResponse({
        ok: false,
        error: 'VALIDATION_FAILED',
        message: 'Please check the highlighted fields.',
        fieldErrors: fieldErrors
      });
    }
  }

  // --- Cart validation and authoritative pricing ---------------------------
  var built = buildValidatedItems(payload.items);
  if (built.error) {
    return jsonResponse({ ok: false, error: built.error, message: built.message });
  }

  var items = built.items;
  var totals = calculateTotals(items, cityId);
  var clientRequestId = cleanString(payload.clientRequestId, 80);

  // --- Write, serialised so a double-click cannot double-insert ------------
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lockErr) {
    return jsonResponse({ ok: false, error: 'BUSY', message: 'The server is busy. Please try again in a moment.' });
  }

  try {
    var ordersSheet = ensureSheet(ORDERS_SHEET, ORDER_HEADERS);
    var itemsSheet = ensureSheet(ITEMS_SHEET, ITEM_HEADERS);

    // Idempotency: same checkout attempt returns the original order untouched.
    var existing = findOrderByClientRequestId(ordersSheet, clientRequestId);
    if (existing) {
      existing.items = readItemsFor([existing.orderId])[existing.orderId] || [];
      return jsonResponse({
        ok: true,
        duplicate: true,
        order: existing,
        orderId: existing.orderId
      });
    }

    var orderId = generateOrderId();
    var now = new Date();
    var attribution = payload.attribution || {};

    var itemsSummary = items.map(function (item) {
      return item.name + (item.variant ? ' (' + item.variant + ')' : '') + ' x' + item.quantity;
    }).join('; ');

    var itemCount = items.reduce(function (sum, item) { return sum + item.quantity; }, 0);

    var record = {
      'Order ID': orderId,
      'Order Date': now,
      'Order Status': 'Pending',
      'Payment Status': paymentMethod.initialStatus,
      'Payment Method': paymentMethod.label,
      'First Name': firstName,
      'Last Name': lastName,
      'Full Name': firstName + ' ' + lastName,
      'Email': email,
      'Phone': phone,
      'Country': 'Lebanon',
      'City': CITY_LABELS[cityId] || cityId,
      'Area': area,
      'Address': address,
      'Building': cleanString(shippingInfo.building, 200),
      'Delivery Notes': cleanString(shippingInfo.notes, 500),
      'Items Summary': itemsSummary,
      'Item Count': itemCount,
      'Subtotal': totals.subtotal,
      'Shipping': totals.shipping,
      'Total': totals.total,
      'Currency': totals.currency,
      'Meta Event ID': orderId,
      'Source': cleanString(attribution.source, 120) || 'direct',
      'UTM Source': cleanString(attribution.utmSource, 120),
      'UTM Medium': cleanString(attribution.utmMedium, 120),
      'UTM Campaign': cleanString(attribution.utmCampaign, 200),
      'UTM Content': cleanString(attribution.utmContent, 200),
      'UTM Term': cleanString(attribution.utmTerm, 200),
      'Landing Page': cleanString(attribution.landingPage, 500),
      'Referrer': cleanString(attribution.referrer, 500),
      'FBCLID': cleanString(attribution.fbclid, 300),
      'FBP': cleanString(attribution.fbp, 300),
      'Client Request Id': clientRequestId,
      'Created At': now.toISOString()
    };

    var idx = headerIndex(ordersSheet);
    var row = [];
    for (var h = 0; h < ordersSheet.getLastColumn(); h++) row.push('');
    for (var name in record) {
      if (record.hasOwnProperty(name) && idx[name] !== undefined) {
        row[idx[name]] = record[name];
      }
    }
    ordersSheet.appendRow(row);

    var itemRows = items.map(function (item) {
      return [orderId, item.productId, item.name, item.variant, item.quantity, item.unitPrice, item.lineTotal];
    });
    itemsSheet.getRange(itemsSheet.getLastRow() + 1, 1, itemRows.length, ITEM_HEADERS.length).setValues(itemRows);

    // Flush before responding: the customer must not see "success" until the
    // rows are actually committed to the spreadsheet.
    SpreadsheetApp.flush();

    return jsonResponse({
      ok: true,
      orderId: orderId,
      order: {
        orderId: orderId,
        orderDate: now.toISOString(),
        orderStatus: 'Pending',
        paymentStatus: paymentMethod.initialStatus,
        paymentMethod: paymentMethod.label,
        customer: {
          firstName: firstName,
          lastName: lastName,
          fullName: firstName + ' ' + lastName,
          email: email,
          phone: phone
        },
        shipping: {
          country: 'Lebanon',
          city: CITY_LABELS[cityId] || cityId,
          area: area,
          address: address,
          building: record['Building'],
          notes: record['Delivery Notes']
        },
        items: items,
        subtotal: totals.subtotal,
        shippingFee: totals.shipping,
        total: totals.total,
        currency: totals.currency
      }
    });
  } finally {
    lock.releaseLock();
  }
}

/* -------------------------------------------------------------------------- */
/* Admin authentication                                                        */
/* -------------------------------------------------------------------------- */

var SESSION_TTL_MS = 12 * 60 * 60 * 1000;  // 12 hours
var MAX_LOGIN_FAILURES = 10;
var LOGIN_LOCKOUT_SECONDS = 900;           // 15 minutes

function base64url(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function sign(data, secret) {
  return base64url(Utilities.computeHmacSha256Signature(data, secret));
}

/** Length-independent comparison, so timing does not reveal the secret. */
function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function getSecret(name) {
  var value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) {
    throw new Error('Missing Script Property: ' + name + '. See docs/ORDERS_SETUP.md.');
  }
  return value;
}

function issueToken() {
  var payload = JSON.stringify({ sub: 'admin', exp: Date.now() + SESSION_TTL_MS });
  var payloadB64 = base64url(Utilities.newBlob(payload).getBytes());
  return payloadB64 + '.' + sign(payloadB64, getSecret('SESSION_SECRET'));
}

/** True only for a token this script signed that has not expired. */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;

  var parts = token.split('.');
  if (parts.length !== 2) return false;

  var expected;
  try {
    expected = sign(parts[0], getSecret('SESSION_SECRET'));
  } catch (err) {
    console.error(err);
    return false;
  }

  if (!constantTimeEquals(parts[1], expected)) return false;

  try {
    var payload = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()
    );
    return payload.sub === 'admin' && Number(payload.exp) > Date.now();
  } catch (err) {
    return false;
  }
}

/** Wraps an admin handler, rejecting anything without a valid session. */
function requireAuth(payload, handler) {
  if (!verifyToken(payload.token)) {
    return jsonResponse({ ok: false, error: 'UNAUTHORIZED', message: 'Your session has expired. Please log in again.' });
  }
  return handler();
}

function handleLogin(payload) {
  var cache = CacheService.getScriptCache();
  var failures = Number(cache.get('login_failures') || '0');

  if (failures >= MAX_LOGIN_FAILURES) {
    return jsonResponse({
      ok: false,
      error: 'RATE_LIMITED',
      message: 'Too many failed attempts. Please wait 15 minutes and try again.'
    });
  }

  var supplied = String(payload.password || '');
  var expected;
  try {
    expected = getSecret('ADMIN_PASSWORD');
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, error: 'NOT_CONFIGURED', message: 'Admin access is not configured on the server.' });
  }

  if (!constantTimeEquals(supplied, expected)) {
    cache.put('login_failures', String(failures + 1), LOGIN_LOCKOUT_SECONDS);
    return jsonResponse({ ok: false, error: 'INVALID_CREDENTIALS', message: 'Incorrect password.' });
  }

  cache.remove('login_failures');
  return jsonResponse({ ok: true, token: issueToken(), expiresIn: SESSION_TTL_MS });
}

/* -------------------------------------------------------------------------- */
/* Admin data access                                                           */
/* -------------------------------------------------------------------------- */

function toIso(value) {
  if (value instanceof Date) return value.toISOString();
  return value ? String(value) : '';
}

function rowToOrder(row, idx) {
  function get(name) {
    return idx[name] !== undefined ? row[idx[name]] : '';
  }
  return {
    orderId: String(get('Order ID')),
    orderDate: toIso(get('Order Date')),
    orderStatus: String(get('Order Status') || 'Pending'),
    paymentStatus: String(get('Payment Status') || ''),
    paymentMethod: String(get('Payment Method') || ''),
    customer: {
      firstName: String(get('First Name') || ''),
      lastName: String(get('Last Name') || ''),
      fullName: String(get('Full Name') || ''),
      email: String(get('Email') || ''),
      phone: String(get('Phone') || '')
    },
    shipping: {
      country: String(get('Country') || ''),
      city: String(get('City') || ''),
      area: String(get('Area') || ''),
      address: String(get('Address') || ''),
      building: String(get('Building') || ''),
      notes: String(get('Delivery Notes') || '')
    },
    itemsSummary: String(get('Items Summary') || ''),
    itemCount: Number(get('Item Count') || 0),
    subtotal: Number(get('Subtotal') || 0),
    shippingFee: Number(get('Shipping') || 0),
    total: Number(get('Total') || 0),
    currency: String(get('Currency') || CURRENCY),
    source: String(get('Source') || ''),
    utmSource: String(get('UTM Source') || ''),
    utmMedium: String(get('UTM Medium') || ''),
    utmCampaign: String(get('UTM Campaign') || ''),
    utmContent: String(get('UTM Content') || ''),
    utmTerm: String(get('UTM Term') || ''),
    landingPage: String(get('Landing Page') || ''),
    referrer: String(get('Referrer') || ''),
    createdAt: toIso(get('Created At'))
  };
}

function readAllOrders() {
  var sheet = ensureSheet(ORDERS_SHEET, ORDER_HEADERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var idx = headerIndex(sheet);
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  return values
    .filter(function (row) { return String(row[idx['Order ID']] || '').length > 0; })
    .map(function (row) { return rowToOrder(row, idx); });
}

function readItemsFor(orderIds) {
  var sheet = ensureSheet(ITEMS_SHEET, ITEM_HEADERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  var idx = headerIndex(sheet);
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  var wanted = null;
  if (orderIds) {
    wanted = {};
    orderIds.forEach(function (id) { wanted[id] = true; });
  }

  var grouped = {};
  values.forEach(function (row) {
    var orderId = String(row[idx['Order ID']] || '');
    if (!orderId) return;
    if (wanted && !wanted[orderId]) return;

    if (!grouped[orderId]) grouped[orderId] = [];
    grouped[orderId].push({
      productId: String(row[idx['Product ID']] || ''),
      name: String(row[idx['Product Name']] || ''),
      variant: String(row[idx['Variant']] || ''),
      quantity: Number(row[idx['Quantity']] || 0),
      unitPrice: Number(row[idx['Unit Price']] || 0),
      lineTotal: Number(row[idx['Line Total']] || 0)
    });
  });

  return grouped;
}

function handleListOrders(payload) {
  return requireAuth(payload, function () {
    var orders = readAllOrders();
    // Newest first; the dashboard re-sorts client-side from here.
    orders.reverse();
    return jsonResponse({
      ok: true,
      orders: orders,
      statuses: ORDER_STATUSES,
      paymentStatuses: PAYMENT_STATUSES
    });
  });
}

function handleGetOrder(payload) {
  return requireAuth(payload, function () {
    var orderId = cleanString(payload.orderId, 60);
    var matches = readAllOrders().filter(function (o) { return o.orderId === orderId; });

    if (!matches.length) {
      return jsonResponse({ ok: false, error: 'NOT_FOUND', message: 'Order not found.' });
    }

    var order = matches[0];
    order.items = readItemsFor([orderId])[orderId] || [];
    return jsonResponse({ ok: true, order: order });
  });
}

function handleUpdateOrderStatus(payload) {
  return requireAuth(payload, function () {
    var orderId = cleanString(payload.orderId, 60);
    var newStatus = cleanString(payload.orderStatus, 40);
    var newPaymentStatus = cleanString(payload.paymentStatus, 40);

    if (newStatus && ORDER_STATUSES.indexOf(newStatus) === -1) {
      return jsonResponse({ ok: false, error: 'INVALID_STATUS', message: 'Unknown order status.' });
    }
    if (newPaymentStatus && PAYMENT_STATUSES.indexOf(newPaymentStatus) === -1) {
      return jsonResponse({ ok: false, error: 'INVALID_STATUS', message: 'Unknown payment status.' });
    }

    var sheet = ensureSheet(ORDERS_SHEET, ORDER_HEADERS);
    var idx = headerIndex(sheet);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return jsonResponse({ ok: false, error: 'NOT_FOUND', message: 'Order not found.' });
    }

    var ids = sheet.getRange(2, idx['Order ID'] + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === orderId) {
        var rowNumber = i + 2;
        if (newStatus) sheet.getRange(rowNumber, idx['Order Status'] + 1).setValue(newStatus);
        if (newPaymentStatus) sheet.getRange(rowNumber, idx['Payment Status'] + 1).setValue(newPaymentStatus);
        SpreadsheetApp.flush();
        return jsonResponse({
          ok: true,
          orderId: orderId,
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus
        });
      }
    }

    return jsonResponse({ ok: false, error: 'NOT_FOUND', message: 'Order not found.' });
  });
}

/* -------------------------------------------------------------------------- */
/* One-off helper — run from the Apps Script editor                            */
/* -------------------------------------------------------------------------- */

/**
 * Run this once from the editor (Run > setupSheets) to create both sheets
 * with their headers, and to trigger the authorization prompt.
 */
function setupSheets() {
  ensureSheet(ORDERS_SHEET, ORDER_HEADERS);
  ensureSheet(ITEMS_SHEET, ITEM_HEADERS);
  Logger.log('Created/verified sheets: ' + ORDERS_SHEET + ', ' + ITEMS_SHEET);
}
