# GitHub リポジトリ検索アプリ

GitHub の公開リポジトリをキーワードで検索し、一覧・詳細を閲覧できる Web アプリケーションです。
クリーンアーキテクチャとドメイン駆動設計を土台に、テスト駆動開発で実装しています。

## 主な機能

- キーワードによるリポジトリ検索（GitHub REST API `GET /search/repositories`）
- 検索結果の一覧表示（オーナーアイコン + リポジトリ名）とページネーション（GitHub の上限に合わせて最大 1,000 件）
- リポジトリ詳細ページ（言語 / Star / Watcher / Fork / Issue 数）
- エラー状態（レートリミット・ネットワーク障害・404）、0 件、未検索、ローディングなど、各状態の表示
- 詳細ページから一覧へ戻った際、URL に検索条件（`q` / `page`）を保持し、検索状態を再現

## 技術スタック

| 項目      | 内容                                     |
| ------- | -------------------------------------- |
| フレームワーク | Next.js                                |
| 言語      | TypeScript                             |
| スタイリング  | Tailwind CSS                           |
| ユニット/結合 | Vitest + Testing Library               |
| E2E     | Playwright（+ axe-core でアクセシビリティ自動チェック） |
| 外部 API  | GitHub REST API                        |
| アーキテクチャ | クリーンアーキテクチャ + ドメイン駆動設計                 |

## セットアップ・起動手順

### 前提

