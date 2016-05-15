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

## AWS Lambda Introduction

## Apex Introduction
Apex的主要目的是協助我們管理 AWS Lambda 開發，包括打包 function 成 zip，上傳到S3、部署、查看特定 function 的log,使用 terraform 管理 Lambda 相關的 infrastructure。
Apex 主要是使用 Golang 開發，開發者包含知名的 TJ 大大。


## use Babel to package your modules



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
