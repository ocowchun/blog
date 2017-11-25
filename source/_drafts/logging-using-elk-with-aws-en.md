---
title: logging_using_elk_with_aws-en
tags:
---

In recent months, Our team started build our own logging system, we try the popular ELK stack and learn some knowledge about how to build a good loggin system. We want to share this experience with you.


## Why we need a logging system
First things you need to think is do you really need a logging system?, In our context we face these problems and logging system can help us resolve them.

* We want to know user path given user_id(Help developer debug easily)
* We want to know whole system's health status, request throughput, response time in on page
* We want to know specific system's resouce usage(memory, load)


Some problems can be done in Datadog, and some problems can be done in Google Analytics. But they all have their limit. For example, we use [Heroku](https://www.heroku.com/) to host our applications, it need additional setup to watch the data in Datadog. Because Heroku didn't provide much metric, the information we can see in Datadog is not that much. Concern the cost, Datadog is not a good deal for us. Google Analytics is awesome when you want to see the overall website usage but it can't help when you try to see whole user's request history.

## How to build your ELK stack
After team discussion, we decide to host an ELK stack as our logging system. The incoming problem is where to host the ELK. we set some requirements to help use choose solution.

* Easy to scale out
* We don't want to spend too much time to maintain the ELK stack
* It can't be too expensive

We evaluate a lot solutions

### Logit
https://logit.io/
It provide whole ELK stack, you can start your own ELK system with a few setup.

### Logz.io
https://logz.io/
Elaticsearch only, no Logstash. It provide a custom log shipper for Heroku.

### Qbox
https://qbox.io/
Elaticsearch only, no Logstash.

### Elastic Cloud
https://www.elastic.co/cloud
Elaticsearch only, no Logstash.

The best choice is Logit, but the cost is a few too high for us. Therefore we decided to find an alternative that may spends us a little time to setup and maintain with lower costs.

Since AWS is our familiar cloud platform. We decide to try AWS Elasticsearch. For Logstash we try the [ECS](https://aws.amazon.com/ecs/) to host Logstash container ,thanks to these [series posts](https://medium.com/@devfire/deploying-the-elk-stack-on-amazon-ecs-dd97d671df06). It save us a lot time to setup Logstash.

The whole AWS ELK solution will spend you a lot time to setup. Since this post is focused on ELK itself, I will write another post about how to setup ELK in AWS.

So you complete the setup for your ELK stack now, no matter which solution you select, there are some question deserved to concern.

## Your log
You have to decide what information you want to collect, this will influence many dimension including but not limited to, how to write your Logstash config, how to estimate you daily disk usage, how many requests your Logstash server will receive per minutes or seconds. Alougth you may think is good to collect all information in your first mind, you will find it's a real tragedy when you see a lot messy and meaningless logs in your kibana dashbaord.

So it's a better idea to concern in fist day. What kind of log you want to ship to your elasticsearch, and waht kind of log you can just drop it.

Before released you awesome logging system to prodcution stage, I find is a good way let ingest production log to Logstash and then ship to elasticsearch. You will see what will happen if you don't do something to control the situation. In that time you will try to figure out what data is you really need.

Besides you will also find is really hard to make every log in correct format. There are a bunch of edge case you can't image when you start write you Logstash config. You should adjust you Logstash config and see what happend again and again until everything looks ok to you.

### Authenicate
Authenicate is a serious issue and deserved you spend time on it, make sure your Logstash server can't be access from public or at least add HTTP auth on it. you should also check you Elasticsearch and kibana server, especially you kibana website since you will put a lot dashbaord on it. and kibana will be access by most people in you organization, you should think a good way to do access control, in our case we add a HTTP proxy server in front of kibana, and
use the same JWT authenication that is used in our admin site therefore only people who can access the admin site can access our kibana server.

### Performance And Storage
Test your Logstash server in production load, and decide how many Logstash instance you need, there are also some useful configuration can help you increase throughput, for example you can adjust the queue type to `persisted` to allow Logstash receive more request in the same time and process it latter, you can find details in this [link](https://www.elastic.co/guide/en/logstash/5.6/persistent-queues.html). Official document like [Performance Troubleshooting Guide](https://www.elastic.co/guide/en/logstash/5.6/performance-troubleshooting.html) and [Deploying and Scaling Logstash](https://www.elastic.co/guide/en/logstash/5.6/deploying-and-scaling.html) is worth to read

There are another critical problem you need to decide. How many day of the log you want to retention, it will depends on the usecase of your logging system. In general store least than 14 days log can help you handle most common case. After decide the retention day, you should estimate how many disk you will consumed in one day, and times the amount of day you want to keep, makre sure you elasticsearch disk is large enough. In addition you should decide how many shard you wnat to keep in one index. It's an important setting for Elasticsearch which will affect performance greatly.

Shard is the core component in Elasticsearch to write and query documents(you logs), the more shard you have, the more write and read performance you can gain, but it will also consume more system resource(CPU, memory,...), the default setting for shards is 5, which is a bit too much for common logging case(unless you have a bunch of log in one day)
There are some awesome post about shards, like [Capacity Planning](https://www.elastic.co/guide/en/elasticsearch/guide/current/capacity-planning.html), [Optimizing Elasticsearch: How Many Shards per Index?](https://qbox.io/blog/optimizing-elasticsearch-how-many-shards-per-index)

You can change shards number for your future index by below:

```js
// PUT https://es.your-awesome-domain.com/_template/logstash1

{
    "order": 1,
    "template": "logstash-*",
    "settings": {
        "number_of_shards" : 2
    }
}
```

Remember you can't change number of master shards after index create, so be careful to choose a correct size.


## After your logging system is on production.

Check you elasticsearch free storage space in regular time, it's very important to make sure you have enough space to write new log, delete the old index to release space when need. And backup your Elasticsearch. Don't forget the [GitLab disaster](https://about.gitlab.com/2017/02/10/postmortem-of-database-outage-of-january-31/). We always make mistake. A good backup solution can ease the damage occur by your fat finger or something you can't control. In our team, we backup our Elasticsearch a time everyday. You won't pay attention on it in normal time, but it will save your life when there are something really bad happened.

### Keep an eye on your Logstash server
Use [Datadog](https://www.datadoghq.com/), [CloudWatch](https://aws.amazon.com/cloudwatch) or similar tools to monitor your Logstash server. If your Logstash down, incoming logs will discard. So it's suggested that you should at least host two Logstash server to achieve high availability. Wrong configuration will cause incorrect data format in Elasticsearch which will reduce the quality of  query result. When you change the logstash configuration, do some test before deploy to production. Check the parse result is in correct format. [rubydebug](https://www.elastic.co/guide/en/logstash/current/plugins-outputs-stdout.html) is your good friend when you try to adjust configuration. [Blue green deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) or [rolling deployment](https://www.quora.com/What-is-meant-by-a-rolling-upgrade-in-software-development/answer/Ajay-Kumar-1381) are good pattern to deploy your Logstash server. It can help you to avoid server downtime.


## Conclusion
Build a logging system is like build a project, there are always something can improve. Focus on what you want to get from logging system, adjust it when need. A good logging system can help you understand more about your user and service.