export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">お支払いがキャンセルされました</h1>
        <p className="text-gray-500">お支払いは完了していません。</p>
        <p className="text-gray-400 text-sm mt-2">再度お試しの場合はご担当者にご連絡ください。</p>
      </div>
    </div>
  );
}
