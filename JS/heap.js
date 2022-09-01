class Heap {
  constructor(arr = [], cmp = (a, b) => a < b) {
    this.arr = arr
    this.cmp = cmp
  }
  heapify() {
    if (this.size() <= 1) return
    for (let i = 1; i < this.size(); i++) {
      this.bubbleUp(i)
    }
  }
  size() {
    return this.arr.length
  }
  top() {
    if (!this.size()) return null
    return this.arr[0]
  }
  parentIndex(index) {
    if (!index) return null
    if (index > this.size()) return null
    return Math.floor((index - 1) / 2)
  }
  push(val) {
    // 在队尾传入相关元素
    this.arr.push(val)
    this.bubbleUp(this.size() - 1)
  }
  pop() {
    // 如果堆为空，直接返回null
    if (!this.size()) return null
    // 如果堆里只有一个元素，可以直接弹出堆顶
    if (this.size() === 1) return this.arr.pop()
    // 如果堆里超过一个元素，需要在弹出之前先把最后的元素交换到堆顶，然后再逐层向下对比得到该元素所在位置
    const top = this.arr[0]
    this.arr[0] = this.arr.pop()
    this.bubbleDown(0)
    return top
  }
  bubbleUp(index) {
    while (index) {
      const parentIndex = this.parentIndex(index)
      if (this.cmp(this.arr[index], this.arr[parentIndex])) {
        this.swap(index, parentIndex)
        index = parentIndex
      } else {
        break
      }
    }
  }
  bubbleDown(index) {
    const lastIndex = this.size() - 1
    while (index < lastIndex) {
      let curIndex = index
      let leftIndex = index * 2 + 1,
        rightIndex = index * 2 + 2
      if (
        leftIndex <= lastIndex &&
        this.cmp(this.arr[index], this.arr[leftIndex])
      ) {
        curIndex = leftIndex
      } else if (
        rightIndex <= lastIndex &&
        this.cmp(this.arr[index], this.arr[rightIndex])
      ) {
        curIndex = rightIndex
      }
      if (curIndex > index) {
        this.swap(index, curIndex)
        index = curIndex
      } else {
        break
      }
    }
  }
  swap(index1, index2) {
    ;[this.arr[index1], this.arr[index2]] = [this.arr[index2], this.arr[index1]]
  }
}
