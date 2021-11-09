class TPromise {
  static pending = 'PENDING';
  static fulfilled = 'FULFILLED';
  static rejected = 'REJECTED';

  constructor(callback) {
    this.status = TPromise.pending;
    this.value = null;
    this.callbacks = [];
    try {
      callback && callback(this.fulfilledHandler, this.rejectedHandler);
    } catch (error) {
      this.rejectedHandler(error)
    }
  }


  runCallbacks = () => {
    setTimeout(() => {
      this.callbacks.forEach(({ successCallback, errorCallback }) => {
        if (this.status === TPromise.fulfilled) {
          successCallback && successCallback(this.value);
        }
  
        if (this.status === TPromise.rejected) {
          errorCallback && errorCallback(this.value);
        }
      })
    });
  }


  /**
   * 静态方法 如果是promise直接返回该promise
   * @param {*} value 区分你是promise还是其他值
   * @returns 
   */  
  static resolve = (value) => {

    if (value instanceof TPromise) {
      return value
    } 
    return new TPromise(resolve => {
      resolve(value)
    })
  }

  static reject = (reason) => {
    if (reason instanceof TPromise) {
      return reason
    }
    return new TPromise((_, reject) => {
      reject(reason)
    })
  }


  /**
   * 等待一组promise的结果，只要有一个失败既失败
   * @param {*} promises 
   * @returns 
   */
  static all = (promises) => {

    if (!promises instanceof Array) {
      throw new TypeError(`${typeof promises} is not iterable (cannot read property Symbol(Symbol.iterator))`)
    }
    return new TPromise((resolve, reject) => {
      let results = []
      promises.forEach((promise, index) => {
        promise.then(
          (val) => {
            results[index] = val;
            if (results.length === promises.length) {
              resolve(results)
            }
          },
          reason => {reject(reason)}
        )
      })
    })
  }


  /**
   * 竞态，取第一个改变状态的promise的结果
   * @param {*} promise 
   */
  static race = (promises) => {
    if (!promises instanceof Array) {
      throw new TypeError(`${typeof promises} is not iterable (cannot read property Symbol(Symbol.iterator))`)
    }

    return new TPromise((resolve, reject) => {
      promises.map(promise => promise.then(resolve, reject))
    })
  }



  /**
   * 处理then中的两个回调方法
   * @param {*} val promise的值
   * @param {*} thenCb then方法中的两个回调
   * @param {*} resolve 新promise的resolve
   * @param {*} reject 新promise的reject 用于处理执行失败的状态
   */
  thenCallbackHandler = (val, thenCb, resolve, reject) => {
    try {
      // 如果then方法没有提供 onFulfilled 方法，那么返回前一个promise的value 从而实现then的穿透
      let result = thenCb && thenCb(val) || this.value
      // 在then方法中不能返回当前promise
      if (result === this) {
        throw new TypeError('Chaining cycle detected from promise')
      }
      if (result instanceof TPromise) {
        // 用返回的promise的结果来修改下一个promise的状态
        result.then(resolve, reject)
      } else {
        resolve && resolve(result)
      }
    } catch (error) {
      reject && reject(error)
    }
  }



  then = (onFulfilled, onRejected) => {

    return new TPromise((resolve, reject) => {
      this.callbacks.push({
        successCallback: (val) => {
          // 当前一个then方法的 onFulfilled 执行完成并返回时，resolve去修改当前返回的promise的值，
          this.thenCallbackHandler(val, onFulfilled, resolve, reject);
        },
        errorCallback: (reason) => {
          // 前一个promise的失败或异常并影响新返回的promise的状态，因此此处执行 errorCallback 后调用resolve
          this.thenCallbackHandler(reason, onRejected, resolve, reject);
        }
      });
    })
  }


  /**
   * 修改promise的状态并保存结果，只能修改一次
   * @param {*} val 
   * @param {*} status 
   */
  resolveAndRejectHandler = (val, status) => {
    if (this.status === TPromise.pending) {
      this.status = status;
      this.value = val;
      this.runCallbacks();
    }
  }

  /**
   * promise成功的处理回调
   * @param {*} value 成功的结果
   */
  fulfilledHandler = (value) => {
    this.resolveAndRejectHandler(value, TPromise.fulfilled)
  }

  /**
   * promise 处理失败的回调
   * @param {*} reason 失败的原因
   */
  rejectedHandler = (reason) => {
    this.resolveAndRejectHandler(reason, TPromise.rejected)
  }

}


/**
 * 封装一个延长方法
 * @param {*} time 
 * @returns 
 */
function delay(time) {
  return new TPromise((resolve, reject) => {
    setTimeout(resolve, time);
  })
}







const myPromise = new TPromise((resolve, reject) => {
  // setTimeout(() => {
    // console.log('aaa',aaa);xw
    
    resolve('我是myPromise');
  // }, 1000);
    // console.log('德玛西亚');
  // reject("我是错误的原因")
});

myPromise
  .then((res) => {
    console.log('---myPromise---resolve1', res);
    return new TPromise(resolve => {
      setTimeout(() => {
        resolve('两秒之后修改了状态')
      }, 2000);
    })
  })
  .then((res) => {
    console.log('这是前一个then中返回的结果1', res);
    return new TPromise((resolve) => {
      setTimeout(() => {
        resolve('噢哈哈哈哈')
      }, 2000)
   })
  }, (reason) => {
    console.log('---myPromise---rejected2', reason);
  })
  .then(
    (res) => {
      console.log('这是前一个then中返回的结果2', res);
    },
    (reason) => {
      console.log('前一个then中可能出错了', reason);
    }
)
  


TPromise.resolve(() => {
  return '将一个方法封装为可信任的promise'
})
  .then(
    res => {
      console.log('静态resolve', res());
    },
    reason => {
      console.log('静态方法中返回错误了', reason);
    }
  )


// console.log('myPromise', myPromise);


// const promise = new Promise((resolve, reject) => {
//   resolve('我是原生promise')
// });

const p1 = new TPromise(resolve => {
  setTimeout(() => {
    resolve('hhhhhh')
  }, 1000);
})
const p2 = new TPromise((resolve,reject) => {
  setTimeout(() => {
    resolve('hhhhhhreject')
  }, 2000);
})


TPromise.race([p1, p2]).then(
  res => {
  console.log('all', res);
  },
  reason => {
    console.log('reason 失败', reason);
  }
)



/**
 * 1、promise的值可以穿透then
 * 2、then的回调返回promise的处理
 * 3、在then方法中不允许返回当前promise,应该提示循环引用异常
 * 4、静态方法 
 *  resolve,注意处理如果传递的一个promise需要处理其结果
 *  reject、
 *  all
 *  race等实现
 */


console.log('异步test');