import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingCart, Bell, Search, MapPin, ChevronDown, Tag,
  BadgeCheck, Truck, RotateCcw,
} from 'lucide-react-native';
import { OfferBanner, EmptyState, Loader } from '../../../components/rnr';
import { getDeviceCategories } from '../../../api/masterData';

const GREEN = '#16A34A';
const GREEN_LIGHT = '#22C55E';
const GREEN_DARK = '#15803D';

const CODE_META = {
  MOBILE:        { bg: '#DCFCE7', emoji: '📱', sub: 'iPhone, Android · all brands' },
  SMARTPHONE:    { bg: '#DCFCE7', emoji: '📱', sub: 'iPhone, Android · all brands' },
  LAPTOP:        { bg: '#F5F3FF', emoji: '💻', sub: 'Apple, Dell, HP, Lenovo' },
  SMARTWATCH:    { bg: '#FFFBEB', emoji: '⌚', sub: 'Apple Watch, Wear OS' },
  SMARTWATCHES:  { bg: '#FFFBEB', emoji: '⌚', sub: 'Apple Watch, Wear OS' },
  TABLET:        { bg: '#F0F9FF', emoji: '📲', sub: 'iPad, Galaxy Tab' },
  AUDIO:         { bg: '#FFF1F2', emoji: '🎧', sub: 'Earbuds, headphones' },
  AUDIO_DEVICES: { bg: '#FFF1F2', emoji: '🎧', sub: 'Earbuds, headphones' },
};
const DEFAULT_META = { bg: '#DCFCE7', emoji: '📱', sub: 'Tap to see all listings' };

function imgUri(item) {
  if (!item) return null;
  const b64 = item.imageBase64 && String(item.imageBase64).trim();
  if (b64) return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
  const url = item.imageUrl && String(item.imageUrl).trim();
  return url || null;
}

const PROMISES = [
  { icon: BadgeCheck, label: 'Verified Shops', tint: '#DCFCE7', color: GREEN_DARK },
  { icon: Truck,      label: 'Free Delivery',  tint: '#FFEDD5', color: '#C2410C' },
  { icon: RotateCcw,  label: '7-day Returns',  tint: '#FEF3C7', color: '#B45309' },
];

function columnsFor(width) {
  if (width >= 1000) return 4;
  if (width >= 720)  return 3;
  if (width >= 360)  return 2;
  return 1;
}

