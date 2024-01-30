//Function clears the input values
function clearCumberlandInputValues() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cumberland");
  const range = sheet.getRange("A3:G1000")

  //Clear the values in the input field and the results
  range.clearContent()
}

//Clears the settlement 
function clearCumberlandSettlementValues() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cumberland - Settlement Values");
  const range = sheet.getRange("E1:I1000")

  //Clear the values in the input field and the results
  range.clearContent()
}

//Function takes the raw cumberland data and organizes it into a clean object
function formatCumberlandValues() {
  const sheetName = "Cumberland"
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  //Define the range of values that we're looking at 
  const range = sheet.getRange("A3:A500")
  const rawValues = range.getValues()

  //Get clean cumberland data
  let cleanData = []

  //This loop below removes the empty arrays from the data
  for (const item of rawValues) {
    for (const arrayItem of item) {
     if (arrayItem.length !== 0) {
      cleanData.push(arrayItem)
     }
    }
  }

  //Separate the clean data into key value pairs 
  let keyValuesArray = []
  let valuesArrayData = []
  let found = false;

  //Iterate through the clean data and separate out the keys from the values
  for (const item of cleanData) {
    if (item === "Wealthsimple Digital Assets Inc.") {
      found = true;
      continue;
    }

    if (found) {
      valuesArrayData.push(item)
    } else {
      keyValuesArray.push(item)
    }
  }

  //Assign the keys and values to an object
  let finalObj = {}

  //As the values are in order inside keyValuesArray and valuesArrayData, this aligns the columns
  for (let i = 0; i < keyValuesArray.length; i++) {
    finalObj[keyValuesArray[i]] = valuesArrayData[i]
  }

  return finalObj
}

//Leveraging the result as a global variable 
const cleanObj = formatCumberlandValues()

//Take the object and only get the positive values, the values that we need to send to Cumberland
function settlementAmounts(cleanObj) {
  const movements = {}
  
  for (const coin in cleanObj) {
    if (cleanObj[coin] > 0) {
      movements[coin] = cleanObj[coin]
    }
  }
  return movements;
}

//Leveraging the result as a global variable 
const output = settlementAmounts(cleanObj)

//function takes the output of settlementAmounts and displays it on the sheet
function displayOutput() {
  const sheetName = "Cumberland"
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const result = output
  const keys = Object.keys(result);
  const values = Object.values(result);
  const cell = sheet.getRange("F2")
  const header1 = sheet.getRange("F1")
  const header2 = sheet.getRange("G1")

  //Add headers to the amounts to send 
  header1.setValue("Token").setFontWeight("bold")
  header2.setValue("QTY to Send to Cumberland").setFontWeight("bold")

  cell.setValue(result)

  // Set the keys in the left column
  const keysRange = cell.offset(0, 0, keys.length, 1);
  keysRange.setValues(keys.map(key => [key]));

  // Set the values in the right column
  const valuesRange = cell.offset(0, 1, values.length, 1);
  valuesRange.setValues(values.map(value => [value]));
}
