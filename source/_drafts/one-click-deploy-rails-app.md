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
Sudo 的網站是使用 [Ruby on Rails](http://rubyonrails.org/) 開發並架設在 [Amazon EC2](https://aws.amazon.com/tw/ec2/) 上，以前是用 [Capistrano](http://capistranorb.com/) 來部署網站， Capistrano 官方的文件寫得很爛，詳細的使用方式主要是參考 [Reliably Deploying Rails Applications](https://leanpub.com/deploying_rails_applications) 這本書。

使用 Capistrano 的缺點在於比較不容易去變動機器的數量，另外每次部署的時候都是去變動原本機器的內容，有時候難免會發生一些奇怪的靈異現象，為了增加部署的速度，可以快速地調整需要的機器數，同時擁有相對乾淨的執行環境，所以我們在今年九月開始決定要實作新的部署流程(沒想到剛做完沒多久就宣布要關站了 = =)。

一開始的想法是想要 code commit 到 master branch 並且通過測試後，CI 會將最新的 code 打包成一個 image ，丟到 [Auto Scaling group](https://aws.amazon.com/tw/autoscaling/) 後，去變動 [ELB](https://aws.amazon.com/tw/elasticloadbalancing/)，聽起來好像也還好，不過實際下去做的時候才發現了不少問題，這篇文章就是我們實作這個部署流程的相關紀錄，希望可以幫助到需要的朋友。

## 核心概念
### 1. 建置 Image
### 2. 動態更新組態檔案(config)
### 3. Deployment

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
接下來是談動態更新組態檔案，在我們的應用程式裡面會有許多的設定比如 Facebook App ID, Database URL, etc 機器本身也會有需多的設定，例如第三方服務的 URL, License, etc [12-Factor App](https://12factor.net/config) 提到不要將 config 寫死在 code 裡面，亦或是寫死在機器裡面。

將組態設定抽離出來，啟動 Image 再注入有許多的好處:

1. 不需要因為組態設定改變重新打包 Image
2. 不同 Stage 的 Application 可以盡可能地共用同一個 Image
3. 更進一步的是當組態設定變動後，自動去更新到相關的機器，然後重啟對應的服務。

[Consul](https://www.consul.io) 是一個很方便的工具，可以用來作 Health Check, Service Discovery, Key Value Store

[Consul Template](https://github.com/hashicorp/consul-template): 使用 Consul 的 Key Value Store 產生檔案的工具，很適合用來變動設定檔，當 Consul Key Value 變動的時候，會去調整對應的 template 產生新的 config ，然後重啟相關的服務。

做法就是在 Image 裡面包入 Consul, Consul Template 還有相關的設定，Instance 啟動時，會自動去尋找 Consul Server，找到之後 Consul Template 就會根據 Consul Key Value Store 去產生對應的 config ，當你需要變動設定檔的時候，你只需要在 Key Value Store 變動， Consul Template 就會自動產生新的設定重啟相關的服務，使用這樣的方式就可以簡單完成組態設定的相關操作。

## Deployment
我們目前的做法建立兩個 ASG(ASG1, ASG2)，將 ASG2 註冊到 ELB 然後把 ASG1 移掉，不過這樣的做法會有個問題在於 ASG2 裡面的 instance 需要先通過 ELB 的 health check, ELB 才會開始將流量導向 instance。
<blockquote class="imgur-embed-pub" lang="en" data-id="a/Hsg3Q"><a href="//imgur.com/Hsg3Q"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>

雖然很多人覺得從 Slack 打指令來部署很潮，不過我自己是連打指令都很懶，所以我們是自己另外做了一個網站來部署，每當一個新的 Image 打包好的時候，就會自動部署到 staging 同時在 Slack 跳通知，如果我們想要部署到 production 的話，就點擊通知上的連結去執行部署的操作。
<blockquote class="imgur-embed-pub" lang="en" data-id="a/eyUU1"><a href="//imgur.com/eyUU1"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>

### Reference: 
* [Using a Blue-Green Deployment Strategy in AWS](http://docs.aws.amazon.com/opsworks/latest/userguide/best-deploy.html#best-deploy-environments-blue-green)
雖然裡面用的是 opsWork 不過許多概念都相通

* [Deep Dive into Blue/Green Deployments on AWS](http://www.slideshare.net/AmazonWebServices/dvo401-deep-dive-into-bluegreen-deployments-on-aws)
很棒的投影片，分享了從不同 level 去執行 blue green deployment 的優缺點

* [Blue/Green Deployments on AWS](https://d0.awsstatic.com/whitepapers/AWS_Blue_Green_Deployments.pdf)