- Node.js 20 以上

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`GITHUB_TOKEN` は **任意** です。未設定でも動作しますが、GitHub API の未認証レートリミット（60 req/h）は厳しいため、[Personal Access Token](https://github.com/settings/tokens)（スコープ不要・public のみ）を設定すると 5,000 req/h まで緩和されます。

※ `GITHUB_TOKEN` はサーバー側（Server Component / インフラ層）でのみ参照し、クライアントへは渡しません。

```dotenv
# .env.local
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

また、コミット時に自動でリンター（ESLint）とフォーマッター（Prettier）が実行されるように、Makefile で Git フックを構成してください。

```bash
make setup_git_hooks
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

<http://localhost:3000> をブラウザで開きます。

### 4. 本番ビルド

```bash
npm run build
npm run start
```

## テスト

```bash
npm test          # Vitest（ユニット + 結合）を watch で実行
npm run coverage  # カバレッジ計測（src 配下のロジック・UI が対象）
npm run test:e2e  # Playwright（ハッピーパス E2E + アクセシビリティチェック）
```

- ユニット/結合テストは対象ファイルの隣にコロケーションしています（例: `useCase.ts` ↔ `useCase.test.ts`）。
- カバレッジは型定義のみ・定数・表示専用ファイル（`loading` / `error` / `not-found` / `layout`）を分母から除外し、振る舞いを持つコードの実態を示します。
- E2E は GitHub API への通信を含めずに完結させるため、`GITHUB_API_BASE_URL` を環境変数で差し替え、別プロセスのモックサーバーへ向けます。
- E2E のハッピーパス内で `@axe-core/playwright` を用い、一覧・詳細の各画面においてアクセシビリティ違反（`violations`）がないことを自動検証します。

## ディレクトリ構成

```
src/
├── app/
│   ├── _shared/github/      # 検索・詳細で共有するドメイン / インフラ
│   │   ├── domain.ts        #   VO・Entity・RepoStore IF・業務ルール起因のエラー
│   │   ├── errors.ts        #   外部サービス起因のエラー（404 / レートリミット 等）
│   │   └── infra.ts         #   GitHubRepoStore（RepoStore 実装）・DTO→Domain マッパー
│   ├── (search)/            # 検索サービス（トップページ）
│   │   ├── page.tsx         #   DI 配線・SSR 境界（規約ファイルは直下据え置き）
│   │   ├── _usecase/        #   ロジック層
│   │   │   ├── useCase.ts   #     SearchRepos ユースケース
│   │   │   └── searchVo.ts  #     SearchQuery / Page VO
│   │   └── _components/     #   プレゼンテーション層
│   │       ├── SearchForm.tsx    #   入力フォーム（Client）
│   │       ├── RepoList*.tsx     #   結果一覧（Server）
│   │       ├── Pagination.tsx    #   ページ送り（Client）
│   │       └── errorMessages.ts  #   エラー文言変換（表示専用）
│   └── (detail)/[owner]/[repo]/  # 詳細サービス
│       ├── page.tsx                    #   DI 配線・notFound() 境界（直下据え置き）
│       ├── _usecase/useCase.ts         #   GetRepo ユースケース
│       └── _components/DetailPage.tsx  #   詳細表示（Server）
├── config/                  # 定数（github.ts）・環境変数アクセス（env.ts）
├── libs/github/             # 外部ライブラリ関連（HttpClient・レスポンス DTO）
└── utils/result.ts          # Result 型ユーティリティ
```

## 工夫した点・拘ったポイント

### ビジネスロジックの集約と依存性注入の活用

ビジネスロジックはすべてドメイン層に集約し、アプリケーションの他層に漏れ出さない構造としています。また、テスト容易性や拡張性を高めるために依存性注入（DI）を活用し、ユースケースが持つ外部依存を分離して疎結合を実現しています。

### ディレクトリ構成はレイヤー単位ではなく「機能単位」で分割し、App Router のコロケーションを活用している

アプリケーションが大きくなると、増え続ける関連ファイルが層ごとに分散し、作業効率が下がる課題があります。本構成では関連ファイルを物理的に近接配置することで管理しやすくし、プロダクトの成長に合わせたディレクトリ構成の見直しも容易にしています。

### エラー処理を Result 型で型レベルに強制する

ビジネスロジックにおける「想定内の失敗」は `throw` せず、`Result<T, E>` を戻り値として返します（`src/utils/result.ts`）。呼び出し元は `if (!result.ok)` により必ずハンドリングする必要があり、**どの関数が失敗しうるかが型から読み取れる**設計にしています。一方 `throw` は、呼び出し側から失敗の可能性が見えにくく、catch 漏れが起きやすいという弱点があるため、用途に応じて使い分けています。

- **Result を使う箇所**: `HttpClient` / `RepoStore` / `UseCase` の公開メソッド、外部入力由来の VO 生成（`SearchQuery` / `Page` / `RepoFullName` の `static create()`）
- **throw を許容する 2 箇所のみ**: ① Next.js 境界（`notFound()` / `error.tsx` への委譲）で Result を throw に変換する場合、② 内部不変条件の検証（API レスポンス由来では起こり得ないケース＝バグ検知）

### ドメインの語彙の衝突を命名で解消する

DDD 文脈の Repository（データアクセス層）と GitHub 文脈の Repository（リポジトリ）が紛らわしいため、GitHub 側は **Repo**（`Repo` Entity / `RepoStore`）に命名を統一しました。

### テスト容易性を意識した DI

ユースケースへ `RepoStore` を注入し、トークン取得関数を渡す形にすることで、テスト時に実装を差し替え可能にしています。結合テストでは `fetch` のみをモックし、`UseCase → GitHubRepoStore → GitHubHttpClient` は実装をそのまま通して、層をまたいだ連携を検証しています。

### テスト戦略（Given-When-Then / AAA）

テスト名は「前提 → 操作 → 結果」、テスト本体は 「Arrange-Act-Assert」を意識して実装しています。テストピラミッドに沿い、ユニット → 結合 → E2E（ハッピーパス 1 本）の順で、薄く広く品質を担保しています。

### リントとフォーマットの自動実行環境を整えてコードの品質を担保

コミット時に自動的にリンター（ESLint）とフォーマッター（Prettier）が実行されるよう、Makefile および Git hooks（pre-commit）による仕組みを導入しています。これにより、開発者ごとにスタイルがばらつくことなく、常に統一されたコード品質を保つことができます。

## AI 利用レポート

知識の曖昧な部分や迷いが生じた点については、生成AIに質問したりコード例を出してもらうことで、問題の所在を明確化し解決の糸口を探りました。提示された情報はそのまま鵜呑みにせず、できるだけインターネットで複数の情報源を参照し、ファクトチェックを行うようにしました。

また、AIから得られたコードやアイデアについては、自身でもレビューを行うようにして、「レビューアー」「レビューイ」双方の視点で検討を重ねることで、知識負債の最小化と品質確保に努めました。

### 主な利用用途

- 詳細設計フェーズにおける要件整理や技術選定、DDD・クリーンアーキテクチャの構造設計に関する壁打ち・議論
  - プロジェクトの抽象度の決め方や、ドメイン・インフラ層の分離基準の明確化
- ドメインロジックやユースケースの責務分離、逆境での設計判断理由やテスト戦略整理
  - レイヤー横断のテスト（ユニット、結合、E2E）の設計観点やGiven-When-Then/AAAパターンの運用アドバイス
- プレゼンテーション層における、アクセシビリティやUI一貫性担保のための実装相談/実装補佐
  - 具体的なフォームコンポーネント設計や、UI表示のロジカルな繋がり部分
- READMEの文章を分かりやすく読みやすくなるよう校正し、必要に応じて構成や表現をブラッシュアップ
