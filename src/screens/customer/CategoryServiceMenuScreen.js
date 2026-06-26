import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wrench,
  Tag,
  ShoppingBag,
  Smartphone,
  Star,
  ShieldCheck,
  Truck,
  Sparkles,
  Headset,
} from 'lucide-react-native';
import { tokens } from '../../theme/colors';

// Hero artwork backing each service tile. Replace the placeholders in
// src/assets/services/ with the real artwork; keep the same filenames.
const SERVICE_IMAGES = {
  repair: require('../../assets/services/repair.png'),
  sell: require('../../assets/services/sell.png'),
  buy: require('../../assets/services/buy.png'),
};

// Per-service visual config. Gradient palette mirrors the home-screen hero
// verticals so the customer keeps the same colour anchors (green=Repair,
// orange=Sell, blue=Buy) across every screen.
const SERVICE_THEME = {
  repair: {
    title: 'Repair Service',
    badge: 'Up to 30% OFF',
    gradient: ['#16A34A', '#15803D'],
    softBg: '#DCFCE7',
    accent: '#FFFFFF',
    Icon: Wrench,
  },
  sell: {
    title: 'Sell Device',
    badge: 'Instant Cash',
    gradient: ['#FF7A00', '#E56A00'],
    softBg: '#FFEDD5',
    accent: '#FFFFFF',
    Icon: Tag,
  },
  buy: {
    title: 'Buy Device',
    badge: 'Free Delivery',
    gradient: ['#2563EB', '#1D4ED8'],
    softBg: '#DBEAFE',
    accent: '#FFFFFF',
    Icon: ShoppingBag,
  },
  enquiry: {
    title: 'Service Enquiry',
    badge: 'Talk to us',
    gradient: ['#6D28D9', '#5B21B6'],
    softBg: '#EDE9FE',
    accent: '#FFFFFF',
    Icon: Headset,
  },
};

const TRUST_BADGES = [
  { key: 'rating', Icon: Star,        label: '4.7 Rated',      sub: 'by 25k+ users' },
  { key: 'sla',    Icon: ShieldCheck, label: '6 Month',        sub: 'warranty' },
  { key: 'pickup', Icon: Truck,       label: 'Free Pickup',    sub: '& delivery' },
];

