'use strict';

var GoogleSpreadsheet = require('google-spreadsheet');
var credentials = require('./My_Project-29324953f4b4.json');


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
 * シートからデータを読んでくるテストプログラム
 */
module.exports.readSheet = (event, context, callback) => {
  var GoogleSpreadsheet = require('google-spreadsheet');
 
  var my_sheet = new GoogleSpreadsheet('1l9t5T_LmikpGAqCd9VlvD0KmW9OxcQ19R112wKpUnuk');
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
      if(sheet.worksheets[i].title === '最新') {
        sheet.worksheets[i].getRows( function( err, rows ) {
          for(var i in rows) {
            console.log(rows[i]);
          }
        });
        callback(null, 'hello world');
      }
    }  
  })

}

/**
 * S3から次回開催用シートのIDと対象のイベントのIDを受け取り、
 * 2回目以降ニンジャが申し込んでいるかを確認。
 * 申込状況を新しいシートに反映する
 */
module.exports.initSheet = (event, context, callback) => {

  // eventに次回開催シートのIDが入ってくる

  // 2回目以降ニンジャの参加状況をS3から持ってくる

  // SpreadSheetに接続して最終記入列を取得

  // ニンジャごとに最終列以降に追加

}

/**
 * ニンジャの参加可否S3の更新を受け取り、
 * 対象ニンジャの情報をシートから探して更新する。
 */
module.exports.updateNinjaEntry = (event, context, callback) => {

  // eventにニンジャのファイル名が入ってくる

  // ニンジャの参加状況を取得

  // SpreadSheet名を取得

  // SpreadSheetに接続して、対象ニンジャの行を取得する

  // 対象ニンジャの出席状況を更新する

}