const towxml = require('../../libs/towxml/index'); // 建议使用 towxml 库来解析 markdown
const mermaidAPI = require('../../libs/mermaid/mermaid.min.js');

Component({
  properties: {
    content: {
      type: String,
      value: '',
      observer: function(newVal) {
        if (newVal) {
          this.renderMarkdown(newVal);
        }
      }
    },
    loading: {
      type: Boolean,
      value: false
    },
    fontSize: {
      type: Number,
      value: 14
    }
  },

  data: {
    nodes: [],
    mermaidCode: '',
    mermaidSvgUrl: ''
  },

  methods: {
    renderMarkdown(content) {
      try {
        // 处理 $n 转义
        content = this.escapeDollarNumber(content);
        // 处理数学公式
        content = this.escapeBrackets(content);
        
        // 使用 towxml 转换 markdown 为 nodes
        const result = towxml(content, 'markdown', {
          events: {
            tap: (e) => {
              this.handleLinkTap(e);
            }
          }
        });

        this.setData({
          nodes: result.nodes
        });

        // 检查是否包含 mermaid 图表
        this.checkMermaidCode(content);
      } catch (error) {
        console.error('Markdown 渲染错误:', error);
      }
    },

    escapeDollarNumber(text) {
      let escapedText = '';
      for (let i = 0; i < text.length; i++) {
        let char = text[i];
        const nextChar = text[i + 1] || ' ';
        if (char === '$' && nextChar >= '0' && nextChar <= '9') {
          char = '\\$';
        }
        escapedText += char;
      }
      return escapedText;
    },

    escapeBrackets(text) {
      const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
      return text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
        if (codeBlock) return codeBlock;
        if (squareBracket) return `$$${squareBracket}$$`;
        if (roundBracket) return `$${roundBracket}$`;
        return match;
      });
    },

    checkMermaidCode(content) {
      const mermaidRegex = /```mermaid([\s\S]*?)```/;
      const match = content.match(mermaidRegex);
      
      if (match) {
        const mermaidCode = match[1].trim();
        this.renderMermaid(mermaidCode);
      }
    },

    async renderMermaid(code) {
      try {
        const svg = await mermaidAPI.render('mermaid-graph', code);
        // 注意：在实际应用中，你需要找到一种方式来存储和显示 SVG
        // 可能需要后端服务来转换 SVG 为图片URL
        this.setData({
          mermaidCode: code,
          mermaidSvgUrl: svg
        });
      } catch (error) {
        console.error('Mermaid 渲染错误:', error);
      }
    },

    handleLinkTap(e) {
      const href = e.currentTarget.dataset.href;
      if (href) {
        if (href.startsWith('/#')) {
          // 内部导航逻辑
          wx.navigateTo({
            url: href.substring(2)
          });
        } else {
          // 外部链接
          wx.setClipboardData({
            data: href,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    }
  }
}); 