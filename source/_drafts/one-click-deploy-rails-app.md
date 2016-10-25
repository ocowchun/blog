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