# TDK CLI — ノートPCでサービスを起動する

[English](README.md) | [简体中文](README-zh_cn.md) | [繁體中文](README-zh_tw.md) | 日本語 | [한국어](README-ko.md)

TDK CLI は、ノートPC上でサービスを起動します。デプロイツールでも Compose ファイルでもありません。各サービスを `service.json` で定義し、`tdk up` を実行するだけです。マシンに Kubernetes は不要です。

安定性: 1.x のローカル開発向け。生成されるファイルは契約として扱われ、`tdk config verify` で検証できます。コア CLI は MIT ライセンスでキーは不要です。Premium は任意です。

コンテナは Docker が実行します。Tilt はサービスを監視し、コーディング中にコンテナをライブアップデートします。TDK CLI は Tilt が使う設定を書き出します。本番デプロイは引き続き Helm、Argo CD、Kustomize が担当します。

[ウェブサイト](https://tdk-landscape.github.io/tdk-website/) · [クイックスタート](https://tdk-landscape.github.io/tdk-website/docs/quickstart/) · [サンプル](https://tdk-landscape.github.io/tdk-website/docs/examples/) · [Awesome TDK](https://github.com/tdk-landscape/awesome-tdk-framework) · [デモ](https://tdk-landscape.github.io/tdk-demo-animation/) · [バグ報告](https://github.com/tdk-landscape/tdk-cli-core/issues)

## TDK を使っているチーム

まだ掲載されているチームはありません。最初の一組になりませんか。[TDK を使っていることを知らせる](https://github.com/tdk-landscape/tdk-cli-core/issues/new?template=we-use-tdk.yml)か、[ADOPTERS.md](ADOPTERS.md) に行を追加してください。

## クイックスタート

```bash
mkdir shop && cd shop
tdk project --yes
tdk resource orders-api --type backend --stack shop --yes
tdk up shop
curl http://api.shop.localhost/api/orders-api/health
```

![TDK がバックエンドとフロントエンドをスキャフォールドし、スタックを一覧表示する様子](docs/assets/demo.svg)

*バックエンドとフロントエンドをスキャフォールドし、スタックを一覧表示します。*

![TDK CLI の活用場面トップ9: サービスのスキャフォールド、スタック起動、ホットリロード、ポート管理、自動検出、起動順序、プロキシルーティング、インフラの組み込み、設定検証](docs/assets/tdk-cli-top-9-uses.jpg)

Helm、Compose、既存の Tilt 構成でローカル環境がすでに問題なく動いているなら、そのまま使い続けてください。TDK CLI は、複数のサービスを扱い、明確なローカルサービス契約と、スタックを起動する1つのコマンドを求めるエンジニア向けです。

[Helm との併用方法](https://tdk-landscape.github.io/tdk-website/docs/with-helm/)、[サービススキーマ](engine/schemas/service-schema.json)、[プロジェクト設定スキーマ](engine/schemas/project-schema.json)も参照してください。

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![CI](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml)
[![Quickstart E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml)
[![ERP fixture scale E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/erp-scale-e2e.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/erp-scale-e2e.yml)
[![Example apps E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/examples-e2e.yml/badge.svg?branch=main)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/examples-e2e.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/tdk-landscape/tdk-cli-core/badge.svg)](https://snyk.io/test/github/tdk-landscape/tdk-cli-core)
[![Socket Badge](https://badge.socket.dev/npm/package/@tdk-landscape/tdk-cli-core/latest)](https://socket.dev/npm/package/@tdk-landscape/tdk-cli-core/overview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## インストール

npm から CLI をインストールするか（Node.js 22.12+ が必要）、ビルド済みバイナリを使用します（Node.js も Bun も不要）。

```bash
npm install -g @tdk-landscape/tdk-cli-core
# or install the prebuilt binary
curl -fsSL https://tdk-landscape.github.io/install.sh | sh
```

`tdk up shop --dry-run` は、コンテナを起動する前に、選択されたローカルサービスと URL をプレビューします。デフォルトのスターターは Bun/TypeScript です。TDK の中核的な役割は Docker + Tilt でローカルコンテナを実行することであり、Node.js アプリケーションフレームワークを提供することではありません。[単一バックエンドのサンプル](examples/one-backend/README.md)を参照してください。

## TDK を使わないほうがよい場合

- 既存の Compose や Tilt のワークフローでローカル環境がすでに問題なく動いている。
- 開発ワークフロー全体が Helm で完結しており、ローカルサービスを Docker 上で動かしたくない。
- `service.json` マニフェストと生成されるローカル設定を使いたくない。

## ドキュメント

- [ドキュメント索引](docs/README.md)
- [Helm との併用](docs/with-helm.md)
- [設定とエディタ用スキーマ](docs/configuration.md)
- [実行可能な単一バックエンドのサンプル](examples/one-backend/README.md)
- [実行可能な Python バックエンドのサンプル](examples/one-backend-python/README.md)
- [マルチサービスの完全なサンプル](examples/tdk-example/README.md)
- [機能とライセンス上の制限](docs/FEATURES.md)
- [率直な比較と既知の制限](docs/compare-honest.md)
- [公開している主張の一覧](docs/claims.md)
- [Show HN の下書き](docs/drafts/show-hn.md)
- [アーキテクチャとリポジトリマップ](docs/project-overview.md)
- [スケールフィクスチャの計測結果と注意点](docs/benchmarks/scale-bench.md)

## 経緯

TDK は、このリポジトリや npm パッケージの日付から想像されるよりも前から存在します。開発は 2026年4月21日に [tdk-landscape/tdk](https://github.com/tdk-landscape/tdk) で始まり、同リポジトリは現在アーカイブされ、読み取り専用の履歴として残されています。最初のコミットは [`1714637`](https://github.com/tdk-landscape/tdk/commit/1714637637196ed54cbfa18534230a782c05ab36)（"Initial commit: TDK specs, generators, CLI, and standards"）です。このリポジトリ `tdk-cli-core` は 2026年9月19日に作成され、開発はここで続いています。npm の `@tdk-landscape/tdk-cli-core` パッケージは 2026年9月21日に初めて公開されました。そのため、コードの系譜は、GitHub や npm で見えるリポジトリやパッケージの日付より約5か月古いことになります。

## 要件とサポート

ローカルランタイムには、Docker（Desktop、OrbStack、または Colima。Engine 25+、Compose 2.20+）と [Tilt](https://docs.tilt.dev/install.html) をインストールしてください。デフォルトで生成されるサービスは Bun 1.2+ を使用します。TDK は HTTP、HTTPS、Postgres のホストポートを、範囲が限られたフォールバック範囲から選びます。上書きするには `TDK_HTTP_PORT`、`TDK_HTTPS_PORT`、`TDK_POSTGRES_PORT` を設定してください。TDK は macOS、Linux、および WSL2 Ubuntu 経由の Windows をサポートします。ネイティブ Windows では CLI の確認のみ可能です。`tdk doctor` を実行してローカルの準備状況を確認してください。[WSL2 のセットアップ](docs/wsl2.md)を参照してください。

ネイティブ Windows では、`tdk --version`、`tdk doctor`、`tdk up --dry-run` は確認専用のコマンドです。`tdk up` は終了コード 2 で終了し、「Landscape startup needs Ubuntu on WSL2. Native Windows is inspect-only.」と表示します。

## ライセンス対応表

| 機能 | 無料 | Premium |
| --- | --- | --- |
| `tdk up`、スキャフォールド、Traefik、Postgres、Tilt ライブアップデート、golden layers | あり | あり |
| Verdaccio、DDD スキャフォールド、Sablier アイドル停止 | なし | キーが必要 |
| Playwright、C4、AGENTS.md | リポジトリ内で生成する場合は無料 | キーで実装をダウンロードした場合のみ |

コアは無料のままです。Premium は上記の追加機能のための別キーであり、`tdk up` の実行にキーは不要です。

**エコシステムマップ:** サンプル、記事、関連ツール、メモは [awesome-tdk-framework](https://github.com/tdk-landscape/awesome-tdk-framework) にあります。実際に使っているのがこの CLI であれば、このリポジトリ（`tdk-cli-core`）にスターを付けてください。それ以外は awesome リストから探せます。

## コントリビューションとライセンス

コントリビューションを歓迎します。まず [CONTRIBUTING.md](CONTRIBUTING.md) と[コントリビューターガイド](docs/contributing/README.md)をご覧ください。セキュリティ上の問題は [SECURITY.md](SECURITY.md) に従って報告してください。

TDK は MIT ライセンスです。[LICENSE](LICENSE) を参照してください。
