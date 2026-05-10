const app = getApp();

Page({
  data: {
    lotteryType: 'ssq',
    showRiskModal: false,
    riskChecked: false,
    inkAnimating: false
  },

  onLoad() {
    this.setData({
      lotteryType: app.globalData.lotteryType
    });
  },

  switchLottery(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      lotteryType: type
    });
    app.globalData.lotteryType = type;
  },

  startDivination() {
    if (!app.globalData.riskAccepted) {
      this.setData({
        showRiskModal: true
      });
      return;
    }
    this.goToDivination();
  },

  goToDivination() {
    this.triggerInkEffect();
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/divination/divination'
      });
    }, 600);
  },

  triggerInkEffect() {
    this.setData({
      inkAnimating: true
    });
    setTimeout(() => {
      this.setData({
        inkAnimating: false
      });
    }, 1500);
  },

  onRiskConfirm(e) {
    const checked = e.detail.value.length > 0;
    this.setData({
      riskChecked: checked
    });
  },

  confirmRisk() {
    if (this.data.riskChecked) {
      app.globalData.riskAccepted = true;
      // 立即跳转，不等待任何操作
      wx.redirectTo({
        url: '/pages/divination/divination'
      });
    }
  },

  preventTouchMove() {
    return false;
  }
});