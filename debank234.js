const axios = require('axios');
const ExcelJS = require('exceljs');

const apiUrl = 'https://pro-openapi.debank.com/v1/user/total_balance';
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
    const chainList = response.data.chain_list;
    const totalUsdValue = response.data.total_usd_value
    //console.log(totalUsdValue)
    //console.log(chainList)

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TotalPortfolio')


    //Add headers to the worksheet
    worksheet.columns =[
        { header: 'Chain_id', key: 'id', width: 20 },
        { header: 'Chain_id', key: 'community_id', width: 20 },
        { header: 'Chain_Name', key: 'name', width: 20 },
        { header: 'Token_Currency', key: 'wrapped_token_id', width: 20 },
        { header: 'USD Value', key: 'usd_value', width: 20 },
    ]
    //Get data and add to row
    chainList.forEach(transaction =>{
        const row = {
            id: transaction.id,
            community_id: transaction.community_id,
            name: transaction.name,
            wrapped_token_id: transaction.wrapped_token_id,
            usd_value: transaction.usd_value
        };
        //add worksheet
        worksheet.addRow(row);
    });

    //make file
    const excelFileName = 'TotalPortfolio.xlsx';
    workbook.xlsx.writeFile(excelFileName)
    .then(() =>{
        console.log(`ExcelFileName "${excelFileName}" has been created successfuly.`)
    })

    .catch(error =>{
        console.error('Error writing excel file:' , error)
    });

})
.catch(error =>{
    console.error('Error fetching data:' , error);
  });


