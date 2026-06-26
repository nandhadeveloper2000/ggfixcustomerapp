import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, Linking, PanResponder, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Search, X } from 'lucide-react-native';
import colors from '../../../theme/colors';
import { Loader, Empty } from '../../../components/ui';
import { listProducts } from '../../../api/marketplace';
import { getBrandsForCategory, getModelsByBrand } from '../../../api/masterData';
import { listNearbyShops, listShops } from '../../../api/shops';
import { useCustomerLocation } from '../../../hooks/useCustomerLocation';

// Customer-side radius for the marketplace listing. User-adjustable via the
// slider; falls back to "show all" when we can't resolve a location at all.
const RADIUS_DEFAULT = 20;
const RADIUS_MIN = 1;
const RADIUS_MAX = 50;

// Lightweight single-value slider — same pattern used on RepairPickupShops.
// No extra dependency; works on web/iOS/Android via PanResponder.
function RadiusSlider({ min, max, value, onChange }) {
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pct = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => moveTo(e.nativeEvent.locationX),
      onPanResponderMove: (e) => moveTo(e.nativeEvent.locationX),
    }),
  ).current;

  function moveTo(x) {
    const w = widthRef.current;
    if (w <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / w));
    onChangeRef.current(Math.round(min + ratio * (max - min)));
  }

  return (
    <View
      onLayout={(e) => { widthRef.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}
      style={{ height: 34, justifyContent: 'center' }}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' }} />
      <View style={{ position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: '#00008B', width: `${pct * 100}%` }} />
      <View
        style={{
          position: 'absolute',
          left: `${pct * 100}%`,
          marginLeft: -11,
          height: 22,
          width: 22,
          borderRadius: 11,
          backgroundColor: '#FFFFFF',
          borderWidth: 3,
          borderColor: '#00008B',
          shadowColor: '#0F172A',
          shadowOpacity: 0.2,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  body: { flexDirection: 'row', padding: 12 },
  thumb: {
    width: 88,
    height: 96,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaIcon: { marginRight: 6 },
  metaText: { fontSize: 12, color: '#475569', flex: 1 },
  metaStrong: { fontSize: 12, color: colors.text, fontWeight: '700' },
  price: { fontSize: 15, color: '#16A34A', fontWeight: '800', marginTop: 6 },
  distChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  distText: { color: '#15803D', fontWeight: '800', fontSize: 11, marginLeft: 3 },
  actionsRow: { flexDirection: 'row', borderTopColor: '#F1F5F9', borderTopWidth: 1 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  actionText: { marginLeft: 5, fontWeight: '700', fontSize: 12 },
  actionDivider: { width: 1, backgroundColor: '#F1F5F9' },
  categoryBar: { paddingHorizontal: 4, paddingBottom: 8 },
  categoryLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  categoryName: { fontSize: 16, color: colors.text, fontWeight: '800', marginTop: 2 },
  radiusBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  radiusText: { fontSize: 11, color: '#1E3A8A', fontWeight: '700', marginLeft: 6 },
  radiusHint: { fontSize: 11, color: '#6B7280', flex: 1, marginLeft: 6 },
  sliderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  sliderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 11, color: '#64748B', fontWeight: '800', letterSpacing: 1 },
  sliderValuePill: { backgroundColor: '#E0E7FF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  sliderValueText: { fontSize: 12, color: '#00008B', fontWeight: '800' },
  sliderEndsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sliderEndText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#0F172A', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  searchInput: {
    flex: 1, marginLeft: 8,
    paddingVertical: 10,
    fontSize: 13.5, color: '#0F172A',
  },
  searchClear: {
    height: 20, width: 20, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default function BuyListingScreen({ navigation, route }) {
  const { categoryId, categoryCode, categoryName, title } = route?.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // null = "no location resolved → show everything"; Set = "filter to these shops".
  const [nearbyShopIds, setNearbyShopIds] = useState(null);
  // Map<shopId, shop> joined into each product for name/address/distance.
  const [shopMap, setShopMap] = useState(new Map());
  const [radiusKm, setRadiusKm] = useState(RADIUS_DEFAULT);
  const [query, setQuery] = useState('');
  const { lat, lng, addressLabel } = useCustomerLocation();

  useLayoutEffect(() => {
    if (categoryName || title) {
      navigation.setOptions({ title: categoryName || title });
    }
  }, [navigation, categoryName, title]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Resolve the selected category to its set of model IDs. Brands like
        // "Apple" sell BOTH iPhones (Mobile category) and iPads (Tablet
        // category) — so we fetch all models of each brand under this
        // category, then keep only the ones whose own `categoryId` matches
        // the selected category. This works regardless of whether series
        // are set up in master data.
        let allowedModelIds = null;
        const catKey = categoryId || categoryCode;
        if (catKey) {
          const brands = await getBrandsForCategory(catKey).catch(() => []);
          const modelLists = await Promise.all(
            (brands || []).map((b) => getModelsByBrand(b.id).catch(() => [])),
          );
          const ids = new Set();
          const wantCode = categoryCode ? String(categoryCode).toUpperCase() : null;
          modelLists.flat().forEach((m) => {
            if (!m?.id) return;
            // Strict category match using whichever side we know.
            const modelCatId = m.categoryId || m.category_id;
            const modelCatCode = (m.categoryCode || m.category) || null;
            const modelCatCodeU = modelCatCode ? String(modelCatCode).toUpperCase() : null;
            const idMatch = categoryId ? modelCatId === categoryId : false;
            const codeMatch = wantCode && modelCatCodeU ? modelCatCodeU === wantCode : false;
            // Fall back to accepting models with NO category set — these are
            // legacy/unmigrated rows and would otherwise vanish from listings.
            const noCategory = !modelCatId && !modelCatCode;
            if (idMatch || codeMatch || noCategory) ids.add(m.id);
          });
          allowedModelIds = ids;
        }

        const products = await listProducts({ status: 'ACTIVE' }).catch(() => []);
        const filtered = allowedModelIds
          ? (products || []).filter((p) => p.modelId && allowedModelIds.has(p.modelId))
          : (products || []);
        if (!cancelled) setItems(filtered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, categoryCode]);

  // Resolve which shops are within RADIUS_KM, and also build a name/address
  // lookup. Nearby query gives us pre-computed distanceKm too. When the user's
  // location isn't known, we fall back to listShops() for name/address only —
  // no distance, no filter.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (lat != null && lng != null) {
          const shops = await listNearbyShops({ lat, lng, radiusKm });
          if (cancelled) return;
          const m = new Map();
          const ids = new Set();
          for (const s of shops || []) {
            if (!s?.id) continue;
            m.set(s.id, s);
            ids.add(s.id);
          }
          setShopMap(m);
          setNearbyShopIds(ids);
        } else {
          const shops = await listShops().catch(() => []);
          if (cancelled) return;
          const m = new Map();
          for (const s of shops || []) {
            if (s?.id) m.set(s.id, s);
          }
          setShopMap(m);
          setNearbyShopIds(null);
        }
      } catch (_) {
        if (!cancelled) { setShopMap(new Map()); setNearbyShopIds(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [lat, lng, radiusKm]);

  const visibleItems = useMemo(() => {
    const base = !nearbyShopIds
      ? items
      : items.filter((p) => !p.shopId || nearbyShopIds.has(p.shopId));
    // Decorate each product with shop info for the card to render.
    const decorated = base.map((p) => {
      const shop = p.shopId ? shopMap.get(p.shopId) : null;
      return {
        ...p,
        shopName: p.shopName || shop?.name || null,
        shopLocation: p.location || shop?.address || shop?.city || null,
        shopPhone: p.shopPhone || shop?.mobile || shop?.phone || null,
        distanceKm: p.distanceKm != null ? p.distanceKm : shop?.distanceKm ?? null,
      };
    });
    // Free-text filter — case-insensitive substring match against the product's
    // visible fields: title, storage, color, shop name. Empty query = all rows.
    const q = query.trim().toLowerCase();
    if (!q) return decorated;
    return decorated.filter((p) => {
      const hay = [p.title, p.storageLabel, p.color, p.shopName, p.shopLocation]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, nearbyShopIds, shopMap, query]);

  const radiusFilterActive = nearbyShopIds != null;

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {(categoryName || title) ? (
        <View style={styles.categoryBar}>
          <Text style={styles.categoryLabel}>Showing products in</Text>
          <Text style={styles.categoryName}>{categoryName || title}</Text>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <Search size={16} color="#64748B" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${(categoryName || title || 'products').toLowerCase()} (e.g. Apple 14)`}
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable
            onPress={() => setQuery('')}
            style={styles.searchClear}
            hitSlop={6}
          >
            <X size={12} color="#64748B" />
          </Pressable>
        ) : null}
      </View>

      {radiusFilterActive ? (
        <View style={styles.sliderCard}>
          <View style={styles.sliderHeaderRow}>
            <Text style={styles.sliderLabel}>NEARBY LOCATION</Text>
            <View style={styles.sliderValuePill}>
              <Text style={styles.sliderValueText}>{radiusKm} km</Text>
            </View>
          </View>
          <RadiusSlider min={RADIUS_MIN} max={RADIUS_MAX} value={radiusKm} onChange={setRadiusKm} />
          <View style={styles.sliderEndsRow}>
            <Text style={styles.sliderEndText}>{RADIUS_MIN} km</Text>
            <Text style={styles.sliderEndText}>{RADIUS_MAX} km</Text>
          </View>
          {addressLabel ? (
            <View style={[styles.radiusBar, { marginTop: 6, marginBottom: 0 }]}>
              <Ionicons name="location" size={12} color="#1E3A8A" />
              <Text style={styles.radiusHint} numberOfLines={1}>{addressLabel}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.radiusBar}>
          <Ionicons name="location-outline" size={14} color="#1E3A8A" />
          <Text style={styles.radiusHint}>Enable location to see shops near you.</Text>
        </View>
      )}

      {!visibleItems.length ? (
        <Empty text={
          query.trim()
            ? `No matches for "${query.trim()}" in ${(categoryName || 'this category').toLowerCase()}`
            : radiusFilterActive
              ? `No products within ${radiusKm} km`
              : (categoryName ? `No ${categoryName.toLowerCase()} products yet` : 'No products yet')
        } />
      ) : visibleItems.map((p) => {
        const onView = () => navigation.navigate('BuyProductDetails', { productId: p.id });
        const onCall = (e) => {
          e?.stopPropagation?.();
          if (p.shopPhone) Linking.openURL(`tel:${p.shopPhone}`);
        };
        const onMap = (e) => {
          e?.stopPropagation?.();
          const shop = p.shopId ? shopMap.get(p.shopId) : null;
          const lat = shop?.latitude;
          const lng = shop?.longitude;
          if (lat != null && lng != null) {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
          } else if (p.shopLocation) {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.shopLocation)}`);
          }
        };
        return (
        <TouchableOpacity key={p.id} style={styles.card} onPress={onView} activeOpacity={0.9}>
          <View style={styles.body}>
            <View style={styles.thumb}>
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={styles.thumbImg} resizeMode="cover" />
              ) : (
                <Ionicons name="phone-portrait-outline" size={32} color="#94A3B8" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={2}>{p.title || 'Device'}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="cube-outline" size={12} color="#64748B" style={styles.metaIcon} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {[p.storageLabel, p.color].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="storefront-outline" size={12} color="#64748B" style={styles.metaIcon} />
                <Text style={styles.metaStrong} numberOfLines={1}>
                  {p.shopName || 'Shop not linked'}
                </Text>
              </View>
              {p.shopLocation ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color="#64748B" style={styles.metaIcon} />
                  <Text style={styles.metaText} numberOfLines={1}>{p.shopLocation}</Text>
                </View>
              ) : null}
              <Text style={styles.price}>₹{Number(p.price).toLocaleString('en-IN')}</Text>
            </View>
            {p.distanceKm != null ? (
              <View style={styles.distChip}>
                <Ionicons name="navigate" size={10} color="#15803D" />
                <Text style={styles.distText}>{Number(p.distanceKm).toFixed(1)} km</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.action} onPress={onView}>
              <Ionicons name="eye-outline" color="#16A34A" size={15} />
              <Text style={[styles.actionText, { color: '#16A34A' }]}>View</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.action} onPress={onCall} disabled={!p.shopPhone}>
              <Ionicons name="call-outline" color={p.shopPhone ? '#2563EB' : '#CBD5E1'} size={15} />
              <Text style={[styles.actionText, { color: p.shopPhone ? '#2563EB' : '#CBD5E1' }]}>Call Shop</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.action} onPress={onMap}>
              <Ionicons name="location-outline" color="#F59E0B" size={15} />
              <Text style={[styles.actionText, { color: '#F59E0B' }]}>Location</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
