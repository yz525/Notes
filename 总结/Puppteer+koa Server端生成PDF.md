# Puppteer+koa Server 端生成 PDF

# 大概的流程

1. 准备数据
1. 编写模板：**ejs**
1. 使用数据&ejs 模板生成 html：**koa-views**
1. 使用无头浏览器打开 html 并生成 pdf: **puppeteer**
1. 将生成的 pdf 返回给前端下载：**koa-send**

\*\*

# 具体步骤

## 编写模板

EJS 官方文档：[https://ejs.bootcss.com/](https://ejs.bootcss.com/)
**ejs**: 嵌入式 JavaScript 模板引擎, 直接写 html

- `<%` '脚本' 标签，用于流程控制，无输出。
- `<%_` 删除其前面的空格符
- `<%=` 输出数据到模板（输出是转义 HTML 标签）
- `<%-` 输出非转义的数据到模板
- `<%#` 注释标签，不执行、不输出内容
- `<%%` 输出字符串 '<%'
- `%>` 一般结束标签
- `-%>` 删除紧随其后的换行符
- `_%>` 将结束标签后面的空格符删除

**举个栗子**：

```html
<% let balance = 0 %> <% statement.forEach(item=>{%>
<div
  style="
      display: grid;
      grid-template-columns: repeat(6, 16.6%);
      width: 100%;
      justify-items: center;
      break-inside: avoid;
    "
>
  <% balance = balance+ +item.amountReal- +item.amountFinance %>
  <div><%- item.deliveryTime %></div>
  <div><%- item.invoice %></div>
  <div><%- item.remark %></div>
  <div><%- item.amountReal %></div>
  <div><%- item.amountFinance %></div>
  <div><%- balance.toFixed(2) %></div>
</div>
<% }) %>
```

在 app.js 同级目录中建 views 文件夹，用于存放要写的 ejs 模板

## 使用数据&ejs 模板生成 html

在 app.js 页面 引用 koa-views 模板渲染：

```javascript
const views = require("koa-views")
app.use(views("views", { extension: "ejs" }))
```

然后：

```javascript
const html_template = "index.ejs" //模板渲染的入口
const data_template = {} //用来存放模板渲染需要的数据
await ctx.render(html_template, data_template)
```

这个时候如果直接返回，可以看到 ctx.body 里就是渲染完成的 html 文件

## 生成 pdf

[生成 pdf 的方法文档](https://pptr.dev/#?product=Puppeteer&version=v5.5.0&show=api-pagepdfoptions)

```javascript
const browser = await puppeteer.launch({
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
    headless: true,
  })
  const page = await browser.newPage()
  await page.setContent(pdf_string)
  // await page.addStyleTag({
  //   path: "views/index.css",
  // })
  await page.pdf({
    format: "A4",
    path: "views/bill.pdf",
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: {
      top: 300,
      bottom: 110,
      left: 50,
      right: 50,
    },
  })
  await browser.close()
}
```

如果需要设置页眉页脚，displayHeaderFooter 设为 true，直接写好放进去一起生成就好
[https://pptr.dev/#?product=Puppeteer&version=v5.5.0&show=api-pagepdfoptions](https://pptr.dev/#?product=Puppeteer&version=v5.5.0&show=api-pagepdfoptions)

```javascript
const footerTemplate = `
  <div style="margin:25px">
  <div style="font-size:10px">footer内容</div>
  </div>
 `
```

写页眉页脚可以引用 page.pdf 提供的 class，直接显示 date title url pageNumber totalPages

```javascript
;<span class="pageNumber" /> - <span class="totalPages" />
```

## 生成的 pdf 返回给前端下载

执行到上面一步，pdf 已经被生成
后端：

```javascript
const send = require("koa-send")
let src = `views/bill.pdf`
ctx.attachment(src)
await send(ctx, src)
```

前端：

```javascript
//api
getBillPdf: async (data) => {
    return instance.post(url + "/billPdf", data, { responseType: "blob" })
 },
 //发送请求&接收下载
 let res = await financeApi.getBillPdf(data)
        console.log(res.data, "看看返回结果")
        let content = (res && res.data) || ""
        let blob = new Blob([content])
        let fileName =
          "bill" + ".pdf"
        if ("download" in document.createElement("a")) {
          // 非IE下载
          let elink = document.createElement("a")
          elink.download = fileName
          elink.style.display = "none"
          elink.href = URL.createObjectURL(blob)
          document.body.appendChild(elink)
          elink.click()
          URL.revokeObjectURL(elink.href) // 释放URL 对象
          document.body.removeChild(elink)
        } else {
          // IE10+下载
          navigator.msSaveBlob(blob, fileName)
        }
```

# 一些问题

## 服务器

主要有两个问题：

1. puppeteer 插件启动 chrome 失败： Error: Failed to launch the browser process!
2. [安装中文字体](https://www.ilanni.com/?p=11746)

## 插入图片

- 直接在 src 里写路径，图片并没有被加载出来。

  我的解决方案是把 png 转成了 data url 再放进的页眉

## 自动换页 div 被拦腰砍断

- 在 style 里加了 break-inside: avoid;

## 多 pdf 传输

- 尝试了两种方案

1. 在 server 生成多个 pdf 并打包，传回前端；
   [https://juejin.cn/post/6844903584983678990#heading-3](https://juejin.cn/post/6844903584983678990#heading-3)

   发送完要记得删掉生成的 pdf 们

   ```javascript
   var fs = require("fs"),
     path = require("path")
   const deleteFile = {
     deleteFiles: function (paths) {
       //   传入待删除文件的path
       paths.forEach((item) => {
         let curPath = path.join(__dirname, item.name)
         console.log(curPath)
         if (fs.existsSync(curPath)) {
           fs.unlinkSync(curPath)
           console.log(`删除文件：${item.name}`)
         } else {
           console.log(`${item.name}不存在！`)
         }
       })
     },
   }

   deleteFile.deleteFiles(paths) //paths生成的时候顺便把名字push进数组
   ```

2. puppteer 如果在 page.pdf 执行时不写 path 就会输出 pdf 的 buffer，把一个 buffer 的数组传回前端，再由前端成 pdf 并下载
   ```javascript
   let fileName = "Bill-" + name + ".pdf"
   let buffer = new Uint8Array(content)
   let blob = new Blob([buffer])
   console.log(blob)
   ```

- 此外还可以考虑在 server，使用 pdf buffer 合并成同一个 pdf 文件传回
  [参考这个链接的问题四：封面页眉页脚如何隐藏](https://blog.csdn.net/zhai_865327/article/details/104792646)

## server 抛出的错误

在请求时设置了 responseType: "blob"，当接收到的是 Error 是，message 显示为 undefined

配置前端的 axios,对 blob 类型的 error 进行处理

```javascript
if (error.request.responseType === "blob") {
  function blob2Json(data) {
    return new Promise(function (resolve, reject) {
      let errInfo = {}
      let reader = new FileReader()
      reader.readAsText(data, "UTF-8")
      reader.onload = function () {
        errInfo = JSON.parse(reader.result)
        console.log(errInfo)
        info.status = errInfo.status
        info.message = errInfo.message || "服务器内部错误"
        resolve(info)
      }
    })
  }
  await blob2Json(error.response.data)
}
```
