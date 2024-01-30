//Clear the workauto sheet values 
function clearWorkAutoInputValues() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("WorkAuto");
  const range1 = sheet.getRange("A2:A500")
  const range2 = sheet.getRange("E3:O1000")

  range1.clearContent()
  range2.clearContent()
};

//Function takes in an array of all the AQ and DV settlement amounts, then it cleans them by assigning the key as the Token symbol and the value as the settlement amount
function turnArrayIntoObject(arr) {
  const cleanObj = {}

  //WorkAuto formats certain coins differently than the trade report, manually accounting for that fact here
  for (const item of arr) {
    if (item.split(" ")[1] === "ATOM_COS") {
      cleanObj["ATOM"] = item.split(" ")[2]
    } 
    else if (item.split(" ")[1] === "ENS2") {
      cleanObj["ENS"] = item.split(" ")[2]
    } 
    else {
    cleanObj[item.split(" ")[1]] = item.split(" ")[2]
    }
  }
  return cleanObj
}

//Takes the data pasted into the sheet and returns 1 main array with two arrays comprising the DV and AQ workauto settlements
function formatWorkAuto(){
  const sheetName = "WorkAuto"
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  const range = sheet.getRange("A3:A100")
  const values = range.getValues()

  //Define final array that will hold the AQ and DV separated list
  let cleanRawData = []
  let aq = []
  let dv = []
  let combinedAQandDVArray = [] //can only return one array, so combining AQ and DV results together

  //Cleans the full values data, only keeps the ones that have a value and removes everything after the comma 
  for (const item of values) {
    //Each cell is kept in it's own array, so have to index into it to access the value itself
    if (item[0].length !== 0) { 
      for (let i = 0; i < item[0].length; i++) {
        if (item[0][i] === ",") {
          cleanRawData.push(item[0].slice(0,i))
        }
      }
    }
  }

  //Check if it's DV or AQ and separate it out 
  for (const item of cleanRawData) {
    if (item.slice(0,2) === "AQ") {
      aq.push(item)
    } else {
      dv.push(item)
    }
  }

  combinedAQandDVArray.push(aq)
  combinedAQandDVArray.push(dv)

  return combinedAQandDVArray;
}

//Assign formatWorkAuto function to a global variable 
//AQ data always at index 0, DV data always at index 1
const cleanCombinedAQandDVArray = formatWorkAuto()
const workautoAQtransfers = turnArrayIntoObject(cleanCombinedAQandDVArray[0])
const workautoDVtransfers = turnArrayIntoObject(cleanCombinedAQandDVArray[1])

//--------------------------------------------------------Get the values of DV and AQ trades that weren't initiated by workauto --------------------------------------------------------//


function getManualTransfersRequiredForDV(){
  //Object containing all the settlement values that need to be initiated manually 
  let manualTransfersRequired = {}
  
  //loop through the total trade report, check if the value was also initiated by workauto, if it wasn't add it to the final object parameter
  for (const item in dvSend) {
    if (!(item in workautoDVtransfers)) {
      manualTransfersRequired[item] = dvSend[item]
    } 
  }
  return manualTransfersRequired
}

//Get the AQ settlements that weren't initiated by workauto
function getManualTransfersRequiredForAQ() {
  //Object containing all the settlement values that need to be initiated manually 
  let manualTransfersRequired = {}

  //loop through the total trade report, check if the value was also initiated by workauto, if it wasn't add it to the final object parameter
  for (const item in aqSend) {
    if (!(item in workautoAQtransfers)) {
      manualTransfersRequired[item] = aqSend[item]
    } 
  }
  return manualTransfersRequired
}

//Storing the values of the manual transfers required as their own variables 
const dvManualTransfersRequired = getManualTransfersRequiredForDV()
const aqManualTransfersRequired = getManualTransfersRequiredForAQ()

Logger.log(dvManualTransfersRequired)
Logger.log(aqManualTransfersRequired)

//--------------------------------------------------------Display the AQ and DV outgoing settlements to the sheet"--------------------------------------------------------//

//Takes all the workauto settlement values and adds them to the sheet
function displayWorkautoTradeReports() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("WorkAuto");
  
  //-----------Display the values of the settlements that need to be sent to AQ that was initiated by WorkAuto------------//
  const sendKeys = Object.keys(aqSend)
  const sendValues = Object.values(aqSend)
  const sendCell = sheet.getRange("E3")
  const sendHeader1 = sheet.getRange("E2")
  const sendHeader2 = sheet.getRange("F2")

  //Add headers to the amounts to send 
  sendHeader1.setValue("Coin").setFontWeight("bold")
  sendHeader2.setValue("QTY").setFontWeight("bold")

  // Set the keys in the left column
  const keysRange = sendCell.offset(0, 0, sendKeys.length, 1);
  keysRange.setValues(sendKeys.map(key => [key]));

  // Set the values in the right column
  const valuesRange = sendCell.offset(0, 1, sendValues.length, 1);
  valuesRange.setValues(sendValues.map(value => [value]));

  //----------Display the values of the settlements that need to be sent to DV that was initiated by WorkAuto------------//
  const outgoingDVkeys = Object.keys(dvSend)
  const outgoingDVvalues = Object.values(dvSend)
  const sendDVCell = sheet.getRange("H3")
  const sendDVheader1 = sheet.getRange("H2")
  const sendDVheader2 = sheet.getRange("I2")

  //Add headers to the amounts to send 
  sendDVheader1.setValue("Coin").setFontWeight("bold")
  sendDVheader2.setValue("QTY").setFontWeight("bold")

  // Set the keys in the left column
  const dvKeysRange = sendDVCell.offset(0, 0, outgoingDVkeys.length, 1);
  dvKeysRange.setValues(outgoingDVkeys.map(key => [key]));

  // Set the values in the right column
  const dvValuesRange = sendDVCell.offset(0, 1, outgoingDVvalues.length, 1);
  dvValuesRange.setValues(outgoingDVvalues.map(value => [value]));

  ///----------Display the values of the AQ transfers that weren't initiated by WorkAuto------------//
  const aqManualKeys = Object.keys(aqManualTransfersRequired)
  const sendAQManualValues = Object.values(aqManualTransfersRequired)
  const sendAQManualCell = sheet.getRange("K3")
  
  // //Add headers to the amounts to send 
  sheet.getRange("K2").setValue("Coin").setFontWeight("bold")
  sheet.getRange("L2").setValue("QTY").setFontWeight("bold")

  // Set the keys in the left column
  const aqManualKeysRange = sendAQManualCell.offset(0, 0, sendKeys.length, 1);
  aqManualKeysRange.setValues(aqManualKeys.map(key => [key]));

  // Set the values in the right column
  const aqManualvaluesRange = sendAQManualCell.offset(0, 1, sendValues.length, 1);
  aqManualvaluesRange.setValues(sendAQManualValues.map(value => [value]));
}