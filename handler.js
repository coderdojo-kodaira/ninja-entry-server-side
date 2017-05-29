'use strict';

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};


/**
 * シートからデータを読んでくる
 */
module.exports.readSheet = (event, context, callback) => {
  var GoogleSpreadsheet = require('google-spreadsheet');
 
  var my_sheet = new GoogleSpreadsheet('107X7lFClUeHGija6Wl_rKRMUvbXGgvozQ1a2Na-RttA');
  var credentials = require('./My_Project-29324953f4b4.json');


  var sheet;
  Promise.resolve(0).then((d)=>{

    return new Promise((resolve, reject)=> {
      my_sheet.useServiceAccountAuth(credentials, function(err){
        if(err) {
          reject(err)
        }
        else {
          my_sheet.getInfo(function(err, data){
            if(err) {
              reject(err)
            }
            else {

            }
            resolve(data)
          });
        }
      })
    })
  })
  .then((data)=>{
    sheet = data

    for(var i in sheet.worksheets) {
      if(sheet.worksheets[i].title === 'mysheet1') {
        sheet.worksheets[i].getRows( function( err, rows ) {
          for(var i in rows) {
            console.log(rows[i]);
          }
        });
      }
    }  
  })

  callback(null, 'hello world');
}