import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { confirm, notify } from '../../../components/confirm';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  MapPin,
  FileText,
  Info,
  HelpCircle,
  LifeBuoy,
  LogOut,
  ChevronRight,
  Pencil,
  ShieldCheck,
  Bell,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearSession as clearAuth, selectSession } from '../../../store/authSlice';
import { clearSession } from '../../../auth/session';
import { Avatar } from '../../../components/rnr';

const GREEN = '#16A34A';
const GREEN_LIGHT = '#22C55E';
const GREEN_DARK = '#15803D';

const ACCOUNT = [
  { label: 'My Orders',         icon: ShoppingBag,  to: 'MyOrders',      color: GREEN_DARK, bg: '#DCFCE7' },
  { label: 'My Cart',           icon: ShoppingCart, to: 'MyCart',        color: '#C2410C',  bg: '#FFEDD5' },
  { label: 'Manage My Device',  icon: Smartphone,   to: 'ManageDevice',  color: '#7C3AED',  bg: '#F5F3FF' },
  { label: 'Manage Addresses',  icon: MapPin,       to: 'ManageAddress', color: '#0369A1',  bg: '#F0F9FF' },
];

const SUPPORT = [
  { label: 'Customer Support',   icon: LifeBuoy,   to: 'CustomerSupport', color: '#B45309', bg: '#FEF3C7' },
  { label: 'FAQ',                icon: HelpCircle, to: 'Faq',             color: GREEN_DARK, bg: '#DCFCE7' },
  { label: 'About Us',           icon: Info,       to: 'AboutUs',         color: '#7C3AED',  bg: '#F5F3FF' },
  { label: 'Terms & Conditions', icon: FileText,   to: 'Terms',           color: '#475569',  bg: '#F1F5F9' },
];

function Row({ item, onPress, last, right }) {
  const Icon = item.icon;
  return (
    <Pressable onPress={onPress} android_ripple={{ color: '#F1F5F9' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <View
          style={{
            height: 36, width: 36, borderRadius: 18,
            backgroundColor: item.bg,
            alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Icon size={16} color={item.color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}
          >
            {item.label}
          </Text>
        </View>
        {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
        <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation, onLogout: parentLogout }) {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);

  const onLogout = async () => {
    // Prefer the logout passed from RootNavigator — it both clears AsyncStorage
    // AND updates RootNavigator's local session useState, which is what
    // actually flips the navigator back to the LoginScreen. Falling back to a
    // local clearSession/dispatch only would leave the user stuck on Profile
    // because RootNavigator wouldn't notice.
    const ok = await confirm({
      title: 'Log out',
      message: 'Are you sure?',
      confirmText: 'Log out',
      destructive: true,
    });
    if (!ok) return;
    if (parentLogout) {
      await parentLogout();
    } else {
      await clearSession();
      dispatch(clearAuth());
    }
    notify('Logged out', '', { preset: 'done' });
  };

  const name = session?.fullName || 'Welcome User';
  const mobile = session?.mobile || session?.email || '';

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: GREEN_DARK }}>
        <LinearGradient
          colors={[GREEN_DARK, GREEN, GREEN_LIGHT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 12,
            paddingBottom: 22,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Avatar fallback={name} size={52} className="border-2 border-white/40" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                {name}
              </Text>
              {mobile ? (
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>
                  {mobile}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999,
                    paddingHorizontal: 8, paddingVertical: 3,
                  }}
                >
                  <ShieldCheck size={10} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '800', marginLeft: 4, letterSpacing: 0.5 }}>
                    VERIFIED
                  </Text>
                </View>
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
              onPress={() => navigation.navigate('EditProfile')}
              style={{
                height: 36, width: 36, borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Pencil size={16} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <Text
          style={{
            fontSize: 10.5, fontWeight: '800', color: '#64748B',
            paddingHorizontal: 20, marginTop: 18, marginBottom: 8, letterSpacing: 1.2,
          }}
        >
          ACCOUNT
        </Text>
        <View
          style={{
            marginHorizontal: 16, backgroundColor: '#fff',
            borderRadius: 18, overflow: 'hidden',
            borderWidth: 1, borderColor: '#F1F5F9',
            shadowColor: '#0F172A', shadowOpacity: 0.04,
            shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
          }}
        >
          {ACCOUNT.map((it, idx) => (
            <Row
              key={it.label}
              item={it}
              onPress={() => navigation.navigate(it.to)}
              last={idx === ACCOUNT.length - 1}
            />
          ))}
        </View>

        <Text
          style={{
            fontSize: 10.5, fontWeight: '800', color: '#64748B',
            paddingHorizontal: 20, marginTop: 18, marginBottom: 8, letterSpacing: 1.2,
          }}
        >
          SUPPORT
        </Text>
        <View
          style={{
            marginHorizontal: 16, backgroundColor: '#fff',
            borderRadius: 18, overflow: 'hidden',
            borderWidth: 1, borderColor: '#F1F5F9',
            shadowColor: '#0F172A', shadowOpacity: 0.04,
            shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
          }}
        >
          {SUPPORT.map((it, idx) => (
            <Row
              key={it.label}
              item={it}
              onPress={() => navigation.navigate(it.to)}
              last={idx === SUPPORT.length - 1}
            />
          ))}
        </View>

        <Pressable
          onPress={onLogout}
          android_ripple={{ color: '#FEE2E2' }}
          style={{ marginHorizontal: 16, marginTop: 18 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <View
              style={{
                height: 32, width: 32, borderRadius: 16,
                backgroundColor: '#FEE2E2',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <LogOut size={16} color="#DC2626" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#DC2626', letterSpacing: 0.2 }}>
              Log out
            </Text>
          </View>
        </Pressable>

        <Text style={{ textAlign: 'center', fontSize: 10.5, color: '#94A3B8', marginTop: 18 }}>
          App Version 1.0.1
        </Text>
        <Text style={{ textAlign: 'center', fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
          Made with ❤️ in India
        </Text>
      </ScrollView>
    </View>
  );
}
