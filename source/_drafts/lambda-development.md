---
title: AWS Lambda開發
date: 2016-05-15 16:46:00
tags: Lambda
---

本文將簡單分享如何快速的開發 AWS Lambda

使用 AWS Lambda 的好處在於你完全不用管 server 你就是寫code就對了

不過他也有一些限制，例如目前只支援特定程式語言，每個 Lambda 的執行時間有限制，

我個人目前使用 AWS Lambda 的用途包含:
1. 定期從DB整理資料，丟到 logstash
2. 定期監測特定數據，符合條件時，發出 Slack 通知
3. 定期整理資料，將資料打包成 csv 丟到 S3

也就是幾乎都是固定週期要執行的小程式，透過 CloudWatch Events 的設定，自動去執行 Lambda。

## Apex Introduction
Apex的主要目的是協助我們管理 AWS Lambda 開發，包括打包 function 成 zip，上傳到S3、部署、查看特定 function 的log,使用 terraform 管理 Lambda 相關的 infrastructure。
Apex 主要是使用 Golang 開發，開發者包含知名的 TJ 大大。

## 開始你的第一個 lambda function

### [安裝 apex](https://github.com/apex/apex#installation)
如果你的電腦室 OS X, Linux, 或是 OpenBSD:
你只要在 terminal 執行下面這一行就可以安裝了

```bash
curl https://raw.githubusercontent.com/apex/apex/master/install.sh | sh
```
如果你是 Windows 的用戶你可以透過[下載binary](https://github.com/apex/apex/releases)來安裝。

如果你之前已經有安裝過的話，可以在 terminal 執行下面這個指令來更新

```bash
apex upgrade
```

本文章使用的 Apex 版本是 `0.9.0`

### 1.建立專案資料夾

```bash
mkdir myproject && cd myproject
apex init
# 他會詢問你專案名稱,專案敘述,這邊請各位朋友自行發揮
# 然後詢問你是否要使用 Terraform 來管理 infrastructure
# 我建議選擇 yes, 我們之後的範例會搭配 Terraform
# 然後他會要你選擇你需要的環境,這邊可以按照習慣的開發方式來選擇,記得至少要填寫 dev
# 接著會問你是否要將 Terraform 的狀態儲存到 S3 上，如果你有選擇搭配 Terraform的話 這邊建議選擇 yes
```

### 1.1安裝 Terraform (選配)
Terraform是一個用來管理 AWS infrastructure 的工具(也可以管理其他雲端服務)，你可以把他想像成另外一個 AWS CloudFormation 。

下面是安裝 Terraform 的網址
https://www.terraform.io/downloads.html


### 2.設定 AWS credentials
你的 User 會需要 `AWSLambdaFullAccess` 的權限

#### 設定環境變數
```bash
$ export AWS_ACCESS_KEY=AWS_account_access_key
$ export AWS_SECRET_KEY=AWS_account_secret_key
$ export AWS_REGION=AWS_region
```

或是用[其他方法](http://apex.run/#aws-credentials)來設定 AWS credentials

### 3.設定 AWS role

#### 方法一:手動建立 role

#### 方法二: 使用 Terraform
確認你有安裝 Terraform ，並且有設定好 AWS credentials ，同時 AWS credential有相對應的權限
為了方便測試可以先選擇 `AdministratorAccess`，不過實際開發的時候記得要設定好權限。

```bash
apex infra apply
```

### 4. 部署 
好了千辛萬苦之後終於要開始部署我們的 lambda function 了

```bash
apex deploy
```

### 5. 執行 lambda function
成功部署了 lambda function ，當然要趕快來測試一下才行，在 terminal 執行

```bash
apex invoke hello
```

你應該會看到 

```
{"hello":"world"}
```

如果你順利做到這邊，恭喜，你已經完成你的第一個 lambda function ，可以在你的履歷加上 serverless 這個技能。


## use webpack to package your modules
在 `project.json` 加入 

```js

  "handler": "lib.default",
  "hooks": {
    "build": "../../node_modules/.bin/webpack --config ../../webpack.config.js",
    "clean": "rm -fr lib"
  }
```

`webpack.config.js`

```js
module.exports = {
  entry: './index.js',
  target: 'node',
  output: {
    path: './lib',
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    noParse: [/validate\.js/],
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: [/node_modules/]
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  }
}
```

`lib/search.js`

```js
export default function(e, succed,fail) {
    // your search imp code....
    search(e,function(result) {
        succeed(result);
    }, function(err) {
        fail(err);
    });

}
```

`function/my_fn1/index.js`

```js
import search from '../../lib/search'

export default function(e, ctx) {
    console.log('processing event: %j', e)

    search(e,function(result) {
        ctx.succeed(result);
    }, function(err) {
        ctx.fail(err);
    });

}
```


```bash
apex init
#記得選擇使用 terraform
apex infra apply
apex deploy
```
這樣就完成了建置 Lambda 需要的相關資源，還有上傳你的第一個 Lambda fucntion

接著你可以使用

```bash
apex invoke hello
```

來觸發


##todo
* good title