export default function BuyHomeScreen({ navigation }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    (async () => {
      try {
        const list = await getDeviceCategories();
        setCats((list || []).filter((c) => c.isActive !== false));
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader label="Loading categories..." />;

  const padH = 16;
  const numCols = columnsFor(width);
  const gridGap = 12;
  const cardW = Math.floor((width - padH * 2 - gridGap * (numCols - 1)) / numCols);
  const imgH = Math.round(cardW * 0.7);

  const openCategory = (c) => {
    navigation.navigate('BuyListing', {
      categoryId: c.id,
      categoryCode: (c.code || '').toUpperCase(),
      categoryName: c.name,
      title: c.name,
    });
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={['top']} style={{ backgroundColor: GREEN_DARK }}>
        <LinearGradient
          colors={[GREEN_DARK, GREEN, GREEN_LIGHT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 10,
            paddingBottom: 16,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <View style={{ paddingHorizontal: padH }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MapPin size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, marginLeft: 4, letterSpacing: 0.5 }}>
                    SHOP REFURBISHED
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: '#fff', fontWeight: '700', fontSize: 15, maxWidth: width - 160 }}
                  >
                    Deliver to your doorstep
                  </Text>
                  <ChevronDown size={16} color="#fff" style={{ marginLeft: 4 }} />
                </View>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                style={{
                  height: 36, width: 36, borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <Bell size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('MyCart')}
                style={{
                  height: 36, width: 36, borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ShoppingCart size={18} color="#fff" />
              </Pressable>
            </View>

            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, letterSpacing: -0.3 }}>
              Pick a category to begin
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 3 }}>
              Best deals · Verified shops · Quality assured
            </Text>

            <Pressable
              onPress={() => navigation.navigate('BuyListing', {})}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#fff', borderRadius: 16,
                paddingHorizontal: 14, paddingVertical: 12,
                marginTop: 16,
                shadowColor: '#0F172A', shadowOpacity: 0.12,
                shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
              }}
            >
              <Search size={18} color={GREEN} />
              <Text
                numberOfLines={1}
                style={{ flex: 1, marginLeft: 10, color: '#64748B', fontSize: 14 }}
              >
                Search mobiles, accessories & more
              </Text>
              <View style={{ backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: GREEN_DARK, fontSize: 11, fontWeight: '800' }}>DEALS</Text>
              </View>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={{ flexDirection: 'row', paddingHorizontal: padH, marginTop: 16 }}>
          {PROMISES.map((p) => {
            const Icon = p.icon;
            return (
              <View
                key={p.label}
                style={{
                  flex: 1, marginHorizontal: 4,
                  backgroundColor: '#fff', borderRadius: 14,
                  paddingVertical: 12, paddingHorizontal: 6,
                  alignItems: 'center',
                  borderWidth: 1, borderColor: '#F1F5F9',
                }}
              >
                <View
                  style={{
                    height: 32, width: 32, borderRadius: 16,
                    backgroundColor: p.tint,
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Icon size={16} color={p.color} />
                </View>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 10.5, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}
                >
                  {p.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: padH, marginTop: 18 }}>
          <OfferBanner
            badge="LIMITED TIME"
            title="Up to 40% OFF refurbished"
            subtitle="Verified condition · 6-month warranty on select devices."
            cta="Shop deals"
            palette="emerald"
            onPress={() => navigation.navigate('BuyListing', {})}
          />
        </View>

        <View style={{ paddingHorizontal: padH, marginTop: 22, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
              Shop by category
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Tap a category to see listings
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#DCFCE7', borderRadius: 999,
              paddingHorizontal: 10, paddingVertical: 4,
            }}
          >
            <Text style={{ color: GREEN_DARK, fontSize: 11, fontWeight: '800' }}>
              {cats.length} options
            </Text>
          </View>
        </View>

        {cats.length === 0 ? (
          <View style={{ paddingHorizontal: padH }}>
            <EmptyState title="No categories yet" description="The admin hasn't published any device categories." />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: padH }}>
            {cats.map((c, i) => {
              const code = (c.code || '').toUpperCase();
              const meta = CODE_META[code] || DEFAULT_META;
              const uri = imgUri(c);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => openCategory(c)}
                  style={{
                    width: cardW,
                    marginLeft: i % numCols === 0 ? 0 : gridGap,
                    marginBottom: gridGap,
                    backgroundColor: '#fff',
                    borderRadius: 18,
                    padding: 10,
                    borderWidth: 1, borderColor: '#F1F5F9',
                    shadowColor: '#0F172A', shadowOpacity: 0.05,
                    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: '100%', height: imgH, borderRadius: 14,
                      backgroundColor: uri ? '#FFFFFF' : meta.bg,
                      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      marginBottom: 10,
                    }}
                  >
                    {uri ? (
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    ) : (
                      <Text style={{ fontSize: Math.min(44, imgH * 0.5) }}>{meta.emoji}</Text>
                    )}
                    <View
                      style={{
                        position: 'absolute', top: 8, left: 8,
                        backgroundColor: '#DCFCE7', borderRadius: 999,
                        paddingHorizontal: 8, paddingVertical: 3,
                        flexDirection: 'row', alignItems: 'center',
                      }}
                    >
                      <Tag size={10} color={GREEN_DARK} />
                      <Text style={{ color: GREEN_DARK, fontSize: 9.5, fontWeight: '800', marginLeft: 3 }}>
                        BEST PRICE
                      </Text>
                    </View>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}
                  >
                    {c.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}
                  >
                    {meta.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
