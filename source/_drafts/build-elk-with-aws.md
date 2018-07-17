---
title: 使用 AWS 建置 ELK logging system
tags:
  - ELK
  - Elasticsearch
  - Logstash
  - Kibana
  - AWS
  - ECS
---

本文分享如何使用 AWS 來建置 ELK logging system

想要解決的問題

隨著業務的增長，我們需要一個 logging system 來協助我們處理各種問題
* 了解每個 API 的 throughput, response time
* 檢視特定 user 的使用路徑, 來解決使用者遇到的問題
* 確認系統的資源使用情況

由於先前已經有使用 Elasticsearch, Kibana 的經驗, 所以選擇了 ELK solution
不過除了這個之外還有其他許多值得考慮得好選擇 i.e. promethus

我們並不想要自己 hosted Elasticsearch, 因為需要自己處理 cluster 與 backup
Elasticsearch 的 hosted service 有很多, 比如 Elastic cloud, AWS Elasticsearch, logz.io, logit ...

每個都有個自己的優缺點

最後選擇的是 AWS Elasticsearch, 主要原因是
* 我們已經有在使用 AWS, 不需要另外去開一個新的 account,
* 價格相對便宜
* 可以使用 cloudwatch 檢驗 cluster helath status

缺點
* ES 版本較舊(5.3)
* authenicate 機制有夠難用
* disk 限制

## ELK 101


## AWS Elasticsearch
需要選擇 ec2, size, 需要注意的是 並不能無限開需要的 disk, 不同的 instance type 會有最高限制的 disk size

## Logstash

## ES Proxy
為了要可以 access 到 elasticsearch, kibana 同時又要避免 public access, 我們使用

感覺可以做得更好的方式是直接使用 security group 就像 RDS 那樣。

為了要讓 Logstash 可以 access 到, 


## 使用 ECS 來hosted logstash 與 es-proxy



目標

AWS Elasticsearch



