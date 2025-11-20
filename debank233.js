const axios = require('axios');
const ExcelJS = require('exceljs');

const apiUrl = 'https://pro-openapi.debank.com/v1/user/token_list';
const userId = '0x90caa215693b2E5C83bf16898384270fDBB8eD9E';
const chainId = 'eth';


const headers = {
  'accept': 'application/json',
  'AccessKey': '11637308d42222f1c8bc1cd76c1f9f9208913115',
};

axios.get(apiUrl, {
  params: {
    id: userId,
    chain_id: chainId,
  },
  headers: headers,
})
  .then(response => {
    const result = response.data;
    //console.log(result)

     // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Portfolio');

    // Add headers to the worksheet
    worksheet.columns = [
        { header: 'Token_Name', key: 'name', width: 20 },
        { header: 'Token_Currency', key: 'id', width: 20 },
        { header: 'Symbol', key: 'symbol', width: 20 },
        { header: 'Price', key: 'price', width: 20 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'USD amount', key: 'usd_amount', width: 20 },
        { header: 'Project ID', key: 'project_id', width: 15 },
        { header: 'Time At', key: 'time_at', width: 20 },
        { header: 'Formatted Time', key: 'formatted_time', width: 20 },
      ];

     //Get result information and add them to row
      result.forEach(transaction =>{
        const calUsdAmount = transaction.price * transaction.amount;
        const row = {
          name: transaction.name,
          id: transaction.id ,
          symbol: transaction.symbol,
          price: transaction.price,
          amount: transaction.amount,
          usd_amount: calUsdAmount,
          project_id: transaction.project_id || '',
          time_at: transaction.time_at || '',
          formatted_time: new Date(transaction.time_at * 1000).toLocaleString(),
        };


        //add worksheet
        worksheet.addRow(row);
      })
      const excelFileName = 'debankPortfolio.xlsx';
      workbook.xlsx.writeFile(excelFileName)

      .then(() =>{
        console.log(`ExcelFileName "${excelFileName}" has been created successfuly. `)
      })

      .catch(error =>{
        console.error('Error writing excel file:' , error);
      });
  })
  .catch(error =>{
    console.error('Error fetching data:' , error);
  });
