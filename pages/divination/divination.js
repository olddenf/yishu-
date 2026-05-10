const app = getApp();

Page({
  data: {
    yaoIndex: 1,
    yaoResults: [],
    isAnimating: false,
    showCoins: false,
    coinResults: [false, false, false],
    coinAnimating: [false, false, false],
    progressPercent: 0,
    timer: '00:00',
    startTime: null,
    timerInterval: null
  },

  onLoad() {
    this.setData({
      yaoIndex: 1,
      yaoResults: [],
      isAnimating: false,
      showCoins: false,
      coinResults: [false, false, false],
      coinAnimating: [false, false, false],
      progressPercent: 0,
      startTime: Date.now()
    });
    this.startTimer();
  },

  onUnload() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
  },

  goBack() {
    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  startTimer() {
    this.data.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.data.startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      this.setData({
        timer: `${mins}:${secs}`
      });
    }, 1000);
  },

  castCoin() {
    if (this.data.isAnimating || this.data.yaoResults.length >= 6) return;
    
    // 先重置铜钱显示为默认（都是阳）
    this.setData({
      isAnimating: true,
      showCoins: true,
      coinResults: [false, false, false]
    });

    // 延迟一小会后开始翻转动画
    setTimeout(() => {
      const coinAnimating = [false, false, false];
      const coinResults = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];
      
      // 逐个开始翻转动画
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          coinAnimating[i] = true;
          this.setData({ coinAnimating: [...coinAnimating] });
        }, i * 100);
      }

      // 翻转动画结束后才显示铜钱结果
      setTimeout(() => {
        this.setData({
          coinResults: coinResults
        });
        
        // 再等待一会然后处理爻的结果
        setTimeout(() => {
          const yinCount = coinResults.filter(r => r).length;
          let yaoType, yaoSymbol, yaoMark = '';
          
          if (yinCount === 0) {
            yaoType = 'old_yang';
            yaoSymbol = '—';
            yaoMark = '○';
          } else if (yinCount === 1) {
            yaoType = 'yang';
            yaoSymbol = '—';
          } else if (yinCount === 2) {
            yaoType = 'yin';
            yaoSymbol = '--';
          } else {
            yaoType = 'old_yin';
            yaoSymbol = '--';
            yaoMark = '×';
          }

          const newResults = [...this.data.yaoResults, { type: yaoType, symbol: yaoSymbol, mark: yaoMark }];
          const progress = (newResults.length / 6) * 100;

          this.setData({
            yaoResults: newResults,
            yaoIndex: Math.min(newResults.length + 1, 6),
            progressPercent: progress,
            isAnimating: false,
            coinAnimating: [false, false, false]
          });

          if (newResults.length >= 6) {
            setTimeout(() => {
              if (this.data.timerInterval) {
                clearInterval(this.data.timerInterval);
              }
              app.globalData.yaoResults = newResults;
              wx.redirectTo({
                url: '/pages/loading/loading'
              });
            }, 1000);
          }
        }, 300);
      }, 1000);
    }, 100);
  }
});