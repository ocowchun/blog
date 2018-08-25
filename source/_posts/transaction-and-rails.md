---
title: Transaction Isolation Level
description: Database 的 Transaction Isolation Level 來改善 data consistency
tags:
  - database
  - transaction
  - rails
date: 2018-07-17 21:34:17
---


> Transaction Isolation Level 是 DB 幫我們封裝 concurrency 操作的一個介面，讓我們只需要指定 Isolation Level 就可以達到資料變動粒度的要求。

## Isolation Level
Isolation Level 代表當你的 Transaction 在執行時，要如何與其他同步執行的 Transaction 互動，在上資料庫課程的時候都會提到，這邊快速簡介一下:
* Read uncommitted: 最寬鬆的 Isolation ，顧名思義會讀取到尚未 commit 的資料。
  * 假設兩個 Transaction tx1, tx2 同步執行，當 tx1 寫入資料到 table1, 可是還沒有 commit 時， tx2 可以讀取到該筆資料。
* Read committed: 比 Read uncommitted 嚴格，只會讀取 commit 的資料，不過有 non-repetable read 的問題。
  * non-repetable read: 如果 Transaction tx1, tx2 同步執行
  * tx1 先讀取 row1, transaction 尚未結束
  * tx2 修改 row1，然後 transaction 結束，成功 commit
  * tx1 再一次讀取 row1, 這時會讀到 row1 修改過的版本
* Repeatable reads: 比 Read committed 嚴格，不會有 non-repetable read 的問題，不過會有 phantom reads
  * `同一時間只能有一個 Transaction 對某一筆資料作修改(i.e., order id=456)`
  * phantom reads: 如果 Transaction tx1, tx2 同步執行
  * tx1 先讀取 table1， transaction 尚未結束
  * tx2 新增一筆資料到 table1 然後 transaction 結束，成功 commit
  * tx1 再一次讀取 table1，這時會讀到 tx2 新增的資料
* Serializable: 最嚴格的執行方式，會等價於一次只執行一個 transaction 不會有 phantom reads，不過 performance 最差。
  * `同一時間只能有一個 Transaction 對某個集合的資料作修改(i.e., user 123 在 3 月份的 payments)`


很多時候我們只記得 Transaction 而忘記 Isolation Level,因此可能產生許多預期之外的行為，比如說很容易認為 Transaction 內的資料就是絕對安全，不會受到其他 Transaction 影響，可是在某些情況下，如果沒有正確的設定 Isolation Level 這樣的想法其實是不對的。

## When to use Isolation Level
在一些相對 critical 的任務裡面，我們不希望資料會有 race condition 的情況發生，最常見的情境是任何跟錢相關的事件。


### When to use Repeatable reads
付款時我們希望可以避免重複付款的情形發生，這時候可以用 Repeatable reads 來達成，概念上就是幫 payment 上鎖，確保單一時間只能有一個 transaction 做付款的動作

* tx1(Repeatable reads): find payemt(id=123) and set payment.processing = true
* tx2: find payemt(id=123) and set payment.processing = true ，因為 tx1 設定了 Repeatable reads 在 tx1 完成錢，其他 transaction 都不可以修改 payemt(id=123)，因此 Transaction rollback

### When to use Serializable
經典的例子是會議室行程，會議室上的行程不可以有時間重疊的會議(i.e., 3/17 15:00~18:00 與 3/17 14:00~16:00)

當我要新增會議時，如果使用 Repeatable reads 或是更寬鬆的 Isolation Level:
* tx1(Repeatable reads): return 0 records when run `select count(1) from events where (start_time > 1500 and start_time < 1800) or (end_time > 1500 and end_time < 1800)`
* tx2(Repeatable reads): return 0 records when run `select count(1) from events where (start_time > 1400 and start_time < 1600) or (end_time > 1400 and end_time < 1600)`
* tx1: insert events (1500,1800)
* tx2: insert events (1400,1600)
* tx1: complete
* tx2: complete

