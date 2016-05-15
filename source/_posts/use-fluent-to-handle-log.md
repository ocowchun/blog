---
title: 使用 Fluentd 協助整理 log
date: 2016-05-14 23:38:55
tags: 
- Fluentd
- Log
---
## Quick Install
### before-install
#### Increase Max # of File Descriptors

Please increase the maximum number of file descriptors. You can check the current number using the ulimit -n command.

```sh
$ ulimit -n
```

If your console shows 1024, it is insufficient. Please add following lines to your /etc/security/limits.conf file and reboot your machine.

```
root soft nofile 65536
root hard nofile 65536
* soft nofile 65536
* hard nofile 65536
```


### Step 1 : Install from Apt Repository
For Ubuntu, “Ubuntu 14.04 LTS / Trusty”, “Ubuntu 12.04 LTS / Precise” and “Ubuntu 10.04 LTS / Lucid” are currently supported.

```sh
curl -L http://toolbelt.treasuredata.com/sh/install-ubuntu-trusty-td-agent2.sh | sh
```

### Step2: Launch Daemon

The /etc/init.d/td-agent script is provided to start, stop, or restart the agent.
```sh
$ sudo /etc/init.d/td-agent restart
$ sudo /etc/init.d/td-agent status
td-agent (pid  21678) is running..
```

Please make sure your configuration file is located at /etc/td-agent/td-agent.conf.

### Step3: Post Sample Logs via HTTP

By default, /etc/td-agent/td-agent.conf is configured to take logs from HTTP and route them to stdout (/var/log/td-agent/td-agent.log). You can post sample log records using the curl command.

```sh
$ curl -X POST -d 'json={"json":"message"}' http://localhost:8888/debug.test
```

## [Config Introduction](http://docs.fluentd.org/articles/config-file)
1. **source** directives determine the input sources.
2. **match** directives determine the output destinations.
3. **include** directives include other files.
4. **system** directives set system wide configuration.


### source:where all the data come from
設定要輸入的log
```
<source>
  type forward
  port 24224
</source>
```
source directive一定要包含`type`參數,`type`會決定要使用哪個input plugin

### match:Tell fluentd what to do!
通常用於將event輸出到其他系統(eg:file,hdfs,s3...etc)
```
<match myapp.access>
  type file
  path /var/log/fluent/access
</match>
```
match directive一定要包含match pattern與`type`參數
`match pattern`決定有些資料需要輸出,`type`會決定要使用哪個output plugin

#### [match pattern](http://docs.fluentd.org/articles/config-file#match-pattern-how-you-control-the-event-flow-inside-fluentd)

## tail log 101
### tail Rails log

#### 1. add below to `Gemfile`
```rb
gem 'lograge'
gem "logstash-event"
```

#### 2. add below to `config/application.rb`
```rb
        config.lograge.enabled = true
        config.lograge.formatter = Lograge::Formatters::Logstash.new
```


#### 3. comment `config/environments/production.rb` log_formatter

```rb
  # config.log_formatter = ::Logger::Formatter.new 
```

#### 4. add `lograge` to `Gemfile`
```rb
gem 'lograge'
``` 

#### 5. add this line to `config/environments/production.rb`
```rb
    config.lograge.formatter = Lograge::Formatters::Logstash.new
```

#### 6. add below to `td-agent.conf`
```
<source>
  type tail
  path /home/vagrant/apps/your-rails-app/shared/log/production.log
  tag debug.test
  format json
</source>
```


### tail nginx log
```
<source>
  type tail
  path /var/log/nginx/access.log
  tag debug.test
  format nginx
</source>
```

## integrate fluent with kibana
### 1. install kibana
#### 1.1 download and extract kibana 

```sh
$ curl -O http://download.elastic.co/kibana/kibana/kibana-4.1.0-snapshot-linux-x64.tar.gz
$ tar cvf kibana-4.1.0-snapshot-linux-x64.tar.gz
```

#### 1.2 install pm2

```sh
$ sudo npm install -g pm2
```

#### 1.3 edit `config/kibana.yml` in `kibana-4.1.0-snapshot-linux-x64`

```yml
elasticsearch_url: "http://your-elasticsearch-url:9200"
```

#### 1.4 add `kibana-process.json` to kibana folder

```js
{
  "script": "./src/bin/kibana.js",
  "max_memory_restart": "100M",
  "env": {
    "NODE_ENV": "production",
    "CONFIG_PATH": "./config/kibana.yml"
  }
}
```

#### 1.5 start kibana

```
$ pm2 start kibana-process.json
```


### 2. setting elasticsearch
修改`elasticsearch.yml`,設定`http.cors.enabled`為true
```yml
http.cors.enabled: true
```

### 3. install  Elasticsearch plugin for td-agent

```sh
sudo apt-get install libcurl4-openssl-dev
sudo /usr/sbin/td-agent-gem install fluent-plugin-elasticsearch
```

### 4. edit`td-agent.conf`,send nginx log to elastic search
[link](http://docs.fluentd.org/recipe/nginx/elasticsearch)
```
<source>
  type tail
  path /var/log/httpd-access.log #...or where you placed your Apache access log
  pos_file /var/log/td-agent/httpd-access.log.pos # This is where you record file position
  tag nginx.access #fluentd tag!
  format nginx # Do you have a custom format? You can write your own regex.
</source>

<match **>
  type elasticsearch
  logstash_format true
  host <hostname> #(optional; default="localhost")
  port <port> #(optional; default=9200)
  index_name <index name> #(optional; default=fluentd)
  type_name <type name> #(optional; default=fluentd)
</match>
```

這樣就可以使用kibana來檢視log

[before-install](http://docs.fluentd.org/articles/before-install)
[config-file](http://docs.fluentd.org/articles/config-file)
[match pattern](http://docs.fluentd.org/articles/config-file#match-pattern-how-you-control-the-event-flow-inside-fluentd)
