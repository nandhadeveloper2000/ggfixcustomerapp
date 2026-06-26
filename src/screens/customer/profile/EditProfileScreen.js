import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import colors from '../../../theme/colors';
import { LabeledInput, PrimaryButton, Loader } from '../../../components/ui';
import { notify } from '../../../components/confirm';
import { getProfile, updateProfile } from '../../../api/customer';
import { setSession } from '../../../store/authSlice';
import { getSession, saveSession } from '../../../auth/session';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  avatarWrap: { alignItems: 'center', marginVertical: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FCD34D', alignItems: 'center', justifyContent: 'center' },
});

export default function EditProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ fullName: '', mobile: '', alternateMobile: '', email: '', profileImageUrl: '' });

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setData({
          fullName: p.fullName || '',
          mobile: p.mobile || '',
          alternateMobile: p.alternateMobile || '',
          email: p.email || '',
          profileImageUrl: p.profileImageUrl || '',
        });
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await updateProfile(data);
      const cur = (await getSession()) || {};
      const newSession = { ...cur, fullName: saved.fullName, email: saved.email, mobile: saved.mobile };
      await saveSession(newSession);
      dispatch(setSession(newSession));
      navigation.goBack();
    } catch (e) {
      notify('Error', e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarWrap}>
        <View style={styles.avatar} />
      </View>

      <LabeledInput label="Full Name" placeholder="Enter your Full name" value={data.fullName} onChangeText={(v) => setData({ ...data, fullName: v })} />
      <LabeledInput label="Your Mobile Number" placeholder="Enter your mobile number" value={data.mobile} onChangeText={(v) => setData({ ...data, mobile: v })} keyboardType="phone-pad" />
      <LabeledInput label="Alternate Mobile Number" placeholder="Enter alternate mobile number" value={data.alternateMobile} onChangeText={(v) => setData({ ...data, alternateMobile: v })} keyboardType="phone-pad" />
      <LabeledInput label="Your Email Address" placeholder="email address" value={data.email} onChangeText={(v) => setData({ ...data, email: v })} keyboardType="email-address" autoCapitalize="none" />

      <View style={{ height: 20 }} />
      <PrimaryButton title="Save Changes" onPress={save} loading={saving} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
