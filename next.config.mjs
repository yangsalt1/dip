/** @type {import('next').NextConfig} */
const nextConfig = {
  // 로그인·줍줍리스트 저장 때문에 서버 기능을 써요 (정적 내보내기 X)
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
