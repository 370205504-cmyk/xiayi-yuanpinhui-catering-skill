/**
 * 文字请求处理器
 * 功能：接收HTTP文字请求，复用原项目所有意图处理逻辑
 * 开发者：石中伟
 */

const Alexa = require('ask-sdk-core');
const skill = require('./index');

/**
 * 将文字请求转换为Alexa请求格式
 * @param {string} text - 用户输入的文字
 * @param {string} userId - 用户ID
 * @returns {Object} Alexa请求格式
 */
function textToAlexaRequest(text, userId = 'anonymous') {
  return {
    version: '1.0',
    session: {
      sessionId: `text-session-${Date.now()}`,
      application: { 
        applicationId: process.env.SKILL_ID || 'xiayi-foodie-chef-skill' 
      },
      user: { userId },
      new: true,
      attributes: {}
    },
    context: {
      System: {
        application: {
          applicationId: process.env.SKILL_ID || 'xiayi-foodie-chef-skill'
        },
        user: {
          userId: userId
        },
        device: {
          deviceId: 'text-device',
          supportedInterfaces: {}
        },
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: process.env.ALEXA_TOKEN || 'text-mode-token'
      }
    },
    request: {
      type: 'IntentRequest',
      requestId: `text-req-${Date.now()}`,
      timestamp: new Date().toISOString(),
      locale: 'zh-CN',
      intent: {
        name: 'TextInputIntent',
        confirmationStatus: 'NONE',
        slots: {
          TextInput: {
            name: 'TextInput',
            value: text,
            confirmationStatus: 'NONE'
          }
        }
      }
    }
  };
}

/**
 * 处理文字请求
 * @param {string} text - 用户输入的文字
 * @param {string} userId - 用户ID
 * @returns {Object} 响应对象
 */
exports.handleText = async (text, userId) => {
  try {
    const request = textToAlexaRequest(text, userId);
    
    const response = await skill.handler(request, {
      context: { 
        apiEndpoint: 'https://api.amazonalexa.com',
        apiAccessToken: process.env.ALEXA_TOKEN || 'text-mode-token'
      }
    });
    
    let outputText = '';
    
    if (response && response.response) {
      if (response.response.outputSpeech) {
        outputText = response.response.outputSpeech.ssml || 
                    response.response.outputSpeech.text || '';
      }
      
      outputText = outputText
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (response.response.reprompt && response.response.reprompt.outputSpeech) {
        outputText += '\n\n提示：' + 
          response.response.reprompt.outputSpeech.ssml
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
      }
    }
    
    return {
      success: true,
      response: outputText || '抱歉，我没有理解您的意思，请重新输入。',
      sessionAttributes: response?.sessionAttributes || {}
    };
  } catch (error) {
    console.error('文字请求处理错误:', error);
    return {
      success: false,
      response: '抱歉，服务出现了一些问题，请稍后再试。',
      error: error.message
    };
  }
};

/**
 * Lambda事件处理器
 * @param {Object} event - Lambda事件对象
 * @returns {Object} Lambda响应
 */
exports.lambdaHandler = async (event) => {
  try {
    const { text, userId = 'anonymous' } = event;
    
    if (!text) {
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: false, 
          response: '请提供text参数' 
        })
      };
    }
    
    const result = await exports.handleText(text, userId);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Lambda处理器错误:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: false, 
        response: '服务器错误，请稍后再试。'
      })
    };
  }
};

/**
 * HTTP GET处理器 - 返回Web界面
 */
exports.getWebInterface = async () => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const webPath = path.join(__dirname, 'web', 'index.html');
    const htmlContent = fs.readFileSync(webPath, 'utf8');
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
      },
      body: htmlContent
    };
  } catch (error) {
    console.error('读取Web界面错误:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: '<html><body><h1>Error loading web interface</h1></body></html>'
    };
  }
};
