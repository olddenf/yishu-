const app = getApp();

Page({
  data: {
    yaoResults: [],
    numberStream: [],
    yiJingWords: [],
    floatingDots: [],
    loadingText: 'AI 正在感应天机...',
    textIndex: 0,
    textInterval: null
  },

  loadingTexts: [
    'AI 正在感应天机...',
    '解析卦象能量...',
    '根据杀号规则排除极端组合...',
    '数字命理推演中...',
    '天机感应中...'
  ],

  onLoad() {
    this.setData({
      yaoResults: app.globalData.yaoResults || []
    });

    this.prepareCollapse();
    this.generateNumberStream();
    this.generateYiJingWords();
    this.createFloatingDots();
    this.startLoadingText();

    setTimeout(() => {
      this.triggerCollapse();
    }, 1500);

    setTimeout(() => {
      this.callAI();
    }, 1000);
  },

  onUnload() {
    if (this.data.textInterval) {
      clearInterval(this.data.textInterval);
    }
  },

  prepareCollapse() {
    this.setData({
      yaoResults: app.globalData.yaoResults || []
    });
  },

  triggerCollapse() {
    const yaoContainer = wx.createSelectorQuery().select('#collapsingYao');
    yaoContainer.addClass('yao-collapse');
  },

  generateNumberStream() {
    const maxNum = app.globalData.lotteryType === 'ssq' ? 33 : 35;
    const numbers = [];
    
    for (let i = 0; i < 30; i++) {
      numbers.push({
        num: String(Math.floor(Math.random() * maxNum) + 1).padStart(2, '0'),
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3
      });
    }
    
    this.setData({ numberStream: numbers });
  },

  generateYiJingWords() {
    const words = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑', '天', '地', '雷', '风', '水', '火', '山', '泽', '元', '亨', '利', '贞'];
    const yiWords = [];
    
    for (let i = 0; i < 15; i++) {
      yiWords.push({
        word: words[Math.floor(Math.random() * words.length)],
        left: Math.random() * 100,
        delay: Math.random() * 2
      });
    }
    
    this.setData({ yiJingWords: yiWords });
  },

  createFloatingDots() {
    const dots = [];
    
    for (let i = 0; i < 10; i++) {
      dots.push({
        size: 8 + Math.random() * 12,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2
      });
    }
    
    this.setData({ floatingDots: dots });
  },

  startLoadingText() {
    let index = 0;
    this.data.textInterval = setInterval(() => {
      index = (index + 1) % this.loadingTexts.length;
      this.setData({
        loadingText: this.loadingTexts[index]
      });
    }, 800);
  },

  callAI() {
    const yaoData = app.globalData.yaoResults.map(r => r.type);
    const lotteryType = app.globalData.lotteryType;
    
    const prompt = this.buildPrompt(yaoData, lotteryType);
    
    wx.request({
      url: 'https://api.siliconflow.cn/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-mwnoxgwjatmhsfavzmkeljbhnxmvmeealqadflhfkspqygwa'
      },
      data: {
        model: 'deepseek-ai/DeepSeek-V4-Flash',
        messages: [
          { role: 'system', content: '你是一位精通易经和数字命理的大师，擅长根据卦象推演彩票号码。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      success: (res) => {
        this.handleAIResponse(res.data);
      },
      fail: (err) => {
        console.error('AI调用失败:', err);
        this.useFallback();
      }
    });
  },

  buildPrompt(yaoData, lotteryType) {
    const typeName = lotteryType === 'ssq' ? '双色球' : '大乐透';
    const redCount = lotteryType === 'ssq' ? 6 : 5;
    const blueCount = lotteryType === 'ssq' ? 1 : 2;
    const redMax = lotteryType === 'ssq' ? 33 : 35;
    const blueMax = lotteryType === 'ssq' ? 16 : 12;
    
    return `根据以下信息进行易经卦象推演：
    
卦象数据：${yaoData.join(', ')}
彩票类型：${typeName}
规则要求：红球${redCount}个(1-${redMax}), 蓝球${blueCount}个(1-${blueMax})

请以JSON格式输出：
{
  "fortune_comment": "12字以内的运势评语",
  "fortune_explanation": "对运势评语的解释",
  "raw_numbers": {
    "red": [红球号码数组],
    "blue": [蓝球号码数组]
  }
}

注意：
1. 红球号码需从小到大排序
2. 号码不能重复
3. 运势评语要符合易经卦象含义`;
  },

  handleAIResponse(data) {
    try {
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI返回内容为空');
      }
      
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonStr = content.substring(jsonStart, jsonEnd);
      const result = JSON.parse(jsonStr);
      
      this.processResult(result);
    } catch (e) {
      console.error('解析AI响应失败:', e);
      this.useFallback();
    }
  },

  processResult(result) {
    const validatedResult = this.validateNumbers(result);
    app.globalData.resultData = validatedResult;
    
    if (this.data.textInterval) {
      clearInterval(this.data.textInterval);
    }
    
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/result/result'
      });
    }, 500);
  },

  validateNumbers(result) {
    let redNumbers = result.raw_numbers.red;
    let blueNumbers = result.raw_numbers.blue;
    
    const lotteryType = app.globalData.lotteryType;
    const redCount = lotteryType === 'ssq' ? 6 : 5;
    const blueCount = lotteryType === 'ssq' ? 1 : 2;
    const redMax = lotteryType === 'ssq' ? 33 : 35;
    const blueMax = lotteryType === 'ssq' ? 16 : 12;
    
    redNumbers = [...new Set(redNumbers)]
      .filter(n => n >= 1 && n <= redMax)
      .sort((a, b) => a - b);
    
    blueNumbers = [...new Set(blueNumbers)]
      .filter(n => n >= 1 && n <= blueMax)
      .sort((a, b) => a - b);
    
    while (redNumbers.length < redCount) {
      const num = Math.floor(Math.random() * redMax) + 1;
      if (!redNumbers.includes(num)) {
        redNumbers.push(num);
      }
      redNumbers.sort((a, b) => a - b);
    }
    
    while (blueNumbers.length < blueCount) {
      const num = Math.floor(Math.random() * blueMax) + 1;
      if (!blueNumbers.includes(num)) {
        blueNumbers.push(num);
      }
      blueNumbers.sort((a, b) => a - b);
    }
    
    return {
      fortune_comment: result.fortune_comment || '天机不可泄露',
      fortune_explanation: result.fortune_explanation || '',
      raw_numbers: {
        red: redNumbers.slice(0, redCount),
        blue: blueNumbers.slice(0, blueCount)
      }
    };
  },

  useFallback() {
    console.log('使用降级方案生成号码');
    
    const lotteryType = app.globalData.lotteryType;
    const redCount = lotteryType === 'ssq' ? 6 : 5;
    const blueCount = lotteryType === 'ssq' ? 1 : 2;
    const redMax = lotteryType === 'ssq' ? 33 : 35;
    const blueMax = lotteryType === 'ssq' ? 16 : 12;
    
    const redNumbers = [];
    while (redNumbers.length < redCount) {
      const num = Math.floor(Math.random() * redMax) + 1;
      if (!redNumbers.includes(num)) {
        redNumbers.push(num);
      }
    }
    
    const blueNumbers = [];
    while (blueNumbers.length < blueCount) {
      const num = Math.floor(Math.random() * blueMax) + 1;
      if (!blueNumbers.includes(num)) {
        blueNumbers.push(num);
      }
    }
    
    const fallbackResult = {
      fortune_comment: '天机感应中...',
      fortune_explanation: 'AI接口暂不可用，已使用本地算法生成',
      raw_numbers: {
        red: redNumbers.sort((a, b) => a - b),
        blue: blueNumbers.sort((a, b) => a - b)
      }
    };
    
    app.globalData.resultData = fallbackResult;
    
    if (this.data.textInterval) {
      clearInterval(this.data.textInterval);
    }
    
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/result/result'
      });
    }, 500);
  }
});
