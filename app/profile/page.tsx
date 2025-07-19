// app/profile/page.tsx
import { Metadata } from 'next';
import ProfilePage from './ProfilePage';

export const metadata: Metadata = {
  title: 'Profilim | Turkid',
  description: 'Hesap bilgilerinizi görüntüleyin ve düzenleyin',
};

export default function Profile() {
  return <ProfilePage />;
}