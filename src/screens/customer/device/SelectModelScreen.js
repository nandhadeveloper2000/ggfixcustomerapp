import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Smartphone, CheckCircle2, Pencil } from 'lucide-react-native';
import { EmptyState, Loader, SearchBar, SelectionCrumb } from '../../../components/rnr';
import { getModelsByBrand, getModelsBySeries } from '../../../api/masterData';
import { resolveDeviceImageSource } from '../../../utils/images';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SelectModelScreen({ navigation, route }) {
  const flow = route?.params?.flow || 'PROFILE';
  const {
    categoryId, categoryCode, categoryName, deviceTypeId, deviceTypeName,
    brandId, brandName, seriesId, seriesName, editSellOrderId, editHints,
  } = route?.params || {};
  const isEditing = !!editSellOrderId;
  const currentModelId = editHints?.modelId || null;
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let list;
        if (seriesId) {
          list = await getModelsBySeries(seriesId);
        } else {
          list = await getModelsByBrand(brandId);
          // Brand may span categories (Apple = Mobile + Laptop); keep this category.
          if (UUID_RE.test(String(categoryId || ''))) {
            list = (list || []).filter((m) => !m.categoryId || m.categoryId === categoryId);
          }
        }
        if (!cancelled) setModels(list || []);
      } catch (_) {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [brandId, seriesId, categoryId]);

  const filtered = useMemo(() => {
    let list = models;
    if (isEditing && currentModelId) {
      const current = models.find((m) => m.id === currentModelId);
      const rest = models.filter((m) => m.id !== currentModelId);
      list = current ? [current, ...rest] : models;
    }
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((m) => (m.name || '').toLowerCase().includes(needle));
  }, [models, q, isEditing, currentModelId]);

  const onPick = (m) => {
    const baseParams = {
      flow, categoryId, categoryCode, categoryName, deviceTypeId, deviceTypeName,
      brandId, brandName, seriesId, seriesName, modelId: m.id, modelName: m.name,
      modelImageUrl: resolveDeviceImageSource({ url: m.imageUrl, base64: m.imageBase64 }) || undefined,
      editSellOrderId, editHints,
      // Pre-seed the variant page with the order's existing color/RAM/storage/IMEI,
      // but only when the customer kept the same model. Picking a different
      // model means the old variant codes won't apply.
      ...(editSellOrderId && editHints?.modelId === m.id ? {
        ramOptionId: editHints.ramOptionId,
        storageOptionId: editHints.storageOptionId,
        color: editHints.color,
        imei: editHints.imei,
      } : {}),
    };
    // Owner marketplace listing: insert a category/spare-parts choice between
    // model selection and the variant (colour/storage) step.
    if (flow === 'OWNER_LIST') {
      navigation.navigate('OwnerSellChooseSalesCategory', baseParams);
      return;
    }
    navigation.navigate('SelectVariant', baseParams);
  };

  const crumbs = [{ label: 'Brand', value: brandName }];
  if (seriesName) crumbs.push({ label: 'Series', value: seriesName });

  if (loading) return <Loader label="Loading models..." />;

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card border-b border-border px-4 pt-3 pb-3">
        <SelectionCrumb items={crumbs} className="mb-3" />
        {isEditing && editHints?.modelName ? (
          <View className="bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 mb-3 flex-row items-center">
            <Pencil size={13} color="#F59E0B" />
            <View className="flex-1 ml-2">
              <Text className="text-[10px] font-extrabold text-warning tracking-wider">EDITING ORDER</Text>
              <Text className="text-[12px] text-text font-semibold" numberOfLines={1}>
                Currently: {editHints.brandName ? `${editHints.brandName} · ` : ''}{editHints.modelName}
              </Text>
            </View>
          </View>
        ) : null}
        <SearchBar value={q} onChangeText={setQ} placeholder="Search model" onClear={() => setQ('')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Smartphone size={28} color="#16A34A" />}
            title="No models found"
            description={q ? 'Try a different keyword.' : 'No models published for this selection yet.'}
          />
        ) : (
          // 3-column grid — matches SelectBrand / SelectSeries / Home rhythm.
          // Subtitle (series / slug) renders as a small muted second line so
          // variant detail still shows. No chevron arrow.
          <View className="flex-row flex-wrap">
            {filtered.map((m) => {
              const thumb = resolveDeviceImageSource({ url: m.imageUrl, base64: m.imageBase64 });
              const sub = m.subtitle || m.seriesName || m.slug;
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
                      paddingVertical: 14,
                      paddingHorizontal: 8,
                      borderWidth: isCurrent ? 2 : 1,
                      shadowColor: isCurrent ? '#10B981' : '#0F172A',
                      shadowOpacity: isCurrent ? 0.10 : 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 1,
                    }}
                  >
                    <View className="h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center overflow-hidden">
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={{ width: 56, height: 56 }} resizeMode="cover" />
                      ) : (
                        <Smartphone size={24} color="#16A34A" />
                      )}
                    </View>
                    <Text
                      className="text-[12px] font-extrabold text-text text-center mt-2"
                      numberOfLines={1}
                    >
                      {m.name}
                    </Text>
                    {isCurrent ? (
                      <View className="flex-row items-center mt-1">
                        <CheckCircle2 size={10} color="#10B981" />
                        <Text className="text-[9px] font-bold text-success ml-1">Current</Text>
                      </View>
                    ) : sub ? (
                      <Text
                        className="text-[10px] text-text-muted text-center mt-0.5"
                        numberOfLines={1}
                      >
                        {sub}
                      </Text>
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
