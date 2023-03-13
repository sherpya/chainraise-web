import Image from 'next/image';
import logo from '@/public/chainraise.svg';

export default function Home() {
  return (
    <main>
      <div>
        <Image fill src={logo} alt="Logo" />
      </div>
    </main>
  );
}
