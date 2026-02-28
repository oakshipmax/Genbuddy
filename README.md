# ゲンバディ（Genbuddy）

便利屋向けSaaS。本部・便利屋・エンドユーザーの3者が使う業務OSです。

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| サービス名 | ゲンバディ（Genbuddy）|
| 対象 | 便利屋フランチャイズ（本部・加盟便利屋・エンドユーザー）|
| 目的 | 本部工数の削減・便利屋の業務効率化・LINEで完結するユーザー体験 |
| MVP目標 | 2026年4月 |

## ユーザーロール

| ロール | 説明 | 使用デバイス |
|--------|------|-------------|
| 本部 | 全体管理・案件監視・請求管理 | iPad / PC |
| 便利屋 | 案件受付・作業報告・チャット | スマホ |
| エンドユーザー | 依頼・進捗確認・支払い | LINE（LIFF）|

## 技術スタック

### フロントエンド

| 技術 | 採用理由 |
|------|---------|
| Next.js 14 (App Router) | 日本で最も普及しているReactフレームワーク。引き継ぎエンジニアが見つけやすい |
| TypeScript | 型安全により引き継ぎ後のバグを減らす |
| Tailwind CSS | 素早いUI構築。スマホ対応が容易 |
| shadcn/ui | プロ品質のUIコンポーネント。カスタマイズ性が高い |

### バックエンド・インフラ（AWS）

| 技術 | 採用理由 |
|------|---------|
| AWS Amplify | Next.jsのホスティングとCI/CDを一元管理。デプロイが簡単 |
| Amazon RDS (PostgreSQL) | AWSの標準RDB。日本人エンジニアに最も馴染みがある |
| Prisma（ORM） | 日本で普及。型安全なDB操作。スキーマ管理が容易 |
| Amazon S3 | 見積書・請求書・現場写真などのファイル保存 |
| API Gateway + WebSocket | チャット機能のリアルタイム通信 |

### 認証

| ロール | 技術 | 方式 |
|--------|------|------|
| 本部 | Amazon Cognito | メール/パスワード |
| 便利屋 | LINE Login | LINEアカウントのみ |
| エンドユーザー | LINE Login（LIFF） | LINEアカウントのみ |

### 外部サービス連携

| サービス | 用途 |
|---------|------|
| LINE Messaging API | 案件通知・ステータス更新の自動送信 |
| LIFF（LINE Front-end Framework） | エンドユーザー向けLINEミニアプリ（Next.js内に組み込み）|
| Stripe Connect | 便利屋への報酬分配・エンドユーザーからの決済 |

## 月額インフラコスト（目安）

| サービス | 月額 |
|---------|------|
| AWS Amplify | 約1,500円 |
| Amazon RDS t3.micro | 約2,500円 |
| S3 + CloudFront | 約500円 |
| Amazon Cognito | 無料（5万MAU以下）|
| **合計** | **約4,500円** |

## フェーズ1 開発順序

- [x] プロジェクト設計・技術スタック決定・README作成
- [x] Next.jsプロジェクト初期化（TypeScript + Tailwind + shadcn/ui）
- [x] AWS Amplify設定・Prismaスキーマ骨格作成
- [ ] 認証機能（本部: Cognito / 便利屋・エンドユーザー: LINE Login）
- [ ] 案件管理（登録・一覧・ステータス変更）
- [ ] ダッシュボード（本部向け）
- [ ] チャット機能
- [ ] 請求書・見積書テンプレート
- [ ] LINE通知連携
- [ ] Stripe Connect連携
- [ ] LINEミニアプリ（LIFF）対応

## ディレクトリ構成

```
Genbuddy/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # 認証関連ページ
│   │   ├── dashboard/    # 本部ダッシュボード
│   │   ├── cases/        # 案件管理
│   │   ├── chat/         # チャット
│   │   └── liff/         # LINEミニアプリ
│   ├── components/       # 共通UIコンポーネント
│   ├── lib/              # ユーティリティ・設定
│   └── types/            # TypeScript型定義
├── prisma/
│   └── schema.prisma     # DBスキーマ
├── public/               # 静的ファイル
├── amplify.yml           # AWS Amplifyデプロイ設定
├── .env.example          # 環境変数テンプレート
├── .env.local            # 環境変数（Gitに含めない）
├── CLAUDE.md             # Claude Code指示書
└── README.md
```

## 開発環境セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/oakshipmax/Genbuddy.git
cd Genbuddy

# 依存関係インストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して各種キーを設定

# Prismaクライアント生成
npx prisma generate

# 開発サーバー起動
npm run dev
```

## 開発ルール

- `main` ブランチへの直接pushは禁止
- 機能ごとにブランチを作成: `feature/機能名`
- 1機能完成ごとにGitHubへpush
- 本番APIキーは `.env.local` に記載し、Gitには含めない
