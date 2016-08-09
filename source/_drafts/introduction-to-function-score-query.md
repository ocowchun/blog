---
title: introduction-to-function-score-query
tags:
---
## Elasticsearch Function Score Query 介紹
Elasticsearch 是一個強大的搜尋系統，可以快速幫你的網站或是服務加上搜尋的功能，不過事情沒有這麼簡單，當你需要對搜尋功能做客製化調整的時候，

你就會開始覺得這東西怎麼這麼難用，

這次要介紹的是 [Function Score Query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html)

Function Score Query 可以讓你調整自訂 query 來調整文件的分數，對搜尋來說是非常實用的功能，比如說今天你想要上網買磚頭，你希望磚頭可以用重越好 可是又希望價格可以便宜一點，這種時候就可以透過 Function Score Query 針對磚頭重量與價格設定 query 來調整每個磚頭的分數。

下面是一個 Function Score Query 的 body

```json
{
  "query": {
    "function_score": {
        "query": {},
        "boost": "boost for the whole query",
        "functions": [
            {
                "filter": {},
                "FUNCTION": {},
                "weight": number
            },
            {
                "FUNCTION": {}
            },
            {
                "filter": {},
                "weight": number
            }
        ],
        "max_boost": number,
        "score_mode": "(multiply|max|...)",
        "boost_mode": "(multiply|replace|...)",
        "min_score" : number
    }
  }
}
```

我們要討論的東西都在 `function_score` 裡面，分別為 query,boost,functions,max_boost,score_mode,boost_mode,min_score

####query
Elasticsearch 原本支援的搜尋條件都會放在這裡，比如說你希望搜尋 `火龍果` ，通常我會使用 [Bool Query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html) 來尋找符合關鍵字的文件。

####boost

####functions
我們可以在這邊自訂 query function 來調整文件的分數
可以使用的 functions 包含了以下幾種:
#####script_score
>

#####[weight]()
>

#####[random_score](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html#function-random)
>產生隨機分數

#####field_value_factor
>

#####decay functions: gauss, linear, exp
>



,通常會用來對某些欄位作加成,比如說 薪水越高分數越高,距離越近分數越高


####max_boost

####score_mode
用來決定fucntions的scores要如何彙總,預設是將所有function_score相乘，
不過使用乘法會有下面這些問題:

- 當有一項 function score 為0時，結果就會是0
- 不容易調整 function 之間的權重(比如我希望 function a 佔30%,function b 佔 20%)
- 容易因為一項 function_score 的極大或極小,導致分數有很大的變化

上述提的問題，有部分可以透過 function 裡面的 factor來解決，不過有些沒辦法。
所以 score_mode 我通常會使用 sum，當然 sum 一樣會有 `容易因為一項 function_score 的極大或極小,導致分數有很大的變化` ，不過我們可以透過 factor 來減少這樣的影響。

####boost_mode
用來決定如何彙總 function_score與 query_score，預設是相乘，只要是相乘，就會有我剛才提到的問題，所以我通常也都會改為使用 sum
####min_score
