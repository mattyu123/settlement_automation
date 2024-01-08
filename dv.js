function clearDVinputValues() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DV");
  const range = sheet.getRange("A3:K1000")

  range.clearContent()
}

function clearDVsettlementValues() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DV - Settlement Values");
  const range = sheet.getRange("E2:I1000")

  range.clearContent()
}

//----------------------------------------------------------------------------------------------------------------// 

//Assign variables to each column range and values 
const sheetName = "DV"
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

//Day 1 of DV data
const day1Range = sheet.getRange("D3:E100")
const day1Values = day1Range.getValues()

//Day 2 of DV data
const day2Range = sheet.getRange("G3:H100")
const day2Values = day2Range.getValues()

//Day 3 of DV data
const day3Range = sheet.getRange("J3:K100")
const day3Values = day3Range.getValues()

//Day 4 of DV data
const day4Range = sheet.getRange("M3:N100")
const day4Values = day4Range.getValues()

//Function takes the pasted in data and creates an object with the key being the token, and the value as the total value 
function formatDVtradeReport(dayArrayValues) {
  let cleanData = [] //function will hold the cleaned out array values
  const obj = {}

  //iterate through the pasted values in the sheet and cleans out the arrays that are empty 
  for (const item of dayArrayValues) {
    if(item[0].length !== 0) {
      cleanData.push(item)
    }
  }

  //Take the clean data and assign it as key value pairs to the object
  for (const item of cleanData) {
    obj[item[0]] = item[1]
  }
  
  return obj
}

//Assign objects to each day's formatted trade report
const day1Obj = formatDVtradeReport(day1Values)
const day2Obj = formatDVtradeReport(day2Values)
const day3Obj = formatDVtradeReport(day3Values)
const day4Obj = formatDVtradeReport(day4Values)

//function takes object of trade report values and aggregates them into one final report 
function aggregatedTradeReports(day1, day2, day3, day4) {
  let final = {}

  //Add logic to go through day1 object and add it's values to the final object 
  for (const token in day1) {
    if (token in final) {
      final[token] += day1[token]
    } else {
      final[token] = day1[token]
    }
  }

  //Go through day2 object and add it's values to the final object 
  for (const token in day2) {
    if (token in final) {
      final[token] += day2[token]
    } else {
      final[token] = day2[token]
    }
  }

  //Go through day3 object and add it's values to the final object 
  for (const token in day3) {
    if (token in final) {
      final[token] += day3[token]
    } else {
      final[token] = day3[token]
    }
  }

  //Go through day4 object and add it's values to the final object 
  for (const token in day4) {
    if (token in final) {
      final[token] += day4[token]
    } else {
      final[token] = day4[token]
    }
  }
  
  return final
}

//Save the final object as a global variable
const consolidatedReport = aggregatedTradeReports(day1Obj, day2Obj, day3Obj, day4Obj)


// ---------------------------------------------- Separate out the final consolidated report value 

//Function takes the final clean object and produces an object of settlements to send to DV
function sendToDV(consolidatedReport) {
  const movements = {}
  
  for (const coin in consolidatedReport) {
    if (consolidatedReport[coin] < 0) {
      movements[coin] = consolidatedReport[coin]
    }
  }
  return movements;
}

//Function takes the final clean object and produces an object of settlements that DV needs to send to us
function receiveFromDV(consolidatedReport) {
  const movements = {}
  
  for (const coin in consolidatedReport) {
    if (consolidatedReport[coin] > 0) {
      movements[coin] = consolidatedReport[coin]
    }
  }
  return movements;
};

//Store the DV send and receive consolidatedReport
const dvSend = sendToDV(consolidatedReport)
const dvReceive = receiveFromDV(consolidatedReport)

//---------------------------------------Display the net settlement values to the sheet -------------------------------------// 

//Takes the amount and displays it 
function displayDVTradeReports() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DV - Settlement Values");
  
  //----------------- Display the values of the settlements that need to be sent to DV -----------------//
  const sendKeys = Object.keys(dvSend)
  const sendValues = Object.values(dvSend)
  const sendCell = sheet.getRange("E3")
  const sendHeader1 = sheet.getRange("E2")
  const sendHeader2 = sheet.getRange("F2")

  //Add headers to the amounts to send 
  sendHeader1.setValue("Coin").setFontWeight("bold")
  sendHeader2.setValue("QTY to Send to DV").setFontWeight("bold")

  sendCell.setValue(consolidatedReport)

  // Set the keys in the left column
  const keysRange = sendCell.offset(0, 0, sendKeys.length, 1);
  keysRange.setValues(sendKeys.map(key => [key]));

  // Set the values in the right column
  const valuesRange = sendCell.offset(0, 1, sendValues.length, 1);
  valuesRange.setValues(sendValues.map(value => [value]));

  //----------------- Display the values of the settlements that DV will send back to us -----------------//
  const receiveKeys = Object.keys(dvReceive)
  const receiveValues = Object.values(dvReceive)
  const receiveCell = sheet.getRange("H3")
  const receiveHeader1 = sheet.getRange("H2")
  const receiveHeader2 = sheet.getRange("I2")

  receiveHeader1.setValue("Coin").setFontWeight("bold")
  receiveHeader2.setValue("QTY to Receive from DV").setFontWeight("bold")

  receiveCell.setValue(consolidatedReport)

  // Set the keys in the left column
  const keysRange2 = receiveCell.offset(0, 0, receiveKeys.length, 1);
  keysRange2.setValues(receiveKeys.map(key => [key]));

  // Set the values in the right column
  const valuesRange2 = receiveCell.offset(0, 1, receiveValues.length, 1);
  valuesRange2.setValues(receiveValues.map(value => [value]));
}