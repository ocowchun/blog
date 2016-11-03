---
title: '筆記: Migrate your Existing Express Applications to AWS Lambda'
date: 2016-11-03 22:34:10
tags:
- AWS Lambda
- API Gateway
- Express
- serverless
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/Cuh_gtFX5gI" frameborder="0" allowfullscreen></iframe>
[影片連結](https://www.youtube.com/watch?v=Cuh_gtFX5gI)
介紹 API Gateway, Lambda
講解怎麼把舊的服務 轉移到 API Gateway
## 說明 API Gateway 的新功能
* Catch-all resource paths
* ANY http method
* PROXY integrations

#### Catch-all resource paths
以往需要定義非常清楚的路徑，來說明要用哪個 fucntion 處理。不過這樣的缺點在於，`非常耗時`， catch all 可以讓我們可以用比較粗略的方式來設定 API Gateway 的路徑，所以可以快速完成建置，不過相對我們的文件與自動生成的 sdk 也會來得比較不嚴謹。
Swagger 支援這個新功能

#### ANY http method
將所有的 method (GET, POST, PUT, …) 都對應到相同的 integration，好壞處跟前者差不多，兩個可以一起用，就只需要非常少數的 integration喔喔喔
Swagger 也支援這個新功能

#### PROXY integrations
不再需要 input/output mappings !

#### HTTP_PROXY
這個我用不到，跳過了。

#### AWS_PROXY
根據 request 自動產生 event
自動將內容轉換成 HTTP Response ， Lambda 輸出必須符合下面的格式

```javascript
{
    "statusCode": httpStatusCode,
    "headers": { "headerName": "headerValue", ... },
    "body": "..."
}
```

如果 Lambda 輸出的格式不正確會回傳  `502 Bad Gateway`

細節可以看這裡
[Set Up a Proxy Resource with the Lambda Proxy Integration](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html#api-gateway-set-up-lambda-proxy-integration-on-proxy-resource)
Swagger 也支援這個新功能

### 官方支援 Express 的 package
[aws-serverless-express](https://github.com/awslabs/aws-serverless-express)

很棒的一張圖，解釋了整個 flow
<blockquote class="imgur-embed-pub" lang="en" data-id="a/AJ5yz"><a href="//imgur.com/AJ5yz"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>

## 如何 Migrate 現有的 Express App 到 AWS Lambda
### 五個步驟
1. 安裝相關的 dependencies (包含 aws-serverless-express)
2. 建立一個 JavaScript wrapper
3. 打包你的專案成 zip 
4. 建立 Lambda 
5. 設定 API Gateway endpoint 來做 proxy

## Demo: Express to Lambda
解釋 [aws-serverless-express](https://github.com/awslabs/aws-serverless-express) 的 sourece code，講解如何將 API Gateway 的內容轉成 Express 接收的格式，還有如何將 response 轉換成 API Gateway 接受的格式，然後手動操作一遍。

#### 可以使用 `aws-serverless-express/middleware` 來取得 API Gateway 的 contetxt

```javascript
const awsServerlessExpressMiddleware = require*('aws-serverless-express/middleware');
app.use(awsServerlessExpressMiddleware.eventContext());
```

#### Enable API Gateway CORS
API Gateway 建立 resource 的時候，如果有選擇 Enable API Gateway CORS 的話，會自動產生一個 Method 為 OPTIONS 的 API Gateway Method，來處理瀏覽器的 preflight
更多 CORS 可以看阮一峰的[跨域資源共享CORS 詳解](http://www.ruanyifeng.com/blog/2016/04/cors.html)

## Express on Serverless 
* Auto Scale
* 有多少請求付多少錢
* 一樣可以做單元測試
* 不需要變動原本的程式碼

**這樣的方式也可以套用在其他的 Web Framework**，你只需要去包裝 request 透過 proxy 轉給原本的 app ，然後將輸出的結果轉換成支援的格式。

## Best Practice
#### 1:1 Mapping
每個 API call 都是去觸發 stateless Lambda function ， 每個 express instance 一次只會處理一個請求，所以比較不需要擔心 concurrency 的問題。

#### Memory
如果你的應用是 CPU bound ，增加 memory 就可以增加執行速度。

#### Lazily load resources
Lambda handler 之外的 scope，只有在第一次呼叫的時候會執行到，接下來就被快取起來了。這個特性可以用來儲存資料，加速請求，`不過請小心使用!!`，畢竟儲存過多的資料會影響啟動時間，而且本質上來說你應該要`將每個請求視為 stateless`。

#### Offload tasks to Gateway
除了原本的方式之外，你可以使用 IAM 或是 custom authorization 來應付 Access Control。

## QA 時間



