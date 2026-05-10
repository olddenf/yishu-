const app = getApp();

Page({
  data: {
    resultData: {},
    yaoSymbols: [],
    fortuneExplanation: ''
  },

  guaNames: [
    { name: '大有', full: '火天大有' },
    { name: '晋', full: '火地晋' },
    { name: '乾', full: '乾为天' },
    { name: '坤', full: '坤为地' },
    { name: '屯', full: '水雷屯' },
    { name: '蒙', full: '山水蒙' },
    { name: '需', full: '水天需' },
    { name: '讼', full: '天水讼' }
  ],

  onLoad() {
    this.loadResult();
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
  },

  loadResult() {
    const aiResult = app.globalData.resultData;
    const yaoResults = app.globalData.yaoResults || [];

    const yaoSymbols = yaoResults.map(r => {
      if (r.type === 'old_yang') return '—○';
      if (r.type === 'old_yin') return '--×';
      if (r.type === 'yang') return '—';
      return '--';
    });

    if (aiResult && aiResult.raw_numbers) {
      const gua = this.guaNames[Math.floor(Math.random() * this.guaNames.length)];
      
      this.setData({
        yaoSymbols,
        fortuneExplanation: aiResult.fortune_explanation || '',
        resultData: {
          guaName: gua.name,
          guaFullName: gua.full,
          fortune: aiResult.fortune_comment || '天机不可泄露',
          redNumbers: aiResult.raw_numbers.red,
          blueNumbers: aiResult.raw_numbers.blue
        }
      });
    } else {
      this.generateFallbackResult(yaoSymbols);
    }
  },

  generateFallbackResult(yaoSymbols) {
    const gua = this.guaNames[Math.floor(Math.random() * this.guaNames.length)];
    const fortunes = [
      '离火照耀，守中获利',
      '坤舆载物，厚德载福',
      '乾元用九，潜龙勿用',
      '震雷动万物，春风吹又生',
      '风生水起，财运亨通'
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    const redNumbers = this.generateRedNumbers();
    const blueNumbers = this.generateBlueNumbers();

    this.setData({
      yaoSymbols,
      fortuneExplanation: '',
      resultData: {
        guaName: gua.name,
        guaFullName: gua.full,
        fortune,
        redNumbers,
        blueNumbers
      }
    });
  },

  generateRedNumbers() {
    const lotteryType = app.globalData.lotteryType;
    const redCount = lotteryType === 'ssq' ? 6 : 5;
    const redMax = lotteryType === 'ssq' ? 33 : 35;
    const maxAttempts = 100;
    let attempt = 0;

    while (attempt < maxAttempts) {
      const numbers = [];
      while (numbers.length < redCount) {
        const num = Math.floor(Math.random() * redMax) + 1;
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }
      numbers.sort((a, b) => a - b);

      if (this.validateNumbers(numbers)) {
        return numbers;
      }
      attempt++;
    }

    const fallback = lotteryType === 'ssq' ? [5, 12, 18, 22, 27, 31] : [5, 12, 18, 22, 27];
    return fallback;
  },

  validateNumbers(numbers) {
    const smallCount = numbers.filter(n => n <= 6).length;
    if (smallCount >= 4) return false;

    const oddCount = numbers.filter(n => n % 2 === 1).length;
    if (oddCount === 0 || oddCount === numbers.length) return false;

    const span = numbers[numbers.length - 1] - numbers[0];
    if (span < 20 || span > 32) return false;

    const sum = numbers.reduce((a, b) => a + b, 0);
    if (sum < 60 || sum > 150) return false;

    let consecutiveCount = 1;
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === numbers[i - 1] + 1) {
        consecutiveCount++;
        if (consecutiveCount >= 4) return false;
      } else {
        consecutiveCount = 1;
      }
    }

    return true;
  },

  generateBlueNumbers() {
    const lotteryType = app.globalData.lotteryType;
    const maxBlue = lotteryType === 'ssq' ? 16 : 12;
    const count = lotteryType === 'ssq' ? 1 : 2;

    const numbers = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * maxBlue) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  },

  restart() {
    app.globalData.riskAccepted = false;
    app.globalData.yaoResults = [];
    app.globalData.resultData = null;
    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  shareResult() {
    const { resultData } = this.data;
    const shareTitle = `【${resultData.guaFullName}】${resultData.fortune}`;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onShareAppMessage() {
    const { resultData } = this.data;
    return {
      title: `【${resultData.guaFullName}】${resultData.fortune}`,
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    const { resultData } = this.data;
    return {
      title: `【${resultData.guaFullName}】${resultData.fortune}`,
      query: ''
    };
  }
});
