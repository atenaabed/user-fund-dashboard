const axios = require('axios');
const ExcelJS = require('exceljs');

const apiUrl = 'https://pro-openapi.debank.com/v1/user/all_history_list';
const userId = '0x90caa215693b2E5C83bf16898384270fDBB8eD9E';


const headers = {
  'accept': 'application/json',
  'AccessKey': '11637308d42222f1c8bc1cd76c1f9f9208913115',
};

axios.get(apiUrl, {
  params: {
    id: userId,
  },
  headers: headers,
})
  .then(response => {
    const historyList = response.data.history_list;
    const tokenDict = response.data.token_dict;

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Add headers to the worksheet
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header:'Chain', key:'chain', width:20},
      { header: 'Sends', key: 'sends', width: 60 },
      { header: 'Price sends$', key: 'priceS$', width: 60 },
      { header: 'Receives', key: 'receives', width: 60 },
      { header: 'Price receives$', key: 'priceR$', width: 60 },
      { header: 'Tx Name', key: 'tx_name', width: 20 },
      { header: 'USD Gas Fee', key: 'usd_gas_fee', width: 15 },
      { header: 'ETH Gas Fee', key: 'eth_gas_fee', width: 15 },
      { header: 'Is Scam', key: 'is_scam', width: 10 },
      { header: 'Project ID', key: 'project_id', width: 15 },
      { header: 'Time At', key: 'time_at', width: 20 },
      { header: 'Formatted Time', key: 'formatted_time', width: 20 },
    ];

    // Process the history_list to derive information and add rows to the worksheet
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
        return `${send.amount} ${tokenInfo.symbol || ''} (Price: ${tokenInfo.price || ''})`;
      });

      const getPriceS = sends.map(send => {
        const tokenInfo = tokenDict[send.token_id] || {};
        return `${send.amount}` * `${tokenInfo.price}`
      });

      const getReceivesData = receives.map(receive => {
        const tokenInfo = tokenDict[receive.token_id] || {};
        return `${receive.amount} ${tokenInfo.symbol || ''} (Price: ${tokenInfo.price || ''})`;
      });


      const getPriceR = receives.map(receive => {
        const tokenInfo = tokenDict[receive.token_id] || {};
        return `${receive.amount}` * `${tokenInfo.price}`
      });





      const row = {
        name: transactionName,
        chain: transaction.chain,
        sends: getSendsData.join(', '),
        priceS$: getPriceS,
        receives: getReceivesData.join(', '),
        priceR$: getPriceR,
        tx_name: txInfo.name || '',
        usd_gas_fee: txInfo.usd_gas_fee || '',
        eth_gas_fee: txInfo.eth_gas_fee || '',
        is_scam: transaction.is_scam.toString(), // Convert to string
        project_id: transaction.project_id || '',
        time_at: transaction.time_at || '',
        formatted_time: new Date(transaction.time_at * 1000).toLocaleString(),
      };

      worksheet.addRow(row);
    });

    // Save the workbook to a file
    const excelFileName = 'debankupdate.xlsx';
    workbook.xlsx.writeFile(excelFileName)
      .then(() => {
        console.log(`Excel file "${excelFileName}" has been created successfully.`);
      })
      .catch(error => {
        console.error('Error writing Excel file:', error);
      });
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
