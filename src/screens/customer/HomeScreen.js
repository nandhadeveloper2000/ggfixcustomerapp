import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  Bell,
  MapPin,
  ChevronDown,
  ChevronRight,
  Search,
  Wrench,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Headphones,
  Volume2,
  PercentCircle,
  Truck,
  IndianRupee,
  Star,
  Sparkles,
  MessageCircle,
  Headset,
  ArrowRight,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, EmptyState, Loader, ShopCard } from '../../components/rnr';
import { getDeviceCategories } from '../../api/masterData';
import { listNearbyShops } from '../../api/shops';
import { listAddresses } from '../../api/customer';
import { listMyOrders } from '../../api/orders';
import { getUnreadCount } from '../../api/notifications';
import { listChats, getCart } from '../../api/marketplace';
import { selectSession } from '../../store/authSlice';
import { useCustomerLocation } from '../../hooks/useCustomerLocation';
import { travelTimesFor } from '../../utils/travelTimes';
import { tokens } from '../../theme/colors';

// Icon fallback keyed by the admin-derived category CODE ("Mobile" -> MOBILE).
// Each tint colour also drives the circular tile background on the
// "What are you looking for?" rail so the home grid feels lively the way
// Swiggy / Zomato category rails do.
const CODE_META = {
  MOBILE:        { icon: Smartphone, color: tokens.primary,  tint: '#DCFCE7' },
  SMARTPHONE:    { icon: Smartphone, color: tokens.primary,  tint: '#DCFCE7' },
  LAPTOP:        { icon: Laptop,     color: '#6D28D9',       tint: '#EDE9FE' },
  TABLET:        { icon: Tablet,     color: '#0369A1',       tint: '#E0F2FE' },
  SMARTWATCH:    { icon: Watch,      color: '#B45309',       tint: '#FEF3C7' },
  SMARTWATCHES:  { icon: Watch,      color: '#B45309',       tint: '#FEF3C7' },
  WATCH:         { icon: Watch,      color: '#B45309',       tint: '#FEF3C7' },
  AUDIO:         { icon: Headphones, color: '#BE185D',       tint: '#FCE7F3' },
  AUDIO_DEVICES: { icon: Headphones, color: '#BE185D',       tint: '#FCE7F3' },
  SPEAKER:       { icon: Volume2,    color: '#047857',       tint: '#D1FAE5' },
  SPEAKERS:      { icon: Volume2,    color: '#047857',       tint: '#D1FAE5' },
};
const DEFAULT_META = { icon: Smartphone, color: tokens.primary, tint: '#DCFCE7' };

