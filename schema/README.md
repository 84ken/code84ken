# スキーマ コーポレートサイト

llschema.com のソース。

## 公開先

- 確認用: new.llschema.com（`deploy-schema.yml` の server-dir）
- 本番: llschema.com（切り替えるときは server-dir を `public_html/llschema.com/` に変える）

ConoHa側で先にサブドメインを作っておくこと。

## 更新のしかた

このフォルダの中を直して push すると、GitHub Actions が FTPS でConoHaに上げる。
他サイトと同じ仕組み。

## メモ

- 画像はWebPに変換してから `assets/` に置く
- 社内資料はここに置かない。公開されてしまう
