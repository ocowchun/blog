---
title: note_about_cloudfront
tags:
---

以前都只是把 CloudFront 對應到 S3 而已，並沒有去做比較深入的研究



http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesCacheBehavior
http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html

### Forward Headers
選擇 `All` 的時候， CloudFront 就不會去快取你的內容，他會把每個請求都送過去 origin。
如果你要做 Dynamic Content 選這個就對了。

`Whitelist` 根據白名單的 Headers 來做快取的設定

`None(Improves Caching)` 不會根據 Header 的內容來做快取的設定，應該就是全部都給他做一樣的快取。

### Object Caching

####Use Origin Cache Headers.
根據 origin 提供的 `Cache-Control` 來決定快取的時間

####Customize
自行設定內容的快取時間。