兩個 Transaction 執行時沒有任何違反 Isolation Level 的情況，所以都順利執行，最後產生錯誤的結果。

如果使用 Serializable
* tx1(Serializable): return 0 records when run `select count(1) from events where (start_time > 1500 and start_time < 1800) or (end_time > 1500 and end_time < 1800)`
* tx2(Serializable): return 0 records when run `select count(1) from events where (start_time > 1400 and start_time < 1600) or (end_time > 1400 and end_time < 1600)`
* tx1: insert events (1500,1800)
* tx2: Transaction rollback, 因為有符合 query 的新 event(1500,1800) 被新增，就算 tx1 還沒有 commit

Serializable 會確保`同一時間只能有一個 Transaction 對某個集合的資料作修改`。

## Transaction in Rails

Rails 裡面我們可以透過 `transaction` 將多個 db 操作包在同一個 Transaction 裡面。比方說，我們希望同一時間只能有一個 Transaction 對 order 做 update 的動作

```rb
Order.transaction do
  order = Order.find(1)
  order.update(aasm_state: 'solved', solved_at: Time.now.to_i) unless order.solved_at
end
```

光是看上面的 code 可能會認為 id = 1 的 order 在同一個時間內只會只會有一個 Transaction 可以修改 id = 1 的 order，其實這樣的想法不見得是對的，這還要看你使用的 database 預設的 Isolation Level 比如說在 PostgreSQL 裡面預設的 Isolation Level 是 `read_committed`, 所以上面的寫法沒有辦法保證說同一時間只會有一個 transaction 對 id = 1 的 order 做修改。

想要真正做到其他 Transaction 不能對 id = 1 的 order 做修改的話，可以在 `transaction` 指定 Isolation Level 來達成

```rb
Order.transaction(isolation: :repeatable_read) do
  order = Order.find(1)
  order.update(aasm_state: 'solved', solved_at: Time.now.to_i) unless order.solved_at
end
```

這樣就會讓 db 限制同一時間所有執行的 Transaction 裡只有一個 Transaction 可以更新 id = 1 的 order，要記得把查詢 order 的 code，也放在 `transaction` block 裡面，否則 db 就沒有辦法知道!

```rb
# below code, order can be update more than one time in concurrent tranactions
order = Order.find(1)

Order.transaction(isolation: :repeatable_read) do
  order.update(aasm_state: 'solved', solved_at: Time.now.to_i) unless order.solved_at
end
```

當你興高采烈的加入 Isolation Level 讓你的 code 更 robust ，然後開心地執行測試的時候，測試失敗了😱

```rb
ActiveRecord::TransactionIsolationError: cannot set transaction isolation in a nested transaction
```

### 測試失敗的原因
rspec 預設會啟用 transactional_fixtures 來加速 example 之間清理資料的速度，所以你的測試最外面會包一個 transaction，可是這樣就會變成 nested transaction，目前 nested transaction 還不支援指定 Isolation Level。
[DatabaseCleaner](https://github.com/DatabaseCleaner/database_cleaner) 也會做類似的事情。解法是先把 transactional_fixtures 關掉，一律用 DatabaseCleaner 來管理清理資料的工作，然後當你的測試案例有需要指定 Isolation Level 的時候，調整清理資料的策略，改為使用 `deletion`。

`spec_helper.rb`
```rb
  config.use_transactional_fixtures = false
  config.around(:each) do |example|
    if example.metadata[:db_cleaner_strategy] == :deletion
      DatabaseCleaner.strategy = :deletion
    else
      DatabaseCleaner.strategy = :transaction
    end

    DatabaseCleaner.cleaning do
      example.run
    end
  end
```

`my_method_spec.rb`
```rb
  describe '#method_to_test', db_cleaner_strategy: :deletion do
    it "should work" do
      # your awesome test
    end
  end
```

## ref
* https://apidock.com/rails/ActiveRecord/ConnectionAdapters/DatabaseStatements/transaction
* http://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html
