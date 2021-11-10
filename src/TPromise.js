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


  /**
   * 原封不动的返回参数
   * @param {*} reason 
   * @returns 
   */
  static reject = (reason) => {
    return new TPromise((_, reject) => {
      reject(reason)
    })
  }


  /**
   * 等待一组promise的结果，只要有一个失败既失败，如果传入错的数组中不是promise、或者thenable，而是立即值，
   * 这个值也会先使用promise.resolve处理贵违法的promise
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
          // TPromise.resolve 将立即promise规范化
        TPromise.resolve(promise).then(
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
   * 竞态，取第一个改变状态的promise的决议或者是拒绝的结果,
   * 如果数组中传递了立即值，那么这个值会最先被获取，因此，传入立即值是没有意义的
   * @param {*} promise 
   */
  static race = (promises) => {
    if (!promises instanceof Array) {
      throw new TypeError(`${typeof promises} is not iterable (cannot read property Symbol(Symbol.iterator))`)
    }

    return new TPromise((resolve, reject) => {
      // TPromise.resolve 将立即promise规范化
      promises.map(promise => TPromise.resolve(promise).then(resolve, reject))
    })
  }



  /**
   * 处理then中的两个回调方法
   * @param {*} val promise的值
   * @param {*} thenCb then方法中的两个回调
   * @param {*} resolve 新promise的resolve
   * @param {*} reject 新promise的reject 用于处理执行失败的状态
   */
  thenCallbackHandler = (result, resolve, reject) => {
    try {
      // 在then方法中不能返回当前promise
      if (result === this) {
        throw new TypeError('Chaining cycle detected from promise')
      }
      if (result instanceof TPromise) {
        // 用返回的promise的结果来修改下一个promise的状态
        result.then(resolve, reject)
      } else {
        resolve(result)
      }
    } catch (error) {
      reject && reject(error)
    }
  }

  /**
   * 错误补货，返回一个promise
   * @param {*} cb 
   * @returns 
   */
  catch = (cb) => {
    return new Promise((resolve, reject) => {
      if (this.status === TPromise.rejected) {
        cb && this.thenCallbackHandler(cb(this.value), resolve, reject) || reject(this.value)
      }
    })
  }

  then = (onFulfilled, onRejected) => {

    return new TPromise((resolve, reject) => {
      this.callbacks.push({
        successCallback: (val) => {
          // 当前一个then方法的 onFulfilled 执行完成并返回时，resolve去修改当前返回的promise的值，
          onFulfilled
            && this.thenCallbackHandler(onFulfilled(val), resolve, reject)
            || resolve(val) // then穿透处理
        },
        errorCallback: (reason) => {
          // 前一个promise的失败或异常并影响新返回的promise的状态，因此此处执行 errorCallback 后调用resolve
          onRejected
            && this.thenCallbackHandler(onRejected(reason), resolve, reject)
            || reject(reason) // then穿透处理
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
    
    // resolve('我是myPromise');
  // }, 1000);
    // console.log('德玛西亚');
  reject("我是错误的原因")
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
  .then(
    (res) => {
    console.log('这是前一个then中返回的结果1', res);
      return new TPromise((resolve) => {
        setTimeout(() => {
          resolve('噢哈哈哈哈')
        }, 2000)
      })
    },
    (reason) => {
      console.log('---myPromise---rejected2', reason);
    }
  )
  .then(
    (res) => {
      console.log('这是前一个then中返回的结果2', res);
    },
    (reason) => {
      console.log('前一个then中可能出错了', reason);
    }
)
  



const p4 = new TPromise(resolve => {
  setTimeout(() => resolve('p4 fulfilled'), 1000)
})
TPromise.resolve(p4)
  .then(
    res => {
      console.log('静态resolve', res);
    },
    reason => {
      console.log('静态方法中返回错误了', reason);
    }
  )


// console.log('myPromise', myPromise);


const promise = new TPromise((resolve, reject) => {
  reject('我是原生TPromise产生的结果')
});
promise
  .then(() => {
    return '德玛西亚'
  }) // 未出里rejected的状态
  .then(
    (res) => {
      console.log('这里不该执行:', res);
    },
    // reason => {
    //   console.log('处理拒绝状态：', reason);
    // }
  )
  .then(
    (res) => {
      console.log('阿范德萨发神鼎飞丹砂：', res);
    },
     reason => {
      console.log('处理拒绝状态：', reason);
    }
  )






const p1 = new TPromise(resolve => {
  setTimeout(() => {
    resolve('p1 fulfilled')
  }, 1000);
})
const p2 = new TPromise((resolve, reject) => {
  resolve('p2 fulfilled')
})




TPromise.reject(p2).then(
  res => {
    console.log('这是什么结果', res);
  },
  reason => {
    console.log('这是什么原因', reason);
  }
)




TPromise.all([p1, p2, p4]).then(
  res => {
  console.log('TPromise.all:', res);
  },
  reason => {
    console.log('reason 失败', reason);
  }
)


// catch 测试
const pp5 = new TPromise((resolve, reject) => {
  reject("catch 测试")
})
pp5.catch(err => {
console.log('sdafsadfdsafdsafds', err);
}).catch(err => {
  console.log('catch测试:', err);
})





/**
 * 1、promise的值可以穿透then
 * 2、then的回调返回promise的处理
 * 3、在then方法中不允许返回当前promise,应该提示循环引用异常
 * 4、静态方法 
 *  resolve,注意处理如果传递的一个promise需要处理其结果
 *  reject、
 *  all
 *  race等实现
 * 5、如果then方法中没有传递对应的决议处理方法，对应的决议状态降被下一个传递了对应处理方法的地方处理，promise状态的穿透性
 */



const pp2 = new Promise((_, reject) => {
  reject('原始promise拒绝处理')
})

pp2.catch(
  res => {
    console.log('catch:', res);
  }
)



console.log('异步test');