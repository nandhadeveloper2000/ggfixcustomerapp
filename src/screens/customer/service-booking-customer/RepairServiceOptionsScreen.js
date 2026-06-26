import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  MessageCircle, Truck, Store, ShieldCheck, Clock, IndianRupee,
  Phone, Wrench, Check,
} from 'lucide-react-native';
import { BottomActionBar } from '../../../components/rnr';

const MAX_W = 560;

const OPTIONS = [
  {
    key: 'PICKUP',
    target: 'RepairPickupShops',
    title: 'Doorstep Pickup',
    tagline: 'Most popular',
    description: 'Free pickup & drop. Pick a nearby shop and a slot — we handle the rest.',
    accent: '#00008B',
    bg: 'bg-primary/10',
    priceClass: 'text-primary',
    icon: Truck,
    badge: 'POPULAR',
    highlights: [
      { icon: Truck, label: 'Free pickup' },
      { icon: ShieldCheck, label: '30-day warranty' },
      { icon: Clock, label: 'Same-day' },
    ],
    eta: 'Pickup in 30 min',
    price: 'From ₹399',
  },
  {
    key: 'ENQUIRY',
    target: 'ShopChat',
    targetParams: { mode: 'ENQUIRY' },
    title: 'Service Enquiry',
    tagline: 'Talk first, book later',
    description: 'Chat with shop technicians to clarify the issue & get a quote before booking.',
    accent: '#059669',
    bg: 'bg-success/10',
    priceClass: 'text-success',
    icon: MessageCircle,
    badge: 'FREE',
    highlights: [
      { icon: MessageCircle, label: 'Live chat' },
      { icon: Phone, label: 'Call back' },
      { icon: IndianRupee, label: 'No obligation' },
    ],
    eta: 'Replies in ~10 min',
    price: 'No charge',
  },
];

export default function RepairServiceOptionsScreen({ navigation, route }) {
  const params = route.params || {};
  const centered = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };
  const [selected, setSelected] = useState('PICKUP');

  const onContinue = () => {
    const opt = OPTIONS.find((o) => o.key === selected);
    if (!opt) return;
    navigation.navigate(opt.target, { ...params, ...(opt.targetParams || {}) });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 110 }}>
       <View style={centered}>

        {/* Device + services summary */}
        {(params.device || params.services?.length) ? (
          <View className="bg-card border border-border rounded-2xl p-3 mb-3 flex-row items-center">
            <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Wrench size={18} color="#00008B" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-text-muted uppercase tracking-widest">Booking for</Text>
              <Text className="text-[13px] font-extrabold text-text" numberOfLines={1}>
                {params.device?.modelName || 'Device'}
              </Text>
              {params.services?.length ? (
                <Text className="text-[10px] text-text-muted mt-0.5" numberOfLines={1}>
                  {params.services.length} service{params.services.length === 1 ? '' : 's'} · {params.services.map((s) => s.name).join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <Text className="text-[11px] font-extrabold text-text-muted tracking-widest mb-2">HOW TO PROCEED</Text>

        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setSelected(opt.key)}
              className={`bg-card rounded-2xl border p-3.5 mb-2.5 active:opacity-90 ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <View className="flex-row items-start">
                <View className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${opt.bg}`}>
                  <Icon size={20} color={opt.accent} />
                </View>
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <Text className="text-[15px] font-extrabold text-text mr-2">{opt.title}</Text>
                    {opt.badge ? (
                      <View className="bg-background border border-border rounded-full px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-text-muted tracking-wide">{opt.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-[12px] text-text-muted mt-1 leading-4">{opt.description}</Text>

                  <View className="flex-row flex-wrap mt-2">
                    {opt.highlights.map((h) => {
                      const HIcon = h.icon;
                      return (
                        <View key={h.label} className="flex-row items-center mr-3 mb-1">
                          <HIcon size={11} color={opt.accent} />
                          <Text className="text-[10px] text-text-muted ml-1">{h.label}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-border">
                    <View className="flex-row items-center">
                      <Clock size={11} color="#94A3B8" />
                      <Text className="text-[11px] text-text-muted ml-1">{opt.eta}</Text>
                    </View>
                    <Text className={`text-[13px] font-extrabold ${opt.priceClass}`}>{opt.price}</Text>
                  </View>
                </View>

                {/* Radio / check */}
                <View className={`h-6 w-6 rounded-full items-center justify-center ${isSelected ? 'bg-primary' : 'border-2 border-border'}`}>
                  {isSelected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Walk-in (subtle) */}
        <Pressable
          onPress={() => navigation.navigate('NearbyShops')}
          className="bg-card border border-border rounded-2xl p-3 flex-row items-center active:opacity-80"
        >
          <View className="h-9 w-9 rounded-full bg-background items-center justify-center mr-3">
            <Store size={16} color="#64748B" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-bold text-text">Walk-in to a shop</Text>
            <Text className="text-[10px] text-text-muted mt-0.5" numberOfLines={1}>Find shops on the map & visit directly.</Text>
          </View>
          <View className="bg-background border border-border rounded-full px-3 py-1.5">
            <Text className="text-[11px] font-bold text-text">Find</Text>
          </View>
        </Pressable>

        <Text className="text-[10px] text-text-muted text-center mt-3">
          Both options include 30-day warranty & verified shops.
        </Text>
       </View>
      </ScrollView>

      <BottomActionBar
        title={selected === 'ENQUIRY' ? 'Start Enquiry Chat' : 'Continue to Shops'}
        onPress={onContinue}
      />
    </View>
  );
}
