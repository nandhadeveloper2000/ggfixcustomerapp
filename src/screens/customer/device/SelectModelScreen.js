import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Smartphone, CheckCircle2, Pencil, X, Search, ArrowLeft } from 'lucide-react-native';
import { EmptyState, Loader } from '../../../components/rnr';
import { getModelsByBrand, getSeriesForCategoryBrand } from '../../../api/masterData';
import { resolveDeviceImageSource } from '../../../utils/images';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Combined "Select Product" screen: series chips FILTER the model grid below.
// Search is a header icon that opens a full-screen results list (no persistent
// search box). No chip → all models; pick a series → only its models.
export default function SelectModelScreen({ navigation, route }) {
  const flow = route?.params?.flow || 'PROFILE';
  const {
    categoryId, categoryCode, categoryName, deviceTypeId, deviceTypeName,
    brandId, brandName, seriesName: routeSeriesName, editSellOrderId, editHints,
  } = route?.params || {};
  const isEditing = !!editSellOrderId;
  const currentModelId = editHints?.modelId || null;

  const insets = useSafeAreaInsets();
  const [models, setModels] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selSeriesId, setSelSeriesId] = useState(
    route?.params?.seriesId || editHints?.seriesId || null,
  );

  // Header: title + a right-side search icon.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Select Product',
      headerRight: () => (
        <Pressable onPress={() => setSearchOpen(true)} hitSlop={8} style={{ paddingHorizontal: 6 }}>
          <Search size={22} color="#0F172A" />
        </Pressable>
      ),
    });
  }, [navigation]);

  // Hide the navigator header while searching so the search bar is full-screen.
  useEffect(() => {
    navigation.setOptions({ headerShown: !searchOpen });
    return () => navigation.setOptions({ headerShown: true });
  }, [navigation, searchOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [modelList, seriesList] = await Promise.all([
          getModelsByBrand(brandId),
          getSeriesForCategoryBrand(categoryId, brandId).catch(() => []),
        ]);
        if (cancelled) return;
        let ms = modelList || [];
        if (UUID_RE.test(String(categoryId || ''))) {
          ms = ms.filter((m) => !m.categoryId || m.categoryId === categoryId);
        }
        // Sell flow only offers models the admin marked "Sell Active".
        if (flow === 'SELL') ms = ms.filter((m) => m.sellActive !== false);
        setModels(ms);
        setSeries(seriesList || []);
      } catch (_) {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [brandId, categoryId]);

  const seriesWithModels = useMemo(() => {
    const ids = new Set(models.map((m) => m.seriesId).filter(Boolean));
    return (series || []).filter((s) => ids.has(s.id));
  }, [series, models]);

  const selectedSeries = seriesWithModels.find((s) => s.id === selSeriesId) || null;

  const gridModels = useMemo(() => {
    let list = selSeriesId ? models.filter((m) => m.seriesId === selSeriesId) : models;
    if (isEditing && currentModelId) {
      const cur = list.find((m) => m.id === currentModelId);
      if (cur) list = [cur, ...list.filter((m) => m.id !== currentModelId)];
    }
    return list;
  }, [models, selSeriesId, isEditing, currentModelId]);

  const searchResults = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return models;
    return models.filter((m) => (m.name || '').toLowerCase().includes(needle));
  }, [models, q]);

  const onPick = (m) => {
    const pickedSeries = (series || []).find((s) => s.id === m.seriesId);
    const baseParams = {
      flow, categoryId, categoryCode, categoryName, deviceTypeId, deviceTypeName,
      brandId, brandName,
      seriesId: m.seriesId || selSeriesId || undefined,
      seriesName: pickedSeries?.name || routeSeriesName || undefined,
      modelId: m.id, modelName: m.name,
      modelImageUrl: resolveDeviceImageSource({ url: m.imageUrl, base64: m.imageBase64 }) || undefined,
      editSellOrderId, editHints,
      ...(editSellOrderId && editHints?.modelId === m.id ? {
        ramOptionId: editHints.ramOptionId,
        storageOptionId: editHints.storageOptionId,
        color: editHints.color,
        imei: editHints.imei,
      } : {}),
    };
    if (flow === 'OWNER_LIST') {
      navigation.navigate('OwnerSellChooseSalesCategory', baseParams);
      return;
    }
    navigation.navigate('SelectVariant', baseParams);
  };

  // ── Full-screen search mode ───────────────────────────────────────────────
  if (searchOpen) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="flex-row items-center px-2 pb-2 bg-card border-b border-border"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Pressable
            onPress={() => { setSearchOpen(false); setQ(''); }}
            className="h-10 w-10 items-center justify-center"
            hitSlop={8}
          >
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <View className="flex-1 flex-row items-center rounded-xl px-3" style={{ backgroundColor: '#EEF2F6' }}>
            <Search size={18} color="#94A3B8" />
            <TextInput
              autoFocus
              value={q}
              onChangeText={setQ}
              placeholder={`Search ${brandName || 'model'}`}
              placeholderTextColor="#94A3B8"
              className="flex-1 py-2.5 ml-2 text-text text-[14px]"
              returnKeyType="search"
            />
            {q ? (
              <Pressable onPress={() => setQ('')} hitSlop={8}>
                <X size={18} color="#64748B" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
          {searchResults.length === 0 ? (
            <EmptyState
              icon={<Smartphone size={28} color="#16A34A" />}
              title="No products found"
              description={q ? `Nothing matches "${q.trim()}".` : 'Start typing to search.'}
            />
          ) : (
            searchResults.map((m) => {
              const thumb = resolveDeviceImageSource({ url: m.imageUrl, base64: m.imageBase64 });
              return (
                <Pressable
                  key={m.id}
                  onPress={() => onPick(m)}
                  className="flex-row items-center px-4 py-2.5 border-b border-border active:bg-primary/5"
                >
                  <View className="h-10 w-10 rounded-lg overflow-hidden items-center justify-center mr-3" style={{ backgroundColor: '#F1F5F9' }}>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                    ) : (
                      <Smartphone size={18} color="#16A34A" />
                    )}
                  </View>
                  <Text className="flex-1 text-[14px] text-text" numberOfLines={1}>{m.name}</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  if (loading) return <Loader label="Loading products..." />;

  // ── Normal mode ───────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      {isEditing && editHints?.modelName ? (
        <View className="bg-card border-b border-border px-4 pt-3 pb-3">
          <View className="bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 flex-row items-center">
            <Pencil size={13} color="#F59E0B" />
            <View className="flex-1 ml-2">
              <Text className="text-[10px] font-extrabold text-warning tracking-wider">EDITING ORDER</Text>
              <Text className="text-[12px] text-text font-semibold" numberOfLines={1}>
                Currently: {editHints.brandName ? `${editHints.brandName} · ` : ''}{editHints.modelName}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        {/* ── Series chips (compact) ────────────────────────────────── */}
        {seriesWithModels.length > 0 ? (
          <View className="px-1.5 mb-3">
            <Text className="text-[14px] font-extrabold text-text mb-2">Select Series</Text>
            {selectedSeries ? (
              <View className="flex-row">
                <Pressable
                  onPress={() => setSelSeriesId(null)}
                  className="rounded-xl flex-row items-center active:opacity-80"
                  style={{ paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#EEF2F6', borderWidth: 1, borderColor: '#E2E8F0' }}
                >
                  <Text className="text-[12.5px] font-bold text-text mr-2" numberOfLines={1}>{selectedSeries.name}</Text>
                  <X size={15} color="#64748B" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row flex-wrap">
                {seriesWithModels.map((s) => (
                  <View key={s.id} style={{ width: '33.333%', padding: 4 }}>
                    <Pressable
                      onPress={() => setSelSeriesId(s.id)}
                      className="rounded-xl items-center justify-center active:opacity-80"
                      style={{ minHeight: 40, paddingHorizontal: 6, paddingVertical: 8, backgroundColor: '#EEF2F6', borderWidth: 1, borderColor: '#E2E8F0' }}
                    >
                      <Text className="text-[12px] font-semibold text-text text-center" numberOfLines={2}>{s.name}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* ── Models grid ───────────────────────────────────────────── */}
        {gridModels.length === 0 ? (
          <EmptyState
            icon={<Smartphone size={28} color="#16A34A" />}
            title="No products found"
            description="No models published for this selection yet."
          />
        ) : (
          <View className="flex-row flex-wrap">
            {gridModels.map((m) => {
              const thumb = resolveDeviceImageSource({ url: m.imageUrl, base64: m.imageBase64 });
              const isCurrent = isEditing && m.id === currentModelId;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => onPick(m)}
                  className="active:opacity-80"
                  style={{ width: '33.333%', padding: 6 }}
                >
                  <View
                    className={`items-center rounded-2xl bg-card ${isCurrent ? 'border-success' : 'border-border'}`}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderWidth: isCurrent ? 2 : 1,
                      shadowColor: isCurrent ? '#10B981' : '#0F172A',
                      shadowOpacity: isCurrent ? 0.10 : 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 1,
                    }}
                  >
                    <View className="w-full rounded-2xl items-center justify-center overflow-hidden" style={{ height: 84, backgroundColor: '#F1F5F9' }}>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={{ width: '86%', height: 76 }} resizeMode="contain" />
                      ) : (
                        <Smartphone size={32} color="#16A34A" />
                      )}
                    </View>
                    <Text
                      className="text-[11px] font-extrabold text-text text-center mt-2"
                      numberOfLines={2}
                    >
                      {m.name}
                    </Text>
                    {isCurrent ? (
                      <View className="flex-row items-center mt-1">
                        <CheckCircle2 size={10} color="#10B981" />
                        <Text className="text-[9px] font-bold text-success ml-1">Current</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
