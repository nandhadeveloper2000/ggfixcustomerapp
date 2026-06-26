import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Smartphone, MapPin, Store, Calendar, Wrench, ShieldCheck, Tag, Truck, Phone, Camera, Video } from 'lucide-react-native';
import { notify } from '../../../components/confirm';
import {
  Card,
  CardTitle,
  Loader,
  BottomActionBar,
  PriceRow,
  PriceDivider,
  Badge,
} from '../../../components/rnr';
import { createRepairBooking } from '../../../api/orders';
import { listAddresses } from '../../../api/customer';
import { getShop } from '../../../api/shops';
import { uploadMedia } from '../../../api/masterData';

function formatTime(t) {
  if (!t) return '';
  return String(t).slice(0, 5);
}

export default function RepairCompleteOrderScreen({ navigation, route }) {
  const p = route.params || {};
  const [shop, setShop] = useState(null);
  const [addr, setAddr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, addrs] = await Promise.all([
          p.shopId ? getShop(p.shopId).catch(() => null) : null,
          listAddresses().catch(() => []),
        ]);
        setShop(s);
        setAddr(addrs.find((a) => a.id === p.addressId) || addrs[0]);
      } finally { setLoading(false); }
    })();
  }, [p.shopId, p.addressId]);

  const book = async () => {
    setSaving(true);
    try {
      const m = p.media || {};
      const [frontImageUrl, backImageUrl, videoUrl] = await Promise.all([
        m.front?.uri ? uploadMedia(m.front, 'repair-bookings').catch(() => null) : null,
        m.back?.uri  ? uploadMedia(m.back,  'repair-bookings').catch(() => null) : null,
        m.video?.uri ? uploadMedia(m.video, 'repair-bookings').catch(() => null) : null,
      ]);
      const payload = {
        shopId: p.shopId,
        brandId: p.device?.brandId,
        modelId: p.device?.modelId,
        ramOptionId: p.device?.ramOptionId,
        storageOptionId: p.device?.storageOptionId,
        color: p.device?.color,
        serviceMode: 'PICKUP',
        issueSummary: (p.services || []).map((s) => s.name).join(', '),
        services: (p.services || []).map((s) => ({ repairServiceId: s.id, serviceCode: s.code, serviceName: s.name })),
        pickupAddressId: p.addressId,
        pickupDate: p.pickupDate,
        pickupSlotStart: p.pickupSlotStart,
        pickupSlotEnd: p.pickupSlotEnd,
        frontImageUrl,
        backImageUrl,
        videoUrl,
      };
      const created = await createRepairBooking(payload);
      navigation.replace('RepairConfirmation', { booking: created, device: p.device, shop, address: addr, services: p.services });
    } catch (e) {
      notify('Error', e.message);
    } finally { setSaving(false); }
  };

  if (loading) return <Loader label="Preparing your booking..." />;

  const dev = p.device || {};
  const services = p.services || [];
  const servicesTotal = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const pickupFee = 0;
  const discount = Math.floor(servicesTotal * 0.15);
  const total = Math.max(servicesTotal + pickupFee - discount, 0);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
        <View className="mb-3">
          <Card className="rounded-2xl">
            <View className="flex-row items-center">
              <View className="h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mr-3 overflow-hidden">
                {dev.imageUrl ? (
                  <Image source={{ uri: dev.imageUrl }} style={{ width: 56, height: 56 }} resizeMode="cover" />
                ) : (
                  <Smartphone size={26} color="#00008B" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-[11px] text-text-muted uppercase tracking-widest">Your Device</Text>
                <Text className="text-[15px] font-extrabold text-text mt-0.5">{dev.modelName || 'Device'}</Text>
                {dev.color ? <Text className="text-[12px] text-text-muted mt-0.5">Color: {dev.color}</Text> : null}
              </View>
            </View>
          </Card>
        </View>

        <Card className="mb-3 rounded-2xl">
          <View className="flex-row items-center mb-2">
            <Wrench size={16} color="#00008B" />
            <CardTitle className="ml-2">Repair Services</CardTitle>
          </View>
          {services.map((s, idx) => (
            <View key={s.id || idx} className="flex-row items-center justify-between py-1.5">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                <Text className="text-[13px] text-text flex-1" numberOfLines={1}>{s.name}</Text>
              </View>
              {s.price != null ? (
                <Text className="text-[13px] font-bold text-text">₹{s.price}</Text>
              ) : null}
            </View>
          ))}
        </Card>

        {/* Device photos captured during review */}
        {p.media && (p.media.front?.uri || p.media.back?.uri || p.media.video?.uri) ? (
          <Card className="mb-3 rounded-2xl">
            <View className="flex-row items-center mb-2">
              <Camera size={16} color="#F59E0B" />
              <CardTitle className="ml-2">Device Photos</CardTitle>
            </View>
            <View className="flex-row -mx-1">
              {[
                { key: 'front', label: 'Front', asset: p.media.front },
                { key: 'back', label: 'Back', asset: p.media.back },
                { key: 'video', label: 'Video', asset: p.media.video, isVideo: true },
              ].map((m) => {
                if (!m.asset?.uri) return null;
                return (
                  <View key={m.key} style={{ width: '33.333%' }} className="px-1">
                    <View className="rounded-xl overflow-hidden border border-border" style={{ height: 96, backgroundColor: '#F8FAFC' }}>
                      {m.isVideo ? (
                        <View className="flex-1 bg-text/90 items-center justify-center">
                          <Video size={22} color="#fff" />
                          <Text className="text-white text-[9px] font-bold mt-0.5">VIDEO</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: m.asset.uri }} style={{ flex: 1 }} resizeMode="cover" />
                      )}
                    </View>
                    <Text className="text-[10px] font-bold text-text-muted text-center mt-1">{m.label}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}

        <Card className="mb-3 rounded-2xl">
          <View className="flex-row items-center mb-2">
            <MapPin size={16} color="#10B981" />
            <CardTitle className="ml-2">Pickup Address</CardTitle>
          </View>
          {addr ? (
            <>
              <Text className="text-[13px] font-bold text-text">{addr.fullName} · {addr.mobile}</Text>
              <Text className="text-[12px] text-text-muted mt-1 leading-5">
                {[addr.addressLine, addr.locality, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
              </Text>
            </>
          ) : (
            <Text className="text-[12px] text-text-muted">No address selected</Text>
          )}
        </Card>

        <Card className="mb-3 rounded-2xl">
          <View className="flex-row items-center mb-2">
            <Store size={16} color="#2563EB" />
            <CardTitle className="ml-2">Shop & Schedule</CardTitle>
          </View>
          {shop ? (
            <>
              <Text className="text-[13px] font-bold text-text">{shop.name}</Text>
              <Text className="text-[12px] text-text-muted mt-1">{shop.address}</Text>
              {shop.phone ? (
                <View className="flex-row items-center mt-1">
                  <Phone size={12} color="#64748B" />
                  <Text className="text-[12px] text-text-muted ml-1">{shop.phone}</Text>
                </View>
              ) : null}
            </>
          ) : null}
          <View className="flex-row items-center bg-secondary/5 border border-secondary/15 rounded-xl mt-3 px-3 py-2">
            <Calendar size={14} color="#2563EB" />
            <Text className="text-[12px] font-bold text-secondary ml-2">
              {p.pickupDate} · {formatTime(p.pickupSlotStart)} - {formatTime(p.pickupSlotEnd)}
            </Text>
          </View>
        </Card>

        <Card className="mb-3 rounded-2xl">
          <View className="flex-row items-center mb-2">
            <Tag size={16} color="#F59E0B" />
            <CardTitle className="ml-2">Payment Summary</CardTitle>
          </View>
          <PriceRow label="Service charges" value={`₹${servicesTotal}`} />
          <PriceRow label="Pickup & drop" value={pickupFee ? `₹${pickupFee}` : 'FREE'} valueClassName={pickupFee ? '' : 'text-success font-extrabold'} />
          <PriceRow label="Coupon FIRSTFIX (15%)" value={`-₹${discount}`} valueClassName="text-success font-bold" />
          <PriceDivider />
          <PriceRow label="Total payable" value={`₹${total}`} bold />
          <View className="bg-success/10 rounded-xl mt-2 p-2.5 flex-row items-center">
            <ShieldCheck size={14} color="#10B981" />
            <Text className="text-[11px] text-success font-bold ml-2">30-day repair warranty included</Text>
          </View>
        </Card>

        <View className="bg-warning/10 border border-warning/30 rounded-2xl p-3 flex-row items-center">
          <Truck size={16} color="#F59E0B" />
          <Text className="text-[11px] text-text ml-2 flex-1">
            Pay on pickup, after diagnosis, or after repair - your choice.
          </Text>
        </View>
      </ScrollView>

      <BottomActionBar
        priceCaption="Total"
        priceValue={`₹${total}`}
        priceLabel="incl. all charges"
        title="Confirm Booking"
        onPress={book}
        loading={saving}
      />
    </View>
  );
}

