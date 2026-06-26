import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Eye, Trash2, ShoppingCart, ShieldCheck, Truck,
  Minus, Plus, ArrowLeft, Bell,
} from 'lucide-react-native';
import {
  Loader,
  EmptyState,
  BottomActionBar,
  PriceRow,
  PriceDivider,
  Badge,
} from '../../../components/rnr';
import { confirm, notify } from '../../../components/confirm';
import { getCart, removeCartItem, updateCartItem, clearCart } from '../../../api/marketplace';
import { createBuyOrder } from '../../../api/orders';

const GREEN = '#16A34A';
const GREEN_LIGHT = '#22C55E';
const GREEN_DARK = '#15803D';

const cartTotal = (list) =>
  list.reduce((sum, it) => sum + (Number(it.product?.price) || 0) * (it.quantity || 1), 0);

function CartHeader({ navigation, count }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: GREEN_DARK }}>
      <LinearGradient
        colors={[GREEN_DARK, GREEN, GREEN_LIGHT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 12,
          paddingBottom: 18,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              height: 36, width: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.6 }}>
              MY CART
            </Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 2, letterSpacing: -0.2 }}>
              {count ? `${count} item${count > 1 ? 's' : ''} ready to checkout` : 'Your cart'}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={{
              height: 36, width: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Bell size={18} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default function MyCartScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await getCart()); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRemove = async (id) => {
    const ok = await confirm({ title: 'Remove', message: 'Remove this item from cart?', confirmText: 'Remove', destructive: true });
    if (!ok) return;
    try { await removeCartItem(id); load(); } catch (e) { notify('Error', e.message); }
  };

  const onQty = async (it, delta) => {
    const next = Math.max(1, (it.quantity || 1) + delta);
    if (next === (it.quantity || 1)) return;
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, quantity: next } : x)));
    try { await updateCartItem(it.id, next); } catch (e) { notify('Error', e.message || 'Could not update quantity'); load(); }
  };

  const onCheckout = async () => {
    if (placing || !items.length) return;
    setPlacing(true);
    try {
      const payloadItems = items.map((it) => ({
        productId: it.product?.id || it.productId,
        title: it.product?.title,
        price: Number(it.product?.price) || 0,
        quantity: it.quantity || 1,
      }));
      await createBuyOrder({ items: payloadItems, totalAmount: cartTotal(items) });
      await clearCart().catch(() => {});
      setItems([]);
      notify('Order placed', 'Your order has been placed. Track it in My Orders.');
      navigation.navigate('MyOrders');
    } catch (e) {
      notify('Checkout failed', e.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
        <CartHeader navigation={navigation} count={0} />
        <Loader label="Loading your cart..." />
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
        <CartHeader navigation={navigation} count={0} />
        <EmptyState
          icon={<ShoppingCart size={28} color={GREEN} />}
          title="Your cart is empty"
          description="Browse our refurbished collection to get started."
          actionLabel="Start shopping"
          onAction={() => navigation.navigate('CustomerTabs', { screen: 'Buy' })}
        />
      </View>
    );
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.product?.price) || 0) * (it.quantity || 1), 0);
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
      <CartHeader navigation={navigation} count={items.length} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
        {items.map((it) => {
          const p = it.product || {};
          return (
            <View
              key={it.id}
              style={{
                backgroundColor: '#fff', borderRadius: 18,
                padding: 12, marginBottom: 12,
                borderWidth: 1, borderColor: '#F1F5F9',
                shadowColor: '#0F172A', shadowOpacity: 0.05,
                shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    height: 96, width: 80, borderRadius: 14,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', marginRight: 12,
                  }}
                >
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 32 }}>📱</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                    {p.title}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                    {p.storageLabel ? (
                      <Badge variant="muted" className="mr-1.5 mb-1">{p.storageLabel}</Badge>
                    ) : null}
                    {p.color ? (
                      <Badge variant="muted" className="mr-1.5 mb-1">{p.color}</Badge>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: GREEN_DARK, marginTop: 6 }}>
                    ₹{(p.price || 0).toLocaleString?.() || p.price}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Pressable
                      onPress={() => onQty(it, -1)}
                      disabled={(it.quantity || 1) <= 1}
                      style={{
                        height: 30, width: 30, borderRadius: 8,
                        borderWidth: 1, borderColor: '#E5E7EB',
                        alignItems: 'center', justifyContent: 'center',
                        opacity: (it.quantity || 1) <= 1 ? 0.4 : 1,
                      }}
                    >
                      <Minus size={14} color="#0F172A" />
                    </Pressable>
                    <Text style={{ marginHorizontal: 14, fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                      {it.quantity || 1}
                    </Text>
                    <Pressable
                      onPress={() => onQty(it, 1)}
                      style={{
                        height: 30, width: 30, borderRadius: 8,
                        borderWidth: 1, borderColor: '#E5E7EB',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Plus size={14} color="#0F172A" />
                    </Pressable>
                  </View>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row', marginTop: 12,
                  paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
                }}
              >
                <Pressable
                  onPress={() => navigation.navigate('BuyProductDetails', { productId: p.id })}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
                >
                  <Eye size={14} color={GREEN_DARK} />
                  <Text style={{ marginLeft: 6, fontSize: 12.5, fontWeight: '800', color: GREEN_DARK }}>View</Text>
                </Pressable>
                <View style={{ width: 1, backgroundColor: '#F1F5F9' }} />
                <Pressable
                  onPress={() => onRemove(it.id)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={{ marginLeft: 6, fontSize: 12.5, fontWeight: '800', color: '#EF4444' }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <View
          style={{
            backgroundColor: '#fff', borderRadius: 18,
            padding: 14, marginBottom: 12,
            borderWidth: 1, borderColor: '#F1F5F9',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
            Order Summary
          </Text>
          <PriceRow
            label={`Subtotal (${items.length} item${items.length > 1 ? 's' : ''})`}
            value={`₹${subtotal.toLocaleString()}`}
          />
          <PriceRow
            label="Shipping"
            value={shipping ? `₹${shipping}` : 'FREE'}
            valueClassName={shipping ? '' : 'text-success font-bold'}
          />
          <PriceDivider />
          <PriceRow label="Total" value={`₹${total.toLocaleString()}`} bold />
        </View>

        <View style={{ flexDirection: 'row' }}>
          <View
            style={{
              flex: 1, marginRight: 6,
              backgroundColor: '#fff', borderRadius: 14,
              padding: 12, flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: '#F1F5F9',
            }}
          >
            <View
              style={{
                height: 30, width: 30, borderRadius: 15,
                backgroundColor: '#DCFCE7',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ShieldCheck size={15} color={GREEN_DARK} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A', marginLeft: 8, flex: 1 }} numberOfLines={1}>
              6-month warranty
            </Text>
          </View>
          <View
            style={{
              flex: 1, marginLeft: 6,
              backgroundColor: '#fff', borderRadius: 14,
              padding: 12, flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: '#F1F5F9',
            }}
          >
            <View
              style={{
                height: 30, width: 30, borderRadius: 15,
                backgroundColor: '#FFEDD5',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Truck size={15} color="#C2410C" />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A', marginLeft: 8, flex: 1 }} numberOfLines={1}>
              Free delivery
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomActionBar
        priceCaption="Total"
        priceValue={`₹${total.toLocaleString()}`}
        priceLabel={`${items.length} item${items.length > 1 ? 's' : ''}`}
        title={placing ? 'Placing…' : 'Checkout'}
        onPress={onCheckout}
      />
    </View>
  );
}
