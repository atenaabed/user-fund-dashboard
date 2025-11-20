const express = require('express');
const axios = require('axios');
const { format } = require('date-fns');
const ExcelJS = require('exceljs');

const app = express();
const port = 3004;

app.get('/fetchData', async (req, res) => {
  try {
    const apiUrl = 'https://pro-openapi.debank.com/v1/user/history_list';
    const userId = '0x1cc6f034c48817d2ec8c1bc59fe2b91823554047';
    const chainId = 'eth';
    const headers = {
      'accept': 'application/json',
      'AccessKey': '11637308d42222f1c8bc1cd76c1f9f9208913115',
    };

    const response = await axios.get(apiUrl, {
      params: {
        id: userId,
        chain_id: chainId,
      },
      headers: headers,
    });

    const historyList = response.data.history_list;
    const tokenDict = response.data.token_dict;

    const responseData = {};

    historyList.forEach(transaction => {
      const receives = transaction.receives || [];
      const sends = transaction.sends || [];
      const txInfo = transaction.tx || {};

      let transactionName = '';

      if (receives.length === 0 && sends.length === 0) {
        transactionName = transaction.cate_id;
      } else if (receives.length > 0 && sends.length === 0) {
        transactionName = 'receive transaction';
      } else if (sends.length > 0 && receives.length === 0) {
        transactionName = 'send transaction';
      } else {
        transactionName = 'swap transaction';
      }

      const getSendsData = sends.map(send => {
        const tokenInfo = tokenDict[send.token_id] || {};
        const sendAmountUSD = send.amount * (tokenInfo.price || 0);
        return `${send.amount} ${tokenInfo.symbol || ''} (Price: ${tokenInfo.price || ''}, USD: ${sendAmountUSD.toFixed(2)})`;
      });

      const getReceivesData = receives.map(receive => {
        const tokenInfo = tokenDict[receive.token_id] || {};
        const receiveAmountUSD = receive.amount * (tokenInfo.price || 0);
        return `${receive.amount} ${tokenInfo.symbol || ''} (Price: ${tokenInfo.price || ''}, USD: ${receiveAmountUSD.toFixed(2)})`;
      });

      const txName = txInfo.name ? `(${txInfo.name})` : '';

      const row = {
        sends: getSendsData.join(', '),
        receives: getReceivesData.join(', '),
        usd_gas_fee: txInfo.usd_gas_fee || '',
        eth_gas_fee: txInfo.eth_gas_fee || '',
        is_scam: transaction.is_scam.toString(),
        project_id: transaction.project_id || '',
        time_at: transaction.time_at || '',
        formatted_time: new Date(transaction.time_at * 1000).toLocaleString(),
      };

      // Calculate total amount sent and received in USD
      const totalSentUSD = sends.reduce((total, send) => {
        const tokenInfo = tokenDict[send.token_id] || {};
        return total + send.amount * (tokenInfo.price || 0);
      }, 0);

      const totalReceivedUSD = receives.reduce((total, receive) => {
        const tokenInfo = tokenDict[receive.token_id] || {};
        return total + receive.amount * (tokenInfo.price || 0);
      }, 0);

      // Analyze transactions
      if (!responseData[`${transactionName}(${txName})`]) {
        responseData[`${transactionName}(${txName})`] = {
          transactions: [],
          analysis: {
            total: 0,
            totalReceived: 0,
            totalSent: 0,
            totalReceivedUSD: 0,
            totalSentUSD: 0,
            monthly: {},
            weekly: {},
            yearly: {},
          },
        };
      }

      // Update analysis
      const analysis = responseData[`${transactionName}(${txName})`].analysis;
      analysis.total += 1;
      analysis.totalReceived += receives.length;
      analysis.totalSent += sends.length;
      analysis.totalReceivedUSD += totalReceivedUSD;
      analysis.totalSentUSD += totalSentUSD;

      const transactionDate = new Date(transaction.time_at * 1000);
      const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth() + 1}`;
      const weekKey = `Week ${getWeekOfMonth(transactionDate)} of ${format(transactionDate, 'MMMM')} ${transactionDate.getFullYear()}`;
      const yearKey = `${transactionDate.getFullYear()}`;

      analysis.monthly[monthKey] = (analysis.monthly[monthKey] || 0) + 1;
      analysis.weekly[weekKey] = (analysis.weekly[weekKey] || 0) + 1;
      analysis.yearly[yearKey] = (analysis.yearly[yearKey] || 0) + 1;

      // Add row to transactions array
      responseData[`${transactionName}(${txName})`].transactions.push(row);
    });

    res.json(responseData);
    
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to get the week number of the month
function getWeekOfMonth(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const diff = date.getDate() + firstDay.getDay() - 1;
  return Math.ceil(diff / 7);
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
