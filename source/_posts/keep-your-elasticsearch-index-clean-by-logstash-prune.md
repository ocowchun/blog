---
title: 使用 Prune filter plugin 讓 Elasticsearch Index 保持乾淨
tags:
  - Elasticsearch
  - Logstash
date: 2018-08-22 23:13:49
description: 'Logstash Prune filter plugin 可以讓你的 Elasticsearch Index Mapping 變乾淨'
---


公司 Application Server 的 log 會使用 [HTTPS drain](https://devcenter.heroku.com/articles/log-drains) 的方式傳送到 Logstash Server 接著再匯入到 Elasticsearch。Log 的格式是採用 [logfmt](https://brandur.org/logfmt) 所以設置了 [Kv filter plugin](https://www.elastic.co/guide/en/logstash/current/plugins-filters-kv.html) 來 parse。不過常常碰到不符合規則的 log 導致 kv 沒有辦法正確 parse，結果就是 Elasticsearch 的 index 有許多奇形怪狀的 fields。最近再升級 Elasticsearch 版本的時候，順便研究了一下這個問題，發現可以用 [Prune filter plugin](https://www.elastic.co/guide/en/logstash/current/plugins-filters-prune.html) 來改善產生奇怪 fields 的情況。

做法很簡單，在你的 pipeline conf 裡面加入下面這段

```
    filter {
      prune {
        blacklist_names => [ ":", "\?", "\/"]
      }
    }
```

就可以過濾掉名字包含 `:`, `?`, `/` 的 field，使用了之後 Index Mapping 變得好乾淨啊!

如果想要使用更多的規則來過濾可以參考 [Prune Filter Configuration Options](https://www.elastic.co/guide/en/logstash/current/plugins-filters-prune.html#plugins-filters-prune-options)