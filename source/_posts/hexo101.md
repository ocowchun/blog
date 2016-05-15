---
title: hexo101
date: 2016-05-15 20:49:55
tags:
- Hexo  
---
最近想要開始來寫點技術相關的文章，本來想使用 [medium](https://medium.com/)，可是他本身不支援 markdown，剛好看到 [abalone0204](http://abalone0204.github.io/) 使用的 [Hexo](https://hexo.io/zh-tw/)，就順手研究了一下，感覺還蠻適合拿來寫技術文章的，希望可以持續下去，雖然網路上介紹關於如何使用 Hexo架站的分享很多，不過還是遇上不少問題，像是如何安裝主題、public 與 source code 的 branch 要怎麼分，所以整理了一下 Hexo 常用的指令。

## [安裝 Hexo](https://hexo.io/zh-tw/docs/index.html)

```bash
$ npm install -g hexo-cli
```

## [建立資料夾](https://hexo.io/zh-tw/docs/setup.html)

```bash
$ hexo init <folder>
$ cd <folder>
$ npm install
```

## [新增文章](https://hexo.io/zh-tw/docs/writing.html)

```bash
$ hexo new [layout] <title>
```

## 更換主題(themes)
以 [again](https://github.com/DrakeLeung/hexo-theme-again) 為例

#### 1. 下載主題

```bash
$ git submodule add https://github.com/DrakeLeung/hexo-theme-again.git themes/again
```

#### 2. 設定config

```yml
theme: again
```


## 部署到 github pages
> 我目前是將 source code 放在 `master` branch，然後另外開 `gh-pages` ，來放置 public 的檔案。

#### 1. 設定 config

```yml
deploy:
  type: git
  repo: git@github.com:your-name/your-repo.git
  branch: gh-pages
```

#### 2. 執行下面指令進行部署

```bash
$ hexo deploy --generate
```
