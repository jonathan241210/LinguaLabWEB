import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir automáticamente a la pantalla de login
  redirect('/login');
}
