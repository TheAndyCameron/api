"use strict";
const json2xmlparser = require("js2xmlparser");

const knownObjListKeys = {
    "files":["files_url_list","files_title_list","files_size_list"],
    "authors":["authors_user_id_list","authors_timestamp_list","authors_name_list"]
    //TODO Related Cases
    //TODO Related Methods
    //TODO Related Organizations
}


const convertToCSV = function(jsonList){
    if(Array.isArray(jsonList) && jsonList.length > 0){
        //Use the first object to generate the headers, then fill in data.
        var csv = "";
        csv = csv + findColumnHeadingsForStructure(jsonList[0]);
        
        for (var i = 0; i < jsonList.length; i++){
            csv = csv + "\n";
            csv = csv + formatGenericStructure(jsonList[i]);
        }
        
        return csv;
    }else{
        return "";
    }
}


const convertObjectToCSV = function(jsonObj, first, last, thingtype){
    var returnStr = "";
    
    if(first){
        returnStr = returnStr + findColumnHeadingsForStructure(jsonObj) + "\n";
    }
    returnStr = returnStr + formatGenericStructure(jsonObj) + "\n";
    
}

const formatGenericStructure = function(jsonObj){
    var row = "";

    var objKeys = Object.keys(jsonObj);
    for (var k = 0; k < objKeys.length; k++){
        var field = jsonObj[objKeys[k]];
    
        if(field == null){
            row = row + ",";
            continue;
        }
    
        switch(typeof field){
            case 'object':
                //Could be an actual object, or an array
                if (Array.isArray(field)){
                    //if array has no elements, check known list fields for number of fields to skip
                    //if we don't know the field, assume flat list.
                    if (field.length  == 0){
                        var knownKeys = Object.keys(knownObjListKeys);
                        if (knownKeys.indexOf(objKeys[k]) != -1){
                            for (var n = 0; n < knownObjListKeys[objKeys[k]].length -1; n++){
                               row = row + ","; 
                            }
                        }
                        break;
                    }
                    //list of objects or list of primitives?
                    if (typeof field[0] == 'object'){
                        row = row + formatObjectList(field);
                    }else{
                        row = row + formatListStructure(field);
                    }
                }else{
                    //format an Object on it's own... recursion?
                    row = row + formatGenericStructure(field);
                }
                break;
            default:
                row = row + prepareValue(field);
        }
        row = row + ",";
    }
    
    //remove extra comma
    if (row.length !== 0){
        row = row.slice(0,-1);
    }
    
    return row;
}

//Should work so long as all object lists contain at least one of its objects :/
const findColumnHeadingsForStructure = function(jsonObj){
    var headers = "";
    var objKeys = Object.keys(jsonObj);
    for (var k = 0; k < objKeys.length; k++){
        var field = jsonObj[objKeys[k]];
    
        if(field == null){
            headers = headers + objKeys[k] + ",";
            continue;
        }
    
        switch(typeof field){
            case 'object':
                //Could be an actual object, or an array
                if (Array.isArray(field)){
                    //if array has no elements, check in known list keys for headings
                    if (field.length  == 0){
                        var knownKeys = Object.keys(knownObjListKeys);
                        if (knownKeys.indexOf(objKeys[k]) != -1){
                            var listHeaders = knownObjListKeys[objKeys[k]];
                            headers = headers + listHeaders[0];
                            for (var n = 1; n < listHeaders.length; n++){
                                headers = headers + "," + listHeaders[n];
                               
                            }
                        }else{
                            //If we don't know this field, assume flat.
                            headers = headers + objKeys[k]+"_list";
                        }
                        break;
                    }
                    //list of objects or list of primitives?
                    if (typeof field[0] == 'object'){
                        fieldObjKeys = Object.keys(field[0]);
                        for (var fk = 0; fk < fieldObjKeys.length; fk++){
                            if (fk !== 0){
                                headers = headers + ",";
                            }
                            headers = headers + objKeys[k]+"_"+fieldObjKeys[fk]+"_list";
                        }
                        
                    }else{
                        headers = headers + objKeys[k]+"_list";
                    }
                }else{
                    //headers for Object on it's own
                    fieldObjKeys = Object.keys(field);
                    for (var fk = 0; fk < fieldObjKeys.length; fk++){
                        if (fk !== 0){
                            headers = headers + ",";
                        }
                        headers = headers + objKeys[k]+"_"+fieldObjKeys[fk];
                    }
                }
                break;
            default:
                headers = headers + objKeys[k];
        }
        headers = headers + ",";
    }
    //remove extra comma
    if (headers.length !== 0){
        headers = headers.slice(0,-1);
    }
    
    return headers;
}


const formatListStructure = function(list){
	var formattedList = "";
	for (var n = 0; n < list.length; n++){
		if (n != 0){
			formattedList = formattedList + "|";
		}
		formattedList = formattedList + prepareValue(list[n]);
	}
	return escapeBadCharacters(formattedList);
}

const formatObjectList = function(objList){
	var listsData = {};

	//Restructures data from a list of objects to an object containing lists.
	for (var i = 0; i < objList.length; i++){
		//loop through all keys for each object.
		for (var k = 0; k < Object.keys(objList[i]).length; k++){
			var key = Object.keys(objList[i])[k];
			//if the key is not seen before, create a new list under the same name. (should only happen on first object)
			if (!(key in listsData)){
				listsData[key] = [];
			}
			listsData[key].push(objList[i][key]);
		}
	}

	//Build a string containing all required columns in this list of objects.
	var returnString = "";
	for (var i = 0; i < Object.keys(listsData).length; i++){
		returnString = returnString + "," + formatListStructure(listsData[Object.keys(listsData)[i]]);
	}
	//remove leading ","
	returnString = returnString.substring(1);
	return returnString;
}

const formatAuthors = function(authorList){
	return formatObjectList(authorList);
}

const formatLocation = function(location){
	var formattedLocation = prepareValue(location["name"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["address1"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["address2"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["city"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["province"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["country"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["postal_code"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["latitude"]) + ",";
	formattedLocation = formattedLocation + prepareValue(location["longitude"]);
	return formattedLocation;
}


const prepareValue = function(val){
	if (val == null){
		return "";
	}else {
		return escapeBadCharacters(String(val));
	}
}

const escapeBadCharacters = function(val){
	val = val.replace(/\n|\r|\r\n/g, "<br />");
	if (val.indexOf(',') !== -1 || val.indexOf('|') !== -1 || val.indexOf(';') !== -1){
		var val2 = val.replace(/"/g, '""');
		return '"' + val2 + '"';
	}else{
		return val;
	}
}



const convertObjectToXML = function(jsonObj, first, last, thingtype) {
    //const xmlObject = json2xmlparser.parse("case", jsonObj, {declaration:{include:false}});
    const xmlObject = json2xmlparser.parse(thingtype, jsonObj);
    var head = xmlObject.substr(0, xmlObject.indexOf("\n"));
    var data = xmlObject.substr(xmlObject.indexOf("\n")+1);
    var out = "";	
    if(first) {
	out = out + head;
        out = out + "\n" +  "<" + thingtype + "s>" + "\n";	    
    } 

    out = "\t" + out + data + "\n";

    if(last) {
        out = out + "\n" +  "</" + thingtype + "s>";
    }

    return out;
	
}

module.exports = {
    convertToCSV,
    convertObjectToCSV,
    formatGenericStructure,
    findColumnHeadingsForStructure,
    prepareValue,
    formatListStructure,
    formatObjectList,
    convertObjectToXML
}
