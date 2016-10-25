---
title: 一鍵部署 Rails App
tags:
  - Deployment
  - Packer
  - Consul
  - AWS
  - Chef
---

本文主要是跟大家分享 [Sudo](https://sudo.com.tw/) 如何實作一鍵部署 Rails App 

## 背景介紹
Sudo 的網站是使用 [Ruby on Rails](http://rubyonrails.org/) 開發的，目前是架設在 [Amazon EC2](https://aws.amazon.com/tw/ec2/) 上，部署的時候
，以前是用 [Capistrano](http://capistranorb.com/) 來部署， Capistrano 官方網站的文件寫得很爛，所以詳細的使用方式主要是參考 [Reliably Deploying Rails Applications](https://leanpub.com/deploying_rails_applications) 這本書，為了增加部署的速度，與快速地調整需要的機器數，決定要實作新的部署流程。

## 核心概念
### 1. 建置 Image
### 2. 動態更新組態檔案(config)
### 3. Blue Green Deployment
### 4. 雜項(如何處理 db migration...etc)

## 建置 Image

個人覺得這是整個部署流程中最麻煩的部分，Image 建置有做好，後面的問題都不大，同時這也是差異最多的部分，因為每個 Application 需要打包的內容都不一樣，所以需要花一些時間去研究與測試。

建置 Image 就是把所有需要的服務與 Application 的程式碼都包進去。
通常會包含以下幾種
1. Application Sourece Code (i.e. 你的 Rails App)
2. Application 的執行語言 (i.e. Ruby)
3. Web Server (Nginx/Apache)
4. data collector (Fluentd, Logstash, etc)
5. monitor (Datadog, New Relic, etc)
6. Service Discovery (Consul, etcd)
7. monit

建置 Image 的方式有很多種，你可以手動 ssh 進去機器然後一個指令一個指令下，或是寫 Shell Script ，不過在這個 DevOps 的時代，大家通常會使用一些更方便的工具來協助建置，比如說 [Chef](https://www.chef.io/chef/)、[Ansible](https://www.ansible.com/)、[Puppet](https://puppet.com/) ，詳細的差別我沒有特別研究，我只知道 Chef 是使用 Ruby 編寫，Ansible 好像執行速度很快(Steam 勸敗一哥 Henry 說的)

在 Sudo 我們主要是使用 Chef 去建置環境，建置完成之後需要打包環境方便之後使用，除了各家雲端服務內建的打包服務外，你可以透過 [Packer](https://www.packer.io/) 來完成這項工作， Packer 可以將你的環境根據設定打包成對應的 Image ，支援 Amazon EC2, DigitalOcean, Google Compute Engine, Microsoft Azure, etc

詳細的內容可以參考我們家 Steam 勸敗一哥 Henry 的文章 [Kitchen 與 Packer 實戰](https://henry40408-blog.herokuapp.com/kitchen-and-packer/)


## 動態更新組態檔案
接下來是談動態更新組態檔案，在我們的應用程式裡面會有許多的設定
比如 Facebook App ID, Database URL, 

我們會這些設定抽出來 啟動 Image 的時候再注入
這樣的好處是可以方便地變動，不需要因為 設定改變重新打包 Image
同時也可以讓不同 Stage 的 Application 不需要特別去打包
更進一步的是當 這些參數變動的時候，自動去更新到相關的機器，然後重啟對應的服務。

[Consul](https://www.consul.io) 是一個很方便的工具，
可以用來作 Health Check, Service Discovery, Key Value Store

[Consul Template](https://github.com/hashicorp/consul-template)，當 Consul Key Value 變動的時候，
會去調整對應的 template 產生新的 config ，然後重啟相關的服務。


## Blue Green Deployment

### Reference: Using a Blue-Green Deployment Strategy in AWS
http://docs.aws.amazon.com/opsworks/latest/userguide/best-deploy.html#best-deploy-environments-blue-green

雖然裡面用的是 opsWork 不過許多概念都相通

比較不一樣的是他有兩組 elb

然後透過設定 route 53 權重將流量導向指定的 ELB

我們目前的做法是將 ASG2 註冊到 ELB 然後把 ASG1 移掉，不過這樣的做法會有個問題在於 ASG2裡面的 instance 也需要通過 ELB的health check,ELB 才會開始將流量導向 instance，使用 route 53 搭配 ELB group 的話就不用考慮這個問題，或許我們也可以用這樣的方式。

---- 

### 很棒的投影片，分享了從不同 level 去執行 blue green deployment 的優缺點
http://www.slideshare.net/AmazonWebServices/dvo401-deep-dive-into-bluegreen-deployments-on-aws

https://d0.awsstatic.com/whitepapers/AWS_Blue_Green_Deployments.pdf

