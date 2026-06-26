import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { Loader, PrimaryButton, OutlineButton } from '../../../components/ui';
import { getShop, listNearbyShops } from '../../../api/shops';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { height: 200, backgroundColor: '#E5E7EB' },
  openTag: { position: 'absolute', left: 10, top: 10, backgroundColor: '#16A34A', color: '#fff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 11, fontWeight: '700' },
  body: { padding: 16 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  addr: { fontSize: 13, color: colors.text, marginTop: 8 },
  row: { flexDirection: 'row', marginTop: 16 },
  serviceRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  serviceTile: { width: '46%', margin: '2%', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  serviceText: { marginLeft: 8, fontSize: 13, color: colors.text, fontWeight: '600' },
});

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params || {};
  const [shop, setShop] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [s, n] = await Promise.all([getShop(shopId), listNearbyShops().catch(() => [])]);
        setShop(s);
        setNearby(n.filter((x) => x.id !== shopId));
      } catch (_) {}
      setLoading(false);
    })();
  }, [shopId]);
  if (loading) return <Loader />;
  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}><Text style={styles.openTag}>Open Now</Text></View>
      <View style={styles.body}>
        <Text style={styles.name}>{shop?.name}</Text>
        <Text style={styles.addr}>Shop Address: {shop?.address}</Text>
        {shop?.phone ? <Text style={styles.addr}>Ph: {shop.phone}</Text> : null}
        <View style={styles.row}>
          <PrimaryButton title="📞 Call Shop" style={{ flex: 1, marginRight: 6 }} onPress={() => Linking.openURL(`tel:${shop?.phone || ''}`)} />
          <OutlineButton title="📍 Get Directions" style={{ flex: 1, marginLeft: 6 }} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Open</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Monday - Saturday</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Timings</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{shop?.hoursText || '09:30 AM to 09:00 PM'}</Text>
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Ratings</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{shop?.rating || '5.0'} ★★★★★</Text>
        </View>
        <Text style={{ marginTop: 16, fontWeight: '700', color: colors.text, fontSize: 14 }}>Services available</Text>
        <View style={styles.serviceRow}>
          {(shop?.services || ['REPAIR', 'BUY', 'SELL', 'PICKUP']).map((s) => (
            <View key={s} style={styles.serviceTile}>
              <Ionicons name="build-outline" size={18} color="#16A34A" />
              <Text style={styles.serviceText}>{s}</Text>
            </View>
          ))}
        </View>
        <Text style={{ marginTop: 20, fontWeight: '700', color: colors.text }}>Nearest Service Shops</Text>
        {nearby.slice(0, 3).map((s) => (
          <TouchableOpacity key={s.id} style={{ padding: 10, marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }} onPress={() => navigation.replace('ShopDetails', { shopId: s.id })}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{s.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{s.address}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
