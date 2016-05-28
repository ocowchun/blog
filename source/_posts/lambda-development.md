---
title: 使用 Apex 協助開發 AWS Lambda
tags: Lambda
date: 2016-05-15 16:46:00
---


本文將簡單分享如何快速的開發 [AWS Lambda](https://aws.amazon.com/tw/documentation/lambda/)
使用的語言為 JavaScript

使用 AWS Lambda 的好處在於你完全不用管 server 你就是寫code就對了。

不過他也有一些限制，例如目前只支援特定程式語言，每個 Lambda 的執行時間有限制(目前每次執行最長時間是 300秒)，可能不適合使用在需要建立 connection 的情境(i.e. mysql)

我個人目前使用 AWS Lambda 的用途包含:
1. 定期從DB整理資料，丟到 logstash
2. 定期監測特定數據，符合條件時，發出 Slack 通知
3. 定期整理資料，將資料打包成 csv 丟到 S3

將固定週期要執行的小程式，透過 CloudWatch Events 的設定，自動去執行 Lambda。

----

## Apex Introduction
[Apex](https://github.com/apex/apex) 的主要目的是協助我們管理 AWS Lambda 開發，包括打包 function 成 zip，上傳到S3、部署、查看特定 function 的log,使用 terraform 管理 Lambda 相關的 infrastructure。
Apex 主要是使用 Golang 開發，開發者包含知名的 TJ 大大。

----

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

### 1. 建立專案資料夾

```bash
mkdir myproject && cd myproject
apex init
# 他會詢問你專案名稱,專案敘述,這邊請各位朋友自行發揮
# 然後詢問你是否要使用 Terraform 來管理 infrastructure
# 我建議選擇 yes, 我們之後的範例會搭配 Terraform
# 然後他會要你選擇你需要的環境,這邊可以按照習慣的開發方式來選擇,記得至少要填寫 dev
# 接著會問你是否要將 Terraform 的狀態儲存到 S3 上，如果你有選擇搭配 Terraform的話 這邊建議選擇 yes
```

### 1.1 安裝 Terraform (選配)
Terraform是一個用來管理 AWS infrastructure 的工具(也可以管理其他雲端服務)，你可以把他想像成另外一個 AWS CloudFormation 。

下面是安裝 Terraform 的網址
https://www.terraform.io/downloads.html


### 2. 設定 AWS credentials
你的 User 會需要 `AWSLambdaFullAccess` 的權限

#### 設定環境變數
```bash
$ export AWS_ACCESS_KEY=AWS_account_access_key
$ export AWS_SECRET_KEY=AWS_account_secret_key
$ export AWS_REGION=AWS_region
```

或是用[其他方法](http://apex.run/#aws-credentials)來設定 AWS credentials

### 3. 設定 AWS role

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

----

## 專案架構
這邊我們簡單講述一下 Apex 的專案架構，假設我有一個簡單的 Apex 專案長得像下面這樣:

```
project.json
functions
├── bar
│   ├── function.json
│   └── index.js
└── foo
    ├── function.json
    └── index.js
```

### [project.json](https://github.com/apex/apex/blob/master/docs/projects.md)
每個 Apex 專案的根目錄都需要有一個 `project.json` ，這裡面會有專案的基本資料與設定，同時也會是每個 function 預設的設定。

``` javascript
{
  "name": "node",
  "description": "Node.js example project",
  "role": "arn:aws:iam::293503197324:role/lambda",
  "memory": 512
}
```

這裏我們可以設定專案的名字，這會影響到你在 AWS Lambda 裡面對應的 function name，如果你沒有使用  Terraform 的話，你會需要在這裏設定 role ，role 是實際執行 Lambda 時會對應到的角色，所以你可能會需要給他相關的權限，例如你的 Lambda 會需要讀取 DynamoDB，那你就會需要幫 role 設定相關的權限。詳細的設定可以看[這裡](https://github.com/apex/apex/blob/master/docs/projects.md)


### function
在 Apex 的架構下，`functions` 下的資料夾都會對應到一個 AWS Lambda，所以上述的情況，我會有 bar,foo 兩個 AWS Lambda 。


### [function.json](https://github.com/apex/apex/blob/master/docs/functions.md)
除了 `project.json` 外，你可以在每個 function 資料夾底下建立 `function.json` ，來設定這個 function 詳細的設定可以看[這裡](https://github.com/apex/apex/blob/master/docs/functions.md)

## 常用的 Apex 指令

### apex deploy
將 `functions` 下的每一個 `function` 部署到 AWS Lambda

### apex list
列出目前 AWS Lambda 上的 functions

### apex invoke <function-name>
執行指定的 function

### apex delete <function-name>
刪除指定的 AWS Lambda function

### apex infra
使用 Terraform ，之後會分享使用方式。

### apex logs 
顯示 AWS Lambda 執行的 log， 可以在後面指定 function name 例如 `apex logs hello` debug 很好用。

### apex metrics 
顯示 AWS Lambda 的相關數據，包含執行次數，錯誤...

----

## 使用 [webpack](https://github.com/webpack/webpack) 來打包 JavaScript
接下來會討論如何在 Apex 裡面使用 webpack，畢竟 nodejs 的哲學就是要把全部的東西都拆成 package 麻
，所以我們會講解怎麼將你的 lambda function 使用到 package 打包起來。

我們這裡使用除了打包 JavaScript 之外，也順便使用了 babel 來編譯你的 JavaScript ，這個年頭就是要寫 es6 才能顯得你是一個有跟上時代的工程師。

這裏的範例是使用 [request](https://github.com/request/request) 對 `https://status.github.com/api/status.json` 發出請求，取得目前 GitHub的狀況。

### 1 首先在 `project.json` 加入 

```js

  "handler": "lib.handle",
  "hooks": {
    "build": "../../node_modules/.bin/webpack --config ../../webpack.config.js",
    "clean": "rm -fr lib"
  }
```

### 2. 然後設定`webpack.config.js`

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

### 3. 設定 `package.json` 並執行 `npm install`

```javascript
{
  "name": "your-project-name",
  "version": "1.0.0",
  "description": "your-project-description",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "bluebird": "^3.4.0",
    "request": "^2.72.0"
  },
  "devDependencies": {
    "babel-loader": "^6.2.3",
    "babel-plugin-syntax-async-functions": "^6.3.13",
    "babel-plugin-transform-async-to-generator": "^6.4.6",
    "babel-plugin-transform-regenerator": "^6.4.4",
    "babel-plugin-transform-runtime": "^6.4.3",
    "babel-preset-es2015": "^6.3.13",
    "babel-preset-stage-0": "^6.3.13",
    "json-loader": "^0.5.4",
    "transform-loader": "^0.2.3",
    "webpack": "^1.12.13"
  }
}
```

### 4. 新增 `lib/github.js`

```js
let request = require('request');
let Promise = require('bluebird');

export function getStatus() {
    return new Promise(function(resolve, reject) {
        request('https://status.github.com/api/status.json', (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(response.body)
            }
        });
    });
}
```

### 5. 新增 `function/github_status/index.js`

```js
import {getStatus} from '../../lib/github';

exports.handle = function(e, ctx, cb) {
    getStatus().then((result) => cb(null, result)).catch((err) => cb(err))
}
```

### 6. 部署
就完成一個新的 function 叫做
apex 使用 資料夾作為 function name
然後我們一樣在 terminal 執行 `apex deploy` 來部署我們的新 function
最後執行 `apex invoke github_status` 就可以看到這個 function 的執行結果。

## 結論
在這邊我們簡單敘述了如何建立使用 apex 來開發 AWS Lambda ，撇除一開始的麻煩設定，接下來當你需要建立新的 function 的時候，你只需要在 `functions` 下建立對應的 `function_name` 資料夾，完成你的程式碼，然後執行 `apex deploy` 就可以了。

我覺得 Apex 搭配 AWS Lambda 是一個可以讓你真正專注在開發程式，而不需要花費心力去管理系統營運的開發方式，當然他也有許許多多麻煩的地方，我會在之後跟大家分享。