// Preferred display order for category tiles (backend returns them
// alphabetically). Unknown codes fall to the end, alphabetically.
const CATEGORY_ORDER = ['MOBILE', 'SMARTPHONE', 'LAPTOP', 'TABLET', 'SMARTWATCH', 'SMARTWATCHES', 'WATCH', 'AUDIO', 'AUDIO_DEVICES', 'AUDIO_DEVICE', 'SPEAKER', 'SPEAKERS'];
function sortByPreferredOrder(list) {
  const rank = (c) => {
    const i = CATEGORY_ORDER.indexOf((c.code || '').toUpperCase());
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  return [...list].sort((a, b) => {
    const d = rank(a) - rank(b);
    return d !== 0 ? d : (a.name || '').localeCompare(b.name || '');
  });
}

function imgUri(item) {
  if (!item) return null;
  const b64 = item.imageBase64 && String(item.imageBase64).trim();
  if (b64) return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
  const url = item.imageUrl && String(item.imageUrl).trim();
  return url || null;
}

// Hero promo carousel shown at the very top of the feed. The artwork on the
// right of each slide is assets/hero-banner.png — swap that single file to
// change the image for all slides (keep a transparent PNG for best results).
const HERO_BANNER_IMAGE = require('../../../assets/hero-banner.png');
const HERO_SLIDES = [
  {
    key: 'welcome',
    title1: 'Fast. Trusted.',
    title2: 'Tech Solutions',
    sub: 'Repair, Buy, Sell or Pickup –\nAll in one place!',
    cta: 'Explore Now',
    bg: ['#DCFCE7', '#BBF7D0'],
    route: 'Repair',
  },
  {
    key: 'repair-off',
    title1: 'Up to 30% Off',
    title2: 'Screen Repairs',
    sub: 'Book a doorstep repair today\nwith trusted local pros.',
    cta: 'Book Now',
    bg: ['#DBEAFE', '#BFDBFE'],
    route: 'Repair',
  },
  {
    key: 'sell-earn',
    title1: 'Sell & Earn',
    title2: 'Best Resale Value',
    sub: 'Get an instant quote for\nyour old device.',
    cta: 'Sell Now',
    bg: ['#FFEDD5', '#FED7AA'],
    route: 'Sell',
  },
];

// Hero verticals use a marketplace-style palette: green stays the primary
// brand signal, while each action gets a distinct soft color cue.
const HERO_VERTICALS = [
  {
    key: 'repair',
    title: 'Repair',
    sub: 'Doorstep & in-shop repair service',
    badge: null,
    icon: Wrench,
    bg: ['#FFFFFF', '#ECFDF5'],
    accent: tokens.primary,
    tint: tokens.primarySoft,
    border: '#BBF7D0',
    route: 'Repair',
  },
  {
    key: 'sell',
    title: 'Sell',
    sub: 'Get the best resale value',
    badge: 'BEST VALUE',
    icon: Repeat,
    bg: ['#FFFFFF', '#EFF6FF'],
    accent: '#2563EB',
    tint: '#DBEAFE',
    border: '#BFDBFE',
    route: 'Sell',
  },
  {
    key: 'buy',
    title: 'Buy',
    sub: 'Accessories & more',
    badge: 'SHOP',
    icon: ShoppingBag,
    bg: ['#FFFFFF', '#FFF7ED'],
    accent: tokens.accent,
    tint: tokens.accentSoft,
    border: '#FED7AA',
    route: 'Buy',
  },
  {
    key: 'pickup',
    title: 'Pickup',
    sub: 'Doorstep collection',
    badge: 'DOORSTEP',
    icon: Truck,
    bg: ['#FFFFFF', '#F5F3FF'],
    accent: '#7C3AED',
    tint: '#EDE9FE',
    border: '#DDD6FE',
    route: 'RepairSelectDevice',
    params: { flow: 'REPAIR' },
  },
];

const ENQUIRY_TILE = {
  key: 'enquiry',
  title: 'Service Enquiry',
  sub: 'Chat with nearby repair shops — pick one and message directly',
  icon: Headset,
  bg: ['#FFFFFF', '#F0FDFA'],
  accent: '#0F766E',
  tint: '#CCFBF1',
  border: '#99F6E4',
  route: 'ChatInbox',
};

// Rotating search-bar placeholders. Mirrors Swiggy/Zomato's
// "Search 'biryani'", "Search 'pizza'", … cycle so the search bar stays
// alive instead of looking like a static prompt.
const SEARCH_HINTS = ['Search "iPhone screen"', 'Search "Samsung battery"', 'Search "Laptop fan"', 'Search "Buy headphones"'];

const DONE_STATES = new Set(['COMPLETED', 'CANCELLED', 'DELIVERED', 'CLOSED', 'REJECTED']);

// Keep content readable on tablets/large screens.
const MAX_CONTENT_W = 720;

export default function HomeScreen({ navigation }) {
  const session = useSelector(selectSession);
  const { lat, lng, addressLabel: gpsLabel, source: locSource, loading: locating, detectGps } = useCustomerLocation();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [address, setAddress] = useState(null);
  const [categories, setCategories] = useState([]);
  const [ongoing, setOngoing] = useState(null);
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchHintIdx, setSearchHintIdx] = useState(0);

  const load = useCallback(async () => {
    try {
      const [s, a, c, orders, unreadCount, chats, cart] = await Promise.all([
        listNearbyShops({
          lat: lat ?? undefined,
          lng: lng ?? undefined,
          radiusKm: lat != null && lng != null ? 20 : undefined,
        }).catch(() => []),
        listAddresses().catch(() => []),
        getDeviceCategories().catch(() => []),
        listMyOrders({ orderType: 'REPAIR' }).catch(() => []),
        getUnreadCount().catch(() => 0),
        listChats().catch(() => []),
        getCart().catch(() => []),
      ]);
      setShops(s);
      setUnread(unreadCount || 0);
      setChatUnread((chats || []).reduce((n, t) => n + (t.unreadCount || 0), 0));
      setCartCount((cart || []).reduce((n, it) => n + (it.quantity || 1), 0));
      setCategories(sortByPreferredOrder((c || []).filter((x) => x.isActive !== false)));
      const def = a.find((x) => x.isDefault) || a[0] || null;
      setAddress(def);
      const active = (orders || []).find((o) => !DONE_STATES.has(String(o.status).toUpperCase()));
      setOngoing(active || (orders || [])[0] || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lat, lng]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Rotate the search placeholder every 2.5s — keeps the home screen visually
  // alive (Swiggy / Zepto pattern). Pause when the screen is unmounted.
  const hintIdxRef = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      hintIdxRef.current = (hintIdxRef.current + 1) % SEARCH_HINTS.length;
      setSearchHintIdx(hintIdxRef.current);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <Loader label="Loading your home..." />;

  const firstName = (session?.fullName || 'Customer').split(' ')[0];
  const gpsResolved = gpsLabel && locSource && locSource !== 'default';
  const locationTop = address
    ? (address.label || address.tag || 'Home')
    : gpsResolved ? 'Current Location' : 'Set Location';
  // Include the pincode at the end of the address detail line so the
  // header looks like "29a Imperial Road, Cuddalore - 607002" instead of
  // dropping the PIN the customer entered when they saved the address.
  const locationDetail = address
    ? (() => {
        const parts = [address.line1 || address.locality, address.city].filter(Boolean);
        const head = parts.join(', ');
        const pin = address.pincode ? String(address.pincode).trim() : '';
        if (head && pin) return `${head} - ${pin}`;
        return head || pin || '';
      })()
    : locating ? 'Detecting…'
    : gpsResolved ? gpsLabel
    : 'Tap to detect or pick';

  const onLocationPress = async () => {
    const ok = await detectGps();
    if (!ok) navigation.navigate('ManageAddress');
  };

  const contentW = Math.min(width, MAX_CONTENT_W);
  const isTablet = width >= 700;
  const centered = { width: '100%', maxWidth: MAX_CONTENT_W, alignSelf: 'center' };
  const avatarSize = isTablet ? 44 : 38;

  // Vertical hero tiles render in a 2×2 grid on phones, single row on tablets.
  const heroCols = isTablet ? HERO_VERTICALS.length : 2;
  const heroGap = 10;
  const heroPadH = 16;
  const heroTileW = Math.floor((contentW - heroPadH * 2 - heroGap * (heroCols - 1)) / heroCols);

  const openCategory = (c) => navigation.navigate('CategoryServiceMenu', {
    categoryId: c.id,
    categoryCode: (c.code || '').toUpperCase(),
    categoryName: c.name,
  });

  return (
    <View className="flex-1" style={{ backgroundColor: tokens.background }}>
      {/* Top app bar — Swiggy/Zomato pattern: bold location header above a
          sticky-feeling search row. Gradient adds the vibrancy the original
          flat white header lacked. */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: tokens.card }}>
        <LinearGradient
          colors={[tokens.card, tokens.card]}
          style={{ paddingBottom: 0 }}
        >
          <View className="flex-row items-center px-4 pt-2.5 pb-2" style={centered}>
            {/* Avatar — moved to the far left; taps through to Profile. */}
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              className="active:opacity-80 mr-2.5"
            >
              <Avatar source={session?.profileImageUrl} fallback={firstName} size={avatarSize} />
            </Pressable>
            {/* Location pill — uppercase eyebrow + bold detail line, like
                Swiggy's "DELIVER TO" header. */}
            <Pressable
              onPress={onLocationPress}
              className="flex-1 active:opacity-80 mr-2"
            >
              <View className="flex-row items-center">
                <MapPin size={13} color={tokens.primary} style={{ marginRight: 3 }} />
                <Text className="text-[13.5px] font-extrabold text-text mr-1" numberOfLines={1}>
                  {locationTop}
                </Text>
                <ChevronDown size={13} color={tokens.text} />
              </View>
              <Text className="text-[11px] text-text-muted mt-0.5" numberOfLines={1}>
                {locationDetail}
              </Text>
            </Pressable>
            {/* Right-side actions: message, cart, notifications. */}
            <Pressable
              onPress={() => navigation.navigate('ChatInbox')}
              className="h-9 w-9 rounded-full items-center justify-center active:opacity-80 mr-1.5"
              style={{ backgroundColor: tokens.surfaceMuted }}
            >
              <MessageCircle size={18} color={tokens.text} />
              {chatUnread > 0 ? (
                <View
                  className="absolute -top-0.5 -right-0.5 rounded-full min-w-[16px] h-4 px-1 items-center justify-center"
                  style={{ backgroundColor: tokens.primary }}
                >
                  <Text className="text-white text-[9px] font-bold">{chatUnread > 9 ? '9+' : chatUnread}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('MyCart')}
              className="h-9 w-9 rounded-full items-center justify-center active:opacity-80 mr-1.5"
              style={{ backgroundColor: tokens.surfaceMuted }}
            >
              <ShoppingCart size={18} color={tokens.text} />
              {cartCount > 0 ? (
                <View
                  className="absolute -top-0.5 -right-0.5 rounded-full min-w-[16px] h-4 px-1 items-center justify-center"
                  style={{ backgroundColor: tokens.accent }}
                >
                  <Text className="text-white text-[9px] font-bold">{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              className="h-9 w-9 rounded-full items-center justify-center active:opacity-80"
              style={{ backgroundColor: tokens.surfaceMuted }}
            >
              <Bell size={18} color={tokens.text} />
              {unread > 0 ? (
                <View
                  className="absolute -top-0.5 -right-0.5 rounded-full min-w-[16px] h-4 px-1 items-center justify-center"
                  style={{ backgroundColor: tokens.danger }}
                >
                  <Text className="text-white text-[9px] font-bold">{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {/* Search row — placeholder rotates every 2.5s (Swiggy/Zepto vibe). */}
          <View className="px-4 pb-3" style={centered}>
            <Pressable
              onPress={() => navigation.navigate('Repair')}
              className="flex-row items-center rounded-2xl px-4 py-3.5 active:opacity-80"
              style={{ backgroundColor: tokens.surfaceMuted, borderWidth: 1, borderColor: tokens.border }}
            >
              <Search size={18} color={tokens.textSubtle} />
              <Text className="text-[13px] text-text-muted ml-2.5 flex-1" numberOfLines={1}>
                {SEARCH_HINTS[searchHintIdx]}
              </Text>
              <View
                className="ml-2 h-5 w-px"
                style={{ backgroundColor: tokens.border }}
              />
              <Sparkles size={16} color={tokens.accent} style={{ marginLeft: 10 }} />
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={centered}>
          {/* Hero promo carousel — full-bleed banner with device artwork,
              headline, CTA and paging dots (Swiggy/Zomato top-strip vibe). */}
          <HeroBanner navigation={navigation} contentW={contentW} />

          {/* Vertical hero — Repair / Sell / Buy / Pickup pill tiles in a
              2x2 grid with soft commerce colors. Green is reserved for the
              brand and primary action states. */}
          <View
            className="flex-row flex-wrap mt-3"
            style={{ paddingHorizontal: heroPadH, columnGap: heroGap, rowGap: heroGap }}
          >
            {HERO_VERTICALS.map((v) => {
              const Icon = v.icon;
              return (
                <Pressable
                  key={v.key}
                  onPress={() => navigation.navigate(v.route, v.params)}
                  style={{ width: heroTileW }}
                  className="active:opacity-90"
                >
                  <LinearGradient
                    colors={v.bg}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 18,
                      padding: 14,
                      minHeight: 124,
                      borderWidth: 1,
                      borderColor: v.border,
                      overflow: 'hidden',
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View
                        className="h-9 w-9 rounded-full items-center justify-center"
                        style={{ backgroundColor: v.tint }}
                      >
                        <Icon size={18} color={v.accent} />
                      </View>
                      {v.badge ? (
                        <View
                          className="rounded-full px-2 py-1"
                          style={{ backgroundColor: v.tint }}
                        >
                          <Text style={{ color: v.accent, fontWeight: '900', fontSize: 8.5 }} numberOfLines={1}>
                            {v.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ color: tokens.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
                      {v.title}
                    </Text>
                    <Text style={{ color: tokens.textMuted, fontSize: 11, marginTop: 2, paddingRight: 34 }} numberOfLines={2}>
                      {v.sub}
                    </Text>
                    {/* Round accent arrow button, bottom-right (screenshot style). */}
                    <View
                      style={{
                        position: 'absolute',
                        right: 12,
                        bottom: 12,
                        height: 30,
                        width: 30,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: v.accent,
                      }}
                    >
                      <ArrowRight size={16} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          {/* Service Enquiry — full-width support card right under the 2x2
              grid. Routes to CustomerSupport which already wires up Call /
              WhatsApp / Email. */}
          <View style={{ paddingHorizontal: heroPadH, marginTop: heroGap }}>
            <Pressable
              onPress={() => navigation.navigate(ENQUIRY_TILE.route)}
              className="active:opacity-90"
            >
              <LinearGradient
                colors={ENQUIRY_TILE.bg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: ENQUIRY_TILE.border,
                }}
              >
                <View
                  className="h-11 w-11 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: ENQUIRY_TILE.tint }}
                >
                  <ENQUIRY_TILE.icon size={20} color={ENQUIRY_TILE.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tokens.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
                    {ENQUIRY_TILE.title}
                  </Text>
                  <Text style={{ color: tokens.textMuted, fontSize: 11.5, marginTop: 2 }} numberOfLines={2}>
                    {ENQUIRY_TILE.sub}
                  </Text>
                </View>
                <View
                  className="h-8 w-8 rounded-full items-center justify-center ml-2"
                  style={{ backgroundColor: ENQUIRY_TILE.tint }}
                >
                  <ChevronRight size={18} color={ENQUIRY_TILE.accent} />
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Ongoing booking — promoted card right under the verticals so a
              repeat customer hits "their" booking without scrolling. */}
          {ongoing ? (
            <View className="px-4 mt-4">
              <Pressable
                onPress={() => {
                  // Prefer the ticketId payload (shop-created bookings) so the
                  // ongoing card lands on the polished Service Ticket Details
                  // screen which carries the latest technician photos +
                  // "Issue Verified & Updated" attachments directly on the
                  // ticket response. Fall back to the booking detail screen
                  // when the ongoing order is pickup-only and has no ticketId
                  // yet; final fallback is the My Orders tab.
                  const ticketRef = ongoing.payload?.ticketId;
                  if (ticketRef) {
                    navigation.navigate('ServiceTicketDetails', { ticketId: ticketRef, fromOrders: true });
                    return;
                  }
                  const bookingRef = ongoing.payload?.bookingId || ongoing.referenceId;
                  if (bookingRef) navigation.navigate('RepairOrderDetails', { bookingId: bookingRef });
                  else navigation.navigate('MyOrders');
                }}
                className="rounded-2xl p-3 active:opacity-90 flex-row items-center"
                style={{ backgroundColor: tokens.card, borderWidth: 1, borderColor: tokens.border }}
              >
                {(() => {
                  // Best-effort device photo. The customer-order payload does
                  // not yet carry an image URL, so this falls back to the icon
                  // until the backend includes one of these fields.
                  const p = ongoing.payload || {};
                  const thumb = p.deviceImageUrl || p.deviceImage || p.imageUrl || p.masterImageUrl || ongoing.imageUrl || null;
                  return thumb ? (
                    <Image
                      source={{ uri: thumb }}
                      className="mr-3"
                      style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: tokens.primarySoft }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="h-12 w-12 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: tokens.primarySoft }}
                    >
                      <Smartphone size={22} color={tokens.primary} />
                    </View>
                  );
                })()}
                <View className="flex-1 pr-2">
                  <Text className="text-[10px] font-extrabold mb-0.5" style={{ color: tokens.primary, letterSpacing: 1 }}>
                    ONGOING
                  </Text>
                  <Text className="text-[13px] font-extrabold text-text" numberOfLines={1}>
                    {ongoing.payload?.title || `Booking #${ongoing.orderNumber || ''}`}
                  </Text>
                  <Text className="text-[11px] text-text-muted mt-0.5" numberOfLines={1}>
                    {ongoing.payload?.deviceName || ongoing.orderType}
                    {ongoing.createdAt ? ` · ${new Date(ongoing.createdAt).toLocaleDateString()}` : ''}
                  </Text>
                </View>
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{ backgroundColor: tokens.primarySoft }}
                >
                  <Text className="text-[10px] font-extrabold" style={{ color: tokens.primary }}>
                    {(ongoing.status || 'ACTIVE').replace(/_/g, ' ')}
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}

          {/* What are you looking for? — white card with EVERY published
              category in a fixed 3-column wrap grid. No "See all" action,
              no horizontal scroll — the customer sees the full list without
              scrolling sideways. Falls back to the empty state when the
              admin hasn't published any categories yet. */}
          <SectionHeader
            title="What are you looking for?"
            action="View all"
            onAction={() => navigation.navigate('Repair')}
          />
          {categories.length === 0 ? (
            <View className="px-4">
              <EmptyState title="No categories yet" description="Device categories will appear here once published." />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 2, paddingBottom: 4 }}
            >
              {categories.map((c) => {
                const meta = CODE_META[(c.code || '').toUpperCase()] || DEFAULT_META;
                const Icon = meta.icon;
                const uri = imgUri(c);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => openCategory(c)}
                    className="items-center active:opacity-80"
                    style={{ width: 78, marginHorizontal: 4 }}
                  >
                    <View
                      className="rounded-full items-center justify-center overflow-hidden"
                      style={{
                        width: 66,
                        height: 66,
                        backgroundColor: meta.tint,
                        borderWidth: 1,
                        borderColor: tokens.border,
                      }}
                    >
                      {uri ? (
                        <Image
                          source={{ uri }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Icon size={26} color={meta.color} />
                      )}
                    </View>
                    <Text
                      className="text-[11px] font-bold text-text text-center mt-2"
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Nearby shops — image-led ShopCard list. Heading mirrors Zomato's
              "Restaurants in <neighbourhood>" copy so the screen reads like a
              local discovery feed. */}
          {shops.length > 0 ? (
            <>
              <SectionHeader
                title={address ? `Repair shops in ${address.locality || address.city || 'your area'}` : 'Top repair shops near you'}
                action="See all"
                onAction={() => navigation.navigate('NearbyShops')}
              />
              <View className="px-4">
                {shops.slice(0, 5).map((s) => (
                  <View key={s.id} className="mb-2.5">
                    <ShopCard
                      name={s.name}
                      address={s.address || s.city}
                      rating={s.rating || 4.6}
                      reviews={s.reviewCount || 120}
                      distance={s.distanceKm}
                      travelTimes={travelTimesFor(s.distanceKm)}
                      open
                      onPress={() => navigation.navigate('ShopDetails', { shopId: s.id })}
                    />
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Footer brand line — same "best in town" social proof Swiggy uses
              at the bottom of the home feed. Static copy, no nav. */}
          <View className="items-center mt-6 px-6">
            <View
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: tokens.surfaceMuted }}
            >
              <Star size={12} color={tokens.accent} fill={tokens.accent} />
              <Text className="text-[11px] font-bold text-text-muted ml-1.5">
                Trusted by repair pros across India
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Top-of-feed promo carousel. Paging horizontal scroll over HERO_SLIDES with a
// shared banner image (assets/hero-banner.png) and animated dot indicators.
function HeroBanner({ navigation, contentW }) {
  const [idx, setIdx] = useState(0);
  const onScroll = (e) => {
    const w = e.nativeEvent.layoutMeasurement.width || contentW || 1;
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    if (i !== idx) setIdx(i);
  };
  return (
    <View className="mt-3">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {HERO_SLIDES.map((s) => (
          <View key={s.key} style={{ width: contentW }} className="px-4">
            <Pressable
              onPress={() => navigation.navigate(s.route, s.params)}
              className="active:opacity-95"
            >
              <LinearGradient
                colors={s.bg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  minHeight: 156,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 18,
                }}
              >
                <View style={{ flex: 1.35, paddingRight: 6 }}>
                  <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 21, lineHeight: 26 }}>
                    {s.title1}
                  </Text>
                  <Text style={{ color: tokens.primary, fontWeight: '900', fontSize: 21, lineHeight: 26 }}>
                    {s.title2}
                  </Text>
                  <Text style={{ color: tokens.textMuted, fontSize: 12, marginTop: 8, lineHeight: 17 }}>
                    {s.sub}
                  </Text>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: tokens.primary,
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      marginTop: 14,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12.5, marginRight: 4 }}>
                      {s.cta}
                    </Text>
                    <ArrowRight size={15} color="#FFFFFF" />
                  </View>
                </View>
                <Image source={HERO_BANNER_IMAGE} style={{ flex: 1, height: 132 }} resizeMode="contain" />
              </LinearGradient>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {HERO_SLIDES.length > 1 ? (
        <View className="flex-row justify-center items-center mt-2.5">
          {HERO_SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === idx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                marginHorizontal: 3,
                backgroundColor: i === idx ? tokens.primary : tokens.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Local SectionHeader so the heading rhythm (16/14, accent action) stays
// consistent across rails without depending on the legacy rnr SectionHeader
// signature.
function SectionHeader({ title, action, onAction }) {
  return (
    <View className="flex-row items-end justify-between px-4 mt-5 mb-2.5">
      <Text className="text-[15px] font-extrabold text-text" numberOfLines={1}>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} className="active:opacity-70 flex-row items-center">
          <Text
            className="text-[12px] font-extrabold mr-0.5"
            style={{ color: tokens.primary }}
          >
            {action}
          </Text>
          <ChevronRight size={14} color={tokens.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