export default function CategoryServiceMenuScreen({ navigation, route }) {
  const { categoryId, categoryCode, categoryName } = route.params || {};
  const deviceLabel = categoryName || 'Device';

  const options = [
    {
      key: 'repair',
      sub: `Book a repair for your ${deviceLabel.toLowerCase()}`,
      onPress: () =>
        navigation.navigate('RepairSelectDevice', { flow: 'REPAIR', categoryId, categoryCode, categoryName }),
    },
    {
      key: 'sell',
      sub: 'Get an instant quote and sell',
      onPress: () => navigation.navigate('SellSelectDevice', { flow: 'SELL', categoryId, categoryCode, categoryName }),
    },
    {
      key: 'buy',
      sub: 'Shop devices and accessories',
      onPress: () => navigation.navigate('BuyCategory', { categoryId, categoryName }),
    },
    {
      key: 'enquiry',
      sub: 'Chat or call our support team about your device',
      onPress: () => navigation.navigate('CustomerSupport'),
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: tokens.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Hero — soft tinted card with category name + descriptive copy.
            Matches the Swiggy "category hero" pattern at the top of a
            cuisine drill-down screen. */}
        <View className="px-4 pt-3 pb-1">
          <LinearGradient
            colors={[tokens.primarySoft, '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16 }}
          >
            <View className="flex-row items-center">
              <View
                className="h-12 w-12 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: tokens.card }}
              >
                <Smartphone size={22} color={tokens.primary} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[10px] font-extrabold"
                  style={{ color: tokens.primary, letterSpacing: 1.2 }}
                >
                  CATEGORY
                </Text>
                <Text className="text-[17px] font-extrabold text-text mt-0.5" numberOfLines={1}>
                  {deviceLabel}
                </Text>
                <Text className="text-[12px] text-text-muted mt-0.5" numberOfLines={2}>
                  What would you like to do with your {deviceLabel.toLowerCase()}?
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Section eyebrow — matches the Home feed's section header rhythm. */}
        <View className="flex-row items-center px-4 mt-5 mb-2.5">
          <Sparkles size={14} color={tokens.accent} />
          <Text className="text-[14px] font-extrabold text-text ml-1.5">
            Choose a service
          </Text>
        </View>

        {/* Service tiles — full-bleed gradient cards with hero artwork on
            the right and a CTA pill on the left, like Zomato's "explore" rail. */}
        <View className="px-4">
          {options.map((o) => {
            const cfg = SERVICE_THEME[o.key];
            const Icon = cfg.Icon;
            return (
              <Pressable
                key={o.key}
                onPress={o.onPress}
                className="mb-3 active:opacity-90"
                style={{
                  borderRadius: 22,
                  overflow: 'hidden',
                  shadowColor: '#0F172A',
                  shadowOpacity: 0.06,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 3,
                }}
              >
                <LinearGradient
                  colors={cfg.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ minHeight: 150 }}
                >
                  <View className="flex-row items-stretch p-4">
                    <View className="flex-1 pr-3">
                      <View
                        className="self-start rounded-full px-2.5 py-1 mb-2 flex-row items-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
                      >
                        <Text className="text-white text-[10px] font-extrabold" style={{ letterSpacing: 0.8 }}>
                          {cfg.badge}
                        </Text>
                      </View>
                      <Text
                        className="text-white font-extrabold"
                        style={{ fontSize: 18 }}
                        numberOfLines={1}
                      >
                        {cfg.title}
                      </Text>
                      <Text
                        className="text-white/85 text-[12px] mt-1"
                        numberOfLines={2}
                      >
                        {o.sub}
                      </Text>
                    </View>
                    {/* Hero artwork tile — uses the same SERVICE_IMAGES the
                        old screen referenced so the assets stay reusable. A
                        translucent white pad sits under the artwork to keep
                        the gradient readable behind transparent PNGs. */}
                    <View
                      className="rounded-2xl items-center justify-center overflow-hidden"
                      style={{
                        width: 110,
                        height: 110,
                        backgroundColor: 'rgba(255,255,255,0.18)',
                      }}
                    >
                      {SERVICE_IMAGES[o.key] ? (
                        <Image
                          source={SERVICE_IMAGES[o.key]}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Icon size={48} color="#FFFFFF" strokeWidth={1.8} />
                      )}
                      <View
                        className="absolute top-2 right-2 h-7 w-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                      >
                        <Icon size={14} color={cfg.gradient[1]} />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {/* Trust strip — three pill chips (rating / warranty / pickup) that
            give the screen the "thousands trust us" reassurance Zomato shows
            on restaurant details. Static copy — no nav. */}
        <View className="px-4 mt-2">
          <View
            className="flex-row rounded-2xl p-1.5"
            style={{ backgroundColor: tokens.card, borderWidth: 1, borderColor: tokens.border }}
          >
            {TRUST_BADGES.map((b, i) => {
              const Icon = b.Icon;
              return (
                <View
                  key={b.key}
                  className="flex-1 flex-row items-center px-2 py-2"
                  style={{
                    borderRightWidth: i < TRUST_BADGES.length - 1 ? 1 : 0,
                    borderRightColor: tokens.border,
                  }}
                >
                  <View
                    className="h-8 w-8 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: tokens.surfaceMuted }}
                  >
                    <Icon size={14} color={tokens.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-extrabold text-text" numberOfLines={1}>
                      {b.label}
                    </Text>
                    <Text className="text-[9px] text-text-muted" numberOfLines={1}>
                      {b.sub}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Footer reassurance — matches the Swiggy footer rhythm. */}
        <View className="items-center mt-5 px-6">
          <View
            className="flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: tokens.surfaceMuted }}
          >
            <ShieldCheck size={12} color={tokens.primary} />
            <Text className="text-[11px] font-bold text-text-muted ml-1.5">
              Verified shops · Secure payments
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
