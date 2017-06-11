'use strict';

// Google APIの初期化
var GoogleSpreadsheet = require('google-spreadsheet');
var credentials = require('./credentials/My_Project-29324953f4b4.json');

// AWS CLIの初期化
var awsCredential = require('./credentials/aws.json');
var AWS = require('aws-sdk');
AWS.config.update(awsCredential);
var s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'ap-northeast-1' });

var bucketName = 'dev-ninja-entry';

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
  var credentials = require('./credentials/My_Project-29324953f4b4.json');


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
        var new_row = {'氏名': 'Nodeたろう',};
        sheet.worksheets[i].addRow(new_row, function(err, row) {
          console.log(row);
        });
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
 * Master系のディレクトリ更新で発火
 * S3から次回開催用シートのIDと対象のイベントのIDを取得し、
 * 2回目以降ニンジャが申し込んでいるかを確認。
 * 申込状況を新しいシートに反映する
 */
module.exports.initSheet = (event, context, callback) => {

  var GoogleSpreadsheet = require('google-spreadsheet');
 
  var my_sheet = {};
  var sheet = {};
  var workSheet = {}; // 操作対象のワークシート
  var credentials = require('./credentials/My_Project-29324953f4b4.json');

  // S3から取ってきたデータ格納用
  var sheetData = {};
  var ninjas = {};
  var ninjaEntries = [];

  // Spread Sheetから取ってきたデータ格納用
  var sheetRows = [];

  Promise.resolve(0).then((d)=>{
    // GoogleのシートIDが記入されているJSONを受け取り
    // master/shhet.json
    return new Promise((resolve, reject)=>{
      var params = {
        Bucket: bucketName, 
        Key: 'master/sheet.json'
      };
      s3.getObject(params, function(err, data) {
        if (err){
          console.log(err, err.stack);
          reject(err);
        }
        else {
          sheetData = JSON.parse( data.Body.toString('UTF-8') );
          console.log( sheetData );
          my_sheet = new GoogleSpreadsheet( sheetData.SheetId );
          resolve(my_sheet);
        }
      });
    });
  })
  .then((d)=>{
    // 2回目以降ニンジャのリストをS3から持ってくる
    // ninja/*.json
    return new Promise((resolve, reject)=>{
      var params = {
        Bucket: bucketName, 
        Prefix: 'ninja',
        MaxKeys: 100
      };

      s3.listObjectsV2(params, function(err, data) {
        if (err){
          console.log(err, err.stack);
          reject(err);
        }
        else {
          console.log(data);
          ninjas = data;
          resolve(data);
        }
      });
    });    
  })
  .then((d)=>{
    // ニンジャの配列から個別ニンジャの状況を取得するPromiseを作成して、all実行

    var ninjaPromises = [];

    var ninjaCount = ninjas.Contents.length;

    for( var i=0; i<ninjaCount; i++ ) {

      ninjaPromises.push(new Promise((resolve, reject)=>{

          var params = {
            Bucket: bucketName, 
            Key: ninjas.Contents[i].Key,
          };

          s3.getObject(params, function(err, data){
            if (err){
              console.log(err, err.stack);
              reject(err);
            }
            else {
              // console.log(data);
              ninjaEntries.push( JSON.parse( data.Body.toString('UTF-8') ) );
              resolve(data);
            }
          })
        })
      );
    }

    return Promise.all(ninjaPromises);
  })
  .then((d)=>{

    // Google Spread Sheetの認証
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
              // シート情報データを格納
              sheet = data;
            }
            resolve(data)
          });
        }
      })
    })
  })
  .then((d)=>{

    // Google Spread Sheetのデータを取得
    return new Promise((resolve, reject)=>{

      // ワークシートの中からお目当てのシートを探す
      for(var i in sheet.worksheets) {
        if(sheet.worksheets[i].title === '最新') {
          workSheet = sheet.worksheets[i];
          sheet.worksheets[i].getRows( function( err, rows ) {
            if(err){
              reject(err);
            }
            else {
              sheetRows = rows;
              console.log('-------------sheetRows--------------');
              console.log(sheetRows);
              resolve(rows);
            }
          })
        }
      }
    })
  })
  .then((d)=>{

    // シートの行とS3のデータを突き合わせしながら、ニンジャの情報を更新するPromise配列を作り、
    // 最後にそれをAllで実行して返却

    var sheetRowsCount = sheetRows.length;
    var ninjaEntriesCount = ninjaEntries.length;

    var existRow = 0; // シート内で見つけたニンジャの行数

    var sheetUpdatePromises = []; // シートをアップデートするためのPromise配列

    for( var ne = 0; ne < ninjaEntriesCount; ne++ ) {

      for( var sr = 0; sr < sheetRowsCount; sr++ ) {
        // ニンジャの名前がすでにシートに存在していれば、フラグを立てる
        if( ninjaEntries[ne].nickname == sheetRows[sr]['氏名']) {
          existRow = sr;
          break;
        }
      }

      // 存在していれば、その行の「そのほか伝達事項など」を更新する
      if( existRow > 0 ) {
        sheetRows[sr]['そのほか伝達事項など'] =  ninjaEntries[ne].entry[sheetData.EventId];
        sheetUpdatePromises.push(
          new Promise((resolve, reject)=>{
            sheetRows[sr].save( function(err, row) {
              if(err) {
                reject( err );
              }
              else {
                resolve( row );
              }
            });
          })
        );        
      }
      // 存在していなければ新たに行を追加
      else {
        var new_row = {
          '氏名': ninjaEntries[ne].nickname,
          'そのほか伝達事項など': ninjaEntries[ne].entry[sheetData.EventId]
        };
        sheetUpdatePromises.push(
          new Promise((resolve, reject)=>{
            workSheet.addRow(new_row, function(err, row) {
              if(err) {
                reject( err );
              }
              else {
                resolve( row );
              }
            });
          })
        );
        
      }

    }

    // 全てのPromiseを実行
    return Promise.all(sheetUpdatePromises);

  })
  .then((d)=>{
    callback( null, 'finish of update')
  })
  .catch((err)=>{
    console.log(err);
  })

}
