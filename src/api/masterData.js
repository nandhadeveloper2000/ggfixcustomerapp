import { masterApi } from './client';

function unwrap(list) {
  return Array.isArray(list) ? list : (list?.content ?? list?.data ?? []);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v) { return typeof v === 'string' && UUID_RE.test(v); }

// Upload an image (expo-image-picker asset) to /media/upload; returns the URL.
export async function uploadMedia(asset, folder = 'sell') {
  if (!asset?.uri) return null;
  const name = asset.fileName || asset.uri.split('/').pop() || 'upload.jpg';
  const type = asset.mimeType || (name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const res = await masterApi.upload('/media/upload', { uri: asset.uri, name, type, fields: { folder } });
  return res?.url || null;
}

// Existing
export async function getBrands() {
  return unwrap(await masterApi.get('/master/brands'));
}
export async function getModelsByBrand(brandId) {
  if (!brandId) return [];
  return unwrap(await masterApi.get(`/master/brands/${brandId}/models`));
}

/**
 * Brands mapped to a category. Accepts either the category UUID or the
 * machine-readable CODE the mobile Home tiles use.
 *
 * Returns ONLY the brands mapped to this category. We intentionally do not
 * fall back to the full brand list when a category has no mappings — that
 * surfaced unrelated brands (e.g. phone brands under Smartwatches/Audio). The
 * caller shows a "No brands mapped to this category yet" empty state instead,
 * which is the signal for the admin to add Category-Brand mappings.
 */
export async function getBrandsForCategory(categoryIdOrCode) {
  if (!categoryIdOrCode) return getBrands();
  const path = isUuid(categoryIdOrCode)
    ? `/master/categories/${categoryIdOrCode}/brands`
    : `/master/categories/by-code/${encodeURIComponent(String(categoryIdOrCode).toUpperCase())}/brands`;
  return unwrap(await masterApi.get(path).catch(() => []));
}

/**
 * Series under a (category, brand) pair. Same code/UUID handling as above.
 * Returns [] when there are no series for this pair (caller can decide to
 * skip the series step).
 */
export async function getSeriesForCategoryBrand(categoryIdOrCode, brandId) {
  if (!categoryIdOrCode || !brandId) return [];
  const path = isUuid(categoryIdOrCode)
    ? `/master/categories/${categoryIdOrCode}/brands/${brandId}/series`
    : `/master/categories/by-code/${encodeURIComponent(String(categoryIdOrCode).toUpperCase())}/brands/${brandId}/series`;
  return unwrap(await masterApi.get(path).catch(() => []));
}

/** Models under a specific series (new hierarchy). */
export async function getModelsBySeries(seriesId) {
  if (!seriesId) return [];
  return unwrap(await masterApi.get(`/master/series/${seriesId}/models`).catch(() => []));
}
export async function getRamOptions() {
  return unwrap(await masterApi.get('/master/ram-options'));
}
export async function getStorageOptions() {
  return unwrap(await masterApi.get('/master/storage-options'));
}
export async function getRepairServices() {
  return unwrap(await masterApi.get('/master/repair-services'));
}

/**
 * Issues grouped under their main category for a device category, e.g.
 *   [{ id, name, issues: [{ id, name }, ...] }, ...]
 * Used by the customer "Select Repair Service" screen (accordion + checkboxes).
 */
export async function getRepairServicesGrouped(deviceCategoryId) {
  if (!deviceCategoryId) return [];
  return unwrap(await masterApi.get('/master/repair-services/grouped', {
    query: { deviceCategoryId },
  }).catch(() => []));
}

// New: device categories, series, colors
export async function getDeviceCategories() {
  return unwrap(await masterApi.get('/master/device-categories'));
}

export async function getSeriesByBrand(brandId) {
  if (!brandId) return [];
  return unwrap(await masterApi.get(`/master/brands/${brandId}/series`));
}
export async function getColors() {
  return unwrap(await masterApi.get('/master/colors'));
}
export async function getModelVariants(modelId) {
  if (!modelId) return [];
  return unwrap(await masterApi.get(`/master/models/${modelId}/variants`));
}

// Repair categories
export async function getRepairCategories() {
  return unwrap(await masterApi.get('/master/repair-categories'));
}

// Sell Flow → Device Configuration: returns [{ id, name, code, options:[{id,value}] }, ...]
export async function getConfigFields(deviceCategoryId) {
  return unwrap(await masterApi.get('/master/config-fields', {
    query: isUuid(deviceCategoryId) ? { deviceCategoryId } : undefined,
  }));
}

// Sell flow master data — all category-aware: pass the device's category UUID
// to get that category's list (items with no category are shared/returned too).
export async function getScreeningQuestions(flow, deviceCategoryId) {
  const query = {};
  if (flow) query.flow = flow;
  if (isUuid(deviceCategoryId)) query.deviceCategoryId = deviceCategoryId;
  return unwrap(await masterApi.get('/master/screening-questions', { query: Object.keys(query).length ? query : undefined }));
}
export async function getConditionGroups(deviceCategoryId) {
  return unwrap(await masterApi.get('/master/condition-groups', {
    query: isUuid(deviceCategoryId) ? { deviceCategoryId } : undefined,
  }));
}
export async function getConditionOptions(groupId) {
  return unwrap(await masterApi.get(`/master/condition-groups/${groupId}/options`));
}
export async function getFunctionalIssues(deviceCategoryId) {
  return unwrap(await masterApi.get('/master/functional-issues', {
    query: isUuid(deviceCategoryId) ? { deviceCategoryId } : undefined,
  }));
}

// Content
export async function getBanners() {
  return unwrap(await masterApi.get('/master/banners'));
}
export async function getFaqItems() {
  return unwrap(await masterApi.get('/master/faq-items'));
}
export async function getAppContent(code) {
  if (code) return await masterApi.get(`/master/app-content/${code}`);
  return unwrap(await masterApi.get('/master/app-content'));
}
export async function getSupportContacts() {
  return unwrap(await masterApi.get('/master/support-contacts'));
}
