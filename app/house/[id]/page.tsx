import HouseDetail from '@/components/HouseDetail';
export const metadata = { title: 'JUP · 청약 상세' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HouseDetail id={id} />;
}
