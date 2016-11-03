# 一鍵部署 Rails App
> 分享 Sudo 如何實作一鍵部署 Rails App

## 核心概念
### 1. 建置 Image
### 2. 動態更新組態檔案(config)
### 3. Blue Green Deployment
### 4. 雜項(如何處理 db migration...etc)


## 建置 Image
個人覺得這是整個部署流程中最麻煩的部分，這樣處理好之後，後面的問題都不大，同時這邊也是差異最多的部分，因為每個人需要打包的內容都不一樣，所以需要花一些時間去研究與測試。

建置 Image 就是把所有需要的服務與 Application 的程式碼都包進去。
通常會包含以下幾種
1. Application Sourece Code (i.e. 你的 Rails App)
2. Application 的執行語言 (i.e. Ruby)
3. Web Server (Nginx/Apache)
4. data collector (Fluentd, Logstash, etc)
5. monitor (Datadog, New Relic, etc)
6. Service Discovery (Consul, etcd)
7. monit



我們主要是使用 Packer



## Reference: Using a Blue-Green Deployment Strategy in AWS
http://docs.aws.amazon.com/opsworks/latest/userguide/best-deploy.html#best-deploy-environments-blue-green

雖然裡面用的是 opsWork 不過許多概念都相通

比較不一樣的是他有兩組 elb

然後透過設定 route 53 權重將流量導向指定的 ELB

我們目前的做法是將 ASG2 註冊到 ELB 然後把 ASG1 移掉，不過這樣的做法會有個問題在於 ASG2裡面的 instance 也需要通過 ELB的health check,ELB 才會開始將流量導向 instance，使用 route 53 搭配 ELB group 的話就不用考慮這個問題，或許我們也可以用這樣的方式。

---- 

### 很棒的投影片，分享了從不同 level 去執行 blue green deployment 的優缺點
http://www.slideshare.net/AmazonWebServices/dvo401-deep-dive-into-bluegreen-deployments-on-aws

https://d0.awsstatic.com/whitepapers/AWS_Blue_Green_Deployments.pdf



## consul event

可以用來協助執行一些例行工作，比如說 rails 的 db:migrate
觸發一個 `db_migrate` 的 event，並且指定 node

然後再 consul client 設定好對應的 handler
要注意的是， consul 目前只要重新讀取，就會執行全部 watch 的事件，官方似乎將這樣的行為當作一種 feature (!?)
可以透過 [sifter](https://github.com/darron/sifter) 來避免不必要的執行。





