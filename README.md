# 空室バーチャルステージング（AIレイアウト提案SaaS）

不動産仲介・管理会社向けのSaaS。空室の写真数枚と間取り図をアップロードすると、AIが部屋の形状を読み取り、家具配置プランを3パターン提案する。要件定義の詳細は別途まとめたメモを参照。

## できること（MVP / Phase 1）

- **物件登録**: 物件名・メモ、間取り図1枚、空室写真を複数枚アップロード
- **AI解析**: Claude（Vision）が間取り図・写真から部屋の形状（メートル単位）を読み取り、家具配置を構造化データとして生成
- **レイアウト提案**: 部屋タイプ・用途別に3パターン（コンパクト向け／ファミリー向け／ワークスペース重視 など）を俯瞰図（SVG）で表示
- **出力**: ブラウザの印刷機能を使ったPDF保存、共有リンクの発行（未認証でも閲覧できる読み取り専用ページ）
- **案件管理**: 物件一覧、生成履歴、再生成

## 技術スタック

- Next.js 16 (App Router, Server Actions, Proxy)
- Supabase (Postgres, Auth, Row Level Security, Storage)
- Anthropic API (`@anthropic-ai/sdk`) — Claude Vision による間取り・写真解析
- Tailwind CSS 4

## セットアップ

### 1. Supabaseプロジェクトを作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. `supabase/migrations/0001_init.sql` の内容をSQL Editorで実行（テーブル作成 + RLSポリシー + Storageバケット作成）
3. Project Settings → API から値を取得

### 2. Anthropic APIキーを取得

[console.anthropic.com](https://console.anthropic.com/settings/keys) でAPIキーを発行する。

```bash
cp .env.local.example .env.local
```

`.env.local` に Supabase の値と `ANTHROPIC_API_KEY` を設定する。

### 3. 依存関係のインストール & 起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) にアクセスすると `/dashboard` にリダイレクトされ（未ログインなら `/login`）、`/signup` から会社アカウントを作成できる。サインアップ後、初回1物件は無料お試しとして利用できる想定（利用制限そのものは未実装。下記「今回のスコープ外」を参照）。

## ディレクトリ構成

```
src/
  app/
    (app)/                          # ログイン後の画面
      dashboard/                    # 案件一覧
      properties/new/               # 物件登録フォーム
      properties/[id]/              # 物件詳細・生成履歴・再生成
      properties/[id]/proposals/[proposalId]/  # 提案詳細（俯瞰図・PDF・共有リンク）
    login/ signup/                  # 認証
    s/[token]/                      # 共有リンクの公開閲覧ページ（未認証）
  lib/
    supabase/    # ブラウザ/サーバー/管理者用クライアント、Storage署名URLヘルパー
    ai/          # analyze-property.ts — Claude Visionへの解析リクエスト
    auth/        # 現在の会社アカウントを解決するヘルパー
  types/
    database.ts  # Supabaseテーブルの型定義
    layout.ts    # AIが返すレイアウトデータ（部屋・家具の構造化JSON）の型
  components/
    layout-diagram.tsx  # レイアウトデータをSVGの俯瞰図として描画
supabase/migrations/0001_init.sql  # DBスキーマ + RLS + Storageバケット
```

## AI解析の仕組み

`lib/ai/analyze-property.ts` が、間取り図＋写真の画像をClaudeに渡し、`propose_layouts` というツール呼び出し（forced tool-use）で構造化JSON（部屋のポリゴン座標 + 3パターン分の家具配置）を強制的に取得する。取得したデータは `proposals.layout_data` にそのまま保存され、`LayoutDiagram` コンポーネントがメートル単位の座標からSVGを描画する。Phase 3で予定している3D表示も、このデータをThree.js等で再構成する想定で、同じデータ構造を再利用できるように設計している。

## 今回のMVP実装でのスコープ外・簡略化した点

要件定義メモのPhase 1に対応する部分を優先して実装した。以下は意図的に見送っている:

- **非同期ジョブ化**: AI解析は物件登録の Server Action 内で同期的に実行している（数十秒〜1分程度ブロックする）。ワイヤーフレームの「AI解析中」画面は、フォーム送信中のインラインローディング表示として簡略化した。本番運用ではキュー（例: Supabase Edge Functions + pg_cron、またはジョブキューサービス）への切り出しを推奨
- **決済連携**: `companies.plan` カラムで料金プランを保持できる構造は用意したが、Stripe等の決済導線・利用量の課金制限は未実装
- **提案パターン数の上限**: 「1物件＝3案まで定額」という価格モデルの制限は未実装（再生成は無制限に呼び出せる）
- **Phase 2（実写真合成）・Phase 3（3D表示）**: 未実装。データ構造（`layout_data`）は両方を見据えて設計済み
- **PDF出力**: 専用のPDF生成ライブラリではなく、ブラウザの印刷機能（`window.print()`）を使った簡易実装

## デプロイ

Vercelへのデプロイを想定。環境変数（`.env.local` と同じ内容）をVercelのプロジェクト設定に追加し、`vercel deploy` またはGitHub連携でデプロイする。Server Actionの同期AI解析はVercelの関数実行時間上限に注意（Hobbyプランは10秒程度で、この用途には短すぎるため、Pro以上のプランでの関数タイムアウト延長設定が必要になる可能性が高い）。
