import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import {
  Smartphone, Wrench, Search, Check, Plus, Minus,
  Volume2, Zap, Aperture, Wifi, Cpu, Droplets, LayoutGrid,
} from 'lucide-react-native';
import {
  BottomActionBar, EmptyState, Loader, Badge,
} from '../../../components/rnr';
import { getRepairServicesGrouped, getDeviceCategories } from '../../../api/masterData';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fallback icon per main category (used when an issue has no uploaded icon).
function iconForGroup(code, name) {
  const s = `${code || ''} ${name || ''}`.toUpperCase();
  if (/AUDIO|MIC|SPEAKER|SOUND|RINGTONE/.test(s)) return Volume2;
  if (/DISPLAY|TOUCH|SCREEN|GLASS/.test(s)) return Smartphone;
  if (/POWER|CHARG|BATTERY/.test(s)) return Zap;
  if (/CAMERA|FLASH|LENS/.test(s)) return Aperture;
  if (/NETWORK|SIM|WIFI|SIGNAL|BLUETOOTH|HOTSPOT/.test(s)) return Wifi;
  if (/SOFTWARE|HANG|SLOW|UNLOCK|OS|FLASH|BACKUP/.test(s)) return Cpu;
  if (/WATER|LIQUID/.test(s)) return Droplets;
  if (/BODY|BUTTON|FINGERPRINT|PANEL|FRAME|VIBRATION/.test(s)) return LayoutGrid;
  return Wrench;
}

function imgUri(item) {
  const b64 = item?.iconBase64 && String(item.iconBase64).trim();
  if (b64) return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
  const url = item?.iconUrl && String(item.iconUrl).trim();
  return url || null;
}

