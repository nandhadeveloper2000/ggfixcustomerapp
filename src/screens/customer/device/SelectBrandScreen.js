import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { CheckCircle2, Pencil } from 'lucide-react-native';
import { EmptyState, Loader, SearchBar, SelectionCrumb } from '../../../components/rnr';
import { getBrandsForCategory } from '../../../api/masterData';

const BRAND_PALETTES = [
  { bg: 'bg-primary/10',   text: 'text-primary' },
  { bg: 'bg-secondary/10', text: 'text-secondary' },
  { bg: 'bg-success/10',   text: 'text-success' },
  { bg: 'bg-warning/10',   text: 'text-warning' },
  { bg: 'bg-danger/10',    text: 'text-danger' },
  { bg: 'bg-info/10',      text: 'text-info' },
];
function paletteFor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return BRAND_PALETTES[h % BRAND_PALETTES.length];
}

export default function SelectBrandScreen({ navigation, route }) {
  const flow = route?.params?.flow || 'PROFILE';
  const {
    categoryId, categoryCode, categoryName, deviceTypeId, deviceTypeName,
    editSellOrderId, editHints,
  } = route?.params || {};
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const isEditing = !!editSellOrderId;
  const currentBrandId = editHints?.brandId || null;

  useEffect(() => {
    (async () => {
      try { setBrands(await getBrandsForCategory(categoryId)); } catch (_) {}
      setLoading(false);
    })();
  }, [categoryId]);

  const filtered = useMemo(() => {
    let list = brands;
    // While editing, surface the current brand at the top of the list so the
    // customer can confirm or change it without scrolling.
    if (isEditing && currentBrandId) {
      const current = brands.find((b) => b.id === currentBrandId);
      const rest = brands.filter((b) => b.id !== currentBrandId);
      list = current ? [current, ...rest] : brands;
    }
    if (!q.trim()) return list;
    return list.filter((b) => (b.name || '').toLowerCase().includes(q.toLowerCase()));
  }, [brands, q, isEditing, currentBrandId]);

  const onPick = (b) => navigation.navigate('SelectSeries', {
    flow, categoryId, categoryCode, categoryName, deviceTypeId, deviceTypeName,
    brandId: b.id, brandName: b.name,
    editSellOrderId, editHints,
  });

  const crumbs = [{ label: 'Category', value: categoryName }];
  if (deviceTypeName) crumbs.push({ label: 'Device', value: deviceTypeName });

  if (loading) return <Loader label="Loading brands..." />;

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
        <SearchBar value={q} onChangeText={setQ} placeholder="Search brand" onClear={() => setQ('')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No brands found"
            description={q ? `We don't recognize "${q}".` : 'No brands mapped to this category yet.'}
          />
        ) : (
          // 3-column grid — matches the Home "What are you looking for?"
          // rhythm. Each tile shows the brand logo (or initial pill) above the
          // name. Tap → SelectSeries with the same payload the list version
          // forwarded. No chevron arrow per the customer-facing redesign.
          <View className="flex-row flex-wrap">
            {filtered.map((b) => {
              const palette = paletteFor(b.name);
              const initial = (b.name || '?').slice(0, 1).toUpperCase();
              const logo = b.imageUrl || b.imageBase64;
              const isCurrent = isEditing && b.id === currentBrandId;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => onPick(b)}
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
                    {/* App-icon style: the logo fills the rounded tile so each
                        brand's own artwork (incl. the dark logos that ship on a
                        black background) reads as a clean icon instead of a
                        black square floating on a white box. */}
                    <View className="h-14 w-14 rounded-2xl items-center justify-center overflow-hidden border border-border">
                      {logo ? (
                        <Image source={{ uri: logo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View className={`h-14 w-14 items-center justify-center ${palette.bg}`}>
                          <Text className={`text-[20px] font-extrabold ${palette.text}`}>{initial}</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-[12px] font-extrabold text-text text-center mt-2"
                      numberOfLines={1}
                    >
                      {b.name}
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
