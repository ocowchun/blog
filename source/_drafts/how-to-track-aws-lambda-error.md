---
title: 如何追蹤 AWS Lambda 錯誤
tags:
  - Lambda
  - Rollbar
  - SNS
---

[AWS Lambda](https://aws.amazon.com/tw/lambda/)是個很方便的東西，可以免去管理機器的成本，又只需要按照使用的次數付費，不過 Lambda 目前在管理上還有很多麻煩的地方，比如說檢視使用數據(觸發次數、執行時間、成功/失敗數)，錯誤訊息的追蹤。

Lambda 本身有提供簡單的 dashboard，可以查看觸發次數、執行時間、失敗數...等，不過一次只能查看一個 function，當你的 function 數變多時(比如說 30 個，這其實是非常容易達到的數字) ，如果你想要查看哪些 function 的使用次數最多、執行時間最久，或其他資料就必須自己手動做一些處理。比如自己設定 CloudWatch Dashboard，不然就是自己寫程式來呈現相關數據。


因為習慣使用 [Rollbar](https://rollbar.com/) 來管理錯誤相關的事情，所以決定研究一下如何把 Lambda 的錯誤丟到 [Rollbar](https://rollbar.com/)。一開始的想法是當發生錯誤的時候，使用 [SNS](https://aws.amazon.com/sns/) 發出通知，然後設定一個追蹤錯誤的 Lambda 訂閱該通知，將相關資料與錯誤訊息丟到 Rollbar，一切看起來是那麼的美好，不過因為部分的 Lambda 有設定 VPC ，沒辦法使用 SNS ，找了一下之後發現可以從 CloudWatch Log 來處理。

 Lambda 執行結束時(不論成功或失敗) 都會將結果輸出到 CloudWatch Log 。因此可以透過訂閱 ClouWatch Log ，將偵測到包含 errorMessage 的 CloudWatch 丟到 Rollbar 來追蹤錯誤。這邊有個麻煩的地方在於，每個 Lambda 都會有一個自己的 log group，所以如果你寫了 10個 Lambda 你就有 10 個 log group 需要追蹤，就算使用 [Terraform](https://www.terraform.io/) 來設定還是很麻煩，不過至少比一個一個 CloudWatch 去看方便多了。

## 訂閱 ClouWatch Log 追蹤錯誤的 Lambda 程式碼
```js
let zlib = require('zlib');
let rollbar = require("rollbar");
let _ = require('underscore');
let Promise = require('bluebird');

//建立錯誤訊息的物件
function buildErrorItem(data) {
  let item = {};
  item.title = data.logGroup.replace('/aws/lambda/', '');

// 判斷是否有錯誤訊息
  let logEvent = _.find(data.logEvents, function(event) {
    return event.message.indexOf('errorMessage') >= 0;
  });

  item.logStream = data.logStream;
  item.logEvents = data.logEvents;

// 如果有錯誤訊息，才需要通知 Rollbar
  if (logEvent) {
    item.reportRollbar = true;
  } else {
    item.reportRollbar = false;
  }
  return item;

}

// 呼叫 buildErrorItem 產生錯誤訊息的物件，然後判斷是否需要通知 Rollbar
function excuteReportMessage(data) {
// 初始化 Rollbar
  const ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN = 
  env.ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN;
  rollbar.init(ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN);

  let item = buildErrorItem(data);
  let title = item.title;

  return new Promise(function(resolve, reject) {
    if (item.reportRollbar) {
      rollbar.reportMessageWithPayloadData(title, {
        level: "error",
        custom: item
      }, null, function() {
        resolve("report rollbar success");
      });
    } else {
      resolve("no necessary to report");
    }
  });
}

// CloudWatch Log 輸入的方式是 buffer ，需要先轉成 json 物件
// 然後呼叫 excuteReportMessage 回報 Rollbar
function reportCWLError(input, ctx) {
  let payload = new Buffer(input.awslogs.data, 'base64');
  console.log("===aws cloud watch log===");
  zlib.gunzip(payload, function(e, result) {
    if (e) {
      ctx.fail(e);
    } else {
      let data = JSON.parse(result.toString('ascii'));
      excuteReportMessage(data).then(function() {
        ctx.succeed({
          result: 'success'
        });
      }).catch(function(err) {
        ctx.fail(err);
      });
    }
  });
}

exports.handle = function(input, ctx) {
  if (input.awslogs && input.awslogs.data) {
    reportCWLError(input, ctx);
  } else {
    ctx.fail("no aws log");
  }
}

```

## 訂閱 Lambda CWL 的 Terraform 程式碼

```go
resource "aws_lambda_permission" "allow_report_error_access_my_awesome_lambda_cwl" {
    statement_id = "AllowExecutionFromCWL2"
    action = "lambda:InvokeFunction"
    function_name = "arn:aws:lambda:ap-northeast-1:12345678:function:report_error"
    principal = "logs.ap-northeast-1.amazonaws.com"
    source_arn = "arn:aws:logs:ap-northeast-1:12345678:log-group:/aws/lambda/my_awesome_lambda:*"
    source_account = "12345678"
}

resource "aws_cloudwatch_log_subscription_filter" "allow_report_error_access_my_awesome_lambda_cwl" {
  name = "allow_report_error_access_my_awesome_lambda_cwl"
  log_group_name = "/aws/lambda/my_awesome_lambda"
  filter_pattern = ""
  destination_arn = "arn:aws:lambda:ap-northeast-1:12345678:function:report_error"
  depends_on = ["aws_lambda_permission.allow_report_error_access_my_awesome_lambda_cwl"]
}
```


## References
* [Lambda Function Handler (Node.js)](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)
