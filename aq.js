//Function to clear the AQ input values 
function clearAQinputValues() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AQ");
  const range = sheet.getRange("D3:AH500")

  range.clearContent()
};

//Function to clear the settlement result values
function clearAQsettlementValues() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AQ - Settlement Values");
  const range = sheet.getRange("E2:I1000")

  range.clearContent()
};

///-------------------------------------------Logic to clean the report data and return an object with the net settlement amounts for each coin---------------------------------------------------///
//Define the variables for each AQ settlement day data
const aqSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AQ");

const day1DataRange = aqSheet.getRange("D3:J100")
const day1DataValues = day1DataRange.getValues()

const day2DataRange = aqSheet.getRange("L3:R100")
const day2DataValues = day2DataRange.getValues()

const day3DataRange = aqSheet.getRange("T3:Z100")
const day3DataValues = day3DataRange.getValues()

const day4DataRange = aqSheet.getRange("AB3:AH100")
const day4DataValues = day4DataRange.getValues()

//Build function that takes in the AQ data, and 
function getNetWSsettlement(valueRange) {
  let cleanSettlementReport = []
  let tradeValuesObj = {}
  
  //This loop goes through the trade report, checks to ensure that we're only looking at arrays that have a coin value, then returns a clean array with the net amount to send
  for (let i = 1; i < valueRange.length; i++) {
    if (valueRange[i][1].length !== 0) {
      valueRange[i].push(valueRange[i][6] - valueRange[i][5])
      cleanSettlementReport.push(valueRange[i])
    }
  }
  
  //This takes the clean array data and creates an object with the token name as the key and the net settlement amount as the value
  for (const item of cleanSettlementReport) {
    tradeValuesObj[item[1]] = item[7]
  }
  return tradeValuesObj
}

//Run the above function on each day's trade report and save it as a variable 
const AQday1 = getNetWSsettlement(day1DataValues)
const AQday2 = getNetWSsettlement(day2DataValues)
const AQday3 = getNetWSsettlement(day3DataValues)
const AQday4 = getNetWSsettlement(day4DataValues)

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

//---------------------------------Take the final consolidated report and separate to two separate objects depending on if we owe AQ or they owe us------------------------------------------//

const finalConsolidatedTradeReport = aggregatedTradeReports(AQday1, AQday2, AQday3, AQday4)

function sendToAQ(consolidatedReport) {
  const movementsToAQ = {}

  for (const coin in consolidatedReport) {
    if (consolidatedReport[coin] < 0) {
      movementsToAQ[coin] = consolidatedReport[coin]
    }
  }
  return movementsToAQ
}

function receiveFromAQ(consolidatedReport) { 
  const movements = {}

  for (const coin in consolidatedReport) {
    if(consolidatedReport[coin] > 0) {
      movements[coin] = consolidatedReport[coin]
    }
  }
  return movements
}

//Set the object returned of the AQ settlements to a variable to display to the user
const aqSend = sendToAQ(finalConsolidatedTradeReport)
const aqReceive = receiveFromAQ(finalConsolidatedTradeReport)

//---------------------------------Display AQ trade values to the sheet------------------------------------------//
//Takes the AQ trade amount and display it to the sheet
function displayAQTradeReports() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AQ - Settlement Values");

  //-------------- Display the values of the settlements that need to be sent to AQ -------------- // 
  const sendKeys = Object.keys(aqSend)
  const sendValues = Object.values(aqSend)
  const sendCell = sheet.getRange("E3")
  const sendHeader1 = sheet.getRange("E2")
  const sendHeader2 = sheet.getRange("F2")

    //Add headers to the amounts to send 
  sendHeader1.setValue("Coin").setFontWeight("bold")
  sendHeader2.setValue("QTY to Send to AQ").setFontWeight("bold")

  sendCell.setValue(finalConsolidatedTradeReport)

  // Set the keys in the left column
  const keysRange = sendCell.offset(0, 0, sendKeys.length, 1);
  keysRange.setValues(sendKeys.map(key => [key]));

  // Set the values in the right column
  const valuesRange = sendCell.offset(0, 1, sendValues.length, 1);
  valuesRange.setValues(sendValues.map(value => [value]));

  //--------------Display the values of the settlements that AQ will send back to us -------------- // 
  const receiveKeys = Object.keys(aqReceive)
  const receiveValues = Object.values(aqReceive)
  const receiveCell = sheet.getRange("H3")
  const receiveHeader1 = sheet.getRange("H2")
  const receiveHeader2 = sheet.getRange("I2")

  receiveHeader1.setValue("Coin").setFontWeight("bold")
  receiveHeader2.setValue("QTY to Receive from AQ").setFontWeight("bold")

  receiveCell.setValue(consolidatedReport)

  // Set the keys in the left column
  const keysRange2 = receiveCell.offset(0, 0, receiveKeys.length, 1);
  keysRange2.setValues(receiveKeys.map(key => [key]));

  // Set the values in the right column
  const valuesRange2 = receiveCell.offset(0, 1, receiveValues.length, 1);
  valuesRange2.setValues(receiveValues.map(value => [value]));
};