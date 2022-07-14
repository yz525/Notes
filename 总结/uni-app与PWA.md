# 流程

1. [把 Hbuilder 建的 uni-app 项目换到 vue-cli 中](https://www.cnblogs.com/zhanglongke/p/14097886.html)
2. [添加 PWA 支持](https://www.zklighting.ltd/?p=1214#Safariapple-touch-icon)

# PWA 简介

- 待完善

# 具体步骤

- 待完善

# 一些问题

1. 添加到主屏幕后 url 里的 query parameters 被忽略了

   类似 https://.../#/?tableId=1234 添加到桌面之后访问的 url 就变成了 https://.../#/

   - 这个是因为在 manifest 里有一个{start_url: "."}设置，它影响了动态的 url 的使用。虽然我注意到**start_url**是一个必选项，但是在打包之后的 manifest 我删除了**start_url**字段，确实解决了这个问题。
   - [参考](https://stackoverflow.com/questions/53015748/iphone-add-to-home-screen-ignores-querystring-parameters)

2. 我在不同的文档中都看到有提到，安卓端的 chrome 应该会在打开之后有弹窗提示，类似于检测到了 PWA 的配置是否需要添加到桌面。但是目前我没有见到过这个弹窗
3. 添加到桌面以后的 PWA 我到底应该以什么样的形式去控制更新