export default function RepairSelectServiceScreen({ navigation, route }) {
  const device = route?.params?.device || {};
  const { width } = useWindowDimensions();
  const cols = width >= 1024 ? 5 : width >= 700 ? 4 : 3;
  const [groups, setGroups] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let catId = UUID_RE.test(String(device.categoryId || '')) ? device.categoryId : null;
        if (!catId && device.categoryCode) {
          const cats = await getDeviceCategories().catch(() => []);
          const m = (cats || []).find((c) => (c.code || '').toUpperCase() === String(device.categoryCode).toUpperCase());
          catId = m?.id || null;
        }
        let g = catId ? await getRepairServicesGrouped(catId) : [];
        g = (g || []).filter((x) => (x.issues || []).length > 0);
        if (!cancelled) setGroups(g);
      } catch (_) {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [device.categoryId, device.categoryCode]);

  const toggle = (id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleGroup = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const allIssues = useMemo(() => groups.flatMap((g) => g.issues || []), [groups]);

  const onContinue = () => {
    const chosen = allIssues.filter((s) => selectedIds.includes(s.id));
    navigation.navigate('RepairReview', { device, services: chosen });
  };

  if (loading) return <Loader label="Loading services..." />;

  const selectedCount = selectedIds.length;

  return (
    <View className="flex-1 bg-background">
      {/* Device summary + search */}
      <View className="bg-card border-b border-border px-4 pt-3 pb-3">
        <View className="flex-row items-center mb-3">
          <View className="h-11 w-11 rounded-2xl bg-primary/10 items-center justify-center mr-3 overflow-hidden">
            {device.imageUrl ? (
              <Image source={{ uri: device.imageUrl }} style={{ width: 44, height: 44 }} resizeMode="cover" />
            ) : (
              <Smartphone size={20} color="#00008B" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-text-muted uppercase tracking-widest">Your Device</Text>
            <Text className="text-[14px] font-extrabold text-text" numberOfLines={1}>{device.modelName || 'Device'}</Text>
            <View className="flex-row items-center mt-0.5 flex-wrap">
              {device.color ? <Text className="text-[10px] text-text-muted">{device.color}</Text> : null}
              {device.ramLabel ? <Text className="text-[10px] text-text-muted"> · {device.ramLabel}</Text> : null}
              {device.storageLabel ? <Text className="text-[10px] text-text-muted"> · {device.storageLabel}</Text> : null}
            </View>
          </View>
          {selectedCount > 0 ? <Badge variant="default">{selectedCount} SELECTED</Badge> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 150 }}>
        <Text className="text-[11px] font-extrabold text-text-muted tracking-widest mb-3">SELECT THE PROBLEMS</Text>

        {groups.length === 0 ? (
          <EmptyState
            icon={<Search size={28} color="#00008B" />}
            title="No services found"
            description="No repair services configured for this device category."
          />
        ) : (
          groups.map((g) => {
            const open = !!expanded[g.id];
            const groupSelected = (g.issues || []).filter((s) => selectedIds.includes(s.id)).length;
            const FallbackIcon = iconForGroup(g.code, g.name);
            return (
              <View
                key={g.id}
                className="mb-2.5 bg-card border border-border rounded-2xl overflow-hidden"
                style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}
              >
                {/* Main category header — title + circular +/- toggle */}
                <Pressable onPress={() => toggleGroup(g.id)} className="flex-row items-center px-3.5 py-3 active:opacity-80">
                  <View className="flex-1 pr-3">
                    <Text className="text-[14px] font-extrabold text-text leading-5">{g.name}</Text>
                    {groupSelected > 0 ? (
                      <Text className="text-[10px] font-bold text-primary mt-0.5">{groupSelected} selected</Text>
                    ) : null}
                  </View>
                  <View className={`h-7 w-7 rounded-full border items-center justify-center ${open ? 'border-primary bg-primary/5' : 'border-text-muted/40'}`}>
                    {open ? <Minus size={14} color="#00008B" /> : <Plus size={14} color="#0F172A" />}
                  </View>
                </Pressable>

                {/* Issues as a compact icon-card grid */}
                {open ? (
                  <View className="px-1.5 pb-2 pt-1 border-t border-border">
                    <View className="flex-row flex-wrap">
                      {(g.issues || []).map((s) => {
                        const checked = selectedIds.includes(s.id);
                        const uri = imgUri(s);
                        return (
                          <View key={s.id} style={{ width: `${100 / cols}%` }} className="p-1">
                            <Pressable
                              onPress={() => toggle(s.id)}
                              className={`rounded-xl border p-2 items-center active:opacity-80 ${checked ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                              style={{ minHeight: 84 }}
                            >
                              {checked ? (
                                <View className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-primary items-center justify-center">
                                  <Check size={10} color="#fff" strokeWidth={3} />
                                </View>
                              ) : null}
                              <View className={`h-10 w-10 rounded-xl items-center justify-center mb-1.5 overflow-hidden ${checked ? 'bg-primary/10' : 'bg-background'}`}>
                                {uri ? (
                                  <Image source={{ uri }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                                ) : (
                                  <FallbackIcon size={20} color={checked ? '#00008B' : '#64748B'} />
                                )}
                              </View>
                              <Text className={`text-[10px] font-bold text-center leading-[13px] ${checked ? 'text-primary' : 'text-text'}`} numberOfLines={2}>
                                {s.name}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        {selectedCount > 0 ? (
          <View className="bg-primary/5 border border-primary/10 rounded-2xl p-3 mt-1 flex-row items-center">
            <Wrench size={14} color="#00008B" />
            <Text className="text-[12px] text-text ml-2 flex-1">
              You've selected <Text className="font-extrabold text-primary">{selectedCount}</Text> issue{selectedCount === 1 ? '' : 's'}.
              Next, you'll get a price estimate.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <BottomActionBar
        priceCaption="Selected"
        priceValue={`${selectedCount}`}
        priceLabel={`issue${selectedCount === 1 ? '' : 's'}`}
        title="Continue"
        onPress={onContinue}
        disabled={selectedCount === 0}
      />
    </View>
  );
}
