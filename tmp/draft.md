---
title: logging_using_elk_with_aws-en
tags:
---

start from usage problem not technical problem

## something you need to plan when setup ELK

### logging source
* What infromation you want to collect (related to how to write your logstash filter)
* Where is the log from (related to how to setup your logstash)
* The throughput of your log(how many logstash instance you have to run)
1. Queuing. Install a queuing system such as Redis, RabbitMQ, or Kafka. This is imperative to include in any ELK reference architecture because Logstash might overutilize Elasticsearch, which will then slow down Logstash until the small internal queue bursts and data will be lost. In addition, without a queuing system it becomes almost impossible to upgrade the Elasticsearch cluster because there is no way to store data during critical cluster upgrades.


https://www.elastic.co/blog/just_enough_redis_for_logstash
https://kibana.logstash.es/content/logstash/scale/



### search and store
* How many day of the log you want to retention
* How many size of log you will have per day
* adjust default index template!(shards, shards, shards!)

```js
{
    "order": 1,
    "template": "logstash-*",
    "settings": {
        "number_of_shards" : 2
    }
}
```

* how new the data you want to know (impact write performance)

### misc
* authenicate

### operation
* where to host your elk (deploy by yourself? AWS ES? Elastic Cloud? ...etc)
* how many elasticseach you need, (read and write performance, depends on your usage)



## something you need to plan when manage an exist ELK
* monitor Elasticsearch system resource usage(CPU, RAM)
* monitor logstash available (if it down, your log will not be record!)
* make sure you delete old index!
* backup
* alert solution with elasticsearch

## about kibana
* if you use kibana, yo need to design how to organize you query and dashboard
* 
