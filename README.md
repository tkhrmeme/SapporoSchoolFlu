札幌市立小学校　学級閉鎖マップ
================

札幌市が公開しているインフルエンザの発生動向と市立学校等の学級閉鎖等情報(http://www.city.sapporo.jp/hokenjo/f1kansen/f003influ-kyugyo.html) に基づき、d3.jsを用いて可視化しました。

#データについて
データに関しては札幌市より利用許可を得た上で使用しています。

学校区、鉄道のデータは国土数値情報ダウンロードサービス (http://nlftp.mlit.go.jp/ksj/) を利用しています。

小学校区のデータは Code for Sapporo が「さっぽろ保育園マップ」( https://github.com/codeforsapporo/papamama )で作成したデータを元に，geojsonをtopojsonに変換して利用しています。合併した小学校区を反映したものになっています。

#注意
表示しているデータは、札幌市が学級閉鎖情報のデータを更新するたびにPDFファイルからCSVへ変換して作成しています。手作業による部分があるため、必ずしも最新のデータが表示されるとは限りません。ご了承下さい。
