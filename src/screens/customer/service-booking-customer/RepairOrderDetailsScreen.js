import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import {
  ChevronLeft,
  CalendarClock,
  Smartphone,
  MapPin,
  Store,
  Phone,
  Camera,
  ShieldCheck,
  Video,
  FileText,
  Play,
  Pause,
} from 'lucide-react-native';
import {
  Card,
  CardTitle,
  Loader,
  Badge,
  EmptyState,
} from '../../../components/rnr';
import { getRepairBooking } from '../../../api/orders';
import { getBrands, getModelsByBrand, getRamOptions, getStorageOptions } from '../../../api/masterData';
import { getShop } from '../../../api/shops';
import { listAddresses } from '../../../api/customer';
import { parsePickupMeta } from '../../../utils/pickupEstimateMeta';

const fmtDateTime = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

// Card rendered on the customer's order detail when the booking's events
// include the technician's compliance / issue-verified note. Wraps an
// optional voice-note player + image thumbnails so the customer can review
// what the technician verified. Returns null when no such event exists.
function ComplianceNoteCard({ event }) {
  if (!event) return null;
  const audioUrl = event.audioUrl;
  const imageUrls = Array.isArray(event.imageUrls) ? event.imageUrls : [];
  const noteText = event.note;

  const soundRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Release the player on unmount so the next visit can re-acquire it.
  useEffect(() => () => {
    try { soundRef.current?.unloadAsync?.(); } catch (_) {}
  }, []);

  const togglePlay = async () => {
    try {
      if (playing && soundRef.current) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        return;
      }
      if (soundRef.current) {
        try { await soundRef.current.unloadAsync(); } catch (_) {}
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s?.didJustFinish) setPlaying(false);
      });
      await sound.playAsync();
      setPlaying(true);
    } catch (_) { /* best-effort playback */ }
  };

  const hasAudio = !!audioUrl;
  const hasImages = imageUrls.length > 0;
  const attachmentCount = (hasAudio ? 1 : 0) + imageUrls.length;

  return (
    <Card className="rounded-2xl mb-3">
      {/* Header: amber icon chip + title + "Verified" pill on the right */}
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-2.5"
          style={{ backgroundColor: '#FEF3C7' }}
        >
          <FileText size={14} color="#B45309" />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-extrabold tracking-widest" style={{ color: '#B45309', letterSpacing: 1.2 }}>
            ISSUE VERIFIED & UPDATED
          </Text>
          <Text className="text-[13px] font-extrabold text-text mt-0.5">
            By your technician
          </Text>
        </View>
        <View
          className="flex-row items-center rounded-full px-2 py-0.5"
          style={{ backgroundColor: '#DCFCE7' }}
        >
          <ShieldCheck size={11} color="#15803D" />
          <Text className="text-[9px] font-extrabold ml-1" style={{ color: '#15803D' }}>VERIFIED</Text>
        </View>
      </View>

      {/* Body — left amber accent bar + content stack */}
      <View className="flex-row">
        <View
          style={{ width: 3, borderRadius: 2, backgroundColor: '#F59E0B', marginRight: 12, alignSelf: 'stretch' }}
        />
        <View className="flex-1">
          {noteText ? (
            <Text className="text-[13px] text-text leading-5">{noteText}</Text>
          ) : (
            <Text className="text-[12px] italic text-text-muted">No additional notes.</Text>
          )}

          {hasAudio ? (
            <TouchableOpacity
              onPress={togglePlay}
              className="flex-row items-center rounded-full self-start mt-3 px-3 py-2"
              style={{ backgroundColor: playing ? '#FEF3C7' : '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B' }}
            >
              {playing
                ? <Pause size={13} color="#B45309" />
                : <Play size={13} color="#B45309" />}
              <Text className="text-[11px] font-extrabold ml-1.5" style={{ color: '#B45309' }}>
                {playing ? 'Pause voice note' : 'Play voice note'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {hasImages ? (
            <View className="mt-3">
              <Text className="text-[10px] font-bold text-text-muted uppercase mb-1.5" style={{ letterSpacing: 0.8 }}>
                Photos ({imageUrls.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {imageUrls.map((u, i) => (
                    <Image
                      key={i}
                      source={{ uri: u }}
                      style={{
                        width: 84, height: 84, borderRadius: 10, marginRight: 8,
                        backgroundColor: '#F1F5F9',
                      }}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>

      {/* Footer caption */}
      {event.createdAt ? (
        <View
          className="flex-row items-center mt-3 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
        >
          <CalendarClock size={11} color="#94A3B8" />
          <Text className="text-[10px] text-text-muted ml-1.5">
            Verified on {fmtDateTime(event.createdAt)}
          </Text>
          {attachmentCount > 0 ? (
            <Text className="text-[10px] text-text-muted ml-auto">
              {attachmentCount} {attachmentCount === 1 ? 'attachment' : 'attachments'}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function DetailLine({ label, value, valueClass }) {
  return (
    <View className="flex-row flex-wrap py-1">
      <Text className="text-[11px] text-text-muted">{label} : </Text>
      <Text className={`text-[11px] font-bold flex-1 ${valueClass || 'text-text'}`}>{value || '-'}</Text>
    </View>
  );
}

export default function RepairOrderDetailsScreen({ navigation, route }) {
  const { bookingId, fromOrders } = route.params || {};
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);
  // Device details resolved from the booking's IDs (the booking record doesn't
  // store the model name/specs).
  const [dev, setDev] = useState({});
  const [shop, setShop] = useState(null);
  const [addr, setAddr] = useState(null);

  const goHome = useCallback(() => {
    // From My Orders: go back to that list. From the booking confirmation (a
    // dead-end), the wizard screens are behind us, so jump to the root tabs.
    if (fromOrders && navigation.canGoBack()) navigation.goBack();
    else navigation.popToTop();
  }, [navigation, fromOrders]);

  // Override the stack header's back button: it should always go Home, not
  // backwards through the booking wizard.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={goHome}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => ({ marginLeft: 8, padding: 4, opacity: pressed ? 0.6 : 1 })}
        >
          <View
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: '#F1F5F9',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} color="#0F172A" />
          </View>
        </Pressable>
      ),
    });
  }, [navigation, goHome]);

  // Reload on focus so the timeline picks up status updates.
  useFocusEffect(useCallback(() => {
    (async () => {
      try { setB(await getRepairBooking(bookingId)); } catch (_) {}
      setLoading(false);
    })();
  }, [bookingId]));

  // Resolve device name / image / specs from the booking's IDs.
  useEffect(() => {
    if (!b) return;
    let cancelled = false;
    (async () => {
      const [brands, models, rams, storages] = await Promise.all([
        getBrands().catch(() => []),
        b.brandId ? getModelsByBrand(b.brandId).catch(() => []) : [],
        getRamOptions().catch(() => []),
        getStorageOptions().catch(() => []),
      ]);
      if (cancelled) return;
      const model = (models || []).find((m) => m.id === b.modelId);
      const brandName = (brands || []).find((x) => x.id === b.brandId)?.name;
      const ramLabel = (rams || []).find((r) => r.id === b.ramOptionId)?.label;
      const storageLabel = (storages || []).find((s) => s.id === b.storageOptionId)?.label;
      const image = model?.imageUrl
        || (model?.imageBase64 ? `data:image/png;base64,${model.imageBase64}` : null);
      setDev({
        name: b.modelName || model?.name || (brandName ? `${brandName} device` : 'Device'),
        image,
        specs: [brandName, b.color, [ramLabel, storageLabel].filter(Boolean).join(' / ')].filter(Boolean).join(' · '),
      });
    })();
    return () => { cancelled = true; };
  }, [b]);

  // Resolve shop + pickup address from the booking's IDs.
  useEffect(() => {
    if (!b) return;
    let cancelled = false;
    (async () => {
      const [shopRes, addrs] = await Promise.all([
        b.shopId ? getShop(b.shopId).catch(() => null) : null,
        listAddresses().catch(() => []),
      ]);
      if (cancelled) return;
      setShop(shopRes || b.shop || null);
      setAddr((addrs || []).find((a) => a.id === b.pickupAddressId) || b.address || null);
    })();
    return () => { cancelled = true; };
  }, [b]);

  if (loading) return <Loader label="Loading order..." />;
  if (!b) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          title="Booking not found"
          description="We couldn't load this order."
          actionLabel="Go home"
          onAction={goHome}
        />
      </View>
    );
  }

  const { clean: cleanIssue, meta } = parsePickupMeta(b.issueSummary);
  // Prefer real columns; fall back to meta when the pickup-estimate appendix
  // is the only place a field actually lives.
  const metaServices = (meta?.services || []).map((s) => ({
    serviceName: s.name || s.serviceName || s.code,
    estimatedPrice: Number(s.price) || 0,
  })).filter((s) => s.serviceName);
  const bookingServices = b.services || [];
  const bookingServiceTotal = bookingServices.reduce((s, x) => s + Number(x.estimatedPrice || 0), 0);
  // If the booking's per-service rows have no prices (the submitPickupRepairEstimate
  // endpoint only updates estimateAmount, not service line prices) but the meta
  // carries them, render the meta lines instead so the price summary isn't all ₹0.
  const displayServices = (bookingServices.length && bookingServiceTotal > 0)
    ? bookingServices
    : (metaServices.length ? metaServices : bookingServices);
  const serviceNames = displayServices.map((s) => s.serviceName).join(', ');
  const priceTotal = b.estimateAmount != null
    ? Number(b.estimateAmount)
    : displayServices.reduce((s, x) => s + Number(x.estimatedPrice || 0), 0);
  // Producer key today is estimatedReadyAt; older rows used estimatedPickupAt.
  const readyAt = b.estimatedReadyAt || meta?.estimatedReadyAt || meta?.estimatedPickupAt || null;
  const deliveryAt = b.estimatedDeliveryAt || meta?.estimatedDeliveryAt || null;
  const estTimeText = readyAt
    ? `${fmtDateTime(readyAt)}${b.estimatedDurationHours ? `, ${b.estimatedDurationHours}Hr` : ''}`
    : '-';
  const approvalDone = (b.customerApproval || '').toUpperCase() === 'DONE' || meta?.customerApproved === true;
  const approvalText = approvalDone ? 'Done' : (b.customerApproval || 'Pending');
  const hasDevicePhotos = !!(b.frontImageUrl || b.backImageUrl || b.videoUrl);
  const bookingNo = b.bookingNumber
    ? (String(b.bookingNumber).startsWith('#') ? b.bookingNumber : `#${b.bookingNumber}`)
    : null;
  const centered = { width: '100%', maxWidth: 600, alignSelf: 'center' };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
       <View style={centered}>
        {/* Arriving banner (pickup bookings only) */}
        {b.pickupDate ? (
          <View className="bg-success/10 border border-success/30 rounded-2xl p-3 mb-3">
            <View className="flex-row items-center mb-1">
              <CalendarClock size={14} color="#10B981" />
              <Text className="text-success text-[13px] font-extrabold ml-1.5">
                Arriving on {b.pickupDate}
              </Text>
            </View>
            {b.pickupSlotStart && b.pickupSlotEnd ? (
              <Text className="text-success text-[12px] font-bold">
                {String(b.pickupSlotStart).slice(0, 5)} - {String(b.pickupSlotEnd).slice(0, 5)}
              </Text>
            ) : null}
            <Text className="text-[11px] text-text-muted mt-1">
              Pickup confirmed! Our pickup partner will contact you shortly.
            </Text>
          </View>
        ) : null}

        {/* Hero device card — larger thumbnail (72×90), booking pill on top,
            device name in big bold, status chip + repair summary inline. */}
        <Card
          className="rounded-2xl mb-3"
          style={{
            borderWidth: 1, borderColor: '#EEF2F7',
            shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 }, elevation: 3,
          }}
        >
          {bookingNo ? (
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text
                  className="text-[9.5px] text-text-muted uppercase font-extrabold"
                  style={{ letterSpacing: 1 }}
                >
                  Booking
                </Text>
                <Text className="text-[12px] font-extrabold text-text ml-1.5">{bookingNo}</Text>
              </View>
              {b.status ? (
                <Badge variant="softPrimary">{String(b.status).replace(/_/g, ' ')}</Badge>
              ) : null}
            </View>
          ) : null}
          <View className="flex-row items-center">
            <View
              className="rounded-2xl overflow-hidden items-center justify-center"
              style={{ width: 72, height: 90, backgroundColor: '#F1F5F9' }}
            >
              {dev.image ? (
                <Image source={{ uri: dev.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Smartphone size={28} color="#94A3B8" />
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[15px] font-extrabold text-text" numberOfLines={2}>
                {dev.name || b.modelName || 'Device'}
              </Text>
              {dev.specs ? (
                <Text className="text-[11px] text-text-muted mt-1" numberOfLines={2}>{dev.specs}</Text>
              ) : null}
              {serviceNames ? (
                <View
                  className="self-start rounded-full px-2 py-0.5 mt-2"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Text
                    className="text-[10px] font-extrabold"
                    style={{ color: '#B91C1C' }}
                    numberOfLines={1}
                  >
                    {serviceNames}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Device Photos */}
        {hasDevicePhotos ? (
          <Card className="rounded-2xl mb-3">
            <CardTitle className="mb-2">Device Photos</CardTitle>
            <View className="flex-row -mx-1">
              {[
                { uri: b.frontImageUrl, label: 'Front Side' },
                { uri: b.backImageUrl, label: 'Back Side' },
                { uri: b.videoUrl, label: 'Full Coverage Video', video: true },
              ].map((p, i) => (
                <View key={i} className="flex-1 px-1">
                  <View className="rounded-xl bg-background border border-border items-center justify-center overflow-hidden" style={{ height: 92 }}>
                    {p.uri && !p.video ? (
                      <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : p.uri && p.video ? (
                      <Video size={22} color="#00008B" />
                    ) : (
                      <Camera size={20} color="#94A3B8" />
                    )}
                  </View>
                  <Text className="text-[9px] text-text-muted text-center mt-1" numberOfLines={1}>{p.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Price Summary */}
        {(displayServices.length || b.estimateAmount != null) ? (
          <Card className="rounded-2xl mb-3">
            <CardTitle className="mb-1.5">Price Summary</CardTitle>
            {displayServices.map((s, i) => (
              <View key={i} className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="h-4 w-4 rounded bg-primary/10 items-center justify-center mr-2">
                    <Text className="text-[9px] font-bold text-primary">{i + 1}</Text>
                  </View>
                  <Text className="text-[12px] text-text flex-1" numberOfLines={1}>{s.serviceName}</Text>
                </View>
                <Text className="text-[12px] font-bold text-text">₹{Number(s.estimatedPrice || 0).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View className="flex-row items-center justify-between mt-1.5 pt-1.5 border-t border-border">
              <Text className="text-[12px] font-extrabold text-text">Estimated Repair Amount</Text>
              <Text className="text-[13px] font-extrabold text-primary">₹{Number(priceTotal).toLocaleString('en-IN')}</Text>
            </View>
          </Card>
        ) : null}

        {/* Repair Details */}
        <Card className="rounded-2xl mb-3">
          <CardTitle className="mb-1">Repair Details</CardTitle>
          <DetailLine label="Complaint Issue" value={cleanIssue} />
          <DetailLine label="Estimated Approximate Time" value={estTimeText} />
          <DetailLine label="Estimated Delivery Date" value={fmtDateTime(deliveryAt)} />
          <DetailLine
            label="Customer Repair Approval"
            value={approvalText}
            valueClass={approvalDone ? 'text-success' : 'text-warning'}
          />
        </Card>

        {/* Device Security */}
        <Card className="rounded-2xl mb-3">
          <View className="flex-row items-center mb-1">
            <ShieldCheck size={15} color="#10B981" />
            <CardTitle className="ml-2">Device Security</CardTitle>
          </View>
          <DetailLine
            label="PIN / Pattern"
            value={b.devicePin
              ? (b.deviceSecurityType ? `${b.deviceSecurityType} - ${b.devicePin}` : b.devicePin)
              : null}
          />
          <View className="h-px bg-border my-2" />
          <Text className="text-[12px] font-extrabold text-text mb-0.5">Device Missing / Damage Parts</Text>
          <Text className="text-[12px] text-text-muted">{b.missingDamageParts || 'Nil'}</Text>
        </Card>

        {/* Technician uploaded photos */}
        {(b.technicianName || b.technicianCode || b.technicianPhotos?.length) ? (
          <Card className="rounded-2xl mb-3">
            <View className="flex-row items-center mb-2">
              <Camera size={15} color="#2563EB" />
              <CardTitle className="ml-2">Technician Photos</CardTitle>
            </View>
            {(b.technicianName || b.technicianCode) ? (
              <Text className="text-[11px] text-text-muted mb-2">
                {[b.technicianName, b.technicianCode].filter(Boolean).join(' — ')}
              </Text>
            ) : null}
            <View className="flex-row -mx-1">
              {(b.technicianPhotos?.length ? b.technicianPhotos.slice(0, 3) : [null, null, null]).map((uri, i) => (
                <View key={i} className="flex-1 px-1">
                  <View className="rounded-xl bg-background border border-border items-center justify-center overflow-hidden" style={{ height: 84 }}>
                    {uri ? (
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Camera size={18} color="#94A3B8" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Technician Issue Verified & Updated — pulled from the booking's
            events list. The customer-facing event row carries the optional
            audio + image attachments the technician submitted with the note
            (after ticket-service writes them on the
            TECHNICIAN_COMPLIANCE_ISSUE_VERIFIED_UPDATED step event). */}
        <ComplianceNoteCard
          event={(b.events || []).find(
            (e) => (e?.status || '').toUpperCase() === 'TECHNICIAN_COMPLIANCE_ISSUE_VERIFIED_UPDATED',
          )}
        />

        {/* Pickup Address */}
        {addr ? (
          <Card className="rounded-2xl mb-3">
            <View className="flex-row items-center mb-2">
              <MapPin size={15} color="#10B981" />
              <CardTitle className="ml-2">Pickup Address</CardTitle>
            </View>
            <Text className="text-[13px] font-bold text-text">
              {addr.fullName}{addr.mobile ? ` · ${addr.mobile}` : ''}
            </Text>
            <Text className="text-[12px] text-text-muted mt-1 leading-5">
              {[addr.addressLine, addr.locality, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
            </Text>
          </Card>
        ) : null}

        {/* Shop & Schedule */}
        {shop ? (
          <Card className="rounded-2xl mb-3">
            <View className="flex-row items-center mb-2">
              <Store size={15} color="#2563EB" />
              <CardTitle className="ml-2">Shop & Schedule</CardTitle>
            </View>
            <Text className="text-[13px] font-bold text-text">{shop.name}</Text>
            {shop.address ? <Text className="text-[12px] text-text-muted mt-1">{shop.address}</Text> : null}
            {shop.phone ? (
              <View className="flex-row items-center mt-1">
                <Phone size={12} color="#64748B" />
                <Text className="text-[12px] text-text-muted ml-1">{shop.phone}</Text>
              </View>
            ) : null}
            <View className="flex-row items-center bg-secondary/5 border border-secondary/15 rounded-xl mt-3 px-3 py-2">
              <CalendarClock size={14} color="#2563EB" />
              <Text className="text-[12px] font-bold text-secondary ml-2">
                {b.pickupDate || '-'}
                {b.pickupSlotStart && b.pickupSlotEnd
                  ? ` · ${String(b.pickupSlotStart).slice(0, 5)} - ${String(b.pickupSlotEnd).slice(0, 5)}`
                  : ''}
              </Text>
            </View>
          </Card>
        ) : null}

       </View>
      </ScrollView>
    </View>
  );
}

