---
title: '[筆記] Elasticsearch Significant Terms Aggregation'
tags:
  - Elasticsearch
date: 2018-08-25 18:27:04
description: 'Elasticsearch 兩種看起來相似的 Aggregation: Terms 跟 Significant Terms 的差異。'
---

使用 Kibana 的時候發現兩種看起來相似的 Aggregation: Terms 跟 Significant Terms，兩者會有不同的效果。

## [Terms Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html)
一般常用的 Aggregation。概念類似 SQL 的 Group By，用指定的 field 來計算文件數，預設回傳文件數最多的前十個 term。比方說官方文件的例子

```
GET /_search
{
    "aggs" : {
        "genres" : {
            "terms" : { "field" : "genre" }
        }
    }
}
```

結果會回傳 `genre` 中出現次數最多的 term 與文件數。

```js
{
    ...
    "aggregations" : {
        "genres" : {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets" : [
                {
                    "key" : "electronic",
                    "doc_count" : 6
                },
                {
                    "key" : "rock",
                    "doc_count" : 3
                },
                {
                    "key" : "jazz",
                    "doc_count" : 2
                }
            ]
        }
    }
}
```

## [Significant Terms Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-significantterms-aggregation.html)

Significant Terms 會回傳資料集裡面的 uncommonly common terms。用個例子來解釋會比較容易了解。假設我們試圖要尋找盜刷信用卡的商家，手上的資料有消費者清單、消費者的消費商家紀錄與被盜刷的消費者清單。我們可以連結盜刷清單與消費者的消費店家紀錄，找出有問題的消費者最常消費的店家。然後我們會發現這些店家通常也是一些有名的店家比如說 Amazon，大部分的消費者都會在這些知名店家消費，這樣的結果沒有什麼意義。如果我們可以發現一些在受害消費者中出現頻率高於整體頻率的消費店家，他們有很高的機會是嫌疑犯。這就是 Significant Terms 的意義，**尋找在特定子集合出現頻率高於整體頻率的資料**。

這邊舉另外一個官方的例子:
mlratings 這個 index 紀錄了使用者喜歡的電影，一共有 69796 筆資料， schema 如下:

```js
{
  "_index": "mlratings",
  "_type": "mlrating",
  "_id": "00IC-2jDQFiQkpD6vhbFYA",
  "_score": 1,
  "_source": {
     "offset": 1,
     "bytes": 108,
     "movie": [122,185,231,292,
        316,329,355,356,362,364,370,377,420,
        466,480,520,539,586,588,589,594,616
     ],
     "user": 1
  }
}
```

我們想要從看過 movie 46970 的 users 尋找類似風格的其他電影，所以我們的 query 需要包含 moive 46970，而 aggregation 的 field 為 moive，整個 query 如下。

```js
GET mlratings/_search
{
  "size" : 0,
  "query": {
    "filtered": {
      "filter": {
        "term": {
          "movie": 46970
        }
      }
    }
  },
  "aggs": {
    "most_sig": {
      "significant_terms": {
        "field": "movie",
        "size": 6
      }
    }
  }
}
```

回傳的結果中第一名是自己，然後你會注意到第二名 52245 的 doc_count 比第三名 8641 的 doc_count 小，排名卻比較前面，這是因為 52245 在看過 46970 的 user 中出現的頻率 (59/271 = 0.2177) 比 52245 在所有 user 中出現的頻率 (185 / 69796 = 0.00265) 大多了，因此他排在比較前面。實際的分數計算方式在文件上沒有找到，只有一些相關的 [parameter](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-significantterms-aggregation.html#_parameters_5) 可以調整
```js
{
   "aggregations": {
      "most_sig": {
         "doc_count": 271, 
         "buckets": [
            {
               "key": 46970,
               "key_as_string": "46970",
               "doc_count": 271,
               "score": 256.549815498155,
               "bg_count": 271
            },
            {
               "key": 52245, 
               "key_as_string": "52245",
               "doc_count": 59, 
               "score": 17.66462367106966,
               "bg_count": 185 
            },
            {
               "key": 8641,
               "key_as_string": "8641",
               "doc_count": 107,
               "score": 13.884387742677438,
               "bg_count": 762
            }...
         ]}
```

## ref
https://www.elastic.co/guide/en/elasticsearch/guide/current/significant-terms.html
https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-significantterms-aggregation.html