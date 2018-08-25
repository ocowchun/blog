#!/usr/bin/env node
// copy from https://github.com/meteor/hexo-s3-deploy/blob/master/index.js

var s3 = require('s3')

var config = {
  s3Options: {
    accessKeyId: process.env.AWS_BLOG_KEY,
    secretAccessKey: process.env.AWS_BLOG_SECRET,
    region: 'ap-northeast-1'
  }
}
var client = s3.createClient(config)

var uploader = client.uploadDir({
  localDir: '/Users/ocowchun/projects/github/blog/public',
  s3Params: {
    Prefix: '',
    Bucket: 'blog.ocowchun.com'
  }
})

uploader.on('error', function(err) {
  console.error('unable to sync:', err.stack)
})
uploader.on('progress', function() {
  console.log('progress', uploader.progressAmount, uploader.progressTotal)
})
uploader.on('end', function() {
  console.log('done uploading')
})
