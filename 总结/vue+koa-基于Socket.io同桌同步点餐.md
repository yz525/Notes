## 流程


1. 前端收到桌台信息会进行类似注册的操作，这里使用 setTable 把 socked.id 记录到预设的以 tableId 为 key 值的对象里
1. 用户操作改变购物车时，使用 remindChangeCart 把购物车信息传到 server；在记录的对象和 IO.sockets.sockets 中比对确认需要提醒的 socket（同桌其他用户），并依次使用 brocastChangeCart 把购物车信息广播。
1. 前端接收 brocastChangeCart 信息并覆盖购物车。
## 一些处理


因为做的是整个购物车信息覆盖，考虑以下情况：
A 和 B 在一桌吃饭。A 点餐点了一半，B 加入。B 操作购物车，直接覆盖掉了 A 之前的操作。
所以这里处理：在 B 进行注册操作的时候，向 A 请求一次购物车内容。
## Server 代码


```javascript
const { socketPort } = require("../config/env")
console.log(`Now listening socket port ${socketPort}`)
var _ = require("underscore")
const IO = require("socket.io").listen(socketPort)
let table2Socket = {}

IO.on("connection", (socket) => {
  console.log("server 连接socket成功", socket.id)
  // 使用一个对象对同桌台的不同socket进行记录
  socket.on("setTable", function (tableId) {
    updateMap.addToTable(tableId, socket.id)
  })
  // 接收购物车改变信息并广播给同桌其他用户
  socket.on("remindChangeCart", function (data) {
    var toName = data.tableId
    var toIds = JSON.parse(JSON.stringify(table2Socket[toName] || []))
    toIds.forEach((toId) => {
      let toSocket = IO.sockets.sockets[toId]
      if (toSocket) {
        if (toId != socket.id) {
          toSocket.emit("brocastChangeCart", {
            msg: data.msg || "",
            value: data.data,
          })
        }
      } else {
        // 如果该socket不存在，从数组里清除
        updateMap.deleteFromTable(toName, toId)
      }
    })
  })
  socket.on("disconnect", function () {
    console.log("connection is disconnect!")
  })
})

const updateMap = {
  addToTable: (tableId, socketId) => {
    if (table2Socket[tableId]) {
      updateCartByTable(tableId, socketId)
      if (!table2Socket[tableId].includes(socketId)) {
        table2Socket[tableId].push(socketId)
      }
    } else {
      table2Socket[tableId] = [socketId]
    }
  },
  deleteFromTable: (tableId, socketId) => {
    table2Socket[tableId].splice(table2Socket[tableId].indexOf(socketId), 1)
  },
  clearByTable: (tableId) => {
    table2Socket[tableId] = []
  },
}

// 还有一些不对外暴露的方法
const updateCartByTable = (tableId, socketId) => {
  // 找一个已经连接的socket 请求同步购物车
  let toIds = table2Socket[tableId] || []
  for (let toId of toIds) {
    let toSocket = _.findWhere(IO.sockets.sockets, { id: toId })
    if (toSocket) {
      console.log(toId)
      if (toId != socketId) {
        toSocket.emit("getCartByTable")
        break
      }
    } else {
      updateMap.deleteFromTable(tableId, toId)
    }
  }
}
```


## 前端代码


引入了 vue-socket.io
在 App.vue 里写 sockets 连接和接收的部分


```javascript
sockets: {
  //连接
    connect() {
      console.log("通信连接成功", this.$socket.id)
      if (this.tableId) {
        this.$socket.emit("setTable", this.tableId)
      }
    },
    // 接收同桌其他用户的购物车信息 并提示
    brocastChangeCart({ msg, value }) {
      if (msg) {
        this.$cus_toast({
          type: "warning",
          msg: msg,
          time: 1500,
        })
      }
      this.SET_CART(value) //同步进vuex
    },
    // 新用户进入后 同步购物车
    getCartByTable() {
      this.$socket.emit("remindChangeCart", {
        tableId: this.canteen.tableId,
        data: this.cart || [],
      })
    },
  },
```


操作购物车时 emit 购物车信息


```javascript
methods: {
    emitChangeCart: _debounce(function (msg) {
      this.$socket.emit("remindChangeCart", {
        tableId: this.tableId,
        msg,
        data: this.cart,
      })
    }, 500),
  handleAddToCart(food, num) {
     //一通添加操作
      this.emitChangeCart({
        notice_ch: `${this.customer.name || "未知用户"}添加了${
        food.foodName
      }`
      })
    }
  },

}
```
