---
title: introduction_to_mjml
tags:
- MJML  
---


第一封 MJML
使用 starter-kit
第一個 custom element




使用 html 寫 email 時，一定都遇過以下這些問題

1. 用 table 排版超麻煩
2. 不能直接使用 css，所以會有一堆重複的code
3. 用手機開信的時候，版面爆炸了



這些問題 MJML 都幫我們解決了。

MJML 使用 react 將 預先設計好的 MJML element 轉換成 html，你可以用類似 grid 的方式來排版，內建支援 mobile email，透過將重複使用的部分抽離成 custom element 來減少程式碼重複的問題，簡單的說你只要會寫 react ，你就可以無腦設計出長得漂亮，手機瀏覽不跑版的 email 。


## 開始你的第一封 MJML

首先請安裝
貼上

```html
<mjml>
  <mj-body>
    <mj-container>
      <mj-section>
        <mj-column>

          <mj-image width="100" src="/assets/img/logo-small.png"></mj-image>

          <mj-divider border-color="#F45E43"></mj-divider>

          <mj-text font-size="20px" color="#F45E43" font-family="helvetica">Hello World</mj-text>

        </mj-column>
      </mj-section>
    </mj-container>
  </mj-body>
</mjml>
```

恭喜你，你已經完成了你的第一封信件

## 使用 stater-kit 加速開發
不過在實際開發的時候，我個人還是習慣用 sublime text 來開發，我參考了網路上的一個 repo [epayet/mjml-starter-kit](https://github.com/epayet/mjml-starter-kit)，然後把版本改成 v2 。

```bash
git clone https://github.com/ocowchun/mjml-starter-kit
cd mjml-starter-kit
git checkout v2
npm install
npm start
```

