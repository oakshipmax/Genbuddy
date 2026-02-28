/**
 * LIFFレイアウト
 * LINEミニアプリ用：ヘッダーなし、フルスクリーン、スマホ最適化
 */
export default function LiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      {children}
    </div>
  );
}
